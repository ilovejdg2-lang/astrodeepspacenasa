import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Brain, LoaderCircle, RefreshCw } from 'lucide-react'
import type { AnalysisRecord, AppState } from '../../shared/types'
import type { AnalysisContextInput } from '../../shared/aiSchema'
import { buildAnalysisContext } from '../ai/context'
import { askModel, getAiHealth, type AiHealth } from '../ai/client'
import { analysisIsStale, episodeFingerprint } from '../domain/analysis'
import { CREW } from '../domain/crew'
import { formatMission, kindLabel } from '../domain/format'
import { useApp } from '../state/store'
import { useLocale } from '../i18n'
import { systemText } from '../systemText'
import { QUIRON_LOCALE } from '../ai/locale'

export function AnalysisPage() {
  const { state, dispatch } = useApp()
  const { lang } = useLocale()
  const en = lang === 'en'
  const location = useLocation()
  const linkedId = (location.state as { alertId?: string } | null)?.alertId
  const linked = state.alerts.find((alert) => alert.id === linkedId)
  const episode = linked
    ? state.episodes.find((item) => item.id === linked.episodeId)
    : state.episodes.find((item) => item.id === state.selectedEpisodeId && item.crewId === state.selectedCrewId)
      ?? state.episodes.find((item) => item.crewId === state.selectedCrewId && item.status !== 'closed')
  const [chosenId, setChosenId] = useState<string | null>(null)
  const chosen = state.episodes.find((item) => item.id === chosenId) ?? episode
  return (
    <div className="an-page">
      <header className="an-head">
        <p className="kicker">{en ? 'Analysis' : 'Análisis'}</p>
        <h1>{en ? 'Analysis with Quirón' : 'Análisis con Quirón'}</h1>
        <p className="lede">{en ? 'Ask Quirón to review the available measurements, symptoms and alerts for a crew member.' : 'Pedile a Quirón que revise las mediciones, síntomas y alertas disponibles de una persona.'}</p>
      </header>
      <label className="field" htmlFor="analysis-case">
        {en ? 'Person and case' : 'Persona y caso'}
        <select id="analysis-case" value={chosen?.id ?? ''} onChange={(event) => {
          const next = state.episodes.find((item) => item.id === event.target.value)
          if (!next) return
          setChosenId(next.id)
          dispatch({ type: 'selectCrew', crewId: next.crewId })
          dispatch({ type: 'selectEpisode', episodeId: next.id })
        }}>
          {!chosen ? <option value="">{en ? 'Select a case' : 'Seleccioná un caso'}</option> : null}
          {state.episodes.map((item) => <option key={item.id} value={item.id}>{CREW.find((crew) => crew.id === item.crewId)?.name} · {systemText(item.title)}</option>)}
        </select>
      </label>
      {chosen ? <QuironAnalysis key={`${chosen.id}-${lang}`} episodeId={chosen.id} /> : (
        <section className="an-card an-empty">
          <h2>{en ? 'No health episode selected' : 'Sin episodio de salud seleccionado'}</h2>
          <p>{en ? 'Select an existing case to run an analysis. A sensor notice alone does not create a health episode.' : 'Elegí un caso existente para realizar el análisis. Un aviso de sensor por sí solo no crea un episodio de salud.'}</p>
        </section>
      )}
    </div>
  )
}

