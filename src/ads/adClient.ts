import type { CreativeBrief } from '../types'
import type { AdFormatId } from '../adFormats'

/** Claude-backed ad features only work when the local backend is enabled. */
export const LLM_ENABLED = import.meta.env.VITE_USE_LLM === 'true'

export interface CopyFields {
  headline: string
  description: string
  primaryText: string
  cta: string
}

export async function expandCopy(hook: string, brief: CreativeBrief, format: AdFormatId): Promise<CopyFields> {
  const res = await fetch('/api/ad-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hook, brief, format }),
  })
  if (!res.ok) throw new Error(`Copy generation failed (${res.status}).`)
  const data = (await res.json()) as { copy?: CopyFields }
  if (!data?.copy) throw new Error('Malformed copy response.')
  return data.copy
}

export async function designAd(hook: string, brief: CreativeBrief, format: AdFormatId): Promise<string> {
  const res = await fetch('/api/ad-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hook, brief, format }),
  })
  if (!res.ok) throw new Error(`Design generation failed (${res.status}).`)
  const data = (await res.json()) as { html?: string }
  if (!data?.html) throw new Error('Malformed design response.')
  return data.html
}
