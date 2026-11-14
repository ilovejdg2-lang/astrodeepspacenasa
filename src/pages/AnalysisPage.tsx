import { CircleHelp, ClipboardList, ListChecks, Loader2, Package } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DEMO_PROTOCOLS, findProtocol } from '../../shared/protocols'
import type { AnalysisResult } from '../../shared/types'
import { analysisIsStale, answerLocal, episodeFingerprint, runLocalAnalysis } from '../domain/analysis'
import { buildAnalysisContext } from '../ai/context'
import { askModel, getAiHealth, type AiHealth } from '../ai/client'
import { useApp } from '../state/store'
import { Badge } from '../components/ui'

const QUESTIONS = [
  '¿Qué cambió respecto a las últimas mediciones?',
  '¿Qué información falta?',
  '¿En qué datos se basa esta alerta?',
  '¿Qué equipo tenemos para repetir la medición?',
  'Prepará un resumen para el equipo médico.',
]

export function AnalysisPage() {
  const { state, dispatch } = useApp()
  const episode = state.episodes.find((item) => item.id === state.selectedEpisodeId) ?? state.episodes.find((item) => item.status !== 'closed')
  const [health, setHealth] = useState<AiHealth | null>(null)
  const [pending, setPending] = useState(false)
  const [modelError, setModelError] = useState('')
  const [question, setQuestion] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const flight = useRef('')

  useEffect(() => {
    const controller = new AbortController()
    void getAiHealth(controller.signal).then(setHealth)
    return () => controller.abort()
  }, [])

  const local = episode ? runLocalAnalysis(state, episode.id) : null
  const saved = episode ? [...state.analyses].reverse().find((item) => item.episodeId === episode.id && item.source === 'model') : undefined
  const stale = saved && episode ? analysisIsStale(state, saved.fingerprint, episode.id) : false
  const chat = episode ? state.chats.filter((item) => item.episodeId === episode.id) : []

  async function send(text: string, mode: 'model' | 'local') {
    if (!episode || pending) return
    const trimmed = text.trim()
    if (!trimmed) return
    const key = `${mode}-${episode.id}-${trimmed}-${state.chats.length}`
    if (flight.current === key) return
    flight.current = key
    dispatch({
      type: 'appendChat',
      message: { id: `${key}-user`, episodeId: episode.id, role: 'user', text: trimmed, source: 'user', at: state.clock.simulatedAt, idempotencyKey: `${key}-user`, result: null },
    })
    if (mode === 'local') {
      const result = answerLocal(state, episode.id, trimmed)
      if (result) {
        dispatch({
          type: 'appendChat',
          message: { id: `${key}-local`, episodeId: episode.id, role: 'assistant', text: result.summary, source: 'local_engine', at: state.clock.simulatedAt, idempotencyKey: `${key}-local`, result },
        })
      }
      flight.current = ''
      return
    }
    const context = buildAnalysisContext(state, episode.id, trimmed)
    if (!context) return
    const controller = new AbortController()
    abortRef.current = controller
    setPending(true)
    setModelError('')
    const response = await askModel('/api/ai/chat', context, controller.signal)
    setPending(false)
    flight.current = ''
    if (!response.ok) {
      if (response.code !== 'aborted') setModelError(response.message)
      dispatch({
        type: 'appendChat',
        message: { id: `${key}-error`, episodeId: episode.id, role: 'assistant', text: response.message, source: 'error', at: state.clock.simulatedAt, idempotencyKey: `${key}-error`, result: null },
      })
      return
    }
    dispatch({
      type: 'recordAnalysis',
      idempotencyKey: `${key}-record`,
      record: {
        id: `${key}-record`,
        episodeId: episode.id,
        crewId: episode.crewId,
        source: 'model',
        createdAt: state.clock.simulatedAt,
        model: response.model,
        fingerprint: episodeFingerprint(state, episode.id),
        snapshot: snapshot(state, episode.id),
        result: response.result,
      },
    })
    dispatch({
      type: 'appendChat',
      message: { id: `${key}-model`, episodeId: episode.id, role: 'assistant', text: response.result.summary, source: 'model', at: state.clock.simulatedAt, idempotencyKey: `${key}-model`, result: response.result },
    })
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="kicker">Análisis</p>
          <h1>{episode ? episode.title : 'Sin episodio abierto'}</h1>
          <p className="lede">El motor local siempre está disponible. Una respuesta del modelo se etiqueta aparte y no ejecuta acciones.</p>
        </div>
        <AiBadge health={health} />
      </header>
      {!episode || !local ? (
        <p className="callout">No hay un episodio de salud abierto. Una alerta de sensor, por sí sola, no crea uno.</p>
      ) : (
        <>
          <section className="panel" data-testid="analysis-local">
            <div className="spread"><h2>Motor de análisis simulado</h2><Badge>Análisis local</Badge></div>
            <ResultView result={local} />
          </section>
          <section className="panel">
            <div className="spread">
              <h2>Modelo</h2>
              <Badge tone={health?.configured ? 'ok' : 'amber'}>{health?.configured ? 'IA conectada' : health?.reachable === false ? 'Servicio no disponible' : 'Servicio no configurado'}</Badge>
            </div>
            {saved ? (
              <>
                {stale ? <p className="callout callout-amber">Las mediciones cambiaron después de este análisis. Puede estar desactualizado.</p> : null}
                <p className="muted">Modelo {saved.model} · {saved.createdAt}</p>
                <ResultView result={saved.result} />
              </>
            ) : <p>Todavía no hay una respuesta del modelo para este episodio.</p>}
            {modelError ? <p className="callout callout-bad">{modelError}</p> : null}
            <div className="row">
              <button className="btn btn-primary" type="button" disabled={!health?.configured || pending} onClick={() => void send(question || 'Resumí el episodio para revisión humana.', 'model')}>
                {pending ? <Loader2 aria-hidden="true" size={18} strokeWidth={1.75} className="is-busy" /> : null}
                {pending ? 'Consultando…' : 'Pedir análisis al modelo'}
              </button>
              {pending ? <button className="btn" type="button" onClick={() => abortRef.current?.abort()}>Cancelar</button> : null}
            </div>
            {!health?.configured ? <p className="muted">{health?.reachable === false ? 'No se alcanzó el servidor local.' : `Falta ${health?.missing.join(', ') || 'AI_API_KEY'} en el servidor. El texto de arriba no es una respuesta del modelo.`}</p> : null}
          </section>
          <section className="chat">
            <h2>Preguntas sobre este episodio</h2>
            <div className="questions">
              {QUESTIONS.map((item) => (
                <button key={item} type="button" className="btn btn-ghost" data-testid="ask-local" onClick={() => void send(item, 'local')}>{item}</button>
              ))}
            </div>
            <div className="chat-log" aria-live="polite">
              {chat.map((message) => (
                <article key={message.id} className={message.role === 'user' ? 'bubble user' : 'bubble'}>
                  <strong>{message.source === 'model' ? 'IA conectada' : message.source === 'local_engine' ? 'Análisis local' : message.source === 'error' ? 'Servicio no disponible' : 'Pregunta'}</strong>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void send(question, health?.configured ? 'model' : 'local'); setQuestion('') }}>
              <label className="field" htmlFor="ask">Pregunta
                <textarea id="ask" value={question} maxLength={1000} onChange={(event) => setQuestion(event.target.value)} />
              </label>
              <div className="row">
                <button className="btn btn-primary" type="submit" disabled={pending || question.trim().length < 3}>{health?.configured ? 'Preguntar al modelo' : 'Responder con el motor local'}</button>
                <button className="btn" type="button" disabled={pending || question.trim().length < 3} onClick={() => void send(question, 'local')}>Usar motor local</button>
                {modelError ? <button className="btn" type="button" onClick={() => void send(question || '¿Qué información falta?', 'model')}>Reintentar</button> : null}
              </div>
            </form>
          </section>
        </>
      )}
      <section className="panel">
        <h2>Protocolos de demostración</h2>
        <ul>{DEMO_PROTOCOLS.map((protocol) => <li key={protocol.id}>{protocol.title}. {findProtocol(protocol.id)?.limitation}</li>)}</ul>
      </section>
    </div>
  )
}

function snapshot(state: { measurements: { id: string; crewId: string }[]; symptoms: { id: string; episodeId: string; crewId: string }[]; resources: { id: string }[]; alerts: { id: string; crewId: string | null }[] }, episodeId: string) {
  const episodeCrew = state.symptoms.find((item) => item.episodeId === episodeId)
  return {
    measurementIds: state.measurements.filter((item) => episodeCrew && item.crewId === episodeCrew.crewId).map((item) => item.id).slice(0, 20),
    symptomIds: state.symptoms.filter((item) => item.episodeId === episodeId).map((item) => item.id),
    resourceIds: state.resources.map((item) => item.id),
    alertIds: state.alerts.filter((item) => episodeCrew && item.crewId === episodeCrew.crewId).map((item) => item.id),
    protocolIds: DEMO_PROTOCOLS.map((item) => item.id),
  }
}

function ResultView({ result }: { result: AnalysisResult }) {
  return (
    <div className="stack">
      <p>{result.summary}</p>
      <div>
        <h3><ClipboardList aria-hidden="true" size={16} strokeWidth={1.75} /> Evidencia</h3>
        <ul>{result.evidence.map((item) => <li key={`${item.refType}-${item.refId}`}>{item.statement} <span className="muted">({item.refId})</span></li>)}</ul>
      </div>
      <div>
        <h3><CircleHelp aria-hidden="true" size={16} strokeWidth={1.75} /> Falta</h3>
        <ul>{result.missing.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div>
        <h3><ListChecks aria-hidden="true" size={16} strokeWidth={1.75} /> Comprobaciones</h3>
        <ul>{result.checks.map((item) => <li key={item.protocolId}>{item.title}. {item.why}</li>)}</ul>
      </div>
      <div>
        <h3><Package aria-hidden="true" size={16} strokeWidth={1.75} className="tone-resource" /> Recursos citados</h3>
        <ul>{result.resources.map((item) => <li key={item.resourceId}>{item.note}</li>)}</ul>
      </div>
      <p className="callout">Revisión humana: sí. {result.limitations.join(' ')}</p>
      <p className="muted">Fuentes: {result.sources.join(' · ')}</p>
    </div>
  )
}

function AiBadge({ health }: { health: AiHealth | null }) {
  if (!health) return <Badge><Loader2 aria-hidden="true" size={14} strokeWidth={1.75} className="is-busy" /> Comprobando servicio</Badge>
  if (!health.reachable) return <Badge tone="bad">Servicio no disponible</Badge>
  if (!health.configured) return <Badge tone="amber">IA sin configurar</Badge>
  return <Badge tone="ok">IA conectada · {health.model}</Badge>
}
