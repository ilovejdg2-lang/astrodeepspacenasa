import { MISSION_PROCESS_STEPS, stageHint, stageLabel } from '../../platform/copy'

/** Barra de proceso: Borrador → explicación · Preembarque → … */
export function MissionProcessStrip({
  stage,
  en,
  compact = false,
  showStatus = false,
}: {
  stage: string
  en: boolean
  compact?: boolean
  showStatus?: boolean
}) {
  const current = Math.max(0, MISSION_PROCESS_STEPS.indexOf(stage as (typeof MISSION_PROCESS_STEPS)[number]))
  const activeIdx = stage === 'cancelled' || stage === 'archived' ? -1 : current

  return (
    <ol className={`mission-process${compact ? ' is-compact' : ''}`} aria-label={en ? 'Mission process' : 'Proceso de misión'}>
      {MISSION_PROCESS_STEPS.map((step, index) => {
        const state = activeIdx < 0
          ? 'is-idle'
          : index < activeIdx
            ? 'is-done'
            : index === activeIdx
              ? 'is-current'
              : 'is-todo'
        const status = activeIdx < 0
          ? (en ? 'Not active' : 'No activa')
          : index < activeIdx || (index === activeIdx && stage === 'postmission')
            ? (en ? 'Complete' : 'Completa')
            : index === activeIdx
              ? (en ? 'In progress' : 'En curso')
              : (en ? 'Upcoming' : 'Pendiente')
        const hint = stageHint(step, en)
        return (
          <li key={step} className={state} aria-current={index === activeIdx ? 'step' : undefined}>
            <span className="mission-process-dot" aria-hidden="true" />
            <span className="mission-process-line">
              <span className="mission-process-label">{stageLabel(step, en)}</span>
              {hint ? (
                <>
                  <span className="mission-process-arrow" aria-hidden="true">→</span>
                  <span className="mission-process-hint">{hint}</span>
                </>
              ) : null}
              {showStatus ? <span className="mission-process-status">{status}</span> : null}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
