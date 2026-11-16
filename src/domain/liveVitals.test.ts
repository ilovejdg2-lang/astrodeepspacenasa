import { describe, expect, it } from 'vitest'
import { reduce } from './reduce'
import { createInitialState } from './scenarios'

function advance(scenario: Parameters<typeof createInitialState>[0]) {
  const initial = reduce(createInitialState(scenario), { type: 'setRunning', running: true })
  return { initial, next: reduce(initial, { type: 'tick', realDeltaMs: 60_000 }) }
}

describe('lecturas durante el monitoreo simulado', () => {
  it('actualiza los cuatro signos y conserva el sueño', () => {
    const { initial, next } = advance('baseline')
    const newReadings = next.measurements.slice(initial.measurements.length)
    expect(newReadings).toHaveLength(16)
    expect(new Set(newReadings.filter((m) => m.crewId === 'elena-torres').map((m) => m.kind))).toEqual(
      new Set(['heart_rate', 'spo2', 'temperature', 'respiratory_rate']),
    )
    expect(newReadings.every((m) => m.measuredAt === initial.clock.originAt + 60_000)).toBe(true)
    expect(newReadings.every((m) => m.integrity === 'valid')).toBe(true)
    expect(newReadings.some((m) => m.kind === 'sleep_hours')).toBe(false)
  })

  it('no crea lecturas en los escenarios sin datos ni para Sofía en fatiga', () => {
    const missing = advance('missing-data')
    expect(missing.next.measurements).toHaveLength(missing.initial.measurements.length)
    const fatigue = advance('gradual-fatigue')
    expect(fatigue.next.measurements.slice(fatigue.initial.measurements.length).some((m) => m.crewId === 'sofia-chen')).toBe(false)
  })

  it('mantiene el pulso congelado como dudoso', () => {
    const { initial, next } = advance('frozen-sensor')
    const readings = next.measurements.slice(initial.measurements.length).filter((m) => m.crewId === 'elena-torres')
    expect(readings.find((m) => m.kind === 'heart_rate')?.integrity).toBe('pending')
    expect(readings.some((m) => m.kind === 'spo2' && m.integrity === 'valid')).toBe(true)
  })
})
