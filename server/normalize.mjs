// Pure helpers for shaping model output into our HookEvaluation contract.
// Kept separate from the Express handler so it can be unit-tested.

export const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)))

/**
 * Takes the raw `evaluations` array from the model's tool call and returns
 * clean HookEvaluation objects: scores clamped to 0-100, rationale coerced to
 * string, and `overall` recomputed as the mean (so it can't drift from the
 * per-persona scores).
 */
export function normalizeEvaluations(rawEvaluations) {
  return (rawEvaluations ?? []).map((e) => {
    const scores = (e.scores ?? []).map((s) => ({
      personaId: s.personaId,
      score: clamp(s.score),
      rationale: String(s.rationale ?? ''),
    }))
    const overall = scores.length
      ? clamp(scores.reduce((a, s) => a + s.score, 0) / scores.length)
      : 0
    return { hookId: e.hookId, scores, overall }
  })
}
