import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { useLocale } from '../../i18n'
import { platformApi } from '../../platform/api'
import { profileDisplayName, roleLabel } from '../../platform/copy'
import { getActiveMissionId } from '../../platform/session'
import { MonitorPage } from '../MonitorPage'
import { RoleContextBar } from './RoleContextBar'
import { useMissionWorkspace } from './useMissionWorkspace'
import '../../platform/role-dash.css'

/** Centro del jefe = monitor original (cascos) + código de misión + solicitudes reales. */
export function ChiefHome() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { detail, role, mode, loading, missionId, refresh, error: workspaceError } = useMissionWorkspace()
  const activeMissionId = missionId || getActiveMissionId()
  const rosterLocked = Boolean(detail?.mission.rosterLocked)
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
  const activeCount = (detail?.members || []).filter((member) => member.status === 'active').length
  const planned = detail?.mission.plannedCrewCount

  async function decide(membershipId: string, accept: boolean) {
    if (!activeMissionId || rosterLocked) return
    setBusyId(membershipId)
    setError('')
    setNote('')
    try {
      await platformApi.decideJoin(activeMissionId, membershipId, accept)
      await refresh({ silent: true })
      setNote(accept
        ? (en ? 'Join request accepted.' : 'Solicitud aceptada.')
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
          <p className="monitor-kicker">{en ? 'Mission center' : 'Centro de misión'}</p>
          <RoleContextBar
            missionName={detail?.mission.name}
            stage={detail?.mission.stage}
            role={role}
            mode={mode}
          />
          {loading ? <p className="muted">{en ? 'Loading…' : 'Cargando…'}</p> : null}
          <p className="muted chief-invite-note">
            {en
              ? `Active members: ${activeCount} / planned ${planned ?? '—'}`
              : `Integrantes activos: ${activeCount} / previstos ${planned ?? '—'}`}
          </p>
          {rosterLocked ? (
            <p className="muted chief-invite-note">
              {en
                ? 'Crew locked: AI checklist was saved. No member changes or new people.'
                : 'Tripulación bloqueada: se guardó el checklist de IA. Sin cambios ni personas nuevas.'}
            </p>
          ) : null}
          {workspaceError || error ? <p className="field-error" role="alert">{workspaceError || error}</p> : null}
          {note ? <p className="muted chief-invite-note">{note}</p> : null}
        </div>
        <div className="chief-invite">
          <button
            type="button"
            className="btn btn-primary"
            disabled={rosterLocked}
            title={rosterLocked
              ? (en ? 'Crew locked after AI checklist' : 'Tripulación bloqueada por checklist de IA')
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
                <Link className="btn" to="/app/mi-salud">{en ? 'My health' : 'Mi salud'}</Link>
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
                            disabled={rosterLocked || busyId === member.id}
                            onClick={() => void decide(member.id, true)}
                          >
                            {en ? 'Accept' : 'Aceptar'}
                          </button>
                          <button
                            type="button"
                            className="btn"
                            disabled={rosterLocked || busyId === member.id}
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

      <MonitorPage embedded />
    </div>
  )
}
