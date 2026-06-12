import type { CreativeBrief, CreativeHook, HookResult } from '../types'

/**
 * The contract every evaluation backend must satisfy.
 *
 * Each hook carries the single persona assigned to it; evaluate() scores every
 * hook through its own persona and returns one HookResult per hook. Async so a
 * network backend (LlmEvaluator) and a local one (RuleEngine) share one shape.
 * Swap backends by changing the single export in personas/index.ts.
 */
export interface PersonaEvaluator {
  readonly name: string
  evaluate(brief: CreativeBrief, hooks: CreativeHook[]): Promise<HookResult[]>
}
