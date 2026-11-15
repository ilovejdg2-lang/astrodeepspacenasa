import * as Switch from '@radix-ui/react-switch'
import { useEffect, useRef, useState } from 'react'
import type { AppState, CrewId } from '../../shared/types'
import { askSpaceModel } from '../ai/client'
import { buildSpaceContext } from '../ai/spaceContext'
import { canReadMySpace } from '../domain/access'
import { CREW, crewById } from '../domain/crew'
import { SIMULATED_PINS, simulatedPinMatches } from '../domain/spaceAccess'
import { answerSpace, applySpaceProposal, openSpace } from '../domain/spaceEngine'
import { spacePreview } from '../domain/spacePreview'
import { readSpace, writeSpace, type SpaceDataUse, type SpaceRecord, type SpaceShareLevel } from '../persistence/space'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import { Field } from '../components/ui'

const QUICK = ['Estoy cansada', 'Necesito descansar', 'Quiero hablar con alguien', 'Me siento mal ahora'] as const

const LEVELS: { id: SpaceShareLevel; label: string }[] = [
  { id: 'solo_yo', label: 'Solo yo' },
  { id: 'generica', label: 'Genérica' },
  { id: 'medico', label: 'Médico de vuelo' },
  { id: 'equipo', label: 'Equipo' },
]

const SWITCHES: { id: keyof SpaceDataUse; label: string }[] = [
  { id: 'sleep', label: 'Sueño' },
  { id: 'pulse', label: 'Pulso' },
  { id: 'symptoms', label: 'Síntomas' },
]

