import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import GemBurst from '../../components/GemBurst'
import type { DiaryResponse, DiaryView } from '../../lib/types'

const MOODS = ['😞', '😕', '😐', '🙂', '😄']
const TAG_OPTIONS = ['work', 'family', 'friends', 'health', 'rest', 'learning', 'creativity', 'outdoors']
const TOTAL_QUESTIONS = 11

type FormState = {
  mood: number | null
  energy: number | null
  morningIntent: string
  waterCups: number
  moved: boolean | null
  tags: string[]
  highlights: string
  drained: string
  gratitude: string
  eveningReview: string
  body: string
}

function emptyForm(): FormState {
  return {
    mood: null,
    energy: null,
    morningIntent: '',
    waterCups: 0,
    moved: null,
    tags: [],
    highlights: '',
    drained: '',
    gratitude: '',
    eveningReview: '',
    body: '',
  }
}

function formFrom(view: DiaryView): FormState {
  return {
    mood: view.mood,
    energy: view.energy,
    morningIntent: view.morningIntent ?? '',
    waterCups: view.waterCups ?? 0,
    moved: view.moved,
    tags: view.tags ?? [],
    highlights: view.highlights ?? '',
    drained: view.drained ?? '',
    gratitude: view.gratitude ?? '',
    eveningReview: view.eveningReview ?? '',
    body: view.body ?? '',
  }
}

function answeredCount(form: FormState): number {
  let count = 0
  if (form.mood) count++
  if (form.energy) count++
  if (form.morningIntent.trim()) count++
  if (form.waterCups > 0) count++
  if (form.moved !== null) count++
  if (form.tags.length > 0) count++
  if (form.highlights.trim()) count++
  if (form.drained.trim()) count++
  if (form.gratitude.trim()) count++
  if (form.eveningReview.trim()) count++
  if (form.body.trim()) count++
  return count
}

