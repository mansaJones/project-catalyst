import type { CreativeBrief, CreativeHook, HookResult, PersonaId } from '../types'

/**
 * The contract every evaluation backend must satisfy.
 *
 * Every hook is scored through every active persona; evaluate() returns one
 * HookResult per hook×persona pair. Async so a network backend (LlmEvaluator)
 * and a local one (RuleEngine) share one shape. Swap backends by changing the
 * single export in personas/index.ts.
 */
export interface PersonaEvaluator {
  readonly name: string
  evaluate(brief: CreativeBrief, hooks: CreativeHook[], personas: PersonaId[]): Promise<HookResult[]>
}
