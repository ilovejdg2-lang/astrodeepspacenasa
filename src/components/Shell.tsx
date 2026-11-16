import * as Tooltip from '@radix-ui/react-tooltip'
import { Activity, AlertTriangle, Box, Brain, BookOpen, Heart, History, Image as ImageIcon, Lock, Menu, Moon, Rocket, Stethoscope, Sun, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { profileTitle, roleLabel } from '../platform/copy'
import { getActiveMissionId, getStoredProfile } from '../platform/session'
import { useWorkspaceRole } from '../platform/workspace'
import { RoleSwitcher } from './role/RoleSwitcher'
import { activeAlerts } from '../domain/selectors'
import { useApp } from '../state/store'
import { useTheme } from '../theme'
import { useLocale } from '../i18n'
import { noticeText } from '../noticeLocale'
import { platformApi } from '../platform/api'
import { HeliosLogo } from './HeliosLogo'
import { Hint } from './Hint'
import { PageEnter } from './PageEnter'

const EcgBackdrop = lazy(() => import('./EcgBackdrop').then((m) => ({ default: m.EcgBackdrop })))
const CrewBackdrop = lazy(() => import('./CrewBackdrop').then((m) => ({ default: m.CrewBackdrop })))
const AlertsBackdrop = lazy(() => import('./AlertsBackdrop').then((m) => ({ default: m.AlertsBackdrop })))
const ResourcesBackdrop = lazy(() =>
  import('./ResourcesBackdrop').then((m) => ({ default: m.ResourcesBackdrop })),
)
const HistoryBackdrop = lazy(() => import('./HistoryBackdrop').then((m) => ({ default: m.HistoryBackdrop })))
const AnalysisBackdrop = lazy(() =>
  import('./AnalysisBackdrop').then((m) => ({ default: m.AnalysisBackdrop })),
)
const MedicalBackdrop = lazy(() => import('./MedicalBackdrop').then((m) => ({ default: m.MedicalBackdrop })))
const QuironDashboard = lazy(() =>
  import('./quiron/QuironDashboard').then((m) => ({ default: m.QuironDashboard })),
)

function beep() {
  const audio = new AudioContext()
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.frequency.value = 660
  gain.gain.value = 0.04
  oscillator.connect(gain).connect(audio.destination)
  oscillator.start()
  oscillator.stop(audio.currentTime + 0.12)
  oscillator.onended = () => void audio.close()
}

function HelmetIcon({ size = 20, strokeWidth = 2, ...props }: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 14c0-4.4 2.7-8 6-8s6 3.6 6 8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M5 15.5h14v2.2c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8v-2.2z" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M8 14.2h8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="8.2" cy="11.2" r="1" fill="currentColor" />
    </svg>
  )
}

const NAV_ICON = 20
const NAV_STROKE = 2

