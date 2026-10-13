import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatMinutes, formatTime } from '../../lib/format'
import GemBurst from '../../components/GemBurst'
import type { DiaryResponse, DiaryView, SleepResponse, SleepView } from '../../lib/types'

/** The cockpit rows: the things you actually do through the day, one tap each. */
export default function QuickActions() {
  const queryClient = useQueryClient()
  const [burst, setBurst] = useState<number | null>(null)

  const latest = useQuery({
    queryKey: ['sleep-latest'],
    queryFn: () => api<SleepView | undefined>('/sleep/latest'),
  })

  const diary = useQuery({
    queryKey: ['diary-today'],
    queryFn: () => api<DiaryView | undefined>('/diary/today'),
  })

  const bedtime = useMutation({
    mutationFn: () => api<SleepResponse>('/sleep/bedtime', { method: 'POST' }),
    onSuccess: (response) => {
      queryClient.setQueryData(['sleep-latest'], response.log)
      queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
      if (response.rewards.gemsAwarded > 0) setBurst(response.rewards.gemsAwarded)
    },
  })

  const wake = useMutation({
    mutationFn: () => api<SleepResponse>('/sleep/wake', { method: 'POST' }),
    onSuccess: (response) => {
      queryClient.setQueryData(['sleep-latest'], response.log)
      queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
      if (response.rewards.gemsAwarded > 0) setBurst(response.rewards.gemsAwarded)
    },
  })

  const water = useMutation({
    mutationFn: () => {
      const entry = diary.data
      return api<DiaryResponse>('/diary/today', {
        method: 'PUT',
        body: JSON.stringify({
          mood: entry?.mood ?? null,
          energy: entry?.energy ?? null,
          morningIntent: entry?.morningIntent ?? null,
          eveningReview: entry?.eveningReview ?? null,
          body: entry?.body ?? null,
          tags: entry?.tags ?? [],
          waterCups: (entry?.waterCups ?? 0) + 1,
          highlights: entry?.highlights ?? null,
          drained: entry?.drained ?? null,
          gratitude: entry?.gratitude ?? null,
          moved: entry?.moved ?? null,
        }),
      })
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['diary-today'], response.entry)
      queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
      if (response.rewards.gemsAwarded > 0) setBurst(response.rewards.gemsAwarded)
    },
  })

  const log = latest.data
  const inBedOnly = log?.bedTime != null && log.wakeTime == null
  const completed = log?.bedTime != null && log.wakeTime != null
  const waterCount = diary.data?.waterCups ?? 0

  const actionButton =
    'rounded-full px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50'

  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <h2 className="text-xs font-bold uppercase tracking-wider">Act now</h2>

      <div className="mt-3 flex flex-col divide-y divide-line/60">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16304a] text-base">🌙</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Sleep</p>
            <p className="truncate text-xs text-muted">
              {completed
                ? `${formatTime(log.bedTime!)} → ${formatTime(log.wakeTime!)}${
                    log.durationMinutes != null ? ` · ${formatMinutes(log.durationMinutes)}` : ''
                  }`
                : inBedOnly
                  ? `In bed since ${formatTime(log.bedTime!)}`
                  : 'Nothing logged yet — start tonight'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => bedtime.mutate()}
              disabled={bedtime.isPending}
              className={`${actionButton} border border-line bg-paper text-ink-soft hover:border-sage`}
            >
              🌙 {inBedOnly ? 'Update' : 'Bedtime'}
            </button>
            <button
              type="button"
              onClick={() => wake.mutate()}
              disabled={wake.isPending}
              className={`${actionButton} ${
                inBedOnly ? 'bg-sage text-white hover:bg-sage-deep' : 'border border-line bg-paper text-ink-soft hover:border-sage'
              }`}
            >
              ☀️ Awake
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14283a] text-base">💧</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Water</p>
            <p className="text-xs text-muted">{waterCount} glasses today · aim for 8</p>
          </div>
          <button
            type="button"
            onClick={() => water.mutate()}
            disabled={water.isPending}
            className={`${actionButton} border border-line bg-paper text-ink-soft hover:border-sage`}
          >
            +1 glass
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2f2340] text-base">🌬️</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Breathe</p>
            <p className="text-xs text-muted">60-second physiological sigh · always free</p>
          </div>
          <Link
            to="/calm/sos"
            className={`${actionButton} bg-sage text-white hover:bg-sage-deep`}
          >
            Start
          </Link>
        </div>

        {(bedtime.isError || wake.isError || water.isError) && (
          <p className="pt-3 text-xs text-rose-300">
            {(bedtime.error ?? wake.error ?? water.error)?.message}
          </p>
        )}
      </div>
    </section>
  )
}
