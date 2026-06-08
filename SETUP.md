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
