import { RuleEngine } from './ruleEngine'
import { LlmEvaluator } from './llmEvaluator'
import type { PersonaEvaluator } from './PersonaEvaluator'

// Set VITE_USE_LLM=true (and run the backend) to use Claude.
// Anything else falls back to the deterministic rule engine — which is what
// the no-backend static deploy uses.
const useLlm = import.meta.env.VITE_USE_LLM === 'true'

export const evaluator: PersonaEvaluator = useLlm ? new LlmEvaluator() : new RuleEngine()

export { PERSONA_LABELS } from './ruleEngine'
export type { PersonaEvaluator } from './PersonaEvaluator'
