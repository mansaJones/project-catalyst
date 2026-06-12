import { describe, it, expect } from 'vitest'
import { clamp, normalizeResults } from './normalize.mjs'

describe('clamp', () => {
  it('bounds to 0..100 and rounds', () => {
    expect(clamp(-5)).toBe(0)
    expect(clamp(150)).toBe(100)
    expect(clamp(72.6)).toBe(73)
  })
  it('coerces junk to 0', () => {
    expect(clamp('nope')).toBe(0)
    expect(clamp(undefined)).toBe(0)
  })
})

describe('normalizeResults', () => {
  it('clamps score, coerces rationale, preserves hookId + personaId', () => {
    const out = normalizeResults([
      { hookId: 'a', personaId: 'skeptic', score: 120, rationale: 'x' },
      { hookId: 'b', personaId: 'trend', score: 40 },
    ])
    expect(out[0]).toEqual({ hookId: 'a', personaId: 'skeptic', score: 100, rationale: 'x' })
    expect(out[1].rationale).toBe('')
    expect(out[1].score).toBe(40)
  })

  it('returns [] for nullish input', () => {
    expect(normalizeResults(undefined)).toEqual([])
    expect(normalizeResults(null)).toEqual([])
  })
})
