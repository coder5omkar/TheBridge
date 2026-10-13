import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatTime } from '../../lib/format'
import GemBurst from '../../components/GemBurst'
import type { ThoughtKind, ThoughtResponse, ThoughtView } from '../../lib/types'

const KINDS: { value: ThoughtKind; label: string; icon: string }[] = [
  { value: 'worry', label: 'Worry', icon: '😟' },
  { value: 'idea', label: 'Idea', icon: '💡' },
  { value: 'gratitude', label: 'Gratitude', icon: '🙏' },
  { value: 'task', label: 'Task', icon: '📌' },
]

const KIND_ICONS: Record<ThoughtKind, string> = {
  worry: '😟',
  idea: '💡',
  gratitude: '🙏',
  task: '📌',
}

export default function ThoughtsWidget() {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [kind, setKind] = useState<ThoughtKind>('worry')
  const [releasingId, setReleasingId] = useState<number | null>(null)
  const [reframe, setReframe] = useState('')
  const [burst, setBurst] = useState<number | null>(null)

  const thoughts = useQuery({
    queryKey: ['thoughts-open'],
    queryFn: () => api<ThoughtView[]>('/thoughts'),
  })

  const create = useMutation({
    mutationFn: () =>
      api<ThoughtResponse>('/thoughts', {
        method: 'POST',
        body: JSON.stringify({ content, kind }),
      }),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['thoughts-open'] })
    },
  })

  const release = useMutation({
    mutationFn: (vars: { id: number; reframe: string | null }) =>
      api<ThoughtResponse>(`/thoughts/${vars.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ release: true, reframe: vars.reframe }),
      }),
    onSuccess: (response) => {
      setReleasingId(null)
      setReframe('')
      queryClient.invalidateQueries({ queryKey: ['thoughts-open'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
      if (response.rewards.gemsAwarded > 0) {
        setBurst(response.rewards.gemsAwarded)
      }
    },
  })

  const open = thoughts.data ?? []

  return (
    <section className="rounded-3xl border border-line bg-surface p-6">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          💭 Thoughts · mental inbox
        </h2>
        {open.length > 0 && (
          <span className="rounded-full bg-amber-soft px-2.5 py-0.5 text-[10px] font-medium text-ink-soft">
            {open.length} open
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">
        Capture it now, process it later. Releasing a thought earns +2 💎.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none transition-colors focus:border-sage"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && content.trim()) create.mutate()
            }}
            placeholder="What's circling in your head?"
            maxLength={2000}
          />
          <button
            type="button"
            onClick={() => content.trim() && create.mutate()}
            disabled={create.isPending || !content.trim()}
            className="shrink-0 rounded-full bg-sage px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-50"
          >
            Capture
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setKind(item.value)}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                kind === item.value
                  ? 'bg-sage-mist font-medium text-sage-deep'
                  : 'bg-paper text-muted hover:text-ink-soft'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {create.isError && <p className="mt-2 text-xs text-rose-300">{create.error.message}</p>}

      {open.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2">
          {open.map((thought) => (
            <li key={thought.id} className="rounded-2xl border border-line bg-paper px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5" aria-hidden>
                  {KIND_ICONS[thought.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-soft">{thought.content}</p>
                  <p className="mt-1 text-[10px] text-muted">
                    {thought.kind} · {formatTime(thought.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReleasingId(releasingId === thought.id ? null : thought.id)
                    setReframe('')
                  }}
                  className="shrink-0 text-xs text-sage underline-offset-2 hover:underline"
                >
                  Release
                </button>
              </div>

              {releasingId === thought.id && (
                <div className="mt-3 border-t border-line pt-3">
                  <textarea
                    className="min-h-16 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-sage"
                    value={reframe}
                    onChange={(event) => setReframe(event.target.value)}
                    placeholder="What's actually true here? What's in your control? (optional)"
                    maxLength={2000}
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => release.mutate({ id: thought.id, reframe: reframe.trim() || null })}
                      disabled={release.isPending}
                      className="rounded-full bg-sage px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-50"
                    >
                      {release.isPending ? 'Releasing…' : 'Release & let go · +2 💎'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReleasingId(null)}
                      className="text-xs text-muted hover:text-ink-soft"
                    >
                      Keep it open
                    </button>
                  </div>
                  {release.isError && <p className="mt-2 text-xs text-rose-300">{release.error.message}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
