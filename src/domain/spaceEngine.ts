import type { SpaceProposal } from '../../shared/spaceSchema'
import type { AppState, CrewId } from '../../shared/types'
import type { SpaceDataUse, SpaceShareLevel } from '../persistence/space'
import { uiLang } from '../locale'
import { crewPosture, latestReliable } from './selectors'

const HR_HIGH = 150
const HR_LOW = 40

const KEYWORDS: { category: string; patterns: string[] }[] = [
  { category: 'dolor en el pecho', patterns: ['dolor en el pecho', 'dolor de pecho', 'dolor toracico', 'chest pain'] },
  { category: 'desmayo', patterns: ['desmay', 'faint', 'blackout'] },
  { category: 'dificultad para respirar', patterns: ['dificultad para respirar', 'no puedo respirar', 'me falta el aire', 'falta de aire', 'trouble breathing', 'cant breathe', "can't breathe"] },
  { category: 'confusión', patterns: ['confusion', 'confundid', 'confused'] },
  { category: 'hacerse daño o dañar a otros', patterns: ['hacerme dano', 'hacerse dano', 'matarme', 'suicid', 'danar a otros', 'herir a', 'lastimar a', 'hurt myself', 'hurt others'] },
  { category: 'riesgo para la nave', patterns: ['riesgo para la nave', 'peligro para la nave', 'risk to the ship'] },
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
      assistantText: uiLang() === 'en'
        ? 'This matters and should not stay only between you and me. Connect with the flight surgeon or a crewmate. Local engine, simulation.'
        : 'Esto es importante y no debe quedarse solo entre tú y yo. Conecta con el médico de vuelo o con un compañero. Motor local, simulación.',
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
  const english = uiLang() === 'en'
  const posture = crewPosture(state, crewId)
  if (folded.includes('me siento mal') || folded.includes('mal ahora') || folded.includes('feel unwell') || folded.includes('feel bad')) {
    const assistantText = posture.observed === 'no_recent_evaluation'
      ? (english ? 'I do not have recent data for you, so I cannot compare. If you feel unwell, it helps to repeat a measurement at rest.' : 'No tengo datos recientes tuyos, así que no puedo comparar. Si te sientes mal, conviene repetir una medición en reposo.')
      : posture.observed === 'stable'
        ? (english ? 'Your recent numbers do not show a change. That does not contradict how you feel. It helps to repeat the measurement at rest.' : 'Tus cifras recientes no muestran un cambio. Eso no contradice cómo te sientes. Conviene repetir la medición en reposo.')
        : (english ? 'I noted that you feel unwell now. You can send the request to the flight surgeon with the text you choose.' : 'Anoté que te sientes mal ahora. Puedes enviar la solicitud al médico de vuelo con el texto que elijas.')
    return { assistantText, requiereHumanoAhora: false, suggestedLevel: 'medico', categories: [] }
  }
  if (folded.includes('hablar') || folded.includes('talk')) {
    return {
      assistantText: english ? 'You can ask to talk with someone. At the generic level the team would see only that, without the reason.' : 'Puedes pedir hablar con alguien. En nivel genérico el equipo vería solo eso, sin el motivo.',
      requiereHumanoAhora: false,
      suggestedLevel: 'generica',
      categories: [],
    }
  }
  if (folded.includes('descans') || folded.includes('cansad') || folded.includes('rest') || folded.includes('tired')) {
    return {
      assistantText: english ? 'I can draft a rest request. At the generic level the team would see that you need a rest block, without the reason.' : 'Puedo armar una solicitud de descanso. En nivel genérico el equipo vería que necesitas un bloque de descanso, sin el motivo.',
      requiereHumanoAhora: false,
      suggestedLevel: 'generica',
      categories: [],
    }
  }
  return {
    assistantText: english ? 'Noted in your space. Review the preview before sending. Local engine, simulation.' : 'Quedó anotado en tu espacio. Revisa la vista previa antes de enviar. Motor local, simulación.',
    requiereHumanoAhora: false,
    suggestedLevel: 'generica',
    categories: [],
  }
}

function fold(text: string): string {
  return text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '')
}
