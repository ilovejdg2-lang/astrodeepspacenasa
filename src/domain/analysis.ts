import { DEMO_PROTOCOLS } from '../../shared/protocols'
import type { AnalysisResult, AppState, Measurement } from '../../shared/types'
import { crewById } from './crew'
import { integrityLabel, kindLabel } from './format'
import { djb2 } from './hash'
import { crewPosture, latestReliable, measurementsFor } from './selectors'

const LIMITATIONS = [
  'Motor de análisis simulado. No es una evaluación clínica.',
  'No calcula una probabilidad ni confirma un diagnóstico.',
  'La disponibilidad de un recurso no indica que deba usarse.',
]

export function episodeFingerprint(state: AppState, episodeId: string): string {
  const episode = state.episodes.find((item) => item.id === episodeId)
  const crewId = episode?.crewId
  const parts = [
    state.link,
    ...state.measurements
      .filter((item) => item.crewId === crewId)
      .map((item) => `${item.id}:${item.value}:${item.integrity}:${item.measuredAt}`),
    ...state.symptoms.filter((item) => item.episodeId === episodeId).map((item) => `${item.id}:${item.symptoms.join(',')}`),
    ...state.alerts
      .filter((item) => item.episodeId === episodeId || item.crewId === crewId)
      .map((item) => `${item.id}:${item.status}`),
    ...state.resources.map((item) => `${item.id}:${item.quantity}:${item.status}:${item.location}`),
  ]
  return djb2(parts.join('|'))
}

export function runLocalAnalysis(state: AppState, episodeId: string): AnalysisResult | null {
  const episode = state.episodes.find((item) => item.id === episodeId)
  if (!episode) return null
  const profile = crewById(episode.crewId)
  const posture = crewPosture(state, episode.crewId)
  const symptoms = state.symptoms.filter((item) => item.episodeId === episodeId)
  const reliable = (['heart_rate', 'spo2', 'temperature', 'respiratory_rate', 'sleep_hours'] as const)
    .map((kind) => latestReliable(state, episode.crewId, kind))
    .filter((item): item is Measurement => Boolean(item))
  const resources = state.resources.filter((item) => item.quantity > 0 && item.status === 'ready')
  const hasStale = measurementsFor(state, episode.crewId).some((item) => item.integrity === 'stale')
  const missing = [
    posture.evidence !== 'actualizada' ? 'Medición de control en reposo, con la persona quieta y el sensor identificado.' : '',
    hasStale ? 'Una lectura tomada ahora. Las cifras antiguas no describen el momento actual.' : '',
    symptoms.length === 0 ? 'Autorreporte breve: qué siente, desde cuándo y si coincide con ejercicio o sueño corto.' : '',
  ].filter(Boolean)

  const summary = [
    posture.summary,
    symptoms.length ? `Autorreporte registrado: ${symptoms.flatMap((item) => item.symptoms).join(', ')}.` : 'No hay un autorreporte en este episodio.',
    'Hace falta revisión humana. Esto no es un diagnóstico.',
  ].join(' ')

  return {
    summary,
    evidence: [
      ...reliable.slice(0, 4).map((item) => ({
        statement: `${kindLabel(item.kind)} ${item.value} ${item.unit}, integridad ${integrityLabel(item.integrity).toLowerCase()}.`,
        refType: 'measurement' as const,
        refId: item.id,
      })),
      ...symptoms.slice(0, 3).map((item) => ({
        statement: 'Autorreporte de la persona. Es un dato, no una instrucción.',
        refType: 'symptom' as const,
        refId: item.id,
      })),
      {
        statement: 'Las comprobaciones salen del protocolo de demostración.',
        refType: 'protocol' as const,
        refId: 'proto-demo-v1-human-review',
      },
    ],
    missing,
    questions: [
      '¿La persona está en reposo desde hace unos minutos?',
      '¿El cambio coincide con ejercicio, una tarea de carga o poco descanso?',
    ],
    checks: DEMO_PROTOCOLS.map((protocol) => ({
      title: protocol.title,
      protocolId: protocol.id,
      why: protocol.summary,
    })),
    resources: resources.map((item) => ({
      resourceId: item.id,
      note: `${item.name} en ${item.location}. Disponible en el inventario; eso no es una indicación de uso.`,
    })),
    humanReviewRequired: true,
    limitations: LIMITATIONS,
    sources: ['Motor de análisis simulado', `${profile.name}: línea base ${profile.baseline.hrMin}–${profile.baseline.hrMax} lpm`],
  }
}

export function answerLocal(state: AppState, episodeId: string, question: string): AnalysisResult | null {
  const base = runLocalAnalysis(state, episodeId)
  if (!base) return null
  const episode = state.episodes.find((item) => item.id === episodeId)
  if (!episode) return null
  const normalized = question.toLowerCase()
  const resources = state.resources.filter((item) => item.quantity > 0)
  const alerts = state.alerts.filter((item) => item.episodeId === episodeId || item.crewId === episode.crewId)
  let summary = base.summary
  if (normalized.includes('equipo') || normalized.includes('recurso') || normalized.includes('oxím') || normalized.includes('oxim')) {
    summary = resources.length
      ? `Equipo registrado: ${resources.map((item) => `${item.name} (${item.quantity} ${item.unitLabel}, ${item.location})`).join('; ')}. La disponibilidad no indica que deba usarse.`
      : 'No hay recursos con existencias en el inventario cargado.'
  } else if (normalized.includes('falta')) {
    summary = base.missing.length ? `Falta confirmar: ${base.missing.join(' ')}` : 'El motor local no detecta un hueco adicional en los datos de este episodio.'
  } else if (normalized.includes('alerta')) {
    summary = alerts.length
      ? `Alertas vinculadas: ${alerts.map((item) => `${item.title}. ${item.reason}`).join(' ')}`
      : 'No hay alertas abiertas vinculadas a este episodio.'
  } else if (normalized.includes('resumen')) {
    const posture = crewPosture(state, episode.crewId)
    summary = `Resumen para revisión humana. ${posture.summary} ${posture.evidenceDetail} Enlace: ${state.link}. No es una orientación médica cerrada.`
  } else if (normalized.includes('cambi') || normalized.includes('medici')) {
    const hr = latestReliable(state, episode.crewId, 'heart_rate')
    summary = hr
      ? `Respecto a la línea base, la última frecuencia confiable es ${hr.value} ${hr.unit}. ${base.summary}`
      : `No hay una medición reciente confiable para comparar. ${base.summary}`
  }
  return { ...base, summary }
}

export function analysisIsStale(state: AppState, fingerprint: string, episodeId: string): boolean {
  return episodeFingerprint(state, episodeId) !== fingerprint
}
