import { systemText } from '../systemText'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Alert, AlertStatus, Integrity, Measurement, MeasurementKind } from '../../shared/types'
import { Users, ChevronRight } from 'lucide-react'
import { SciencePanel } from '../components/SciencePanel'
import { Empty, Modal } from '../components/ui'
import { isSensorAlert } from '../domain/access'
import { CREW } from '../domain/crew'
import { alertKindLabel, alertReasonLabel } from '../domain/alertCopy'
import { alertTypeLabel, auditActionLabel, formatMission, roleLabel } from '../domain/format'
import { briefForCrew } from '../domain/scienceBrief'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'

const FILTERS: { status: AlertStatus; es: string; en: string }[] = [
  { status: 'active', es: 'Activas', en: 'Active' },
  { status: 'following', es: 'En seguimiento', en: 'Following' },
  { status: 'closed', es: 'Cerradas', en: 'Closed' },
]

function reasonLines(reason: string) {
  const clean = reason.replace(/por encima de su encima de su/g, 'por encima de su')
  return clean.split(/(?<=\.)\s+/).map((line) => line.trim()).filter(Boolean)
}

function stamp(ms: number, en = true) {
  const locale = en ? 'en-GB' : 'es'
  const formatted = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', day: '2-digit', month: 'short' })
    .format(ms)
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const day = en ? formatted : formatted.toLowerCase()
  const time = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms)
  return { day, time }
}

function pickInitial(alerts: Alert[]) {
  const active = alerts.filter((alert) => alert.status === 'active')
  return active.find((alert) => alert.type === 'change')?.id ?? active[0]?.id ?? alerts[0]?.id ?? ''
}

const READING_NAME: Record<MeasurementKind, { es: string; en: string }> = {
  heart_rate: { es: 'Pulso', en: 'Pulse' },
  spo2: { es: 'Oxígeno en la sangre', en: 'Oxygen in the blood' },
  temperature: { es: 'Temperatura', en: 'Temperature' },
  sleep_hours: { es: 'Horas de descanso', en: 'Hours of rest' },
  respiratory_rate: { es: 'Respiración', en: 'Breathing' },
}

function personFromSensor(sensorId: string | null | undefined) {
  if (!sensorId) return null
  const id = sensorId.toLowerCase()
  return CREW.find((person) => {
    const crewPrefix = person.id.split('-')[0]
    return crewPrefix !== undefined && id.includes(crewPrefix)
  }) ?? null
}

function readingFromSensor(sensorId: string | null | undefined): MeasurementKind | null {
  if (!sensorId) return null
  const id = sensorId.toLowerCase()
  if (id.includes('spo2')) return 'spo2'
  if (id.includes('temp')) return 'temperature'
  if (id.includes('sleep')) return 'sleep_hours'
  if (id.includes('-fr-') || id.includes('resp')) return 'respiratory_rate'
  if (id.includes('-fc-') || id.includes('heart') || id === 'local-repeat') return 'heart_rate'
  return null
}

function readingName(kind: MeasurementKind | null, en: boolean) {
  if (!kind) return en ? 'Measurement' : 'Medición'
  return en ? READING_NAME[kind].en : READING_NAME[kind].es
}

function readingNumber(kind: MeasurementKind | null, value: number, en: boolean) {
  if (kind === 'heart_rate') return en ? `${value} heartbeats per minute` : `${value} latidos por minuto`
  if (kind === 'spo2') return en ? `${value}% oxygen` : `${value}% de oxígeno`
  if (kind === 'temperature') return en ? `${value} degrees` : `${value} grados`
  if (kind === 'sleep_hours') return en ? `${value} hours` : `${value} horas`
  if (kind === 'respiratory_rate') return en ? `${value} breaths per minute` : `${value} respiraciones por minuto`
  return String(value)
}

function usableAnswer(value: Integrity, en: boolean) {
  if (value === 'valid') return en ? 'Yes' : 'Sí'
  if (value === 'pending') return en ? 'Not yet' : 'Todavía no'
  return en ? 'No, it is too old' : 'No, es muy antigua'
}

function arrivalNote(item: Measurement, en: boolean) {
  if (item.integrity === 'pending') {
    return en
      ? 'We are still checking this number, so it is not used yet.'
      : 'Todavía se está revisando este número, así que aún no se usa.'
  }
  if (item.integrity === 'stale') {
    return en
      ? 'This number is too old to say how the person is right now.'
      : 'Este número es muy antiguo para decir cómo está la persona ahora.'
  }
  if (item.origin === 'local') return en ? 'It was saved on this device.' : 'Se guardó en este equipo.'
  if (item.macValid) return en ? 'It arrived just as it was sent.' : 'Llegó igual que cuando se envió.'
  return en ? 'We could not confirm that it arrived unchanged.' : 'No pudimos confirmar que llegó sin cambios.'
}

