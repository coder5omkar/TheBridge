import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import GemBurst from '../../components/GemBurst'
import { isDayEditableLocally, MOOD_EMOJIS, TOTAL_QUESTIONS } from '../../lib/checkin'
import { formatTime } from '../../lib/format'
import type { DiaryResponse, DiaryView } from '../../lib/types'

const TAG_OPTIONS = ['work', 'family', 'friends', 'health', 'rest', 'learning', 'creativity', 'outdoors']

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

const ANSWER_ROWS: { label: string; icon: string; key: keyof DiaryView }[] = [
  { label: 'Intention', icon: '🌅', key: 'morningIntent' },
  { label: 'Best moment', icon: '🏆', key: 'highlights' },
  { label: 'Drained by', icon: '😮‍💨', key: 'drained' },
  { label: 'Gratitude', icon: '🙏', key: 'gratitude' },
  { label: 'Evening review', icon: '🌙', key: 'eveningReview' },
  { label: 'On my mind', icon: '📖', key: 'body' },
]

export default function DiaryPage() {
  const { date: dateParam } = useParams<{ date: string }>()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState | null>(null)
  const [burst, setBurst] = useState<number | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [eveningOpen, setEveningOpen] = useState(() => new Date().getHours() >= 17)
  const dirtyRef = useRef(false)

  const apiPath = dateParam ? `/diary/${dateParam}` : '/diary/today'
  const queryKey = dateParam ? ['diary', dateParam] : ['diary-today']

  const query = useQuery({
    queryKey,
    queryFn: () => api<DiaryView | undefined>(apiPath),
  })

  useEffect(() => {
    if (form !== null || !query.isSuccess) return
    setForm(query.data ? formFrom(query.data) : emptyForm())
  }, [form, query.isSuccess, query.data])

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
    queryClient.invalidateQueries({ queryKey: ['insights-weekly'] })
    queryClient.invalidateQueries({ queryKey: ['days-calendar'] })
    if (dateParam) {
      queryClient.invalidateQueries({ queryKey: ['day', dateParam] })
    }
  }

  const mutation = useMutation({
    mutationFn: (state: FormState) =>
      api<DiaryResponse>(apiPath, {
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
      queryClient.setQueryData(queryKey, response.entry)
      invalidateAll()
      setSavedAt(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))
      if (response.rewards.gemsAwarded > 0) {
        setBurst(response.rewards.gemsAwarded)
      }
    },
  })

  const seal = useMutation({
    mutationFn: () => api<DiaryResponse>(`${apiPath}/seal`, { method: 'POST' }),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKey, response.entry)
      invalidateAll()
      if (response.rewards.gemsAwarded > 0) {
        setBurst(response.rewards.gemsAwarded)
      }
    },
  })

  // Autosave: every change saves itself ~1s later.
  useEffect(() => {
    if (!form || !dirtyRef.current) return
    const timer = setTimeout(() => mutation.mutate(form), 900)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  const entry = query.data ?? null
  const frozen = entry ? !entry.editable : dateParam ? !isDayEditableLocally(dateParam) : false

  const dateLabel = dateParam
    ? new Date(`${dateParam}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null

  if (query.isError) {
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-xl font-semibold">Could not open this page</h1>
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

  // Frozen: read-only forever.
  if (frozen) {
    if (!entry) {
      return (
        <div className="flex max-w-3xl flex-col gap-5">
          <header className="flex items-center gap-3">
            {dateParam && (
              <Link to={`/days/${dateParam}`} className="text-xs text-muted hover:text-ink-soft">
                ←
              </Link>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{dateLabel ?? 'Daily check-in'}</h1>
            <span className="rounded-full bg-paper px-3 py-1 text-xs text-muted">🔒 frozen</span>
          </header>
          <div className="rounded-3xl border border-line bg-surface p-8 text-center text-sm text-muted">
            This day froze at 12 PM without a check-in.
          </div>
        </div>
      )
    }
    return (
      <div className="flex max-w-3xl flex-col gap-5">
        {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            {dateParam && (
              <Link to={`/days/${dateParam}`} className="text-xs text-muted hover:text-ink-soft">
                ←
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{dateLabel ?? 'Daily check-in'}</h1>
              <p className="mt-1 text-sm text-muted">Frozen at 12 PM — read-only, kept as it was.</p>
            </div>
          </div>
          <span className="flex gap-2">
            {entry.sealedAt && (
              <span className="rounded-full bg-[#1b2e22] px-3 py-1 text-xs font-medium text-ink-soft">
                📔 Sealed {formatTime(entry.sealedAt)}
              </span>
            )}
            <span className="rounded-full bg-paper px-3 py-1 text-xs text-muted">🔒 frozen</span>
          </span>
        </header>

        <section className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">
              {MOOD_EMOJIS[(entry.mood ?? 1) - 1]} mood {entry.mood ?? '—'}/5
            </span>
            <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">⚡ {entry.energy ?? '—'}/5</span>
            <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">💧 {entry.waterCups ?? 0}</span>
            {entry.moved != null && (
              <span className="rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">
                {entry.moved ? '🚶 moved' : '🪑 rested'}
              </span>
            )}
            {entry.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-sage-mist px-3 py-1 text-xs text-sage-deep">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-line bg-surface">
          {ANSWER_ROWS.filter((row) => entry[row.key]).map((row) => (
            <div key={row.key} className="border-b border-line/60 px-5 py-4 last:border-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                {row.icon} {row.label}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{entry[row.key] as string}</p>
            </div>
          ))}
        </section>

        <Link
          to={`/days/${entry.date}`}
          className="text-center text-sm text-sage underline-offset-4 hover:underline"
        >
          Revisit this day in Days →
        </Link>
      </div>
    )
  }

  if (!form) {
    return <p className="text-sm text-muted">Opening the page…</p>
  }

  const update = (patch: Partial<FormState>) => {
    dirtyRef.current = true
    setForm({ ...form, ...patch })
  }

  const answered = answeredCount(form)
  const sealed = entry?.sealedAt != null

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          {dateParam && (
            <Link to={`/days/${dateParam}`} className="text-xs text-muted hover:text-ink-soft">
              ←
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{dateLabel ?? 'Daily check-in'}</h1>
            <p className="mt-1 text-sm text-muted">
              {sealed
                ? '📔 Sealed — still editable until 12 PM the next day.'
                : 'Everything saves itself as you go — editable until 12 PM the next day.'}
            </p>
          </div>
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
            {MOOD_EMOJIS.map((emoji, index) => {
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

      {/* The seal */}
      {!sealed && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          {form.eveningReview.trim() ? (
            <button
              type="button"
              onClick={() => seal.mutate()}
              disabled={seal.isPending}
              className="w-full rounded-full bg-gradient-to-br from-[#4e54f5] to-[#8b5cf6] py-3 text-sm font-semibold text-white shadow-lg shadow-sage/30 transition-transform hover:scale-[1.01] disabled:opacity-50"
            >
              {seal.isPending ? 'Sealing…' : 'Seal this day 📔 · +5 💎'}
            </button>
          ) : (
            <p className="py-1 text-center text-xs text-muted">
              Write your evening review to seal the day — a completion mark · +5 💎
            </p>
          )}
          {seal.isError && <p className="mt-3 text-xs text-rose-300">{seal.error.message}</p>}
        </section>
      )}

      {sealed && (
        <p className="text-center text-xs text-muted">
          📔 Sealed {entry?.sealedAt ? formatTime(entry.sealedAt) : ''} — still editable until 12 PM the
          next day, then it freezes.
        </p>
      )}

      {mutation.isError && (
        <p className="text-xs text-rose-300">Could not save: {mutation.error.message}</p>
      )}
    </div>
  )
}
