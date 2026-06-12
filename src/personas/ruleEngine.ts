import type { CreativeBrief, CreativeHook, HookResult, PersonaId } from '../types'
import type { PersonaEvaluator } from './PersonaEvaluator'

/**
 * Deterministic, keyword-and-pattern persona scorer.
 *
 * Not a model: same input -> same output, zero latency, zero cost. Each persona
 * is a bag of positive/negative signal words plus one structural check. Each
 * hook is scored only through the persona assigned to it.
 */

interface Rule {
  name: string
  blurb: string
  positive: string[]
  negative: string[]
  structural: (text: string) => { delta: number; note?: string }
}

const has = (text: string, word: string) =>
  new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)

const hasNumber = (t: string) => /\b\d[\d.,]*\s*(%|x|k|m|hrs?|hours?|days?|mins?)?\b/i.test(t)
const hasPercent = (t: string) => /\d+\s*%|\b\d+%\s*off\b/i.test(t)
const hasSocialProof = (t: string) =>
  /#1|\bno\.?\s*1\b|\b\d[\d,]*\+?\s*(customers|users|teams|reviews|stars|sleepers|founders)\b|\b\d(\.\d)?\s*stars?\b/i.test(t)

export const RULES: Record<PersonaId, Rule> = {
  skeptic: {
    name: 'The Skeptic',
    blurb: 'CFO lens — rewards cost, ROI and quantifiable proof; penalizes vague hype.',
    positive: ['roi', 'cost', 'save', 'savings', 'reduce', 'efficient', 'proven', 'data', 'measurable', 'guarantee', 'cheaper', 'budget'],
    negative: ['revolutionary', 'magic', 'amazing', 'unbelievable', 'game-changer', 'disrupt'],
    structural: (t) => (hasNumber(t) ? { delta: 18, note: 'cites a concrete number' } : { delta: -8, note: 'no quantifiable proof' }),
  },
  impulse: {
    name: 'The Impulse Buyer',
    blurb: 'Executive lens — rewards speed-to-value and bold, emotional hooks.',
    positive: ['now', 'instantly', 'today', 'fast', 'free', 'new', 'easy', 'unlock', 'boost', 'win', 'love'],
    negative: ['eventually', 'consider', 'evaluate', 'roadmap', 'enterprise', 'compliance'],
    structural: (t) => (/[!?]/.test(t) ? { delta: 10, note: 'has an energetic hook' } : { delta: -4, note: 'flat tone' }),
  },
  critic: {
    name: 'The Feature Critic',
    blurb: 'Product lens — rewards technical specifics and structural clarity.',
    positive: ['integration', 'api', 'workflow', 'automate', 'secure', 'scalable', 'native', 'sync', 'configurable', 'export'],
    negative: ['simple', 'just', 'easy', 'magic'],
    structural: (t) => (t.split(/\s+/).length <= 14 ? { delta: 8, note: 'tight and specific' } : { delta: -6, note: 'wordy / unfocused' }),
  },
  bargain: {
    name: 'The Bargain Hunter',
    blurb: 'Deal-seeker lens — rewards discounts, savings and obvious value; penalizes premium framing.',
    positive: ['discount', 'deal', 'save', 'savings', 'off', 'free', 'cheap', 'cheaper', 'lowest', 'bundle', 'value', 'coupon', 'sale', 'bargain', 'affordable'],
    negative: ['premium', 'luxury', 'exclusive', 'splurge', 'investment'],
    structural: (t) => (hasPercent(t) ? { delta: 16, note: 'names a concrete discount' } : { delta: -6, note: 'no clear price advantage' }),
  },
  loyalist: {
    name: 'The Brand Loyalist',
    blurb: 'Trust lens — rewards reputation, reviews and social proof; penalizes unproven framing.',
    positive: ['trusted', 'proven', 'reviews', 'rated', 'award', 'awarded', 'established', 'reputation', 'loved', 'recommended', 'recommend', 'leading', 'certified', 'bestselling'],
    negative: ['startup', 'untested', 'unknown', 'beta', 'experimental'],
    structural: (t) => (hasSocialProof(t) ? { delta: 14, note: 'shows social proof' } : { delta: -4, note: 'no trust signal' }),
  },
  researcher: {
    name: 'The Researcher',
    blurb: 'Evidence lens — rewards data, comparisons and detailed specs.',
    positive: ['compare', 'comparison', 'data', 'study', 'evidence', 'spec', 'specs', 'detailed', 'source', 'tested', 'results', 'benchmark', 'research', 'accuracy', 'analysis'],
    negative: ['hype', 'amazing', 'magic', 'revolutionary'],
    structural: (t) => (hasNumber(t) ? { delta: 14, note: 'backs claims with numbers' } : { delta: -8, note: 'no evidence offered' }),
  },
  trend: {
    name: 'The Trend Seeker',
    blurb: 'Zeitgeist lens — rewards novelty, FOMO and momentum; penalizes legacy framing.',
    positive: ['new', 'trending', 'viral', 'popular', 'latest', 'now', 'everyone', 'hot', 'fresh', 'must-have', 'breakout', 'buzz'],
    negative: ['legacy', 'traditional', 'old', 'classic', 'boring', 'outdated'],
    structural: (t) => (/(everyone|don'?t miss|going viral|fomo|!)/i.test(t) ? { delta: 12, note: 'creates momentum' } : { delta: -4, note: 'low momentum' }),
  },
}

export const PERSONA_ORDER: PersonaId[] = ['skeptic', 'impulse', 'critic', 'bargain', 'loyalist', 'researcher', 'trend']

export const PERSONA_LABELS: Record<PersonaId, { name: string; blurb: string }> = Object.fromEntries(
  PERSONA_ORDER.map((id) => [id, { name: RULES[id].name, blurb: RULES[id].blurb }]),
) as Record<PersonaId, { name: string; blurb: string }>

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function scoreHook(personaId: PersonaId, text: string): { score: number; rationale: string } {
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

  return { score: clamp(score), rationale }
}

export class RuleEngine implements PersonaEvaluator {
  readonly name = 'rule-engine-v2'

  // brief is accepted for interface parity; the rules ignore it for now.
  async evaluate(_brief: CreativeBrief, hooks: CreativeHook[], personas: PersonaId[]): Promise<HookResult[]> {
    const active = personas.filter((p) => RULES[p])
    const out: HookResult[] = []
    for (const hook of hooks) {
      for (const personaId of active) {
        const { score, rationale } = scoreHook(personaId, hook.text)
        out.push({ hookId: hook.id, personaId, score, rationale })
      }
    }
    return out
  }
}
