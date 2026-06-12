import { describe, it, expect } from 'vitest'
import { RuleEngine, PERSONA_ORDER, PERSONA_LABELS } from './ruleEngine'
import type { CreativeBrief, CreativeHook, PersonaId } from '../types'

const brief: CreativeBrief = { product: 'AI scheduler', audience: 'ops leads' }
const engine = new RuleEngine()
const hook = (id: string, text: string): CreativeHook => ({ id, text })
const scoreOf = async (text: string, persona: PersonaId) =>
  (await engine.evaluate(brief, [hook('h', text)], [persona]))[0].score

describe('RuleEngine', () => {
  it('exposes all 7 personas', () => {
    expect(PERSONA_ORDER).toHaveLength(7)
    expect(Object.keys(PERSONA_LABELS).sort()).toEqual(
      ['bargain', 'critic', 'impulse', 'loyalist', 'researcher', 'skeptic', 'trend'],
    )
  })

  it('scores every hook through every active persona (hook × persona results)', async () => {
    const hooks = [hook('a', 'Save 30% now'), hook('b', 'Trending today')]
    const res = await engine.evaluate(brief, hooks, ['skeptic', 'impulse', 'trend'])
    expect(res).toHaveLength(6) // 2 hooks × 3 personas
    expect(res.filter((r) => r.hookId === 'a').map((r) => r.personaId).sort())
      .toEqual(['impulse', 'skeptic', 'trend'])
  })

  it('is deterministic', async () => {
    const hooks = [hook('a', 'Cut spend 40% with proven ROI')]
    const p: PersonaId[] = ['skeptic', 'researcher']
    expect(await engine.evaluate(brief, hooks, p)).toEqual(await engine.evaluate(brief, hooks, p))
  })

  it('keeps every score within 0..100', async () => {
    const res = await engine.evaluate(brief, [hook('a', 'Save 50% off free deal bargain value now!')], PERSONA_ORDER)
    for (const r of res) {
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
    }
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

  it('trend rewards novelty/FOMO over legacy framing', async () => {
    expect(await scoreOf('The viral tool everyone is switching to!', 'trend'))
      .toBeGreaterThan(await scoreOf('A traditional, classic, legacy solution', 'trend'))
  })

  it('ignores unknown personas', async () => {
    const res = await engine.evaluate(brief, [hook('a', 'x')], ['nope' as PersonaId])
    expect(res).toHaveLength(0)
  })
})
