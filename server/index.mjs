// Local API server that holds the Anthropic key and scores every hook through
// each active persona with Claude.
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

// Persona definitions mirror src/personas/ruleEngine.ts (kept in sync by hand;
// the server is plain .mjs and can't import the TS catalog).
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

const SCORE_TOOL = {
  name: 'submit_scores',
  description: 'Return one score per hook per persona, scoring each hook through every requested persona.',
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

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }))

app.post('/api/evaluate', async (req, res) => {
  const { brief, hooks, personas } = req.body ?? {}
  if (!Array.isArray(hooks) || hooks.length === 0) {
    return res.status(400).json({ error: 'Body must include a non-empty "hooks" array.' })
  }
  const active = (Array.isArray(personas) ? personas : []).filter((p) => PERSONAS[p])
  if (active.length === 0) {
    return res.status(400).json({ error: 'Body must include a non-empty "personas" array.' })
  }

  const system = `You score ad-copy hooks. Score EVERY hook through EACH of the requested personas — one score (0-100) and a one-sentence rationale per hook per persona, grounded in the hook text.

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
      model: MODEL,
      max_tokens: 2048,
      system,
      tools: [SCORE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_scores' },
      messages: [{ role: 'user', content: userContent }],
    })

    const toolUse = message.content.find((b) => b.type === 'tool_use')
    if (!toolUse) return res.status(502).json({ error: 'Model returned no structured scores.' })

    res.json({ results: normalizeResults(toolUse.input.results) })
  } catch (err) {
    console.error('Anthropic call failed:', err?.message || err)
    res.status(502).json({ error: 'Upstream model call failed.', detail: err?.message })
  }
})

app.listen(PORT, () => console.log(`API on http://localhost:${PORT} (model: ${MODEL})`))
