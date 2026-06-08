import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DayPoint } from '../budget/simulate'

interface Props {
  data: DayPoint[]
}

// Brand palette for the three channels.
const SERIES = [
  { key: 'meta', label: 'Meta', color: '#c03c00' },      // brand orange
  { key: 'google', label: 'Google', color: '#222222' },  // ink
  { key: 'linkedin', label: 'LinkedIn', color: '#e67e22' }, // bright orange
] as const

export function BudgetAllocator({ data }: Props) {
  if (!data.length) {
    return (
      <section className="panel p-6 sm:p-8">
        <p className="kicker">03 · Allocation</p>
        <h2 className="panel-title mt-1">Budget Allocator</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          A simulated 7-day reallocation appears here after evaluation.
        </p>
      </section>
    )
  }

  return (
    <section className="panel p-6 sm:p-8">
      <p className="kicker">03 · Allocation</p>
      <h2 className="panel-title mt-1">Budget Allocator</h2>
      <p className="mt-2 mb-4 text-sm text-[var(--color-text)]">
        Scripted 7-day model — illustrative, not connected to live auctions.
      </p>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="#efefef" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#afafaf" fontSize={12} fontFamily="Oswald" />
            <YAxis stroke="#afafaf" fontSize={12} unit="$" fontFamily="Oswald" />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #efefef',
                borderRadius: 0,
                fontSize: 12,
                fontFamily: 'Ubuntu',
              }}
              formatter={(v) => [`$${Number(v)}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Oswald', textTransform: 'uppercase', letterSpacing: '1px' }} />
            {SERIES.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
