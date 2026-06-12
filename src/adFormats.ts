import type { CreativeBrief } from './types'

export type AdFormatId = 'google' | 'meta' | 'banner'

export interface AdFormat {
  id: AdFormatId
  label: string
  note: string
}

export const AD_FORMATS: AdFormat[] = [
  { id: 'google', label: 'Google Search', note: 'Responsive text ad' },
  { id: 'meta', label: 'Instagram / Meta', note: 'Feed post' },
  { id: 'banner', label: 'Display 300×250', note: 'Medium rectangle' },
]

export interface AdCopy {
  brand: string
  domain: string
  headline: string // tightened, <= ~30 chars
  primaryText: string // the full hook
  description: string // supporting line, <= ~90 chars
  cta: string
}

const clampWords = (text: string, max: number): string => {
  const clean = text.trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 12 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.!?-]+$/, '') + '…'
}

export const deriveBrand = (brief: CreativeBrief): string => {
  const first = (brief.product || '').split(/[—\-:|]/)[0].trim()
  return first || 'Your Brand'
}

export const deriveDomain = (brand: string): string => {
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return (slug || 'yourbrand') + '.com'
}

export const deriveCta = (hook: string): string => {
  const h = hook.toLowerCase()
  if (/\b(free|try|start|sign\s?up|get started|unlock)\b/.test(h)) return 'Get started'
  if (/\b(shop|buy|sale|deal|order|% ?off|save|bundle)\b/.test(h) || /%/.test(h)) return 'Shop now'
  if (/\b(book|demo|schedule|call|talk to)\b/.test(h)) return 'Book a demo'
  if (/\b(download|install|app)\b/.test(h)) return 'Download'
  if (/\b(apply|approval|funding|loan)\b/.test(h)) return 'Apply now'
  return 'Learn more'
}

export const deriveHeadline = (hook: string): string =>
  clampWords(hook.replace(/[.!?]+$/, ''), 30)

/** Deterministic ad copy from a single hook + the brief. No model required. */
export const buildAdCopy = (hook: string, brief: CreativeBrief): AdCopy => {
  const brand = deriveBrand(brief)
  const text = hook.trim() || 'Your ad hook goes here'
  return {
    brand,
    domain: deriveDomain(brand),
    headline: deriveHeadline(text),
    primaryText: text,
    description: brief.audience ? `Built for ${clampWords(brief.audience, 70)}.` : clampWords(text, 90),
    cta: deriveCta(text),
  }
}
