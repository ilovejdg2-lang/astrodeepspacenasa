import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpaceContextInput } from '../../shared/spaceSchema'
import { askSpaceModel } from './client'

const context: SpaceContextInput = {
  crewId: 'elena-torres',
  crewName: 'Elena Torres',
  simulatedAt: 0,
  freshness: 'linea_base',
  datosPersona: { measurements: [], symptoms: [] },
  textoPersona: 'Me siento mal ahora',
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cliente de Mi espacio', () => {
  it('ignora un JSON de solicitud que no cumple el esquema', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ model: 'demo', result: { respuesta: 'lista', nivel: 'medico' } })))
    const result = await askSpaceModel(context, new AbortController().signal)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('invalid_response')
  })
})
