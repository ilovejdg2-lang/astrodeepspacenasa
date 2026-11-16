import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { profileDisplayName } from '../../platform/copy'
import { systemText } from '../../systemText'

export type VisitRow = {
  id: string
  requesterId?: string
  professionalId?: string | null
  specialty?: string
  status?: string
  reason?: string
  summary?: string
  scheduledAt?: number | null
  durationMin?: number
  timezone?: string
  shareCategories?: string[]
  outcome?: string
  cancelReason?: string
  professionalNotes?: string
  history?: { action: string; at: number; note?: string }[]
}

type Member = { profileId: string; role: string; status: string }

const STATUS: Record<string, { en: string; es: string }> = {
  requested: { en: 'Requested', es: 'Solicitada' },
  pending_confirm: { en: 'Requested', es: 'Solicitada' },
  confirmed: { en: 'Confirmed', es: 'Confirmada' },
  rescheduled: { en: 'Rescheduled', es: 'Reprogramada' },
  cancelled: { en: 'Cancelled', es: 'Cancelada' },
  completed: { en: 'Completed', es: 'Realizada' },
}

function statusLabel(status: string | undefined, en: boolean) {
  const pair = STATUS[status || '']
  if (!pair) return status || '—'
  return en ? pair.en : pair.es
}

function when(ms: number | null | undefined, en: boolean, zone = 'UTC') {
  if (!ms) return en ? 'Time not set' : 'Sin horario'
  const formatted = new Intl.DateTimeFormat(en ? 'en-GB' : 'es-CR', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(ms)
  return `${formatted} ${zone}`
}

function tomorrowKey() {
  const date = new Date(Date.now() + 86_400_000)
  return date.toISOString().slice(0, 10)
}

const DAY_MS = 86_400_000
const SCHEDULE_START_MIN = 8 * 60
const SCHEDULE_HOURS = 10
const SCHEDULE_HOUR_HEIGHT = 52

function utcWeekStart(timestamp: number) {
  const date = new Date(timestamp)
  const day = date.getUTCDay()
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - ((day + 6) % 7))
}

