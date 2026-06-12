import type { CreativeBrief, PersonaId } from './types'

export interface SampleHook {
  text: string
  personaId: PersonaId
}

export interface SampleAd {
  id: string
  label: string
  /** Optional image shown when loaded; place a file at public/samples/<id>.jpg */
  image: string
  /** Ready-to-paste prompt for generating the ad image in any tool. */
  imagePrompt: string
  brief: CreativeBrief
  activePersonas: PersonaId[]
  hooks: SampleHook[]
}

export const SAMPLE_ADS: SampleAd[] = [
  {
    id: 'ledgerly',
    label: 'Ledgerly · Expense automation (B2B SaaS)',
    image: '/samples/ledgerly.jpg',
    imagePrompt:
      'Clean, modern B2B SaaS ad image for an expense-automation tool called Ledgerly. Minimal flat illustration of a finance dashboard with reconciled receipts flowing into a tidy ledger, burnt-orange (#CF4500) accent on near-black and white, confident and corporate, lots of negative space, no text.',
    brief: {
      product: 'Ledgerly — automated expense reconciliation',
      audience: 'Finance managers at 50–500 person companies',
    },
    activePersonas: ['skeptic', 'critic', 'researcher'],
    hooks: [
      { text: 'Close the books 60% faster and cut audit costs — proven across 400 finance teams.', personaId: 'skeptic' },
      { text: 'Native NetSuite and QuickBooks sync, SOC 2 compliant, configurable approval workflows.', personaId: 'critic' },
      { text: 'Independent benchmark: 99.7% reconciliation accuracy across 1.2M transactions.', personaId: 'researcher' },
    ],
  },
  {
    id: 'drift',
    label: 'Drift · Cooling blanket (DTC consumer)',
    image: '/samples/drift.jpg',
    imagePrompt:
      'Warm, calming DTC lifestyle ad image for Drift, a weighted cooling blanket. A serene bedroom at dusk, soft cool-toned light, a cozy textured blanket draped on a bed, aspirational and restful, subtle burnt-orange accent, premium consumer feel, no text.',
    brief: {
      product: 'Drift — weighted cooling blanket',
      audience: 'Stressed urban professionals aged 28–45',
    },
    activePersonas: ['impulse', 'bargain', 'loyalist'],
    hooks: [
      { text: 'Fall asleep in minutes tonight. Free shipping, free returns!', personaId: 'impulse' },
      { text: 'Summer sale: 30% off + a free bamboo pillowcase bundle.', personaId: 'bargain' },
      { text: 'Rated 4.8 stars by 12,000+ sleepers — a Sleep Foundation pick.', personaId: 'loyalist' },
    ],
  },
  {
    id: 'capitalpulse',
    label: 'Capital Pulse · SMB lending (Fintech)',
    image: '/samples/capitalpulse.jpg',
    imagePrompt:
      'Bold, trustworthy fintech ad image for Capital Pulse, instant working-capital lines for e-commerce founders. Flat geometric illustration of an upward growth arrow made of stacked coins/cash flowing into a storefront, burnt-orange and ink palette, energetic but credible, no text.',
    brief: {
      product: 'Capital Pulse — instant working-capital lines',
      audience: 'Owners of e-commerce businesses doing $1M–$10M/year',
    },
    activePersonas: ['skeptic', 'impulse', 'trend'],
    hooks: [
      { text: 'Approval in 24 hours, rates from 6%, no hidden fees.', personaId: 'skeptic' },
      { text: 'Need cash now? Unlock up to $250K instantly. Apply free today!', personaId: 'impulse' },
      { text: 'The funding option every Shopify founder is switching to in 2026.', personaId: 'trend' },
    ],
  },
]
