// Pure helpers for shaping model output into our HookResult contract.
// Kept separate from the Express handler so it can be unit-tested.

export const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))

/**
 * Takes the raw `results` array from the model's tool call and returns clean
 * HookResult objects: one per hook, score clamped 0-100, rationale coerced to a
 * string, persona preserved.
 */
export function normalizeResults(rawResults) {
  return (Array.isArray(rawResults) ? rawResults : []).map((r) => ({
    hookId: r.hookId,
    personaId: r.personaId,
    score: clamp(r.score),
    rationale: String(r.rationale ?? ''),
  }))
}
