# Setup & Working Notes

## First-time setup

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 19 unit tests
npm run build    # typecheck (tsc -b) + production build to dist/
```

Requires Node 22+ (pinned in `.node-version`).

## Push to GitHub

The repo already has its `origin` remote. Normal flow:

```bash
git add -A && git commit -m "your message" && git push
```

GitHub Actions runs lint + tests + build on every push.

## Where things live

| Path | What |
|------|------|
| `src/personas/PersonaEvaluator.ts` | Evaluation interface — the swap seam. |
| `src/personas/ruleEngine.ts` | Deterministic 7-persona scorer (tune the keyword lists here). |
| `src/personas/llmEvaluator.ts` | Claude-backed scorer (posts to the API). |
| `src/personas/index.ts` | Selects the backend (`VITE_USE_LLM`). |
| `src/samples.ts` | The three sample ad presets. |
| `src/adFormats.ts` | Ad formats + deterministic ad-copy generator. |
| `src/ads/adClient.ts` | Claude ad-copy / ad-design clients. |
| `src/components/AdStudio.tsx` | The Ad Studio UI. |
| `server/index.mjs` | Local Express API holding the Anthropic key. |

## Running with the Claude backend (local)

By default the app uses the deterministic rule engine and needs no server. To use Claude:

```bash
cp .env.example .env          # paste your Anthropic key into .env
echo "VITE_USE_LLM=true" >> .env
npm run dev:all               # runs Vite + the API server together
```

- The key lives only in `server/index.mjs`'s process (`.env`), never in the browser.
- `.env` is gitignored. Do not commit it.
- Default model is `claude-haiku-4-5-20251001`; override with `ANTHROPIC_MODEL`.
- The rule engine remains the fallback, so the keyless static deploy still works.

## Deploy on Render

`render.yaml` is a two-service blueprint: the static React site **and** a Node API
service (`project-catalyst-api`) that holds the Anthropic key. In Render:
**New → Blueprint → pick the repo → Apply.** The repo root is the app, so no
sub-directory configuration is needed.

## Hosting Claude on the live site (Tier 2)

By default the live site runs the deterministic rule engine. To make the deployed
site use Claude you host the backend and point the frontend at it. `render.yaml`
already defines both services.

1. Push, then in Render: **New → Blueprint → pick the repo → Apply.** It creates two
   services: `project-catalyst` (static site) and `project-catalyst-api` (Node API).
2. Set the prompted secrets/values:
   - On **project-catalyst-api**: `ANTHROPIC_API_KEY` = your key.
     (`ALLOWED_ORIGIN` and `RATE_LIMIT_PER_MIN` come preset from the blueprint.)
   - On the **static site**: leave `VITE_API_BASE` blank for the first deploy.
     Once the API service finishes, copy its public URL
     (e.g. `https://project-catalyst-api.onrender.com`), set `VITE_API_BASE` to it,
     and redeploy the static site.
3. Verify: the static site header reads `backend: claude-evaluator`, and the Ad
   Studio's "Claude copy" / "AI design" tabs are enabled.

> Keep `ANTHROPIC_API_KEY` only on the API service — the static site can't use it.

### Cost & safety guardrails (live)

- **Rate limit:** the API caps requests per IP per minute (`RATE_LIMIT_PER_MIN`,
  default 20) and returns 429 past that — protects the paid API from public abuse.
- **CORS:** locked to `ALLOWED_ORIGIN` (your frontend domain); add comma-separated
  origins if you serve from more than one.
- **Cheap model + small calls:** uses Haiku; each eval / ad-copy / ad-design call is
  a fraction of a cent. Still, set a **usage limit / billing alert at
  platform.claude.com** before exposing it publicly.
- **Free Render plan:** the API spins down when idle, so the first Claude request
  after a quiet period has a ~30–60s cold start. Upgrade the API service's plan to
  avoid this.
- The static site never reads `.env`; all production config is Render env vars.
