import { useState } from 'react'
import type { CreativeBrief, CreativeHook, HookEvaluation } from './types'
import { evaluator } from './personas'
import { simulateBudget, type DayPoint } from './budget/simulate'
import { CreativeInputBoard } from './components/CreativeInputBoard'
import { PersonaPanel } from './components/PersonaPanel'
import { BudgetAllocator } from './components/BudgetAllocator'

const makeHook = (n: number): CreativeHook => ({ id: `hook-${n}`, text: '' })

export default function App() {
  const [brief, setBrief] = useState<CreativeBrief>({ product: '', audience: '' })
  const [hooks, setHooks] = useState<CreativeHook[]>([makeHook(1), makeHook(2), makeHook(3)])
  const [evaluations, setEvaluations] = useState<HookEvaluation[]>([])
  const [budget, setBudget] = useState<DayPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleHookChange = (id: string, text: string) =>
    setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, text } : h)))

  const handleEvaluate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await evaluator.evaluate(brief, hooks)
      setEvaluations(result)
      setBudget(simulateBudget(result))
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
          Pressure-test ad hooks · backend: <code>{evaluator.name}</code>
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-6">
          <CreativeInputBoard
            brief={brief}
            hooks={hooks}
            loading={loading}
            onBriefChange={setBrief}
            onHookChange={handleHookChange}
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

          <PersonaPanel hooks={hooks} evaluations={evaluations} />
          <BudgetAllocator data={budget} />
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
          Persona scores and budget curves are deterministic simulations unless the Claude backend is enabled
        </footer>
      </main>
    </div>
  )
}
