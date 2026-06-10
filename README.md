# Project Catalyst

[![CI](https://github.com/mansaJones/project-catalyst/actions/workflows/ci.yml/badge.svg)](https://github.com/mansaJones/project-catalyst/actions/workflows/ci.yml)

**Live demo → [project-catalyst-fhep.onrender.com](https://project-catalyst-fhep.onrender.com/)**

A self-contained React sandbox that mocks two stages of a paid-media workflow:
scoring ad copy against synthetic buyer personas, and visualizing a simulated
7-day budget reallocation across Meta, Google, and LinkedIn — all before
spending a dollar in a live auction.

The persona scoring and budget curves are **deterministic simulations, not
machine-learning models**: same input, same output, zero latency. That's a
deliberate tradeoff to keep the hosted demo free and reproducible. The scoring
backend is swappable, so the same UI can run on real Claude calls instead (see
[Running with the Claude backend](#running-with-the-claude-backend)).

<!-- Add a screenshot of the live app here once captured, e.g.:
![Project Catalyst](docs/screenshot.png) -->

## Features

- **Creative Input Board** — capture a product/audience brief and three competing ad hooks.
- **Synthetic Persona Evaluation** — score each hook through three buyer lenses (the Skeptic / CFO, the Impulse Buyer / executive, the Feature Critic / product).
- **Budget Allocator** — a scripted 7-day model that drifts spend toward the strongest-scoring channel.
- **Swappable scoring engine** — deterministic rule engine by default; a Claude-backed evaluator behind the same interface.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 15 unit tests (Vitest)
npm run build    # typecheck (tsc) + production build
```

By default the app uses the deterministic rule engine and needs no server or API key.

### Running with the Claude backend

To score hooks with Claude instead of the rule engine, see the full steps in
[`SETUP.md`](SETUP.md). In short: copy `.env.example` to `.env`, add your
Anthropic key, set `VITE_USE_LLM=true`, and run `npm run dev:all` (Vite + the
local API server that holds the key). The key never reaches the browser.

## Architecture

The scoring backend sits behind a one-method `PersonaEvaluator` interface, so
the rule engine and the Claude evaluator are interchangeable and the UI never
changes. Swapping backends is a single line in `src/personas/index.ts`.

| Path | What it is |
|------|------------|
| `src/types.ts` | Shared domain types (briefs, hooks, scores). |
| `src/personas/PersonaEvaluator.ts` | The evaluation **interface** — the swap seam. |
| `src/personas/ruleEngine.ts` | Deterministic keyword/rule scorer (default backend). |
| `src/personas/llmEvaluator.ts` | Claude-backed scorer; posts to the local API. |
| `src/personas/index.ts` | Selects the active backend (`VITE_USE_LLM`). |
| `src/budget/simulate.ts` | Scripted 7-day budget reallocation model. |
| `server/index.mjs` | Local Express API holding the Anthropic key. |
| `src/components/` | The three UI modules. |
| `src/App.tsx` | State wiring. |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · Vitest ·
Express + Anthropic SDK (optional backend) · GitHub Actions CI · deployed on Render.

Styled to the Mansa Tech brand (Oswald / Ubuntu, burnt-orange on near-black ink).
