import { systemText } from '../../systemText'
import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { CrewArt } from '../../components/role/RoleArt'
import { DailyCarePanel } from '../../components/role/DailyCarePanel'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

/** Mi día — vista rápida del turno (no es una copia de Mi salud). */
export function CrewHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const {
    missionId,
    profile,
    detail,
    wakeNote,
    symptoms,
    appointments,
    grants,
    loading,
    error,
    role,
    mode,
    refresh,
  } = useMissionWorkspace()
  const name = profile?.displayName?.split(' ')[0] || (en ? 'crew' : 'tripulante')
  const stage = detail?.mission.stage
  const incomplete = stage === 'aboard' && (!wakeNote || /incomplete|sin completar|pending/i.test(wakeNote))
  const ask = incomplete

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'My day' : 'Mi día'}</p>
        <h1>
          {ask
            ? (en ? 'How are you feeling today?' : '¿Cómo te sentís hoy?')
            : (en ? `Hi, ${name}` : `Hola, ${name}`)}
        </h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
        />
        <p className="rd-muted">
          {en
            ? 'A quick view of today. Use My Health for indicators, body map, consents, and full follow-up.'
            : 'Vista rápida de hoy. Usá Mi salud para indicadores, mapa corporal, permisos y el seguimiento completo.'}
        </p>
      </header>

      {error ? <p className="rd-error" role="alert">{systemText(error)}</p> : null}
      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <DailyCarePanel
        variant="quick"
        missionId={missionId}
        wakeNote={systemText(wakeNote)}
        symptomCount={symptoms.length}
        appointmentCount={appointments.length}
        stage={stage}
        onChanged={() => refresh({ silent: true })}
      />

      <div className="rd-band">
        <section className="rd-card">
          <h2>{en ? 'Care shortcuts' : 'Atajos de cuidado'}</h2>
          <p className="rd-muted">
            {incomplete
              ? (en ? 'Daily Check-in still open.' : 'El chequeo del día sigue pendiente.')
              : (en ? 'Daily Check-in recorded.' : 'Chequeo diario registrado.')}
          </p>
          <div className="rd-actions">
            <Link className="rd-btn" to="/app/mi-salud">{en ? 'Medical Appointment' : 'Cita médica'}</Link>
            <Link className="rd-btn ghost" to="/app/mi-salud">
              {en ? `My Health · grants ${grants.length}` : `Mi salud · permisos ${grants.length}`}
            </Link>
          </div>
        </section>
        <section className="rd-card">
          <h2>{en ? 'Mission links' : 'Enlaces de misión'}</h2>
          <div className="rd-actions">
            <Link className="rd-btn ghost" to="/app/mi-salud">{en ? 'Full health hub' : 'Hub de salud'}</Link>
            <Link className="rd-btn ghost" to="/app/mision">{en ? 'Mission' : 'Misión'}</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
