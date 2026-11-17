import {
  Heart,
  Wind,
  Moon,
  Bone,
  Apple,
  Smile,
  Plus,
  Calendar,
  History,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { BiomedicalSystemDefinition } from '../../domain/biomedical'
import { computeBaseline, isSystemAuthorizedForRole } from '../../domain/biomedical'
import {
  catalogEntry,
  evaluateIndicatorState,
  formatIndicatorValue,
  stateLabel,
} from '../../domain/healthIndicators'
import type { HealthIndicatorReading } from '../../platform/api'
import type { WorkspaceRole } from '../../platform/workspace'
import type { PainMapReport } from '../../domain/painMap'

export function SystemPanel({
  en,
  system,
  readings,
  role,
  stage,
  painReports = [],
  onOpenRecordIndicator,
  onOpenRecordPain,
  onOpenQuironModal,
  onRequestConsultation,
}: {
  en: boolean
  system: BiomedicalSystemDefinition
  readings: HealthIndicatorReading[]
  role: WorkspaceRole | null
  stage?: string
  painReports?: PainMapReport[]
  onOpenRecordIndicator: () => void
  onOpenRecordPain: () => void
  onOpenQuironModal: (reading?: HealthIndicatorReading) => void
  onRequestConsultation: () => void
}) {
  const isAuthorized = isSystemAuthorizedForRole(system.id, role)
  const canRecord = stage !== 'postmission' && stage !== 'archived'

  // Icon selector
  const IconComp =
    system.iconName === 'heart'
      ? Heart
      : system.iconName === 'wind'
        ? Wind
        : system.iconName === 'moon'
          ? Moon
          : system.iconName === 'bone'
            ? Bone
            : system.iconName === 'apple'
              ? Apple
              : Smile

  if (!isAuthorized) {
    return (
      <div className="biomed-system-panel">
        <header className="biomed-system-header">
          <div className="biomed-system-title-wrap">
            <span className="biomed-system-icon-badge" aria-hidden="true">
              <IconComp size={22} />
            </span>
            <div>
              <p className="rd-kicker">{en ? 'System Overview' : 'Resumen del sistema'}</p>
              <h2>{en ? system.name.en : system.name.es}</h2>
            </div>
          </div>
        </header>

        <div className="callout callout-amber" role="alert" style={{ marginTop: 16 }}>
          <ShieldAlert size={20} aria-hidden="true" style={{ flexShrink: 0 }} />
          <div>
            <strong>{en ? 'Scope restriction' : 'Restricción de alcance'}</strong>
            <p>
              {en
                ? 'The psychologist role is authorized for Behavioral Health and Sleep/Recovery categories only. Physical biometrics and musculoskeletal records are restricted to the crew member and the mission physician.'
                : 'El rol de psicología tiene acceso autorizado exclusivamente a las categorías de Salud Conductual y Sueño/Recuperación. Los indicadores biomédicos físicos y musculoesqueléticos están reservados para el tripulante y el médico de misión.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="biomed-system-panel">
      {/* System Header */}
      <header className="biomed-system-header">
        <div className="biomed-system-title-wrap">
          <span className="biomed-system-icon-badge" aria-hidden="true">
            <IconComp size={22} />
          </span>
          <div>
            <p className="rd-kicker">{en ? 'Body System' : 'Sistema corporal'}</p>
            <h2>{en ? system.name.en : system.name.es}</h2>
          </div>
        </div>
        <p className="biomed-system-desc">{en ? system.description.en : system.description.es}</p>
      </header>

      {/* Available Indicators Section */}
      <section className="biomed-indicators-list" aria-label={en ? 'Available indicators' : 'Indicadores disponibles'}>
        <div className="biomed-subhead">
          <h3>{en ? 'Available indicators' : 'Indicadores disponibles'}</h3>
          {canRecord && system.indicatorKinds.length > 0 ? (
            <button type="button" className="rd-btn-xs" onClick={onOpenRecordIndicator}>
              <Plus size={14} aria-hidden="true" />
              {en ? 'Log reading' : 'Registrar'}
            </button>
          ) : null}
          {canRecord && system.id === 'musculoskeletal' ? (
            <button type="button" className="rd-btn-xs" onClick={onOpenRecordPain}>
              <Plus size={14} aria-hidden="true" />
              {en ? 'Record pain' : 'Registrar dolor'}
            </button>
          ) : null}
        </div>

        {system.id === 'musculoskeletal' ? (
          // Musculoskeletal specific indicators view (Pain reports)
          <div className="biomed-indicator-card">
            <div className="biomed-indicator-top">
              <div>
                <h4>{en ? 'Somatic pain & discomfort reports' : 'Reportes de dolor somático y malestar'}</h4>
                <p className="rd-muted">
                  {en
                    ? 'Anatomical locations, intensity, and duration recorded via 3D/2D body map.'
                    : 'Ubicaciones anatómicas, intensidad y duración registradas en el mapa corporal.'}
                </p>
              </div>
              <span className="biomed-badge badge-observation">
                {painReports.length} {en ? 'reports logged' : 'reportes'}
              </span>
            </div>

            {painReports.length === 0 ? (
              <p className="rd-muted" style={{ margin: '8px 0' }}>
                {en ? 'No pain locations currently reported in this mission.' : 'No hay ubicaciones de dolor reportadas en esta misión.'}
              </p>
            ) : (
              <ul className="biomed-pain-mini-list">
                {painReports.slice(0, 3).map((r) => (
                  <li key={r.id}>
                    <strong>
                      {r.marks.length} {en ? 'location(s)' : 'ubicación(es)'}:
                    </strong>{' '}
                    {r.marks.map((m) => m.regionLabel || m.regionId).join(', ')} ·{' '}
                    <span className="rd-muted">{r.status}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="biomed-actions-row">
              {canRecord ? (
                <button type="button" className="rd-btn-xs" onClick={onOpenRecordPain}>
                  <Plus size={13} aria-hidden="true" />
                  {en ? 'Record pain / Open body map' : 'Registrar dolor / Abrir mapa'}
                </button>
              ) : null}
              <button
                type="button"
                className="rd-btn-xs ghost"
                onClick={() => onOpenQuironModal()}
              >
                <Sparkles size={13} aria-hidden="true" />
                {en ? 'Ask Quirón about back/muscle health' : 'Consultar a Quirón sobre salud muscular'}
              </button>
            </div>
          </div>
        ) : system.indicatorKinds.length === 0 ? (
          <p className="rd-muted">
            {en ? 'No numeric scalar indicators defined for this system.' : 'No hay indicadores numéricos escalares para este sistema.'}
          </p>
        ) : (
          system.indicatorKinds.map((kind) => {
            const entry = catalogEntry(kind)
            const kindReadings = readings
              .filter((r) => r.kind === kind)
              .sort((a, b) => b.measuredAt - a.measuredAt)
            const latest = kindReadings[0]
            const previous = kindReadings[1]
            const evalState = evaluateIndicatorState(latest, previous)
            const baseline = computeBaseline(kindReadings, en)

            return (
              <article key={kind} className="biomed-indicator-card">
                <div className="biomed-indicator-top">
                  <div className="biomed-indicator-title-group">
                    <h4>{entry ? (en ? entry.name.en : entry.name.es) : kind}</h4>
                    <span className="biomed-origin-badge">
                      {latest ? latest.origin : (en ? 'no origin' : 'sin origen')}
                    </span>
                  </div>
                  <span className={`biomed-state-tag state-${evalState.state}`}>
                    {stateLabel(evalState.state, en)}
                  </span>
                </div>

                <div className="biomed-indicator-values-row">
                  <div className="biomed-reading-primary">
                    <span className="biomed-value-big">
                      {latest ? formatIndicatorValue(latest, en) : (en ? '—' : '—')}
                    </span>
                    <span className="biomed-reading-time">
                      <Clock size={12} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 3 }} />
                      {latest
                        ? new Date(latest.measuredAt).toLocaleString(en ? 'en-US' : 'es-CR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : (en ? 'No measurements' : 'Sin mediciones')}
                    </span>
                  </div>

                  <div className="biomed-baseline-block">
                    <span className="rd-muted" style={{ fontSize: '0.78rem' }}>
                      {en ? 'Individual baseline:' : 'Línea base individual:'}
                    </span>
                    <p className="biomed-baseline-sentence">
                      {baseline.baselineText}
                    </p>
                  </div>
                </div>

                <div className="biomed-actions-row">
                  {canRecord ? (
                    <button
                      type="button"
                      className="rd-btn-xs"
                      onClick={onOpenRecordIndicator}
                    >
                      <Plus size={13} aria-hidden="true" />
                      {en ? 'Add reading' : 'Agregar medición'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="rd-btn-xs ghost"
                    onClick={() => onOpenQuironModal(latest)}
                  >
                    <Sparkles size={13} aria-hidden="true" />
                    {en ? 'Ask Quirón about this' : 'Consultar a Quirón sobre esto'}
                  </button>
                  {latest && (evalState.state === 'needs_check' || evalState.state === 'stale') && canRecord ? (
                    <button type="button" className="rd-btn-xs ghost" onClick={onOpenRecordIndicator}>
                      {en ? 'Repeat measurement' : 'Repetir medición'}
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })
        )}
      </section>

      {/* Next Step Section */}
      <section className="biomed-next-steps-section">
        <h3 className="biomed-subhead-title">{en ? 'Next step' : 'Siguiente paso'}</h3>
        <div className="biomed-next-buttons">
          {canRecord && system.indicatorKinds.length > 0 ? (
            <button type="button" className="rd-btn" onClick={onOpenRecordIndicator}>
              <Plus size={15} aria-hidden="true" />
              {en ? 'Record a measurement' : 'Registrar una medición'}
            </button>
          ) : null}

          {system.id === 'musculoskeletal' && canRecord ? (
            <button type="button" className="rd-btn" onClick={onOpenRecordPain}>
              <Bone size={15} aria-hidden="true" />
              {en ? 'Open body map & record pain' : 'Abrir mapa corporal y registrar dolor'}
            </button>
          ) : null}

          <button
            type="button"
            className="rd-btn ghost"
            onClick={() => onOpenQuironModal()}
          >
            <Sparkles size={15} aria-hidden="true" />
            {en ? 'Ask Quirón' : 'Consultar a Quirón'}
          </button>

          <button
            type="button"
            className="rd-btn ghost"
            onClick={onRequestConsultation}
          >
            <Calendar size={15} aria-hidden="true" />
            {en ? 'Request consultation' : 'Solicitar consulta'}
          </button>

          <Link to="/app/historial" className="rd-btn ghost">
            <History size={15} aria-hidden="true" />
            {en ? 'View history' : 'Ver historial'}
          </Link>
        </div>
      </section>
    </div>
  )
}
