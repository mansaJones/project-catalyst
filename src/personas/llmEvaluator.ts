import type { CreativeBrief, CreativeHook, HookEvaluation } from '../types'
import type { PersonaEvaluator } from './PersonaEvaluator'

/**
 * Network-backed evaluator. Posts the brief + hooks to our own /api/evaluate
 * endpoint, which holds the Anthropic API key and never exposes it to the
 * browser. The server returns HookEvaluation[] already shaped to our types.
 */
export class LlmEvaluator implements PersonaEvaluator {
  readonly name = 'claude-evaluator'
  private readonly endpoint: string

  constructor(endpoint = '/api/evaluate') {
    this.endpoint = endpoint
  }

  async evaluate(brief: CreativeBrief, hooks: CreativeHook[]): Promise<HookEvaluation[]> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, hooks }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Evaluation failed (${res.status}). ${detail}`.trim())
    }

    const data = (await res.json()) as { evaluations: HookEvaluation[] }
    if (!data?.evaluations) throw new Error('Malformed response from evaluation server.')
    return data.evaluations
  }
}
