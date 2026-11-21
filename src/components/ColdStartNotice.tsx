import { useEffect, useState } from 'react'
import { Server, Clock, Radio, Zap } from 'lucide-react'

export function useColdStartTimer(isActive: boolean, delayMs = 1000, estimatedTotal = 50) {
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

  const countdown = Math.max(0, estimatedTotal - elapsed)
  const progress = Math.min(100, Math.round((elapsed / estimatedTotal) * 100))

  return { showNotice, elapsed, countdown, progress }
}

export function ColdStartNotice({
  en: _en = true,
  elapsed,
  countdown,
  progress,
  variant = 'overlay',
  onBypass,
}: {
  en?: boolean
  elapsed: number
  countdown?: number
  progress?: number
  variant?: 'overlay' | 'card'
  onBypass?: () => void
}) {
  const remaining = countdown !== undefined ? countdown : Math.max(0, 50 - elapsed)
  const pct = progress !== undefined ? progress : Math.min(100, Math.round((elapsed / 50) * 100))

  const phaseText =
    remaining > 35
      ? 'Waking cloud container & warming up network…'
      : remaining > 15
        ? 'Booting NestJS services & database pool…'
        : remaining > 0
          ? 'Finalizing secure connection to mission telemetry…'
          : 'Ready! Establishing final handshake…'

  const content = (
    <div className={`plat-coldstart-box ${variant === 'card' ? 'is-card' : 'is-overlay'}`} role="status" aria-live="polite">
      <div className="plat-coldstart-head">
        <span className="plat-coldstart-icon" aria-hidden="true">
          <Server size={22} />
        </span>
        <div className="plat-coldstart-title-wrap">
          <h3 className="plat-coldstart-title">
            Initializing HELIOS System
          </h3>
          <span className="plat-coldstart-badge">
            <Radio size={12} className="plat-coldstart-pulse" aria-hidden="true" />
            Cloud Server Waking Up (Cold-Start)
          </span>
        </div>
      </div>

      <p className="plat-coldstart-desc">
        Please wait a few seconds while the system loads. Free cloud servers enter sleep mode after 15 minutes of inactivity and take approximately 45–60 seconds to spin up on first visit. HELIOS will connect automatically once online.
      </p>

      {/* Temporizador / Live Countdown Display */}
      <div className="plat-timer-display">
        <div className="plat-timer-circle" aria-label={`Estimated ${remaining} seconds remaining`}>
          <span className="plat-timer-number">{remaining > 0 ? remaining : '0'}</span>
          <span className="plat-timer-unit">{remaining > 0 ? 'sec left' : 'ready'}</span>
        </div>
        <div className="plat-timer-meta">
          <span className="plat-timer-phase">{phaseText}</span>
          <span className="plat-timer-counts">
            <Clock size={12} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Elapsed: <strong>{elapsed}s</strong> · Estimated total: <strong>~50s</strong>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="plat-coldstart-footer">
        <div className="plat-coldstart-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="plat-coldstart-bar-fill-determinate"
            style={{ width: `${Math.max(6, pct)}%` }}
          />
        </div>
      </div>

      {/* Instant Demo Mode Bypass Button */}
      {onBypass ? (
        <button
          type="button"
          className="plat-coldstart-bypass-btn"
          onClick={onBypass}
          title="Skip server wake-up and enter immediately using cached offline demo profiles"
        >
          <Zap size={14} aria-hidden="true" />
          <span>Don’t want to wait? Launch Instant Demo Mode →</span>
        </button>
      ) : null}
    </div>
  )

  if (variant === 'overlay') {
    return (
      <div className="plat-coldstart-overlay" role="dialog" aria-modal="true" aria-label="Server wake-up timer">
        {content}
      </div>
    )
  }

  return content
}
