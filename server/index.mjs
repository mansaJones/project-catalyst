// Local API server that holds the Anthropic key and scores each hook through
// its assigned persona with Claude.
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

const SYSTEM = `You score ad-copy hooks. Each hook is assigned exactly ONE buyer persona; score that hook ONLY through its assigned persona's lens, 0-100, with a one-sentence rationale grounded in the hook text.

Persona lenses:
${PERSONA_IDS.map((id) => `- ${id}: ${PERSONAS[id]}`).join('\n')}`

const SCORE_TOOL = {
  name: 'submit_scores',
  description: 'Return one score per hook, scored through its assigned persona.',
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
  const { brief, hooks } = req.body ?? {}
  if (!Array.isArray(hooks) || hooks.length === 0) {
    return res.status(400).json({ error: 'Body must include a non-empty "hooks" array.' })
  }

  const userContent = [
    `Product: ${brief?.product || '(unspecified)'}`,
    `Audience: ${brief?.audience || '(unspecified)'}`,
    '',
    'Score each hook through its assigned persona (use the exact id):',
    ...hooks.map((h) => `- ${h.id} [persona: ${h.personaId}]: ${h.text || '(empty)'}`),
  ].join('\n')

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
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
