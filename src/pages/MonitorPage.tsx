import { Brain, Check, ClipboardPlus, HeartPulse, Package, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CREW } from '../domain/crew'
import { ageLabel, formatMeasurement, formatValue, kindLabel } from '../domain/format'
import { runLocalAnalysis } from '../domain/analysis'
import { crewPosture, isReliable, latestMeasurement, measurementsFor, openEpisode } from '../domain/selectors'
import { useApp } from '../state/store'
import { Avatar, Ecg } from '../components/Avatars'
import { TrendChart, timeLabel } from '../components/Charts'
import { Badge, Field, Modal } from '../components/ui'
import type { MeasurementKind } from '../../shared/types'

const SYMPTOMS = [
  ['cansancio', 'Cansancio'],
  ['mareo', 'Mareo'],
  ['cefalea', 'Dolor de cabeza'],
  ['nausea', 'Náusea'],
  ['otro', 'Otro'],
] as const

export function MonitorPage() {
  const { state, dispatch } = useApp()
  const crew = CREW.find((item) => item.id === state.selectedCrewId) ?? CREW[0]
  if (!crew) return null
  const posture = crewPosture(state, crew.id)
  const hr = latestMeasurement(state, crew.id, 'heart_rate')
  const trusted = hr ? isReliable(hr, state.clock.simulatedAt) : false
  const episode = openEpisode(state, crew.id)
  const analysis = episode ? runLocalAnalysis(state, episode.id) : null
  const points = measurementsFor(state, crew.id, 'heart_rate')
    .filter((item) => item.integrity === 'valid' && state.clock.simulatedAt - item.measuredAt <= 50 * 60_000)
    .map((item) => ({ label: timeLabel(item.measuredAt), value: item.value }))
  const symptoms = state.symptoms.filter((item) => item.crewId === crew.id)
  const alerts = state.alerts.filter((item) => item.crewId === crew.id && item.status !== 'closed')
  const resources = state.resources.filter((item) => item.quantity > 0).slice(0, 3)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">Monitor</p>
          <h1>{crew.name}</h1>
          <p className="lede">{crew.duty} · {crew.location}. {posture.summary}</p>
        </div>
        <Badge tone={posture.observed === 'change' ? 'amber' : posture.observed === 'stable' ? 'ok' : 'bad'}>
          {posture.observed === 'change' ? 'Cambio observado' : posture.observed === 'stable' ? 'Dentro de línea base' : 'Sin evaluación reciente'}
        </Badge>
      </header>
      <div className="people" role="group" aria-label="Tripulación">
        {CREW.map((item) => (
          <button key={item.id} type="button" className="person" data-testid={`crew-${item.id}`} aria-pressed={item.id === crew.id} onClick={() => dispatch({ type: 'selectCrew', crewId: item.id })}>
            <Avatar id={item.id} name={item.name} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
      <section className="situation" aria-label="Lectura actual">
        <div>
          <p className="kicker"><HeartPulse aria-hidden="true" size={16} strokeWidth={1.75} /> Qué está pasando</p>
          <p className="hero-value" aria-live="off">
            {hr ? <>{formatValue('heart_rate', hr.value)}<span>lpm</span></> : 'Sin lectura'}
          </p>
          <p>{trusted ? 'Lectura reciente de frecuencia cardíaca.' : 'Esta cifra no se usa como evaluación actual.'}</p>
          <p className="muted">{hr ? `Medida ${ageLabel(state.clock.simulatedAt, hr.measuredAt)} · recibida ${ageLabel(state.clock.simulatedAt, hr.receivedAt)} · señal ${hr.signalQuality}/100` : 'No hay una medición de pulso.'}</p>
        </div>
        <div>
          <p className="kicker">Qué tan confiables son los datos</p>
          <p>{posture.evidenceDetail}</p>
          <Badge tone={posture.evidence === 'actualizada' ? 'ok' : 'amber'}>{posture.evidence}</Badge>
          <dl className="quiet-metrics" style={{ marginTop: 12 }}>
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="spo2" />
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="temperature" />
            <Vital stateNow={state.clock.simulatedAt} crewId={crew.id} kind="sleep_hours" />
          </dl>
        </div>
      </section>
      <div className="layout">
        <section className="panel">
          <div className="spread">
            <h2>Tendencia reciente</h2>
            <span className="muted">Solo lecturas con integridad válida</span>
          </div>
          <p className="muted">Trazo ilustrativo, no es un electrocardiograma.</p>
          <Ecg />
          <TrendChart points={points} unit="lpm" caption={`Frecuencia cardíaca de ${crew.name} en la última hora de la misión. Unidad: lpm.`} />
          {symptoms.length > 0 ? (
            <div>
              <h3>Síntomas registrados</h3>
              <ul>
                {symptoms.map((item) => (
                  <li key={item.id}>{item.symptoms.join(', ') || 'Nota'} — {item.note || 'sin nota'} · {ageLabel(state.clock.simulatedAt, item.reportedAt)}</li>
                ))}
              </ul>
            </div>
          ) : <p className="muted">No hay síntomas registrados para esta persona.</p>}
        </section>
        <aside className="stack">
          <section className="side-card">
            <h2>Qué puedes hacer ahora</h2>
            <p className="muted">{analysis?.summary ?? 'No hay un episodio de salud abierto. Las alertas de sensor no abren uno por sí solas.'}</p>
            <div className="stack">
              <SymptomButton />
              <RepeatButton />
              {episode ? <Link className="btn btn-primary" to="/analisis"><Brain aria-hidden="true" size={18} strokeWidth={1.75} /> Abrir análisis</Link> : <Link className="btn" to="/analisis"><Brain aria-hidden="true" size={18} strokeWidth={1.75} /> Ver análisis</Link>}
              {alerts[0] ? <button className="btn" type="button" onClick={() => { const first = alerts[0]; if (first) dispatch({ type: 'ackAlert', alertId: first.id }) }}><Check aria-hidden="true" size={18} strokeWidth={1.75} /> Confirmar aviso</button> : null}
            </div>
          </section>
          <section className="side-card">
            <h2>Recursos a bordo</h2>
            <ul>
              {resources.map((item) => <li key={item.id}>{item.name}: {item.quantity} en {item.location}</li>)}
            </ul>
            <Link className="btn" to="/recursos"><Package aria-hidden="true" size={18} strokeWidth={1.75} className="tone-resource" /> Consultar inventario</Link>
          </section>
          {alerts.length > 0 ? (
            <section className="side-card">
              <h2>Avisos de esta persona</h2>
              <ul>{alerts.map((item) => <li key={item.id}><Link to="/alertas">{item.title}</Link></li>)}</ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function Vital({ crewId, kind, stateNow }: { crewId: (typeof CREW)[number]['id']; kind: MeasurementKind; stateNow: number }) {
  const { state } = useApp()
  const reading = latestMeasurement(state, crewId, kind)
  const trusted = reading ? isReliable(reading, stateNow) : false
  return (
    <div className="metric">
      <dt>{kindLabel(kind)}</dt>
      <dd>
        {reading ? formatMeasurement(kind, reading.value, reading.unit) : 'Sin lectura'}
        <span className="muted"> · {trusted ? 'Vigente' : 'No vigente'}</span>
      </dd>
    </div>
  )
}

function SymptomButton() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const key = useRef('')
  return (
    <>
      <button className="btn btn-primary" type="button" data-testid="open-symptom" onClick={() => { key.current = `sym-${state.seq}-${state.symptoms.length}`; setOpen(true) }}>
        <ClipboardPlus aria-hidden="true" size={18} strokeWidth={1.75} /> Registrar síntomas
      </button>
      <Modal open={open} title="Registrar cómo se siente" description="El texto es un dato clínico simulado. No es una orden para el sistema." onClose={() => setOpen(false)}>
        {SYMPTOMS.map(([id, label]) => (
          <label key={id} className="check">
            <input data-testid={`symptom-${id}`} type="checkbox" checked={picked.includes(id)} onChange={() => setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} />
            {label}
          </label>
        ))}
        <Field id="symptom-note" label="Nota" error={error}>
          <textarea id="symptom-note" data-testid="symptom-note" maxLength={2000} value={note} aria-invalid={Boolean(error)} aria-describedby={error ? 'symptom-note-error' : undefined} onChange={(event) => setNote(event.target.value)} />
        </Field>
        <button className="btn btn-primary" type="button" data-testid="save-symptom" onClick={() => {
          if (picked.length === 0 && note.trim() === '') { setError('Indicá al menos un síntoma o una nota.'); return }
          if (picked.includes('otro') && note.trim() === '') { setError('Si elegís Otro, la nota es obligatoria.'); return }
          dispatch({ type: 'addSymptom', crewId: state.selectedCrewId, symptoms: picked, note, idempotencyKey: key.current })
          setOpen(false); setPicked([]); setNote(''); setError('')
        }}>Guardar reporte</button>
      </Modal>
    </>
  )
}

function RepeatButton() {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [atRest, setAtRest] = useState(false)
  const key = useRef('')
  return (
    <>
      <button className="btn" type="button" data-testid="open-repeat" onClick={() => { key.current = `rep-${state.seq}`; setOpen(true) }}><RefreshCw aria-hidden="true" size={18} strokeWidth={1.75} /> Repetir medición</button>
      <Modal open={open} title="Repetir frecuencia cardíaca" description="Si el escenario no tiene una lectura, no se inventa un valor." onClose={() => setOpen(false)}>
        <label className="check"><input data-testid="rest-check" type="checkbox" checked={atRest} onChange={(event) => setAtRest(event.target.checked)} /> La persona está en reposo</label>
        <button className="btn btn-primary" type="button" data-testid="save-repeat" onClick={() => { dispatch({ type: 'repeatMeasurement', crewId: state.selectedCrewId, idempotencyKey: key.current, atRest }); setOpen(false) }}>Registrar</button>
      </Modal>
    </>
  )
}
