import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import GemBurst from '../../components/GemBurst'
import type { HabitPart, HabitsResponse, HabitsToday } from '../../lib/types'

const PARTS: { key: HabitPart; label: string; icon: string }[] = [
  { key: 'morning', label: 'Morning', icon: '☀️' },
  { key: 'afternoon', label: 'Afternoon', icon: '🌤️' },
  { key: 'evening', label: 'Evening', icon: '🌙' },
  { key: 'anytime', label: 'Anytime', icon: '✨' },
]

const EMOJIS = ['✅', '🚶', '📖', '💪', '🧘', '🥗', '💤', '📵', '🧹', '💧', '✍️', '🎯']

const SUGGESTIONS: { emoji: string; name: string; part: HabitPart }[] = [
  { emoji: '🚶', name: 'Morning walk', part: 'morning' },
  { emoji: '🧘', name: 'Meditate 10 min', part: 'morning' },
  { emoji: '💪', name: 'Workout', part: 'anytime' },
  { emoji: '📖', name: 'Read 20 pages', part: 'evening' },
  { emoji: '📵', name: 'No phone after 10', part: 'evening' },
  { emoji: '💤', name: 'Sleep by 11', part: 'evening' },
]

/** The day's rhythm: recurring practices grouped by day part, with streaks and history. */
export default function HabitsCard() {
  const queryClient = useQueryClient()
  const [managing, setManaging] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✅')
  const [newPart, setNewPart] = useState<HabitPart>('morning')
  const [burst, setBurst] = useState<number | null>(null)

  const today = useQuery({
    queryKey: ['habits-today'],
    queryFn: () => api<HabitsToday>('/habits/today'),
  })

  function apply(response: HabitsResponse) {
    queryClient.setQueryData(['habits-today'], response.today)
    queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
    if (response.rewards.gemsAwarded > 0) {
      setBurst(response.rewards.gemsAwarded)
    }
  }

  const toggle = useMutation({
    mutationFn: (id: number) => api<HabitsResponse>(`/habits/${id}/toggle`, { method: 'POST' }),
    onSuccess: apply,
  })

  const create = useMutation({
    mutationFn: (habit: { name: string; emoji: string; part: HabitPart }) =>
      api<HabitsResponse>('/habits', { method: 'POST', body: JSON.stringify(habit) }),
    onSuccess: (response) => {
      setNewName('')
      apply(response)
    },
  })

  const archive = useMutation({
    mutationFn: (id: number) => api<void>(`/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits-today'] }),
  })

  const data = today.data
  const habits = data?.habits ?? []
  const progress = data && data.totalCount > 0 ? Math.round((data.doneCount / data.totalCount) * 100) : 0

  return (
    <section className="rounded-3xl border border-line bg-surface p-6">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">🌿 My rhythm</h2>
        {data && data.totalCount > 0 && (
          <span className="rounded-full bg-sage-mist px-2.5 py-0.5 text-[10px] font-medium text-sage-deep">
            {data.doneCount}/{data.totalCount} today
          </span>
        )}
        {data && data.totalCount > 0 && (
          <span className="text-[10px] text-muted">
            Week {data.weekDone}/{data.weekTotal}
          </span>
        )}
        <button
          type="button"
          onClick={() => setManaging(!managing)}
          className="ml-auto text-xs text-muted underline-offset-2 transition-colors hover:text-ink-soft hover:underline"
        >
          {managing ? 'Done editing' : 'Edit'}
        </button>
      </div>

      {data && data.totalCount > 0 && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-sage transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {!data && <p className="mt-3 text-xs text-muted">Loading your rhythm…</p>}

      {data && habits.length === 0 && !managing && (
        <div className="mt-4">
          <p className="text-sm text-ink-soft">
            No practices yet — your rhythm starts with one tap:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.name}
                type="button"
                disabled={create.isPending}
                onClick={() => create.mutate(suggestion)}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-sage disabled:opacity-50"
              >
                {suggestion.emoji} {suggestion.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {habits.length > 0 && (
        <div className="mt-4 flex flex-col gap-5">
          {PARTS.map((part) => {
            const group = habits.filter((habit) => habit.part === part.key)
            if (group.length === 0) return null
            return (
              <div key={part.key}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  {part.icon} {part.label}
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {group.map((habit) => (
                    <li
                      key={habit.id}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => toggle.mutate(habit.id)}
                        disabled={toggle.isPending}
                        title={habit.done ? 'Undo' : 'Mark done (+1 💎)'}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition-all disabled:opacity-60 ${
                          habit.done
                            ? 'border-sage bg-sage text-white'
                            : 'border-line bg-surface text-transparent hover:border-sage hover:text-sage'
                        }`}
                      >
                        ✓
                      </button>
                      <span aria-hidden>{habit.emoji}</span>
                      <span
                        className={`min-w-0 flex-1 truncate text-sm ${
                          habit.done ? 'font-medium text-ink' : 'text-ink-soft'
                        }`}
                      >
                        {habit.name}
                      </span>
                      {habit.streak > 0 && (
                        <span className="shrink-0 text-[10px] font-medium text-ink-soft">
                          🔥 {habit.streak}
                        </span>
                      )}
                      <span className="hidden shrink-0 gap-1 sm:flex" title="Last 7 days">
                        {habit.last7.map((done, index) => (
                          <span
                            key={index}
                            className={`h-1.5 w-1.5 rounded-full ${done ? 'bg-sage' : 'bg-line'}`}
                          />
                        ))}
                      </span>
                      {managing && (
                        <button
                          type="button"
                          onClick={() => archive.mutate(habit.id)}
                          disabled={archive.isPending}
                          className="shrink-0 text-xs text-muted transition-colors hover:text-rose-300"
                          title="Remove practice"
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {(managing || (data && habits.length === 0)) && (
        <div className="mt-5 rounded-2xl border border-dashed border-line p-4">
          <p className="text-xs font-medium text-ink-soft">Add a practice</p>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none transition-colors focus:border-sage"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && newName.trim()) {
                    create.mutate({ name: newName.trim(), emoji: newEmoji, part: newPart })
                  }
                }}
                placeholder="e.g. Evening walk"
                maxLength={100}
              />
              <button
                type="button"
                onClick={() => newName.trim() && create.mutate({ name: newName.trim(), emoji: newEmoji, part: newPart })}
                disabled={create.isPending || !newName.trim()}
                className="shrink-0 rounded-full bg-sage px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-50"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewEmoji(emoji)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-base transition-all ${
                    newEmoji === emoji ? 'border-sage bg-sage-mist' : 'border-line bg-paper hover:border-sage/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PARTS.map((part) => (
                <button
                  key={part.key}
                  type="button"
                  onClick={() => setNewPart(part.key)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    newPart === part.key
                      ? 'bg-sage-mist font-medium text-sage-deep'
                      : 'bg-paper text-muted hover:text-ink-soft'
                  }`}
                >
                  {part.icon} {part.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(create.isError || toggle.isError || archive.isError) && (
        <p className="mt-3 text-xs text-rose-300">
          {(create.error ?? toggle.error ?? archive.error)?.message}
        </p>
      )}
    </section>
  )
}
