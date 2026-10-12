import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { ExerciseView } from '../../lib/types'

export default function CalmPage() {
  const query = useQuery({
    queryKey: ['calm-exercises'],
    queryFn: () => api<ExerciseView[]>('/calm/exercises'),
    staleTime: Infinity,
  })

  if (query.isLoading) {
    return <p className="text-sm text-muted">Gathering the exercises…</p>
  }
  if (query.isError || !query.data) {
    return <p className="text-sm text-rose-700">Could not load exercises: {query.error?.message}</p>
  }

  const breathing = query.data.filter((exercise) => exercise.type === 'breathing')
  const others = query.data.filter((exercise) => exercise.type !== 'breathing')

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Calm</h1>
        <p className="mt-1 text-sm text-muted">
          Practice earns 1 💎 per minute, and the first session of the day +2 💎.
        </p>
      </header>

      <Link
        to="/calm/sos"
        className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-gem to-[#5d52d6] p-6 text-white shadow-lg shadow-gem/25 transition-transform hover:scale-[1.01]"
      >
        <span className="text-3xl">🆘</span>
        <span>
          <span className="block text-base font-semibold">Calm me now</span>
          <span className="block text-xs text-white/80">
            60-second physiological sigh — the fastest way back down
          </span>
        </span>
        <span className="ml-auto text-2xl">→</span>
      </Link>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Breathing</h2>
        <div className="mt-3 flex flex-col gap-3">
          {breathing.map((exercise) => (
            <Link
              key={exercise.id}
              to={`/calm/${exercise.slug}`}
              className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 transition-colors hover:border-sage"
            >
              <span className="text-2xl">{exercise.sos ? '🆘' : '🌬️'}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {exercise.name}
                  {exercise.sos && (
                    <span className="rounded-full bg-gem-soft px-2 py-0.5 text-[10px] font-medium text-gem">
                      SOS
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted">{exercise.description}</span>
              </span>
              <span className="ml-auto shrink-0 text-xs text-muted">
                {exercise.durationOptions.join(' / ')} min
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Grounding & body
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {others.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center gap-4 rounded-3xl border border-line bg-surface/60 p-5 opacity-70"
            >
              <span className="text-2xl">🧎</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{exercise.name}</span>
                <span className="block truncate text-xs text-muted">{exercise.description}</span>
              </span>
              <span className="ml-auto shrink-0 rounded-full bg-amber-soft px-2.5 py-1 text-[10px] font-medium text-ink-soft">
                Phase 2
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
