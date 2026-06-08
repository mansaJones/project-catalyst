import type { CreativeBrief, CreativeHook } from '../types'

interface Props {
  brief: CreativeBrief
  hooks: CreativeHook[]
  onBriefChange: (brief: CreativeBrief) => void
  onHookChange: (id: string, text: string) => void
  onEvaluate: () => void
}

export function CreativeInputBoard({ brief, hooks, onBriefChange, onHookChange, onEvaluate }: Props) {
  return (
    <section className="rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-5">
      <h2 className="mb-1 text-lg font-semibold">1 · Creative Input Board</h2>
      <p className="mb-4 text-sm text-slate-400">Describe the offer, then drop in three competing hooks.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Product / service">
          <input
            className={inputCls}
            value={brief.product}
            placeholder="e.g. AI scheduling assistant"
            onChange={(e) => onBriefChange({ ...brief, product: e.target.value })}
          />
        </Field>
        <Field label="Audience">
          <input
            className={inputCls}
            value={brief.audience}
            placeholder="e.g. ops leads at mid-market SaaS"
            onChange={(e) => onBriefChange({ ...brief, audience: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-4 space-y-3">
        {hooks.map((h, i) => (
          <Field key={h.id} label={`Hook ${i + 1}`}>
            <textarea
              className={`${inputCls} min-h-[60px] resize-y`}
              value={h.text}
              placeholder="One ad angle…"
              onChange={(e) => onHookChange(h.id, e.target.value)}
            />
          </Field>
        ))}
      </div>

      <button
        onClick={onEvaluate}
        className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-110"
      >
        Evaluate hooks
      </button>
    </section>
  )
}

const inputCls =
  'w-full rounded-lg border border-[var(--color-edge)] bg-[var(--color-ink)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}