function rejectedNote(reason: string, detail: string, en: boolean) {
  if (reason === 'duplicate') {
    return en
      ? 'The same reading was sent twice, so it was not saved again.'
      : 'La misma medición se envió dos veces, así que no se guardó otra vez.'
  }
  if (reason === 'altered') {
    return en
      ? 'The reading changed before it arrived, so it is not used.'
      : 'La medición cambió antes de llegar, así que no se usa.'
  }
  if (reason === 'out_of_order') {
    return en
      ? 'It arrived after a newer reading, so it is not used.'
      : 'Llegó después de una medición más nueva, así que no se usa.'
  }
  return systemText(detail)
}

export function AlertsPage() {
  const { state, dispatch } = useApp()
  const { lang } = useLocale()
  const en = lang === 'en'
  const navigate = useNavigate()
  const [tab, setTab] = useState<AlertStatus>('active')
  const personTrigger = useRef<HTMLButtonElement | null>(null)
  const [personId, setPersonId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const counts = { active: 0, following: 0, closed: 0 }
  for (const alert of state.alerts) counts[alert.status] += 1
  const rows = state.alerts
    .filter((alert) => alert.status === tab)
    .slice()
    .sort((a, b) => b.openedAt - a.openedAt)

  const crewName = (id: string | null) => (id ? CREW.find((crew) => crew.id === id)?.name : null) ?? (en ? 'System' : 'Sistema')
  const people = [...new Set(rows.map((alert) => alert.crewId))].map((id) => {
    const matching = rows.filter((alert) => alert.crewId === id)
    const all = state.alerts.filter((alert) => alert.crewId === id)
    return { id: id ?? 'system', crewId: id, matching, all, latest: matching[0]! }
  })
  const personAlerts = personId === null ? [] : state.alerts
    .filter((alert) => (alert.crewId ?? 'system') === personId)
    .slice().sort((a, b) => b.openedAt - a.openedAt)
  const selected = personAlerts.find((alert) => alert.id === selectedId) ?? personAlerts[0] ?? null
  const personName = crewName(personId === 'system' ? null : personId)
  const statusLabel = (status: AlertStatus) => {
    const filter = FILTERS.find((item) => item.status === status)!
    return en ? filter.en : filter.es
  }

  function openPerson(id: string, alerts: Alert[]) {
    setPersonId(id)
    setSelectedId(pickInitial(alerts))
  }

  function run(key: string, action: () => void) {
    if (busy) return
    setBusy(key)
    action()
    window.setTimeout(() => setBusy(null), 320)
  }

  function openAnalysis(alert: Alert) {
    if (busy) return
    if (alert.crewId) dispatch({ type: 'selectCrew', crewId: alert.crewId })
    dispatch({ type: 'selectEpisode', episodeId: alert.episodeId })
    navigate('/app/analisis', { state: { alertId: alert.id } })
  }

  return (
    <div className="alerts-page">
      <header className="alerts-head">
        <p className="alerts-kicker">{en ? 'Alerts' : 'Alertas'}</p>
        <h1>{en ? 'Alert center' : 'Centro de Alertas'}</h1>
      </header>

      <section className="alerts-health" aria-labelledby="alerts-health-title">
        <div className="alerts-section-label">
          <h2 id="alerts-health-title" className="alerts-section-title">
            {en ? 'Clinical notices' : 'Avisos clínicos'}
          </h2>
        </div>
        <div className="alerts-filters" role="group" aria-label={en ? 'Alert status' : 'Estado de las alertas'}>
          {FILTERS.map((filter) => (
            <button
              key={filter.status}
              type="button"
              aria-pressed={tab === filter.status}
              data-testid={`filter-${filter.status}`}
              onClick={() => setTab(filter.status)}
            >
              {(en ? filter.en : filter.es)} ({counts[filter.status]})
            </button>
          ))}
        </div>
        <div className="alerts-people" id="alerts-list">
          {people.length === 0 ? (
            <Empty title={en ? 'No alerts in this state' : 'No hay alertas en este estado'} text={en ? 'Choose another status to see the crew history.' : 'Elegí otro estado para consultar el historial de la tripulación.'} />
          ) : people.map((person) => {
            const when = stamp(person.latest.updatedAt, en)
            return (
              <button key={person.id} type="button" className="alerts-person"
                data-testid={`alerts-person-${person.id}`} aria-haspopup="dialog"
                onClick={(event) => { personTrigger.current = event.currentTarget; openPerson(person.id, person.matching) }}>
                <span className="alerts-person-avatar" aria-hidden="true"><Users size={26} /></span>
                <span className="alerts-person-copy">
                  <strong>{crewName(person.crewId)}</strong>
                  <span className="alerts-person-counts">
                    {FILTERS.map((filter) => {
                      const count = person.all.filter((alert) => alert.status === filter.status).length
                      return <span key={filter.status}>{count} {statusLabel(filter.status).toLowerCase()}</span>
                    })}
                  </span>
                  <span className="muted">{en ? 'Latest notice: ' : 'Último aviso: '}{alertKindLabel(person.latest.type, person.latest.title, en)}</span>
                </span>
                <span className="alerts-person-end">
                  <span>{when.day}, {when.time}</span>
                  <span>{en ? 'View history' : 'Ver historial'} <ChevronRight size={16} aria-hidden="true" /></span>
                </span>
              </button>
            )
          })}
        </div>
        <Modal open={personId !== null} title={personName} className="alerts-person-modal"
          description={en ? 'All health alerts and their follow-up, from newest to oldest.' : 'Todas sus alertas de salud y su seguimiento, de la más reciente a la más antigua.'}
          onCloseAutoFocus={(event) => {
            if (personTrigger.current?.isConnected) { event.preventDefault(); personTrigger.current.focus() }
          }}
          onClose={() => setPersonId(null)}>
          <div className="alerts-person-history">
            <section className="alerts-person-events" aria-label={en ? 'Alert history' : 'Historial de alertas'}>
              <h3>{en ? 'Alert history' : 'Historial de alertas'} <span className="muted">({personAlerts.length})</span></h3>
              {personAlerts.map((alert) => {
                const when = stamp(alert.openedAt, en)
                return (
                  <button key={alert.id} type="button" className="alert-card" data-testid={`alert-${alert.id}`}
                    aria-pressed={alert.id === selected?.id} onClick={() => setSelectedId(alert.id)}>
                    <span className="alert-card-copy">
                      <span className="alert-card-kind">{alertKindLabel(alert.type, alert.title, en)}</span>
                      <span className={`alert-badge is-${alert.type}`}>{alertTypeLabel(alert.type)}</span>
                      <span className="alerts-event-status">{statusLabel(alert.status)}</span>
                    </span>
                    <span className="alert-card-when"><b>{when.day}</b><span>{when.time}</span></span>
                  </button>
                )
              })}
            </section>
            <article className="alerts-detail" aria-live="polite">
              {selected ? (
                <AlertDetail alert={selected} name={personName} busy={busy}
                  audit={state.audit.filter((item) => item.entityId === selected.id)}
                  onAck={() => run('ack', () => dispatch({ type: 'ackAlert', alertId: selected.id }))}
                  onFollow={() => run('follow', () => dispatch({ type: 'setAlertStatus', alertId: selected.id, status: 'following' }))}
                  onClose={() => run('close', () => dispatch(isSensorAlert(selected.type)
                    ? { type: 'resolveSensorAlert', alertId: selected.id }
                    : { type: 'setAlertStatus', alertId: selected.id, status: 'closed' }))}
                  onAnalysis={() => openAnalysis(selected)} english={en} />
              ) : <Empty title={en ? 'No alerts' : 'Sin alertas'} text={en ? 'No history is available for this person.' : 'No hay historial disponible para esta persona.'} />}
            </article>
          </div>
          {selected ? <SciencePanel brief={briefForCrew(state, selected.crewId, lang, selected)} /> : null}
        </Modal>
      </section>

      <section className="panel alerts-integrity" aria-labelledby="alerts-readings-title">
        <h2 id="alerts-readings-title">{en ? 'Latest readings' : 'Últimas mediciones'}</h2>
        <p className="alerts-plain">
          {en
            ? 'Each row is one measurement. It shows who it belongs to, the number, and whether we can use it.'
            : 'Cada fila es una medición. Muestra de quién es, el número y si se puede usar.'}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{en ? 'When' : 'Cuándo'}</th>
                <th>{en ? 'Who' : 'Quién'}</th>
                <th>{en ? 'The number' : 'El número'}</th>
                <th>{en ? 'Can we use it?' : '¿Se puede usar?'}</th>
                <th>{en ? 'Why' : 'Por qué'}</th>
              </tr>
            </thead>
            <tbody>
              {state.measurements.slice(-6).reverse().map((item) => {
                const person = CREW.find((crew) => crew.id === item.crewId)
                return (
                  <tr key={item.id}>
                    <td>{formatMission(item.measuredAt)}</td>
                    <td>
                      <span className="alerts-who">
                        <strong>{person?.name ?? crewName(item.crewId)}</strong>
                        <small>{readingName(item.kind, en)}</small>
                      </span>
                    </td>
                    <td>{readingNumber(item.kind, item.value, en)}</td>
                    <td>{usableAnswer(item.integrity, en)}</td>
                    <td>{arrivalNote(item, en)}</td>
                  </tr>
                )
              })}
              {state.rejected.slice(-4).reverse().map((item) => {
                const person = personFromSensor(item.sensorId)
                const kind = readingFromSensor(item.sensorId)
                return (
                  <tr key={item.id}>
                    <td>{formatMission(item.at)}</td>
                    <td>
                      <span className="alerts-who">
                        <strong>{person?.name ?? (en ? 'Unknown device' : 'Equipo desconocido')}</strong>
                        <small>{readingName(kind, en)}</small>
                      </span>
                    </td>
                    <td>{item.claimedValue == null ? (en ? 'No number' : 'Sin número') : readingNumber(kind, item.claimedValue, en)}</td>
                    <td>No</td>
                    <td>{rejectedNote(item.reason, item.detail, en)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AlertDetail({
  alert,
  name,
  busy,
  audit,
  onAck,
  onFollow,
  onClose,
  onAnalysis,
  english,
}: {
  alert: Alert
  name: string
  busy: string | null
  audit: { id: string; action: string; at: number; actor: string; detail: string }[]
  onAck: () => void
  onFollow: () => void
  onClose: () => void
  onAnalysis: () => void
  english: boolean
}) {
  const opened = stamp(alert.openedAt, english)
  const updated = stamp(alert.updatedAt, english)
  return (
    <>
      <p className="alerts-detail-kind">{alertKindLabel(alert.type, alert.title, english)}</p>
      <h2>{name}</h2>
      {reasonLines(alertReasonLabel(alert, name, english)).map((line) => <p key={line} className="alerts-detail-reason">{line}</p>)}
      <p className="alerts-meta">
        {english ? 'Opened' : 'Abierta'} {opened.day}, {opened.time} - {english ? 'Updated' : 'Actualizada'} {updated.day}, {updated.time} - {alert.astronautAck ? (english ? 'Notice confirmed' : 'Aviso confirmado') : (english ? 'Notice not confirmed' : 'Aviso sin confirmar')}
      </p>
      <div className="alerts-actions">
        <button type="button" className="alerts-btn is-line" disabled={alert.astronautAck || busy !== null} aria-busy={busy === 'ack'} onClick={onAck}>
          {busy === 'ack' ? (english ? 'Confirming…' : 'Confirmando…') : (english ? 'Confirm notice' : 'Confirmar aviso')}
        </button>
        <button type="button" className="alerts-btn is-line" disabled={alert.status !== 'active' || busy !== null} aria-busy={busy === 'follow'} onClick={onFollow}>
          {busy === 'follow' ? (english ? 'Updating…' : 'Actualizando…') : (english ? 'Move to follow-up' : 'Pasar a seguimiento')}
        </button>
        <Link className="alerts-btn is-fill" to="/app/analisis" onClick={(event) => { event.preventDefault(); onAnalysis() }}>
          {english ? 'Open analysis' : 'Abrir análisis'}
        </Link>
        <button type="button" className="alerts-btn is-close" disabled={alert.status === 'closed' || busy !== null} aria-busy={busy === 'close'} onClick={onClose}>
          {busy === 'close' ? (english ? 'Closing…' : 'Cerrando…') : (english ? 'Close alert' : 'Cerrar alerta')}
        </button>
      </div>
      <div className="alerts-timeline">
        <h3>{english ? 'Timeline' : 'Línea de tiempo'}</h3>
        {audit.length === 0 ? (
          <p>• {english ? 'Created by the scenario, with no later actions.' : 'Generada por el escenario, sin acciones posteriores.'}</p>
        ) : (
          <ul>
            {audit.map((item) => (
              <li key={item.id}>
                • {auditActionLabel(item.action)} · {stamp(item.at, english).day}, {stamp(item.at, english).time} · {roleLabel(item.actor)} · {systemText(item.detail)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
