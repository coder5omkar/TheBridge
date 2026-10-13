import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatMinutes } from '../../lib/format'
import type { DashboardToday, HabitsToday } from '../../lib/types'
import { CalmChart, SleepChart } from './Charts'

const QUICK_LINKS = [
  { to: '/calm', icon: '🧘', label: 'Calm', tint: 'bg-sage-mist' },
  { to: '/diary', icon: '✍️', label: 'Diary', tint: 'bg-gem-soft' },
  { to: '/health', icon: '🩺', label: 'Health', tint: 'bg-[#1d2e25]' },
  { to: '/diary', icon: '🌿', label: 'Rhythm', tint: 'bg-[#1d2636]' },
]

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

  const rhythmRow = habits.data
    ? {
        to: '/diary',
        icon: '🌿',
        label: 'My rhythm',
        done: habits.data.totalCount > 0 && habits.data.doneCount === habits.data.totalCount,
        detail:
          habits.data.totalCount > 0
            ? `${habits.data.doneCount}/${habits.data.totalCount} practices · ${habits.data.weekDone} this week`
            : 'Build your daily rhythm — one tap to start',
      }
    : null

  const loop = [
    ...(rhythmRow ? [rhythmRow] : []),
    {
      to: '/diary',
      icon: '✍️',
      label: 'Diary & thoughts',
      done: data.today.diary.done,
      detail: data.today.diary.done
        ? `Mood ${data.today.diary.mood ?? '—'}/5 — evening review earns +3 💎`
        : 'Mood, intention, thoughts, evening review',
    },
    {
      to: '/calm',
      icon: '🧘',
      label: 'Calm practice',
      done: data.today.calm.sessions > 0,
      detail:
        data.today.calm.minutes > 0
          ? `${formatMinutes(data.today.calm.minutes)} practiced today`
          : 'A 60-second reset already counts',
    },
    {
      to: '/diary',
      icon: '🌙',
      label: 'Sleep',
      done: data.today.sleep.logged,
      detail: data.today.sleep.logged
        ? data.today.sleep.durationMinutes != null
          ? `Slept ${formatMinutes(data.today.sleep.durationMinutes)}`
          : 'Wake-up logged'
        : 'Bedtime and wake-up live in the diary',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted">{dateLabel}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {greeting}, {data.user.displayName} 🌟
        </h1>
      </header>

      <section className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 text-sm text-ink-soft transition-colors hover:border-sage"
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${item.tint}`}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gem-soft text-sm">💎</span>
            <p className="text-xs font-medium text-muted">Gems</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-gem">{data.gems.balance}</p>
          <p className="mt-1 text-xs text-muted">+{data.gems.earnedToday} earned today</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3a2a1e] text-sm">🔥</span>
            <p className="text-xs font-medium text-muted">Practice streak</p>
          </div>
          <p className="mt-3 text-3xl font-semibold text-sage">
            {data.streak.current}
            <span className="ml-1 text-sm font-normal text-muted">
              {data.streak.current === 1 ? 'day' : 'days'}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {data.streak.practicedToday
              ? 'Practiced today — beautiful.'
              : 'Any calm practice or log keeps it alive.'}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">This week</h2>
          <span className="text-[10px] uppercase tracking-widest text-muted">rhythm</span>
        </div>
        <div className="mt-4 flex justify-between gap-1">
          {week.map((entry, index) => (
            <div
              key={index}
              className={`flex w-10 flex-col items-center gap-1 rounded-2xl py-2 ${
                index === 6 ? 'bg-sage text-white' : 'bg-paper text-ink-soft'
              }`}
            >
              <span className="text-[10px] uppercase">
                {entry.day.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
              <span className="text-sm font-medium">{entry.day.getDate()}</span>
              <span
                className={`h-1 w-1 rounded-full ${
                  entry.rhythmDone ? (index === 6 ? 'bg-white' : 'bg-sage') : 'bg-transparent'
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold">Today's loop</h2>
        <p className="mt-1 text-xs text-muted">
          capture → regulate → see the pattern → adjust → get rewarded
        </p>
        <ul className="mt-5 flex flex-col gap-3">
          {loop.map((item) => (
            <li key={item.label}>
              <Link
                to={item.to}
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3 transition-colors hover:border-sage"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    item.done ? 'bg-sage text-white' : 'border border-line bg-surface text-muted'
                  }`}
                >
                  {item.done ? '✓' : '○'}
                </span>
                <span aria-hidden>{item.icon}</span>
                <span className="text-sm font-medium text-ink-soft">{item.label}</span>
                <span className="ml-auto hidden text-xs text-muted sm:block">{item.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Sleep · last 14 nights</h2>
          <p className="mt-1 mb-4 text-xs text-muted">Hours slept, labelled by wake-up day</p>
          <SleepChart points={data.charts.sleep} />
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Calm · last 14 days</h2>
          <p className="mt-1 mb-4 text-xs text-muted">Minutes of breathing and grounding</p>
          <CalmChart points={data.charts.calm} />
        </div>
      </section>
    </div>
  )
}
