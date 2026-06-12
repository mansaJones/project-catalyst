import { describe, it, expect } from 'vitest'
import { buildAdCopy, deriveCta, deriveHeadline, deriveDomain, deriveBrand } from './adFormats'
import type { CreativeBrief } from './types'

const brief: CreativeBrief = { product: 'Ledgerly — automated reconciliation', audience: 'finance managers' }

describe('ad copy derivation', () => {
  it('derives a brand and domain from the product', () => {
    expect(deriveBrand(brief)).toBe('Ledgerly')
    expect(deriveDomain('Ledgerly')).toBe('ledgerly.com')
    expect(deriveDomain('Capital Pulse')).toBe('capitalpulse.com')
  })

  it('keeps the headline within ~30 chars', () => {
    const h = deriveHeadline('Close the books 60% faster and cut audit costs across 400 teams')
    expect(h.length).toBeLessThanOrEqual(31) // 30 + ellipsis
    expect(h).not.toMatch(/\s$/)
  })

  it('does not truncate a short hook', () => {
    expect(deriveHeadline('Save 30% today')).toBe('Save 30% today')
  })

  it('picks a CTA from hook intent', () => {
    expect(deriveCta('Start free today!')).toBe('Get started')
    expect(deriveCta('Summer sale: 30% off')).toBe('Shop now')
    expect(deriveCta('Book a demo with our team')).toBe('Book a demo')
    expect(deriveCta('Approval in 24 hours')).toBe('Apply now')
    expect(deriveCta('A reliable solution')).toBe('Learn more')
  })

  it('builds a full ad copy object', () => {
    const ad = buildAdCopy('Start free today!', brief)
    expect(ad.brand).toBe('Ledgerly')
    expect(ad.domain).toBe('ledgerly.com')
    expect(ad.cta).toBe('Get started')
    expect(ad.primaryText).toBe('Start free today!')
    expect(ad.description).toContain('finance managers')
  })

  it('falls back gracefully on empty input', () => {
    const ad = buildAdCopy('', { product: '', audience: '' })
    expect(ad.brand).toBe('Your Brand')
    expect(ad.domain).toBe('yourbrand.com')
    expect(ad.headline.length).toBeGreaterThan(0)
  })
})
