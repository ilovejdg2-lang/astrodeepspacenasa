import { useState, useRef, useEffect } from 'react'
import { CircleHelp, X } from 'lucide-react'
import { useLocale } from '../i18n'

export function InfoHelp({
  title,
  text,
  enTitle,
  enText,
  whatIs,
  enWhatIs,
  howToUse,
  enHowToUse,
  steps,
  enSteps,
  side = 'bottom',
}: {
  title?: string
  text?: string
  enTitle?: string
  enText?: string
  whatIs?: string
  enWhatIs?: string
  howToUse?: string
  enHowToUse?: string
  steps?: string[]
  enSteps?: string[]
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { lang } = useLocale()
  const en = lang === 'en'

  const displayTitle = en ? (enTitle || title) : title
  const displayText = en ? (enText || text) : text
  const displayWhatIs = en ? (enWhatIs || whatIs) : whatIs
  const displayHowToUse = en ? (enHowToUse || howToUse) : howToUse
  const displaySteps = en ? (enSteps || steps) : steps

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent | PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span
      ref={containerRef}
      className={`info-help-anchor side-${side}`}
      style={{ display: 'inline-flex', verticalAlign: 'middle', position: 'relative', margin: '0 6px' }}
    >
      <button
        type="button"
        aria-label={en ? 'Explain this section' : 'Explicar esta sección'}
        title={en ? 'Click to see what this does' : 'Hacé clic para ver qué hace esta parte'}
        aria-expanded={open}
        className="info-help-btn"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <CircleHelp size={19} strokeWidth={2.3} aria-hidden="true" />
      </button>

      {open && (
        <span className={`info-help-popover side-${side}`} role="dialog" aria-modal="false" onClick={(e) => e.stopPropagation()}>
          <span className="info-help-head">
            <strong>{displayTitle || (en ? 'How this section works' : 'Cómo funciona esta parte')}</strong>
            <button
              type="button"
              className="info-help-close"
              aria-label={en ? 'Close help' : 'Cerrar ayuda'}
              onClick={() => setOpen(false)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </span>
          <span className="info-help-body">
            {displayWhatIs ? (
              <span className="info-help-section">
                <span className="info-help-label">{en ? 'WHAT IS THIS SECTION?' : '¿QUÉ ES ESTE APARTADO?'}</span>
                <span className="info-help-text">{displayWhatIs}</span>
              </span>
            ) : null}

            {displayHowToUse || (displaySteps && displaySteps.length > 0) ? (
              <span className="info-help-section">
                <span className="info-help-label">{en ? 'HOW TO USE IT:' : '¿CÓMO USARLO?'}</span>
                {displaySteps && displaySteps.length > 0 ? (
                  <span className="info-help-steps">
                    {displaySteps.map((step, idx) => (
                      <span key={idx} className="info-help-step-item">
                        <span className="info-help-step-num">{idx + 1}.</span> {step}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="info-help-text">{displayHowToUse}</span>
                )}
              </span>
            ) : null}

            {!displayWhatIs && !displayHowToUse && (!displaySteps || displaySteps.length === 0) ? (
              <span className="info-help-text">{displayText}</span>
            ) : null}
          </span>
        </span>
      )}
    </span>
  )
}