export function MySpacePage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch, authenticatedCrewId, unlockSpace } = useApp()
  const allowed = canReadMySpace(state.role, authenticatedCrewId, state.sessionCrewId)
  const [record, setRecord] = useState<SpaceRecord | null>(null)
  const [draft, setDraft] = useState('')
  const [level, setLevel] = useState<SpaceShareLevel>('generica')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const draftRef = useRef<HTMLTextAreaElement>(null)
  const recordRef = useRef<SpaceRecord | null>(null)
  recordRef.current = record

  useEffect(() => {
    if (!allowed) {
      setRecord(null)
      return
    }
    let active = true
    readSpace(state.role, authenticatedCrewId, state.sessionCrewId)
      .then(async (result) => {
        if (!active || !result.ok) return
        if (result.record.messages.some((item) => item.role === 'assistant')) {
          setRecord(result.record)
          return
        }
        const opening = openSpace(state, state.sessionCrewId, result.record.dataUse)
        const next = {
          ...result.record,
          messages: [
            ...result.record.messages,
            { id: `space-open-${state.clock.simulatedAt}`, role: 'assistant' as const, text: opening, at: state.clock.simulatedAt },
          ],
        }
        const saved = await writeSpace(state.role, authenticatedCrewId, state.sessionCrewId, next)
        if (!active) return
        setRecord(saved.ok ? next : result.record)
      })
      .catch(() => {
        if (active) setNote('No se pudo abrir tu espacio en este navegador.')
      })
    return () => {
      active = false
    }
  }, [allowed, authenticatedCrewId, state.role, state.sessionCrewId])

  const sessionCrew = crewById(state.sessionCrewId)
  const firstName = sessionCrew.name.split(' ')[0] ?? sessionCrew.name
  const preview = spacePreview(firstName, level, draft)
  const received = sharedSymptoms(state, state.sessionCrewId)

  async function commit(next: SpaceRecord) {
    const saved = await writeSpace(state.role, authenticatedCrewId, state.sessionCrewId, next)
    if (!saved.ok) {
      setNote('Este rol simulado no puede guardar en este espacio.')
      return
    }
    setRecord(next)
  }

  function appendMessage(text: string) {
    const current = recordRef.current
    if (!current) return
    const trimmed = text.trim()
    if (!trimmed) return
    const turn = answerSpace(state, state.sessionCrewId, current.dataUse, trimmed)
    const at = state.clock.simulatedAt
    const base = current.messages.length
    const next: SpaceRecord = {
      ...current,
      messages: [
        ...current.messages,
        { id: `space-msg-${at}-${base}`, role: 'user', text: trimmed, at },
        { id: `space-msg-${at}-${base + 1}`, role: 'assistant', text: turn.assistantText, at, source: 'local_engine' },
      ],
    }
    setDraft(trimmed)
    setLevel(turn.suggestedLevel)
    if (turn.requiereHumanoAhora) {
      dispatch({
        type: 'raiseSpaceAlert',
        crewId: state.sessionCrewId,
        categories: turn.categories,
        idempotencyKey: `space-escalate-${state.sessionCrewId}-${at}-${base}`,
      })
    }
    void commit(next)
    if (turn.requiereHumanoAhora) return
    const assistantId = `space-msg-${at}-${base + 1}`
    const controller = new AbortController()
    void askSpaceModel(buildSpaceContext(state, state.sessionCrewId, current.dataUse, trimmed), controller.signal).then((response) => {
      if (!response.ok) return
      const applied = applySpaceProposal(turn, response.proposal)
      if (applied.source !== 'model') return
      const latest = recordRef.current
      if (!latest?.messages.some((item) => item.id === assistantId)) return
      setLevel(applied.level)
      void commit({
        ...latest,
        messages: latest.messages.map((item) => item.id === assistantId ? { ...item, text: applied.text, source: 'model' } : item),
      })
    })
  }

  function saveRequest(status: 'mine' | 'sent') {
    const current = recordRef.current
    const trimmed = draft.trim()
    if (!current || !trimmed) return
    if (status === 'sent') {
      if (level === 'solo_yo') return
      dispatch({
        type: 'sendSpaceRequest',
        crewId: state.sessionCrewId,
        level,
        text: trimmed,
        idempotencyKey: `space-send-${state.sessionCrewId}-${state.clock.simulatedAt}-${current.requests.length}`,
      })
    }
    const shown = spacePreview(firstName, level, trimmed)
    const withMessage: SpaceRecord = current.messages.some((item) => item.role === 'user' && item.text === trimmed)
      ? current
      : {
          ...current,
          messages: [
            ...current.messages,
            { id: `space-msg-${state.clock.simulatedAt}-${current.messages.length}`, role: 'user', text: trimmed, at: state.clock.simulatedAt },
          ],
        }
    const next: SpaceRecord = {
      ...withMessage,
      requests: [
        ...withMessage.requests,
        {
          id: `space-req-${state.clock.simulatedAt}-${withMessage.requests.length}`,
          preview: shown.teamLine ?? trimmed,
          shareLevel: level,
          status,
          at: state.clock.simulatedAt,
        },
      ],
    }
    setNote(status === 'sent' ? 'La solicitud quedó en el panel del equipo, con el nivel que elegiste. La conversación sigue en este espacio.' : 'Guardada solo para ti.')
    void commit(next)
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">{en ? 'Emotional wellbeing' : 'Bienestar emocional'}</p>
          <h1>{en ? 'My space · Private' : 'Mi espacio · Privado'}</h1>
          <p className="lede">
            {en
              ? 'A private conversation with Quirón Bot. Review, edit, and authorize a summary before sharing it. The full conversation does not appear on the general panel.'
              : 'Conversación privada con Quirón Bot. Revisá, editá y autorizá un resumen antes de compartirlo. La conversación completa no aparece en el panel general.'}
          </p>
        </div>
      </header>
      {state.role !== 'astronaut' ? (
        <p className="callout">{en ? 'This simulated role does not open this module. Hiding the card would not be enough, so the read is not even requested.' : 'Con el rol simulado actual este módulo no se consulta. Ocultar la tarjeta no sería suficiente, así que la lectura ni siquiera se pide.'}</p>
      ) : null}
      {state.role === 'astronaut' && !allowed ? <PinGate name={sessionCrew.name} pin={pin} pinError={pinError} onPin={setPin} onClearError={() => setPinError('')} onSubmit={() => {
        if (!simulatedPinMatches(state.sessionCrewId, pin)) {
          setPinError('Ese PIN simulado no corresponde a esta persona.')
          return
        }
        setPinError('')
        unlockSpace(state.sessionCrewId)
      }} /> : null}
      {allowed && record ? (
        <div className="stack">
          <details className="fold">
            <summary>{en ? 'What cannot stay only here' : 'Qué no puede quedarse solo aquí'}</summary>
            <p>{en ? 'Send publishes the preview for the level you choose. Generic does not include the reason or the data. Flight surgeon and Team include the text. The conversation stays here. If you write a protocol emergency, the local engine creates an alert: chest pain, fainting, trouble breathing, confusion, thoughts of harming yourself or others, and a risk to the ship.' : 'Enviar publica la vista previa del nivel que elijas. Genérica no incluye el motivo ni los datos. Médico de vuelo y Equipo incluyen el texto. La conversación se queda aquí. Si escribes una urgencia del protocolo, el motor local crea una alerta en el Centro de alertas: dolor en el pecho, desmayo, dificultad para respirar, confusión, pensamientos de hacerse daño o de dañar a otros, y un riesgo para la nave.'}</p>
          </details>
          <section className="panel">
            <h2>{en ? 'Data I use' : 'Datos que uso'}</h2>
            <div className="stack">
              {(en ? [
                { id: 'sleep' as const, label: 'Sleep' },
                { id: 'pulse' as const, label: 'Pulse' },
                { id: 'symptoms' as const, label: 'Symptoms' },
              ] : SWITCHES).map((item) => (
                <div key={item.id} className="switch-row">
                  <label htmlFor={`space-use-${item.id}`}>{item.label}</label>
                  <Switch.Root
                    id={`space-use-${item.id}`}
                    className="switch"
                    checked={record.dataUse[item.id]}
                    onCheckedChange={(checked) => {
                      const current = recordRef.current
                      if (!current) return
                      void commit({ ...current, dataUse: { ...current.dataUse, [item.id]: checked } })
                    }}
                  >
                    <Switch.Thumb className="switch-thumb" />
                  </Switch.Root>
                </div>
              ))}
            </div>
          </section>
          <p className="callout" data-testid="space-received">
            {received.length > 0
              ? `Esto ya lo recibió el equipo: ${received.join(', ')}.`
              : 'El equipo no tiene un autorreporte tuyo en este escenario.'}
            {' '}Lo que escribas aquí es privado hasta que tú lo envíes.
          </p>
          <section className="panel">
            <h2>{en ? 'How you feel' : 'Cómo te sientes'}</h2>
            <div className="chat-log" aria-live="polite">
              {record.messages.length === 0 ? <p className="muted">{en ? 'There are no messages in your space yet.' : 'Todavía no hay mensajes en tu espacio.'}</p> : null}
              {record.messages.map((message) => (
                <article key={message.id} className={message.role === 'user' ? 'bubble user' : 'bubble'}>
                  {message.role === 'assistant' ? <span className="muted">{message.source === 'model' ? (en ? 'Model' : 'Modelo') : (en ? 'Local engine' : 'Motor local')}</span> : null}
                  <p>{message.text}</p>
                </article>
              ))}
            </div>
            {(() => {
              const last = record.messages.at(-1)?.text ?? ''
              return last.includes('no debe quedarse solo entre tú y yo') || last.includes('should not stay only between you and me')
            })() ? (
              <div className="row" data-testid="space-escalation">
                <button className="btn btn-primary" type="button" onClick={() => { setLevel('medico'); setDraft(en ? 'I need the flight surgeon now' : 'Necesito al médico de vuelo ahora') }}>{en ? 'Flight surgeon' : 'Médico de vuelo'}</button>
                <button className="btn" type="button" onClick={() => { setLevel('equipo'); setDraft(en ? 'I need a crewmate now' : 'Necesito a un compañero ahora') }}>{en ? 'Crewmate' : 'Compañero'}</button>
              </div>
            ) : null}
            <div className="chips" role="group" aria-label={en ? 'Quick replies' : 'Respuestas rápidas'}>
              {(en ? ['I am tired', 'I need to rest', 'I want to talk to someone', 'I feel unwell now'] as const : QUICK).map((text) => (
                <button key={text} type="button" className="chip" onClick={() => appendMessage(text)}>{text}</button>
              ))}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); appendMessage(draft) }}>
              <Field id="space-draft" label={en ? 'Request text' : 'Texto de la solicitud'}>
                <textarea id="space-draft" ref={draftRef} data-testid="space-draft" maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} />
              </Field>
              <button className="btn" type="submit">{en ? 'Note it' : 'Anotar'}</button>
            </form>
          </section>
          <section className="panel">
            <h2>{en ? 'Request' : 'Solicitud'}</h2>
            <p className="muted">{en ? 'Preview of what the team would see.' : 'Vista previa de lo que vería el equipo.'}</p>
            <p data-testid="space-preview">{draft.trim() ? preview.cardText : 'Escribe algo para armar la solicitud.'}</p>
            <div className="chips" role="group" aria-label={en ? 'Sharing level' : 'Nivel de compartir'}>
              {(en ? [
                { id: 'solo_yo' as const, label: 'Only me' },
                { id: 'generica' as const, label: 'Generic' },
                { id: 'medico' as const, label: 'Flight surgeon' },
                { id: 'equipo' as const, label: 'Team' },
              ] : LEVELS).map((item) => (
                <button key={item.id} type="button" className="chip" aria-pressed={level === item.id} onClick={() => setLevel(item.id)}>{item.label}</button>
              ))}
            </div>
            <div className="row">
              <button className="btn btn-primary" type="button" data-testid="space-send" disabled={!draft.trim() || level === 'solo_yo'} onClick={() => saveRequest('sent')}>{en ? 'Send' : 'Enviar'}</button>
              <button className="btn" type="button" onClick={() => draftRef.current?.focus()}>{en ? 'Edit' : 'Editar'}</button>
              <button className="btn" type="button" data-testid="space-keep" disabled={!draft.trim()} onClick={() => saveRequest('mine')}>{en ? 'Save only for me' : 'Guardar solo para mí'}</button>
            </div>
            {level === 'solo_yo' ? <p className="muted">Con Solo yo, Enviar queda deshabilitado. Usa Guardar solo para mí.</p> : null}
            {note ? <p className="callout" data-testid="space-note">{note}</p> : null}
            {record.requests.length > 0 ? (
              <ul className="timeline">
                {record.requests.slice().reverse().map((item) => (
                  <li key={item.id}><span className="dot" aria-hidden="true" /><span>{item.status === 'sent' ? 'Enviar' : 'Solo para mí'} · {item.preview}</span></li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function sharedSymptoms(state: AppState, crewId: CrewId): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const report of state.symptoms) {
    if (report.crewId !== crewId) continue
    for (const symptom of report.symptoms) {
      if (seen.has(symptom)) continue
      seen.add(symptom)
      labels.push(symptom)
    }
  }
  return labels
}

function PinGate({
  name,
  pin,
  pinError,
  onPin,
  onClearError,
  onSubmit,
}: {
  name: string
  pin: string
  pinError: string
  onPin: (value: string) => void
  onClearError: () => void
  onSubmit: () => void
}) {
  const pinHint = CREW.map((crew) => `${crew.name.split(' ')[0]} ${SIMULATED_PINS[crew.id]}`).join(' · ')
  return (
    <section className="callout">
      <strong>Acceso simulado a Mi espacio</strong>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit() }}>
        <p>Este PIN es simulado. Sirve solo para la demostración y no protege los datos. Quien controla el navegador puede leer IndexedDB.</p>
        <p className="muted">Códigos de demostración: {pinHint}.</p>
        <Field id="space-page-pin" label={`PIN simulado de ${name}`} error={pinError}>
          <input
            id="space-page-pin"
            data-testid="space-page-pin"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            aria-invalid={Boolean(pinError)}
            aria-describedby={pinError ? 'space-page-pin-error' : undefined}
            onChange={(event) => {
              onPin(event.target.value)
              if (pinError) onClearError()
            }}
          />
        </Field>
        <button className="btn btn-primary" type="submit">Abrir sesión simulada</button>
      </form>
    </section>
  )
}
