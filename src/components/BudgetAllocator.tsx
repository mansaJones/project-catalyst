import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DayPoint } from '../budget/simulate'

interface Props {
  data: DayPoint[]
}

const SERIES = [
  { key: 'meta', label: 'Meta', color: 'var(--color-meta)' },
  { key: 'google', label: 'Google', color: 'var(--color-google)' },
  { key: 'linkedin', label: 'LinkedIn', color: 'var(--color-linkedin)' },
] as const

export function BudgetAllocator({ data }: Props) {
  if (!data.length) {
    return (
      <section className={panelCls}>
        <h2 className="mb-1 text-lg font-semibold">3 · Budget Allocator</h2>
        <p className="text-sm text-slate-500">A simulated 7-day reallocation appears here after evaluation.</p>
      </section>
    )
  }

  return (
    <section className={panelCls}>
      <h2 className="mb-1 text-lg font-semibold">3 · Budget Allocator</h2>
      <p className="mb-4 text-sm text-slate-400">Scripted 7-day model — illustrative, not connected to live auctions.</p>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="var(--color-edge)" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} unit="$" />
            <Tooltip
              contentStyle={{ background: 'var(--color-ink)', border: '1px solid var(--color-edge)', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`$${Number(v)}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SERIES.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

const panelCls = 'rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-5'
