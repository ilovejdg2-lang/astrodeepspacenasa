import { answerLocal, answerMissionLocal } from '../domain/analysis'
import { answerPublicLocal, type QuironPublicLocale } from '../domain/quironPublic'
import { buildAnalysisContext } from './context'
import { askModel, getAiHealth, type AiHealth } from './client'
import type { AppState } from '../../shared/types'
import { crewById } from '../domain/crew'

export type QuironMode = 'public' | 'dashboard'

export interface QuironMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
  sources?: string[]
  /** Honest label when answer is local/demo, not a live model */
  channel: 'model' | 'local' | 'demo' | 'error'
  contextLabel?: string
  model?: string
}

export interface QuironAskResult {
  text: string
  sources: string[]
  channel: QuironMessage['channel']
  contextLabel?: string
  model?: string
  errorCode?: string
}

export function quironContextLabel(state: AppState | null, locale: QuironPublicLocale): string | undefined {
  if (!state) return undefined
  const episode = state.episodes.find((item) => item.id === state.selectedEpisodeId) ?? state.episodes.find((item) => item.status !== 'closed')
  const crew = episode ? crewById(episode.crewId) : null
  const stage =
    locale === 'en'
      ? state.mission.stage === 'preembarque'
        ? 'Pre-flight'
        : state.mission.stage === 'a_bordo'
          ? 'Aboard'
          : 'Post-mission'
      : state.mission.stage === 'preembarque'
        ? 'Preembarque'
        : state.mission.stage === 'a_bordo'
          ? 'A bordo'
          : 'Posmisión'
  if (crew) return locale === 'en' ? `Context: ${crew.name} · ${stage}` : `Contexto: ${crew.name} · ${stage}`
  return locale === 'en' ? `Context: ${state.mission.name} · ${stage}` : `Contexto: ${state.mission.name} · ${stage}`
}

export async function askQuiron(options: {
  mode: QuironMode
  question: string
  locale: QuironPublicLocale
  state: AppState | null
  signal: AbortSignal
  preferModel: boolean
}): Promise<QuironAskResult> {
  const { mode, question, locale, state, signal, preferModel } = options
  const trimmed = question.trim().slice(0, 1000)
  if (!trimmed) {
    return {
      text: locale === 'en' ? 'Write a short question for Quirón.' : 'Escribí una pregunta breve para Quirón.',
      sources: [],
      channel: 'error',
      errorCode: 'empty',
    }
  }

  if (mode === 'public') {
    const local = answerPublicLocal(trimmed, locale)
    return { text: local.text, sources: local.sources, channel: 'demo' }
  }

  if (!state) {
    return {
      text: locale === 'en' ? 'Dashboard context is not ready yet.' : 'El contexto del panel aún no está listo.',
      sources: [],
      channel: 'error',
      errorCode: 'no_state',
    }
  }

  const label = quironContextLabel(state, locale)
  const episode =
    state.episodes.find((item) => item.id === state.selectedEpisodeId) ??
    state.episodes.find((item) => item.status !== 'closed')

  if (preferModel && episode) {
    const context = buildAnalysisContext(state, episode.id, trimmed, locale)
    if (context) {
      const response = await askModel('/api/ai/chat', context, signal)
      if (response.ok) {
        return {
          text: response.result.summary,
          sources: response.result.sources,
          channel: 'model',
          contextLabel: label,
          model: response.model,
        }
      }
      if (response.code === 'aborted') {
        return {
          text: locale === 'en' ? 'Request cancelled.' : 'Solicitud cancelada.',
          sources: [],
          channel: 'error',
          errorCode: 'aborted',
          contextLabel: label,
        }
      }
      // Fall through to local with honest note if model failed
      const local = answerLocal(state, episode.id, trimmed)
      if (local) {
        return {
          text: `${local.summary}\n\n(${locale === 'en' ? 'Model unavailable' : 'Modelo no disponible'}: ${response.message})`,
          sources: local.sources,
          channel: 'local',
          contextLabel: label,
          errorCode: response.code,
        }
      }
      return {
        text: response.message,
        sources: [],
        channel: 'error',
        errorCode: response.code,
        contextLabel: label,
      }
    }
  }

  if (episode) {
    const local = answerLocal(state, episode.id, trimmed)
    if (local) {
      return { text: local.summary, sources: local.sources, channel: 'local', contextLabel: label }
    }
  }

  const mission = answerMissionLocal(state, trimmed)
  return {
    text: mission,
    sources: [locale === 'en' ? 'Quirón · HELIOS local engine' : 'Quirón · motor local de HELIOS'],
    channel: 'local',
    contextLabel: label,
  }
}

export async function probeQuironHealth(signal?: AbortSignal): Promise<AiHealth> {
  return getAiHealth(signal)
}

export function formatServiceStatus(health: AiHealth | null, locale: QuironPublicLocale, probing: boolean): { label: string; ok: boolean } {
  if (probing || !health) {
    return { label: locale === 'en' ? 'Checking service…' : 'Comprobando servicio…', ok: false }
  }
  if (health.reachable && health.configured) {
    return {
      label: locale === 'en' ? `Model configured · ${health.provider}` : `Modelo configurado · ${health.provider}`,
      ok: true,
    }
  }
  if (health.reachable && !health.configured) {
    return {
      label: locale === 'en' ? 'Local engine · model not configured' : 'Motor local · modelo sin configurar',
      ok: true,
    }
  }
  return {
    label: locale === 'en' ? 'Local engine · AI unreachable' : 'Motor local · IA no alcanzable',
    ok: true,
  }
}
