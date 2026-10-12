import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatShortDate } from '../../lib/format'

export function WeightChart({ points }: { points: { date: string; kg: number }[] }) {
  const data = points.map((point) => ({
    day: formatShortDate(point.date),
    kg: point.kg,
  }))

  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
        <Tooltip formatter={(value) => `${Number(value)} kg`} />
        <Line type="monotone" dataKey="kg" stroke="#4e8b73" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
