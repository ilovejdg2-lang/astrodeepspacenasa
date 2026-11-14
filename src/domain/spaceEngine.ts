import type { SpaceProposal } from '../../shared/spaceSchema'
import type { AppState, CrewId } from '../../shared/types'
import type { SpaceDataUse, SpaceShareLevel } from '../persistence/space'
import { crewPosture, latestReliable } from './selectors'

const HR_HIGH = 150
const HR_LOW = 40

const KEYWORDS: { category: string; patterns: string[] }[] = [
  { category: 'dolor en el pecho', patterns: ['dolor en el pecho', 'dolor de pecho', 'dolor toracico'] },
  { category: 'desmayo', patterns: ['desmay'] },
  { category: 'dificultad para respirar', patterns: ['dificultad para respirar', 'no puedo respirar', 'me falta el aire', 'falta de aire'] },
  { category: 'confusión', patterns: ['confusion', 'confundid'] },
  { category: 'hacerse daño o dañar a otros', patterns: ['hacerme dano', 'hacerse dano', 'matarme', 'suicid', 'danar a otros', 'herir a', 'lastimar a'] },
  { category: 'riesgo para la nave', patterns: ['riesgo para la nave', 'peligro para la nave'] },
]

export interface SpaceTurn {
  assistantText: string
  requiereHumanoAhora: boolean
  suggestedLevel: SpaceShareLevel
  categories: string[]
}

export function applySpaceProposal(local: SpaceTurn, proposal: SpaceProposal | null): { text: string; level: SpaceShareLevel; source: 'local_engine' | 'model' } {
  if (local.requiereHumanoAhora || !proposal) {
    return { text: local.assistantText, level: local.suggestedLevel, source: 'local_engine' }
  }
  return { text: proposal.respuesta, level: proposal.nivel, source: 'model' }
}

export function openSpace(state: AppState, crewId: CrewId, dataUse: SpaceDataUse): string {
  const posture = crewPosture(state, crewId)
  if (posture.observed === 'no_recent_evaluation') {
    return 'No tengo datos recientes tuyos, así que no puedo comparar. ¿Cómo te sientes ahora?'
  }
  if (posture.observed === 'stable') {
    return 'Tus datos recientes están en tu línea base. No voy a suponer un problema. ¿Cómo te sientes ahora?'
  }
  const bits: string[] = []
  if (dataUse.pulse) {
    const pulse = latestReliable(state, crewId, 'heart_rate')
    if (pulse) bits.push(`pulso ${Math.round(pulse.value)} ${pulse.unit} (${pulse.id})`)
  }
  if (dataUse.sleep) {
    const sleep = latestReliable(state, crewId, 'sleep_hours')
    if (sleep) bits.push(`descanso ${sleep.value} ${sleep.unit} (${sleep.id})`)
  }
  if (dataUse.symptoms) {
    const reports = state.symptoms.filter((item) => item.crewId === crewId)
    if (reports.length > 0) {
      bits.push(`síntomas ya registrados: ${reports.flatMap((item) => item.symptoms).join(', ')} (${reports.map((item) => item.id).join(', ')})`)
    }
  }
  const used = bits.length > 0
    ? ` Uso lo que dejaste activo: ${bits.join('; ')}.`
    : ' Los interruptores de datos están apagados, así que no comparo cifras.'
  return `Hay un cambio respecto de tu línea base.${used} Motor local, simulación. ¿Cómo te sientes ahora?`
}

export function answerSpace(state: AppState, crewId: CrewId, dataUse: SpaceDataUse, text: string): SpaceTurn {
  const categories = escalationCategories(state, crewId, dataUse, text)
  if (categories.length > 0) {
    return {
      assistantText: 'Esto es importante y no debe quedarse solo entre tú y yo. Conecta con el médico de vuelo o con un compañero. Motor local, simulación.',
      requiereHumanoAhora: true,
      suggestedLevel: 'medico',
      categories,
    }
  }
  return guidedTurn(state, crewId, text)
}

export function escalationCategories(state: AppState, crewId: CrewId, dataUse: SpaceDataUse, text: string): string[] {
  const folded = fold(text)
  const found = KEYWORDS.filter((rule) => rule.patterns.some((pattern) => folded.includes(pattern))).map((rule) => rule.category)
  if (dataUse.pulse) {
    const pulse = latestReliable(state, crewId, 'heart_rate')
    if (pulse && (pulse.value >= HR_HIGH || pulse.value <= HR_LOW)) found.push('pulso fuera del umbral fijo')
  }
  return found
}

function guidedTurn(state: AppState, crewId: CrewId, text: string): SpaceTurn {
  const folded = fold(text)
  const posture = crewPosture(state, crewId)
  if (folded.includes('me siento mal') || folded.includes('mal ahora')) {
    const assistantText = posture.observed === 'no_recent_evaluation'
      ? 'No tengo datos recientes tuyos, así que no puedo comparar. Si te sientes mal, conviene repetir una medición en reposo.'
      : posture.observed === 'stable'
        ? 'Tus cifras recientes no muestran un cambio. Eso no contradice cómo te sientes. Conviene repetir la medición en reposo.'
        : 'Anoté que te sientes mal ahora. Puedes enviar la solicitud al médico de vuelo con el texto que elijas.'
    return { assistantText, requiereHumanoAhora: false, suggestedLevel: 'medico', categories: [] }
  }
  if (folded.includes('hablar')) {
    return {
      assistantText: 'Puedes pedir hablar con alguien. En nivel genérico el equipo vería solo eso, sin el motivo.',
      requiereHumanoAhora: false,
      suggestedLevel: 'generica',
      categories: [],
    }
  }
  if (folded.includes('descans') || folded.includes('cansad')) {
    return {
      assistantText: 'Puedo armar una solicitud de descanso. En nivel genérico el equipo vería que necesitas un bloque de descanso, sin el motivo.',
      requiereHumanoAhora: false,
      suggestedLevel: 'generica',
      categories: [],
    }
  }
  return {
    assistantText: 'Quedó anotado en tu espacio. Revisa la vista previa antes de enviar. Motor local, simulación.',
    requiereHumanoAhora: false,
    suggestedLevel: 'generica',
    categories: [],
  }
}

function fold(text: string): string {
  return text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '')
}
