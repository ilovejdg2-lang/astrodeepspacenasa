import { Brain, CalendarDays, Clock3, Stethoscope } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { VisitRow } from '../components/mission/AppointmentDesk'
import { useLocale } from '../i18n'
import { platformApi } from '../platform/api'
import { profileDisplayName } from '../platform/copy'
import { getActiveMissionId, getStoredProfile } from '../platform/session'
import { systemText } from '../systemText'
import '../platform/role-dash.css'

type SpecialtyFilter = 'all' | 'medical' | 'psychological'
type StatusFilter = 'all' | 'requested' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled'
type PeriodFilter = 'all' | 'upcoming' | 'past'

const STATUSES = new Set<StatusFilter>([
  'requested',
  'confirmed',
  'rescheduled',
  'completed',
  'cancelled',
])

function isVisitRow(value: unknown): value is VisitRow {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return typeof row.id === 'string' && typeof row.requesterId === 'string'
}

function visitStatus(status: string | undefined, en: boolean) {
  const labels: Record<string, [string, string]> = {
    requested: ['Solicitada', 'Requested'],
    pending_confirm: ['Pendiente de confirmación', 'Awaiting confirmation'],
    confirmed: ['Confirmada', 'Confirmed'],
    rescheduled: ['Reprogramada', 'Rescheduled'],
    completed: ['Realizada', 'Completed'],
    cancelled: ['Cancelada', 'Cancelled'],
  }
  const pair = labels[status || '']
  if (!pair) return status || (en ? 'Unknown status' : 'Estado sin especificar')
  return pair[en ? 1 : 0]
}

function visitDate(timestamp: number | null | undefined, en: boolean) {
  if (timestamp == null) return en ? 'Time not set' : 'Horario pendiente'
  return new Intl.DateTimeFormat(en ? 'en-US' : 'es-CR', {
    timeZone: 'UTC',
    dateStyle: 'long',
    timeStyle: 'short',
    hourCycle: 'h23',
  }).format(timestamp) + ' UTC'
}

function isOpen(status: string | undefined) {
  return status !== 'cancelled' && status !== 'completed'
}

function matchesStatus(visitStatusValue: string | undefined, filter: StatusFilter) {
  if (filter === 'all') return true
  if (filter === 'requested') {
    return visitStatusValue === 'requested' || visitStatusValue === 'pending_confirm'
  }
  return visitStatusValue === filter
}

