import type { CreativeBrief, CreativeHook, PersonaId } from '../types'
import { PERSONA_LABELS } from '../personas'
import type { SampleAd } from '../samples'

interface Props {
  brief: CreativeBrief
  hooks: CreativeHook[]
  activePersonas: PersonaId[]
  personaOrder: PersonaId[]
  samples: SampleAd[]
  sampleImage: string | null
  loading: boolean
  canAddHook: boolean
  onBriefChange: (brief: CreativeBrief) => void
  onToggleActivePersona: (id: PersonaId) => void
  onAddHook: () => void
  onRemoveHook: (id: string) => void
  onHookTextChange: (id: string, text: string) => void
  onLoadSample: (ad: SampleAd) => void
  onEvaluate: () => void
}

export function CreativeInputBoard(props: Props) {
  const {
    brief, hooks, activePersonas, personaOrder, samples, sampleImage, loading, canAddHook,
    onBriefChange, onToggleActivePersona, onAddHook, onRemoveHook,
    onHookTextChange, onLoadSample, onEvaluate,
  } = props

  return (
    <section className="panel p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker">01 · Input</p>
          <h2 className="panel-title mt-1">Creative Input Board</h2>
        </div>
        <label className="block">
          <span className="field-label mb-1 block">Load sample</span>
          <select
            className="field"
            value=""
            onChange={(e) => {
              const ad = samples.find((s) => s.id === e.target.value)
              if (ad) onLoadSample(ad)
            }}
          >
            <option value="" disabled>Choose an ad…</option>
            {samples.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {sampleImage && (
        <img
          src={sampleImage}
          alt="Sample ad creative"
          className="mt-4 w-full border border-[var(--color-light)] object-cover"
          style={{ maxHeight: 220 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )}

      <p className="mt-4 text-sm text-[var(--color-text)]">
        Describe the offer, pick which personas are in play, then write the hooks. Every hook is
        scored against all active personas.
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

      <div className="mt-5">
        <span className="field-label mb-2 block">Active personas (applied to every hook)</span>
        <div className="flex flex-wrap gap-2">
          {personaOrder.map((id) => {
            const on = activePersonas.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggleActivePersona(id)}
                className="px-3 py-1 text-xs"
                style={{
                  fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px',
                  border: '1px solid ' + (on ? 'var(--color-orange-btn)' : 'var(--color-light)'),
                  background: on ? 'var(--color-orange-btn)' : 'var(--color-white)',
                  color: on ? 'var(--color-white)' : 'var(--color-muted)',
                }}
                title={PERSONA_LABELS[id].blurb}
              >
                {PERSONA_LABELS[id].name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <span className="field-label block">Hooks</span>
        {hooks.map((h, i) => (
          <div key={h.id} className="flex items-start gap-2">
            <textarea
              className="field min-h-[56px] resize-y"
              value={h.text}
              placeholder={`Ad angle ${i + 1}…`}
              onChange={(e) => onHookTextChange(h.id, e.target.value)}
            />
            {hooks.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveHook(h.id)}
                aria-label={`Remove hook ${i + 1}`}
                className="mt-1 px-2 py-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-orange-deep)]"
                style={{ border: '1px solid var(--color-light)' }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {canAddHook && (
          <button
            type="button"
            onClick={onAddHook}
            className="text-xs"
            style={{
              fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px',
              color: 'var(--color-orange-btn)', border: '1px solid var(--color-light)', padding: '8px 14px',
            }}
          >
            + Add hook
          </button>
        )}
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
