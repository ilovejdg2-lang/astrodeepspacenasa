import { describe, expect, it } from 'vitest'
import { answerPublicLocal } from './quironPublic'

describe('answerPublicLocal', () => {
  it('explains HELIOS without private dashboard claims', () => {
    const answer = answerPublicLocal('¿Qué es HELIOS?', 'es')
    expect(answer.demo).toBe(true)
    expect(answer.text.toLowerCase()).toContain('helios')
    expect(answer.text.toLowerCase()).not.toContain('elena torres')
  })

  it('refuses private records on the public site', () => {
    const answer = answerPublicLocal('Ayudame a entender mis registros.', 'es')
    expect(answer.text.toLowerCase()).toMatch(/no puedo|sitio público|public site|no puedo ver/)
  })

  it('answers feature questions in English', () => {
    const answer = answerPublicLocal('What can I do in HELIOS?', 'en')
    expect(answer.channel ?? 'demo').toBeTruthy()
    expect(answer.text).toMatch(/mission|dashboard|prototype/i)
  })
})
