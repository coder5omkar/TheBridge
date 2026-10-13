import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMinutes, formatWeekday } from '../../lib/format'

type SleepPoint = { date: string; minutes: number | null; quality: number | null }
type CalmPoint = { date: string; minutes: number; sessions: number }

const AXIS_TICK = { fontSize: 10, fill: '#83829b' }
const TOOLTIP_STYLE = {
  background: '#1f1f2a',
  border: '1px solid #2f2f40',
  borderRadius: 14,
  color: '#f2f1fb',
  fontSize: 12,
}

export function SleepChart({ points }: { points: SleepPoint[] }) {
  const data = points.map((point) => ({
    day: formatWeekday(point.date),
    minutes: point.minutes ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS_TICK} interval={1} />
        <YAxis hide domain={[0, 'dataMax']} />
        <Tooltip
          formatter={(value) => formatMinutes(Number(value))}
          cursor={{ fill: 'rgba(86, 204, 242, 0.08)' }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#c6c5da' }}
        />
        <Bar dataKey="minutes" name="Slept" radius={[6, 6, 0, 0]} fill="#56ccf2" maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CalmChart({ points }: { points: CalmPoint[] }) {
  const data = points.map((point) => ({
    day: formatWeekday(point.date),
    minutes: point.minutes,
  }))

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS_TICK} interval={1} />
        <YAxis hide domain={[0, 'dataMax']} />
        <Tooltip
          formatter={(value) => `${Number(value)} min`}
          cursor={{ fill: 'rgba(139, 124, 255, 0.08)' }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#c6c5da' }}
        />
        <Bar dataKey="minutes" name="Calm" radius={[6, 6, 0, 0]} fill="#8b7cff" maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
