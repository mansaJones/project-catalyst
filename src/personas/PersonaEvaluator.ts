import type { CreativeBrief, CreativeHook, HookEvaluation } from '../types'

/**
 * The contract every evaluation backend must satisfy.
 *
 * evaluate() is async so a network-backed implementation (LlmEvaluator) and a
 * pure local one (RuleEngine) share the same shape. To swap backends, implement
 * this interface and change the single export in personas/index.ts. The UI
 * awaits the result either way and never changes.
 */
export interface PersonaEvaluator {
  readonly name: string
  evaluate(brief: CreativeBrief, hooks: CreativeHook[]): Promise<HookEvaluation[]>
}
