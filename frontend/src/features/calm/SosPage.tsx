import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { ExerciseView } from '../../lib/types'
import CalmPlayer from './CalmPlayer'

export default function SosPage() {
  const query = useQuery({
    queryKey: ['calm-exercises'],
    queryFn: () => api<ExerciseView[]>('/calm/exercises'),
    staleTime: Infinity,
  })

  const exercise =
    query.data?.find((item) => item.sos) ?? query.data?.find((item) => item.slug === 'physiological-sigh')

  if (query.isLoading) {
    return <p className="text-sm text-muted">One moment…</p>
  }

  if (!exercise) {
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-lg font-semibold">SOS exercise unavailable</h1>
        <Link to="/calm" className="mt-2 inline-block text-sm text-sage underline-offset-2 hover:underline">
          ← Back to Calm
        </Link>
      </div>
    )
  }

  return <CalmPlayer exercise={exercise} kind="sos" autoStart />
}
