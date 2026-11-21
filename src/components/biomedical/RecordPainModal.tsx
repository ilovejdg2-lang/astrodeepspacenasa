import { useMemo, useRef, useState } from 'react'
import { Eye, FileText, CheckCircle2, Shield } from 'lucide-react'
import { Modal } from '../ui'
import { PainEditor } from '../health/pain/PainEditor'
import { BodyViewport, PainCameraControls, type BodyViewportHandle } from '../health/pain/BodyViewport'
import { BodyMap2D } from '../health/pain/BodyMap2D'
import { platformApi } from '../../platform/api'
import { profileDisplayName } from '../../platform/copy'
import {
  aspectLabel,
  sideLabel,
  normalizePainMark,
  type PainDraft,
  type PainFollowUp,
  type PainMapReport,
} from '../../domain/painMap'

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

function statusLabel(status: PainFollowUp, en: boolean) {
  if (status === 'monitoring') return en ? 'Monitoring' : 'En seguimiento'
  if (status === 'resolved') return en ? 'Resolved' : 'Resuelto'
  return en ? 'Active' : 'Activo'
}

export function RecordPainModal({
  open,
  onClose,
  en,
  missionId,
  profileId,
  stage,
  isSelf = true,
  patientName = 'Patient',
  reports = [],
  seed = null,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  en: boolean
  missionId: string
  profileId: string
  stage?: string
  isSelf?: boolean
  patientName?: string
  reports?: PainMapReport[]
  seed?: PainDraft | null
  onSaved: () => void
}) {
  if (!open) return null

  // If viewing my own health record: authoring editor mode
  if (isSelf) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        className="modal-wide modal-pain-editor"
        title={en ? 'Interactive 3D Body Pain Map' : 'Mapa 3D interactivo de dolor corporal'}
      >
        <div className="pain-modal-scroll">
          <PainEditor
            en={en}
            missionId={missionId}
            profileId={profileId}
            stage={stage}
            appointments={[]}
            seed={seed}
            onClose={onClose}
            onSaved={() => {
              onSaved()
              onClose()
            }}
          />
        </div>
      </Modal>
    )
  }

  // Otherwise: Patient Pain Inspection Mode (Read-only + Doctor Observations)
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="modal-wide modal-pain-editor"
      title={
        en
          ? `Patient Pain Map Inspection · ${patientName}`
          : `Inspección de dolor 3D · ${patientName}`
      }
    >
      <PatientPainInspection
        en={en}
        missionId={missionId}
        patientName={patientName}
        report={reports[0] ?? null}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  )
}

