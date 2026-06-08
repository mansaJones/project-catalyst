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
      <section className="panel p-6 sm:p-8">
        <p className="kicker">02 · Evaluation</p>
        <h2 className="panel-title mt-1">Synthetic Persona Evaluation</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Run an evaluation to see how each persona grades your hooks.
        </p>
      </section>
    )
  }

  const byHook = new Map(evaluations.map((e) => [e.hookId, e]))

  return (
    <section className="panel p-6 sm:p-8">
      <p className="kicker">02 · Evaluation</p>
      <h2 className="panel-title mt-1">Synthetic Persona Evaluation</h2>
      <p className="mt-2 mb-4 text-sm text-[var(--color-text)]">
        Rule-based scoring — deterministic, not a model.
      </p>

      <div className="space-y-4">
        {hooks.map((hook, i) => {
          const evaln = byHook.get(hook.id)
          if (!evaln) return null
          return (
            <div key={hook.id} className="border border-[var(--color-light)] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-text)]">
                  <span className="text-[var(--color-muted)]">Hook {i + 1}:</span>{' '}
                  {hook.text || <em className="text-[var(--color-muted)]">empty</em>}
                </span>
                <ScorePill value={evaln.overall} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {PERSONA_ORDER.map((pid) => {
                  const s = evaln.scores.find((x) => x.personaId === pid)!
                  return (
                    <div key={pid} className="bg-[var(--color-light)] p-2">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-semibold"
                          style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-ink)' }}
                        >
                          {PERSONA_LABELS[pid].name}
                        </span>
                        <span className="text-xs tabular-nums text-[var(--color-text)]">{s.score}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">{s.rationale}</p>
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
  // Brand-aligned scale: orange = strong, bright orange = mid, muted = weak.
  const bg = value >= 66 ? 'var(--color-orange-btn)' : value >= 45 ? 'var(--color-orange-bright)' : 'var(--color-muted)'
  return (
    <span
      className="px-2 py-0.5 text-xs font-semibold tabular-nums text-white"
      style={{ background: bg, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}
    >
      {value}/100
    </span>
  )
}
