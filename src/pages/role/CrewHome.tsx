import { systemText } from '../../systemText'
import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
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
  const incomplete = !wakeNote || /incomplete|sin completar|pending/i.test(wakeNote)

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'My day' : 'Mi día'}</p>
        <h1>{en ? `Hi, ${name}. How are you feeling today?` : `Hola, ${name}. ¿Cómo te sentís hoy?`}</h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
        />
        <p className="rd-muted">
          {en
            ? 'A quick view of today. Use My health for indicators, body map, consents, and full follow-up.'
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
        onChanged={() => refresh({ silent: true })}
      />

      <div className="rd-band">
        <section className="rd-card">
          <h2>{en ? 'Care shortcuts' : 'Atajos de cuidado'}</h2>
          <p className="rd-muted">
            {incomplete
              ? (en ? 'Daily check-in still open.' : 'El chequeo del día sigue pendiente.')
              : (en ? 'Daily check-in recorded.' : 'Chequeo del día registrado.')}
          </p>
          <div className="rd-actions">
            <button
              type="button"
              className="rd-btn"
              disabled={!missionId}
              onClick={() => void (async () => {
                if (!missionId) return
                await platformApi.requestAppointment(missionId, {
                  specialty: 'medico',
                  reason: en ? 'Non-urgent follow-up' : 'Seguimiento no urgente',
                  modality: 'aboard',
                })
                await refresh({ silent: true })
              })()}
            >
              {en ? 'Request care' : 'Solicitar atención'}
            </button>
            <Link className="rd-btn ghost" to="/app/mi-salud">
              {en ? `My health · grants ${grants.length}` : `Mi salud · permisos ${grants.length}`}
            </Link>
          </div>
        </section>
        <section className="rd-card">
          <h2>{en ? 'Mission links' : 'Enlaces de misión'}</h2>
          <div className="rd-actions">
            <Link className="rd-btn ghost" to="/app/monitor">{en ? 'Monitor' : 'Monitor'}</Link>
            <Link className="rd-btn ghost" to="/app/alertas">{en ? 'Alerts' : 'Alertas'}</Link>
            <Link className="rd-btn ghost" to="/app/mi-salud">{en ? 'Full health hub' : 'Hub de salud'}</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
