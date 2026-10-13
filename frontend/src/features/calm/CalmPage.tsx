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
    return <p className="text-sm text-rose-300">Could not load exercises: {query.error?.message}</p>
  }

  const playable = query.data.filter(
    (exercise) => exercise.type === 'breathing' || exercise.type === 'grounding',
  )

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="enter-up">
        <h1 className="text-2xl font-semibold tracking-tight">Calm</h1>
        <p className="mt-1 text-sm text-muted">
          Practice earns 1 💎 per minute, and the first session of the day +2 💎.
        </p>
      </header>

      <Link
        to="/calm/sos"
        className="sos-gradient enter-up group flex items-center gap-4 rounded-3xl bg-gradient-to-br from-[#4e54f5] via-[#6d5af7] to-[#8b5cf6] p-6 text-white shadow-lg shadow-sage/30 transition-transform hover:scale-[1.01]"
        style={{ animationDelay: '60ms' }}
      >
        <span className="float-soft text-3xl" aria-hidden>
          🆘
        </span>
        <span>
          <span className="block text-base font-semibold">Calm me now</span>
          <span className="block text-xs text-white/80">
            60-second physiological sigh — the fastest way back down
          </span>
        </span>
        <span className="ml-auto translate-x-0 text-2xl transition-transform duration-300 group-hover:translate-x-1.5">
          →
        </span>
      </Link>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider">Breathing & grounding</h2>
        <div className="mt-3 flex flex-col gap-3">
          {playable.map((exercise, index) => {
            const steps =
              exercise.type === 'grounding' &&
              exercise.pattern &&
              !Array.isArray(exercise.pattern) &&
              Array.isArray((exercise.pattern as Record<string, unknown>).steps)
                ? ((exercise.pattern as Record<string, unknown>).steps as string[]).length
                : null
            return (
              <Link
                key={exercise.id}
                to={`/calm/${exercise.slug}`}
                className="enter-up group flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-sage/60 hover:shadow-lg hover:shadow-sage/10"
                style={{ animationDelay: `${120 + index * 70}ms` }}
              >
                <span
                  className="text-2xl transition-transform duration-300 group-hover:scale-110"
                  aria-hidden
                >
                  {exercise.sos ? '🆘' : exercise.type === 'grounding' ? '🧎' : '🌬️'}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {exercise.name}
                    {exercise.sos && (
                      <span className="rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-medium text-sage-deep">
                        SOS
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted">{exercise.description}</span>
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted">
                  {steps ? `${steps} steps` : `${exercise.durationOptions.join(' / ')} min`}
                  <span className="opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
                    →
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
