import type { CreativeBrief, CreativeHook, HookResult } from '../types'
import type { PersonaEvaluator } from './PersonaEvaluator'

/**
 * Network-backed evaluator. Posts the brief + hooks (each carrying its assigned
 * persona) to our own /api/evaluate endpoint, which holds the Anthropic key and
 * never exposes it to the browser. Returns one HookResult per hook.
 */
export class LlmEvaluator implements PersonaEvaluator {
  readonly name = 'claude-evaluator'
  private readonly endpoint: string

  constructor(endpoint = '/api/evaluate') {
    this.endpoint = endpoint
  }

  async evaluate(brief: CreativeBrief, hooks: CreativeHook[]): Promise<HookResult[]> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, hooks }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Evaluation failed (${res.status}). ${detail}`.trim())
    }

    const data = (await res.json()) as { results: HookResult[] }
    if (!data?.results) throw new Error('Malformed response from evaluation server.')
    return data.results
  }
}
