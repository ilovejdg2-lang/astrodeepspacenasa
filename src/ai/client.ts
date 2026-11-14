import type { AnalysisContextInput } from '../../shared/aiSchema'
import type { AnalysisResult } from '../../shared/types'

export interface AiHealth {
  configured: boolean
  provider: string
  model: string
  missing: string[]
  reachable: boolean
}

export type ModelResult =
  | { ok: true; model: string; result: AnalysisResult }
  | { ok: false; code: string; message: string }

export async function getAiHealth(signal?: AbortSignal): Promise<AiHealth> {
  try {
    const response = await fetch('/api/ai/health', { signal })
    if (!response.ok) return { configured: false, provider: 'desconocido', model: '', missing: [], reachable: false }
    const body = (await response.json()) as Partial<AiHealth>
    return {
      configured: Boolean(body.configured),
      provider: body.provider ?? 'desconocido',
      model: body.model ?? '',
      missing: Array.isArray(body.missing) ? body.missing.filter((item) => typeof item === 'string') : [],
      reachable: true,
    }
  } catch {
    return { configured: false, provider: 'desconocido', model: '', missing: [], reachable: false }
  }
}

export async function askModel(path: '/api/ai/analyze' | '/api/ai/chat', context: AnalysisContextInput, signal: AbortSignal): Promise<ModelResult> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(context),
      signal,
    })
    const body = (await response.json().catch(() => null)) as { code?: string; message?: string; model?: string; result?: AnalysisResult } | null
    if (!response.ok || !body?.result) {
      return { ok: false, code: body?.code ?? 'network', message: body?.message ?? 'El servicio de IA no respondió.' }
    }
    return { ok: true, model: body.model ?? 'modelo', result: body.result }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, code: 'aborted', message: 'Se canceló la solicitud. No se guardó un análisis.' }
    }
    return { ok: false, code: 'network', message: 'No hay conexión con el servicio de IA. El motor local sigue disponible.' }
  }
}
