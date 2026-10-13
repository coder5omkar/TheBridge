import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { DashboardToday, HabitsToday } from '../../lib/types'
import { CalmChart, SleepChart } from './Charts'
import InsightsCard from './InsightsCard'
import QuickActions from './QuickActions'
import HabitsCard from '../diary/HabitsCard'
import ThoughtsWidget from '../diary/ThoughtsWidget'

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ['dashboard-today'],
    queryFn: () => api<DashboardToday>('/dashboard/today'),
  })

  const habits = useQuery({
    queryKey: ['habits-today'],
    queryFn: () => api<HabitsToday>('/habits/today'),
  })

  if (query.isLoading) {
    return <p className="text-sm text-muted">Loading your day…</p>
  }

  if (query.isError || !query.data || !query.data.today || !query.data.charts) {
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-xl font-semibold">Could not load your day</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {query.error?.message ?? 'The data looks stale — try refreshing the page.'}
        </p>
      </div>
    )
  }

  const data = query.data
  const hour = new Date().getHours()
  const greeting =
    hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = new Date(`${data.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const today = new Date(`${data.date}T00:00:00`)
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today)
    day.setDate(day.getDate() - (6 - index))
    return {
      day,
      rhythmDone: habits.data?.habits.some((habit) => habit.last7[index]) ?? false,
    }
  })

  const doneCount = habits.data?.doneCount ?? 0
  const totalCount = habits.data?.totalCount ?? 0
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      {/* Main column — act, then observe */}
      <div className="flex min-w-0 flex-col gap-5">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4e54f5] via-[#6d5af7] to-[#8b5cf6] p-6 text-white">
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium">
            {dateLabel}
          </span>
          <h1 className="mt-4 max-w-sm text-3xl font-bold leading-tight tracking-tight">
            {greeting}, {data.user.displayName} 🌟
          </h1>
          <p className="mt-2 text-sm text-white/80">
            {totalCount > 0
              ? `${doneCount} of ${totalCount} practices checked today`
              : 'Build your daily rhythm — one tap to start'}
          </p>
          <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
          </div>
          <Link
            to="/diary"
            title="Open the daily check-in"
            className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg text-[#4e54f5] shadow-lg transition-transform hover:scale-105"
          >
            →
          </Link>
        </section>

        <QuickActions />
        <HabitsCard />
        <ThoughtsWidget />
        <InsightsCard />

        {/* Charts */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider">Insights</h2>
          <div className="rounded-3xl border border-line bg-surface p-6">
            <h3 className="text-sm font-semibold">Sleep · last 14 nights</h3>
            <p className="mb-4 mt-1 text-xs text-muted">Hours slept, labelled by wake-up day</p>
            <SleepChart points={data.charts.sleep} />
          </div>
          <div className="rounded-3xl border border-line bg-surface p-6">
            <h3 className="text-sm font-semibold">Calm · last 14 days</h3>
            <p className="mb-4 mt-1 text-xs text-muted">Minutes of breathing and grounding</p>
            <CalmChart points={data.charts.calm} />
          </div>
        </section>
      </div>

      {/* Right rail — status at a glance */}
      <aside className="flex flex-col gap-4">
        <section className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gem-soft text-base">💎</span>
            <div>
              <p className="text-xs font-medium text-muted">Gems</p>
              <p className="text-xl font-bold leading-tight text-gem">{data.gems.balance}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">+{data.gems.earnedToday} earned today</p>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3a2a1e] text-base">🔥</span>
            <div>
              <p className="text-xs font-medium text-muted">Practice streak</p>
              <p className="text-xl font-bold leading-tight text-sage">
                {data.streak.current}
                <span className="ml-1 text-xs font-normal text-muted">
                  {data.streak.current === 1 ? 'day' : 'days'}
                </span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            {data.streak.practicedToday ? 'Practiced today — beautiful.' : 'Any practice keeps it alive.'}
          </p>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider">This week</h2>
            <span className="text-[10px] text-muted">rhythm</span>
          </div>
          <div className="mt-3 flex justify-between gap-0.5">
            {week.map((entry, index) => (
              <div
                key={index}
                className={`flex w-8 flex-col items-center gap-1 rounded-xl py-1.5 ${
                  index === 6 ? 'bg-sage text-white' : 'bg-paper text-ink-soft'
                }`}
              >
                <span className="text-[9px] uppercase">
                  {entry.day.toLocaleDateString(undefined, { weekday: 'narrow' })}
                </span>
                <span className="text-xs font-medium">{entry.day.getDate()}</span>
                <span
                  className={`h-1 w-1 rounded-full ${
                    entry.rhythmDone ? (index === 6 ? 'bg-white' : 'bg-sage') : 'bg-transparent'
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        <Link
          to="/calm/sos"
          className="group rounded-3xl border border-line bg-surface p-5 transition-colors hover:border-sage/60"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider">Quick reset</h2>
            <span className="text-[10px] text-muted">60 sec</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4e54f5] to-[#8b5cf6] text-2xl">
              🌬️
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Physiological sigh</span>
              <span className="block text-xs text-muted">The fastest way back down</span>
            </span>
            <span className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm text-[#141417] shadow transition-transform group-hover:scale-105">
              ▶
            </span>
          </div>
        </Link>
      </aside>
    </div>
  )
}
