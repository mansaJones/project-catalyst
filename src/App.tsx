import { useEffect, useRef, useState } from 'react'
import type { CreativeBrief, CreativeHook, HookResult, PersonaId } from './types'
import { evaluator, PERSONA_ORDER } from './personas'
import { SAMPLE_ADS, type SampleAd } from './samples'
import { CreativeInputBoard } from './components/CreativeInputBoard'
import { ResultsPanel } from './components/PersonaPanel'
import { AdStudio } from './components/AdStudio'

const uid = () => Math.random().toString(36).slice(2, 9)
const DEFAULT_ACTIVE: PersonaId[] = ['skeptic', 'impulse', 'critic']
const makeHook = (): CreativeHook => ({ id: uid(), text: '' })

export default function App() {
  const [brief, setBrief] = useState<CreativeBrief>({ product: '', audience: '' })
  const [activePersonas, setActivePersonas] = useState<PersonaId[]>(DEFAULT_ACTIVE)
  const [hooks, setHooks] = useState<CreativeHook[]>([makeHook(), makeHook(), makeHook()])
  const [results, setResults] = useState<HookResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sampleImage, setSampleImage] = useState<string | null>(null)
  const [adHookId, setAdHookId] = useState<string | null>(null)
  const [sampleTick, setSampleTick] = useState(0)

  const toggleActivePersona = (id: PersonaId) =>
    setActivePersonas((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      return next.length === 0 ? prev : next
    })

  const removeHook = (hid: string) => {
    setHooks((prev) => (prev.length <= 1 ? prev : prev.filter((h) => h.id !== hid)))
    setAdHookId((cur) => (cur === hid ? null : cur))
  }
  const updateHookText = (hid: string, text: string) =>
    setHooks((prev) => prev.map((h) => (h.id === hid ? { ...h, text } : h)))

  const loadSample = (ad: SampleAd) => {
    setBrief(ad.brief)
    setActivePersonas(ad.activePersonas)
    setHooks(ad.hooks.map((text) => ({ id: uid(), text })))
    setResults([])
    setError(null)
    setSampleImage(ad.image)
    setAdHookId(null)
    setSampleTick((n) => n + 1)
  }

  const handleEvaluate = async () => {
    setLoading(true)
    setError(null)
    try {
      setResults(await evaluator.evaluate(brief, hooks, activePersonas))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed.')
    } finally {
      setLoading(false)
    }
  }

  const toggleAd = (hid: string) => setAdHookId((cur) => (cur === hid ? null : hid))
  const adHook = hooks.find((h) => h.id === adHookId) ?? null

  const inputRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const studioRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (sampleTick) inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [sampleTick])
  useEffect(() => {
    if (results.length) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [results])
  useEffect(() => {
    if (adHookId) studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [adHookId])

  return (
    <div className="min-h-full">
      <header className="brand-hero px-4 py-12 text-center">
        <p className="kicker mb-3">Mansa Tech · Synthetic Persona Sandbox</p>
        <h1 className="text-4xl sm:text-5xl">
          Project <b>Catalyst</b>
        </h1>
        <p className="sub mt-4">
          Score hooks, then build an ad from the winner · backend: <code>{evaluator.name}</code>
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-6">
          <div ref={inputRef}>
          <CreativeInputBoard
            brief={brief}
            hooks={hooks}
            activePersonas={activePersonas}
            personaOrder={PERSONA_ORDER}
            samples={SAMPLE_ADS}
            sampleImage={sampleImage}
            loading={loading}
            onBriefChange={setBrief}
            onToggleActivePersona={toggleActivePersona}
            onRemoveHook={removeHook}
            onHookTextChange={updateHookText}
            onLoadSample={loadSample}
            onEvaluate={handleEvaluate}
          />
          </div>

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

          <div ref={resultsRef}>
            <ResultsPanel
              hooks={hooks}
              results={results}
              personaOrder={PERSONA_ORDER}
              selectedAdHookId={adHookId}
              onCreateAd={toggleAd}
            />
          </div>

          {adHook && (
            <div ref={studioRef}>
              <AdStudio
                hookText={adHook.text}
                brief={brief}
                image={sampleImage}
                onClose={() => setAdHookId(null)}
              />
            </div>
          )}
        </div>

        <footer
          className="mt-10 text-center"
          style={{
            fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1.5,
            textTransform: 'uppercase', color: 'var(--color-muted)',
          }}
        >
          Persona scores are deterministic simulations unless the Claude backend is enabled
        </footer>
      </main>
    </div>
  )
}