export function Shell({ children }: { children: ReactNode }) {
  const { state, persistenceError, backendError } = useApp()
  const { resolved, setChoice, toggle } = useTheme()
  const { lang, setLang, copy } = useLocale()
  const shell = copy.shell
  const workspaceRole = useWorkspaceRole()
  const profile = getStoredProfile()
  const [storageNote, setStorageNote] = useState<string | null>(null)
  const [damagedFile, setDamagedFile] = useState<string | null>(null)
  const en = lang === 'en'
  useEffect(() => {
    let active = true
    platformApi.storageStatus()
      .then((status) => {
        if (!active || !status.damaged[0]) return
        setDamagedFile(status.damaged[0])
        setStorageNote(en
          ? 'A damaged database copy was kept instead of replacing it with the demo file.'
          : 'Se conservó una copia dañada de la base en lugar de reemplazarla con la demo.')
      })
      .catch(() => {})
    return () => { active = false }
  }, [en])
  async function restoreDamagedCopy(file: string) {
    try {
      await platformApi.restoreStorage(file)
      window.location.reload()
    } catch (error) {
      setStorageNote(error instanceof Error ? error.message : (en ? 'Could not restore the copy.' : 'No se pudo restaurar la copia.'))
    }
  }
  const homeLabel =
    workspaceRole === 'chief'
      ? (en ? 'Mission center' : 'Centro')
      : workspaceRole === 'medic'
        ? (en ? 'Care' : 'Atención')
        : workspaceRole === 'psychologist'
          ? (en ? 'Wellbeing' : 'Bienestar')
          : (en ? 'Home' : 'Inicio')
  const homeLink = { to: '/app/centro', label: homeLabel, icon: Activity, end: false }
  const healthLink = { to: '/app/mi-salud', label: en ? 'My Health' : 'Mi salud', icon: Heart, end: false }
  const monitorLink = { to: '/app/monitor', label: shell.monitor, icon: Activity, end: false }
  const crewLink = { to: '/app/tripulacion', label: shell.crew, icon: HelmetIcon, end: false }
  const alertsLink = { to: '/app/alertas', label: shell.alerts, icon: AlertTriangle, end: false }
  const resourcesLink = { to: '/app/recursos', label: shell.resources, icon: Box, end: false }
  const historyLink = { to: '/app/historial', label: shell.history, icon: History, end: false }
  const analysisLink = { to: '/app/analisis', label: shell.analysis, icon: Brain, end: false }
  const medicalLink = { to: '/app/medico', label: shell.medical, icon: Stethoscope, end: false }
  const missionLink = { to: '/app/mision', label: shell.mission, icon: Rocket, end: false }
  const risksLink = { to: '/app/riesgos', label: shell.risks, icon: BookOpen, end: false }
  // Crew members do not get the shared monitor, the crew roster, or other people's alerts.
  const primaryLinks = workspaceRole === 'crew'
    ? [healthLink]
    : workspaceRole === 'chief'
      ? [homeLink, monitorLink, alertsLink, crewLink]
      : [alertsLink, monitorLink, crewLink]
  const extraLinks = workspaceRole === 'crew'
    ? [resourcesLink, missionLink, risksLink]
    : [
        ...(workspaceRole === 'chief' ? [] : [homeLink]),
        healthLink,
        analysisLink,
        medicalLink,
        resourcesLink,
        historyLink,
        missionLink,
        risksLink,
        { to: '/app/memories', label: shell.memories, icon: ImageIcon, end: false },
      ]
  const spaceLink = { to: '/app/mi-espacio', label: shell.space, icon: Lock, end: false }
  const memoriesLink = { to: '/app/memories', label: shell.memories, icon: ImageIcon, end: false }
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/app/monitor')) return
    const section = path.startsWith('/app/mi-salud') ? (en ? 'My Health' : 'Mi salud')
      : path.startsWith('/app/centro') ? (en ? 'Mission center' : 'Centro de misión')
      : path.startsWith('/app/monitor') ? (en ? 'Monitor' : 'Monitor')
      : path.startsWith('/app/tripulacion') ? (en ? 'Crew' : 'Tripulación')
      : path.startsWith('/app/alertas') ? (en ? 'Alerts' : 'Alertas')
      : path.startsWith('/app/recursos') ? (en ? 'Resources' : 'Recursos')
      : path.startsWith('/app/historial') ? (en ? 'History' : 'Historial')
      : path.startsWith('/app/analisis') ? (en ? 'Analysis' : 'Análisis')
      : path.startsWith('/app/riesgos') ? (en ? 'NASA risks' : 'Riesgos NASA')
      : path.startsWith('/app/medico') ? (en ? 'Medical team' : 'Equipo médico')
      : path.startsWith('/app/mi-espacio') ? (en ? 'My space' : 'Mi espacio')
      : path.startsWith('/app/memories') || path.startsWith('/app/recuerdos') ? (en ? 'Memories' : 'Recuerdos')
      : path.startsWith('/app/mision') ? (en ? 'Mission' : 'Misión')
      : 'HELIOS'
    document.title = section === 'HELIOS' ? 'HELIOS' : `HELIOS · ${section}`
  }, [location.pathname, en])
  const alerts = getActiveMissionId() ? 0 : activeAlerts(state, 'active').length
  const primary = state.role === 'astronaut' || workspaceRole === 'crew'
    ? [...primaryLinks.slice(0, Math.min(4, primaryLinks.length)), spaceLink, memoriesLink, ...primaryLinks.slice(Math.min(4, primaryLinks.length))]
    : primaryLinks
  const mobileLinks = [...primary, ...extraLinks]
  const ai = state.notice
  const heard = useRef<Set<string> | null>(null)
  const [badgePop, setBadgePop] = useState(false)
  const previousAlerts = useRef(alerts)
  const isHome = location.pathname === '/app' || location.pathname === '/app/' || location.pathname.startsWith('/app/centro')
  const isMyHealth = location.pathname.startsWith('/app/mi-salud')
  const isMonitor = location.pathname.startsWith('/app/monitor')
  const isCrew = location.pathname.startsWith('/app/tripulacion')
  const isAlerts = location.pathname.startsWith('/app/alertas')
  const isResources = location.pathname.startsWith('/app/recursos')
  const isHistory = location.pathname.startsWith('/app/historial')
  const isAnalysis = location.pathname.startsWith('/app/analisis')
  const isMedical = location.pathname.startsWith('/app/medico')
  const isMemories = location.pathname.startsWith('/app/memories') || location.pathname.startsWith('/app/recuerdos')
  const section = isHome || isMyHealth
    ? (workspaceRole === 'medic' ? 'is-medical' : workspaceRole === 'psychologist' ? 'is-analysis' : workspaceRole === 'chief' ? 'is-monitor' : 'is-monitor')
    : isMonitor
      ? 'is-monitor'
      : isCrew
        ? 'is-crew'
        : isAlerts
          ? 'is-alerts'
          : isResources
            ? 'is-resources'
            : isHistory
              ? 'is-history'
              : isAnalysis
                ? 'is-analysis'
                : isMedical
                  ? 'is-medical'
                  : location.pathname.startsWith('/app/mision')
                    ? 'is-mission'
                    : location.pathname.startsWith('/app/riesgos')
                      ? 'is-risks'
                      : isMemories
                        ? 'is-memories'
                        : 'is-space'

  useEffect(() => {
    const sync = () => document.documentElement.classList.toggle('tab-hidden', document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])
  useEffect(() => {
    if (alerts > previousAlerts.current) {
      setBadgePop(true)
      const id = window.setTimeout(() => setBadgePop(false), 220)
      previousAlerts.current = alerts
      return () => window.clearTimeout(id)
    }
    previousAlerts.current = alerts
  }, [alerts])
  useEffect(() => {
    const ids = new Set(state.alerts.filter((alert) => alert.status !== 'closed').map((alert) => alert.id))
    if (heard.current && state.soundEnabled) {
      for (const id of ids) {
        if (!heard.current.has(id)) {
          beep()
          break
        }
      }
    }
    heard.current = ids
  }, [state.alerts, state.soundEnabled])

  return (
    <Tooltip.Provider delayDuration={400}>
    <div className={`shell ${section}${state.clock.running ? ' is-running' : ''}`}>
      <a className="skip" href="#contenido">{lang === 'en' ? 'Skip to content' : 'Saltar al contenido'}</a>
      {open ? <button className="scrim" aria-label={shell.closeMenu} onClick={() => setOpen(false)} /> : null}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-top">
          <Link className="brand-mark" to="/" onClick={() => setOpen(false)} title={en ? 'Roles' : 'Roles'}>
            <HeliosLogo variant="mark" size={112} />
            <p className="brand-stack">
              Health evaluation
              <br />
              &amp; life indicators
              <br />
              observation system
            </p>
          </Link>
          <div className="sidebar-navs">
            <nav className="nav" aria-label={shell.sections}>
              {primary.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)}>
                  <link.icon aria-hidden="true" className="nav-icon" size={NAV_ICON} strokeWidth={NAV_STROKE} />
                  {link.label}
                  {link.to === '/app/alertas' && alerts > 0 ? <span className={badgePop ? 'nav-badge pop' : 'nav-badge'}>{alerts}</span> : null}
                </NavLink>
              ))}
            </nav>
            <nav className="nav nav-extra" aria-label={shell.moreSections}>
              {extraLinks.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)}>
                  <link.icon aria-hidden="true" className="nav-icon" size={NAV_ICON} strokeWidth={NAV_STROKE} />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
        <div className="sidebar-foot">
          <HeliosLogo variant="wordmark" />
        </div>
      </aside>
      <div className={(isMonitor || (isHome && workspaceRole === 'chief')) ? 'workspace workspace-monitor' : isCrew ? 'workspace workspace-crew' : isAlerts ? 'workspace workspace-alerts' : isResources ? 'workspace workspace-resources' : isHistory ? 'workspace workspace-history' : isAnalysis ? 'workspace workspace-analysis' : isMedical ? 'workspace workspace-medical' : 'workspace'}>
        <Suspense fallback={null}>
          {(isMonitor || (isHome && workspaceRole === 'chief')) ? <EcgBackdrop /> : null}
          {isCrew ? <CrewBackdrop /> : null}
          {isAlerts ? <AlertsBackdrop /> : null}
          {isResources ? <ResourcesBackdrop /> : null}
          {isHistory ? <HistoryBackdrop /> : null}
          {isAnalysis ? <AnalysisBackdrop /> : null}
          {isMedical ? <MedicalBackdrop /> : null}
        </Suspense>
        <header className="topbar">
          <Link
            className="mobile-brand"
            to="/"
            aria-label="HELIOS, roles"
          >
            <HeliosLogo variant="wordmark" />
          </Link>
          <div className="row topbar-pills">
            <Hint label={open ? shell.closeMenu : shell.openMenu}>
              <button className="btn icon-btn menu-btn" type="button" aria-label={open ? shell.closeMenu : shell.openMenu} onClick={() => setOpen((value) => !value)}>
                {open ? <X aria-hidden="true" size={18} strokeWidth={1.75} /> : <Menu aria-hidden="true" size={18} strokeWidth={1.75} />}
              </button>
            </Hint>
            {profile ? (
              <Link className="helios-pill profile-pill" to="/misiones" title={profileTitle(profile, en)}>
                {profile.displayName}
                {workspaceRole ? ` · ${roleLabel(workspaceRole, en)}` : ''}
              </Link>
            ) : null}
            {profile ? <RoleSwitcher /> : null}
          </div>
          <div className="top-actions">
            <div className="lang-switch" role="group" aria-label={shell.language}>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
              <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button>
            </div>
            <button
              type="button"
              className="theme-toggle"
              data-testid="theme-toggle"
              aria-label={resolved === 'dark' ? shell.themeToLight : shell.themeToDark}
              onClick={toggle}
            >
              {resolved === 'dark' ? <Moon aria-hidden="true" size={20} strokeWidth={1.75} /> : <Sun aria-hidden="true" size={20} strokeWidth={1.75} />}
            </button>
            <button type="button" className="sr-only" data-testid="theme-light" tabIndex={-1} onClick={() => setChoice('light')}>{lang === 'en' ? 'Light' : 'Claro'}</button>
            <button type="button" className="sr-only" data-testid="theme-dark" tabIndex={-1} onClick={() => setChoice('dark')}>{lang === 'en' ? 'Dark' : 'Oscuro'}</button>
          </div>
        </header>
        {backendError || persistenceError ? (
          <div className="connection-notices" aria-live="polite">
            {backendError ? (
              <p role="status">
                {backendError}
              </p>
            ) : null}
            {persistenceError ? <p>{persistenceError}</p> : null}
          </div>
        ) : null}
        {storageNote ? (
          <div className="connection-notices" role="status">
            <p className="callout callout-amber">
              {storageNote}
              {damagedFile && getStoredProfile()?.demoRole === 'chief' ? (
                <button type="button" className="alerts-btn is-line" onClick={() => void restoreDamagedCopy(damagedFile)}>
                  {en ? 'Restore saved copy' : 'Restaurar copia'}
                </button>
              ) : null}
            </p>
          </div>
        ) : null}
        <div className="notice" aria-live="polite">{ai ? <div className="content notice-float" style={{ paddingBottom: 0 }}><p className={`callout callout-${ai.tone === 'err' ? 'bad' : ai.tone === 'ok' ? 'ok' : 'amber'}`} data-testid="notice">{noticeText(ai.text, lang)}</p></div> : null}</div>
        <main id="contenido" className="content">
          <PageEnter key={location.pathname}>{children}</PageEnter>
        </main>
        <nav className="bottom-nav" aria-label={shell.mainSections}>
          {mobileLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              <link.icon aria-hidden="true" className="nav-icon" size={NAV_ICON} strokeWidth={NAV_STROKE} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Suspense fallback={null}>
          <QuironDashboard />
        </Suspense>
      </div>
    </div>
    </Tooltip.Provider>
  )
}
