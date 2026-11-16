import { useState } from 'react'
import {
  clearPainDraft,
  readPainDraft,
  type PainDraft,
  type PainMark,
} from '../../../domain/painMap'
import { PainEditor } from './PainEditor'
import { PainHistory } from './PainHistory'
import './pain-map.css'

type Visit = { id: string; scheduledAt?: number | null; reason?: string; requesterId?: string }

function copyMarks(marks: PainMark[], freshIds: boolean): PainDraft['marks'] {
  return marks.map((mark) => ({ ...mark, id: freshIds ? crypto.randomUUID() : mark.id }))
}

export function PainMapSection({
  en,
  missionId,
  profileId,
  stage,
  appointments,
  onChanged,
}: {
  en: boolean
  missionId: string
  profileId: string
  stage?: string
  appointments: Visit[]
  onChanged: () => void
}) {
  const [open, setOpen] = useState(() => Boolean(readPainDraft(missionId, profileId)?.marks.length))
  const [seed, setSeed] = useState<PainDraft | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const aboard = stage === 'aboard'
  const mine = appointments.filter((visit) => !visit.requesterId || visit.requesterId === profileId)

  function begin(next: PainDraft | null) {
    setSeed(next)
    setOpen(true)
  }

  return (
    <section className="rd-card" aria-labelledby="pain-heading">
      <h2 id="pain-heading">{en ? 'Record pain' : 'Registrar dolor'}</h2>
      <p className="rd-muted">
        {en
          ? 'Mark an approximate place on a body diagram and describe it in your own words. A physician can open the same marks only after you share symptoms. Being chief does not grant this map.'
          : 'Marcá un lugar aproximado en un diagrama corporal y describilo con tus palabras. Un médico puede abrir las mismas marcas solo después de que compartas síntomas. Ser jefe no concede este mapa.'}
      </p>
      {!aboard ? (
        <p className="rd-muted">
          {stage === 'postmission' || stage === 'archived' || stage === 'cancelled'
            ? (en ? 'This mission is complete. You can review pain history. New clinical records stay closed.' : 'Esta misión está completa. Podés consultar el historial de dolor. No se abren registros clínicos nuevos.')
            : (en ? 'Pain records can be created while the mission is in flight. Draft and preflight keep this action closed.' : 'Los registros de dolor se crean con la misión a bordo. En borrador y preembarque esta acción está cerrada.')}
        </p>
      ) : null}
      {aboard && !open ? (
        <button type="button" className="rd-btn" data-testid="record-pain" onClick={() => begin(readPainDraft(missionId, profileId))}>
          {en ? 'Record pain' : 'Registrar dolor'}
        </button>
      ) : null}
      {open ? (
        <PainEditor
          en={en}
          missionId={missionId}
          profileId={profileId}
          stage={stage}
          appointments={mine}
          seed={seed}
          onClose={() => { setOpen(false); setSeed(null) }}
          onSaved={() => { setOpen(false); setSeed(null); setReloadKey((value) => value + 1); onChanged() }}
        />
      ) : null}
      <PainHistory
        en={en}
        missionId={missionId}
        stage={stage}
        writable={aboard}
        canNote={false}
        appointments={mine}
        reloadKey={reloadKey}
        onCorrect={(report) => begin({ v: 1, marks: copyMarks(report.marks, false), followsReportId: null, correctingId: report.id, appointmentId: report.appointmentId })}
        onFollowUp={(report) => begin({ v: 1, marks: copyMarks(report.marks, true), followsReportId: report.id, correctingId: null, appointmentId: report.appointmentId })}
        onChanged={() => { setReloadKey((value) => value + 1); onChanged() }}
      />
      {!open && readPainDraft(missionId, profileId)?.marks.length ? (
        <button type="button" className="rd-btn ghost" onClick={() => { clearPainDraft(missionId, profileId); setSeed(null); setOpen(false) }}>
          {en ? 'Discard saved draft' : 'Descartar borrador'}
        </button>
      ) : null}
    </section>
  )
}

export function PainCasePanel({
  en,
  missionId,
  subjectId,
  stage,
  allowed,
  appointments,
  highlightAppointmentId,
}: {
  en: boolean
  missionId: string
  subjectId: string
  stage?: string
  allowed: boolean
  appointments: Visit[]
  highlightAppointmentId?: string | null
}) {
  const [reloadKey, setReloadKey] = useState(0)
  if (!allowed) {
    return (
      <section className="rd-card">
        <h2>{en ? 'Patient-reported pain' : 'Dolor reportado por la persona'}</h2>
        <p className="rd-muted">{en ? 'The body map stays private until this person shares symptoms with you. The chief role does not open it.' : 'El mapa corporal sigue privado hasta que esta persona comparta síntomas con vos. El rol de jefe no lo abre.'}</p>
      </section>
    )
  }
  const visits = appointments.filter((visit) => visit.requesterId === subjectId)
  return (
    <section className="rd-card">
      <PainHistory
        en={en}
        missionId={missionId}
        subjectId={subjectId}
        stage={stage}
        writable={false}
        canNote={stage === 'aboard'}
        appointments={visits}
        highlightAppointmentId={highlightAppointmentId}
        reloadKey={reloadKey}
        onChanged={() => setReloadKey((value) => value + 1)}
      />
    </section>
  )
}
