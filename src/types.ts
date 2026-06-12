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

/** One ad hook. Every active persona scores it. */
export interface CreativeHook {
  id: string
  text: string
}

/** Score of one hook through one persona. */
export interface HookResult {
  hookId: string
  personaId: PersonaId
  /** 0-100. */
  score: number
  /** One-line, human-readable justification. */
  rationale: string
}