export function MySpacePage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const missionId = getActiveMissionId()
  const profile = getStoredProfile()
  const [appointments, setAppointments] = useState<unknown[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState('')
  const [reload, setReload] = useState(0)
  const [specialty, setSpecialty] = useState<SpecialtyFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [period, setPeriod] = useState<PeriodFilter>('upcoming')
  const now = Date.now()

  useEffect(() => {
    let active = true
    if (!missionId) {
      setAppointments([])
      setAppointmentsError('')
      setAppointmentsLoading(false)
      return () => { active = false }
    }

    setAppointmentsLoading(true)
    setAppointmentsError('')
    platformApi.appointments(missionId)
      .then((data) => {
        if (active) setAppointments(data.items)
      })
      .catch((error: unknown) => {
        if (!active) return
        setAppointments([])
        setAppointmentsError(error instanceof Error ? error.message : 'Could not load appointments')
      })
      .finally(() => {
        if (active) setAppointmentsLoading(false)
      })
    return () => { active = false }
  }, [missionId, reload])

  const mine = useMemo(
    () => appointments.filter(isVisitRow).filter((visit) => visit.requesterId === profile?.id),
    [appointments, profile?.id],
  )

  const upcomingCount = mine.filter(
    (visit) => visit.scheduledAt != null && visit.scheduledAt >= now && isOpen(visit.status),
  ).length
  const pendingCount = mine.filter(
    (visit) => visit.status === 'requested' || visit.status === 'pending_confirm',
  ).length
  const completedCount = mine.filter((visit) => visit.status === 'completed').length

  const visible = mine
    .filter((visit) => specialty === 'all' || visit.specialty === specialty)
    .filter((visit) => matchesStatus(visit.status, status))
    .filter((visit) => {
      if (period === 'all') return true
      if (visit.scheduledAt == null) return false
      return period === 'upcoming'
        ? visit.scheduledAt >= now && isOpen(visit.status)
        : visit.scheduledAt < now || visit.status === 'completed'
    })
    .sort((left, right) => (left.scheduledAt ?? Infinity) - (right.scheduledAt ?? Infinity))

  return (
    <div className="rd rd-crew">
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Private health space' : 'Espacio privado de salud'}</p>
        <h1>{en ? 'My appointments' : 'Mis citas'}</h1>
        <p className="rd-muted">
          {en
            ? 'See your medical and psychology appointments in one place. This list uses your mission records and only shows information shared for each visit.'
            : 'Consultá tus citas médicas y psicológicas en un solo lugar. La lista usa los registros de tu misión y solo muestra la información compartida para cada cita.'}
        </p>
      </header>

      <section className="rd-schedule-summary" aria-label={en ? 'Appointment summary' : 'Resumen de citas'}>
        <div>
          <span>{en ? 'Upcoming' : 'Próximas'}</span>
          <strong>{upcomingCount} {en ? 'appointments' : 'citas'}</strong>
        </div>
        <div>
          <span>{en ? 'Awaiting confirmation' : 'Por confirmar'}</span>
          <strong>{pendingCount} {en ? 'requests' : 'solicitudes'}</strong>
        </div>
        <div>
          <span>{en ? 'Completed' : 'Realizadas'}</span>
          <strong>{completedCount} {en ? 'visits' : 'consultas'}</strong>
        </div>
      </section>

      <section className="rd-card" aria-labelledby="my-appointments-title">
        <div>
          <h2 id="my-appointments-title">{en ? 'Your appointments' : 'Tus citas'}</h2>
          <p className="rd-muted">
            {en
              ? 'Demo records come from the mission backend. They are not a diagnosis or a substitute for professional care.'
              : 'Los registros de demostración vienen del backend de la misión. No son un diagnóstico ni sustituyen la atención profesional.'}
          </p>
        </div>

        <div className="rd-form-grid">
          <div className="rd-field">
            <label htmlFor="appointment-specialty">{en ? 'Specialty' : 'Especialidad'}</label>
            <select
              id="appointment-specialty"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value as SpecialtyFilter)}
            >
              <option value="all">{en ? 'All specialties' : 'Todas las especialidades'}</option>
              <option value="medical">{en ? 'Medical' : 'Medicina'}</option>
              <option value="psychological">{en ? 'Psychology' : 'Psicología'}</option>
            </select>
          </div>
          <div className="rd-field">
            <label htmlFor="appointment-status">{en ? 'Status' : 'Estado'}</label>
            <select
              id="appointment-status"
              value={status}
              onChange={(event) => {
                const next = event.target.value
                setStatus(next === 'all' || STATUSES.has(next as StatusFilter) ? next as StatusFilter : 'all')
              }}
            >
              <option value="all">{en ? 'All statuses' : 'Todos los estados'}</option>
              <option value="requested">{en ? 'Requested' : 'Solicitada'}</option>
              <option value="confirmed">{en ? 'Confirmed' : 'Confirmada'}</option>
              <option value="rescheduled">{en ? 'Rescheduled' : 'Reprogramada'}</option>
              <option value="completed">{en ? 'Completed' : 'Realizada'}</option>
              <option value="cancelled">{en ? 'Cancelled' : 'Cancelada'}</option>
            </select>
          </div>
          <div className="rd-field">
            <label htmlFor="appointment-period">{en ? 'Date' : 'Fecha'}</label>
            <select
              id="appointment-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
            >
              <option value="upcoming">{en ? 'Upcoming' : 'Próximas'}</option>
              <option value="past">{en ? 'Past' : 'Anteriores'}</option>
              <option value="all">{en ? 'Any date' : 'Cualquier fecha'}</option>
            </select>
          </div>
        </div>

        {!missionId ? (
          <div className="rd-empty">
            <strong>{en ? 'No active mission' : 'No hay una misión activa'}</strong>
            <span className="rd-muted">
              {en ? 'Choose a mission to see its appointment records.' : 'Elegí una misión para consultar sus citas.'}
            </span>
            <Link className="rd-btn ghost" style={{ minHeight: 44 }} to="/misiones">
              {en ? 'Browse missions' : 'Ver misiones'}
            </Link>
          </div>
        ) : appointmentsError ? (
          <div className="rd-empty" role="alert">
            <p className="rd-error">
              {systemText(appointmentsError, lang)}
            </p>
            <button
              className="rd-btn ghost"
              type="button"
              disabled={appointmentsLoading}
              style={{ minHeight: 44 }}
              onClick={() => setReload((current) => current + 1)}
            >
              {appointmentsLoading
                ? (en ? 'Loading…' : 'Cargando…')
                : (en ? 'Retry' : 'Reintentar')}
            </button>
          </div>
        ) : appointmentsLoading ? (
          <p className="rd-muted" role="status">{en ? 'Loading appointments…' : 'Cargando citas…'}</p>
        ) : visible.length === 0 ? (
          <div className="rd-empty">
            <strong>{en ? 'No appointments match these filters' : 'No hay citas con estos filtros'}</strong>
            <span className="rd-muted">
              {en ? 'Try another specialty, status, or date range.' : 'Probá otra especialidad, estado o período.'}
            </span>
          </div>
        ) : (
          <ul className="rd-list">
            {visible.map((visit) => {
              const isPsychology = visit.specialty === 'psychological'
              const Icon = isPsychology ? Brain : Stethoscope
              return (
                <li className="rd-row" key={visit.id} style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="rd-actions">
                      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      <strong>
                        {isPsychology
                          ? (en ? 'Psychology appointment' : 'Cita de psicología')
                          : (en ? 'Medical appointment' : 'Cita médica')}
                      </strong>
                      <span>{visitStatus(visit.status, en)}</span>
                    </div>
                    <span>
                      {en ? 'With ' : 'Con '}
                      {visit.professionalId
                        ? profileDisplayName(visit.professionalId)
                        : (en ? 'Professional pending' : 'Profesional pendiente')}
                    </span>
                    <span><CalendarDays size={14} aria-hidden="true" /> {visitDate(visit.scheduledAt, en)}</span>
                    {visit.durationMin ? (
                      <span><Clock3 size={14} aria-hidden="true" /> {visit.durationMin} {en ? 'minutes' : 'minutos'}</span>
                    ) : null}
                    {visit.reason ? <p>{visit.reason}</p> : null}
                    {visit.summary ? (
                      <p><strong>{en ? 'Shared summary: ' : 'Resumen compartido: '}</strong>{visit.summary}</p>
                    ) : null}
                    {visit.outcome ? (
                      <p><strong>{en ? 'Visit outcome: ' : 'Resultado de la cita: '}</strong>{visit.outcome}</p>
                    ) : null}
                    {visit.shareCategories?.length ? (
                      <span>
                        {en ? 'Shared for this visit: ' : 'Compartido para esta cita: '}
                        {visit.shareCategories.join(', ')}
                      </span>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="rd-actions">
          <Link className="rd-btn" style={{ minHeight: 44 }} to="/app/mi-salud">
            {en ? 'Request an appointment' : 'Solicitar una cita'}
          </Link>
        </div>
      </section>
    </div>
  )
}
