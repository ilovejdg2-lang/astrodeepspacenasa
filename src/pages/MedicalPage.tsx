import { Clock, FileText, Inbox, Send } from 'lucide-react'
import { useState } from 'react'
import { CREW } from '../domain/crew'
import { ageLabel, auditActionLabel, formatMission, roleLabel } from '../domain/format'
import { latestMeasurement } from '../domain/selectors'
import { answerLocal } from '../domain/analysis'
import { canManageComms } from '../domain/access'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import { SpaceRequests } from '../components/SpaceRequests'
import { Badge, Field } from '../components/ui'

const ORDER = ['draft', 'queued', 'sent', 'received'] as const

export function MedicalPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, dispatch } = useApp()
  const allowed = canManageComms(state.role)
  const episode = state.episodes.find((item) => item.id === state.selectedEpisodeId) ?? state.episodes.find((item) => item.status !== 'closed')
  const [subject, setSubject] = useState(episode ? `Revisión · ${episode.title}` : 'Revisión de tripulación')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const keyBase = `comm-${state.communications.length}`
  const latestPulse = latestMeasurement(state, state.selectedCrewId, 'heart_rate')

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">{en ? 'Medical team' : 'Equipo médico'}</p>
          <h1>{en ? 'Specialized care' : 'Atención especializada'}</h1>
          <p className="lede">
            {en
              ? 'Pre-flight: review readiness. On board: follow episodes. Post-mission: progress and reviews. Draft, queued, sent, and received are different states. The role is simulated in this browser.'
              : 'Preembarque: revisar preparación. A bordo: atender episodios. Posmisión: evolución y revisiones. Borrador, cola, enviado y recibido son estados distintos. El rol es simulado en este navegador.'}
          </p>
        </div>
        <div className="stack">
          <Badge tone={state.link === 'down' ? 'bad' : 'ok'}>{state.link === 'down' ? 'Sin enlace' : state.link === 'delayed' ? 'Enlace con demora' : 'Enlace en línea'}</Badge>
          <p className="muted age-line"><Clock aria-hidden="true" size={16} strokeWidth={1.75} /> Último pulso seleccionado: {latestPulse ? `${ageLabel(state.clock.simulatedAt, latestPulse.measuredAt)} · recibido ${ageLabel(state.clock.simulatedAt, latestPulse.receivedAt)}` : 'sin lectura'}.</p>
        </div>
      </header>
      {!allowed ? <p className="callout callout-amber">Este rol simulado puede mirar la cola, pero no preparar ni entregar mensajes.</p> : null}
      <SpaceRequests />
      <section className="panel">
        <h2>Preparar orientación</h2>
        <Field id="comm-subject" label="Asunto" error={error}>
          <input id="comm-subject" data-testid="comm-subject" value={subject} aria-invalid={Boolean(error)} aria-describedby={error ? 'comm-subject-error' : undefined} onChange={(event) => setSubject(event.target.value)} />
        </Field>
        <Field id="comm-body" label="Texto">
          <textarea id="comm-body" data-testid="comm-body" value={body} maxLength={4000} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <div className="row">
          <button className="btn" type="button" disabled={!episode} onClick={() => {
            if (!episode) return
            const summary = answerLocal(state, episode.id, 'Prepará un resumen para el equipo médico.')
            if (summary) setBody(summary.summary)
          }}><FileText aria-hidden="true" size={18} strokeWidth={1.75} /> Copiar resumen local al borrador</button>
          <button className="btn btn-primary" type="button" data-testid="save-draft" disabled={!allowed} onClick={() => {
            if (subject.trim().length < 3 || body.trim().length < 3) { setError('Asunto y texto son obligatorios.'); return }
            dispatch({ type: 'createCommunication', crewId: state.selectedCrewId, episodeId: episode?.id ?? null, subject, body, idempotencyKey: `${keyBase}-${subject.length}` })
            setError('')
          }}>Guardar borrador</button>
        </div>
        <p className="muted">Guardar no envía el mensaje. El modelo tampoco puede ponerlo en cola.</p>
      </section>
      <section className="panel">
        <div className="spread">
          <h2>Mensajes</h2>
          <div className="row">
            <button className="btn" type="button" data-testid="deliver-comm" disabled={!allowed || state.link === 'down'} onClick={() => dispatch({ type: 'deliverQueued' })}><Send aria-hidden="true" size={18} strokeWidth={1.75} className="tone-comms" /> Marcar enviados</button>
            <button className="btn" type="button" data-testid="confirm-comm" disabled={!allowed || state.link === 'down'} onClick={() => dispatch({ type: 'confirmReceived' })}><Inbox aria-hidden="true" size={18} strokeWidth={1.75} className="tone-comms" /> Confirmar recepción</button>
          </div>
        </div>
        {state.link === 'down' ? <p className="callout callout-amber">El enlace está cortado. La cola se conserva y no se marca como enviada.</p> : null}
        <dl className="quiet-metrics">
          {ORDER.map((status) => (
            <div key={status} className="metric"><dt>{statusLabel(status, en)}</dt><dd>{state.communications.filter((item) => item.status === status).length}</dd></div>
          ))}
        </dl>
        {state.communications.length === 0 ? <p className="muted">No hay mensajes en este escenario.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Secuencia</th><th>Asunto</th><th>Estado</th><th>En cola</th><th>Enviado</th><th>Recibido</th><th></th></tr></thead>
              <tbody>
                {[...state.communications].sort((a, b) => a.sequence - b.sequence).map((item) => (
                  <tr key={item.id}>
                    <td>{item.sequence}</td>
                    <td>{item.subject}<br /><span className="muted">{CREW.find((crew) => crew.id === item.crewId)?.name}</span></td>
                    <td>{statusLabel(item.status, en)}</td>
                    <td>{item.queuedAt ? formatMission(item.queuedAt) : '—'}</td>
                    <td>{item.sentAt ? formatMission(item.sentAt) : '—'}</td>
                    <td>{item.receivedAt ? formatMission(item.receivedAt) : '—'}</td>
                    <td>{item.status === 'draft' ? <button className="btn" type="button" data-testid="queue-comm" disabled={!allowed} onClick={() => dispatch({ type: 'transitionCommunication', id: item.id, status: 'queued' })}>Poner en cola</button> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2>Auditoría reciente</h2>
        <ul>{state.audit.slice(-8).reverse().map((item) => <li key={item.id}>{formatMission(item.at)} · {roleLabel(item.actor)} · {auditActionLabel(item.action)} · {item.detail}</li>)}</ul>
      </section>
    </div>
  )
}

function statusLabel(status: string, en: boolean): string {
  if (status === 'draft') return en ? 'Draft' : 'Borrador'
  if (status === 'queued') return en ? 'Queued' : 'En cola'
  if (status === 'sent') return en ? 'Sent' : 'Enviado'
  return en ? 'Received' : 'Recibido'
}
