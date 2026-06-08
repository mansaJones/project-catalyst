import { describe, it, expect } from 'vitest'
import { clamp, normalizeEvaluations } from './normalize.mjs'

describe('clamp', () => {
  it('bounds to 0..100 and rounds', () => {
    expect(clamp(-5)).toBe(0)
    expect(clamp(150)).toBe(100)
    expect(clamp(72.6)).toBe(73)
  })
  it('coerces junk to 0', () => {
    expect(clamp('not a number')).toBe(0)
    expect(clamp(undefined)).toBe(0)
  })
})

describe('normalizeEvaluations', () => {
  it('clamps scores and recomputes overall as the mean', () => {
    const out = normalizeEvaluations([
      { hookId: 'a', scores: [
        { personaId: 'skeptic', score: 120, rationale: 'x' },
        { personaId: 'impulse', score: 40, rationale: 'y' },
        { personaId: 'critic', score: 50, rationale: 'z' },
      ] },
    ])
    expect(out[0].scores[0].score).toBe(100)            // clamped
    expect(out[0].overall).toBe(Math.round((100 + 40 + 50) / 3)) // 63
  })

  it('coerces missing rationale to a string and tolerates missing scores', () => {
    const out = normalizeEvaluations([{ hookId: 'a', scores: [{ personaId: 'skeptic', score: 10 }] }])
    expect(out[0].scores[0].rationale).toBe('')
    const empty = normalizeEvaluations([{ hookId: 'b' }])
    expect(empty[0].overall).toBe(0)
    expect(empty[0].scores).toEqual([])
  })

  it('returns [] for nullish input', () => {
    expect(normalizeEvaluations(undefined)).toEqual([])
    expect(normalizeEvaluations(null)).toEqual([])
  })
})
