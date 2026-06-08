// Core domain types shared across modules.

export type Channel = 'meta' | 'google' | 'linkedin'

export interface CreativeBrief {
  product: string
  audience: string
}

/** One ad angle the marketer wants evaluated. */
export interface CreativeHook {
  id: string
  text: string
}

export type PersonaId = 'skeptic' | 'impulse' | 'critic'

export interface PersonaScore {
  personaId: PersonaId
  /** 0-100. */
  score: number
  /** One-line, human-readable justification. */
  rationale: string
}

/** Full evaluation of a single hook by every persona. */
export interface HookEvaluation {
  hookId: string
  scores: PersonaScore[]
  /** Mean of the persona scores, 0-100. */
  overall: number
}
