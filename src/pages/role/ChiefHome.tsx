import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { MISSION_PROCESS_STEPS, profileDisplayName, roleLabel, stageHint, stageLabel } from '../../platform/copy'
import { systemText } from '../../systemText'
import { getActiveMissionId } from '../../platform/session'
import { MissionReviewPanel } from '../../components/mission/MissionReviewPanel'
import { MissionCrewOverview } from '../../components/role/MissionCrewOverview'
import { MonitorPage } from '../MonitorPage'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

/** Mission overview, preparation and crew access. */
export function ChiefHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { detail, role, mode, loading, missionId, refresh, percent, prep, error: workspaceError } = useMissionWorkspace()
  const activeMissionId = missionId || getActiveMissionId()
  const rosterLocked = Boolean(detail?.mission.rosterLocked)
  const stage = detail?.mission.stage
  const afterDeploy = stage === 'aboard' || stage === 'postmission' || stage === 'archived' || stage === 'cancelled'
  const crewAddsBlocked = afterDeploy || rosterLocked
  const analysisStale = Boolean(detail?.mission.analysisStale)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [missionCode, setMissionCode] = useState(detail?.mission.code || '')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = en ? 'HELIOS · Mission center' : 'HELIOS · Centro de misión'
  }, [en])

  useEffect(() => {
    if (detail?.mission.code) setMissionCode(detail.mission.code)
  }, [detail?.mission.code])

  useEffect(() => {
    if (!activeMissionId || missionCode) return
    let alive = true
    platformApi.mission(activeMissionId)
      .then((data) => {
        if (alive) setMissionCode(data.mission.code)
      })
      .catch(() => undefined)
    return () => { alive = false }
  }, [activeMissionId, missionCode])

  const pending = (detail?.members || []).filter((member) => member.status === 'pending')
  /** Personas del equipo visible (cascos): excluye mesa Ops. Default = 4. */
  const crewSeatCount = (detail?.members || []).filter(
    (member) => member.status === 'active' && member.role !== 'ops',
  ).length
  const plannedCrew = detail?.mission.plannedCrewCount

  async function decide(membershipId: string, accept: boolean) {
    if (!activeMissionId || (accept && crewAddsBlocked)) return
    setBusyId(membershipId)
    setError('')
    setNote('')
    try {
      await platformApi.decideJoin(activeMissionId, membershipId, accept)
      await refresh({ silent: true })
      setNote(accept
        ? (en
          ? 'Join request accepted. Re-analyze before takeoff if the plan changed.'
          : 'Solicitud aceptada. Volvé a analizar antes de despegar si cambió el plan.')
        : (en ? 'Join request rejected.' : 'Solicitud rechazada.'))
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not update request' : 'No se pudo actualizar la solicitud'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page monitor-page chief-center">
      <div className="chief-center-bar">
        <div>
          <h1 className="chief-center-title">{en ? 'Mission center' : 'Centro de misión'}</h1>
          <RoleContextBar
            missionName={detail?.mission.name}
            stage={stage}
            role={role}
            mode={mode}
          />
          <p className="muted chief-invite-note" data-testid="crew-seat-count">
            {en
              ? `Active members: ${crewSeatCount || 0} / planned ${plannedCrew ?? '—'}`
              : `Integrantes activos: ${crewSeatCount || 0} / previstos ${plannedCrew ?? '—'}`}
          </p>
          {stage ? (
            <p className="muted chief-invite-note" data-testid="mission-stage-line">
              {en ? 'Mission stage' : 'Etapa de misión'}
              {': '}
              <strong>{stageLabel(stage, en)}</strong>
              {MISSION_PROCESS_STEPS.includes(stage as (typeof MISSION_PROCESS_STEPS)[number])
                ? ` · ${MISSION_PROCESS_STEPS.indexOf(stage as (typeof MISSION_PROCESS_STEPS)[number]) + 1}/${MISSION_PROCESS_STEPS.length}`
                : ''}
              {stageHint(stage, en) ? ` — ${stageHint(stage, en)}` : ''}
            </p>
          ) : null}
          {loading ? <p className="muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}
          {crewAddsBlocked ? (
            <p className="muted chief-invite-note">
              {stage === 'aboard'
                ? (en
                  ? 'Mission deployed: no more astronauts can be added.'
                  : 'Misión desplegada: ya no se pueden agregar más astronautas.')
                : (en
                  ? 'This mission is completed. Crew setup and new clinical operations stay closed.'
                  : 'Esta misión está finalizada. La tripulación y las operaciones clínicas nuevas quedan cerradas.')}
            </p>
          ) : analysisStale && stage === 'preflight' ? (
            <p className="muted chief-invite-note">
              {en
                ? 'Changes pending: run analysis again before takeoff.'
                : 'Hay cambios pendientes: volvé a analizar antes de despegar.'}
            </p>
          ) : null}
          {workspaceError || error ? <p className="field-error" role="alert">{workspaceError || error}</p> : null}
          {note ? <p className="muted chief-invite-note">{note}</p> : null}
        </div>
        <div className="chief-invite">
          <button
            type="button"
            className="btn btn-primary"
            disabled={crewAddsBlocked}
            title={crewAddsBlocked
              ? (en ? 'Crew locked after deploy' : 'Tripulación bloqueada tras el despliegue')
              : undefined}
            onClick={() => {
              setInviteOpen((value) => !value)
              setNote('')
              setError('')
            }}
          >
            <UserPlus aria-hidden="true" size={18} strokeWidth={1.75} />
            {en ? 'Add people' : 'Agregar personas'}
            {pending.length > 0 ? ` (${pending.length})` : ''}
          </button>
          {inviteOpen ? (
            <div className="chief-invite-panel">
              <p>
                {en
                  ? 'Share the mission code so others can request to join from the hub. Accept pending requests here — a name typed alone does not create access.'
                  : 'Compartí el código para que otros pidan ingreso desde el hub. Aceptá solicitudes aquí: un nombre solo no crea acceso.'}
              </p>
              <p>
                <strong>{en ? 'Code' : 'Código'}:</strong> {missionCode || '—'}
              </p>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={!missionCode}
                  onClick={() => {
                    if (!missionCode) return
                    void navigator.clipboard?.writeText(missionCode)
                      .then(() => setNote(en ? 'Code copied' : 'Código copiado'))
                      .catch(() => setNote(missionCode))
                  }}
                >
                  {en ? 'Copy code' : 'Copiar código'}
                </button>
                <Link className="btn" to="/misiones">{en ? 'Mission hub' : 'Hub de misiones'}</Link>
                <Link className="btn" to="/app/tripulacion">{en ? 'Crew board' : 'Tablero de tripulación'}</Link>
                <Link className="btn" to="/app/mi-salud">{en ? 'My Health' : 'Mi salud'}</Link>
              </div>

              <div className="chief-pending" style={{ marginTop: 14 }}>
                <strong>{en ? 'Pending requests' : 'Solicitudes pendientes'}</strong>
                {pending.length === 0 ? (
                  <p className="muted">{en ? 'No pending join requests.' : 'No hay solicitudes pendientes.'}</p>
                ) : (
                  <ul className="chief-pending-list">
                    {pending.map((member) => (
                      <li key={member.id} className="chief-pending-row">
                        <span>
                          {profileDisplayName(member.profileId)}
                          {' · '}
                          {roleLabel(member.role, en)}
                        </span>
                        <span className="row" style={{ gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={crewAddsBlocked || busyId === member.id}
                            onClick={() => void decide(member.id, true)}
                          >
                            {en ? 'Accept' : 'Aceptar'}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            disabled={busyId === member.id}
                            onClick={() => void decide(member.id, false)}
                          >
                            {en ? 'Reject' : 'Rechazar'}
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {stage === 'draft' ? (
        <section className="panel" data-testid="draft-setup">
          <h2>{en ? 'Set up your mission' : 'Configurá la misión'}</h2>
          <p className="muted">
            {en
              ? 'This draft has no checklist, health records, visits, or flight history. Nothing here is filled from another mission.'
              : 'Este borrador no tiene checklist, registros de salud, citas ni historial de vuelo. No se rellena con datos de otra misión.'}
          </p>
          <ol>
            <li>{en ? 'Mission details' : 'Datos de la misión'}</li>
            <li>{en ? 'Crew setup' : 'Tripulación'}</li>
            <li>{en ? 'Preparation plan' : 'Plan de preparación'}</li>
            <li>{en ? 'Checklist review' : 'Revisión del checklist'}</li>
          </ol>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" to="/misiones/nueva">{en ? 'Mission details' : 'Datos de la misión'}</Link>
            <Link className="btn" to="/app/recursos?tab=checklist">{en ? 'Preparation plan' : 'Plan de preparación'}</Link>
          </div>
        </section>
      ) : null}

      {stage === 'preflight' && activeMissionId ? (
        <section className="panel" data-testid="preflight-board">
          <h2>{en ? 'Preparation Checklist' : 'Checklist de preparación'}</h2>
          <p>{en ? 'Progress' : 'Avance'}: <strong>{percent}%</strong></p>
          <p className="muted">{en ? 'Flight cannot start until applicable items are at least 80% and every critical item is complete.' : 'El vuelo no puede empezar hasta 80% de los ítems aplicables y todos los críticos completos.'}</p>
          <ul>
            {prep.filter((item) => item.applies && item.status !== 'cargado_verificado').map((item) => (
              <li key={item.id}>
                {item.critical ? (en ? 'Critical · ' : 'Crítico · ') : ''}
                {systemText(item.title)}
                {item.ownerProfileId ? ` · ${profileDisplayName(item.ownerProfileId)}` : ''}
              </li>
            ))}
          </ul>
          <p className="muted">{en ? 'Next: finish the missing critical items, then confirm start from the checklist.' : 'Siguiente: completá los críticos faltantes y confirmá el inicio desde el checklist.'}</p>
          <Link className="btn btn-primary" to="/app/recursos?tab=checklist">{en ? 'Open checklist' : 'Abrir checklist'}</Link>
        </section>
      ) : null}

      {stage === 'postmission' && activeMissionId ? (
        <MissionReviewPanel missionId={activeMissionId} en={en} canSave={role === 'chief'} />
      ) : null}

      {stage === 'draft' ? null : (
      <section className="panel mission-prep-access" aria-label={en ? 'Preparation quick access' : 'Acceso rápido a preparación'}>
        <div>
          <h2>{en ? 'Resources & checklist' : 'Recursos y checklist'}</h2>
          <p className="muted">{en ? 'Preparation is managed in Resources.' : 'La preparación se gestiona en Recursos.'} {percent}% {en ? 'complete' : 'completo'}.</p>
        </div>
        <Link className="btn btn-primary" to="/app/recursos?tab=checklist" data-testid="open-mission-checklist">{en ? 'Open checklist' : 'Abrir checklist'}</Link>
      </section>
      )}

      {activeMissionId ? (
        <section className="panel" data-testid="platform-roster">
          <h2>{en ? 'Crew' : 'Tripulación'}</h2>
          {stage === 'draft' ? (
            <p className="muted">
              {en
                ? 'Only the creator is assigned, as Mission Commander. Add the rest of the crew before preparation.'
                : 'Solo está asignada la persona que creó la misión, como comandante. Sumá al resto antes de la preparación.'}
            </p>
          ) : null}
          <ul>
            {(detail?.members || []).filter((member) => member.status === 'active').map((member) => (
              <li key={member.id}>
                {profileDisplayName(member.profileId)}
                {' · '}
                {roleLabel(member.role, en)}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <MissionCrewOverview />
      )}

      <MonitorPage embedded />
    </div>
  )
}
