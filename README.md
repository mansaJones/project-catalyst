# Project Catalyst

A self-contained React sandbox that mocks two stages of a paid-media workflow:
scoring ad copy against synthetic buyer personas, and visualizing a simulated
7-day budget reallocation across Meta, Google, and LinkedIn.

Everything runs client-side. There are no API calls and no real spend. The
persona scoring and budget curves are **deterministic simulations, not models** —
same input, same output, zero latency. That's a deliberate tradeoff to keep the
demo free and reproducible.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Structure

| Path | What it is |
|------|------------|
| `src/types.ts` | Shared domain types (briefs, hooks, scores). |
| `src/personas/PersonaEvaluator.ts` | The evaluation **interface** — the swap seam. |
| `src/personas/ruleEngine.ts` | Deterministic keyword/rule scorer (the only backend today). |
| `src/personas/index.ts` | Exports the active evaluator. **Swap one line** to use an LLM later. |
| `src/budget/simulate.ts` | Scripted 7-day reallocation model. |
| `src/components/` | The three UI modules. |
| `src/App.tsx` | State wiring. |

## Swapping in a real model

Implement `PersonaEvaluator` (e.g. `LlmEvaluator`) and change the single export
in `src/personas/index.ts`. No UI changes required — that's the whole point of
the seam.

## Stack

Vite + React 19 + TypeScript + Tailwind CSS v4 (via `@tailwindcss/vite`) + Recharts.
# project-catalyst
# project-catalyst
# project-catalyst
