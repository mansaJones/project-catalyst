import { describe, it, expect } from 'vitest'
import { RuleEngine } from './ruleEngine'
import type { CreativeBrief, CreativeHook } from '../types'

const brief: CreativeBrief = { product: 'AI scheduler', audience: 'ops leads' }
const engine = new RuleEngine()
const hook = (id: string, text: string): CreativeHook => ({ id, text })

describe('RuleEngine', () => {
  it('returns one evaluation per hook, preserving ids and order', async () => {
    const hooks = [hook('a', 'Save 30% on costs'), hook('b', 'Amazing magic tool')]
    const res = await engine.evaluate(brief, hooks)
    expect(res.map((r) => r.hookId)).toEqual(['a', 'b'])
    expect(res).toHaveLength(2)
  })

  it('is deterministic — identical input yields identical output', async () => {
    const hooks = [hook('a', 'Cut spend 40% with proven ROI')]
    const first = await engine.evaluate(brief, hooks)
    const second = await engine.evaluate(brief, hooks)
    expect(first).toEqual(second)
  })

  it('keeps every score within 0..100 and overall as their mean', async () => {
    const hooks = [hook('a', 'Integrate, automate, and sync your workflow now — save 25%!')]
    const [res] = await engine.evaluate(brief, hooks)
    for (const s of res.scores) {
      expect(s.score).toBeGreaterThanOrEqual(0)
      expect(s.score).toBeLessThanOrEqual(100)
    }
    const mean = Math.round(res.scores.reduce((a, s) => a + s.score, 0) / res.scores.length)
    expect(res.overall).toBe(mean)
  })

  it('rewards the skeptic for cost/ROI + numbers over vague hype', async () => {
    const [proof] = await engine.evaluate(brief, [hook('a', 'Cut costs 30% with proven ROI')])
    const [hype] = await engine.evaluate(brief, [hook('b', 'A revolutionary, amazing game-changer')])
    const sScore = (r: typeof proof) => r.scores.find((s) => s.personaId === 'skeptic')!.score
    expect(sScore(proof)).toBeGreaterThan(sScore(hype))
  })

  it('rewards the feature critic for technical specifics', async () => {
    const [tech] = await engine.evaluate(brief, [hook('a', 'Native API integration with configurable export')])
    const cScore = tech.scores.find((s) => s.personaId === 'critic')!.score
    expect(cScore).toBeGreaterThan(50)
  })

  it('produces three persona scores per hook', async () => {
    const [res] = await engine.evaluate(brief, [hook('a', 'anything')])
    expect(res.scores.map((s) => s.personaId).sort()).toEqual(['critic', 'impulse', 'skeptic'])
  })
})
