import { AnimatePresence, motion } from 'motion/react'
import { Menu, Moon, Sparkles, Sun, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom'
import { DASHBOARD_PATH, NAV } from '../../content/landing'
import { useMotionPref } from '../../hooks/useMotionPref'
import { useTheme } from '../../theme'
import { HeliosLogo } from '../HeliosLogo'
import { Starfield } from './Starfield'
import '../../public.css'

function PublicPageTransition({ reduced }: { reduced: boolean }) {
  const location = useLocation()
  const outlet = useOutlet({ reduced })

  return (
    <motion.div
      key={location.pathname}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {outlet}
    </motion.div>
  )
}

export function PublicLayout() {
  const { resolved, toggle } = useTheme()
  const { reduced, toggle: toggleMotion } = useMotionPref()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }, [location.pathname, reduced])

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduced ? '1' : '0'
  }, [reduced])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="pub">
      <Starfield reduced={reduced} />
      <div className="pub-shell">
        <header className="pub-header">
          <Link className="pub-brand" to="/" onClick={() => setMenuOpen(false)} aria-label="HELIOS, inicio">
            <HeliosLogo variant="wordmark" />
          </Link>

          <nav className="pub-nav" aria-label="Navegación pública">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              >
                {item.label}
                <span className="pub-nav-indicator" aria-hidden="true" />
              </NavLink>
            ))}
          </nav>

          <div className="pub-actions">
            <button
              type="button"
              className="pub-chip"
              aria-pressed={reduced}
              aria-label={reduced ? 'Activar animaciones' : 'Reducir animaciones'}
              onClick={toggleMotion}
              title="Reducir animaciones"
            >
              <Sparkles size={16} aria-hidden="true" />
              <span className="long">{reduced ? 'Animar' : 'Menos movimiento'}</span>
            </button>
            <button
              type="button"
              className="theme-toggle pub-theme"
              data-testid="theme-toggle"
              aria-label={resolved === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              onClick={toggle}
            >
              <span className="pub-theme-swap" data-mode={resolved}>
                {resolved === 'dark' ? <Moon aria-hidden="true" size={18} /> : <Sun aria-hidden="true" size={18} />}
              </span>
            </button>
            <Link className="pub-cta" to={DASHBOARD_PATH}>
              <span className="long">Acceder al sistema</span>
              <span className="short">Entrar</span>
            </Link>
            <button
              type="button"
              className="btn icon-btn pub-menu-btn"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
            </button>
          </div>
        </header>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              id={menuId}
              className="pub-mobile"
              initial={reduced ? false : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  {item.label}
                </NavLink>
              ))}
              <Link to={DASHBOARD_PATH} onClick={() => setMenuOpen(false)}>Acceder al sistema</Link>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="pub-main">
          <PublicPageTransition reduced={reduced} />
        </main>

        <footer className="pub-footer">
          <div className="pub-footer-grid">
            <div>
              <p className="pub-kicker">HELIOS</p>
              <p className="pub-footer-title">Health Evaluation &amp; Life Indicators Observation System</p>
              <p className="pub-muted">Prototipo independiente de acompañamiento en salud espacial. No es un producto oficial de NASA.</p>
            </div>
            <nav aria-label="Pie de página">
              {NAV.map((item) => (
                <Link key={item.to} to={item.to}>{item.label}</Link>
              ))}
              <Link to={DASHBOARD_PATH}>Sistema</Link>
            </nav>
          </div>
          <p className="pub-footer-note">© {new Date().getFullYear()} Equipo HELIOS · Prototipo académico</p>
        </footer>
      </div>
    </div>
  )
}
