import type { CreativeHook, HookResult } from '../types'
import { PERSONA_LABELS } from '../personas'

interface Props {
  hooks: CreativeHook[]
  results: HookResult[]
}

export function ResultsPanel({ hooks, results }: Props) {
  if (!results.length) {
    return (
      <section className="panel p-6 sm:p-8">
        <p className="kicker">02 · Evaluation</p>
        <h2 className="panel-title mt-1">Persona Evaluation</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Assign a persona to each hook and run an evaluation to see the scores.
        </p>
      </section>
    )
  }

  const byHook = new Map(results.map((r) => [r.hookId, r]))

  return (
    <section className="panel p-6 sm:p-8">
      <p className="kicker">02 · Evaluation</p>
      <h2 className="panel-title mt-1">Persona Evaluation</h2>
      <p className="mt-2 mb-4 text-sm text-[var(--color-text)]">
        Each hook scored through its assigned persona.
      </p>

      <div className="space-y-3">
        {hooks.map((hook, i) => {
          const r = byHook.get(hook.id)
          if (!r) return null
          return (
            <div key={hook.id} className="border border-[var(--color-light)] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-text)]">
                  <span className="text-[var(--color-muted)]">Hook {i + 1}:</span>{' '}
                  {hook.text || <em className="text-[var(--color-muted)]">empty</em>}
                </span>
                <ScorePill value={r.score} />
              </div>
              <div className="flex items-start gap-2 bg-[var(--color-light)] p-2">
                <span
                  className="shrink-0 text-xs font-semibold"
                  style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-ink)' }}
                >
                  {PERSONA_LABELS[r.personaId].name}
                </span>
                <p className="text-[12px] leading-snug text-[var(--color-text)]">{r.rationale}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ScorePill({ value }: { value: number }) {
  const bg = value >= 66 ? 'var(--color-orange-btn)' : value >= 45 ? 'var(--color-orange-bright)' : 'var(--color-muted)'
  return (
    <span
      className="shrink-0 px-2 py-0.5 text-xs font-semibold tabular-nums text-white"
      style={{ background: bg, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}
    >
      {value}/100
    </span>
  )
}
