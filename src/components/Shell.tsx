import * as Tooltip from '@radix-ui/react-tooltip'
import { Activity, Bell, Box, Brain, History, Menu, Moon, Monitor, RefreshCw, Stethoscope, Sun, Users, Volume2, VolumeX, Wifi, WifiOff, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { linkLabel } from '../domain/format'
import { activeAlerts } from '../domain/selectors'
import { useApp } from '../state/store'
import { useTheme, type ThemeChoice } from '../theme'
import { Hint } from './Hint'
import { PageEnter } from './PageEnter'
import { SimBar } from './SimBar'

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

const LINKS = [
  { to: '/', label: 'Monitor', icon: Activity, end: true },
  { to: '/tripulacion', label: 'Tripulación', icon: Users, end: false },
  { to: '/alertas', label: 'Alertas', icon: Bell, end: false },
  { to: '/recursos', label: 'Recursos', icon: Box, end: false },
  { to: '/historial', label: 'Historial', icon: History, end: false },
  { to: '/analisis', label: 'Análisis', icon: Brain, end: false },
  { to: '/medico', label: 'Equipo médico', icon: Stethoscope, end: false },
]

export function Shell({ children }: { children: ReactNode }) {
  const { state, persistenceError, saving, dispatch } = useApp()
  const { choice, setChoice } = useTheme()
  const [open, setOpen] = useState(false)
  const [more, setMore] = useState(false)
  const location = useLocation()
  const alerts = activeAlerts(state, 'active').length
  const ai = state.notice
  const heard = useRef<Set<string> | null>(null)
  const [badgePop, setBadgePop] = useState(false)
  const previousAlerts = useRef(alerts)
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
    <div className={state.clock.running ? 'shell is-running' : 'shell'}>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      {open ? <button className="scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} /> : null}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <Activity aria-hidden="true" />
          <div>
            <strong>VITALINK</strong>
            <span>Hábitat · día 42</span>
          </div>
        </div>
        <nav className="nav" aria-label="Secciones">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)}>
              <link.icon aria-hidden="true" size={18} strokeWidth={1.75} />
              {link.label}
              {link.to === '/alertas' && alerts > 0 ? <span className={badgePop ? 'nav-badge pop' : 'nav-badge'}>{alerts}</span> : null}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="row">
            <Hint label={open ? 'Cerrar menú' : 'Abrir menú'}>
              <button className="btn icon-btn menu-btn" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen((value) => !value)}>
                {open ? <X aria-hidden="true" size={18} strokeWidth={1.75} /> : <Menu aria-hidden="true" size={18} strokeWidth={1.75} />}
              </button>
            </Hint>
            <p className="sim-pill"><span className="live-dot" aria-hidden="true" /> Simulación · datos ficticios</p>
            <p className={`status-pill ${state.link === 'down' ? 'down' : ''}`} key={state.link}>
              {state.link === 'down' ? <WifiOff aria-hidden="true" size={16} strokeWidth={1.75} className="tone-security" /> : <Wifi aria-hidden="true" size={16} strokeWidth={1.75} className="tone-comms" />}
              {linkLabel(state.link, state.linkDelayMin)}
            </p>
            {saving ? <p className="status-pill"><RefreshCw aria-hidden="true" size={16} strokeWidth={1.75} className="is-busy" /> Guardando</p> : null}
          </div>
          <div className="top-actions">
            <button className="chip" type="button" aria-pressed={state.soundEnabled} onClick={() => dispatch({ type: 'setSound', enabled: !state.soundEnabled })}>
              {state.soundEnabled ? <Volume2 aria-hidden="true" size={16} strokeWidth={1.75} /> : <VolumeX aria-hidden="true" size={16} strokeWidth={1.75} />}
              Sonido {state.soundEnabled ? 'activo' : 'apagado'}
            </button>
            <div className="chips" role="group" aria-label="Tema">
              {(['light', 'dark', 'system'] as ThemeChoice[]).map((item) => (
                <button key={item} type="button" className="chip" data-testid={`theme-${item}`} aria-pressed={choice === item} onClick={() => setChoice(item)}>
                  {item === 'light' ? <Sun aria-hidden="true" size={16} strokeWidth={1.75} /> : item === 'dark' ? <Moon aria-hidden="true" size={16} strokeWidth={1.75} /> : <Monitor aria-hidden="true" size={16} strokeWidth={1.75} />}
                  {item === 'light' ? 'Claro' : item === 'dark' ? 'Oscuro' : 'Sistema'}
                </button>
              ))}
            </div>
          </div>
        </header>
        {persistenceError ? <div className="content" style={{ paddingBottom: 0 }}><p className="callout callout-bad">{persistenceError}</p></div> : null}
        <div className="notice" aria-live="polite">{ai ? <div className="content" style={{ paddingBottom: 0 }}><p className={`callout callout-${ai.tone === 'err' ? 'bad' : ai.tone === 'ok' ? 'ok' : 'amber'}`} data-testid="notice">{ai.text}</p></div> : null}</div>
        <main id="contenido" className="content">
          <PageEnter key={location.pathname}>{children}</PageEnter>
        </main>
        <SimBar />
        <nav className="bottom-nav" aria-label="Secciones principales">
          {LINKS.slice(0, 4).map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMore(false)}>
              <link.icon aria-hidden="true" size={18} strokeWidth={1.75} />
              {link.label}
            </NavLink>
          ))}
          <button type="button" onClick={() => setMore((value) => !value)} aria-expanded={more}><Menu aria-hidden="true" size={18} strokeWidth={1.75} /> Más</button>
        </nav>
        {more ? (
          <div className="more-menu">
            {LINKS.slice(4).map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setMore(false)}>
                <link.icon aria-hidden="true" size={18} strokeWidth={1.75} />
                {link.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    </div>
    </Tooltip.Provider>
  )
}
