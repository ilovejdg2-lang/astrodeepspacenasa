import { CalendarDays } from 'lucide-react'
import { useLocale } from '../i18n'
import { AppointmentDesk, type VisitRow } from '../components/mission/AppointmentDesk'
import { SharedCareSummaries } from '../components/quiron/SharedCareSummaries'
import { systemText } from '../systemText'
import { useMissionWorkspace } from './role/useMissionWorkspace'
import '../platform/role-dash.css'

export function MedicalPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { missionId, profile, detail, appointments, appointmentsLoading, appointmentsError, loading, error, refresh, role } = useMissionWorkspace()

  return (
    <div className="med-page">
      <header className="med-head">
        <p className="kicker">{en ? 'Medical team' : 'Equipo médico'}</p>
        <h1>{en ? 'Analysis and medical appointments' : 'Análisis y citas médicas'}</h1>
        <p className="lede">
          {en
            ? 'Schedule or complete visits with mission doctors. This is not the Earth-link message queue.'
            : 'Agendá o completá visitas con los médicos de la misión. Esto no es la cola de mensajes con Tierra.'}
        </p>
      </header>

      <section className="med-panel med-appointments" aria-labelledby="med-appts">
        <h2 id="med-appts">
          <CalendarDays size={28} strokeWidth={1.75} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 10 }} />
          {en ? 'Doctor appointments' : 'Citas con médicos'}
        </h2>
        <p className="muted">
          {en
            ? 'Request, confirm, reschedule, or complete medical visits with authorized mission physicians. Sharing still needs the person’s permission.'
            : 'Pedí, confirmá, reprogramá o completá visitas médicas con médicos autorizados de la misión. Compartir sigue necesitando permiso de la persona.'}
        </p>
        {error ? (
          <div className="callout callout-amber" role="alert">
            <p>{systemText(error, lang)}</p>
            <button type="button" className="rd-btn ghost" disabled={loading} onClick={() => void refresh()}>
              {en ? 'Retry loading medical workspace' : 'Reintentar carga médica'}
            </button>
          </div>
        ) : null}
        {loading ? <p className="muted">{en ? 'Loading appointments…' : 'Cargando citas…'}</p> : null}
        {missionId && !error ? (
          <AppointmentDesk
            missionId={missionId}
            stage={detail?.mission.stage}
            profileId={profile?.id}
            scope={role === 'medic' ? 'assigned' : 'mine'}
            specialty="medical"
            members={detail?.members || []}
            appointments={appointments as VisitRow[]}
            appointmentsLoading={appointmentsLoading}
            loadError={appointmentsError}
            onChanged={() => refresh({ silent: true })}
          />
        ) : !missionId ? (
          <p className="muted" data-testid="med-no-mission">
            {en
              ? 'Enter an active mission to schedule doctor appointments.'
              : 'Entrá a una misión activa para agendar citas médicas.'}
          </p>
        ) : null}
      </section>

      <div className="med-rest">
        <SharedCareSummaries />
      </div>
    </div>
  )
}
