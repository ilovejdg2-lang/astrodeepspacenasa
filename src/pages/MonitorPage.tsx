import { AlertTriangle, Brain, ClipboardPlus, Heart, Package, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { MeasurementKind } from '../../shared/types'
import { canRegisterSymptom, canUseInventory } from '../domain/access'
import { CREW, crewDuty, crewPlace } from '../domain/crew'
import { ageLabel, formatValue, kindLabel } from '../domain/format'
import { crewPosture, isReliable, latestMeasurement, measurementQuality, vitalTrends } from '../domain/selectors'
import { CarouselStrip } from '../components/CarouselStrip'
import { CrewHelmet } from '../components/CrewHelmet'
import { useLocale } from '../i18n'
import { HeartWave } from '../components/HeartWave'
import { Badge, Field, Modal } from '../components/ui'
import { roleLabel } from '../platform/copy'
import { useWorkspaceRole, getWorkspaceMode } from '../platform/workspace'
import { useApp } from '../state/store'
import { systemText } from '../systemText'

const SYMPTOMS = ['cansancio', 'mareo', 'cefalea', 'nausea', 'otro'] as const

const SYMPTOM_LABEL = {
  en: { cansancio: 'Fatigue', mareo: 'Dizziness', cefalea: 'Headache', nausea: 'Nausea', otro: 'Other' },
  es: { cansancio: 'Cansancio', mareo: 'Mareo', cefalea: 'Dolor de cabeza', nausea: 'Náusea', otro: 'Otro' },
} as const

export function MonitorPage({
  embedded = false,
  content = 'all',
}: {
  embedded?: boolean
  content?: 'all' | 'vitals' | 'actions'
} = {}) {
  const { crewId } = useParams()
  const navigate = useNavigate()
  const { lang } = useLocale()
  const { state, dispatch } = useApp()
  const workspaceRole = useWorkspaceRole()
  const mode = getWorkspaceMode()
  const en = lang === 'en'
  const crew = CREW.find((item) => item.id === (crewId ?? state.selectedCrewId)) ?? CREW[0]
  const posture = crew ? crewPosture(state, crew.id) : null
  const hr = crew ? latestMeasurement(state, crew.id, 'heart_rate') : null
  const trusted = hr ? isReliable(hr, state.clock.simulatedAt) : false
  const symptoms = useMemo(() => crew ? state.symptoms.filter((item) => item.crewId === crew.id) : [], [crew, state.symptoms])
  const alerts = crew ? state.alerts.filter((item) => item.crewId === crew.id && item.status !== 'closed') : []
  const unit = en ? 'bpm' : 'lpm'
  const baseline = crew ? `${crew.baseline.hrMin}-${crew.baseline.hrMax} ${unit}` : ''
  const hrAbove = Boolean(crew && hr && hr.value > crew.baseline.hrMax)
  const hrText = hr ? `${formatValue('heart_rate', hr.value)} ${unit}` : null
  const shellClass = embedded ? 'monitor-page monitor-embedded' : 'page monitor-page'

  useEffect(() => {
    if (crew && crew.id !== state.selectedCrewId) dispatch({ type: 'selectCrew', crewId: crew.id })
  }, [crew, state.selectedCrewId, dispatch])

  useEffect(() => {
    if (embedded) return
    document.title = en ? `HELIOS · Monitoring ${crew?.name ?? ''}` : `HELIOS · Monitoreo de ${crew?.name ?? ''}`
  }, [crew, en, embedded])

  const nextSteps = useMemo(() => {
    if (!crew || !posture) return [] as string[]
    const quality = measurementQuality(state, crew.id)
    const trend = vitalTrends(state, crew.id)
    const steps: string[] = []
    if (hrAbove && hrText) {
      steps.push(
        en
          ? `HR ${hrText} above baseline ${baseline}${trend.deltaHr != null ? ` (Δ ${trend.deltaHr} ${unit})` : ''}.`
          : `FC ${hrText} sobre línea base ${baseline}${trend.deltaHr != null ? ` (Δ ${trend.deltaHr} ${unit})` : ''}.`,
      )
    } else {
      steps.push(posture.summary)
    }
    if (quality.status !== 'valid' || !quality.restControl) {
      steps.push(
        en
          ? 'Resting control missing or signal not ready for clinical certainty.'
          : 'Falta control en reposo o la señal no alcanza certeza clínica.',
      )
    }
    const latestSymptom = symptoms[0]
    if (latestSymptom) {
      const words = latestSymptom.symptoms
        .map((id) => SYMPTOM_LABEL[lang][id as keyof typeof SYMPTOM_LABEL.en] ?? id)
        .join(', ')
      steps.push(en ? `Self-report: ${words || 'note'}.` : `Autorreporte: ${words || 'nota'}.`)
    }
    if (alerts.length) {
      steps.push(en ? `${alerts.length} open alert(s) for this person.` : `${alerts.length} alerta(s) abierta(s) para esta persona.`)
    }
    return steps.slice(0, 4)
  }, [alerts.length, baseline, crew, en, hrAbove, hrText, lang, posture, state, symptoms, unit])

  const caps = useMemo(() => {
    const ws = workspaceRole
    const sim = state.role
    const care = ws === 'medic' || sim === 'medical'
    const lead = ws === 'chief' || sim === 'ops'
    const flyer = ws === 'crew' || sim === 'astronaut'
    const psych = ws === 'psychologist'
    return {
      symptoms: canRegisterSymptom(sim) || care || flyer || lead,
      repeat: care || lead,
      analysis: care || lead,
      inventory: canUseInventory(sim) || care,
      alerts: true,
      psychOnly: psych && !care && !lead,
    }
  }, [state.role, workspaceRole])

  if (!crew || !posture) {
    return (
      <div className={shellClass}>
        <p className="muted">{en ? 'No crew member available.' : 'No hay tripulante disponible.'}</p>
      </div>
    )
  }

  return (
    <div className={shellClass}>
      {content !== 'actions' && !embedded && crewId ? (
        <Link className="monitor-back-link" to="/app/tripulacion">{en ? '← Back to crew' : '← Volver a tripulación'}</Link>
      ) : null}
      {content !== 'actions' ? (
        <>
          <CarouselStrip className="crew-carousel" trackClassName="crew-picker" label={en ? 'Crew' : 'Tripulación'}>
            {CREW.map((item) => (
              <button
                key={item.id}
                type="button"
                className="crew-pick"
                data-testid={`crew-${item.id}`}
                aria-pressed={item.id === crew.id}
                aria-label={
                  item.id === crew.id
                    ? en
                      ? `${item.name}, selected`
                      : `${item.name}, seleccionada`
                    : item.name
                }
                onClick={() => {
                  dispatch({ type: 'selectCrew', crewId: item.id })
                  if (!embedded) navigate(`/app/tripulacion/${item.id}`)
                }}
              >
                <CrewHelmet id={item.id} name={item.name} selected={item.id === crew.id} />
                <span aria-hidden="true">{item.name.split(' ')[0]}</span>
              </button>
            ))}
          </CarouselStrip>

          <header className="monitor-id">
            <div className="monitor-avatar">
              <CrewHelmet id={crew.id} name={crew.name} selected />
            </div>
            <p className="monitor-kicker">{embedded ? (en ? 'Mission center' : 'Centro') : (en ? 'Crew monitoring' : 'Monitoreo del tripulante')}</p>
            <h1 className="monitor-name">{crew.name}</h1>
            <p className="monitor-meta">{crewDuty(crew, lang)} · {crewPlace(crew, lang)}</p>
            <p className="monitor-summary">
              {hrAbove && hrText
                ? en
                  ? `Heart rate (${hrText}) is above baseline (${baseline}).`
                  : `La frecuencia cardíaca (${hrText}) está por encima de su línea base (${baseline}).`
                : posture.summary}
            </p>
          </header>
        </>
      ) : null}

      {content !== 'actions' ? (
        <section className="monitor-card" aria-label={en ? 'Current reading' : 'Lectura actual'}>
        <div className="monitor-card-hr">
          <div className="hr-hero">
            <Heart aria-hidden="true" size={36} strokeWidth={2.25} fill="currentColor" />
            <p className="hr-value" aria-live="off">
              {hr ? formatValue('heart_rate', hr.value) : '—'}
              <span>{unit}</span>
            </p>
          </div>
          <HeartWave />
          <div className="hr-foot">
            <p>{trusted ? (en ? 'Use this reading.' : 'Usá esta lectura.') : (en ? 'Do not treat this number as current.' : 'No tomes esta cifra como actual.')}</p>
            {hr ? <p className="muted">{en ? `Signal ${hr.signalQuality}/100 · ${ageLabel(state.clock.simulatedAt, hr.measuredAt)}` : `Señal ${hr.signalQuality}/100 · ${ageLabel(state.clock.simulatedAt, hr.measuredAt)}`}</p> : null}
          </div>
        </div>
        <div className="monitor-card-trust">
          <h2>{en ? 'Other vitals' : 'Otros signos'}</h2>
          <dl className="trust-metrics">
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="spo2" />
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="temperature" />
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="sleep_hours" />
          </dl>
        </div>
        </section>
      ) : null}

      {content !== 'vitals' ? (
        <section className="monitor-actions panel" aria-label={en ? 'Monitor actions' : 'Acciones del monitor'}>
        <div className="monitor-actions-head">
          <div>
            <h2>{en ? 'What you can do now' : 'Qué puedes hacer ahora'}</h2>
            <p className="monitor-actions-role">
              {en ? 'Role access' : 'Acceso por rol'}:{' '}
              <strong>{workspaceRole ? roleLabel(workspaceRole, en) : roleLabel(state.role === 'medical' ? 'medic' : state.role === 'astronaut' ? 'crew' : 'chief', en)}</strong>
              {' · '}
              {mode === 'authorized' ? (en ? 'authorized' : 'autorizado') : (en ? 'demo explore' : 'demo exploración')}
            </p>
          </div>
          <Badge tone={posture.observed === 'change' ? 'amber' : posture.observed === 'stable' ? 'ok' : 'bad'}>
            {posture.observed === 'change' ? (en ? 'Observed change' : 'Cambio observado') : posture.observed === 'stable' ? (en ? 'Within baseline' : 'Dentro de línea base') : (en ? 'No recent evaluation' : 'Sin evaluación reciente')}
          </Badge>
        </div>

        <ol className="monitor-next-steps">
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {caps.psychOnly ? (
          <p className="muted">
            {en
              ? 'Psychologist view: use Wellbeing for granted emotional follow-up. Clinical vitals actions stay with medic / chief.'
              : 'Vista psicología: usá Bienestar para seguimiento emocional concedido. Las acciones clínicas quedan en médica / jefatura.'}
          </p>
        ) : null}

        <div className="monitor-action-grid">
          {caps.alerts && alerts.length > 0 ? (
            <Link className="btn btn-primary" to="/app/alertas">
              <AlertTriangle aria-hidden="true" size={18} strokeWidth={1.75} />
              {en ? `Open alerts (${alerts.length})` : `Ver alertas (${alerts.length})`}
            </Link>
          ) : null}
          {caps.symptoms ? <SymptomButton /> : null}
          {caps.repeat ? <RepeatButton /> : null}
          {caps.analysis ? (
            <Link className="btn btn-primary" to="/app/analisis">
              <Brain aria-hidden="true" size={18} strokeWidth={1.75} />
              {en ? 'Open analysis' : 'Abrir análisis'}
            </Link>
          ) : null}
          {caps.inventory ? (
            <Link className="btn" to="/app/recursos">
              <Package aria-hidden="true" size={18} strokeWidth={1.75} />
              {en ? 'Inventory' : 'Inventario'}
            </Link>
          ) : null}
          {caps.psychOnly ? (
            <Link className="btn btn-primary" to="/app/centro">
              {en ? 'Open wellbeing' : 'Abrir bienestar'}
            </Link>
          ) : null}
          <Link className="btn" to="/app/mi-salud">
            {en ? 'My Health' : 'Mi salud'}
          </Link>
        </div>

        {symptoms.length > 0 ? (
          <ul className="monitor-symptom-list">
            {symptoms.map((item) => (
              <li key={item.id}>
                {item.symptoms.map((id) => SYMPTOM_LABEL[lang][id as keyof typeof SYMPTOM_LABEL.en] ?? id).join(', ') || (en ? 'Note' : 'Nota')}
                {' — '}
                {item.id === 'sym-elena-seed' && item.note
                  ? systemText(item.note, lang)
                  : item.note || (en ? 'no note' : 'sin nota')}
                {' · '}
                {ageLabel(state.clock.simulatedAt, item.reportedAt)}
              </li>
            ))}
          </ul>
        ) : null}
        </section>
      ) : null}
    </div>
  )
}

function Vital({ crewId, kind, stateNow }: { crewId: (typeof CREW)[number]['id']; kind: MeasurementKind; stateNow: number }) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state } = useApp()
  const reading = latestMeasurement(state, crewId, kind)
  const trusted = reading ? isReliable(reading, stateNow) : false
  const unit = kind === 'spo2' ? '%' : kind === 'temperature' ? 'C' : 'h'
  return (
    <div className="trust-metric">
      <dt>{kindLabel(kind)}</dt>
      <dd>
        {reading ? (
          <>
            <strong>{formatValue(kind, reading.value)}{kind === 'spo2' ? '%' : unit === 'C' ? 'C' : 'h'}</strong>
            <span>{trusted ? (en ? 'Current' : 'Vigente') : (en ? 'Not current' : 'No vigente')}</span>
          </>
        ) : (
          <>
            <strong>—</strong>
            <span>{en ? 'No reading' : 'Sin lectura'}</span>
          </>
        )}
      </dd>
    </div>
  )
}

