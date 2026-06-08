import type { CreativeBrief, CreativeHook, HookEvaluation } from '../types'

/**
 * The contract every evaluation backend must satisfy.
 *
 * Today the only implementation is RuleEngine (deterministic keyword rules).
 * To swap in an LLM or a trained classifier later, implement this interface
 * and change the single export in personas/index.ts. The UI never changes.
 */
export interface PersonaEvaluator {
  readonly name: string
  evaluate(brief: CreativeBrief, hooks: CreativeHook[]): HookEvaluation[]
}
