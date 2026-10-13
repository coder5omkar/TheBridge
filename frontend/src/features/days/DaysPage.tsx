import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { moodEmoji } from '../../lib/checkin'
import { formatMinutes } from '../../lib/format'
import type { DaySummary } from '../../lib/types'

export default function DaysPage() {
  const query = useQuery({
    queryKey: ['days-calendar'],
    queryFn: () => api<DaySummary[]>('/days/calendar?days=30'),
  })

  if (query.isLoading) {
    return <p className="text-sm text-muted">Opening your kept days…</p>
  }
  if (query.isError || !query.data) {
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-xl font-semibold">Could not load days</h1>
        <p className="mt-2 text-sm text-ink-soft">{query.error?.message}</p>
      </div>
    )
  }

  const days = [...query.data].reverse() // most recent first
  const todayKey = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Days</h1>
        <p className="mt-1 text-sm text-muted">
          Every day you've kept — sealed days stay exactly as they were.
        </p>
      </header>

      {days.length === 0 && (
        <div className="rounded-3xl border border-line bg-surface p-8 text-center">
          <p className="text-3xl">📔</p>
          <p className="mt-3 text-sm text-ink-soft">
            Your kept days will appear here. Live today, write the evening review, seal it.
          </p>
        </div>
      )}

      {days.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {days.map((day) => {
            const dateLabel = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })
            const isToday = day.date === todayKey
            return (
              <li key={day.date}>
                <Link
                  to={`/days/${day.date}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-sage/60"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl ${
                      day.sealed ? 'bg-[#1b2e22]' : 'bg-paper'
                    }`}
                  >
                    <span className="text-lg leading-none">📔</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {dateLabel}
                      {isToday && (
                        <span className="rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-medium text-sage-deep">
                          today
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                      {day.sealed && <span className="text-sage-deep">sealed</span>}
                      {day.mood != null && <span>{moodEmoji(day.mood)} {day.mood}/5</span>}
                      {day.calmMinutes > 0 && <span>🧘 {day.calmMinutes}m</span>}
                      {day.sleepMinutes != null && <span>😴 {formatMinutes(day.sleepMinutes)}</span>}
                      {day.meals > 0 && <span>🍽️ {day.meals}</span>}
                      <span>💎 {day.gems}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-muted">→</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
