import { RuleEngine } from './ruleEngine'
import type { PersonaEvaluator } from './PersonaEvaluator'

// Swap this single line to change backends (e.g. new LlmEvaluator()).
export const evaluator: PersonaEvaluator = new RuleEngine()

export { PERSONA_LABELS } from './ruleEngine'
export type { PersonaEvaluator } from './PersonaEvaluator'
