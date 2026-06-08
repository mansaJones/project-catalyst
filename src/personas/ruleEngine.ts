import type { CreativeBrief, CreativeHook, HookEvaluation, PersonaId, PersonaScore } from '../types'
import type { PersonaEvaluator } from './PersonaEvaluator'

/**
 * Deterministic, keyword-and-pattern persona scorer.
 *
 * This is intentionally NOT a model. Same input -> same output, zero latency,
 * zero cost. Each persona is a bag of positive/negative signal words plus a
 * couple of structural checks. Tune the word lists freely; the scoring shape
 * stays the same.
 */

interface Rule {
  positive: string[]
  negative: string[]
  /** Structural bonus checks that read the raw hook text. */
  structural: (text: string) => { delta: number; note?: string }
  blurb: string
}

const has = (text: string, word: string) =>
  new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)

const hasNumber = (text: string) => /\b\d[\d.,]*\s*(%|x|k|m|hrs?|hours?|days?|mins?)?\b/i.test(text)

const RULES: Record<PersonaId, Rule> = {
  skeptic: {
    positive: ['roi', 'cost', 'save', 'savings', 'reduce', 'efficient', 'proven', 'data', 'measurable', 'guarantee', 'cheaper', 'budget'],
    negative: ['revolutionary', 'magic', 'amazing', 'unbelievable', 'game-changer', 'disrupt'],
    structural: (t) => (hasNumber(t)
      ? { delta: 18, note: 'cites a concrete number' }
      : { delta: -8, note: 'no quantifiable proof' }),
    blurb: 'CFO lens — rewards cost, ROI and quantifiable proof.',
  },
  impulse: {
    positive: ['now', 'instantly', 'today', 'fast', 'free', 'new', 'easy', 'unlock', 'boost', 'win', 'love'],
    negative: ['eventually', 'consider', 'evaluate', 'roadmap', 'enterprise', 'compliance'],
    structural: (t) => (/[!?]/.test(t)
      ? { delta: 10, note: 'has an energetic hook' }
      : { delta: -4, note: 'flat tone' }),
    blurb: 'Executive lens — rewards speed-to-value and bold, emotional hooks.',
  },
  critic: {
    positive: ['integration', 'api', 'workflow', 'automate', 'secure', 'scalable', 'native', 'sync', 'configurable', 'export'],
    negative: ['simple', 'just', 'easy', 'magic'],
    structural: (t) => (t.split(/\s+/).length <= 14
      ? { delta: 8, note: 'tight and specific' }
      : { delta: -6, note: 'wordy / unfocused' }),
    blurb: 'Product lens — rewards technical specifics and structural clarity.',
  },
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function scoreHook(personaId: PersonaId, text: string): PersonaScore {
  const rule = RULES[personaId]
  let score = 50
  const hits: string[] = []

  for (const w of rule.positive) if (has(text, w)) { score += 7; hits.push(w) }
  for (const w of rule.negative) if (has(text, w)) score -= 9

  const s = rule.structural(text)
  score += s.delta

  const rationale = hits.length
    ? `Picked up on "${hits.slice(0, 3).join('", "')}"${s.note ? `; ${s.note}.` : '.'}`
    : `No strong signals for this lens${s.note ? `; ${s.note}.` : '.'}`

  return { personaId, score: clamp(score), rationale }
}

export class RuleEngine implements PersonaEvaluator {
  readonly name = 'rule-engine-v1'

  // brief is accepted for interface parity; the rules ignore it for now.
  evaluate(_brief: CreativeBrief, hooks: CreativeHook[]): HookEvaluation[] {
    const personas = Object.keys(RULES) as PersonaId[]
    return hooks.map((hook) => {
      const scores = personas.map((p) => scoreHook(p, hook.text))
      const overall = clamp(scores.reduce((a, s) => a + s.score, 0) / scores.length)
      return { hookId: hook.id, scores, overall }
    })
  }
}

export const PERSONA_LABELS: Record<PersonaId, { name: string; blurb: string }> = {
  skeptic: { name: 'The Skeptic', blurb: RULES.skeptic.blurb },
  impulse: { name: 'The Impulse Buyer', blurb: RULES.impulse.blurb },
  critic: { name: 'The Feature Critic', blurb: RULES.critic.blurb },
}
