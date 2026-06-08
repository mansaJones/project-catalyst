import { describe, it, expect } from 'vitest'
import { simulateBudget } from './simulate'
import type { HookEvaluation } from '../types'

const evalWith = (overall: number): HookEvaluation => ({
  hookId: 'h', scores: [], overall,
})

describe('simulateBudget', () => {
  it('returns exactly 7 day points labelled Day 1..7', () => {
    const data = simulateBudget([evalWith(50)])
    expect(data).toHaveLength(7)
    expect(data.map((d) => d.day)).toEqual(
      ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    )
  })

  it('keeps daily spend across channels at ~1000 (rounding aside)', () => {
    const data = simulateBudget([evalWith(80)])
    for (const d of data) {
      const total = d.meta + d.google + d.linkedin
      expect(Math.abs(total - 1000)).toBeLessThanOrEqual(2)
    }
  })

  it('drifts budget from the weakest channel to the strongest over the week', () => {
    // High score biases toward Meta (consumer) and away from LinkedIn (B2B).
    const data = simulateBudget([evalWith(95)])
    expect(data[6].meta).toBeGreaterThan(data[0].meta)
    expect(data[6].linkedin).toBeLessThan(data[0].linkedin)
  })

  it('handles an empty evaluation list without throwing', () => {
    const data = simulateBudget([])
    expect(data).toHaveLength(7)
    expect(data[0].meta + data[0].google + data[0].linkedin).toBeGreaterThan(0)
  })
})
