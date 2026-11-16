import { afterEach, describe, expect, it, vi } from 'vitest'
import { systemText } from './systemText'
import { historyRows } from './domain/exportData'
import { createInitialState } from './domain/scenarios'
import { platformApi } from './platform/api'

afterEach(() => vi.unstubAllGlobals())

describe('system display localization', () => {
  it('translates whole phrases before overlapping fragments', () => {
    expect(systemText('Oxímetro disponible y verificado', 'en')).toBe('Oximeter available and verified')
    expect(systemText('HRP Evidence (contexto)', 'en')).toBe('HRP Evidence (context)')
    expect(systemText('Kit de evaluación', 'es')).toBe('Kit de evaluación')
    expect(systemText('Sofía Chen', 'en')).toBe('Sofía Chen')
  })
  it('keeps unknown notes and identifiers intact', () => {
    expect(systemText('Mi nota personal: prueba 123', 'en')).toBe('Mi nota personal: prueba 123')
    expect(systemText('My personal note: prueba 123', 'es')).toBe('My personal note: prueba 123')
    expect(systemText('mission-helios-demo', 'en')).toBe('mission-helios-demo')
  })
  it('treats the English catalog as the source and Spanish as the translation', () => {
    expect(systemText('Mission not found', 'en')).toBe('Mission not found')
    expect(systemText('Mission not found', 'es')).toBe('Misión no encontrada')
    expect(systemText('Oximeter available and verified', 'es')).toBe('Oxímetro disponible y verificado')
  })
  it('recomputes history language without changing the snapshot', () => {
    const state = createInitialState('gradual-fatigue')
    const before = JSON.stringify(state)
    const english = historyRows(state, 'en')
    expect(english.find((row) => row.type === 'measurement')?.detail).toContain('Measured')
    expect(english.find((row) => row.type === 'alert')?.detail).toMatch(/Open\./)
    expect(historyRows(state, 'es').find((row) => row.type === 'measurement')?.detail).toContain('Medida')
    expect(JSON.stringify(state)).toBe(before)
  })
  it('requests the selected language and localizes backend errors', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null })
    vi.stubGlobal('document', { documentElement: { lang: 'en' } })
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Misión no encontrada' }), { status: 404 }))
    vi.stubGlobal('fetch', request)
    await expect(platformApi.mission('missing')).rejects.toThrow('Mission not found')
    expect(new Headers(request.mock.calls[0]?.[1].headers).get('Accept-Language')).toBe('en')
  })
})
