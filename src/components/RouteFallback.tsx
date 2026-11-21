import { useEffect, useState } from 'react'
import { useLocale } from '../i18n'

export function RouteFallback() {
  const { lang } = useLocale()
  const [delayed, setDelayed] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDelayed(true), 2500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="route-fallback" role="status" aria-live="polite" aria-busy="true">
      <div className="skeleton-grid" aria-hidden="true">
        <span className="skeleton" style={{ height: 22, width: '42%' }} />
        <span className="skeleton" style={{ height: 14, width: '68%' }} />
        <span className="skeleton" style={{ height: 120, width: '100%', borderRadius: 16 }} />
        <span className="skeleton" style={{ height: 14, width: '54%' }} />
      </div>
      {delayed ? (
        <p className="rd-muted" style={{ textAlign: 'center', marginTop: 12, fontSize: '0.86rem' }}>
          {lang === 'es'
            ? 'Iniciando recursos… Por favor espere unos momentos si el servidor está arrancando.'
            : 'Starting resources… Please wait a few moments if the server is waking up.'}
        </p>
      ) : null}
      <span className="sr-only">{lang === 'es' ? 'Cargando…' : 'Loading…'}</span>
    </div>
  )
}
