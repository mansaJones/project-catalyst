// Core domain types shared across modules.

export type PersonaId =
  | 'skeptic'
  | 'impulse'
  | 'critic'
  | 'bargain'
  | 'loyalist'
  | 'researcher'
  | 'trend'

export interface CreativeBrief {
  product: string
  audience: string
}

/** One ad hook, with the single persona assigned to evaluate it. */
export interface CreativeHook {
  id: string
  text: string
  personaId: PersonaId
}

/** Result of scoring one hook through its assigned persona. */
export interface HookResult {
  hookId: string
  personaId: PersonaId
  /** 0-100. */
  score: number
  /** One-line, human-readable justification. */
  rationale: string
}