function formatClock(timestamp: number, en: boolean) {
  return new Intl.DateTimeFormat(en ? 'en-GB' : 'es-CR', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(timestamp)
}

function AppointmentWeekSchedule({ rows, en }: { rows: VisitRow[]; en: boolean }) {
  const [weekStart, setWeekStart] = useState(() => utcWeekStart(Date.now()))
  const days = useMemo(
    () => Array.from({ length: 5 }, (_, index) => weekStart + index * DAY_MS),
    [weekStart],
  )
  const activeRows = useMemo(
    () => rows.filter((item) => item.scheduledAt != null && item.status !== 'cancelled'),
    [rows],
  )
  const weekEnd = weekStart + 7 * DAY_MS
  const todayStart = utcWeekStart(Date.now()) + ((new Date().getUTCDay() + 6) % 7) * DAY_MS
  const todayCount = activeRows.filter((item) => item.scheduledAt! >= todayStart && item.scheduledAt! < todayStart + DAY_MS).length
  const pendingCount = rows.filter((item) => item.status === 'requested' || item.status === 'pending_confirm').length
  const nextVisit = activeRows
    .filter((item) => item.scheduledAt! >= Date.now() && item.status !== 'completed')
    .sort((left, right) => left.scheduledAt! - right.scheduledAt!)[0]
  const weekAppointments = activeRows.filter((item) => item.scheduledAt! >= weekStart && item.scheduledAt! < weekEnd)
  const rangeLabel = new Intl.DateTimeFormat(en ? 'en-GB' : 'es-CR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const dayLabel = new Intl.DateTimeFormat(en ? 'en-GB' : 'es-CR', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
  const dateRange = `${rangeLabel.format(weekStart)} – ${rangeLabel.format(weekStart + 4 * DAY_MS)}`

  return (
    <section className="rd-schedule" aria-label={en ? 'Professional schedule' : 'Horario profesional'}>
      <div className="rd-schedule-summary">
        <div><span>{en ? 'Today' : 'Hoy'}</span><strong>{todayCount} {en ? 'appointments' : 'citas'}</strong></div>
        <div><span>{en ? 'Pending' : 'Pendientes'}</span><strong>{pendingCount} {en ? 'requests' : 'solicitudes'}</strong></div>
        <div>
          <span>{en ? 'Next appointment' : 'Próxima cita'}</span>
          <strong>{nextVisit?.scheduledAt ? formatClock(nextVisit.scheduledAt, en) : (en ? 'None' : 'Ninguna')}</strong>
        </div>
      </div>
      <div className="rd-schedule-heading">
        <div>
          <h3>{en ? 'Weekly schedule' : 'Horario semanal'}</h3>
          <span>{dateRange} · UTC</span>
        </div>
        <div className="rd-schedule-nav">
          <button type="button" aria-label={en ? 'Previous week' : 'Semana anterior'} onClick={() => setWeekStart((current) => current - 7 * DAY_MS)}>
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setWeekStart(utcWeekStart(Date.now()))}>{en ? 'Today' : 'Hoy'}</button>
          <button type="button" aria-label={en ? 'Next week' : 'Semana siguiente'} onClick={() => setWeekStart((current) => current + 7 * DAY_MS)}>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="rd-schedule-scroll table-wrap" role="region" aria-label={en ? 'Weekly appointments, 08:00 to 18:00 UTC' : 'Citas semanales, de 08:00 a 18:00 UTC'}>
        <div className="rd-week-grid">
          <div className="rd-week-corner" aria-hidden="true" />
          {days.map((day) => (
            <div className="rd-week-day-heading" key={day}>
              {dayLabel.format(day).toLocaleUpperCase(en ? 'en' : 'es')}
            </div>
          ))}
          <div className="rd-week-times" aria-hidden="true">
            {Array.from({ length: SCHEDULE_HOURS }, (_, index) => (
              <span key={index}>{`${String(8 + index).padStart(2, '0')}:00`}</span>
            ))}
          </div>
          {days.map((day) => {
            const dayKey = new Date(day).toISOString().slice(0, 10)
            const dayAppointments = weekAppointments.filter((item) => {
              const date = new Date(item.scheduledAt!)
              const startMinute = date.getUTCHours() * 60 + date.getUTCMinutes()
              return date.toISOString().slice(0, 10) === dayKey && startMinute >= SCHEDULE_START_MIN && startMinute < 18 * 60
            })
            return (
              <div className="rd-week-day" key={day}>
                {dayAppointments.map((item) => {
                  const start = new Date(item.scheduledAt!)
                  const startMinute = start.getUTCHours() * 60 + start.getUTCMinutes()
                  const top = ((startMinute - SCHEDULE_START_MIN) / 60) * SCHEDULE_HOUR_HEIGHT
                  const duration = item.durationMin || 30
                  const height = Math.max(40, Math.min((duration / 60) * SCHEDULE_HOUR_HEIGHT, SCHEDULE_HOURS * SCHEDULE_HOUR_HEIGHT - top))
                  return (
                    <article
                      className={`rd-schedule-event${item.status === 'requested' || item.status === 'pending_confirm' ? ' is-requested' : ''}`}
                      key={item.id}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <strong>{profileDisplayName(item.requesterId || '')}</strong>
                      <span>{formatClock(item.scheduledAt!, en)} · {statusLabel(item.status, en)}</span>
                    </article>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
      {weekAppointments.length === 0 ? (
        <p className="rd-muted">{en ? 'No appointments this week.' : 'No hay citas esta semana.'}</p>
      ) : null}
      <p className="rd-schedule-legend">{en ? 'Confirmed and requested appointments' : 'Citas confirmadas y solicitadas'}</p>
    </section>
  )
}

export function AppointmentDesk({
  missionId,
  stage,
  profileId,
  scope,
  specialty,
  members,
  appointments,
  appointmentsLoading = false,
  loadError,
  onChanged,
}: {
  missionId: string | null
  stage?: string
  profileId?: string
  scope: 'mine' | 'assigned'
  specialty?: 'medical' | 'psychological'
  members: Member[]
  appointments: VisitRow[]
  appointmentsLoading?: boolean
  loadError?: string
  onChanged: () => Promise<void> | void
}) {
  const { lang } = useLocale()
  const en = lang === 'en'
  const writable = stage === 'aboard'
  const [step, setStep] = useState(1)
  const [kind, setKind] = useState<'medical' | 'psychological'>(specialty || 'medical')
  const [professionalId, setProfessionalId] = useState('')
  const [day, setDay] = useState(tomorrowKey)
  const [slots, setSlots] = useState<{ start: number; label: string }[]>([])
  const [slot, setSlot] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [summary, setSummary] = useState('')
  const [share, setShare] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [retryingAppointments, setRetryingAppointments] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [outcome, setOutcome] = useState('')
  const [notes, setNotes] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [moveTo, setMoveTo] = useState('')

  const title = specialty === 'psychological'
    ? (en ? 'Psychological Consultation' : 'Consulta psicológica')
    : specialty === 'medical'
      ? (en ? 'Medical Appointment' : 'Cita médica')
      : (en ? 'Medical Appointment or Psychological Consultation' : 'Cita médica o consulta psicológica')

  const professionals = members.filter((member) => member.status === 'active' && (kind === 'medical' ? member.role === 'medic' : member.role === 'psychologist'))
  const rows = useMemo(() => appointments.filter((item) => {
    if (scope === 'mine') return item.requesterId === profileId
    if (specialty && item.specialty !== specialty) return false
    return item.professionalId === profileId
  }), [appointments, profileId, scope, specialty])

  function toggleShare(id: string) {
    setShare((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function retryAppointments() {
    if (retryingAppointments) return
    setRetryingAppointments(true)
    try {
      await onChanged()
    } finally {
      setRetryingAppointments(false)
    }
  }

  async function loadSlots(nextProfessional = professionalId, nextDay = day) {
    if (!missionId || !nextProfessional || !nextDay) return
    setError('')
    try {
      const data = await platformApi.slots(missionId, nextProfessional, nextDay)
      setSlots(data.slots)
      setSlot(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not load availability' : 'No se pudo cargar la disponibilidad'))
    }
  }

  async function submit() {
    if (!missionId || !professionalId || slot == null || busy) return
    setBusy(true)
    setError('')
    setOk('')
    try {
      await platformApi.requestAppointment(missionId, {
        specialty: kind,
        professionalId,
        reason,
        summary,
        scheduledAt: slot,
        durationMin: 30,
        timezone: 'UTC',
        shareCategories: share,
        modality: 'aboard',
      })
      setOk(en
        ? 'Request sent. It stays Requested until the professional accepts.'
        : 'Solicitud enviada. Queda solicitada hasta que el profesional acepte.')
      setReason('')
      setSummary('')
      setStep(1)
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not send the request' : 'No se pudo enviar la solicitud'))
    } finally {
      setBusy(false)
    }
  }

  async function act(fn: () => Promise<unknown>, success: string) {
    if (busy) return
    setBusy(true)
    setError('')
    setOk('')
    try {
      await fn()
      setOk(success)
      setOutcome('')
      setNotes('')
      setCancelReason('')
      await onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not update the visit' : 'No se pudo actualizar la cita'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rd-card" data-testid="appointment-desk">
      <h2>{title}</h2>
      <p className="rd-muted">
        {writable
          ? (en
            ? 'Times use UTC. A request is not Confirmed until the professional accepts an open slot.'
            : 'Los horarios están en UTC. Una solicitud no queda confirmada hasta que el profesional acepta un horario libre.')
          : (en
            ? 'This mission is not in flight. You can read the visit history. New requests are closed.'
            : 'Esta misión no está a bordo. Podés leer el historial. No se abren solicitudes nuevas.')}
      </p>
      {error ? <p className="rd-error" role="alert">{systemText(error)}</p> : null}
      {ok ? <p className="rd-ok" role="status">{ok}</p> : null}

      {scope === 'assigned' ? <AppointmentWeekSchedule rows={rows} en={en} /> : null}

      {loadError ? (
        <div className="rd-empty" role="alert">
          <p className="rd-error">{systemText(loadError)}</p>
          <div className="rd-actions" style={{ marginTop: 10 }}>
            <button type="button" className="rd-btn ghost" disabled={retryingAppointments} onClick={() => void retryAppointments()}>
              {retryingAppointments ? (en ? 'Retrying…' : 'Reintentando…') : (en ? 'Retry loading visits' : 'Reintentar carga de citas')}
            </button>
          </div>
        </div>
      ) : appointmentsLoading ? null : rows.length === 0 ? (
        <div className="rd-empty">
          <strong>{en ? 'No visits in this view' : 'No hay citas en esta vista'}</strong>
          <span className="rd-muted">{en ? 'History from other missions is not shown here.' : 'No se muestra el historial de otras misiones.'}</span>
          <div className="rd-actions" style={{ marginTop: 10 }}>
            <Link className="rd-btn ghost" to="/misiones">
              {en ? 'Browse missions with demo visit history' : 'Ver misiones con citas de ejemplo'}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="rd-list">
          {rows.map((item) => (
            <li key={item.id} className="rd-row">
              <div>
                <strong>{item.specialty === 'psychological' ? (en ? 'Psychological Consultation' : 'Consulta psicológica') : (en ? 'Medical Appointment' : 'Cita médica')}</strong>
                <span>{statusLabel(item.status, en)} · {when(item.scheduledAt, en, item.timezone || 'UTC')}</span>
                {item.reason ? <span>{item.reason}</span> : null}
                {item.summary ? <span>{en ? 'Shared summary: ' : 'Resumen compartido: '}{item.summary}</span> : null}
                {item.outcome ? <span>{en ? 'Outcome: ' : 'Resultado: '}{item.outcome}</span> : null}
                {item.cancelReason ? <span>{en ? 'Cancellation: ' : 'Cancelación: '}{item.cancelReason}</span> : null}
                {item.professionalNotes ? <span>{en ? 'Professional note (restricted): ' : 'Nota profesional (restringida): '}{item.professionalNotes}</span> : null}
                {item.shareCategories?.length ? <span>{en ? 'Authorized: ' : 'Autorizado: '}{item.shareCategories.join(', ')}</span> : null}
                {scope === 'assigned' && item.requesterId ? (
                  <button
                    type="button"
                    className="rd-btn ghost"
                    data-testid={`visit-pain-${item.id}`}
                    onClick={() => window.dispatchEvent(new CustomEvent('helios:open-pain-case', { detail: { subjectId: item.requesterId, appointmentId: item.id } }))}
                  >
                    {en ? 'View pain map' : 'Ver mapa de dolor'}
                  </button>
                ) : null}
              </div>
              {writable && scope === 'assigned' && item.status !== 'completed' && item.status !== 'cancelled' ? (
                <div className="rd-actions">
                  {(item.status === 'requested' || item.status === 'pending_confirm') ? (
                    <>
                      <button type="button" className="rd-btn" disabled={busy} onClick={() => void act(() => platformApi.confirmAppointment(item.id, true), en ? 'Confirmed' : 'Confirmada')}>{en ? 'Confirm' : 'Confirmar'}</button>
                      <button type="button" className="rd-btn ghost" disabled={busy} onClick={() => void act(() => platformApi.confirmAppointment(item.id, false), en ? 'Declined' : 'Rechazada')}>{en ? 'Decline' : 'Rechazar'}</button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="rd-btn ghost"
                    disabled={busy || !moveTo}
                    onClick={() => void act(() => platformApi.rescheduleAppointment(item.id, new Date(moveTo).getTime()), en ? 'Rescheduled' : 'Reprogramada')}
                  >
                    {en ? 'Reschedule' : 'Reprogramar'}
                  </button>
                  <button
                    type="button"
                    className="rd-btn ghost"
                    disabled={busy || cancelReason.trim().length < 3}
                    onClick={() => void act(() => platformApi.cancelAppointment(item.id, cancelReason), en ? 'Cancelled' : 'Cancelada')}
                  >
                    {en ? 'Cancel' : 'Cancelar'}
                  </button>
                  {(item.status === 'confirmed' || item.status === 'rescheduled') ? (
                    <button
                      type="button"
                      className="rd-btn"
                      disabled={busy || outcome.trim().length < 3}
                      onClick={() => void act(() => platformApi.completeAppointment(item.id, outcome, notes), en ? 'Outcome saved' : 'Resultado guardado')}
                    >
                      {en ? 'Record outcome' : 'Registrar resultado'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {writable && scope === 'assigned' ? (
        <div className="rd-form-grid">
          <div className="rd-field">
            <label htmlFor="move-to">{en ? 'New time' : 'Nuevo horario'}</label>
            <input id="move-to" type="datetime-local" value={moveTo} onChange={(event) => setMoveTo(event.target.value)} />
          </div>
          <div className="rd-field">
            <label htmlFor="cancel-reason">{en ? 'Cancellation reason' : 'Motivo de cancelación'}</label>
            <input id="cancel-reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
          </div>
          <div className="rd-field">
            <label htmlFor="visit-outcome">{en ? 'Outcome' : 'Resultado'}</label>
            <input id="visit-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)} />
          </div>
          <div className="rd-field">
            <label htmlFor="visit-notes">{en ? 'Professional note (not shared with the commander)' : 'Nota profesional (no se comparte con el comandante)'}</label>
            <input id="visit-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
      ) : null}

      {writable && scope === 'mine' ? (
        <div className="rd-stack">
          <p className="rd-muted">{en ? `Step ${step} of 4` : `Paso ${step} de 4`}</p>
          {step === 1 ? (
            <div className="rd-actions">
              <button type="button" className={`rd-btn${kind === 'medical' ? '' : ' ghost'}`} onClick={() => { setKind('medical'); setProfessionalId(''); setSlots([]) }}>{en ? 'Physician' : 'Médico'}</button>
              <button type="button" className={`rd-btn${kind === 'psychological' ? '' : ' ghost'}`} onClick={() => { setKind('psychological'); setProfessionalId(''); setSlots([]) }}>{en ? 'Psychologist' : 'Psicólogo'}</button>
              <button type="button" className="rd-btn" disabled={!professionals.length} onClick={() => setStep(2)}>{en ? 'Continue' : 'Continuar'}</button>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="rd-form-grid">
              <div className="rd-field">
                <label htmlFor="visit-pro">{en ? 'Professional' : 'Profesional'}</label>
                <select id="visit-pro" value={professionalId} onChange={(event) => { setProfessionalId(event.target.value); setSlots([]); setSlot(null) }}>
                  <option value="">{en ? 'Select' : 'Elegir'}</option>
                  {professionals.map((member) => (
                    <option key={member.profileId} value={member.profileId}>{profileDisplayName(member.profileId)}</option>
                  ))}
                </select>
              </div>
              <div className="rd-field">
                <label htmlFor="visit-day">{en ? 'Day (UTC)' : 'Día (UTC)'}</label>
                <input id="visit-day" type="date" value={day} onChange={(event) => setDay(event.target.value)} />
              </div>
              <div className="rd-actions">
                <button type="button" className="rd-btn ghost" onClick={() => setStep(1)}>{en ? 'Back' : 'Atrás'}</button>
                <button type="button" className="rd-btn" disabled={!professionalId} onClick={() => void loadSlots().then(() => setStep(3))}>{en ? 'See open times' : 'Ver horarios libres'}</button>
              </div>
              {slots.length ? (
                <div className="rd-actions">
                  {slots.slice(0, 8).map((item) => (
                    <button key={item.start} type="button" className={`rd-btn${slot === item.start ? '' : ' ghost'}`} onClick={() => setSlot(item.start)}>{item.label}</button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {step === 3 ? (
            <div className="rd-form-grid">
              <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="visit-reason">{en ? 'Reason' : 'Motivo'}</label>
                <textarea id="visit-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={en ? 'What do you want to talk about?' : '¿De qué querés hablar?'} />
              </div>
              <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="visit-summary">{en ? 'Voluntary shared summary (optional)' : 'Resumen que aceptás compartir (opcional)'}</label>
                <textarea id="visit-summary" value={summary} onChange={(event) => setSummary(event.target.value)} />
              </div>
              <fieldset>
                <legend>{en ? 'Information you authorize for this visit' : 'Información que autorizás para esta cita'}</legend>
                {['sleep', 'symptoms', 'vitals'].map((id) => (
                  <label key={id} className="rd-check">
                    <input type="checkbox" checked={share.includes(id)} onChange={() => toggleShare(id)} />
                    <span>{id}</span>
                  </label>
                ))}
              </fieldset>
              <div className="rd-actions">
                <button type="button" className="rd-btn ghost" onClick={() => setStep(2)}>{en ? 'Back' : 'Atrás'}</button>
                <button type="button" className="rd-btn" disabled={reason.trim().length < 3 || slot == null} onClick={() => setStep(4)}>{en ? 'Review request' : 'Revisar solicitud'}</button>
              </div>
            </div>
          ) : null}
          {step === 4 ? (
            <div>
              <p><strong>{kind === 'medical' ? (en ? 'Medical Appointment' : 'Cita médica') : (en ? 'Psychological Consultation' : 'Consulta psicológica')}</strong></p>
              <p>{profileDisplayName(professionalId)} · {slot ? when(slot, en) : ''}</p>
              <p>{reason}</p>
              <p className="rd-muted">{en ? `Will share: ${share.join(', ') || 'nothing extra'}` : `Se comparte: ${share.join(', ') || 'nada adicional'}`}</p>
              <p className="rd-muted">{en ? 'Quirón chat is not copied into this request.' : 'La conversación con Quirón no se copia a esta solicitud.'}</p>
              <div className="rd-actions">
                <button type="button" className="rd-btn ghost" onClick={() => setStep(3)}>{en ? 'Back' : 'Atrás'}</button>
                <button type="button" className="rd-btn" disabled={busy} onClick={() => void submit()}>{en ? 'Confirm request' : 'Confirmar solicitud'}</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
