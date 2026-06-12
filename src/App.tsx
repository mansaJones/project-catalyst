import { useState } from 'react'
import type { CreativeBrief, CreativeHook, HookResult, PersonaId } from './types'
import { evaluator, PERSONA_ORDER } from './personas'
import { SAMPLE_ADS, type SampleAd } from './samples'
import { CreativeInputBoard } from './components/CreativeInputBoard'
import { ResultsPanel } from './components/PersonaPanel'

const uid = () => Math.random().toString(36).slice(2, 9)
const DEFAULT_ACTIVE: PersonaId[] = ['skeptic', 'impulse', 'critic']

const makeHook = (personaId: PersonaId): CreativeHook => ({ id: uid(), text: '', personaId })

const MAX_HOOKS = 6

export default function App() {
  const [brief, setBrief] = useState<CreativeBrief>({ product: '', audience: '' })
  const [activePersonas, setActivePersonas] = useState<PersonaId[]>(DEFAULT_ACTIVE)
  const [hooks, setHooks] = useState<CreativeHook[]>(DEFAULT_ACTIVE.map(makeHook))
  const [results, setResults] = useState<HookResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sampleImage, setSampleImage] = useState<string | null>(null)

  const toggleActivePersona = (id: PersonaId) => {
    setActivePersonas((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      if (next.length === 0) return prev // keep at least one active
      // reassign any hook pointing at a now-inactive persona to the first active one
      setHooks((hs) => hs.map((h) => (next.includes(h.personaId) ? h : { ...h, personaId: next[0] })))
      return next
    })
  }

  const addHook = () =>
    setHooks((prev) => (prev.length >= MAX_HOOKS ? prev : [...prev, makeHook(activePersonas[0])]))
  const removeHook = (id: string) =>
    setHooks((prev) => (prev.length <= 1 ? prev : prev.filter((h) => h.id !== id)))
  const updateHookText = (id: string, text: string) =>
    setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, text } : h)))
  const updateHookPersona = (id: string, personaId: PersonaId) =>
    setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, personaId } : h)))

  const loadSample = (ad: SampleAd) => {
    setBrief(ad.brief)
    setActivePersonas(ad.activePersonas)
    setHooks(ad.hooks.map((h) => ({ id: uid(), text: h.text, personaId: h.personaId })))
    setResults([])
    setError(null)
    setSampleImage(ad.image)
  }

  const handleEvaluate = async () => {
    setLoading(true)
    setError(null)
    try {
      setResults(await evaluator.evaluate(brief, hooks))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full">
      <header className="brand-hero px-4 py-12 text-center">
        <p className="kicker mb-3">Mansa Tech · Synthetic Persona Sandbox</p>
        <h1 className="text-4xl sm:text-5xl">
          Project <b>Catalyst</b>
        </h1>
        <p className="sub mt-4">
          Score each hook through a chosen persona · backend: <code>{evaluator.name}</code>
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-6">
          <CreativeInputBoard
            brief={brief}
            hooks={hooks}
            activePersonas={activePersonas}
            personaOrder={PERSONA_ORDER}
            samples={SAMPLE_ADS}
            sampleImage={sampleImage}
            loading={loading}
            canAddHook={hooks.length < MAX_HOOKS}
            onBriefChange={setBrief}
            onToggleActivePersona={toggleActivePersona}
            onAddHook={addHook}
            onRemoveHook={removeHook}
            onHookTextChange={updateHookText}
            onHookPersonaChange={updateHookPersona}
            onLoadSample={loadSample}
            onEvaluate={handleEvaluate}
          />

          {error && (
            <div
              className="px-4 py-3 text-sm"
              style={{
                background: 'rgba(207, 69, 0, 0.08)',
                border: '1px solid var(--color-orange-deep)',
                color: 'var(--color-orange-deep)',
              }}
            >
              {error}
            </div>
          )}

          <ResultsPanel hooks={hooks} results={results} />
        </div>

        <footer
          className="mt-10 text-center"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: 'var(--color-muted)',
          }}
        >
          Persona scores are deterministic simulations unless the Claude backend is enabled
        </footer>
      </main>
    </div>
  )
}
