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

  const handleHookChange = (id: string, text: string) =>
    setHooks((prev) => prev.map((h) => (h.id === id ? { ...h, text } : h)))

  const handleEvaluate = () => {
    const result = evaluator.evaluate(brief, hooks)
    setEvaluations(result)
    setBudget(simulateBudget(result))
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
          onBriefChange={setBrief}
          onHookChange={handleHookChange}
          onEvaluate={handleEvaluate}
        />
        <PersonaPanel hooks={hooks} evaluations={evaluations} />
        <BudgetAllocator data={budget} />
      </div>

      <footer className="mt-8 text-center text-xs text-slate-600">
        Persona scores and budget curves are deterministic simulations, not live data.
      </footer>
    </div>
  )
}
