import type { CreativeBrief, CreativeHook } from '../types'

interface Props {
  brief: CreativeBrief
  hooks: CreativeHook[]
  loading?: boolean
  onBriefChange: (brief: CreativeBrief) => void
  onHookChange: (id: string, text: string) => void
  onEvaluate: () => void
}

export function CreativeInputBoard({
  brief,
  hooks,
  loading = false,
  onBriefChange,
  onHookChange,
  onEvaluate,
}: Props) {
  return (
    <section className="panel p-6 sm:p-8">
      <p className="kicker">01 · Input</p>
      <h2 className="panel-title mt-1">Creative Input Board</h2>
      <p className="mt-2 text-sm text-[var(--color-text)]">
        Describe the offer, then drop in three competing hooks.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Product / service">
          <input
            className="field"
            value={brief.product}
            placeholder="e.g. AI scheduling assistant"
            onChange={(e) => onBriefChange({ ...brief, product: e.target.value })}
          />
        </Field>
        <Field label="Audience">
          <input
            className="field"
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
              className="field min-h-[58px] resize-y"
              value={h.text}
              placeholder="One ad angle…"
              onChange={(e) => onHookChange(h.id, e.target.value)}
            />
          </Field>
        ))}
      </div>

      <button onClick={onEvaluate} disabled={loading} className="btn-brand mt-6">
        {loading ? 'Evaluating…' : 'Evaluate hooks'}
      </button>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label mb-1 block">{label}</span>
      {children}
    </label>
  )
}
