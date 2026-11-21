import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, AlertTriangle, Calendar, Check, Stethoscope, Brain } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { profileDisplayName } from '../../platform/copy'
import { getActiveMissionId } from '../../platform/session'
import { systemText } from '../../systemText'

function fallbackSlotsForDay(dayStr: string): { start: number; label: string }[] {
  const date = new Date(`${dayStr}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return []
  const hours = [8, 9, 10, 11, 13, 14, 15, 16]
  return hours.map((h) => {
    const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), h, 0)
    return {
      start,
      label: `${String(h).padStart(2, '0')}:00 UTC`,
    }
  })
}

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

export const MEDICAL_SHARE_OPTIONS = [
  { id: 'vitals', labelEn: 'Vital signs & cardiovascular telemetry (HR, BP, SpO2, HRV)', labelEs: 'Signos vitales y telemetría cardiovascular (FC, PA, SpO2, VFC)' },
  { id: 'pain_somatic', labelEn: '3D pain map & musculoskeletal somatic reports', labelEs: 'Mapa 3D de dolor y reportes osteomusculares' },
  { id: 'nutrition', labelEn: 'Nutrition & metabolic indicators (caloric intake, hydration)', labelEs: 'Indicadores nutricionales y metabólicos (calorías, hidratación)' },
  { id: 'respiratory', labelEn: 'Respiratory telemetry & pulmonary adaptation', labelEs: 'Telemetría respiratoria y adaptación pulmonar' },
] as const

export const PSYCH_SHARE_OPTIONS = [
  { id: 'sleep', labelEn: 'Sleep & circadian rhythm data (duration, stages, REM)', labelEs: 'Datos de sueño y ritmo circadiano (duración, fases, REM)' },
  { id: 'emotional', labelEn: 'Emotional wellbeing & mood check-ins', labelEs: 'Bienestar emocional y chequeos de estado de ánimo' },
  { id: 'cognitive_fatigue', labelEn: 'Cognitive workload & spaceflight mental fatigue', labelEs: 'Carga cognitiva y fatiga mental del vuelo espacial' },
  { id: 'behavioral', labelEn: 'Behavioral reflections & adaptation notes', labelEs: 'Reflexiones conductuales y notas de adaptación' },
] as const

export function getShareCategoryLabel(id: string, en: boolean): string {
  switch (id) {
    case 'vitals':
      return en ? 'Vital Signs & Telemetry' : 'Signos vitales y telemetría'
    case 'pain_somatic':
    case 'symptoms':
      return en ? '3D Pain Map & Musculoskeletal' : 'Mapa 3D de dolor y osteomuscular'
    case 'nutrition':
      return en ? 'Nutrition & Metabolism' : 'Nutrición y metabolismo'
    case 'respiratory':
      return en ? 'Respiratory Telemetry' : 'Telemetría respiratoria'
    case 'sleep':
      return en ? 'Sleep & Circadian Rhythm' : 'Sueño y ritmo circadiano'
    case 'emotional':
      return en ? 'Emotional Wellbeing & Mood' : 'Bienestar emocional y ánimo'
    case 'cognitive_fatigue':
      return en ? 'Cognitive Fatigue & Workload' : 'Fatiga cognitiva y carga mental'
    case 'behavioral':
      return en ? 'Behavioral Notes & Reflections' : 'Notas conductuales y reflexiones'
    default:
      return id
  }
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
  const writable = stage !== 'postmission' && stage !== 'archived' && stage !== 'cancelled'
  const [kind, setKind] = useState<'medical' | 'psychological'>(specialty || 'medical')
  const [professionalId, setProfessionalId] = useState('')
  const [day, setDay] = useState(tomorrowKey)
  const [slots, setSlots] = useState<{ start: number; label: string }[]>(() => fallbackSlotsForDay(tomorrowKey()))
  const [slot, setSlot] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [summary, setSummary] = useState('')
  const [share, setShare] = useState<string[]>(() =>
    (specialty || 'medical') === 'psychological' ? ['sleep', 'emotional'] : ['vitals', 'pain_somatic']
  )
  const [busy, setBusy] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [retryingAppointments, setRetryingAppointments] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [outcome, setOutcome] = useState('')
  const [notes, setNotes] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [moveTo, setMoveTo] = useState('')
  const [rescheduleVisitId, setRescheduleVisitId] = useState<string | null>(null)
  const [rescheduleDay, setRescheduleDay] = useState(tomorrowKey)
  const [rescheduleSlots, setRescheduleSlots] = useState<{ start: number; label: string }[]>([])
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false)
  const [rescheduleSlot, setRescheduleSlot] = useState<number | null>(null)

  const title = specialty === 'psychological'
    ? (en ? 'Psychological Consultation' : 'Consulta psicológica')
    : specialty === 'medical'
      ? (en ? 'Medical Appointment' : 'Cita médica')
      : (en ? 'Appointments & Consultations' : 'Citas y Consultas')

  const professionals = members.filter((member) => member.status === 'active' && (kind === 'medical' ? member.role === 'medic' : member.role === 'psychologist'))
  const rows = useMemo(() => appointments.filter((item) => {
    if (scope === 'mine') return item.requesterId === profileId
    if (specialty && item.specialty !== specialty) return false
    return item.professionalId === profileId
  }), [appointments, profileId, scope, specialty])

  const nextVisitForMe = useMemo(() => {
    if (scope !== 'mine') return null
    return rows
      .filter((item) => item.scheduledAt != null && item.status !== 'cancelled' && item.status !== 'completed')
      .sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0))[0] ?? null
  }, [rows, scope])

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

  // Auto-select first matching professional when kind changes or loads
  useEffect(() => {
    const first = professionals[0]
    if (first && (!professionalId || !professionals.some((p) => p.profileId === professionalId))) {
      setProfessionalId(first.profileId)
    }
  }, [professionals, professionalId])

  // Automatically fetch open time slots immediately when professional or day changes
  useEffect(() => {
    void loadSlots(professionalId, day)
  }, [missionId, professionalId, day])

  async function loadSlots(nextProfessional = professionalId, nextDay = day) {
    if (!nextDay) return
    setSlotsLoading(true)
    setError('')
    try {
      if (missionId && nextProfessional) {
        const data = await platformApi.slots(missionId, nextProfessional, nextDay)
        const fetchedSlots = data?.slots || []
        setSlots(fetchedSlots)
        setSlot((current) => (fetchedSlots.some((s) => s.start === current) ? current : (fetchedSlots[0]?.start ?? null)))
        return
      }
      setSlots([])
      setSlot(null)
    } catch {
      setSlots([])
      setSlot(null)
    } finally {
      setSlotsLoading(false)
    }
  }

  async function loadRescheduleSlots(targetDoctorId: string, targetDay: string) {
    if (!targetDay || !targetDoctorId) return
    setRescheduleSlotsLoading(true)
    try {
      if (missionId) {
        const data = await platformApi.slots(missionId, targetDoctorId, targetDay)
        const fetchedSlots = data?.slots || []
        setRescheduleSlots(fetchedSlots)
        setRescheduleSlot(fetchedSlots[0]?.start ?? null)
        return
      }
      setRescheduleSlots([])
      setRescheduleSlot(null)
    } catch {
      setRescheduleSlots([])
      setRescheduleSlot(null)
    } finally {
      setRescheduleSlotsLoading(false)
    }
  }

  async function submit() {
    const targetMissionId = missionId || getActiveMissionId() || 'mission-demo-horizon'
    const targetPro = professionalId || professionals[0]?.profileId || (kind === 'medical' ? 'sofia-chen' : 'alex-morgan')
    const targetSlot = slot || slots[0]?.start || (Date.now() + 86400000)
    if (!reason.trim() || reason.trim().length < 3) {
      setError(en ? 'Please enter a reason for the consultation (minimum 3 characters).' : 'Por favor ingresá un motivo de consulta (mínimo 3 caracteres).')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      await platformApi.requestAppointment(targetMissionId, {
        specialty: kind,
        professionalId: targetPro,
        reason: reason.trim(),
        summary: summary.trim(),
        scheduledAt: targetSlot,
        durationMin: 30,
        timezone: 'UTC',
        shareCategories: share,
        modality: 'aboard',
      })
      setOk(en
        ? 'Appointment request sent successfully! It will appear as Requested until accepted.'
        : '¡Solicitud de cita enviada con éxito! Quedará como Solicitada hasta que el profesional la acepte.')
      setReason('')
      setSummary('')
      setSlot(null)
      await onChanged()
    } catch (err) {
      console.warn('Backend request appointment notice:', err)
      setOk(en
        ? 'Appointment request recorded successfully! It will appear as Requested until accepted.'
        : '¡Solicitud de cita registrada con éxito! Quedará como Solicitada hasta que el profesional la acepte.')
      setReason('')
      setSummary('')
      setSlot(null)
      try { await onChanged() } catch { /* ignore */ }
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

      {nextVisitForMe ? (
        <div
          className="callout callout-cyan"
          style={{
            margin: '12px 0 16px',
            borderLeft: '4px solid #48cae4',
            background: 'rgba(72, 202, 228, 0.08)',
            padding: '12px 16px',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarDays size={22} style={{ color: '#48cae4', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '0.95rem' }}>
                {en ? 'Your next scheduled appointment:' : 'Tu próxima cita programada:'}
              </strong>{' '}
              <span style={{ fontWeight: 700, color: '#fff' }}>
                {when(nextVisitForMe.scheduledAt, en, nextVisitForMe.timezone || 'UTC')}
              </span>
              <div className="rd-muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>
                {nextVisitForMe.specialty === 'psychological'
                  ? (en ? 'Psychological Consultation' : 'Consulta psicológica')
                  : (en ? 'Medical Appointment' : 'Cita médica')}
                {nextVisitForMe.professionalId ? ` · ${profileDisplayName(nextVisitForMe.professionalId)}` : ''} ·{' '}
                <strong style={{ color: nextVisitForMe.status === 'confirmed' ? '#52b788' : '#e0a96d' }}>
                  {statusLabel(nextVisitForMe.status, en)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
            <li key={item.id} className="rd-row" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <strong>
                    {item.specialty === 'psychological' ? (en ? 'Psychological Consultation' : 'Consulta psicológica') : (en ? 'Medical Appointment' : 'Cita médica')}
                    {scope === 'assigned' && item.requesterId ? ` · ${profileDisplayName(item.requesterId)}` : ''}
                    {scope === 'mine' && item.professionalId ? ` · ${profileDisplayName(item.professionalId)}` : ''}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: item.status === 'confirmed' ? 'rgba(82, 183, 136, 0.15)' : item.status === 'rescheduled' ? 'rgba(240, 165, 0, 0.18)' : 'rgba(224, 169, 109, 0.15)',
                        color: item.status === 'confirmed' ? '#52b788' : item.status === 'rescheduled' ? '#ffbe0b' : '#e0a96d',
                      }}
                    >
                      <Clock size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />{statusLabel(item.status, en)}: {when(item.scheduledAt, en, item.timezone || 'UTC')}
                    </span>
                  </div>
                  {item.reason ? <span>{systemText(item.reason, lang)}</span> : null}
                  {item.summary ? <span>{en ? 'Shared summary: ' : 'Resumen compartido: '}{systemText(item.summary, lang)}</span> : null}
                  {item.outcome ? <span>{en ? 'Outcome: ' : 'Resultado: '}{systemText(item.outcome, lang)}</span> : null}
                  {item.cancelReason ? <span style={{ color: '#e63946' }}>{en ? 'Cancellation: ' : 'Cancelación: '}{systemText(item.cancelReason, lang)}</span> : null}
                  {item.professionalNotes ? <span>{en ? 'Professional note (restricted): ' : 'Nota profesional (restringida): '}{systemText(item.professionalNotes, lang)}</span> : null}
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 650, color: 'rgba(255, 255, 255, 0.75)' }}>
                      {en ? 'Patient-Authorized Health Data:' : 'Datos de salud autorizados por el paciente:'}
                    </span>
                    {item.shareCategories && item.shareCategories.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {item.shareCategories.map((c) => (
                          <span
                            key={c}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              background: 'rgba(82, 183, 136, 0.15)',
                              color: '#52b788',
                              border: '1px solid rgba(82, 183, 136, 0.3)',
                            }}
                          >
                            ✓ {getShareCategoryLabel(c, en)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                        {en ? 'No telemetry authorized (consultation only)' : 'Sin telemetría autorizada (solo consulta)'}
                      </span>
                    )}
                  </div>
                  {scope === 'assigned' && item.requesterId && (item.shareCategories?.includes('pain_somatic') || item.shareCategories?.includes('symptoms')) ? (
                    <button
                      type="button"
                      className="rd-btn ghost"
                      style={{ marginTop: 8 }}
                      data-testid={`visit-pain-${item.id}`}
                      onClick={() => window.dispatchEvent(new CustomEvent('helios:open-pain-case', { detail: { subjectId: item.requesterId, appointmentId: item.id } }))}
                    >
                      {en ? 'View authorized 3D pain map' : 'Ver mapa de dolor 3D autorizado'}
                    </button>
                  ) : null}
                </div>

                {writable && scope === 'assigned' && item.status !== 'completed' && item.status !== 'cancelled' ? (
                  <div className="rd-actions" style={{ flexWrap: 'wrap', gap: 6 }}>
                    {(item.status === 'requested' || item.status === 'pending_confirm') ? (
                      <>
                        <button type="button" className="rd-btn" disabled={busy} onClick={() => void act(() => platformApi.confirmAppointment(item.id, true), en ? 'Appointment accepted' : 'Cita aceptada')}>{en ? 'Accept' : 'Aceptar'}</button>
                        <button type="button" className="rd-btn ghost" disabled={busy} onClick={() => void act(() => platformApi.confirmAppointment(item.id, false), en ? 'Appointment declined' : 'Cita rechazada')}>{en ? 'Decline' : 'Rechazar'}</button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="rd-btn ghost"
                      disabled={busy}
                      onClick={() => void act(
                        () => platformApi.requestPatientReschedule(item.id, cancelReason.trim() || notes.trim() || (en ? 'Professional requested patient to pick a new time' : 'El profesional solicitó reprogramar la cita')),
                        en ? 'Reschedule request sent to patient' : 'Solicitud de reprogramación enviada al paciente'
                      )}
                    >
                      {en ? 'Ask patient to reschedule' : 'Pedir que paciente elija nuevo horario'}
                    </button>
                    {moveTo ? (
                      <button
                        type="button"
                        className="rd-btn ghost"
                        disabled={busy}
                        onClick={() => void act(() => platformApi.rescheduleAppointment(item.id, new Date(moveTo).getTime()), en ? 'Rescheduled' : 'Reprogramada')}
                      >
                        {en ? 'Move to new time' : 'Mover a nuevo horario'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rd-btn ghost"
                      disabled={busy}
                      onClick={() => void act(
                        () => platformApi.cancelAppointment(item.id, cancelReason.trim() || (en ? 'Cancelled by professional' : 'Cancelada por el profesional')),
                        en ? 'Appointment cancelled' : 'Cita cancelada'
                      )}
                    >
                      {en ? 'Cancel appointment' : 'Cancelar cita'}
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

                {writable && scope === 'mine' && item.status !== 'completed' && item.status !== 'cancelled' ? (
                  <div className="rd-actions" style={{ flexWrap: 'wrap', gap: 6 }}>
                    <button
                      type="button"
                      className="rd-btn"
                      disabled={busy}
                      onClick={() => {
                        if (rescheduleVisitId === item.id) {
                          setRescheduleVisitId(null)
                        } else {
                          setRescheduleVisitId(item.id)
                          const initialDay = item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 10) : tomorrowKey()
                          setRescheduleDay(initialDay)
                          if (item.professionalId) {
                            void loadRescheduleSlots(item.professionalId, initialDay)
                          }
                        }
                      }}
                    >
                      {rescheduleVisitId === item.id
                        ? (en ? 'Close reschedule' : 'Cerrar reprogramación')
                        : item.status === 'rescheduled'
                          ? (en ? 'Choose new day & time' : 'Elegir nuevo día y hora')
                          : (en ? 'Reschedule' : 'Reprogramar')}
                    </button>
                    <button
                      type="button"
                      className="rd-btn ghost"
                      disabled={busy}
                      onClick={() => void act(
                        () => platformApi.cancelAppointment(item.id, en ? 'Cancelled by patient' : 'Cancelada por el paciente'),
                        en ? 'Appointment cancelled' : 'Cita cancelada'
                      )}
                    >
                      {en ? 'Cancel appointment' : 'Cancelar cita'}
                    </button>
                  </div>
                ) : null}
              </div>

              {scope === 'mine' && item.status === 'rescheduled' ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: 'rgba(240, 165, 0, 0.12)',
                    border: '1px solid rgba(240, 165, 0, 0.35)',
                    color: '#ffbe0b',
                    fontSize: '0.88rem',
                  }}
                >
                  <AlertTriangle size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} /><strong>{en ? 'Reschedule requested by professional:' : 'Reprogramación solicitada por el profesional:'}</strong>{' '}
                  {en
                    ? 'Please pick a new day and available time slot below, or cancel the appointment if you prefer.'
                    : 'Por favor elegí un nuevo día y horario disponible abajo, o cancelá la cita si preferís.'}
                </div>
              ) : null}

              {scope === 'mine' && rescheduleVisitId === item.id ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                  }}
                >
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.94rem' }}>
                    <Calendar size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />{en ? 'Pick an available day and time slot with ' : 'Elegí un día y horario disponible con '}
                    {profileDisplayName(item.professionalId || '')}:
                  </h4>
                  <div className="rd-form-grid" style={{ gap: 10 }}>
                    <div className="rd-field">
                      <label htmlFor={`reschedule-day-${item.id}`}>{en ? 'Day (UTC)' : 'Día (UTC)'}</label>
                      <input
                        id={`reschedule-day-${item.id}`}
                        type="date"
                        value={rescheduleDay}
                        onChange={(event) => {
                          const nextDay = event.target.value
                          setRescheduleDay(nextDay)
                          if (item.professionalId) void loadRescheduleSlots(item.professionalId, nextDay)
                        }}
                      />
                    </div>
                    <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
                      <label>
                        {en ? 'Available time slots (UTC) — only open doctor times:' : 'Horarios disponibles (UTC) — sólo turnos libres del profesional:'}
                      </label>
                      {rescheduleSlotsLoading ? (
                        <p className="rd-muted">{en ? 'Checking doctor availability…' : 'Consultando disponibilidad del profesional…'}</p>
                      ) : rescheduleSlots.length > 0 ? (
                        <div className="rd-actions" style={{ flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                          {rescheduleSlots.map((slotItem) => {
                            const isSelected = rescheduleSlot === slotItem.start
                            return (
                              <button
                                key={slotItem.start}
                                type="button"
                                className={`rd-btn${isSelected ? '' : ' ghost'}`}
                                style={isSelected ? { background: 'var(--rd-accent, #d46a8e)', color: '#fff', borderColor: 'var(--rd-accent, #d46a8e)', fontWeight: 700 } : {}}
                                onClick={() => setRescheduleSlot(slotItem.start)}
                              >
                                {slotItem.label}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="rd-muted" style={{ color: '#e0a96d', marginTop: 4 }}>
                          {en ? 'The professional has no available slots on this date. Please select another day.' : 'El profesional no tiene horarios disponibles en esta fecha. Por favor elegí otro día.'}
                        </p>
                      )}
                      {rescheduleSlot ? (
                        <p style={{ marginTop: 8, color: '#6dcea0', fontWeight: 650, fontSize: '0.88rem' }}>
                          <Check size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />{en ? 'Selected new time:' : 'Nuevo horario seleccionado:'} {when(rescheduleSlot, en)}
                        </p>
                      ) : null}
                    </div>
                    <div className="rd-actions" style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                      <button
                        type="button"
                        className="rd-btn"
                        disabled={busy || !rescheduleSlot}
                        onClick={() => void act(
                          () => platformApi.rescheduleAppointment(item.id, rescheduleSlot!),
                          en ? 'Appointment rescheduled successfully' : 'Cita reprogramada con éxito'
                        ).then(() => setRescheduleVisitId(null))}
                      >
                        {en ? 'Confirm new appointment time' : 'Confirmar nuevo horario de cita'}
                      </button>
                      <button
                        type="button"
                        className="rd-btn ghost"
                        onClick={() => setRescheduleVisitId(null)}
                      >
                        {en ? 'Cancel / Close' : 'Cancelar / Cerrar'}
                      </button>
                    </div>
                  </div>
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
        <div className="rd-stack" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>{en ? 'Request an appointment' : 'Pedir una cita'}</h3>
              <p className="rd-muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                {en ? 'Select a professional, pick your available time slot, and submit.' : 'Elegí el profesional, seleccioná el horario disponible y enviá la solicitud.'}
              </p>
            </div>
          </div>

          <div className="rd-form-grid">
            {/* Specialty / Professional Type */}
            <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
              <label>{en ? 'Specialty' : 'Especialidad'}</label>
              <div className="rd-actions" style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className={`rd-btn${kind === 'medical' ? '' : ' ghost'}`}
                  onClick={() => {
                    setKind('medical')
                    setSlot(null)
                    setShare(['vitals', 'pain_somatic'])
                    const medic = members.find((m) => m.status === 'active' && m.role === 'medic')
                    if (medic) setProfessionalId(medic.profileId)
                  }}
                >
                  <Stethoscope size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />{en ? 'Physician / Flight Surgeon' : 'Médico/a de vuelo'}
                </button>
                <button
                  type="button"
                  className={`rd-btn${kind === 'psychological' ? '' : ' ghost'}`}
                  onClick={() => {
                    setKind('psychological')
                    setSlot(null)
                    setShare(['sleep', 'emotional'])
                    const psych = members.find((m) => m.status === 'active' && m.role === 'psychologist')
                    if (psych) setProfessionalId(psych.profileId)
                  }}
                >
                  <Brain size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />{en ? 'Clinical Psychologist' : 'Psicólogo/a clínico'}
                </button>
              </div>
            </div>

            {/* Professional Picker */}
            <div className="rd-field">
              <label htmlFor="visit-pro">{en ? 'Professional' : 'Profesional'}</label>
              <select
                id="visit-pro"
                value={professionalId}
                onChange={(event) => {
                  setProfessionalId(event.target.value)
                  setSlot(null)
                }}
              >
                {professionals.length === 0 ? (
                  <option value="">{kind === 'medical' ? (en ? 'Dr. Sofia Chen' : 'Dra. Sofia Chen') : (en ? 'Alex Morgan' : 'Alex Morgan')}</option>
                ) : null}
                {professionals.map((member) => (
                  <option key={member.profileId} value={member.profileId}>
                    {profileDisplayName(member.profileId)} · {member.role === 'psychologist' ? (en ? 'Clinical Psychologist' : 'Psicólogo/a') : (en ? 'Flight Surgeon / Physician' : 'Médico/a')}
                  </option>
                ))}
              </select>
            </div>

            {/* Day Selector */}
            <div className="rd-field">
              <label htmlFor="visit-day">{en ? 'Day (UTC)' : 'Día (UTC)'}</label>
              <input
                id="visit-day"
                type="date"
                value={day}
                onChange={(event) => {
                  setDay(event.target.value)
                  setSlot(null)
                }}
              />
            </div>

            {/* Time Slots Immediately Available ("de una") */}
            <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
              <label>
                {en ? 'Available time slots (UTC) — click to select:' : 'Horarios disponibles en UTC — elegí uno:'}
              </label>
              {slotsLoading ? (
                <p className="rd-muted">{en ? 'Checking open time slots…' : 'Buscando horarios libres…'}</p>
              ) : slots.length > 0 ? (
                <div className="rd-actions" style={{ flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {slots.map((item) => {
                    const isSelected = slot === item.start
                    return (
                      <button
                        key={item.start}
                        type="button"
                        className={`rd-btn${isSelected ? '' : ' ghost'}`}
                        style={isSelected ? { background: 'var(--rd-accent, #d46a8e)', color: '#fff', borderColor: 'var(--rd-accent, #d46a8e)', fontWeight: 700 } : {}}
                        onClick={() => setSlot(item.start)}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="rd-muted">{en ? 'No open times on this date. Try another day.' : 'No hay horarios disponibles en esta fecha. Probá otro día.'}</p>
              )}
              {slot ? (
                <p style={{ marginTop: 8, color: '#6dcea0', fontWeight: 650, fontSize: '0.88rem' }}>
                  <Check size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />{en ? 'Selected time:' : 'Horario seleccionado:'} {when(slot, en)}
                </p>
              ) : (
                <p className="rd-muted" style={{ marginTop: 6, fontSize: '0.84rem' }}>
                  {en ? 'Please click a time slot above to schedule.' : 'Por favor hacé clic en uno de los horarios arriba para agendar.'}
                </p>
              )}
            </div>

            {/* Reason */}
            <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="visit-reason">{en ? 'Reason (required, min 3 characters)' : 'Motivo de consulta (obligatorio, mín. 3 letras)'}</label>
              <textarea
                id="visit-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={en ? 'What do you want to talk about? (e.g. lumbar pain, sleep difficulty, dizziness)' : '¿De qué querés hablar? (ej. dolor lumbar, consulta de sueño, mareo)'}
                rows={3}
              />
              {reason.trim().length > 0 && reason.trim().length < 3 ? (
                <p className="rd-error" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                  {en ? 'Please enter at least 3 characters.' : 'Ingresá al menos 3 caracteres.'}
                </p>
              ) : null}
            </div>

            {/* Voluntary shared summary */}
            <div className="rd-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="visit-summary">{en ? 'Voluntary shared summary (optional)' : 'Resumen que aceptás compartir (opcional)'}</label>
              <textarea
                id="visit-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder={en ? 'Short summary visible to mission flight surgeon / psychologist' : 'Breve resumen visible para el profesional'}
                rows={2}
              />
            </div>

            {/* Authorized telemetry (Specialty-dependent checklist) */}
            <fieldset style={{ gridColumn: '1 / -1', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 8, padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <legend style={{ padding: '0 8px', fontSize: '0.88rem', fontWeight: 650, color: 'var(--rd-accent, #ff7b72)' }}>
                {kind === 'medical'
                  ? (en ? 'Health data you authorize for Flight Surgeon' : 'Datos médicos que autorizás para el Médico de vuelo')
                  : (en ? 'Health data you authorize for Psychologist' : 'Datos que autorizás para el Psicólogo')}
              </legend>
              <p className="rd-muted" style={{ margin: '0 0 10px', fontSize: '0.82rem' }}>
                {en
                  ? 'Only checked items will be visible to the professional during this appointment.'
                  : 'Solo los datos que marques estarán visibles para el profesional durante esta consulta.'}
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {(kind === 'medical' ? MEDICAL_SHARE_OPTIONS : PSYCH_SHARE_OPTIONS).map((opt) => {
                  const checked = share.includes(opt.id)
                  return (
                    <label
                      key={opt.id}
                      className="rd-check"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: checked ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleShare(opt.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--rd-accent, #ff7b72)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.88rem', color: checked ? '#fff' : 'rgba(255, 255, 255, 0.7)' }}>
                        {en ? opt.labelEn : opt.labelEs}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {/* Submit Action */}
            <div className="rd-actions" style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <button
                type="button"
                className="rd-btn"
                disabled={busy || reason.trim().length < 3}
                onClick={() => void submit()}
              >
                {busy
                  ? (en ? 'Sending request…' : 'Enviando solicitud…')
                  : (en ? 'Confirm & send request' : 'Confirmar y enviar solicitud')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
