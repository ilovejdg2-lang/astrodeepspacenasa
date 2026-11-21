import { useState } from 'react'
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
  Eye,
  Maximize2,
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
import { aspectLabel, sideLabel } from '../../domain/painMap'
import { profileDisplayName } from '../../platform/copy'

function stamp(ms: number, en: boolean) {
  const locale = en ? 'en-GB' : 'es'
  const day = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', day: '2-digit', month: 'short' }).format(ms)
  const time = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms)
  return { day, time }
}

function intensityClass(val: number) {
  if (val <= 3) return 'mild'
  if (val <= 6) return 'moderate'
  return 'severe'
}

function intensityLabel(val: number, en: boolean) {
  if (val <= 3) return en ? 'Mild' : 'Leve'
  if (val <= 6) return en ? 'Moderate' : 'Moderado'
  return en ? 'Severe' : 'Severo'
}

function AddObservationForm({
  reportId,
  onAddObservation,
  en,
}: {
  reportId: string
  onAddObservation: (reportId: string, note: string) => Promise<void>
  en: boolean
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (note.trim().length < 3) {
      setError(en ? 'Please enter at least 3 characters.' : 'Ingresá al menos 3 caracteres.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onAddObservation(reportId, note.trim())
      setNote('')
      setOk(true)
      setTimeout(() => setOk(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : (en ? 'Could not save observation' : 'No se pudo guardar la observación'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="biomed-add-obs-form">
      <label htmlFor={`obs-${reportId}`} className="rd-muted" style={{ fontSize: '0.82rem', fontWeight: 650, display: 'block', marginBottom: 4 }}>
        {en ? '+ Append Doctor’s Clinical Observation:' : '+ Agregar observación clínica médica:'}
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          id={`obs-${reportId}`}
          type="text"
          value={note}
          disabled={busy}
          placeholder={en ? 'E.g. Spaceflight lumbar decompression protocol recommended. No radicular deficit.' : 'Ej. Se indica descompresión lumbar. Sin déficit radicular.'}
          onChange={(e) => setNote(e.target.value)}
          className="rd-field-input"
          style={{ flex: '1 1 240px', padding: '6px 10px', fontSize: '0.84rem' }}
        />
        <button
          type="submit"
          className="rd-btn-xs"
          disabled={busy || note.trim().length < 3}
          style={{ whiteSpace: 'nowrap' }}
        >
          {busy ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Save observation' : 'Guardar observación')}
        </button>
      </div>
      {error ? <p className="field-error" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>{error}</p> : null}
      {ok ? <p className="field-ok" style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#4ade80' }}>{en ? 'Observation saved to medical record.' : 'Observación guardada en el expediente.'}</p> : null}
    </form>
  )
}

export function SystemPanel({
  en,
  system,
  readings,
  role,
  stage,
  painReports = [],
  isSelf = true,
  targetMemberName,
  selectedMarkId = null,
  onSelectMark,
  onAddObservation,
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
  isSelf?: boolean
  targetMemberName?: string
  selectedMarkId?: string | null
  onSelectMark?: (markId: string) => void
  onAddObservation?: (reportId: string, note: string) => Promise<void>
  onOpenRecordIndicator: () => void
  onOpenRecordPain: () => void
  onOpenQuironModal: (reading?: HealthIndicatorReading) => void
  onRequestConsultation: () => void
}) {
  const isAuthorized = isSelf || isSystemAuthorizedForRole(system.id, role)
  const canRecord = isSelf && stage !== 'postmission' && stage !== 'archived' && stage !== 'cancelled'

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
              {role === 'medic'
                ? (en
                  ? 'The physician role is authorized for Physical Systems (Musculoskeletal, Cardiovascular, Respiratory, Nutrition). Mental health, sleep and emotional records are reserved for the psychologist and the crew member.'
                  : 'El rol de médico tiene acceso autorizado exclusivamente a los sistemas físicos (musculoesquelético, cardiovascular, respiratorio y nutrición). Los registros de salud mental, sueño y bienestar emocional están reservados para el psicólogo y el tripulante.')
                : (en
                  ? 'The psychologist role is authorized for Behavioral Health and Sleep/Recovery categories only. Physical biometrics and musculoskeletal records are restricted to the crew member and the mission physician.'
                  : 'El rol de psicología tiene acceso autorizado exclusivamente a las categorías de Salud Conductual y Sueño/Recuperación. Los indicadores biomédicos físicos y musculoesqueléticos están reservados para el tripulante y el médico de misión.')}
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

      {/* Next Step / Quick Actions Section - Placed ABOVE the indicator cards */}
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
              <div className="biomed-pain-reports-stack">
                {painReports.map((r) => (
                  <article key={r.id} className="biomed-pain-report-card">
                    <header className="biomed-pain-card-head">
                      <div className="biomed-pain-head-left">
                        <Bone size={16} aria-hidden="true" />
                        <strong>{en ? 'Reported Pain Map' : 'Mapa de dolor reportado'}</strong>
                        <span className="biomed-origin-badge">
                          {isSelf
                            ? (en ? 'My Self-Report' : 'Mi autorreporte')
                            : (en ? `Patient Self-Report (${targetMemberName || 'Patient'})` : `Autorreporte del paciente (${targetMemberName || 'Paciente'})`)}
                        </span>
                      </div>
                      <div className="biomed-pain-head-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="biomed-report-date">
                          {stamp(r.createdAt, en).day}, {stamp(r.createdAt, en).time} UTC
                        </span>
                        <button
                          type="button"
                          className="rd-btn-xs"
                          onClick={onOpenRecordPain}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', fontSize: '0.78rem' }}
                          title={en ? 'Open interactive full-screen 3D Body Map' : 'Abrir mapa 3D interactivo en pantalla completa'}
                        >
                          <Maximize2 size={12} aria-hidden="true" />
                          <span>{en ? 'Open 3D Model' : 'Abrir en 3D'}</span>
                        </button>
                        <span className={`biomed-status-pill status-${r.status}`}>
                          {r.status === 'open' ? (en ? 'Active Report' : 'Reporte Activo') : (en ? 'Resolved' : 'Resuelto')}
                        </span>
                      </div>
                    </header>

                    {/* Marks list */}
                    <div className="biomed-pain-marks-list">
                      {r.marks.map((m, idx) => {
                        const isSelected = selectedMarkId === m.id
                        return (
                        <div key={m.id || idx} id={`biomed-mark-${m.id}`} className={`biomed-pain-mark-item ${isSelected ? 'is-selected-mark' : ''}`}>
                          <div className="biomed-mark-primary-row">
                            <span className="biomed-mark-region-title">
                              #{idx + 1}. {m.regionLabel || m.regionId}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {onSelectMark ? (
                                <button
                                  type="button"
                                  className={`biomed-focus-mark-btn ${isSelected ? 'is-active' : ''}`}
                                  onClick={() => onSelectMark(m.id)}
                                  title={en ? 'Focus and center camera on this exact 3D location' : 'Enfocar y centrar cámara en este punto exacto en el visor 3D'}
                                >
                                  <Eye size={13} aria-hidden="true" />
                                  <span>{isSelected ? (en ? 'Focused in 3D' : 'Enfocado en 3D') : (en ? 'Focus in 3D' : 'Enfocar en 3D')}</span>
                                </button>
                              ) : null}
                              <span className={`biomed-intensity-pill ${intensityClass(m.intensity)}`}>
                                {m.intensity}/10 · {intensityLabel(m.intensity, en)}
                              </span>
                            </div>
                          </div>

                          <div className="biomed-mark-meta-row">
                            <span>
                              {sideLabel(m.laterality, en)} · {aspectLabel(m.aspect, en)}
                            </span>
                            <span>•</span>
                            <span>
                              {m.pattern === 'constant'
                                ? (en ? 'Constant pattern' : 'Patrón constante')
                                : (en ? 'Intermittent pattern' : 'Patrón intermitente')}
                            </span>
                            {m.startedAt ? (
                              <>
                                <span>•</span>
                                <span>
                                  {en ? 'Onset: ' : 'Inicio: '}
                                  {stamp(m.startedAt, en).day}, {stamp(m.startedAt, en).time} UTC
                                </span>
                              </>
                            ) : null}
                          </div>

                          {m.description ? (
                            <p className="biomed-pain-desc">
                              <strong>{en ? 'Patient report:' : 'Descripción del paciente:'}</strong> “{m.description}”
                            </p>
                          ) : null}

                          <div className="biomed-mark-tags-row">
                            {m.activity ? (
                              <span className="biomed-tag">
                                {en ? 'Activity:' : 'Actividad:'} {m.activity}
                              </span>
                            ) : null}
                            {m.additionalSymptoms ? (
                              <span className="biomed-tag">
                                {en ? 'Associated:' : 'Asociado:'} {m.additionalSymptoms}
                              </span>
                            ) : null}
                            {m.notes ? (
                              <span className="biomed-tag">
                                {en ? 'Notes:' : 'Notas:'} {m.notes}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                    </div>

                    {/* Clinical observations section */}
                    <section className="biomed-clinical-notes-section">
                      <h5 className="biomed-notes-title">
                        {en ? 'Physician Clinical Observations & Notes' : 'Observaciones clínicas y notas médicas'}
                        <span className="biomed-notes-count">({r.clinicalNotes?.length || 0})</span>
                      </h5>

                      {r.clinicalNotes && r.clinicalNotes.length > 0 ? (
                        <div className="biomed-clinical-notes-list">
                          {r.clinicalNotes.map((note) => (
                            <div key={note.id} className="biomed-clinical-note-entry">
                              <div className="biomed-note-meta">
                                <strong>
                                  {profileDisplayName(note.authorProfileId)} ({en ? 'Physician' : 'Médico'})
                                </strong>
                                <span className="rd-muted">
                                  {stamp(note.createdAt, en).day}, {stamp(note.createdAt, en).time} UTC
                                </span>
                              </div>
                              <p className="biomed-note-body">{note.body}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rd-muted" style={{ fontSize: '0.84rem', margin: '4px 0 8px' }}>
                          {en
                            ? 'No clinical observations have been recorded for this report yet.'
                            : 'Aún no se han registrado observaciones clínicas para este reporte.'}
                        </p>
                      )}

                      {/* Doctor can append observation */}
                      {role === 'medic' && onAddObservation ? (
                        <AddObservationForm
                          reportId={r.id}
                          onAddObservation={onAddObservation}
                          en={en}
                        />
                      ) : null}
                    </section>
                  </article>
                ))}
              </div>
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
    </div>
  )
}
