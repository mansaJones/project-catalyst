# Setup & Working Notes

Practical notes for running this repo, which lives inside a Google Drive
folder. Read once; future-you will thank present-you.

## First-time setup

```bash
cd catalyst
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck (tsc -b) + production build to dist/
```

Requires Node 22 (pinned in `.node-version`).

## Living in Google Drive — read this

This project syncs through Google Drive. That's fine for source, but two
things need handling.

### 1. Keep node_modules OUT of Drive

`.gitignore` stops git from tracking `node_modules`, but Drive ignores
`.gitignore` and will try to sync all ~200MB of it. Redirect the folder to
local disk with a junction so Drive never sees it:

```bash
# from inside catalyst/, ideally with Drive sync paused:
rm -rf node_modules
cmd //c "mklink /J node_modules C:\dev\catalyst-node_modules"
npm install
```

If Drive follows the junction anyway, the fallback is simply: delete
`node_modules` before long away-from-keyboard periods and re-run
`npm install` when you come back.

### 2. Don't run git while Drive is mid-sync

Drive's file locking can race with git's `.lock` files. Single machine,
single user: you'll basically never hit it. But if you edit from two
machines, let one finish syncing before committing on the other.

If git ever complains that "another git process seems to be running" and
nothing is, clear stale locks:

```bash
rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock
```

## Push to GitHub

```bash
git branch -M main
git remote add origin https://github.com/<you>/project-catalyst.git
git push -u origin main
```

GitHub is the real source of truth; Drive is just a convenient mirror.

## Deploy on Render

`render.yaml` is a static-site blueprint. In Render: **New > Blueprint**,
pick the repo, and it reads the config automatically (build to `dist/`,
PR previews on). The blueprint assumes the repo root **is** this `catalyst`
folder — if you push the parent folder instead, move `render.yaml` up a
level or set the service root dir to `catalyst`.

## Where things live

| Path | What |
|------|------|
| `src/personas/PersonaEvaluator.ts` | Evaluation interface — the swap seam. |
| `src/personas/ruleEngine.ts` | Deterministic scorer (tune the keyword lists here). |
| `src/personas/index.ts` | Active backend — swap one line to use an LLM. |
| `src/budget/simulate.ts` | Scripted 7-day budget model. |
| `src/components/` | The three UI modules. |

## Running with the Claude backend (optional)

By default the app uses the deterministic rule engine and needs no server.
To score hooks with Claude instead:

```bash
cp .env.example .env          # then paste your Anthropic key into .env
npm install                   # picks up express, cors, @anthropic-ai/sdk, concurrently
echo "VITE_USE_LLM=true" >> .env.local   # tell the frontend to use the LLM backend
npm run dev:all               # runs Vite + the API server together
```

- The key lives only in `server/index.mjs`'s process (`.env`), never in the browser.
- `.env` is gitignored. Do not commit it.
- Default model is `claude-haiku-4-5-20251001`; override with `ANTHROPIC_MODEL` in `.env`.
- The rule engine remains the fallback, so the keyless static deploy still works.

## Fixing `npm install` errors in Google Drive (TAR_ENTRY_ERROR)

If `npm install` spits out `npm WARN tar TAR_ENTRY_ERROR UNKNOWN: ... write`,
that's Google Drive choking on the thousands of files in `node_modules`.
Move `node_modules` onto local disk with a junction — it still appears inside
the project, but the files live off Drive so Drive leaves them alone.

Run in Git Bash from the project root:

```bash
# 1. Pause Google Drive first (tray icon -> gear -> Pause syncing),
#    so the half-written node_modules can be deleted.

# 2. Remove the corrupt partial install
rm -rf node_modules

# 3. Redirect node_modules to a real local folder, off Drive
mkdir -p /c/dev/catalyst-node_modules
cmd //c "mklink /J node_modules C:\\dev\\catalyst-node_modules"

# 4. Install — writes now go to C:\dev, not Drive
npm install

# 5. Resume Google Drive syncing.
```

Notes:
- `mklink /J` creates a junction; Drive does not follow it, so the deps never
  sync to the cloud (which you want — they're 200MB+ of disposable files).
- `.gitignore` already ignores `node_modules`, so git is unaffected.
- If `rm -rf node_modules` itself errors, Drive is still holding file locks:
  make sure sync is paused, and if needed delete the folder from File Explorer
  or reboot to clear the locks, then run steps 3-4.
