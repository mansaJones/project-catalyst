import type { CreativeHook, HookEvaluation, PersonaId } from '../types'
import { PERSONA_LABELS } from '../personas'

interface Props {
  hooks: CreativeHook[]
  evaluations: HookEvaluation[]
}

const PERSONA_ORDER: PersonaId[] = ['skeptic', 'impulse', 'critic']

export function PersonaPanel({ hooks, evaluations }: Props) {
  if (!evaluations.length) {
    return (
      <section className={panelCls}>
        <h2 className="mb-1 text-lg font-semibold">2 · Synthetic Persona Evaluation</h2>
        <p className="text-sm text-slate-500">Run an evaluation to see how each persona grades your hooks.</p>
      </section>
    )
  }

  const byHook = new Map(evaluations.map((e) => [e.hookId, e]))

  return (
    <section className={panelCls}>
      <h2 className="mb-1 text-lg font-semibold">2 · Synthetic Persona Evaluation</h2>
      <p className="mb-4 text-sm text-slate-400">Rule-based scoring — deterministic, not a model.</p>

      <div className="space-y-4">
        {hooks.map((hook, i) => {
          const evaln = byHook.get(hook.id)
          if (!evaln) return null
          return (
            <div key={hook.id} className="rounded-lg border border-[var(--color-edge)] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">
                  <span className="text-slate-500">Hook {i + 1}:</span> {hook.text || <em className="text-slate-600">empty</em>}
                </span>
                <ScorePill value={evaln.overall} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {PERSONA_ORDER.map((pid) => {
                  const s = evaln.scores.find((x) => x.personaId === pid)!
                  return (
                    <div key={pid} className="rounded-md bg-[var(--color-ink)] p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{PERSONA_LABELS[pid].name}</span>
                        <span className="text-xs tabular-nums text-slate-400">{s.score}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-slate-500">{s.rationale}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ScorePill({ value }: { value: number }) {
  const tone = value >= 66 ? 'bg-emerald-500/20 text-emerald-300'
    : value >= 45 ? 'bg-amber-500/20 text-amber-300'
    : 'bg-rose-500/20 text-rose-300'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}>{value}/100</span>
}

const panelCls = 'rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-5'
