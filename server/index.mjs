// Local API server that holds the Anthropic key and scores hooks with Claude.
// Run with: node --env-file=.env server/index.mjs   (Node 22+ for --env-file)
//
// This is intentionally a separate process from the Vite static app: the key
// lives here and is never shipped to the browser. In dev, Vite proxies
// /api -> this server (see vite.config.ts).

import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { normalizeEvaluations } from './normalize.mjs'

const PORT = process.env.PORT || 8787
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.')
  process.exit(1)
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PERSONAS = `You are scoring ad copy hooks through three fixed buyer-persona lenses:
- "skeptic"  — a CFO. Rewards cost/ROI framing and quantifiable proof; penalizes vague hype.
- "impulse"  — a busy executive. Rewards speed-to-value, bold hooks, emotional pull.
- "critic"   — a product lead. Rewards technical specifics, integrations, structural clarity.
Score each hook 0-100 per persona, with a one-sentence rationale grounded in the text.`

// Tool schema forces structured output. (Newer alternative: the GA
// output_config.format JSON-Schema field — swap in later if preferred.)
const SCORE_TOOL = {
  name: 'submit_scores',
  description: 'Return persona scores for every hook.',
  input_schema: {
    type: 'object',
    properties: {
      evaluations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hookId: { type: 'string' },
            scores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  personaId: { type: 'string', enum: ['skeptic', 'impulse', 'critic'] },
                  score: { type: 'integer', minimum: 0, maximum: 100 },
                  rationale: { type: 'string' },
                },
                required: ['personaId', 'score', 'rationale'],
              },
            },
          },
          required: ['hookId', 'scores'],
        },
      },
    },
    required: ['evaluations'],
  },
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }))

app.post('/api/evaluate', async (req, res) => {
  const { brief, hooks } = req.body ?? {}
  if (!Array.isArray(hooks) || hooks.length === 0) {
    return res.status(400).json({ error: 'Body must include a non-empty "hooks" array.' })
  }

  const userContent = [
    `Product: ${brief?.product || '(unspecified)'}`,
    `Audience: ${brief?.audience || '(unspecified)'}`,
    '',
    'Hooks to score (use the exact id):',
    ...hooks.map((h) => `- ${h.id}: ${h.text || '(empty)'}`),
  ].join('\n')

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: PERSONAS,
      tools: [SCORE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_scores' },
      messages: [{ role: 'user', content: userContent }],
    })

    const toolUse = message.content.find((b) => b.type === 'tool_use')
    if (!toolUse) return res.status(502).json({ error: 'Model returned no structured scores.' })

    // Normalize: clamp scores and recompute overall server-side for consistency.
    const evaluations = normalizeEvaluations(toolUse.input.evaluations)

    res.json({ evaluations })
  } catch (err) {
    console.error('Anthropic call failed:', err?.message || err)
    res.status(502).json({ error: 'Upstream model call failed.', detail: err?.message })
  }
})

app.listen(PORT, () => console.log(`API on http://localhost:${PORT} (model: ${MODEL})`))
