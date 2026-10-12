import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMinutes, formatWeekday } from '../../lib/format'

type SleepPoint = { date: string; minutes: number | null; quality: number | null }
type CalmPoint = { date: string; minutes: number; sessions: number }

export function SleepChart({ points }: { points: SleepPoint[] }) {
  const data = points.map((point) => ({
    day: formatWeekday(point.date),
    minutes: point.minutes ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={1} />
        <YAxis hide domain={[0, 'dataMax']} />
        <Tooltip formatter={(value) => formatMinutes(Number(value))} cursor={{ fill: 'rgba(78,139,115,0.08)' }} />
        <Bar dataKey="minutes" name="Slept" radius={[4, 4, 0, 0]} fill="#4e8b73" maxBarSize={22} />
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
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={1} />
        <YAxis hide domain={[0, 'dataMax']} />
        <Tooltip formatter={(value) => `${Number(value)} min`} cursor={{ fill: 'rgba(123,111,240,0.08)' }} />
        <Bar dataKey="minutes" name="Calm" radius={[4, 4, 0, 0]} fill="#7b6ff0" maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
