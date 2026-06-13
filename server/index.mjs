// Local API server holding the Anthropic key. Three endpoints:
//   POST /api/evaluate   - score hooks through active personas
//   POST /api/ad-copy    - rewrite a hook into format-fit ad copy
//   POST /api/ad-design  - generate a self-contained HTML ad layout
// Run with: node --env-file=.env server/index.mjs   (Node 22+ for --env-file)

import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { normalizeResults } from './normalize.mjs'

const PORT = process.env.PORT || 8787
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.')
  process.exit(1)
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PERSONAS = {
  skeptic: 'The Skeptic (CFO lens): rewards cost, ROI and quantifiable proof; penalizes vague hype.',
  impulse: 'The Impulse Buyer (executive lens): rewards speed-to-value, bold hooks, emotional pull.',
  critic: 'The Feature Critic (product lens): rewards technical specifics, integrations, structural clarity.',
  bargain: 'The Bargain Hunter: rewards discounts, savings and obvious value; penalizes premium framing.',
  loyalist: 'The Brand Loyalist: rewards reputation, reviews and social proof; penalizes unproven framing.',
  researcher: 'The Researcher: rewards data, comparisons, detailed specs and cited evidence.',
  trend: 'The Trend Seeker: rewards novelty, FOMO and momentum; penalizes legacy framing.',
}
const PERSONA_IDS = Object.keys(PERSONAS)

const FORMAT_SPEC = {
  google: { label: 'Google Search text ad', limits: 'headline <= 30 chars, description <= 90 chars', dims: '600x200' },
  meta: { label: 'Instagram / Meta feed post', limits: 'primaryText 1-2 punchy sentences, headline <= 40 chars', dims: '480x600' },
  banner: { label: 'large-rectangle display banner', limits: 'headline <= 24 chars, very punchy', dims: '336x280' },
}

// ---- simple per-IP rate limit (protects the paid API on public hosting) ----
const RL_WINDOW_MS = 60_000
const RL_MAX = Number(process.env.RATE_LIMIT_PER_MIN || 20)
const rlHits = new Map()
function rateLimit(req, res, next) {
  if (req.method === 'GET') return next()
  const now = Date.now()
  const ip = req.ip || 'unknown'
  const rec = rlHits.get(ip)
  if (!rec || now > rec.reset) {
    rlHits.set(ip, { count: 1, reset: now + RL_WINDOW_MS })
    return next()
  }
  if (rec.count >= RL_MAX) {
    res.set('Retry-After', String(Math.ceil((rec.reset - now) / 1000)))
    return res.status(429).json({ error: 'Rate limit exceeded. Try again shortly.' })
  }
  rec.count += 1
  next()
}

const app = express()
app.set('trust proxy', 1)
const ORIGINS = (process.env.ALLOWED_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean)
app.use(cors({ origin: ORIGINS.length ? ORIGINS : true }))
app.use(express.json({ limit: '64kb' }))
app.use('/api', rateLimit)

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }))

// ---- persona evaluation ----
const SCORE_TOOL = {
  name: 'submit_scores',
  description: 'Return one score per hook per persona.',
  input_schema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hookId: { type: 'string' },
            personaId: { type: 'string', enum: PERSONA_IDS },
            score: { type: 'integer', minimum: 0, maximum: 100 },
            rationale: { type: 'string' },
          },
          required: ['hookId', 'personaId', 'score', 'rationale'],
        },
      },
    },
    required: ['results'],
  },
}

app.post('/api/evaluate', async (req, res) => {
  const { brief, hooks, personas } = req.body ?? {}
  if (!Array.isArray(hooks) || hooks.length === 0) return res.status(400).json({ error: 'Need a non-empty "hooks" array.' })
  const active = (Array.isArray(personas) ? personas : []).filter((p) => PERSONAS[p])
  if (active.length === 0) return res.status(400).json({ error: 'Need a non-empty "personas" array.' })

  const system = `You score ad-copy hooks. Score EVERY hook through EACH requested persona — one score (0-100) and a one-sentence rationale per hook per persona, grounded in the text.

Persona lenses:
${active.map((id) => `- ${id}: ${PERSONAS[id]}`).join('\n')}`
  const userContent = [
    `Product: ${brief?.product || '(unspecified)'}`,
    `Audience: ${brief?.audience || '(unspecified)'}`,
    '',
    `Personas to apply to every hook: ${active.join(', ')}`,
    '',
    'Hooks (use the exact id); return a result for every hook × persona pair:',
    ...hooks.map((h) => `- ${h.id}: ${h.text || '(empty)'}`),
  ].join('\n')

  try {
    const message = await client.messages.create({
      model: MODEL, max_tokens: 4096, system,
      tools: [SCORE_TOOL], tool_choice: { type: 'tool', name: 'submit_scores' },
      messages: [{ role: 'user', content: userContent }],
    })
    if (message.stop_reason === 'max_tokens') console.warn('evaluate truncated at max_tokens — results may be malformed')
    const toolUse = message.content.find((b) => b.type === 'tool_use')
    if (!toolUse) return res.status(502).json({ error: 'Model returned no structured scores.' })
    res.json({ results: normalizeResults(toolUse.input.results) })
  } catch (err) {
    console.error('evaluate failed:', err?.message || err)
    res.status(502).json({ error: 'Upstream model call failed.', detail: err?.message })
  }
})

