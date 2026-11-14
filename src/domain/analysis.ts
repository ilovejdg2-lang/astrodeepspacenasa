import { MISSION_STAGE_LABEL, PREP_STATUS_LABEL } from '../../shared/mission'
import { EVA_METABOLIC_BANDS } from '../../shared/nasaSources'
import { nasaSourceLines } from './scienceBrief'
import { DEMO_PROTOCOLS } from '../../shared/protocols'
import { NASA_RISKS, RISK_CATEGORY_LABEL } from '../../shared/risks'
import type { AnalysisResult, AppState, Measurement } from '../../shared/types'
import { crewById } from './crew'
import { integrityLabel, kindLabel } from './format'
import { djb2 } from './hash'
import { crewPosture, latestReliable, measurementsFor } from './selectors'

const LIMITATIONS = [
  'Quirón Bot · motor local de HELIOS. No es una evaluación clínica.',
  'No calcula una probabilidad ni confirma un diagnóstico.',
  'La disponibilidad de un recurso no indica que deba usarse.',
  'Las referencias de NASA sirven de contexto científico, no como instrucción de tratamiento.',
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
    `Etapa de misión: ${MISSION_STAGE_LABEL[state.mission.stage]}.`,
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
    sources: [
      'Motor de análisis simulado',
      `${profile.name}: línea base ${profile.baseline.hrMin}–${profile.baseline.hrMax} lpm`,
      ...nasaSourceLines(state, episode.crewId),
    ].slice(0, 8),
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
  if (normalized.includes('abord') || normalized.includes('prepar') || normalized.includes('preembar')) {
    const pending = state.prepItems.filter((item) => item.status === 'propuesto' || item.status === 'pendiente_revision' || item.status === 'faltante')
    summary = `Preembarque. ${pending.length} elemento(s) aún no listos: ${pending.map((item) => `${item.title} (${PREP_STATUS_LABEL[item.status]})`).join('; ') || 'ninguno'}. Quirón Bot propone categorías; el personal autorizado aprueba productos y cantidades.`
  } else if (normalized.includes('aprob') || (normalized.includes('pendiente') && normalized.includes('recurso'))) {
    const rows = state.prepItems.filter((item) => item.status === 'propuesto' || item.status === 'pendiente_revision')
    summary = rows.length
      ? `Pendientes de aprobación o revisión: ${rows.map((item) => item.title).join('; ')}.`
      : 'No hay propuestas pendientes de revisión en la lista de preparación.'
  } else if (normalized.includes('posmisi') || normalized.includes('regres') || normalized.includes('después')) {
    const open = state.episodes.filter((item) => item.status !== 'closed')
    summary = `Posmisión. Etapa actual: ${MISSION_STAGE_LABEL[state.mission.stage]}. Episodios aún abiertos: ${open.length}. Cambiar de etapa no cierra un seguimiento pendiente. Las decisiones de recuperación corresponden al personal autorizado.`
  } else if (normalized.includes('riesgo') || normalized.includes('nasa') || normalized.includes('hrp')) {
    summary = `Riesgos de referencia cargados: ${NASA_RISKS.slice(0, 4)
      .map((item) => `${item.title} [${RISK_CATEGORY_LABEL[item.category]}]`)
      .join('; ')}. Son fundamento científico; no se convierten en tratamiento automático.`
  } else if (normalized.includes('equipo') || normalized.includes('recurso') || normalized.includes('oxím') || normalized.includes('oxim') || normalized.includes('dónde')) {
    summary = resources.length
      ? `Equipo registrado: ${resources.map((item) => `${item.name} (${item.quantity} ${item.unitLabel}, ${item.location})`).join('; ')}. La disponibilidad no indica que deba usarse.`
      : 'No hay recursos con existencias en el inventario cargado.'
  } else if (normalized.includes('falta')) {
    summary = base.missing.length ? `Falta confirmar: ${base.missing.join(' ')}` : 'Quirón Bot no detecta un hueco adicional en los datos de este episodio.'
  } else if (normalized.includes('alerta')) {
    summary = alerts.length
      ? `Alertas vinculadas: ${alerts.map((item) => `${item.title}. ${item.reason}`).join(' ')}`
      : 'No hay alertas abiertas vinculadas a este episodio.'
  } else if (normalized.includes('resumen') || normalized.includes('especialista')) {
    const posture = crewPosture(state, episode.crewId)
    summary = `Resumen para revisión humana (${MISSION_STAGE_LABEL[state.mission.stage]}). ${posture.summary} ${posture.evidenceDetail} Enlace: ${state.link}. No es una orientación médica cerrada.`
  } else if (normalized.includes('cambi') || normalized.includes('medici')) {
    const hr = latestReliable(state, episode.crewId, 'heart_rate')
    summary = hr
      ? `Respecto a la línea base, la última frecuencia confiable es ${hr.value} ${hr.unit}. ${base.summary}`
      : `No hay una medición reciente confiable para comparar. ${base.summary}`
  }
  return { ...base, summary, sources: [...base.sources, 'Quirón Bot · HELIOS'] }
}

