import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeliosLogo } from '../../components/HeliosLogo'
import { LocaleThemeSwitch } from '../../components/LocaleThemeSwitch'
import { OrbitalBackdrop } from '../../components/role/RoleArt'
import { QuironFigure } from '../../components/quiron/QuironFigure'
import { ColdStartNotice, useColdStartTimer } from '../../components/ColdStartNotice'
import { useLocale } from '../../i18n'
import { getCachedProfiles, platformApi, type Profile } from '../../platform/api'
import { ROLE_CARDS } from '../../platform/roleCatalog'
import { setActiveMissionId, setSession } from '../../platform/session'
import {
  DEMO_ROLE_PROFILES,
  type WorkspaceRole,
  clearWorkspace,
  setDemoExplore,
  setWorkspaceMode,
  setWorkspaceRole,
} from '../../platform/workspace'
import '../../platform/platform.css'
import '../../platform/enter.css'

export function EnterPage() {
  const navigate = useNavigate()
  const { lang } = useLocale()
  const en = lang === 'en'
  const [profiles, setProfiles] = useState<Profile[]>(() => getCachedProfiles())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [selected, setSelected] = useState<WorkspaceRole | null>(null)

  const { showNotice, elapsed } = useColdStartTimer(Boolean(busy || (loading && profiles.length === 0)), 2200)

  useEffect(() => {
    document.title = en ? 'HELIOS · Explore' : 'HELIOS · Explorar'
    let alive = true
    // Warm up backend and fetch live profiles without blocking initial render
    platformApi.profiles()
      .then((data) => {
        if (alive && data.profiles?.length) setProfiles(data.profiles)
      })
      .catch((err: Error) => {
        // Only set error if we don't already have profiles
        if (alive && profiles.length === 0) {
          setError(err.message || (en ? 'Could not load roles' : 'No se pudieron cargar los roles'))
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [en, profiles.length])

  async function explore(role: WorkspaceRole) {
    setSelected(role)
    setBusy(role)
    setError('')
    const profileId = DEMO_ROLE_PROFILES[role]
    const profile = profiles.find((item) => item.id === profileId)
      || profiles.find((item) => item.demoRole === role)
    if (!profile) {
      setError(en ? 'Demo profile missing for this role' : 'Falta el perfil demo de este rol')
      setBusy(null)
      return
    }
    try {
      const result = await platformApi.select(profile.id)
      setSession(result.token, {
        id: result.profile.id,
        displayName: result.profile.displayName,
        title: result.profile.title,
        demoRole: result.profile.demoRole,
      })
      clearWorkspace()
      setActiveMissionId('mission-demo-horizon')
      setWorkspaceRole(role)
      setWorkspaceMode('demo')
      setDemoExplore(true)
      navigate('/misiones')
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not start demo' : 'No se pudo iniciar la demo'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="enter">
      <div className="enter-bg" aria-hidden="true">
        <OrbitalBackdrop className="enter-orbit" />
      </div>
      {showNotice ? (
        <ColdStartNotice en={en} elapsed={elapsed} variant="overlay" />
      ) : (busy || (loading && profiles.length === 0)) ? (
        <div className="plat-loader" role="status" aria-live="polite">
          <span className="plat-spinner" aria-hidden="true" />
          <p>{busy ? (en ? 'Opening experience…' : 'Abriendo experiencia…') : (en ? 'Loading…' : 'Cargando…')}</p>
        </div>
      ) : null}

      <header className="enter-top">
        <a
          href="https://helios-publico.netlify.app/"
          className="enter-logo-link"
          aria-label="HELIOS"
        >
          <HeliosLogo variant="wordmark" />
        </a>
        <div className="enter-top-actions">
          <LocaleThemeSwitch />
        </div>
      </header>

      <main className="enter-main">
        <div className="enter-hero">
          <p className="enter-badge">{en ? 'Space Apps · role demo' : 'Space Apps · demo por rol'}</p>
          <h1>{en ? 'How do you want to explore the mission?' : '¿Cómo querés explorar la misión?'}</h1>
          <p className="enter-lead">{en ? 'Pick a role.' : 'Elegí un rol.'}</p>
          <div className="enter-quiron" aria-hidden="true">
            <QuironFigure className="enter-quiron-fig" />
            <span>{en ? 'Quirón walks with you' : 'Quirón te acompaña'}</span>
          </div>
        </div>

        {error ? <p className="enter-error" role="alert">{error}</p> : null}

        <div className="enter-grid" aria-busy={loading || Boolean(busy)}>
          {ROLE_CARDS.map((card, index) => {
            const Art = card.Art
            const isOn = selected === card.id
            return (
              <article
                key={card.id}
                className={`enter-card enter-card-${card.id}${isOn ? ' is-on' : ''}`}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="enter-card-art">
                  <Art />
                </div>
                <h2>{en ? card.name.en : card.name.es}</h2>
                <p>{en ? card.blurb.en : card.blurb.es}</p>
                <ul>
                  {(en ? card.caps.en : card.caps.es).map((cap) => (
                    <li key={cap}>{cap}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="enter-cta"
                  disabled={busy !== null || loading}
                  onClick={() => void explore(card.id)}
                >
                  {en ? card.cta.en : card.cta.es}
                </button>
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}