// ---- Claude ad copy ----
const COPY_TOOL = {
  name: 'submit_copy',
  description: 'Return format-fit ad copy.',
  input_schema: {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      description: { type: 'string' },
      primaryText: { type: 'string' },
      cta: { type: 'string' },
    },
    required: ['headline', 'description', 'primaryText', 'cta'],
  },
}

app.post('/api/ad-copy', async (req, res) => {
  const { hook, brief, format } = req.body ?? {}
  const spec = FORMAT_SPEC[format]
  if (!spec) return res.status(400).json({ error: 'Unknown format.' })
  if (!hook) return res.status(400).json({ error: 'Need a "hook".' })

  const system = `You are a senior performance-marketing copywriter. Rewrite the hook into compelling, on-brand ad copy for a ${spec.label}. Constraints: ${spec.limits}. The CTA is 1-3 words (e.g. "Get started", "Shop now"). Stay truthful to the product; do not invent claims. Keep it tight.`
  const user = [
    `Product: ${brief?.product || '(unspecified)'}`,
    `Audience: ${brief?.audience || '(unspecified)'}`,
    `Hook: ${hook}`,
  ].join('\n')

  try {
    const message = await client.messages.create({
      model: MODEL, max_tokens: 512, system,
      tools: [COPY_TOOL], tool_choice: { type: 'tool', name: 'submit_copy' },
      messages: [{ role: 'user', content: user }],
    })
    const t = message.content.find((b) => b.type === 'tool_use')
    if (!t) return res.status(502).json({ error: 'No copy returned.' })
    const c = t.input
    res.json({ copy: { headline: String(c.headline ?? ''), description: String(c.description ?? ''), primaryText: String(c.primaryText ?? ''), cta: String(c.cta ?? '') } })
  } catch (err) {
    console.error('ad-copy failed:', err?.message || err)
    res.status(502).json({ error: 'Upstream model call failed.', detail: err?.message })
  }
})

// ---- Claude ad design (self-contained HTML, rendered sandboxed on the client) ----
const DESIGN_TOOL = {
  name: 'submit_design',
  description: 'Return a single self-contained HTML fragment for the ad.',
  input_schema: { type: 'object', properties: { html: { type: 'string' } }, required: ['html'] },
}

app.post('/api/ad-design', async (req, res) => {
  const { hook, brief, format } = req.body ?? {}
  const spec = FORMAT_SPEC[format]
  if (!spec) return res.status(400).json({ error: 'Unknown format.' })
  if (!hook) return res.status(400).json({ error: 'Need a "hook".' })

  const system = `You design ad creative as code. Return ONE self-contained HTML fragment for a ${spec.label} that fills exactly ${spec.dims} pixels.
Hard rules:
- Inline styles only. NO <script>, NO external URLs, NO <img> with remote src, NO web fonts — system fonts only.
- The root element must be exactly ${spec.dims}px (width x height), no margins, overflow hidden.
- Use the Mansa Tech brand: burnt-orange (#CF4500 / #C03C00) accents on near-black (#111) and white, sharp corners (no border-radius), bold condensed headlines.
- Build the creative around the hook; include a clear CTA button. Be visually striking but legible.
Return only the HTML fragment, nothing else.`
  const user = [
    `Product: ${brief?.product || '(unspecified)'}`,
    `Audience: ${brief?.audience || '(unspecified)'}`,
    `Hook: ${hook}`,
  ].join('\n')

  try {
    const message = await client.messages.create({
      model: MODEL, max_tokens: 2048, system,
      tools: [DESIGN_TOOL], tool_choice: { type: 'tool', name: 'submit_design' },
      messages: [{ role: 'user', content: user }],
    })
    const t = message.content.find((b) => b.type === 'tool_use')
    if (!t?.input?.html) return res.status(502).json({ error: 'No design returned.' })
    res.json({ html: String(t.input.html) })
  } catch (err) {
    console.error('ad-design failed:', err?.message || err)
    res.status(502).json({ error: 'Upstream model call failed.', detail: err?.message })
  }
})

app.listen(PORT, () => console.log(`API on http://localhost:${PORT} (model: ${MODEL})`))
