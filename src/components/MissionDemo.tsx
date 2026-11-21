import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../i18n'
import { useApp } from '../state/store'
import { activeHealthAlerts, measurementQuality, vitalTrends } from '../domain/selectors'
import { runLocalAnalysis } from '../domain/analysis'

const STEPS = [
  ['Initial monitoring', 'Monitoreo inicial'],
  ['A change is detected', 'Detección de un cambio'],
  ['Explainable health alert', 'Alerta de salud explicable'],
  ['Ask Quirón about the evidence', 'Explicación con Quirón'],
  ['Request human review', 'Solicitud de revisión humana'],
  ['Earth link interruption', 'Interrupción de enlace'],
  ['Recovery and demo completion', 'Recuperación y cierre del demo'],
] as const

const MEASUREMENT_QUALITY_LABELS = {
  valid: { en: 'reliable', es: 'confiable' },
  stale: { en: 'out of date', es: 'antigua' },
  frozen: { en: 'unchanged', es: 'sin cambios' },
  pending: { en: 'needs review', es: 'por revisar' },
} as const

export function MissionDemoButton() {
  const { lang } = useLocale()
  const en = lang === 'en'
  const { state, runActions, backendMode } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const flight = useRef(false)
  const cursor = useRef(-1)
  async function go(target: number) {
    if (flight.current) return
    flight.current = true
    setBusy(true)
    setError('')
    try {
      let current = await runActions([])
      // Only restart/back navigation reconstructs the scenario. Forward keeps history.
      if (step === null || target <= cursor.current) {
        current = await runActions([
          { type: 'setRole', role: 'medical' },
          { type: 'setScenario', scenarioId: 'baseline' },
          { type: 'setRunning', running: false },
        ])
        cursor.current = 0
      }
      for (let next = cursor.current + 1; next <= target; next++) {
        if (next === 1) current = await runActions([{ type: 'setScenario', scenarioId: 'gradual-fatigue' }])
        if (next === 2) current = await runActions([{ type: 'selectCrew', crewId: 'elena-torres' }])
        if (next === 4) {
          const episode = current.episodes.find((e) => e.crewId === 'elena-torres' && e.status !== 'closed')
          const analysis = episode ? runLocalAnalysis(current, episode.id) : null
          current = await runActions([{
            type: 'createCommunication', crewId: 'elena-torres', episodeId: episode?.id ?? null,
            subject: en ? 'DEMO - Human review requested' : 'DEMO - Revision humana',
            body: analysis?.summary ?? 'Simulated change requires human review.',
            idempotencyKey: 'mission-demo-review',
          }])
          const draft = current.communications.find((c) => c.idempotencyKey === 'mission-demo-review')
          if (!draft) throw new Error('Demo draft unavailable')
          current = await runActions([{ type: 'transitionCommunication', id: draft.id, status: 'queued' }])
        }
        if (next === 5) current = await runActions([{ type: 'setLink', link: 'down' }])
        if (next === 6) {
          current = await runActions([{ type: 'setLink', link: 'up' }])
          const draft = current.communications.find((c) => c.idempotencyKey === 'mission-demo-review')
          if (!draft) throw new Error('Demo communication unavailable')
          // Never deliver unrelated messages as a side effect of the guide.
          if (draft.status === 'queued') current = await runActions([{ type: 'transitionCommunication', id: draft.id, status: 'sent' }])
          if (draft.status !== 'received') current = await runActions([{ type: 'transitionCommunication', id: draft.id, status: 'received' }])
          const actions = activeHealthAlerts(current, 'elena-torres').filter((a) => a.status === 'active')
            .map((a) => ({ type: 'setAlertStatus' as const, alertId: a.id, status: 'following' as const }))
          if (actions.length) current = await runActions(actions)
        }
        cursor.current = next
      }
      setStep(target)
      navigate(target < 2 || target === 5 ? '/app' : target === 2 ? '/app/alertas' : target === 3 ? '/app/biomedical' : '/app/medico')
      if (target === 3) window.dispatchEvent(new CustomEvent('helios:quiron-demo', {
        detail: { question: 'Explain the change and measurement quality' },
      }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (en ? 'Demo could not continue.' : 'No se pudo continuar el demo.'))
    } finally {
      flight.current = false
      setBusy(false)
    }
  }
  const trend = vitalTrends(state, 'elena-torres')
  const quality = measurementQuality(state, 'elena-torres')
  const qualityLabel = MEASUREMENT_QUALITY_LABELS[quality.status][en ? 'en' : 'es']
  const linkLabel = state.link === 'up'
    ? (en ? 'Connected' : 'Con conexión')
    : state.link === 'delayed'
      ? (en ? 'Connection is slow' : 'Conexión lenta')
      : (en ? 'Connection interrupted' : 'Conexión interrumpida')
  return <>
    <button type="button" className="helios-pill demo-pill" data-testid="start-mission-demo" disabled={busy} onClick={() => void go(0)}>
      {en ? 'Judge demo' : 'Demo jueces'}
    </button>
    {(step !== null || error) && createPortal(<section className="mission-demo-controller panel" aria-label={en ? 'Guided mission demo' : 'Demo guiada de misión'} data-testid="mission-demo-controller" aria-busy={busy}>
      <div className="spread">
        <strong>{en ? 'Guided mission demo' : 'Demo guiada de misión'} · {(step ?? 0) + 1}/7</strong>
        <button type="button" className="chip" disabled={busy} onClick={() => { setStep(null); setError(''); void runActions([{ type: 'setRunning', running: true }, { type: 'setSpeed', speed: 10 }]) }}>{en ? 'Close guide' : 'Cerrar guía'}</button>
      </div>
      <p>{en ? 'Loads made-up examples and replaces the current demo. Moving forward keeps the messages; going back or restarting starts the example again. No real person is contacted.' : 'Carga situaciones de ejemplo y reemplaza la demostración actual. Al avanzar, conserva los mensajes; al volver o reiniciar, comienza el ejemplo de nuevo. No se contacta a ninguna persona real.'}</p>
      <div className="chips" role="group" aria-label={en ? 'Demo steps' : 'Pasos del demo'}>
        {STEPS.map((labels, i) => <button key={i} type="button" className="chip" data-testid={`mission-demo-step-${i + 1}`} aria-pressed={step === i} disabled={busy} onClick={() => void go(i)}>{i + 1}. {labels[en ? 0 : 1]}</button>)}
      </div>
      <div role="status" data-testid="mission-demo-evidence">
        <p>{en ? 'Pulse' : 'Pulso'}: {trend.currentHr ?? '—'} {en ? 'beats per minute' : 'latidos por minuto'} · {en ? 'usual range' : 'rango habitual'}: {trend.hrMin}–{trend.hrMax} · {en ? 'change' : 'cambio'}: {trend.deltaHr ?? '—'} {en ? 'beats per minute' : 'latidos por minuto'} · {en ? 'measurement' : 'medición'}: {qualityLabel} · {en ? 'resting measurement' : 'medición en reposo'}: {quality.restControl ? (en ? 'available' : 'disponible') : (en ? 'not available' : 'no disponible')}.</p>
        <p>{en ? 'Connection to Earth' : 'Conexión con la Tierra'}: {linkLabel} · {backendMode === 'connected' ? (en ? 'Service connected' : 'Servicio conectado') : (en ? 'Demo simulator' : 'Simulador de demostración')} · {en ? 'We check that messages arrive unchanged, but this does not confirm that health measurements are medically accurate.' : 'Comprobamos que los mensajes lleguen sin cambios, pero eso no confirma que las mediciones sean médicamente correctas.'}</p>
        {step === 5 && <p>{en ? 'Messages wait until the connection returns. Local check-ins remain available.' : 'Los mensajes quedan pendientes hasta que vuelva la conexión. El seguimiento sigue disponible.'}</p>}
        {step === 6 && <p>{en ? 'The example message arrived. The demo is over, but the health follow-up stays open for the team to review.' : 'Llegó el mensaje de ejemplo. La demostración terminó, pero el equipo todavía debe revisar el seguimiento de salud.'}</p>}
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="row">
        <button type="button" className="btn" disabled={busy || step === null || step === 0} onClick={() => void go((step ?? 1) - 1)}>{en ? 'Previous' : 'Anterior'}</button>
        <button type="button" className="btn btn-primary" data-testid="mission-demo-next" disabled={busy || step === 6} onClick={() => void go((step ?? -1) + 1)}>{busy ? (en ? 'Applying…' : 'Aplicando…') : (en ? 'Next' : 'Siguiente')}</button>
      </div>
    </section>, document.body)}
  </>
}
