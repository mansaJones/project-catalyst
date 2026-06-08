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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Project Catalyst</h1>
        <p className="text-sm text-slate-400">
          Synthetic persona sandbox · backend: <code className="text-slate-300">{evaluator.name}</code>
        </p>
      </header>

      <div className="space-y-5">
        <CreativeInputBoard
          brief={brief}
          hooks={hooks}
          loading={loading}
          onBriefChange={setBrief}
          onHookChange={handleHookChange}
          onEvaluate={handleEvaluate}
        />

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <PersonaPanel hooks={hooks} evaluations={evaluations} />
        <BudgetAllocator data={budget} />
      </div>

      <footer className="mt-8 text-center text-xs text-slate-600">
        Persona scores and budget curves are deterministic simulations unless the Claude backend is enabled.
      </footer>
    </div>
  )
}