export function analysisIsStale(state: AppState, fingerprint: string, episodeId: string): boolean {
  return episodeFingerprint(state, episodeId) !== fingerprint
}

/** Respuestas de Quirón Bot sobre misión y preparación, sin exigir un episodio abierto. */
export function answerMissionLocal(state: AppState, question: string): string {
  const normalized = question.toLowerCase()
  const pending = state.prepItems.filter((item) => item.status === 'propuesto' || item.status === 'pendiente_revision' || item.status === 'faltante')
  const open = state.episodes.filter((item) => item.status !== 'closed')
  if (normalized.includes('abord') || normalized.includes('prepar') || normalized.includes('preembar')) {
    return `Antes de abordar (${MISSION_STAGE_LABEL[state.mission.stage]}): ${pending.length} ítem(s) por resolver — ${pending.map((item) => `${item.title} (${PREP_STATUS_LABEL[item.status]})`).join('; ') || 'ninguno'}. HELIOS no decide medicamentos por tripulante.`
  }
  if (normalized.includes('aprob') || normalized.includes('pendiente')) {
    const rows = state.prepItems.filter((item) => item.status === 'propuesto' || item.status === 'pendiente_revision')
    return rows.length
      ? `Pendientes de revisión/aprobación: ${rows.map((item) => item.title).join('; ')}.`
      : 'No hay propuestas pendientes en la lista de preparación.'
  }
  if (normalized.includes('posmisi') || normalized.includes('regres') || normalized.includes('después')) {
    return `Seguimiento posterior: etapa ${MISSION_STAGE_LABEL[state.mission.stage]}. Episodios abiertos: ${open.length}. Finalizar o cambiar de etapa no cierra automáticamente un episodio pendiente.`
  }
  if (normalized.includes('riesgo') || normalized.includes('nasa')) {
    return `Biblioteca de riesgos NASA (selección): ${NASA_RISKS.length} referencias. Consultá la pantalla Riesgos NASA para título, enlace y límite de uso.`
  }
  if (normalized.includes('metaból') || normalized.includes('metabol') || normalized.includes('eva') || normalized.includes('btu')) {
    return `Esfuerzo EVA (literatura xEMU/NTRS): baja ≤${EVA_METABOLIC_BANDS.lowMax} BTU/hr, media hasta ${EVA_METABOLIC_BANDS.mediumMax}, diseño histórico ~${EVA_METABOLIC_BANDS.highDesignLimit}. La FC sola no basta. No hay telemetría de traje pública en este prototipo.`
  }
  if (normalized.includes('dónde') || normalized.includes('recurso') || normalized.includes('equipo')) {
    const ready = state.resources.filter((item) => item.quantity > 0)
    return ready.map((item) => `${item.name}: ${item.quantity} en ${item.location}`).join('; ') || 'Sin existencias.'
  }
  return `Misión ${state.mission.name}. Destino ${state.mission.destination}, ${state.mission.durationDays} días, ${state.mission.crewCount} tripulantes. Etapa: ${MISSION_STAGE_LABEL[state.mission.stage]}.`
}
