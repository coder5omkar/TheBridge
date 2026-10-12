import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import GemBurst from '../../components/GemBurst'
import type { DiaryResponse, DiaryView } from '../../lib/types'

const MOODS = ['😞', '😕', '😐', '🙂', '😄']

type FormState = {
  mood: number | null
  energy: number | null
  morningIntent: string
  body: string
  eveningReview: string
}

function emptyForm(): FormState {
  return { mood: null, energy: null, morningIntent: '', body: '', eveningReview: '' }
}

function formFrom(view: DiaryView): FormState {
  return {
    mood: view.mood,
    energy: view.energy,
    morningIntent: view.morningIntent ?? '',
    body: view.body ?? '',
    eveningReview: view.eveningReview ?? '',
  }
}

export default function DiaryPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState | null>(null)
  const [burst, setBurst] = useState<number | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['diary-today'],
    queryFn: () => api<DiaryView | undefined>('/diary/today'),
  })

  useEffect(() => {
    if (form !== null || !query.isSuccess) return
    setForm(query.data ? formFrom(query.data) : emptyForm())
  }, [form, query.isSuccess, query.data])

  const mutation = useMutation({
    mutationFn: (state: FormState) =>
      api<DiaryResponse>('/diary/today', {
        method: 'PUT',
        body: JSON.stringify({
          mood: state.mood,
          energy: state.energy,
          morningIntent: state.morningIntent || null,
          eveningReview: state.eveningReview || null,
          body: state.body || null,
          tags: [],
        }),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(['diary-today'], response.entry)
      queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
      setSavedAt(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
      if (response.rewards.gemsAwarded > 0) {
        setBurst(response.rewards.gemsAwarded)
      }
    },
  })

  if (!form) {
    return <p className="text-sm text-muted">Opening today's page…</p>
  }

  const update = (patch: Partial<FormState>) => setForm({ ...form, ...patch })

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Today's diary</h1>
        <p className="mt-1 text-sm text-muted">
          A few honest lines. Saving your first entry earns +2 💎, the evening review +3 💎.
        </p>
      </header>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">How are you feeling?</h2>
        <div className="mt-3 flex gap-2">
          {MOODS.map((emoji, index) => {
            const value = index + 1
            const active = form.mood === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => update({ mood: active ? null : value })}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-xl transition-all ${
                  active
                    ? 'border-sage bg-sage-mist scale-105'
                    : 'border-line bg-paper hover:border-sage/50'
                }`}
                title={`Mood ${value}/5`}
              >
                {emoji}
              </button>
            )
          })}
        </div>

        <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted">Energy</h2>
        <div className="mt-3 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ energy: form.energy === value ? null : value })}
              className={`h-4 w-8 rounded-full transition-colors ${
                form.energy !== null && value <= form.energy ? 'bg-sage' : 'bg-line hover:bg-sage/40'
              }`}
              title={`Energy ${value}/5`}
            />
          ))}
          <span className="ml-2 text-xs text-muted">{form.energy ? `${form.energy}/5` : '—'}</span>
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
          🌅 One intention for today
          <input
            className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-sage"
            value={form.morningIntent}
            onChange={(event) => update({ morningIntent: event.target.value })}
            placeholder="What matters most today?"
            maxLength={500}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
          💭 What's on your mind
          <textarea
            className="min-h-28 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-sage"
            value={form.body}
            onChange={(event) => update({ body: event.target.value })}
            placeholder="Anything at all — no structure needed."
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
          🌙 Evening review <span className="font-normal text-gem">+3 💎 once</span>
          <textarea
            className="min-h-28 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-sage"
            value={form.eveningReview}
            onChange={(event) => update({ eveningReview: event.target.value })}
            placeholder="How did today go? What went well, what drained you, one gratitude?"
          />
        </label>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          className="rounded-xl bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save today'}
        </button>
        {savedAt && !mutation.isPending && (
          <span className="text-xs text-muted">Saved at {savedAt} ✓</span>
        )}
        {mutation.isError && (
          <span className="text-xs text-rose-700">{mutation.error.message}</span>
        )}
      </div>
    </div>
  )
}
