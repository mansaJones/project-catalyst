# Project Catalyst

> Pressure-test ad creative against a panel of synthetic buyer personas — assign a persona to each hook and see how it scores, before spending a dollar.

[![CI](https://github.com/mansaJones/project-catalyst/actions/workflows/ci.yml/badge.svg)](https://github.com/mansaJones/project-catalyst/actions/workflows/ci.yml)

**Live demo → [project-catalyst.mansa-tech.com/](https://project-catalyst.mansa-tech.com//)**

A self-contained React sandbox for paid-media creative testing: describe an
offer, write competing ad hooks, assign each hook one of seven synthetic buyer
personas, and get an instant scored critique of every hook through its persona's
lens — all before a dollar hits a live auction.

Scoring is a **deterministic simulation, not a machine-learning model**: same
input, same output, zero latency. That's a deliberate tradeoff to keep the
hosted demo free and reproducible. The scoring backend is swappable, so the same
UI can run on real Claude calls instead (see [Running with the Claude
backend](#running-with-the-claude-backend)).

![Project Catalyst — the rebranded app: persona panel, per-hook persona assignment, and scored results](docs/screenshot.png)

## Features

- **Creative Input Board** — capture a product/audience brief, add or remove ad hooks (1–6), and load ready-made sample ads.
- **Seven synthetic personas** — the Skeptic (CFO), Impulse Buyer (executive), Feature Critic (product), Bargain Hunter, Brand Loyalist, Researcher, and Trend Seeker. Choose which are in play, then assign one to each hook.
- **Per-hook evaluation** — each hook is scored 0–100 through its assigned persona, with a one-line rationale.
- **Sample ad presets** — three brand-styled ad concepts (B2B SaaS, DTC, fintech) that load a brief, persona mapping, hooks, and a creative image.
- **Swappable scoring engine** — deterministic rule engine by default; a Claude-backed evaluator behind the same interface.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 14 unit tests (Vitest)
npm run build    # typecheck (tsc) + production build
```

By default the app uses the deterministic rule engine and needs no server or API key.

### Running with the Claude backend

To score hooks with Claude instead of the rule engine, see the full steps in
[`SETUP.md`](SETUP.md). In short: copy `.env.example` to `.env`, add your
Anthropic key, set `VITE_USE_LLM=true`, and run `npm run dev:all` (Vite + the
local API server that holds the key). The key never reaches the browser.

## Architecture

The scoring backend sits behind a one-method `PersonaEvaluator` interface, so the
rule engine and the Claude evaluator are interchangeable and the UI never
changes. Each hook carries the single persona assigned to it; the engine scores
every hook through its own persona. Swapping backends is a single line in
`src/personas/index.ts`.

| Path | What it is |
|------|------------|
| `src/types.ts` | Shared domain types (brief, hooks, results). |
| `src/personas/PersonaEvaluator.ts` | The evaluation **interface** — the swap seam. |
| `src/personas/ruleEngine.ts` | Deterministic 7-persona keyword/rule scorer (default backend). |
| `src/personas/llmEvaluator.ts` | Claude-backed scorer; posts to the local API. |
| `src/personas/index.ts` | Selects the active backend (`VITE_USE_LLM`). |
| `src/samples.ts` | The three sample ad presets. |
| `server/index.mjs` | Local Express API holding the Anthropic key. |
| `src/components/` | UI modules (input board, results panel). |
| `src/App.tsx` | State wiring. |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Vitest ·
Express + Anthropic SDK (optional backend) · GitHub Actions CI · deployed on Render.

Styled to the Mansa Tech brand (Oswald / Ubuntu, burnt-orange on near-black ink).
