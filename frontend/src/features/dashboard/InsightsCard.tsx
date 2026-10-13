import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatMinutes } from '../../lib/format'
import type { WeeklyInsights } from '../../lib/types'

/** The "see the pattern" card — honest observations about the last 7 days. */
export default function InsightsCard() {
  const query = useQuery({
    queryKey: ['insights-weekly'],
    queryFn: () => api<WeeklyInsights>('/insights/weekly'),
    staleTime: 5 * 60_000,
  })

  const data = query.data

  return (
    <section className="rounded-3xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider">This week</h2>
        <span className="text-[10px] text-muted">patterns, not proof</span>
      </div>

      {query.isLoading && <p className="mt-4 text-xs text-muted">Reading your week…</p>}
      {query.isError && (
        <p className="mt-4 text-xs text-muted">Insights will appear once the data flows.</p>
      )}

      {data && (
        <>
          <ul className="mt-4 flex flex-col gap-3">
            {data.bullets.map((bullet, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-0.5 text-base leading-none" aria-hidden>
                  {bullet.icon}
                </span>
                <span className="text-sm text-ink-soft">{bullet.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-line/60 pt-4">
            <span className="rounded-full bg-gem-soft px-2.5 py-1 text-[11px] font-medium text-gem">
              💎 {data.gemsEarnedWeek} this week
            </span>
            {data.calmMinutes > 0 && (
              <span className="rounded-full bg-sage-mist px-2.5 py-1 text-[11px] font-medium text-sage-deep">
                🧘 {data.calmMinutes} min
              </span>
            )}
            {data.sleepAvgMinutes != null && (
              <span className="rounded-full bg-[#16304a] px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                😴 {formatMinutes(data.sleepAvgMinutes)} avg
              </span>
            )}
            {data.rhythmConsistency != null && (
              <span className="rounded-full bg-[#1b2e22] px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                🌿 {data.rhythmConsistency}%
              </span>
            )}
          </div>
        </>
      )}
    </section>
  )
}
