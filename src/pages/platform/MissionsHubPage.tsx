import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { useLocale } from '../../i18n'
import { platformApi, type MissionRow } from '../../platform/api'
import { roleLabel, stageLabel } from '../../platform/copy'
import { clearSession, getSessionToken, getStoredProfile, setActiveMissionId } from '../../platform/session'
import {
  clearRoleScopedUiState,
  isDemoExplore,
  resolveAuthorizedRole,
  setWorkspaceMode,
  setWorkspaceRole,
} from '../../platform/workspace'
import '../../platform/platform.css'

export function MissionsHubPage() {
  const navigate = useNavigate()
  const { lang } = useLocale()
  const en = lang === 'en'
  const profile = getStoredProfile()
  const isChief = profile?.demoRole === 'chief'
  const [items, setItems] = useState<MissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    document.title = en ? 'HELIOS · Missions' : 'HELIOS · Misiones'
    if (!getSessionToken()) {
      navigate('/entrar', { replace: true })
      return
    }
    void refresh()
  }, [navigate, en])

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const data = await platformApi.missions()
      setItems(data.items.filter(Boolean) as MissionRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not load missions' : 'Error al cargar misiones'))
    } finally {
      setLoading(false)
    }
  }

  function enter(missionId: string, membershipRole: string) {
    clearRoleScopedUiState()
    setActiveMissionId(missionId)
    const resolved = resolveAuthorizedRole(membershipRole, profile?.demoRole)
    if (resolved) {
      setWorkspaceRole(resolved)
      setWorkspaceMode(isDemoExplore() ? 'demo' : 'authorized')
    }
    navigate('/app')
  }

  async function join() {
    setError('')
    setMessage('')
    setJoining(true)
    try {
      const result = await platformApi.join(code)
      setMessage(
        result.note ||
          (en ? `Status: ${result.status}` : `Estado: ${result.status}`),
      )
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not request access' : 'No se pudo solicitar ingreso'))
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="plat">
      {loading ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{en ? 'Loading missions…' : 'Cargando misiones…'}</p>
        </div>
      ) : null}
      <div className="plat-shell">
        <div className="plat-top">
          <HeliosLogo variant="wordmark" />
          <div className="plat-actions">
            <span className="plat-chip">{profile?.displayName}</span>
            <button
              type="button"
              className="plat-btn ghost"
              onClick={() => {
                clearSession()
                navigate('/entrar')
              }}
            >
              {en ? 'Switch profile' : 'Cambiar perfil'}
            </button>
          </div>
        </div>
        <p className="plat-kicker">{en ? 'Mission hub' : 'Hub de misiones'}</p>
        <h1>{en ? 'Your mission space' : 'Tu espacio de misión'}</h1>
        <p className="plat-lead">
          {isChief
            ? (en
              ? 'Create a mission (you become chief of that mission only), continue one you already have, or request access with a code. Knowing a code does not reveal health data or grant a privileged role.'
              : 'Creá una misión (quedás como jefe solo de esa misión), continuá una existente o pedí ingreso con código. El código no revela salud ni permite un rol privilegiado.')
            : (en
              ? 'Continue a mission you belong to, or request access with a code. Knowing a code does not reveal health data or grant a privileged role.'
              : 'Continuá una misión a la que ya pertenecés, o pedí ingreso con código. El código no revela salud ni permite un rol privilegiado.')}
        </p>

        {isChief ? (
          <div className="plat-actions" style={{ marginBottom: 20 }}>
            <Link className="plat-btn" to="/misiones/nueva">{en ? 'Create mission' : 'Crear misión'}</Link>
          </div>
        ) : null}

        <section className="plat-panel">
          <h2>{en ? 'Continue one of my missions' : 'Continuar una de mis misiones'}</h2>
          {!loading && items.length === 0 ? (
            <p>{en ? 'You have no active missions yet.' : 'Todavía no tenés misiones activas.'}</p>
          ) : null}
          <div className="plat-list">
            {items.map((row) => (
              <div className="plat-row" key={row.mission.id}>
                <div>
                  <strong>{row.mission.name}</strong>
                  <div>
                    {stageLabel(row.mission.stage, en)} · {roleLabel(row.membership.role, en)} · {en ? 'Prep' : 'Preparación'} {row.mission.prepPercent}%
                  </div>
                  <div className="plat-chip">{row.mission.code}</div>
                </div>
                <button type="button" className="plat-btn" onClick={() => enter(row.mission.id, row.membership.role)}>
                  {en ? 'Enter dashboard' : 'Entrar al tablero'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="plat-panel">
          <h2>{en ? 'Join an existing mission' : 'Ingresar a una misión existente'}</h2>
          <div className="plat-field">
            <label htmlFor="join-code">{en ? 'Mission code' : 'Código de misión'}</label>
            <input
              id="join-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="HELIOS-DEMO"
            />
          </div>
          <button type="button" className="plat-btn" disabled={joining || !code.trim()} onClick={() => void join()}>
            {joining ? (en ? 'Sending…' : 'Enviando…') : (en ? 'Request to join' : 'Solicitar incorporación')}
          </button>
          {message ? <p className="plat-ok">{message}</p> : null}
          {error ? <p className="plat-error">{error}</p> : null}
        </section>
      </div>
    </div>
  )
}