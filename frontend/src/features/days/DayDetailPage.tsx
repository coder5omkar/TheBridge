import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { isDayEditableLocally, moodEmoji } from '../../lib/checkin'
import { formatMinutes, formatTime } from '../../lib/format'
import type { DayRecord, DiaryView } from '../../lib/types'

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍲',
  snack: '🍎',
}

const ANSWER_ROWS: { label: string; icon: string; key: keyof DiaryView }[] = [
  { label: 'Intention', icon: '🌅', key: 'morningIntent' },
  { label: 'Best moment', icon: '🏆', key: 'highlights' },
  { label: 'Drained by', icon: '😮‍💨', key: 'drained' },
  { label: 'Gratitude', icon: '🙏', key: 'gratitude' },
  { label: 'Evening review', icon: '🌙', key: 'eveningReview' },
  { label: 'On my mind', icon: '📖', key: 'body' },
]

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>()

  const query = useQuery({
    queryKey: ['day', date],
    queryFn: () => api<DayRecord>(`/days/${date}`),
    enabled: date != null,
  })

  if (query.isLoading) {
    return <p className="text-sm text-muted">Opening the day…</p>
  }
  if (query.isError || !query.data) {
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-xl font-semibold">Could not open this day</h1>
        <p className="mt-2 text-sm text-ink-soft">{query.error?.message}</p>
        <Link to="/days" className="mt-4 inline-block text-sm text-sage underline-offset-2 hover:underline">
          ← Back to Days
        </Link>
      </div>
    )
  }

  const record = query.data
  const entry = record.entry
  const sealed = entry?.sealedAt != null
  const editable = entry ? entry.editable : isDayEditableLocally(record.date)
  const dateLabel = new Date(`${record.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const empty =
    !entry &&
    !record.sleep &&
    record.sessions.length === 0 &&
    record.meals.length === 0 &&
    record.weights.length === 0 &&
    record.gemsEarned === 0

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Link to="/days" className="text-xs text-muted underline-offset-2 hover:text-ink-soft hover:underline">
        ← Days
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{dateLabel}</h1>
        <span className="flex flex-wrap gap-2">
          {sealed && (
            <span className="rounded-full bg-[#1b2e22] px-3 py-1 text-xs font-medium text-ink-soft">
              📔 Sealed {formatTime(entry!.sealedAt!)}
            </span>
          )}
          {editable ? (
            <span className="rounded-full bg-sage-mist px-3 py-1 text-xs font-medium text-sage-deep">
              ✍️ editable till midnight
            </span>
          ) : (
            <span className="rounded-full bg-paper px-3 py-1 text-xs text-muted">🔒 frozen</span>
          )}
        </span>
      </header>

      {editable && (
        <Link
          to={`/diary/${record.date}`}
          className="rounded-full bg-sage px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-sage-deep"
        >
          ✍️ {entry ? 'Edit this day' : 'Add the check-in'} · editable till midnight
        </Link>
      )}

      {empty && (
        <div className="rounded-3xl border border-line bg-surface p-8 text-center text-sm text-muted">
          Nothing was recorded this day.
        </div>
      )}

      {entry && (
        <>
          <section className="rounded-3xl border border-line bg-surface p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">
                {moodEmoji(entry.mood)} mood {entry.mood ?? '—'}/5
              </span>
              <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">
                ⚡ {entry.energy ?? '—'}/5
              </span>
              <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">
                💧 {entry.waterCups ?? 0}
              </span>
              {entry.moved != null && (
                <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">
                  {entry.moved ? '🚶 moved' : '🪑 rested'}
                </span>
              )}
              {entry.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sage-mist px-3 py-1 text-xs text-sage-deep">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-line bg-surface">
            {ANSWER_ROWS.filter((row) => entry[row.key]).map((row) => (
              <div key={row.key} className="border-b border-line/60 px-5 py-4 last:border-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                  {row.icon} {row.label}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">
                  {entry[row.key] as string}
                </p>
              </div>
            ))}
          </section>
        </>
      )}

      {record.sleep && record.sleep.bedTime != null && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider">🌙 Sleep</h2>
          <p className="mt-3 text-sm">
            <span className="font-semibold">{formatTime(record.sleep.bedTime)}</span>
            <span className="mx-2 text-muted">→</span>
            <span className="font-semibold">{record.sleep.wakeTime ? formatTime(record.sleep.wakeTime) : '—'}</span>
            {record.sleep.durationMinutes != null && (
              <span className="ml-3 rounded-full bg-[#16304a] px-3 py-1 text-xs font-medium text-ink-soft">
                {formatMinutes(record.sleep.durationMinutes)}
              </span>
            )}
          </p>
        </section>
      )}

      {record.sessions.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            🧘 Calm · {record.sessions.reduce((total, session) => total + session.minutes, 0)} min
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {record.sessions.map((session, index) => (
              <li
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-2.5"
              >
                <span className="min-w-0 flex-1 text-sm text-ink-soft">
                  {session.exerciseName}
                  {session.kind === 'sos' && (
                    <span className="ml-2 rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-medium text-sage-deep">
                      SOS
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted">{session.minutes} min</span>
                <span className="text-xs text-muted">{formatTime(session.startedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {record.meals.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider">🍽️ Food</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {record.meals.map((meal) => (
              <li
                key={meal.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-2.5"
              >
                <span aria-hidden>{MEAL_ICONS[meal.mealType]}</span>
                {meal.photoUrl && (
                  <img src={meal.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                  {meal.description || meal.mealType}
                </span>
                {meal.homeCooked && (
                  <span className="rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-medium text-sage-deep">
                    🏠 home
                  </span>
                )}
                <span className="shrink-0 text-xs text-muted">{formatTime(meal.eatenAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {record.weights.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider">⚖️ Weight</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {record.weights.map((weight, index) => (
              <li
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-2.5"
              >
                <span className="flex-1 text-sm text-ink-soft">{weight.kg} kg</span>
                <span className="text-xs text-muted">{formatTime(weight.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {record.gemsEarned !== 0 && (
        <p className="text-center text-xs text-muted">
          💎 {record.gemsEarned} gems earned this day
        </p>
      )}
    </div>
  )
}
