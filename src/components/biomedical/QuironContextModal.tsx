import { useState, useId } from 'react'
import { Send, Shield, Lock } from 'lucide-react'
import { QuironFigure } from '../quiron/QuironFigure'
import { Modal } from '../ui'
import type { BiomedicalSystemDefinition } from '../../domain/biomedical'
import type { HealthIndicatorReading } from '../../platform/api'
import { catalogEntry, formatIndicatorValue } from '../../domain/healthIndicators'

export function QuironContextModal({
  open,
  onClose,
  en,
  system,
  latestReading,
  baselineText,
  crewMemberName,
}: {
  open: boolean
  onClose: () => void
  en: boolean
  system: BiomedicalSystemDefinition
  latestReading?: HealthIndicatorReading
  baselineText?: string
  crewMemberName?: string
}) {
  const defaultPrompt = latestReading
    ? en
      ? `Can you explain what my recent ${catalogEntry(latestReading.kind)?.name.en || latestReading.kind} reading of ${formatIndicatorValue(latestReading, true)} represents in spaceflight, and what factors or baseline trends I should keep in mind?`
      : `¿Podés explicarme qué representa mi registro reciente de ${catalogEntry(latestReading.kind)?.name.es || latestReading.kind} (${formatIndicatorValue(latestReading, false)}) en vuelo espacial, y qué factores o tendencias de línea base debería tener en cuenta?`
    : en
      ? `Can you explain the main spaceflight adaptations affecting the ${system.name.en} system, and what questions I should prepare if I request a clinical check-in?`
      : `¿Podés explicarme las principales adaptaciones al vuelo espacial que afectan el sistema ${system.name.es}, y qué preguntas debería preparar si solicito una consulta clínica?`

  const [question, setQuestion] = useState(defaultPrompt)
  const inputId = useId()

  function handleSend() {
    // Dispatch contextual inquiry to Quirón
    window.dispatchEvent(
      new CustomEvent('helios:quiron-demo', {
        detail: {
          question: question.trim(),
        },
      }),
    )
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={en ? 'Ask Quirón about this' : 'Consultar a Quirón sobre esto'}
      aria-describedby="quiron-context-desc"
    >
      <div className="biomed-quiron-modal">
        <div className="biomed-quiron-hero">
          <div className="biomed-quiron-avatar" aria-hidden="true">
            <QuironFigure bubble={false} />
          </div>
          <div>
            <h4>{en ? 'In-Flight Biomedical Assistant' : 'Asistente biomédico en vuelo'}</h4>
            <p id="quiron-context-desc" className="rd-muted">
              {en
                ? 'Quirón can explain what this indicator represents, summarize observed trends, identify missing data, and help formulate a consultation question for the mission flight surgeon. Quirón does not provide clinical diagnoses.'
                : 'Quirón puede explicar qué representa este indicador, resumir tendencias observadas, señalar datos faltantes y ayudarte a preparar una consulta médica. Quirón no emite diagnósticos clínicos.'}
            </p>
          </div>
        </div>

        {/* Disclosed Context Card */}
        <div className="biomed-disclosed-context">
          <div className="biomed-disclosed-head">
            <Shield size={14} aria-hidden="true" />
            <strong>{en ? 'Context to be shared with Quirón:' : 'Contexto que se compartirá con Quirón:'}</strong>
          </div>
          <ul className="biomed-disclosed-list">
            <li>
              <span>{en ? 'Subject:' : 'Persona:'}</span> <strong>{crewMemberName || (en ? 'Active crew member' : 'Tripulante actual')}</strong>
            </li>
            <li>
              <span>{en ? 'Physiological system:' : 'Sistema fisiológico:'}</span> <strong>{en ? system.name.en : system.name.es}</strong>
            </li>
            {latestReading ? (
              <li>
                <span>{en ? 'Latest reading:' : 'Último registro:'}</span>{' '}
                <strong>
                  {formatIndicatorValue(latestReading, en)} ({latestReading.origin}, {latestReading.quality})
                </strong>
              </li>
            ) : null}
            {baselineText ? (
              <li>
                <span>{en ? 'Baseline context:' : 'Contexto de línea base:'}</span> <strong>{baselineText}</strong>
              </li>
            ) : null}
            <li>
              <span>{en ? 'Spaceflight hazards:' : 'Riesgos espaciales:'}</span>{' '}
              <strong>{system.spaceflightContext.map((s) => (en ? s.title.en : s.title.es)).join(', ')}</strong>
            </li>
          </ul>

          <div className="biomed-privacy-note">
            <Lock size={12} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            <span>
              {en
                ? 'Private emotional journal entries and unrelated medical notes are never included.'
                : 'Diarios emocionales privados y notas médicas no relacionadas nunca se incluyen.'}
            </span>
          </div>
        </div>

        {/* Question Prompt Editor */}
        <div className="rd-field" style={{ marginTop: 12 }}>
          <label htmlFor={inputId}>{en ? 'Your inquiry to Quirón' : 'Tu consulta para Quirón'}</label>
          <textarea
            id={inputId}
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="biomed-quiron-textarea"
          />
        </div>

        <div className="biomed-modal-actions">
          <button type="button" className="rd-btn ghost" onClick={onClose}>
            {en ? 'Cancel' : 'Cancelar'}
          </button>
          <button
            type="button"
            className="rd-btn"
            onClick={handleSend}
            disabled={!question.trim()}
          >
            <Send size={15} aria-hidden="true" />
            {en ? 'Send inquiry to Quirón' : 'Enviar consulta a Quirón'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
