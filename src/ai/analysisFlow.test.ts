import { describe, expect, it } from 'vitest'
import { buildAnalysisContext } from './context'
import { analysisIsStale, episodeFingerprint } from '../domain/analysis'
import { createInitialState } from '../domain/scenarios'

describe('on-demand AI analysis data', () => {
  it('marks a result stale when signal quality or symptom notes change', () => {
    const state = createInitialState('gradual-fatigue')
    const episode = state.episodes[0]!
    const fingerprint = episodeFingerprint(state, episode.id)
    const qualityChanged = structuredClone(state)
    const measurement = qualityChanged.measurements.find((item) => item.crewId === episode.crewId)!
    measurement.signalQuality = measurement.signalQuality === 0 ? 50 : 0
    expect(analysisIsStale(qualityChanged, fingerprint, episode.id)).toBe(true)
    const noteChanged = structuredClone(state)
    noteChanged.symptoms.find((item) => item.episodeId === episode.id)!.note = 'Symptoms changed since the last assessment.'
    expect(analysisIsStale(noteChanged, fingerprint, episode.id)).toBe(true)
    expect(analysisIsStale(state, fingerprint, episode.id)).toBe(false)
  })

  it('sends the newest reports for the selected case without mutating stored data', () => {
    const state = createInitialState('gradual-fatigue')
    const episode = state.episodes[0]!
    const seed = state.symptoms.find((item) => item.episodeId === episode.id)!
    state.symptoms = Array.from({ length: 12 }, (_, index) => ({ ...seed, id: `report-${index}`, reportedAt: seed.reportedAt + index }))
    const before = JSON.stringify(state)
    const context = buildAnalysisContext(state, episode.id, undefined, 'en')!
    expect(context.symptoms[0]!.id).toBe('report-11')
    expect(context.symptoms).toHaveLength(10)
    expect(context.measurements.every((item) => state.measurements.find((stored) => stored.id === item.id)?.crewId === episode.crewId)).toBe(true)
    expect(context.baseline.heartRateLpm).toContain('bpm')
    expect(JSON.stringify(state)).toBe(before)
  })
})
