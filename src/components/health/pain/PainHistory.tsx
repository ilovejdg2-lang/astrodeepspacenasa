import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PAIN_MODEL,
  aspectLabel,
  displayRegion,
  intensityNote,
  sideLabel,
  type PainFollowUp,
  type PainMapReport,
} from '../../../domain/painMap'
import { platformApi } from '../../../platform/api'
import { profileDisplayName } from '../../../platform/copy'
import { BodyMap2D } from './BodyMap2D'
import { BodyViewport, PainCameraControls, type BodyViewportHandle } from './BodyViewport'
import './pain-map.css'

type Visit = { id: string; scheduledAt?: number | null; reason?: string; requesterId?: string }

function when(ms: number, en: boolean) {
  return new Intl.DateTimeFormat(en ? 'en-GB' : 'es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(ms)
}

function statusLabel(status: PainFollowUp, en: boolean) {
  if (status === 'monitoring') return en ? 'Monitoring' : 'En seguimiento'
  if (status === 'resolved') return en ? 'Resolved' : 'Resuelto'
  return en ? 'Open' : 'Abierto'
}

export function PainHistory({
  en,
  missionId,
  subjectId,
  stage,
  writable,
  canNote,
  appointments,
  highlightAppointmentId,
  reloadKey,
  onCorrect,
  onFollowUp,
  onChanged,
}: {
  en: boolean
  missionId: string
  subjectId?: string
  stage?: string
  writable: boolean
  canNote: boolean
  appointments: Visit[]
  highlightAppointmentId?: string | null
  reloadKey: number
  onCorrect?: (report: PainMapReport) => void
  onFollowUp?: (report: PainMapReport) => void
  onChanged?: () => void
}) {
  const [items, setItems] = useState<PainMapReport[]>([])
  const [error, setError] = useState('')
  const [focusId, setFocusId] = useState<string | null>(null)
  const [compareId, setCompareId] = useState<string>('')
  const [revisionAt, setRevisionAt] = useState<number | null>(null)
  const [flat, setFlat] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [noteVisit, setNoteVisit] = useState('')
  const [busy, setBusy] = useState(false)
  const viewRef = useRef<BodyViewportHandle>(null)

  useEffect(() => {
    let cancel = false
    setError('')
    void platformApi.listPainMaps(missionId, subjectId).then((data) => {
      if (!cancel) setItems(data.items)
    }).catch((err: unknown) => {
      if (cancel) return
      const raw = err instanceof Error ? err.message : ''
      const unavailable = !raw || /couldn.t load|no se pudo cargar|unavailable|bad gateway|operation not permitted|502|503|504|^Error \d+$/i.test(raw)
      if (unavailable) {
        setItems([])
        setError('')
        return
      }
      setError(raw)
    })
    return () => { cancel = true }
  }, [missionId, subjectId, reloadKey, en])

  useEffect(() => {
    if (!highlightAppointmentId) return
    const match = items.find((item) => item.appointmentId === highlightAppointmentId || item.clinicalNotes.some((entry) => entry.appointmentId === highlightAppointmentId))
    if (match) setFocusId(match.id)
  }, [highlightAppointmentId, items])

  const focus = items.find((item) => item.id === focusId) ?? null
  const compatible = !focus || (focus.modelId === PAIN_MODEL.id && focus.modelVersion === PAIN_MODEL.version)
  const revision = focus?.revisions.find((item) => item.at === revisionAt) ?? null
  const activeMarks = useMemo(() => revision?.marks ?? focus?.marks ?? [], [revision, focus])
  const compare = items.find((item) => item.id === compareId && item.id !== focus?.id) ?? null
  const shown = useMemo(() => {
    const primary = activeMarks.map((mark, index) => ({
      id: mark.id,
      label: String(index + 1),
      localPosition: mark.localPosition,
      normal: mark.normal,
      surfaceId: mark.surfaceId,
      regionId: mark.regionId,
      laterality: mark.laterality,
      aspect: mark.aspect,
      series: 'a' as const,
    }))
    if (!compare || revision) return primary
    return [
      ...primary,
      ...compare.marks.map((mark, index) => ({
        id: `b-${mark.id}`,
        label: `B${index + 1}`,
        localPosition: mark.localPosition,
        normal: mark.normal,
        surfaceId: mark.surfaceId,
        regionId: mark.regionId,
        laterality: mark.laterality,
        aspect: mark.aspect,
        series: 'b' as const,
      })),
    ]
  }, [activeMarks, compare, revision])

  function selectMark(id: string) {
    setPicked(id)
    const mark = activeMarks.find((item) => item.id === id) ?? compare?.marks.find((item) => `b-${item.id}` === id)
    if (mark) viewRef.current?.focusMark(mark.localPosition, mark.normal)
  }

  async function setStatus(report: PainMapReport, status: PainFollowUp) {
    setBusy(true)
    try {
      await platformApi.setPainStatus(missionId, report.id, status)
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    } finally {
      setBusy(false)
    }
  }

  async function saveNote(report: PainMapReport) {
    if (note.trim().length < 3) return
    setBusy(true)
    try {
      await platformApi.addPainClinicalNote(missionId, report.id, note.trim(), noteVisit || null)
      setNote('')
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pain-map" id="medic-pain-map">
      <h3>{en ? 'Patient-reported pain' : 'Dolor reportado por la persona'}</h3>
      {error ? <p className="rd-error" role="alert">{error}</p> : null}
      {items.length === 0 && !error ? <p className="rd-muted">{en ? 'No pain reports yet.' : 'Todavía no hay reportes de dolor.'}</p> : null}
      {items.map((report) => (
        <article key={report.id} className="pain-report" data-testid={`pain-report-${report.id}`}>
          <strong>{when(report.createdAt, en)}</strong>
          <p>{report.marks.map((mark) => displayRegion(mark, en)).join(', ')}</p>
          <p>{report.marks.map((mark, index) => `${index + 1}. ${mark.intensity}/10`).join(' · ')}</p>
          <p>{report.marks.map((mark) => mark.description).join(' ')}</p>
          <p>{en ? 'Follow-up' : 'Seguimiento'}: {statusLabel(report.status, en)}</p>
          {report.followsReportId ? <p className="rd-muted">{en ? 'Follows an earlier report. The earlier report was not replaced.' : 'Sigue un reporte anterior. El reporte anterior no se reemplazó.'}</p> : null}
          <div className="pain-toolbar">
            <button type="button" className="rd-btn" data-testid={`view-body-map-${report.id}`} onClick={() => { setFocusId(report.id); setRevisionAt(null); setCompareId('') }}>
              {en ? 'View body map' : 'Ver mapa corporal'}
            </button>
            {writable && onFollowUp ? <button type="button" className="rd-btn ghost" onClick={() => onFollowUp(report)}>{en ? 'Record an update' : 'Registrar evolución'}</button> : null}
            {writable && onCorrect ? <button type="button" className="rd-btn ghost" onClick={() => onCorrect(report)}>{en ? 'Correct' : 'Corregir'}</button> : null}
            {writable ? (['open', 'monitoring', 'resolved'] as const).map((status) => (
              <button key={status} type="button" className={`rd-btn${report.status === status ? '' : ' ghost'}`} disabled={busy} onClick={() => void setStatus(report, status)}>{statusLabel(status, en)}</button>
            )) : null}
          </div>
        </article>
      ))}

      {focus ? (
        <div className="pain-layout">
          <div className="pain-stage">
            {!compatible ? <p className="rd-error">{en ? `This report used ${focus.modelId} v${focus.modelVersion}. Region labels stay available. The saved 3D point is not placed on the current model.` : `Este reporte usó ${focus.modelId} v${focus.modelVersion}. Las regiones en texto siguen disponibles. El punto 3D guardado no se coloca en el modelo actual.`}</p> : null}
            {revision ? <p className="rd-muted">{en ? `Viewing the version from ${when(revision.at, en)}. The current report is unchanged.` : `Viendo la versión del ${when(revision.at, en)}. El reporte actual no cambió.`}</p> : null}
            <div className="pain-toolbar">
              <button type="button" className="rd-btn ghost" onClick={() => setFlat((value) => !value)}>{flat ? (en ? '3D view' : 'Vista 3D') : (en ? 'Flat diagram' : 'Diagrama plano')}</button>
              {!flat && compatible ? <PainCameraControls en={en} viewRef={viewRef} /> : null}
            </div>
            {compare && !revision ? (
              <p className="pain-legend"><span><i className="pain-swatch a" aria-hidden="true" />{when(focus.createdAt, en)}</span><span><i className="pain-swatch b" aria-hidden="true" />{when(compare.createdAt, en)}</span></p>
            ) : null}
            {flat || !compatible ? (
              <BodyMap2D marks={shown} selectedId={picked} placeEnabled={false} onSelect={setPicked} en={en} />
            ) : (
              <BodyViewport
                ref={viewRef}
                en={en}
                marks={shown}
                selectedId={picked}
                placeEnabled={false}
                loadingLabel={en ? 'Loading body model…' : 'Cargando el modelo corporal…'}
                onSelect={selectMark}
                onUnavailable={() => setFlat(true)}
              />
            )}
          </div>
          <div className="pain-side">
            <div className="rd-field">
              <label htmlFor="pain-compare">{en ? 'Compare with' : 'Comparar con'}</label>
              <select id="pain-compare" value={compareId} onChange={(event) => { setCompareId(event.target.value); setRevisionAt(null) }}>
                <option value="">{en ? 'This report only' : 'Solo este reporte'}</option>
                {items.filter((item) => item.id !== focus.id).map((item) => <option key={item.id} value={item.id}>{when(item.createdAt, en)}</option>)}
              </select>
            </div>
            <ul className="pain-list">
              {activeMarks.map((mark, index) => (
                <li key={mark.id}>
                  <button type="button" className={`pain-mark${picked === mark.id ? ' is-on' : ''}`} onClick={() => selectMark(mark.id)}>
                  <strong>{index + 1}. {displayRegion(mark, en)}</strong>
                  <span>{sideLabel(mark.laterality, en)} · {aspectLabel(mark.aspect, en)} · {mark.intensity}/10 · {mark.pattern === 'constant' ? (en ? 'Constant' : 'Constante') : (en ? 'Intermittent' : 'Intermitente')}</span>
                  <span>{mark.description}</span>
                  {mark.activity ? <span>{en ? 'Activity: ' : 'Actividad: '}{mark.activity}</span> : null}
                  {mark.additionalSymptoms ? <span>{en ? 'Additional symptoms: ' : 'Síntomas adicionales: '}{mark.additionalSymptoms}</span> : null}
                  {mark.notes ? <span>{en ? 'Notes: ' : 'Notas: '}{mark.notes}</span> : null}
                  <span className="rd-muted">{intensityNote(en)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {focus.revisions.length > 1 ? (
              <div className="pain-toolbar">
                <button type="button" className="rd-btn ghost" onClick={() => setRevisionAt(null)}>{en ? 'Current version' : 'Versión actual'}</button>
                {focus.revisions.slice(0, -1).map((item) => (
                  <button key={item.at} type="button" className="rd-btn ghost" onClick={() => setRevisionAt(item.at)}>
                    {when(item.at, en)}
                  </button>
                ))}
              </div>
            ) : null}
            <section className="pain-clinical" aria-label={en ? 'Clinical notes' : 'Notas clínicas'}>
              <h3>{en ? 'Clinical notes' : 'Notas clínicas'}</h3>
              <p className="rd-muted">{en ? 'Written by the physician. They do not replace what the person reported.' : 'Las escribe el médico. No reemplazan lo que reportó la persona.'}</p>
              {focus.clinicalNotes.length === 0 ? <p className="rd-muted">{en ? 'No clinical note on this report.' : 'No hay una nota clínica en este reporte.'}</p> : null}
              {focus.clinicalNotes.map((entry) => (
                <p key={entry.id}><strong>{profileDisplayName(entry.authorProfileId)}</strong> · {when(entry.createdAt, en)}<br />{entry.body}</p>
              ))}
              {canNote && stage !== 'postmission' && stage !== 'archived' && stage !== 'cancelled' ? (
                <>
                  <div className="rd-field">
                    <label htmlFor="clinical-note">{en ? 'Add a clinical note' : 'Agregar una nota clínica'}</label>
                    <textarea id="clinical-note" value={note} onChange={(event) => setNote(event.target.value)} />
                  </div>
                  {appointments.length ? (
                    <div className="rd-field">
                      <label htmlFor="note-visit">{en ? 'Related visit' : 'Cita relacionada'}</label>
                      <select id="note-visit" value={noteVisit} onChange={(event) => setNoteVisit(event.target.value)}>
                        <option value="">{en ? 'No visit' : 'Sin cita'}</option>
                        {appointments.map((visit) => <option key={visit.id} value={visit.id}>{visit.reason || visit.id}</option>)}
                      </select>
                    </div>
                  ) : null}
                  <button type="button" className="rd-btn" disabled={busy || note.trim().length < 3} onClick={() => void saveNote(focus)}>{en ? 'Save clinical note' : 'Guardar nota clínica'}</button>
                </>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  )
}