function PatientPainInspection({
  en,
  missionId,
  patientName,
  report,
  onClose,
  onSaved,
}: {
  en: boolean
  missionId: string
  patientName: string
  report: PainMapReport | null
  onClose: () => void
  onSaved: () => void
}) {
  const [flat, setFlat] = useState(false)
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(report?.marks[0]?.id ?? null)
  const [noteText, setNoteText] = useState('')
  const [status, setStatus] = useState<PainFollowUp>(report?.status ?? 'open')
  const [clinicalNotes, setClinicalNotes] = useState(report?.clinicalNotes ?? [])
  const [busy, setBusy] = useState(false)
  const viewRef = useRef<BodyViewportHandle>(null)

  const normalizedMarks = useMemo(() => {
    return (report?.marks ?? []).map((m) => normalizePainMark(m))
  }, [report])

  const shownMarks = useMemo(() => {
    return normalizedMarks.map((m, index) => ({
      id: m.id,
      label: String(index + 1),
      localPosition: m.localPosition,
      normal: m.normal,
      surfaceId: m.surfaceId,
      regionId: m.regionId,
      laterality: m.laterality,
      aspect: m.aspect,
      series: 'a' as const,
    }))
  }, [normalizedMarks])

  function selectMark(id: string) {
    setSelectedMarkId(id)
    const match = normalizedMarks.find((m) => m.id === id)
    if (match && viewRef.current?.focusMark) {
      viewRef.current.focusMark(match.localPosition, match.normal)
    }
  }

  async function handleSetStatus(newStatus: PainFollowUp) {
    if (!report) return
    setBusy(true)
    try {
      await platformApi.setPainStatus(missionId, report.id, newStatus)
      setStatus(newStatus)
      onSaved()
    } catch (err) {
      console.error('Failed to update pain report status:', err)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddNote() {
    if (!report || noteText.trim().length < 3) return
    setBusy(true)
    try {
      const res = await platformApi.addPainClinicalNote(missionId, report.id, noteText.trim())
      setClinicalNotes(res.clinicalNotes || [])
      setNoteText('')
      onSaved()
    } catch (err) {
      console.error('Failed to add clinical note:', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pain-modal-scroll" style={{ padding: '4px 8px 16px' }}>
      {/* Scope banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'color-mix(in srgb, #38bdf8 12%, transparent)',
          border: '1px solid color-mix(in srgb, #38bdf8 30%, transparent)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
            {en
              ? `Patient Self-Report (${patientName}) · Authorized & Shared under clinical evaluation scope`
              : `Autorreporte del paciente (${patientName}) · Autorizado y compartido bajo evaluación clínica`}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'color-mix(in srgb, #38bdf8 20%, transparent)',
            color: '#38bdf8',
          }}
        >
          {en ? 'READ ONLY' : 'SOLO LECTURA'}
        </span>
      </div>

      <div className="pain-layout">
        {/* Left Side: 3D Body Model Viewport */}
        <div className="pain-stage">
          <div className="pain-stage-header">
            <div className="pain-toolbar" style={{ margin: 0 }}>
              <button
                type="button"
                className="rd-btn ghost"
                onClick={() => setFlat(!flat)}
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              >
                {flat ? (en ? '3D view' : 'Vista 3D') : (en ? '2D Diagram' : 'Diagrama 2D')}
              </button>
            </div>
            {!flat ? <PainCameraControls en={en} viewRef={viewRef} /> : null}
          </div>

          <div style={{ minHeight: 440 }}>
            {flat ? (
              <BodyMap2D
                marks={shownMarks}
                selectedId={selectedMarkId}
                placeEnabled={false}
                onSelect={selectMark}
                en={en}
              />
            ) : (
              <BodyViewport
                ref={viewRef}
                en={en}
                marks={shownMarks}
                selectedId={selectedMarkId}
                placeEnabled={false}
                loadingLabel={en ? 'Loading 3D body model…' : 'Cargando modelo corporal 3D…'}
                onSelect={selectMark}
                onUnavailable={() => setFlat(true)}
              />
            )}
          </div>

          <p className="pain-stage-hint" style={{ marginTop: 6, textAlign: 'center' }}>
            {en
              ? 'Tap any pin on the body or click the cards on the right to focus the camera.'
              : 'Tocá cualquier marcador en el cuerpo o hacé clic en las tarjetas para enfocar la cámara.'}
          </p>
        </div>

        {/* Right Side: Clinical Details & Observations */}
        <div className="pain-side" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Status & Timestamp Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'color-mix(in srgb, currentColor 4%, transparent)',
              border: '1px solid color-mix(in srgb, currentColor 10%, transparent)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.78rem', opacity: 0.7, display: 'block' }}>
                {en ? 'Report Date:' : 'Fecha de reporte:'}
              </span>
              <strong style={{ fontSize: '0.88rem' }}>
                {report?.createdAt ? `${stamp(report.createdAt, en).day}, ${stamp(report.createdAt, en).time} UTC` : '—'}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.78rem', opacity: 0.7, marginRight: 2 }}>
                {en ? 'Status:' : 'Estado:'}
              </span>
              {(['open', 'monitoring', 'resolved'] as const).map((s) => {
                const isActive = status === s
                return (
                  <button
                    key={s}
                    type="button"
                    className={`rd-btn-xs${isActive ? ' is-active' : ' ghost'}`}
                    disabled={busy}
                    onClick={() => void handleSetStatus(s)}
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 7px',
                      borderRadius: 6,
                    }}
                  >
                    {isActive ? <CheckCircle2 size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} /> : null}
                    {statusLabel(s, en)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reported Pain Spots List */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.94rem' }}>
              {en ? 'Patient-Reported Locations' : 'Ubicaciones reportadas por el paciente'} ({normalizedMarks.length})
            </h4>

            {normalizedMarks.length === 0 ? (
              <p className="rd-muted">{en ? 'No pain locations recorded.' : 'No hay ubicaciones registradas.'}</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {normalizedMarks.map((m, idx) => {
                  const isSelected = selectedMarkId === m.id
                  return (
                    <article
                      key={m.id || idx}
                      className={`biomed-pain-mark-item ${isSelected ? 'is-selected-mark' : ''}`}
                      onClick={() => selectMark(m.id)}
                      style={{ cursor: 'pointer', padding: 12, borderRadius: 12 }}
                    >
                      <div className="biomed-mark-primary-row">
                        <strong style={{ fontSize: '0.94rem' }}>
                          #{idx + 1}. {m.regionLabel || m.regionId}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className={`biomed-focus-mark-btn ${isSelected ? 'is-active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              selectMark(m.id)
                            }}
                          >
                            <Eye size={12} /> {isSelected ? (en ? 'Focused' : 'Enfocado') : (en ? 'Focus' : 'Enfocar')}
                          </button>
                          <span className={`biomed-intensity-pill ${intensityClass(m.intensity)}`}>
                            {m.intensity}/10 · {intensityLabel(m.intensity, en)}
                          </span>
                        </div>
                      </div>

                      <div className="biomed-mark-meta-row" style={{ marginTop: 4 }}>
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
                            <span>{stamp(m.startedAt, en).day}, {stamp(m.startedAt, en).time} UTC</span>
                          </>
                        ) : null}
                      </div>

                      {m.description ? (
                        <p className="biomed-pain-desc" style={{ margin: '8px 0 4px', fontStyle: 'italic' }}>
                          <strong>{en ? 'Patient notes:' : 'Notas del paciente:'}</strong> “{m.description}”
                        </p>
                      ) : null}

                      <div className="biomed-mark-tags-row" style={{ marginTop: 6 }}>
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
                            {en ? 'Context:' : 'Contexto:'} {m.notes}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {/* Physician Observations & Notes Section */}
          <div
            style={{
              borderTop: '1px solid color-mix(in srgb, currentColor 12%, transparent)',
              paddingTop: 14,
            }}
          >
            <h4
              style={{
                margin: '0 0 10px',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FileText size={15} />
              {en
                ? `Physician Clinical Observations & Notes (${clinicalNotes.length})`
                : `Observaciones y notas clínicas del médico (${clinicalNotes.length})`}
            </h4>

            {clinicalNotes.length === 0 ? (
              <p className="rd-muted" style={{ fontSize: '0.82rem', margin: '4px 0 10px' }}>
                {en
                  ? 'No clinical observations have been recorded for this report yet.'
                  : 'Aún no se han registrado observaciones clínicas para este reporte.'}
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                {clinicalNotes.map((cn) => (
                  <div
                    key={cn.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'color-mix(in srgb, currentColor 5%, transparent)',
                      border: '1px solid color-mix(in srgb, currentColor 10%, transparent)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <p style={{ margin: 0 }}>{cn.body}</p>
                    <span style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 4, display: 'block' }}>
                      {stamp(cn.createdAt, en).day}, {stamp(cn.createdAt, en).time} UTC · {profileDisplayName(cn.authorProfileId)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gap: 8 }}>
              <textarea
                className="rd-input"
                rows={2}
                placeholder={
                  en
                    ? 'Add clinical observation, evaluation notes, or follow-up recommendation…'
                    : 'Añadir observación clínica, notas de evaluación o recomendación…'
                }
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={busy}
                style={{ resize: 'vertical', fontSize: '0.84rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="rd-btn primary"
                  disabled={busy || noteText.trim().length < 3}
                  onClick={handleAddNote}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  {busy ? (en ? 'Saving…' : 'Guardando…') : (en ? 'Add Observation' : 'Añadir observación')}
                </button>
              </div>
            </div>
          </div>

          {/* Modal Close Action */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid color-mix(in srgb, currentColor 12%, transparent)',
              paddingTop: 12,
              marginTop: 6,
            }}
          >
            <button
              type="button"
              className="rd-btn ghost"
              onClick={onClose}
              style={{ fontSize: '0.84rem' }}
            >
              {en ? 'Close' : 'Cerrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
