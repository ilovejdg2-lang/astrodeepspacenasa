import type { AppState, AnalysisResult } from '../../shared/types'
import type { Action } from '../domain/reduce'
import { stateSchema } from '../../shared/stateSchema'
import { analysisResultSchema } from '../../shared/aiSchema'
import { apiUrl } from './baseUrl'
import { uiLang } from '../locale'

export interface Snapshot {
  state: AppState
  revision: number
  simulated: true
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfterSeconds: number | null = null,
  ) {
    super(message)
  }
}

export class SimulationClient {
  revision = 0
  constructor(public sessionId: string) {}

  private async request(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(apiUrl(path), {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Simulation-Id': this.sessionId, 'Accept-Language': uiLang() },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string | string[] } | null
      const wait = Number(response.headers.get('Retry-After'))
      throw new ApiError(response.status, String(error?.message ?? `API ${response.status}`), Number.isFinite(wait) && wait > 0 ? Math.min(wait, 3600) : null)
    }
    return response.json()
  }

  private accept(value: unknown): Snapshot {
    const snapshot = value as Partial<Snapshot> | null
    const state = stateSchema.safeParse(snapshot?.state)
    if (!snapshot || !state.success || !Number.isInteger(snapshot.revision) || snapshot.simulated !== true)
      throw new Error('Respuesta de simulación inválida')
    this.revision = snapshot.revision as number
    return { ...snapshot, state: state.data } as Snapshot
  }
  async connect(state: AppState): Promise<Snapshot> {
    try { return await this.refresh() }
    catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
      return this.initialize(state)
    }
  }
  async initialize(state: AppState): Promise<Snapshot> {
    return this.accept(await this.request('/api/simulation', { initialState: state }))
  }
  async refresh(): Promise<Snapshot> {
    return this.accept(await this.request('/api/simulation'))
  }
  async dispatch(action: Action): Promise<Snapshot> {
    return this.accept(
      await this.request('/api/simulation/actions', {
        requestId: crypto.randomUUID(),
        expectedRevision: this.revision,
        action,
      }),
    )
  }
  async analysis(episodeId: string, question = 'resumen'): Promise<AnalysisResult> {
    const value = (await this.request(
      `/api/medical/episodes/${encodeURIComponent(episodeId)}/analysis?question=${encodeURIComponent(question)}`,
    )) as { source: string; result: AnalysisResult }
    const result = analysisResultSchema.safeParse(value.result)
    if (value.source !== 'local_engine' || !result.success) throw new Error('Análisis inválido')
    return result.data
  }
}