function QuironAnalysis({ episodeId }: { episodeId: string }) {
  const { state, runActions } = useApp()
  const { lang } = useLocale()
  const en = lang === 'en'
  const episode = state.episodes.find((item) => item.id === episodeId)!
  const name = CREW.find((crew) => crew.id === episode.crewId)?.name ?? episode.crewId
  const [health, setHealth] = useState<AiHealth | null>(null)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState('')
  const [saveError, setSaveError] = useState('')
  const [generated, setGenerated] = useState<AnalysisRecord | null>(null)
  const request = useRef<AbortController | null>(null)
  const reportTitle = useRef<HTMLHeadingElement | null>(null)
  const lastSaved = [...state.analyses].reverse().find((item) => item.episodeId === episodeId && item.source === 'model' && item.id.startsWith(`analysis-${QUIRON_LOCALE}-`))
  const report = generated ?? lastSaved
  const context = buildAnalysisContext(state, episodeId, undefined, QUIRON_LOCALE)!
  const stale = report ? analysisIsStale(state, report.fingerprint, episodeId) : false

  useEffect(() => {
    const controller = new AbortController()
    void getAiHealth(controller.signal).then((value) => { if (!controller.signal.aborted) setHealth(value) })
    return () => { controller.abort(); request.current?.abort(); request.current = null }
  }, [])

  useEffect(() => {
    if (generated) reportTitle.current?.focus()
  }, [generated])

  async function analyze() {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setFailure('')
    setSaveError('')
    // Capture exactly the data sent at click time, not the live state when the response arrives.
    const input = buildAnalysisContext(state, episodeId, undefined, QUIRON_LOCALE)!
    const fingerprint = episodeFingerprint(state, episodeId)
    const result = await askModel('/api/ai/analyze', input, controller.signal)
    if (request.current !== controller || controller.signal.aborted) return
    try {
      if (!result.ok) {
        setFailure(analysisError(result.code, en))
        return
      }
      const record: AnalysisRecord = {
        id: `analysis-${QUIRON_LOCALE}-${crypto.randomUUID()}`, episodeId, crewId: episode.crewId,
        source: 'model', createdAt: Date.now(), model: result.model,
        fingerprint, snapshot: contextSnapshot(input), result: result.result,
      }
      setGenerated(record)
      try {
        await runActions([{ type: 'recordAnalysis', record, idempotencyKey: record.id }])
      } catch {
        if (request.current === controller && !controller.signal.aborted) setSaveError(en
          ? 'The analysis was generated, but could not be saved to history. Keep this page open.'
          : 'El análisis se generó, pero no pudo guardarse en el historial. Mantené esta página abierta.')
      }
    } finally {
      if (request.current === controller) { request.current = null; setPending(false) }
    }
  }

  function cancel() {
    request.current?.abort()
    request.current = null
    setPending(false)
    setFailure(en ? 'Analysis cancelled. You can run it again when ready.' : 'Análisis cancelado. Podés volver a realizarlo cuando quieras.')
  }

  return (
    <>
      <section className="an-card an-request" aria-labelledby="analysis-person">
        <div className="an-request-head">
          <div>
            <h2 id="analysis-person">{name}</h2>
            <p>{systemText(episode.title)}</p>
          </div>
          <span className="badge">{en ? 'Quirón AI' : 'IA Quirón'}</span>
        </div>
        <div className="row an-run-actions">
          <button className="btn btn-primary" type="button" data-testid="run-ai-analysis" disabled={pending} aria-busy={pending} onClick={() => void analyze()}>
            {pending ? <LoaderCircle className="is-busy" size={20} aria-hidden="true" /> : report ? <RefreshCw size={20} aria-hidden="true" /> : <Brain size={20} aria-hidden="true" />}
            {pending ? (en ? 'Quirón is analyzing…' : 'Quirón está analizando…') : report ? (en ? 'Run new analysis' : 'Realizar nuevo análisis') : (en ? 'Run analysis' : 'Realizar análisis')}
          </button>
          {pending ? <button className="btn" type="button" onClick={cancel}>{en ? 'Cancel' : 'Cancelar'}</button> : null}
        </div>
        <dl className="an-context-counts">
          <div><dt>{en ? 'Recent measurements' : 'Mediciones recientes'}</dt><dd>{context.measurements.length}</dd></div>
          <div><dt>{en ? 'Symptom reports' : 'Reportes de síntomas'}</dt><dd>{context.symptoms.length}</dd></div>
          <div><dt>{en ? 'Open alerts' : 'Alertas abiertas'}</dt><dd>{context.alerts.length}</dd></div>
        </dl>
        <p className="muted">{en ? 'Includes baseline, data quality, mission context, available inventory and reference protocols. For human review; not a diagnosis.' : 'Incluye línea base, calidad de datos, contexto de misión, inventario disponible y protocolos de referencia. Requiere revisión humana; no es un diagnóstico.'}</p>
        {pending ? <p role="status">{en ? 'Reviewing the available data. This may take a few seconds.' : 'Revisando los datos disponibles. Esto puede tardar unos segundos.'}</p> : null}
        {failure ? <p className="field-error" role="alert">{failure}</p> : null}
        {!pending && health && !health.configured ? <p className="muted">{en ? 'The AI service is currently unavailable. You can retry using Run analysis.' : 'El servicio de IA no está disponible en este momento. Podés reintentar con Realizar análisis.'}</p> : null}
      </section>
      {!report && !pending && !failure ? (
        <section className="an-card an-ready">
          <Brain size={30} aria-hidden="true" />
          <h2>{en ? 'Ready to analyze' : 'Listo para analizar'}</h2>
          <p>{en ? 'Press Run analysis to generate Quirón’s assessment from the available data.' : 'Presioná Realizar análisis para generar la evaluación de Quirón con los datos disponibles.'}</p>
        </section>
      ) : null}
      {report ? <section className="an-card an-model" data-testid="analysis-result" aria-label={en ? 'Quirón analysis result' : 'Resultado del análisis de Quirón'}>
        <h2 ref={reportTitle} tabIndex={-1}>{en ? 'Quirón’s analysis' : 'Análisis de Quirón'}</h2>
        <p className="an-meta">{en ? 'Generated' : 'Generado'} {formatMission(report.createdAt)} UTC{report.model ? ` · ${report.model}` : ''}</p>
        {stale ? <p className="callout callout-amber" role="status">{en ? 'The data changed after this analysis. Run a new analysis for the latest information.' : 'Los datos cambiaron después de este análisis. Realizá uno nuevo para usar la información más reciente.'}</p> : null}
        {saveError ? <p className="field-error" role="alert">{saveError}</p> : null}
        <p className="an-summary">{report.result.summary}</p>
        <h3>{en ? 'Evidence reviewed' : 'Evidencia revisada'}</h3>
        {report.result.evidence.length ? <ul className="an-result-list">{report.result.evidence.map((item, index) => <li key={`${item.refId}-${index}`}>{item.statement}</li>)}</ul> : <p>{en ? 'No specific evidence was cited.' : 'No se citó evidencia específica.'}</p>}
        <h3>{en ? 'Missing information' : 'Información faltante'}</h3>
        {report.result.missing.length ? <ul className="an-result-list">{report.result.missing.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>{en ? 'Quirón did not identify additional missing information.' : 'Quirón no identificó información faltante adicional.'}</p>}
        {report.result.checks.length ? <><h3>{en ? 'Suggested checks' : 'Comprobaciones sugeridas'}</h3><ul className="an-result-list">{report.result.checks.map((item, index) => <li key={`${item.protocolId}-${index}`}><strong>{systemText(item.title)}</strong><p>{item.why}</p></li>)}</ul></> : null}
        {report.result.resources.length ? <><h3>{en ? 'Available resources' : 'Recursos disponibles'}</h3><ul className="an-result-list">{report.result.resources.map((item, index) => <li key={`${item.resourceId}-${index}`}>{systemText(item.note)}</li>)}</ul></> : null}
        {report.result.questions.length ? <><h3>{en ? 'Questions for follow-up' : 'Preguntas para seguimiento'}</h3><ul className="an-result-list">{report.result.questions.map((item, i) => <li key={i}>{item}</li>)}</ul></> : null}
        <details className="an-more"><summary>{en ? 'Sources and limitations' : 'Fuentes y limitaciones'}</summary>
          <ul className="an-result-list">{report.result.sources.map((item, i) => <li key={i}>{item}</li>)}</ul>
          <ul className="an-result-list">{report.result.limitations.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </details>
        <p className="muted">{en ? 'Requires human review. Generating an analysis does not close alerts or change treatment.' : 'Requiere revisión humana. Generar un análisis no cierra alertas ni cambia tratamientos.'}</p>
      </section> : null}
      <details className="an-more"><summary>{en ? 'Data included in the analysis' : 'Datos incluidos en el análisis'}</summary>
        <p>{en ? 'Up to 20 recent measurements and 10 symptom reports for this case, plus open alerts and available resources.' : 'Hasta 20 mediciones recientes y 10 reportes de síntomas de este caso, más alertas abiertas y recursos disponibles.'}</p>
        <ul className="an-result-list">{context.measurements.slice(0, 5).map((item) => <li key={item.id}>{kindLabel(item.kind as AppState['measurements'][number]['kind'])}: {item.value} {en && item.unit === 'lpm' ? 'bpm' : item.unit} · {formatMission(item.measuredAt)} UTC</li>)}</ul>
      </details>
    </>
  )
}

function contextSnapshot(context: AnalysisContextInput): AnalysisRecord['snapshot'] {
  return {
    measurementIds: context.measurements.map((item) => item.id), symptomIds: context.symptoms.map((item) => item.id),
    alertIds: context.alerts.map((item) => item.id), resourceIds: context.resources.map((item) => item.id),
    protocolIds: context.protocols.map((item) => item.id),
  }
}

function analysisError(code: string, en: boolean) {
  const messages: Record<string, [string, string]> = {
    timeout: ['Quirón did not respond in time. Try again.', 'Quirón no respondió a tiempo. Volvé a intentarlo.'],
    invalid_response: ['Quirón’s response could not be validated. No new analysis was saved. Try again.', 'No se pudo validar la respuesta de Quirón. No se guardó un análisis nuevo. Volvé a intentarlo.'],
    rate_limit: ['The AI request limit was reached. Wait a moment and try again.', 'Se alcanzó el límite de consultas de IA. Esperá un momento y volvé a intentarlo.'],
    authentication: ['The AI service could not authenticate. Check the backend configuration.', 'El servicio de IA no pudo autenticarse. Revisá la configuración del backend.'],
    model_unavailable: ['The configured AI model is unavailable. Try again later.', 'El modelo de IA configurado no está disponible. Intentá más tarde.'],
  }
  const pair = messages[code] ?? ['Could not connect to Quirón. Check the connection and try again.', 'No se pudo conectar con Quirón. Revisá la conexión y volvé a intentarlo.']
  return pair[en ? 0 : 1]
}
