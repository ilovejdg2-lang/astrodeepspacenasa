import { useEffect, useState } from 'react'
import { Server, Clock, Radio } from 'lucide-react'

export function useColdStartTimer(isActive: boolean, delayMs = 2500) {
  const [showNotice, setShowNotice] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setShowNotice(false)
      setElapsed(0)
      return
    }

    const start = Date.now()
    const thresholdTimer = window.setTimeout(() => {
      setShowNotice(true)
    }, delayMs)

    const intervalTimer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    return () => {
      window.clearTimeout(thresholdTimer)
      window.clearInterval(intervalTimer)
    }
  }, [isActive, delayMs])

  return { showNotice, elapsed }
}

export function ColdStartNotice({
  en,
  elapsed,
  variant = 'overlay',
}: {
  en: boolean
  elapsed: number
  variant?: 'overlay' | 'card'
}) {
  const content = (
    <div className={`plat-coldstart-box ${variant === 'card' ? 'is-card' : 'is-overlay'}`} role="status">
      <div className="plat-coldstart-head">
        <span className="plat-coldstart-icon" aria-hidden="true">
          <Server size={22} />
        </span>
        <div className="plat-coldstart-title-wrap">
          <h3 className="plat-coldstart-title">
            {en ? 'Waking up cloud server (Render)…' : 'Iniciando servidor en la nube (Render)…'}
          </h3>
          <span className="plat-coldstart-badge">
            <Radio size={12} className="plat-coldstart-pulse" aria-hidden="true" />
            {en ? 'Cold start in progress' : 'Inicio en progreso'}
          </span>
        </div>
      </div>

      <p className="plat-coldstart-desc">
        {en
          ? 'Free Render servers enter sleep mode after inactivity. First launch takes 1–2 minutes to spin up. Please wait a few moments, the application will load automatically once ready.'
          : 'El servidor gratuito en Render entra en reposo por inactividad. El primer arranque puede tardar entre 1 y 2 minutos. Por favor espere unos minutos, la aplicación cargará automáticamente al responder.'}
      </p>

      <div className="plat-coldstart-footer">
        <span className="plat-coldstart-timer">
          <Clock size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {en ? `Time elapsed: ${elapsed}s` : `Tiempo transcurrido: ${elapsed}s`}
        </span>
        <div className="plat-coldstart-bar">
          <div className="plat-coldstart-bar-fill" />
        </div>
      </div>
    </div>
  )

  if (variant === 'overlay') {
    return (
      <div className="plat-coldstart-overlay" role="dialog" aria-modal="true">
        {content}
      </div>
    )
  }

  return content
}
