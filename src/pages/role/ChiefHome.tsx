import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  UserPlus,
  Rocket,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Brain,
} from 'lucide-react'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { profileDisplayName, roleLabel } from '../../platform/copy'
import { systemText } from '../../systemText'
import { getActiveMissionId } from '../../platform/session'
import { MissionReviewPanel } from '../../components/mission/MissionReviewPanel'
import { MissionProcessStrip } from '../../components/platform/MissionProcessStrip'
import { MissionCrewOverview } from '../../components/role/MissionCrewOverview'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

/** Mission overview, preparation and crew access. */
export function ChiefHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { detail, role, loading, missionId, refresh, percent, prep, error: workspaceError } = useMissionWorkspace()
  const activeMissionId = missionId || getActiveMissionId()
  const rosterLocked = Boolean(detail?.mission.rosterLocked)
  const stage = detail?.mission.stage
  const hasMissionDetail = Boolean(detail?.mission)
  const afterDeploy = stage === 'aboard' || stage === 'postmission' || stage === 'archived' || stage === 'cancelled'
  const crewAddsBlocked = hasMissionDetail && (afterDeploy || rosterLocked)
  const analysisStale = Boolean(detail?.mission.analysisStale)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [missionCode, setMissionCode] = useState(detail?.mission.code || '')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [stageUpdating, setStageUpdating] = useState(false)
  const [stageError, setStageError] = useState('')

  async function handleUpdateStage(newStage: string) {
    if (!activeMissionId) return
    setStageUpdating(true)
    setStageError('')
    try {
      await platformApi.setStage(activeMissionId, newStage)
      await refresh()
      setNote(en ? `Mission status updated to "${newStage}".` : `Estado de la misión actualizado a "${newStage}".`)
    } catch (err) {
      setStageError(err instanceof Error ? err.message : (en ? 'Could not update mission stage' : 'No se pudo actualizar el estado de la misión'))
    } finally {
      setStageUpdating(false)
    }
  }

  useEffect(() => {
    document.title = en ? 'HELIOS · Command Hub' : 'HELIOS · Centro de Mando'
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
          <h1 className="chief-center-title">{en ? 'Mission Command Hub' : 'Centro de Mando de Misión'}</h1>
          {loading ? <p className="muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}
          {!loading && crewAddsBlocked ? (
            <p className="muted chief-invite-note">
              {stage === 'aboard'
                ? (en
                  ? 'Mission deployed: no more astronauts can be added.'
                  : 'Misión desplegada: ya no se pueden agregar más astronautas.')
                : (en
                  ? 'This mission is completed. Crew setup and new clinical operations stay closed.'
                  : 'Esta misión está finalizada. La tripulación y las operaciones clínicas nuevas quedan cerradas.')}
            </p>
          ) : !loading && analysisStale && stage === 'preflight' ? (
            <p className="muted chief-invite-note">
              {en
                ? 'Changes pending: run analysis again before takeoff.'
                : 'Hay cambios pendientes: volvé a analizar antes de despegar.'}
            </p>
          ) : null}
          {!loading && (workspaceError || error) ? <p className="field-error" role="alert">{workspaceError || error}</p> : null}
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

      {/* Mission Lifecycle Stage Control (Requested by Commander) */}
      <section className="panel chief-lifecycle-panel" aria-label={en ? 'Mission stage control' : 'Control del estado de la misión'}>
        <div className="chief-lifecycle-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '1.25rem' }}>
              <Rocket size={20} className="text-accent" aria-hidden="true" />
              {en ? 'Mission Stage & Flight Lifecycle' : 'Estado y Ciclo de Vida de la Misión'}
            </h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.86rem' }}>
              {en
                ? 'As Mission Commander, you control the operational phase of this mission across all stations.'
                : 'Como Comandante de Misión, controlás la fase operativa de esta misión en todas las estaciones.'}
            </p>
          </div>
          <span
            className="rd-badge"
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: '0.85rem',
              fontWeight: 700,
              background: stage === 'aboard' ? 'rgba(34, 197, 94, 0.18)' : stage === 'preflight' ? 'rgba(245, 158, 11, 0.18)' : stage === 'postmission' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255, 255, 255, 0.1)',
              color: stage === 'aboard' ? '#4ade80' : stage === 'preflight' ? '#fbbf24' : stage === 'postmission' ? '#c084fc' : 'inherit',
              border: `1px solid ${stage === 'aboard' ? 'rgba(34, 197, 94, 0.4)' : stage === 'preflight' ? 'rgba(245, 158, 11, 0.4)' : stage === 'postmission' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
            }}
          >
            {stage === 'aboard'
              ? (en ? '🚀 In-Flight / Aboard' : '🚀 En Vuelo / A Bordo')
              : stage === 'preflight'
                ? (en ? '📋 Preflight Preparation' : '📋 Preparación Prevuelo')
                : stage === 'postmission'
                  ? (en ? '🔬 Post-Mission Science' : '🔬 Postmisión y Ciencia')
                  : stage === 'archived'
                    ? (en ? '📦 Archived' : '📦 Archivada')
                    : (en ? '✏️ Draft Setup' : '✏️ Borrador')}
          </span>
        </div>

        <div className="chief-stage-control-box" style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <label htmlFor="mission-stage-select" style={{ fontSize: '0.84rem', fontWeight: 650, display: 'block', marginBottom: 6 }}>
            {en ? 'Change Mission Phase / Stage:' : 'Cambiar Fase / Estado de la Misión:'}
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              id="mission-stage-select"
              value={stage || 'preflight'}
              disabled={stageUpdating || !activeMissionId}
              onChange={(e) => void handleUpdateStage(e.target.value)}
              className="rd-field-input"
              style={{ minWidth: 260, padding: '7px 12px', fontSize: '0.88rem', fontWeight: 600 }}
            >
              <option value="draft">{en ? 'Draft — Initial Configuration' : 'Borrador — Configuración inicial'}</option>
              <option value="preflight">{en ? 'Preflight — Crew & Cargo Readiness' : 'Prevuelo — Preparación de tripulación y carga'}</option>
              <option value="aboard">{en ? 'Aboard / In-Flight — Active Space Mission' : 'A Bordo / En Vuelo — Misión espacial activa'}</option>
              <option value="postmission">{en ? 'Post-Mission — Retrospective Science & Review' : 'Postmisión — Ciencia retrospectiva y revisión'}</option>
            </select>
            {stageUpdating ? (
              <span className="muted" style={{ fontSize: '0.84rem' }}>{en ? 'Updating stage…' : 'Actualizando estado…'}</span>
            ) : null}
          </div>
          {stageError ? <p className="field-error" style={{ margin: '6px 0 0' }}>{stageError}</p> : null}
        </div>

        {/* Quick Operations Navigation for Commander */}
        <div className="chief-ops-nav-grid" style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          <Link to="/app/monitor" className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px' }}>
            <Activity size={16} />
            <span>{en ? 'Live Crew Monitor' : 'Monitoreo de Tripulación'}</span>
          </Link>
          <Link to="/app/recursos?tab=checklist" className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px' }}>
            <CheckCircle2 size={16} />
            <span>{en ? 'Readiness Checklist' : 'Checklist de Preparación'}</span>
          </Link>
          <Link to="/app/biomedical" className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px' }}>
            <ShieldCheck size={16} />
            <span>{en ? 'Biomedical Insights' : 'Perspectivas Biomédicas'}</span>
          </Link>
          <Link to="/app/analisis" className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px' }}>
            <Brain size={16} />
            <span>{en ? 'Cognitive & AI Analysis' : 'Análisis Cognitivo e IA'}</span>
          </Link>
        </div>
      </section>

      {stage === 'draft' ? (
        <section className="panel" data-testid="draft-setup">
          <h2>{en ? 'Set up your mission' : 'Configurá la misión'}</h2>
          <MissionProcessStrip stage={stage} en={en} showStatus />
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

    </div>
  )
}
