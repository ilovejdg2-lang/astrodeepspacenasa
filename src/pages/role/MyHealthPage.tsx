import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { roleLabel } from '../../platform/copy'
import { CrewArt } from '../../components/role/RoleArt'
import { DailyCarePanel } from '../../components/role/DailyCarePanel'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

export function MyHealthPage() {
  const { lang } = useLocale()
  const en = lang === 'en'
  useEffect(() => {
    document.title = en ? 'HELIOS · My health' : 'HELIOS · Mi salud'
  }, [en])
  const {
    missionId,
    detail,
    role,
    mode,
    profile,
    wakeNote,
    symptoms,
    appointments,
    grants,
    loading,
    refresh,
  } = useMissionWorkspace()

  return (
    <div className="rd rd-crew">
      <div className="rd-bg" aria-hidden="true"><CrewArt /></div>
      <header className="rd-head">
        <p className="rd-kicker">{en ? 'Personal space' : 'Espacio personal'}</p>
        <h1>{en ? 'My health' : 'Mi salud'}</h1>
        <RoleContextBar
          missionName={detail?.mission.name}
          stage={detail?.mission.stage}
          role={role}
          mode={mode}
          subject={profile?.displayName}
        />
        <p className="rd-muted">
          {en
            ? `Professional workspace (${role ? roleLabel(role, true) : '—'}) stays separate from these personal records.`
            : `El espacio profesional (${role ? roleLabel(role, false) : '—'}) permanece separado de estos registros personales.`}
        </p>
        <div className="rd-actions">
          <Link className="rd-btn ghost" to="/app">{en ? 'Back to workspace' : 'Volver al espacio'}</Link>
        </div>
      </header>

      {loading ? <p className="rd-muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}

      <DailyCarePanel
        missionId={missionId}
        wakeNote={wakeNote}
        symptomCount={symptoms.length}
        onChanged={() => refresh({ silent: true })}
      />

      <section className="rd-card">
        <h2>{en ? 'Appointments & grants' : 'Citas y permisos'}</h2>
        <p className="rd-muted">
          {en
            ? `Appointments: ${appointments.length} · Grants: ${grants.length}`
            : `Citas: ${appointments.length} · Permisos: ${grants.length}`}
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
            {en ? 'Request appointment' : 'Solicitar cita'}
          </button>
          <button
            type="button"
            className="rd-btn ghost"
            disabled={!missionId}
            onClick={() => void platformApi.grants(missionId!).then(() => refresh({ silent: true }))}
          >
            {en ? 'Refresh grants' : 'Actualizar permisos'}
          </button>
        </div>
      </section>
    </div>
  )
}