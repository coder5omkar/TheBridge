import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { DashboardToday } from '../../lib/types'

const LOOP_ITEMS = [
  { icon: '✍️', label: 'Diary entry', note: 'Phase 1' },
  { icon: '🧘', label: 'Calm practice', note: 'Phase 1' },
  { icon: '🌙', label: 'Sleep log', note: 'Phase 1' },
]

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard-today'],
    queryFn: () => api<DashboardToday>('/dashboard/today'),
  })

  if (query.isLoading) {
    return <p className="text-sm text-muted">Loading your day…</p>
  }

  if (query.isError || !query.data) {
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-xl font-semibold">Could not load your day</h1>
        <p className="mt-2 text-sm text-ink-soft">{query.error?.message}</p>
      </div>
    )
  }

  const data = query.data
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = new Date(`${data.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted">{dateLabel}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {greeting}, {data.user.displayName}
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-xs font-medium text-muted">Gems</p>
          <p className="mt-2 text-3xl font-semibold text-gem">{data.gems.balance}</p>
          <p className="mt-1 text-xs text-muted">+{data.gems.earnedToday} earned today</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-xs font-medium text-muted">Practice streak</p>
          <p className="mt-2 text-3xl font-semibold text-sage">
            {data.streak.current}
            <span className="ml-1 text-sm font-normal text-muted">
              {data.streak.current === 1 ? 'day' : 'days'}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {data.streak.practicedToday ? 'Practiced today — beautiful.' : 'Any calm practice keeps it alive.'}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold">Today's loop</h2>
        <p className="mt-1 text-xs text-muted">
          capture → regulate → see the pattern → adjust → get rewarded
        </p>
        <ul className="mt-5 flex flex-col gap-3">
          {LOOP_ITEMS.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface text-[10px] text-muted">
                ○
              </span>
              <span aria-hidden>{item.icon}</span>
              <span className="text-sm text-ink-soft">{item.label}</span>
              <span className="ml-auto rounded-full bg-amber-soft px-2.5 py-0.5 text-[10px] font-medium text-ink-soft">
                {item.note}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
