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
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: '#83829b' }}
          interval="preserveStartEnd"
        />
        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
        <Tooltip
          formatter={(value) => `${Number(value)} kg`}
          contentStyle={{
            background: '#1f1f2a',
            border: '1px solid #2f2f40',
            borderRadius: 14,
            color: '#f2f1fb',
            fontSize: 12,
          }}
          labelStyle={{ color: '#c6c5da' }}
        />
        <Line
          type="monotone"
          dataKey="kg"
          stroke="#5b55f6"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#5b55f6', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
