import type { CreativeHook, HookResult, PersonaId } from '../types'
import { PERSONA_LABELS } from '../personas'

interface Props {
  hooks: CreativeHook[]
  results: HookResult[]
  personaOrder: PersonaId[]
  selectedAdHookId: string | null
  onCreateAd: (hookId: string) => void
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

export function ResultsPanel({ hooks, results, personaOrder, selectedAdHookId, onCreateAd }: Props) {
  if (!results.length) {
    return (
      <section className="panel p-6 sm:p-8">
        <p className="kicker">02 · Evaluation</p>
        <h2 className="panel-title mt-1">Persona Evaluation</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Pick your personas, write some hooks, and run an evaluation to see the scores.
        </p>
      </section>
    )
  }

  const byHook = new Map<string, HookResult[]>()
  for (const r of results) {
    const list = byHook.get(r.hookId) ?? []
    list.push(r)
    byHook.set(r.hookId, list)
  }
  const ordered = (list: HookResult[]) =>
    [...list].sort((a, b) => personaOrder.indexOf(a.personaId) - personaOrder.indexOf(b.personaId))

  return (
    <section className="panel p-6 sm:p-8">
      <p className="kicker">02 · Evaluation</p>
      <h2 className="panel-title mt-1">Persona Evaluation</h2>
      <p className="mt-2 mb-4 text-sm text-[var(--color-text)]">
        Each hook scored through every active persona. Pick a winner and build an ad from it.
      </p>

      <div className="space-y-4">
        {hooks.map((hook, i) => {
          const list = byHook.get(hook.id)
          if (!list || !list.length) return null
          const scores = ordered(list)
          const overall = clamp(scores.reduce((a, s) => a + s.score, 0) / scores.length)
          const selected = selectedAdHookId === hook.id
          return (
            <div
              key={hook.id}
              className="p-3"
              style={{ border: '1px solid ' + (selected ? 'var(--color-orange-btn)' : 'var(--color-light)') }}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-text)]">
                  <span className="text-[var(--color-muted)]">Hook {i + 1}:</span>{' '}
                  {hook.text || <em className="text-[var(--color-muted)]">empty</em>}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <ScorePill value={overall} label="avg" />
                  <button
                    type="button"
                    onClick={() => onCreateAd(hook.id)}
                    className="px-2 py-0.5 text-xs"
                    style={{
                      fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px',
                      border: '1px solid var(--color-orange-btn)',
                      background: selected ? 'var(--color-orange-btn)' : 'var(--color-white)',
                      color: selected ? 'var(--color-white)' : 'var(--color-orange-btn)',
                    }}
                  >
                    Create ad
                  </button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {scores.map((s) => (
                  <div key={s.personaId} className="bg-[var(--color-light)] p-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold"
                        style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-ink)' }}
                      >
                        {PERSONA_LABELS[s.personaId].name}
                      </span>
                      <span className="text-xs tabular-nums text-[var(--color-text)]">{s.score}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-[var(--color-muted)]">{s.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ScorePill({ value, label }: { value: number; label?: string }) {
  const bg = value >= 66 ? 'var(--color-orange-btn)' : value >= 45 ? 'var(--color-orange-bright)' : 'var(--color-muted)'
  return (
    <span
      className="shrink-0 px-2 py-0.5 text-xs font-semibold tabular-nums text-white"
      style={{ background: bg, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}
    >
      {label ? `${label} ` : ''}{value}/100
    </span>
  )
}
