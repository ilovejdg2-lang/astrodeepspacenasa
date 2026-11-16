import { expect, it } from 'vitest'
import { readStored, writeStored } from './locale'

it('opens in English until the person explicitly chooses Spanish', () => {
  const memory = new Map<string, string>()
  const previous = globalThis.localStorage
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value) },
    },
  })
  try {
    memory.clear()
    expect(readStored()).toBe('en')
    writeStored('es')
    expect(readStored()).toBe('es')
    memory.clear()
    expect(readStored()).toBe('en')
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous })
  }
})
