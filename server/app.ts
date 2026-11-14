import { Hono } from 'hono'
import { analysisContextSchema, analysisResultSchema, checkAnalysisRefs } from '../shared/aiSchema'
import { spaceContextSchema, spaceProposalSchema } from '../shared/spaceSchema'
import { buildModelMessages, buildSpaceMessages } from './prompt'
import { extractJson, ProviderError, resolveProvider, type ModelProvider } from './provider'

export interface AppOptions {
  provider?: ModelProvider | null
  missing?: string[]
  model?: string
  providerName?: string
}

export function createApp(options?: AppOptions) {
  const resolved =
    options && 'provider' in options
      ? {
          provider: options.provider ?? null,
          missing: options.missing ?? [],
          model: options.model ?? 'test-model',
          providerName: options.providerName ?? 'test',
        }
      : resolveProvider()

  const app = new Hono()

  app.get('/api/ai/health', (c) =>
    c.json({
      configured: Boolean(resolved.provider),
      provider: resolved.providerName,
      model: resolved.model,
      missing: resolved.missing,
    }),
  )

  app.post('/api/ai/analyze', (c) => handle(c.req.raw.signal, c, false))
  app.post('/api/ai/chat', (c) => handle(c.req.raw.signal, c, true))
  app.post('/api/ai/space', (c) => handleSpace(c.req.raw.signal, c))

  async function handle(signal: AbortSignal, c: { req: { json: () => Promise<unknown> }; json: (body: unknown, status?: number) => Response }, requireQuestion: boolean) {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ code: 'invalid_request', message: 'El cuerpo no es JSON.' }, 400)
    }
    const parsed = analysisContextSchema.safeParse(body)
    if (!parsed.success) return c.json({ code: 'invalid_request', message: 'El contexto no tiene la forma esperada.' }, 400)
    if (requireQuestion && !parsed.data.question?.trim()) {
      return c.json({ code: 'invalid_request', message: 'Falta la pregunta.' }, 400)
    }
    if (JSON.stringify(parsed.data).length > 32_000) {
      return c.json({ code: 'invalid_request', message: 'El contexto supera el límite.' }, 413)
    }
    if (!resolved.provider) {
      return c.json(
        {
          code: 'not_configured',
          message: `El servicio de IA no está configurado. Falta: ${resolved.missing.join(', ') || 'AI_API_KEY'}.`,
          missing: resolved.missing,
        },
        503,
      )
    }
    try {
      const text = await resolved.provider.complete({ ...buildModelMessages(parsed.data), signal })
      const result = analysisResultSchema.safeParse(extractJson(text))
      if (!result.success) return c.json({ code: 'invalid_response', message: 'La respuesta del modelo no cumple el esquema.' }, 422)
      const refs = checkAnalysisRefs(result.data, parsed.data)
      if (!refs.ok) {
        return c.json(
          { code: 'invalid_response', message: 'La respuesta cita identificadores que no están en el contexto.', unknown: refs.unknown },
          422,
        )
      }
      return c.json({ source: 'model', model: resolved.model, result: result.data })
    } catch (error) {
      if (error instanceof ProviderError) {
        const status = error.code === 'rate_limit' ? 429 : error.code === 'invalid_response' ? 422 : error.code === 'network' ? 502 : 504
        return c.json({ code: error.code, message: error.message }, status)
      }
      if (error instanceof SyntaxError) return c.json({ code: 'invalid_response', message: 'La respuesta del modelo no es JSON.' }, 422)
      return c.json({ code: 'network', message: 'Falló la llamada al proveedor.' }, 502)
    }
  }

  async function handleSpace(signal: AbortSignal, c: { req: { json: () => Promise<unknown> }; json: (body: unknown, status?: number) => Response }) {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ code: 'invalid_request', message: 'El cuerpo no es JSON.' }, 400)
    }
    const parsed = spaceContextSchema.safeParse(body)
    if (!parsed.success) return c.json({ code: 'invalid_request', message: 'El contexto no tiene la forma esperada.' }, 400)
    if (JSON.stringify(parsed.data).length > 32_000) {
      return c.json({ code: 'invalid_request', message: 'El contexto supera el límite.' }, 413)
    }
    if (!resolved.provider) {
      return c.json(
        {
          code: 'not_configured',
          message: `El servicio de IA no está configurado. Falta: ${resolved.missing.join(', ') || 'AI_API_KEY'}.`,
          missing: resolved.missing,
        },
        503,
      )
    }
    try {
      const text = await resolved.provider.complete({ ...buildSpaceMessages(parsed.data), signal })
      const result = spaceProposalSchema.safeParse(extractJson(text))
      if (!result.success) return c.json({ code: 'invalid_response', message: 'La respuesta del modelo no cumple el esquema.' }, 422)
      return c.json({ source: 'model', model: resolved.model, result: result.data })
    } catch (error) {
      if (error instanceof ProviderError) {
        const status = error.code === 'rate_limit' ? 429 : error.code === 'invalid_response' ? 422 : error.code === 'network' ? 502 : 504
        return c.json({ code: error.code, message: error.message }, status)
      }
      if (error instanceof SyntaxError) return c.json({ code: 'invalid_response', message: 'La respuesta del modelo no es JSON.' }, 422)
      return c.json({ code: 'network', message: 'Falló la llamada al proveedor.' }, 502)
    }
  }

  return app
}