function Question({
  index,
  label,
  hint,
  children,
}: {
  index: number
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-line/60 px-5 py-4 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] font-bold tabular-nums text-sage">
          {String(index).padStart(2, '0')}
        </span>
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-[11px] font-normal text-gem">{hint}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  note,
  collapsible,
  open,
  onToggle,
}: {
  icon: string
  title: string
  note?: string
  collapsible?: boolean
  open?: boolean
  onToggle?: () => void
}) {
  return (
    <button
      type="button"
      onClick={collapsible ? onToggle : undefined}
      className={`flex w-full items-center gap-2 bg-paper/60 px-5 py-3 text-left ${
        collapsible ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{title}</span>
      {note && <span className="text-[10px] font-normal text-muted">{note}</span>}
      {collapsible && <span className="ml-auto text-xs text-muted">{open ? '▾' : '▸'}</span>}
    </button>
  )
}

const inputClass =
  'w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none transition-colors focus:border-sage'

export default function DiaryPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState | null>(null)
  const [burst, setBurst] = useState<number | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [eveningOpen, setEveningOpen] = useState(() => new Date().getHours() >= 17)
  const dirtyRef = useRef(false)

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
          tags: state.tags,
          waterCups: state.waterCups,
          highlights: state.highlights || null,
          drained: state.drained || null,
          gratitude: state.gratitude || null,
          moved: state.moved,
        }),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(['diary-today'], response.entry)
      queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
      queryClient.invalidateQueries({ queryKey: ['insights-weekly'] })
      setSavedAt(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
      if (response.rewards.gemsAwarded > 0) {
        setBurst(response.rewards.gemsAwarded)
      }
    },
  })

  // Autosave: every change saves itself ~1s later. No Save button needed.
  useEffect(() => {
    if (!form || !dirtyRef.current) return
    const timer = setTimeout(() => mutation.mutate(form), 900)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  if (query.isError) {
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-xl font-semibold">Could not open today's page</h1>
        <p className="mt-2 text-sm text-ink-soft">{query.error?.message}</p>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="mt-5 rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!form) {
    return <p className="text-sm text-muted">Opening today's page…</p>
  }

  const update = (patch: Partial<FormState>) => {
    dirtyRef.current = true
    setForm({ ...form, ...patch })
  }

  const answered = answeredCount(form)

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily check-in</h1>
          <p className="mt-1 text-sm text-muted">
            Reflection time — everything saves itself as you go.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-sage-mist px-3 py-1 text-xs font-medium text-sage-deep">
            {answered}/{TOTAL_QUESTIONS} answered
          </span>
          {mutation.isPending ? (
            <span className="text-xs text-muted">Saving…</span>
          ) : savedAt ? (
            <span className="text-xs text-muted">Saved {savedAt} ✓</span>
          ) : null}
        </div>
      </header>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-sage transition-all duration-300"
          style={{ width: `${Math.round((answered / TOTAL_QUESTIONS) * 100)}%` }}
        />
      </div>

      {/* ☀️ Morning */}
      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <SectionHeader icon="☀️" title="Morning" />
        <Question index={1} label="One intention for today 🌅">
          <input
            className={inputClass}
            value={form.morningIntent}
            onChange={(event) => update({ morningIntent: event.target.value })}
            placeholder="What matters most today?"
            maxLength={500}
          />
        </Question>
        <Question index={2} label="How are you feeling right now?">
          <div className="flex gap-2">
            {MOODS.map((emoji, index) => {
              const value = index + 1
              const active = form.mood === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ mood: active ? null : value })}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl transition-all ${
                    active ? 'scale-105 border-sage bg-sage-mist' : 'border-line bg-paper hover:border-sage/50'
                  }`}
                  title={`Mood ${value}/5`}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        </Question>
        <Question index={3} label="Energy level?">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ energy: form.energy === value ? null : value })}
                className={`h-8 w-1/12 min-w-10 rounded-lg transition-colors ${
                  form.energy !== null && value <= form.energy ? 'bg-sage' : 'bg-paper hover:bg-sage/30'
                }`}
                title={`Energy ${value}/5`}
              />
            ))}
            <span className="ml-2 text-xs text-muted">{form.energy ? `${form.energy}/5` : '—'}</span>
          </div>
        </Question>
      </section>

      {/* 🌤 During the day */}
      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <SectionHeader icon="🌤️" title="During the day" />
        <Question index={4} label="Glasses of water 💧">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update({ waterCups: Math.max(0, form.waterCups - 1) })}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-sm transition-colors hover:border-sage"
            >
              −
            </button>
            <span className="w-10 text-center text-lg font-semibold text-sage">{form.waterCups}</span>
            <button
              type="button"
              onClick={() => update({ waterCups: Math.min(30, form.waterCups + 1) })}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-sm transition-colors hover:border-sage"
            >
              +
            </button>
            <span className="text-xs text-muted">aim for 8</span>
          </div>
        </Question>
        <Question index={5} label="Moved your body today? 🚶">
          <div className="flex gap-2">
            {[
              { label: 'Yes, moved it', value: true },
              { label: 'Not today', value: false },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => update({ moved: form.moved === option.value ? null : option.value })}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  form.moved === option.value ? 'bg-sage text-white' : 'bg-paper text-muted hover:text-ink-soft'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Question>
        <Question index={6} label="What did today involve? 🏷">
          <div className="flex flex-wrap gap-1.5">
            {TAG_OPTIONS.map((tag) => {
              const active = form.tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    update({
                      tags: active ? form.tags.filter((item) => item !== tag) : [...form.tags, tag],
                    })
                  }
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    active ? 'bg-sage font-medium text-white' : 'bg-paper text-muted hover:text-ink-soft'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </Question>
      </section>

      {/* 🌙 Evening */}
      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <SectionHeader
          icon="🌙"
          title="Evening"
          note={eveningOpen ? undefined : 'unlocks tonight — tap to peek'}
          collapsible
          open={eveningOpen}
          onToggle={() => setEveningOpen(!eveningOpen)}
        />
        {eveningOpen && (
          <div>
            <Question index={7} label="Best moment / biggest win 🏆">
              <input
                className={inputClass}
                value={form.highlights}
                onChange={(event) => update({ highlights: event.target.value })}
                placeholder="However small — name it."
                maxLength={1000}
              />
            </Question>
            <Question index={8} label="What drained you? 😮‍💨">
              <input
                className={inputClass}
                value={form.drained}
                onChange={(event) => update({ drained: event.target.value })}
                placeholder="Name the leak so it loses power."
                maxLength={1000}
              />
            </Question>
            <Question index={9} label="One thing you're grateful for 🙏">
              <input
                className={inputClass}
                value={form.gratitude}
                onChange={(event) => update({ gratitude: event.target.value })}
                placeholder="Small counts."
                maxLength={1000}
              />
            </Question>
            <Question index={10} label="How did today go? 🌙" hint="+3 💎 once">
              <textarea
                className={`${inputClass} min-h-24`}
                value={form.eveningReview}
                onChange={(event) => update({ eveningReview: event.target.value })}
                placeholder="One honest line about the day."
              />
            </Question>
            <Question index={11} label="Anything else on your mind 📖">
              <textarea
                className={`${inputClass} min-h-24`}
                value={form.body}
                onChange={(event) => update({ body: event.target.value })}
                placeholder="Free space — no structure needed."
              />
            </Question>
          </div>
        )}
      </section>

      {mutation.isError && (
        <p className="text-xs text-rose-300">Could not save: {mutation.error.message}</p>
      )}
    </div>
  )
}