function SymptomButton() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const labels = SYMPTOM_LABEL[lang]
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const key = useRef('')
  return (
    <>
      <button className="btn btn-primary" type="button" data-testid="open-symptom" onClick={() => { key.current = `sym-${state.seq}-${state.symptoms.length}`; setOpen(true) }}>
        <ClipboardPlus aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Record symptoms' : 'Registrar síntomas'}
      </button>
      <Modal open={open} title={en ? 'Record how they feel' : 'Registrar cómo se siente'} description={en ? 'The text is simulated clinical data. It is not an order for the system.' : 'El texto es un dato clínico simulado. No es una orden para el sistema.'} onClose={() => setOpen(false)}>
        {SYMPTOMS.map((id) => (
          <label key={id} className="check">
            <input data-testid={`symptom-${id}`} type="checkbox" checked={picked.includes(id)} onChange={() => setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />
            {labels[id]}
          </label>
        ))}
        <Field id="symptom-note" label={en ? 'Note' : 'Nota'} error={error}>
          <textarea id="symptom-note" data-testid="symptom-note" maxLength={2000} value={note} aria-invalid={Boolean(error)} aria-describedby={error ? 'symptom-note-error' : undefined} onChange={(event) => setNote(event.target.value)} />
        </Field>
        <button className="btn btn-primary" type="button" data-testid="save-symptom" onClick={() => {
          if (picked.length === 0 && note.trim() === '') { setError(en ? 'Enter at least one symptom or a note.' : 'Indicá al menos un síntoma o una nota.'); return }
          if (picked.includes('otro') && note.trim() === '') { setError(en ? 'If you choose Other, the note is required.' : 'Si elegís Otro, la nota es obligatoria.'); return }
          dispatch({ type: 'addSymptom', crewId: state.selectedCrewId, symptoms: picked, note, idempotencyKey: key.current })
          setOpen(false); setPicked([]); setNote(''); setError('')
        }}>{en ? 'Save report' : 'Guardar reporte'}</button>
      </Modal>
    </>
  )
}

function RepeatButton() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [atRest, setAtRest] = useState(false)
  const key = useRef('')
  return (
    <>
      <button className="btn" type="button" data-testid="open-repeat" onClick={() => { key.current = `rep-${state.seq}`; setOpen(true) }}><RefreshCw aria-hidden="true" size={18} strokeWidth={1.75} /> {en ? 'Repeat measurement' : 'Repetir medición'}</button>
      <Modal open={open} title={en ? 'Repeat heart rate' : 'Repetir frecuencia cardíaca'} description={en ? 'If the scenario has no reading, a value is not invented.' : 'Si el escenario no tiene una lectura, no se inventa un valor.'} onClose={() => setOpen(false)}>
        <label className="check"><input data-testid="rest-check" type="checkbox" checked={atRest} onChange={(event) => setAtRest(event.target.checked)} /> {en ? 'The person is at rest' : 'La persona está en reposo'}</label>
        <button className="btn btn-primary" type="button" data-testid="save-repeat" onClick={() => { dispatch({ type: 'repeatMeasurement', crewId: state.selectedCrewId, idempotencyKey: key.current, atRest }); setOpen(false) }}>{en ? 'Record' : 'Registrar'}</button>
      </Modal>
    </>
  )
}
