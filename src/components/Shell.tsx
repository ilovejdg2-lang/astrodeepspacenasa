import * as Tooltip from '@radix-ui/react-tooltip'
import { Activity, AlertTriangle, Box, Brain, BookOpen, History, Lock, Menu, Moon, Rocket, Stethoscope, Sun, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { activeAlerts } from '../domain/selectors'
import { useApp } from '../state/store'
import { useTheme } from '../theme'
import { AlertsBackdrop } from './AlertsBackdrop'
import { AnalysisBackdrop } from './AnalysisBackdrop'
import { HistoryBackdrop } from './HistoryBackdrop'
import { ResourcesBackdrop } from './ResourcesBackdrop'
import { CrewBackdrop } from './CrewBackdrop'
import { MissionDemoButton } from './MissionDemo'
import { useLocale } from '../i18n'
import { noticeText } from '../noticeLocale'
import { EcgBackdrop } from './EcgBackdrop'
import { MedicalBackdrop } from './MedicalBackdrop'
import { HeliosLogo } from './HeliosLogo'
import { Hint } from './Hint'
import { PageEnter } from './PageEnter'
import { QuironDashboard } from './quiron/QuironDashboard'

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

function earthPill(link: 'up' | 'delayed' | 'down', delayMin: number, shell: { linkDown: string; linkDelayed: (minutes: number) => string; linkUp: string }) {
  if (link === 'down') return shell.linkDown
  if (link === 'delayed') return shell.linkDelayed(delayMin)
  return shell.linkUp
}

function moreIsCurrent(pathname: string, primary: { to: string }[], narrow: boolean, astronaut: boolean): boolean {
  const overflow = primary.slice(narrow ? 4 : 5).some((link) => pathname === link.to || pathname.startsWith(`${link.to}/`))
  return overflow || pathname.startsWith('/app/mision') || pathname.startsWith('/app/riesgos') || (astronaut && pathname.startsWith('/app/mi-espacio'))
}

export function Shell({ children }: { children: ReactNode }) {
  const { state, persistenceError, backendMode, backendError } = useApp()
  const { resolved, setChoice, toggle } = useTheme()
  const { lang, setLang, copy } = useLocale()
  const shell = copy.shell
  const primaryLinks = [
    { to: '/app', label: shell.monitor, icon: Activity, end: true },
    { to: '/app/tripulacion', label: shell.crew, icon: HelmetIcon, end: false },
    { to: '/app/alertas', label: shell.alerts, icon: AlertTriangle, end: false },
    { to: '/app/recursos', label: shell.resources, icon: Box, end: false },
    { to: '/app/historial', label: shell.history, icon: History, end: false },
    { to: '/app/analisis', label: shell.analysis, icon: Brain, end: false },
    { to: '/app/medico', label: shell.medical, icon: Stethoscope, end: false },
  ]
  const extraLinks = [
    { to: '/app/mision', label: shell.mission, icon: Rocket, end: false },
    { to: '/app/riesgos', label: shell.risks, icon: BookOpen, end: false },
  ]
  const spaceLink = { to: '/app/mi-espacio', label: shell.space, icon: Lock, end: false }
  const [open, setOpen] = useState(false)
  const [more, setMore] = useState(false)
  const [narrowPhone, setNarrowPhone] = useState(() => window.matchMedia('(max-width: 359px)').matches)
  const moreButton = useRef<HTMLButtonElement>(null)
  const morePanel = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const alerts = activeAlerts(state, 'active').length
  const primary = state.role === 'astronaut'
    ? [...primaryLinks.slice(0, 4), spaceLink, ...primaryLinks.slice(4)]
    : primaryLinks
  const ai = state.notice
  const heard = useRef<Set<string> | null>(null)
  const [badgePop, setBadgePop] = useState(false)
  const previousAlerts = useRef(alerts)
  const isMonitor = location.pathname === '/app' || location.pathname === '/app/'
  const isCrew = location.pathname.startsWith('/app/tripulacion')
  const isAlerts = location.pathname.startsWith('/app/alertas')
  const isResources = location.pathname.startsWith('/app/recursos')
  const isHistory = location.pathname.startsWith('/app/historial')
  const isAnalysis = location.pathname.startsWith('/app/analisis')
  const isMedical = location.pathname.startsWith('/app/medico')
  const section = isMonitor
    ? 'is-monitor'
    : isCrew
      ? 'is-crew'
      : isAlerts
        ? 'is-alerts'
        : location.pathname.startsWith('/app/recursos')
          ? 'is-resources'
          : location.pathname.startsWith('/app/historial')
            ? 'is-history'
            : location.pathname.startsWith('/app/analisis')
              ? 'is-analysis'
              : location.pathname.startsWith('/app/medico')
                ? 'is-medical'
                : location.pathname.startsWith('/app/mision')
                  ? 'is-mission'
                  : location.pathname.startsWith('/app/riesgos')
                    ? 'is-risks'
                    : 'is-space'

  useEffect(() => {
    const query = window.matchMedia('(max-width: 359px)')
    const sync = () => setNarrowPhone(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    setMore(false)
  }, [location.pathname])
  useEffect(() => {
    if (!more) return
    morePanel.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMore(false)
      moreButton.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [more])
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
          <Link className="brand-mark" to="/" onClick={() => setOpen(false)} aria-label={shell.presentation}>
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
          <p className="brand-foot">
            Health evaluation &amp; life indicators
            <br />
            observation system
          </p>
        </div>
      </aside>
      <div className={isMonitor ? 'workspace workspace-monitor' : isCrew ? 'workspace workspace-crew' : isAlerts ? 'workspace workspace-alerts' : isResources ? 'workspace workspace-resources' : isHistory ? 'workspace workspace-history' : isAnalysis ? 'workspace workspace-analysis' : isMedical ? 'workspace workspace-medical' : 'workspace'}>
        {isMonitor ? <EcgBackdrop /> : null}
        {isCrew ? <CrewBackdrop /> : null}
        {isAlerts ? <AlertsBackdrop /> : null}
        {isResources ? <ResourcesBackdrop /> : null}
        {isHistory ? <HistoryBackdrop /> : null}
        {isAnalysis ? <AnalysisBackdrop /> : null}
        {isMedical ? <MedicalBackdrop /> : null}
        <header className="topbar">
          <Link className="mobile-brand" to="/" aria-label={shell.presentation}>
            <HeliosLogo variant="wordmark" />
          </Link>
          <div className="row topbar-pills">
            <Hint label={open ? shell.closeMenu : shell.openMenu}>
              <button className="btn icon-btn menu-btn" type="button" aria-label={open ? shell.closeMenu : shell.openMenu} onClick={() => setOpen((value) => !value)}>
                {open ? <X aria-hidden="true" size={18} strokeWidth={1.75} /> : <Menu aria-hidden="true" size={18} strokeWidth={1.75} />}
              </button>
            </Hint>
            <p className="helios-pill" data-testid="sim-pill">{shell.simulation}</p>
            <MissionDemoButton />
            <p className={`helios-pill ${state.link === 'down' ? 'down' : ''}`} key={state.link}>
              {(isResources || isHistory || isAnalysis || isMedical || isCrew || isMonitor) && state.link === 'delayed'
                ? (lang === 'en' ? `Earth link: delayed ${state.linkDelayMin}min` : `Enlace Tierra: con demora ${state.linkDelayMin}min`)
                : earthPill(state.link, state.linkDelayMin, shell)}
            </p>
            <span className="sr-only" data-testid="backend-mode">{backendMode === 'connected' ? 'NestJS conectado' : 'Simulador local'}</span>
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
        <div className="sr-only" aria-live="polite">
          {backendError ? <p role="status">{backendError}</p> : null}
          {persistenceError ? <p>{persistenceError}</p> : null}
        </div>
        <div className="notice" aria-live="polite">{ai ? <div className="content notice-float" style={{ paddingBottom: 0 }}><p className={`callout callout-${ai.tone === 'err' ? 'bad' : ai.tone === 'ok' ? 'ok' : 'amber'}`} data-testid="notice">{noticeText(ai.text, lang)}</p></div> : null}</div>
        <main id="contenido" className="content">
          <PageEnter key={`${location.pathname}:${lang}`}>{children}</PageEnter>
        </main>
        <nav className="bottom-nav" aria-label={shell.mainSections}>
          {primaryLinks.slice(0, narrowPhone ? 4 : 5).map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMore(false)}>
              <link.icon aria-hidden="true" className="nav-icon" size={NAV_ICON} strokeWidth={NAV_STROKE} />
              {link.label}
            </NavLink>
          ))}
          <button
            ref={moreButton}
            type="button"
            aria-expanded={more}
            aria-controls="more-modules"
            aria-current={moreIsCurrent(location.pathname, primaryLinks, narrowPhone, state.role === 'astronaut') ? 'page' : undefined}
            onClick={() => setMore((value) => !value)}
          >
            <Menu aria-hidden="true" className="nav-icon" size={NAV_ICON} strokeWidth={NAV_STROKE} /> {shell.more}
          </button>
        </nav>
        {more ? <button className="scrim more-scrim" type="button" aria-label={shell.closeMenu} onClick={() => { setMore(false); moreButton.current?.focus() }} /> : null}
        {more ? (
          <div ref={morePanel} id="more-modules" className="more-menu" role="dialog" aria-label={shell.moreSections}>
            {primaryLinks.slice(narrowPhone ? 4 : 5).map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMore(false)}>
                <link.icon aria-hidden="true" className="nav-icon" size={NAV_ICON} strokeWidth={NAV_STROKE} />
                {link.label}
              </NavLink>
            ))}
            {state.role === 'astronaut' ? (
              <NavLink to={spaceLink.to} onClick={() => setMore(false)}>
                <spaceLink.icon aria-hidden="true" className="nav-icon" size={NAV_ICON} strokeWidth={NAV_STROKE} />
                {spaceLink.label}
              </NavLink>
            ) : null}
            {extraLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMore(false)}>
                <link.icon aria-hidden="true" className="nav-icon" size={NAV_ICON} strokeWidth={NAV_STROKE} />
                {link.label}
              </NavLink>
            ))}
          </div>
        ) : null}
        <QuironDashboard />
      </div>
    </div>
    </Tooltip.Provider>
  )
}
