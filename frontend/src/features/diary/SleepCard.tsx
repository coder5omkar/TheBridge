import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatMinutes, formatTime } from '../../lib/format'
import GemBurst from '../../components/GemBurst'
import type { SleepResponse, SleepView } from '../../lib/types'

/** Sleep lives inside the diary page: one tap at bedtime, one when you wake. */
export default function SleepCard() {
  const queryClient = useQueryClient()
  const [burst, setBurst] = useState<number | null>(null)

  const latest = useQuery({
    queryKey: ['sleep-latest'],
    queryFn: () => api<SleepView | undefined>('/sleep/latest'),
  })

  function afterMutation(response: SleepResponse) {
    queryClient.setQueryData(['sleep-latest'], response.log)
    queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
    if (response.rewards.gemsAwarded > 0) {
      setBurst(response.rewards.gemsAwarded)
    }
  }

  const bedtime = useMutation({
    mutationFn: () => api<SleepResponse>('/sleep/bedtime', { method: 'POST' }),
    onSuccess: afterMutation,
  })

  const wake = useMutation({
    mutationFn: () => api<SleepResponse>('/sleep/wake', { method: 'POST' }),
    onSuccess: afterMutation,
  })

  const log = latest.data
  const inBedOnly = log?.bedTime != null && log.wakeTime == null
  const completed = log?.bedTime != null && log.wakeTime != null

  return (
    <section className="rounded-3xl border border-line bg-surface p-6">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
        🌙 Sleep · {inBedOnly ? 'tonight' : 'last night'}
      </h2>

      {completed && (
        <p className="mt-3 text-lg">
          <span className="font-semibold">{formatTime(log.bedTime!)}</span>
          <span className="mx-2 text-muted">→</span>
          <span className="font-semibold">{formatTime(log.wakeTime!)}</span>
          {log.durationMinutes != null && (
            <span className="ml-3 rounded-full bg-sage-mist px-3 py-1 text-xs font-medium text-sage-deep">
              {formatMinutes(log.durationMinutes)}
            </span>
          )}
        </p>
      )}

      {inBedOnly && (
        <p className="mt-3 text-lg">
          In bed since <span className="font-semibold">{formatTime(log.bedTime!)}</span> 🌙
        </p>
      )}

      {!log && (
        <p className="mt-3 text-sm text-muted">Nothing logged yet — start tonight.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => bedtime.mutate()}
          disabled={bedtime.isPending}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            inBedOnly
              ? 'border border-line bg-paper text-ink-soft hover:border-sage'
              : 'bg-sage text-white hover:bg-sage-deep'
          }`}
        >
          🌙 {inBedOnly ? 'Update bedtime' : 'Going to bed now'}
        </button>
        <button
          type="button"
          onClick={() => wake.mutate()}
          disabled={wake.isPending}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            inBedOnly
              ? 'bg-amber-soft text-ink hover:brightness-95'
              : 'border border-line bg-paper text-ink-soft hover:border-sage'
          }`}
        >
          ☀️ I'm awake · +1 💎
        </button>
      </div>

      {(bedtime.isError || wake.isError) && (
        <p className="mt-3 text-xs text-rose-700">{(bedtime.error ?? wake.error)?.message}</p>
      )}
    </section>
  )
}
