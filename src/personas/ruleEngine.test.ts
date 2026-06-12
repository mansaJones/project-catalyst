import { describe, it, expect } from 'vitest'
import { RuleEngine, PERSONA_ORDER, PERSONA_LABELS } from './ruleEngine'
import type { CreativeBrief, CreativeHook, PersonaId } from '../types'

const brief: CreativeBrief = { product: 'AI scheduler', audience: 'ops leads' }
const engine = new RuleEngine()
const hook = (id: string, text: string, personaId: PersonaId): CreativeHook => ({ id, text, personaId })
const scoreOf = async (text: string, personaId: PersonaId) =>
  (await engine.evaluate(brief, [hook('h', text, personaId)]))[0].score

describe('RuleEngine', () => {
  it('exposes all 7 personas', () => {
    expect(PERSONA_ORDER).toHaveLength(7)
    expect(Object.keys(PERSONA_LABELS).sort()).toEqual(
      ['bargain', 'critic', 'impulse', 'loyalist', 'researcher', 'skeptic', 'trend'],
    )
  })

  it('returns one result per hook, preserving id, order and assigned persona', async () => {
    const hooks = [hook('a', 'Save 30% on costs', 'skeptic'), hook('b', 'Trending now!', 'trend')]
    const res = await engine.evaluate(brief, hooks)
    expect(res.map((r) => r.hookId)).toEqual(['a', 'b'])
    expect(res.map((r) => r.personaId)).toEqual(['skeptic', 'trend'])
  })

  it('is deterministic', async () => {
    const hooks = [hook('a', 'Cut spend 40% with proven ROI', 'skeptic')]
    expect(await engine.evaluate(brief, hooks)).toEqual(await engine.evaluate(brief, hooks))
  })

  it('keeps scores within 0..100', async () => {
    const res = await engine.evaluate(brief, [hook('a', 'Save save save 50% off free deal bargain value', 'bargain')])
    expect(res[0].score).toBeGreaterThanOrEqual(0)
    expect(res[0].score).toBeLessThanOrEqual(100)
  })

  it('skeptic rewards cost/ROI + numbers over vague hype', async () => {
    expect(await scoreOf('Cut costs 30% with proven ROI', 'skeptic'))
      .toBeGreaterThan(await scoreOf('A revolutionary, amazing game-changer', 'skeptic'))
  })

  it('bargain rewards a concrete discount over premium framing', async () => {
    expect(await scoreOf('Summer sale: 30% off everything', 'bargain'))
      .toBeGreaterThan(await scoreOf('A premium, exclusive luxury experience', 'bargain'))
  })

  it('loyalist rewards social proof', async () => {
    expect(await scoreOf('Rated 4.8 stars by 12,000+ customers', 'loyalist')).toBeGreaterThan(50)
  })

  it('researcher rewards evidence and numbers', async () => {
    expect(await scoreOf('Independent study: 99.7% accuracy across 1.2M tests', 'researcher')).toBeGreaterThan(50)
  })

  it('trend rewards novelty/FOMO over legacy framing', async () => {
    expect(await scoreOf('The viral tool everyone is switching to!', 'trend'))
      .toBeGreaterThan(await scoreOf('A traditional, classic, legacy solution', 'trend'))
  })

  it('skips hooks whose persona is unknown', async () => {
    const res = await engine.evaluate(brief, [hook('a', 'x', 'nope' as PersonaId)])
    expect(res).toHaveLength(0)
  })
})
