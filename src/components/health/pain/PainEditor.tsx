import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { platformApi } from '../../../platform/api'
import {
  BODY_REGIONS,
  PAIN_MODEL,
  VIEW_PREF_KEY,
  anchorFor,
  aspectLabel,
  clearPainDraft,
  displayRegion,
  draftComplete,
  intensityNote,
  newDraftMark,
  normalizePainMark,
  painHelp,
  readPainDraft,
  regionName,
  sideLabel,
  sidesFor,
  toPainMark,
  webglAvailable,
  writePainDraft,
  type BodyHit,
  type PainAspect,
  type PainDraft,
  type PainDraftMark,
  type PainLaterality,
} from '../../../domain/painMap'
import { BodyMap2D } from './BodyMap2D'
import { BodyViewport, PainCameraControls, type BodyViewportHandle } from './BodyViewport'
import { getStoredProfile } from '../../../platform/session'
import './pain-map.css'

type Visit = { id: string; scheduledAt?: number | null; reason?: string }

class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onError: () => void }, { failed: boolean }> {
  override state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  override componentDidCatch() { this.props.onError() }
  override render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function stamp(ms: number | null) {
  if (ms == null) return ''
  const date = new Date(ms)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromStamp(value: string) {
  if (!value) return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

export function PainEditor({
  en,
  missionId,
  profileId,
  stage,
  appointments,
  seed,
  readOnly,
  onClose,
  onSaved,
}: {
  en: boolean
  missionId: string
  profileId: string
  stage?: string
  appointments: Visit[]
  seed: PainDraft | null
  readOnly?: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const currentProfile = getStoredProfile()
  const isOwner = readOnly !== undefined ? !readOnly : (!currentProfile?.id || currentProfile.id === profileId)
  const stored = seed ?? readPainDraft(missionId, profileId)
  const initialMarks = useMemo(() => (stored?.marks ?? []).map((m) => normalizePainMark(m)), [stored])
  const [marks, setMarks] = useState<PainDraftMark[]>(initialMarks)
  const [selectedId, setSelectedId] = useState<string | null>(initialMarks[0]?.id ?? null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [step, setStep] = useState<'locate' | 'details' | 'preview'>('locate')
  const [flat, setFlat] = useState(() => {
    try { return localStorage.getItem(VIEW_PREF_KEY) === '2d' || !webglAvailable() } catch { return !webglAvailable() }
  })
  const [modelFailed, setModelFailed] = useState(false)
  const [placeMode, setPlaceMode] = useState(true)
  const [regionChoice, setRegionChoice] = useState('chest')
  const [sideChoice, setSideChoice] = useState<PainLaterality>('midline')
  const [aspectChoice, setAspectChoice] = useState<PainAspect>('anterior')
  const [appointmentId, setAppointmentId] = useState<string | null>(stored?.appointmentId ?? null)
  const [conflict, setConflict] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [restored] = useState(Boolean(stored?.marks.length))
  const viewRef = useRef<BodyViewportHandle>(null)
  const followsReportId = stored?.followsReportId ?? null
  const correctingId = stored?.correctingId ?? null
  const isStageReadOnly = stage === 'postmission' || stage === 'archived' || stage === 'cancelled'
  const writable = !isStageReadOnly && !conflict

  useEffect(() => {
    if (stage && (stage === 'postmission' || stage === 'archived' || stage === 'cancelled')) {
      setConflict(en
        ? 'The mission is complete or archived. A new pain record cannot be saved in this stage. What you wrote was kept temporarily in this browser.'
        : 'La misión ha finalizado o está archivada. No se puede guardar un registro de dolor nuevo en esta etapa. Lo que escribiste se conservó temporalmente en este navegador.')
    } else {
      setConflict('')
    }
  }, [stage, en])

  useEffect(() => {
    const sides = sidesFor(regionChoice)
    if (!sides.includes(sideChoice)) setSideChoice(sides[0] ?? 'left')
  }, [regionChoice, sideChoice])

  useEffect(() => {
    writePainDraft(missionId, profileId, { v: 1, marks, followsReportId, correctingId, appointmentId })
  }, [missionId, profileId, marks, followsReportId, correctingId, appointmentId])

  const shown = useMemo(() => marks.map((mark, index) => ({
    id: mark.id,
    label: String(index + 1),
    localPosition: mark.localPosition,
    normal: mark.normal,
    surfaceId: mark.surfaceId,
    regionId: mark.regionId,
    laterality: mark.laterality,
    aspect: mark.aspect,
  })), [marks])

  function describe(mark: PainDraftMark) {
    return `${displayRegion(mark, en)}. ${sideLabel(mark.laterality, en)}. ${aspectLabel(mark.aspect, en)}`
  }

  function place(hit: BodyHit) {
    if (!placeMode || step !== 'locate') return
    setError('')
    if (movingId) {
      setMarks((current) => current.map((mark) => {
        if (mark.id !== movingId) return mark
        const keepLabel = mark.labelSource === 'user'
        return {
          ...mark,
          kind: hit.kind,
          detectedRegionId: hit.regionId,
          regionId: keepLabel ? mark.regionId : hit.regionId,
          regionLabel: keepLabel ? mark.regionLabel : regionName(hit.regionId, true),
          laterality: keepLabel ? mark.laterality : hit.laterality,
          aspect: keepLabel ? mark.aspect : hit.aspect,
          localPosition: hit.localPosition,
          normal: hit.normal,
          surfaceId: hit.surfaceId,
        }
      }))
      setMovingId(null)
      const current = marks.find((mark) => mark.id === movingId)
      if (current) setLiveText(describe({ ...current, ...hit, regionId: current.labelSource === 'user' ? current.regionId : hit.regionId }))
      return
    }
    if (marks.length >= 8) {
      setError(en ? 'You can mark up to 8 locations in one report.' : 'Podés marcar hasta 8 ubicaciones en un reporte.')
      return
    }
    const created = newDraftMark(hit)
    setMarks((current) => [...current, created])
    setSelectedId(created.id)
    setLiveText(describe(created))
  }

  function addRegion() {
    const anchor = anchorFor(regionChoice, sideChoice, aspectChoice)
    place({ kind: 'region', regionId: regionChoice, laterality: sideChoice, aspect: aspectChoice, ...anchor })
  }

  function update(id: string, patch: Partial<PainDraftMark>) {
    setMarks((current) => current.map((mark) => (mark.id === id ? { ...mark, ...patch } : mark)))
  }

  function selectMark(id: string) {
    setSelectedId(id)
    const mark = marks.find((item) => item.id === id)
    if (mark) viewRef.current?.focusMark(mark.localPosition, mark.normal)
  }

  function preferFlat(next: boolean) {
    setFlat(next)
    try { localStorage.setItem(VIEW_PREF_KEY, next ? '2d' : '3d') } catch { /* ignore */ }
  }

  async function save() {
    if (!writable) return
    const ready = marks.map(toPainMark)
    if (ready.some((mark) => !mark)) {
      setStep('details')
      setError(en ? 'Each location needs a description, a pattern, and an intensity from 0 to 10.' : 'Cada ubicación necesita descripción, patrón e intensidad de 0 a 10.')
      return
    }
    setBusy(true)
    setError('')
    const body = {
      modelId: PAIN_MODEL.id,
      modelVersion: PAIN_MODEL.version,
      origin: 'self_report',
      appointmentId,
      followsReportId: correctingId ? null : followsReportId,
      marks: ready,
    }
    try {
      if (correctingId) await platformApi.correctPainMap(missionId, correctingId, body)
      else await platformApi.createPainMap(missionId, body)
      clearPainDraft(missionId, profileId)
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (/stage|etapa|in flight|finaliz|a bordo|ended/i.test(message)) setConflict(message)
      else setError(message || (en ? 'The report could not be saved.' : 'No se pudo guardar el reporte.'))
    } finally {
      setBusy(false)
    }
  }

  const useFlat = flat || modelFailed

  return (
    <div className="pain-map" data-testid="pain-editor">
      {/* Top Bar: Wizard Steps Navigation & 3D/2D View Toggle */}
      <div className="pain-editor-top">
        <div className="pain-steps-bar" role="tablist" aria-label={en ? 'Wizard steps' : 'Pasos del formulario'}>
          <button
            type="button"
            className={`pain-step-pill ${step === 'locate' ? 'is-active' : ''}`}
            onClick={() => setStep('locate')}
          >
            <span className="pain-step-num">1</span>
            <span>{en ? 'Location' : 'Ubicación'}</span>
          </button>
          <span className="pain-step-arrow" aria-hidden="true">→</span>
          <button
            type="button"
            className={`pain-step-pill ${step === 'details' ? 'is-active' : ''}`}
            disabled={!marks.length}
            onClick={() => setStep('details')}
          >
            <span className="pain-step-num">2</span>
            <span>{en ? 'Details' : 'Detalles'}</span>
          </button>
          <span className="pain-step-arrow" aria-hidden="true">→</span>
          <button
            type="button"
            className={`pain-step-pill ${step === 'preview' ? 'is-active' : ''}`}
            disabled={!marks.every(draftComplete)}
            onClick={() => setStep('preview')}
          >
            <span className="pain-step-num">3</span>
            <span>{en ? 'Preview' : 'Vista previa'}</span>
          </button>
        </div>

        <div className="pain-view-toggle">
          <button
            type="button"
            className={`pain-view-btn ${!useFlat ? 'is-active' : ''}`}
            onClick={() => preferFlat(false)}
            disabled={modelFailed}
          >
            {en ? '3D Body' : 'Cuerpo 3D'}
          </button>
          <button
            type="button"
            className={`pain-view-btn ${useFlat ? 'is-active' : ''}`}
            onClick={() => preferFlat(true)}
          >
            {en ? '2D Diagram' : 'Diagrama 2D'}
          </button>
        </div>
      </div>

      <p className="pain-help">
        {isOwner
          ? painHelp(en)
          : (en
            ? 'Viewing patient marked pain spots and anatomical locations (read-only).'
            : 'Visualizando puntos de dolor y localizaciones anatómicas del paciente (modo lectura).')}
      </p>
      <p className="sr-only" aria-live="polite">{liveText}</p>
      {restored ? <p className="rd-muted">{en ? 'Unsaved text from this screen was restored.' : 'Se restauró el texto que todavía estaba en esta pantalla.'}</p> : null}
      {followsReportId ? <p className="rd-muted">{en ? 'This update is saved as a new report. The earlier one stays in the history.' : 'Esta actualización se guarda como un reporte nuevo. El anterior permanece en el historial.'}</p> : null}
      {conflict ? <p className="rd-error" role="alert">{conflict}</p> : null}
      {error ? <p className="rd-error" role="alert">{error}</p> : null}

      <div className="pain-layout">
        {/* Left Column: 3D Body Model Viewport */}
        <div className="pain-stage">
          {modelFailed ? <p className="rd-muted">{en ? 'The 3D model did not load. The form and the flat diagram are still available.' : 'El modelo 3D no cargó. El formulario y el diagrama plano siguen disponibles.'}</p> : null}
          {!useFlat ? (
            <>
              <div className="pain-stage-header">
                <PainCameraControls en={en} viewRef={viewRef} />
              </div>
              <ModelBoundary fallback={null} onError={() => { setModelFailed(true); preferFlat(true) }}>
                <BodyViewport
                  ref={viewRef}
                  en={en}
                  marks={shown}
                  selectedId={selectedId}
                  placeEnabled={isOwner && placeMode && step !== 'preview'}
                  loadingLabel={en ? 'Loading body model…' : 'Cargando el modelo corporal…'}
                  onPlace={place}
                  onSelect={selectMark}
                  onUnavailable={() => { setModelFailed(true); preferFlat(true) }}
                />
              </ModelBoundary>
              <p className="pain-stage-hint">
                {en
                  ? 'Drag to rotate; use wheel or pinch to zoom. Tap the body to mark a location.'
                  : 'Arrastrá para girar; usá la rueda o pellizcá para acercar. Tocá el cuerpo para marcar una ubicación.'}
              </p>
            </>
          ) : (
            <BodyMap2D marks={shown} selectedId={selectedId} placeEnabled={isOwner && placeMode && step !== 'preview'} onPlace={place} onSelect={setSelectedId} en={en} />
          )}

          {/* Collapsible manual region picker */}
          {isOwner ? (
            <details className="pain-manual-picker">
              <summary className="pain-manual-summary">
                {en ? '+ Manual region selector (without 3D tap)' : '+ Selector manual de región (sin tocar el 3D)'}
              </summary>
              <div className="pain-manual-content">
                <div className="rd-form-grid">
                  <div className="rd-field">
                    <label htmlFor="pain-region">{en ? 'Region' : 'Región'}</label>
                    <select id="pain-region" value={regionChoice} onChange={(event) => setRegionChoice(event.target.value)}>
                      {BODY_REGIONS.map((region) => <option key={region.id} value={region.id}>{en ? region.en : region.es}</option>)}
                    </select>
                  </div>
                  <div className="rd-field">
                    <label htmlFor="pain-side">{en ? 'Side of the body' : 'Lado del cuerpo'}</label>
                    <select id="pain-side" value={sideChoice} onChange={(event) => setSideChoice(event.target.value as PainLaterality)}>
                      {sidesFor(regionChoice).map((side) => <option key={side} value={side}>{sideLabel(side, en)}</option>)}
                    </select>
                  </div>
                  <div className="rd-field">
                    <label htmlFor="pain-aspect">{en ? 'Facing' : 'Orientación'}</label>
                    <select id="pain-aspect" value={aspectChoice} onChange={(event) => setAspectChoice(event.target.value as PainAspect)}>
                      {(['anterior', 'posterior', 'lateral'] as const).map((aspect) => <option key={aspect} value={aspect}>{aspectLabel(aspect, en)}</option>)}
                    </select>
                  </div>
                </div>
                <button type="button" className="rd-btn" disabled={!placeMode || step !== 'locate'} onClick={addRegion}>
                  {en ? 'Add this region' : 'Agregar esta región'}
                </button>
              </div>
            </details>
          ) : null}
        </div>

        {/* Right Column: Pain Details & Wizard Actions */}
        <div className="pain-side">
          <div className="pain-side-header">
            <h3>
              {step === 'locate'
                ? (en ? 'Marked pain spots' : 'Puntos de dolor marcados')
                : step === 'details'
                  ? (en ? 'Pain details' : 'Detalles del dolor')
                  : (en ? 'Review report' : 'Revisar reporte')}
            </h3>
            <span className="pain-count-badge">{marks.length}/8</span>
          </div>

          {step === 'locate' ? (
            <>
              {marks.length === 0 ? (
                <div className="pain-empty-callout">
                  <p>
                    {en
                      ? 'No pain spots added yet. Tap on the 3D body model to place a spot, or expand the manual selector below.'
                      : 'Todavía no hay puntos de dolor. Tocá en el modelo 3D para ubicar uno, o abrí el selector manual abajo.'}
                  </p>
                </div>
              ) : (
                <ul className="pain-list">
                  {marks.map((mark, index) => (
                    <li key={mark.id} className={`pain-list-item${mark.id === selectedId ? ' is-active' : ''}`}>
                      <button type="button" className="pain-mark-trigger" onClick={() => selectMark(mark.id)}>
                        <div className="pain-mark-title-block">
                          <div>
                            <span className="pain-mark-num-badge">{index + 1}</span>
                            <strong>{displayRegion(mark, en)}</strong>
                          </div>
                          <span className="pain-mark-subtitle">
                            {sideLabel(mark.laterality, en)} · {aspectLabel(mark.aspect, en)}
                            {mark.intensity != null ? ` · ${mark.intensity}/10` : ''}
                          </span>
                        </div>
                      </button>
                      {isOwner ? (
                        <div className="pain-toolbar">
                          <button
                            type="button"
                            className="rd-btn ghost"
                            onClick={() => { setSelectedId(mark.id); setMovingId(mark.id); setPlaceMode(true); setStep('locate') }}
                          >
                            {movingId === mark.id ? (en ? 'Tap new spot' : 'Tocá nuevo punto') : (en ? 'Move' : 'Mover')}
                          </button>
                          <button
                            type="button"
                            className="rd-btn ghost"
                            onClick={() => setMarks((current) => current.filter((item) => item.id !== mark.id))}
                          >
                            {en ? 'Remove' : 'Quitar'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: 6, fontSize: '0.84rem', opacity: 0.9 }}>
                          <span><strong>{en ? 'Intensity: ' : 'Intensidad: '}</strong>{mark.intensity != null ? `${mark.intensity}/10 (${mark.intensity <= 3 ? (en ? 'Mild' : 'Leve') : mark.intensity <= 6 ? (en ? 'Moderate' : 'Moderado') : (en ? 'Severe' : 'Severo')})` : '—'}</span>
                          {mark.pattern ? <div style={{ marginTop: 2 }}><strong>{en ? 'Pattern: ' : 'Patrón: '}</strong>{mark.pattern === 'constant' ? (en ? 'Constant' : 'Constante') : (en ? 'Intermittent' : 'Intermitente')}</div> : null}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}

          {step !== 'locate' ? marks.map((mark, index) => (
            <fieldset key={mark.id}>
              <legend>{en ? `Location ${index + 1}: ${displayRegion(mark, en)}` : `Ubicación ${index + 1}: ${displayRegion(mark, en)}`}</legend>
              <div className="rd-field">
                <label htmlFor={`loc-${mark.id}`}>{en ? 'Location' : 'Ubicación'}</label>
                <select
                  id={`loc-${mark.id}`}
                  value={mark.regionId}
                  onChange={(event) => update(mark.id, { regionId: event.target.value, regionLabel: regionName(event.target.value, en), labelSource: 'user' })}
                >
                  {BODY_REGIONS.map((region) => <option key={region.id} value={region.id}>{en ? region.en : region.es}</option>)}
                </select>
                {mark.detectedRegionId !== mark.regionId ? <span className="rd-muted">{en ? `Diagram suggested ${regionName(mark.detectedRegionId, en)}. The point stays where you placed it.` : `El diagrama sugirió ${regionName(mark.detectedRegionId, en)}. El punto queda donde lo pusiste.`}</span> : null}
              </div>
              <div className="rd-form-grid">
                <div className="rd-field">
                  <label htmlFor={`side-${mark.id}`}>{en ? 'Side' : 'Lado'}</label>
                  <select id={`side-${mark.id}`} value={mark.laterality} onChange={(event) => update(mark.id, { laterality: event.target.value as PainLaterality, labelSource: 'user' })}>
                    {sidesFor(mark.regionId).map((side) => <option key={side} value={side}>{sideLabel(side, en)}</option>)}
                  </select>
                </div>
                <div className="rd-field">
                  <label htmlFor={`face-${mark.id}`}>{en ? 'Facing' : 'Orientación'}</label>
                  <select id={`face-${mark.id}`} value={mark.aspect === 'unspecified' ? 'anterior' : mark.aspect} onChange={(event) => update(mark.id, { aspect: event.target.value as PainAspect, labelSource: 'user' })}>
                    {(['anterior', 'posterior', 'lateral', 'unspecified'] as const).map((aspect) => <option key={aspect} value={aspect}>{aspectLabel(aspect, en)}</option>)}
                  </select>
                </div>
              </div>
              <div className="rd-field">
                <label htmlFor={`int-${mark.id}`}>{en ? 'Pain intensity (0–10)' : 'Intensidad del dolor (0–10)'}</label>
                <div className="pain-range">
                  <input
                    id={`int-${mark.id}`}
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={mark.intensity ?? 0}
                    aria-valuetext={mark.intensity == null ? (en ? 'Not set' : 'Sin definir') : String(mark.intensity)}
                    onChange={(event) => update(mark.id, { intensity: Number(event.target.value) })}
                  />
                  <input
                    aria-label={en ? 'Intensity number' : 'Número de intensidad'}
                    type="number"
                    min={0}
                    max={10}
                    step={1}
                    value={mark.intensity ?? ''}
                    onChange={(event) => update(mark.id, { intensity: event.target.value === '' ? null : Math.max(0, Math.min(10, Math.round(Number(event.target.value)))) })}
                  />
                </div>
                <span className="rd-muted">{intensityNote(en)}</span>
              </div>
              <div className="rd-field">
                <label htmlFor={`start-${mark.id}`}>{en ? 'Started at' : 'Empezó'}</label>
                <input id={`start-${mark.id}`} type="datetime-local" value={stamp(mark.startedAt)} onChange={(event) => update(mark.id, { startedAt: fromStamp(event.target.value) })} />
              </div>
              <div className="rd-field">
                <label id={`pattern-label-${mark.id}`}>{en ? 'Pattern' : 'Patrón'}</label>
                <div
                  className="pain-pattern-group"
                  role="radiogroup"
                  aria-labelledby={`pattern-label-${mark.id}`}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mark.pattern === 'constant'}
                    className={`pain-pattern-toggle-btn ${mark.pattern === 'constant' ? 'is-active' : ''}`}
                    onClick={() => update(mark.id, { pattern: 'constant' })}
                  >
                    <span className="pain-pattern-dot" aria-hidden="true" />
                    <span>{en ? 'Constant' : 'Constante'}</span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mark.pattern === 'intermittent'}
                    className={`pain-pattern-toggle-btn ${mark.pattern === 'intermittent' ? 'is-active' : ''}`}
                    onClick={() => update(mark.id, { pattern: 'intermittent' })}
                  >
                    <span className="pain-pattern-dot" aria-hidden="true" />
                    <span>{en ? 'Intermittent' : 'Intermitente'}</span>
                  </button>
                </div>
              </div>
              <div className="rd-field">
                <label htmlFor={`desc-${mark.id}`}>{en ? 'Description' : 'Descripción'}</label>
                <textarea id={`desc-${mark.id}`} value={mark.description} onChange={(event) => update(mark.id, { description: event.target.value })} required />
              </div>
              <div className="rd-field">
                <label htmlFor={`act-${mark.id}`}>{en ? 'What were you doing when it started?' : '¿Qué estabas haciendo cuando empezó?'}</label>
                <textarea id={`act-${mark.id}`} value={mark.activity} onChange={(event) => update(mark.id, { activity: event.target.value })} />
              </div>
              <div className="rd-field">
                <label htmlFor={`extra-${mark.id}`}>{en ? 'Additional symptoms' : 'Síntomas adicionales'}</label>
                <textarea id={`extra-${mark.id}`} value={mark.additionalSymptoms} onChange={(event) => update(mark.id, { additionalSymptoms: event.target.value })} />
              </div>
              <div className="rd-field">
                <label htmlFor={`notes-${mark.id}`}>{en ? 'Notes' : 'Notas'}</label>
                <textarea id={`notes-${mark.id}`} value={mark.notes} onChange={(event) => update(mark.id, { notes: event.target.value })} />
              </div>
            </fieldset>
          )) : null}

          {step === 'preview' ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <p className="rd-muted">{en ? 'Patient-reported pain. Nothing here is a clinical diagnosis.' : 'Dolor reportado por la persona. Nada de esto es un diagnóstico clínico.'}</p>
              {marks.map((mark, index) => (
                <div key={mark.id} className="pain-list-item">
                  <strong>{index + 1}. {displayRegion(mark, en)}</strong>
                  <span className="rd-muted">
                    {sideLabel(mark.laterality, en)} · {aspectLabel(mark.aspect, en)} · {mark.intensity ?? '—'}/10 · {mark.pattern === 'constant' ? (en ? 'Constant' : 'Constante') : mark.pattern === 'intermittent' ? (en ? 'Intermittent' : 'Intermitente') : '—'}
                  </span>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>{mark.description}</p>
                </div>
              ))}
            </div>
          ) : null}

          {appointments.length ? (
            <div className="rd-field" style={{ marginTop: 8 }}>
              <label htmlFor="pain-visit">{en ? 'Link a visit (optional)' : 'Vincular una cita (opcional)'}</label>
              <select id="pain-visit" value={appointmentId ?? ''} onChange={(event) => setAppointmentId(event.target.value || null)}>
                <option value="">{en ? 'No visit' : 'Sin cita'}</option>
                {appointments.map((visit) => <option key={visit.id} value={visit.id}>{visit.reason || visit.id}</option>)}
              </select>
            </div>
          ) : null}

          {/* Bottom Action Bar */}
          <div className="pain-bottom-actions">
            <div>
              {step !== 'locate' ? (
                <button type="button" className="rd-btn ghost" onClick={() => setStep(step === 'preview' ? 'details' : 'locate')}>
                  {en ? '← Back' : '← Atrás'}
                </button>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                className="rd-btn ghost"
                onClick={() => { clearPainDraft(missionId, profileId); onClose() }}
              >
                {en ? 'Close' : 'Cerrar'}
              </button>

              {isOwner && step === 'locate' ? (
                <button
                  type="button"
                  className="rd-btn is-primary"
                  disabled={!marks.length}
                  onClick={() => setStep('details')}
                >
                  {en ? 'Continue →' : 'Continuar →'}
                </button>
              ) : null}

              {isOwner && step === 'details' ? (
                <button
                  type="button"
                  className="rd-btn is-primary"
                  disabled={!marks.every(draftComplete)}
                  onClick={() => setStep('preview')}
                >
                  {en ? 'Preview →' : 'Vista previa →'}
                </button>
              ) : null}

              {isOwner && step === 'preview' ? (
                <button
                  type="button"
                  className="rd-btn is-primary"
                  data-testid="pain-save"
                  disabled={!writable || busy || !marks.length}
                  onClick={() => void save()}
                >
                  {busy ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Save report' : 'Guardar reporte')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
