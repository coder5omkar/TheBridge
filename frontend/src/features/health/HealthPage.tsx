import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { formatShortDate, formatTime } from '../../lib/format'
import GemBurst from '../../components/GemBurst'
import type { HealthSummary, HealthSummaryResponse } from '../../lib/types'
import { WeightChart } from './WeightChart'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { value: 'lunch', label: 'Lunch', icon: '🥗' },
  { value: 'dinner', label: 'Dinner', icon: '🍲' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
] as const

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍲',
  snack: '🍎',
}

function defaultMealType(): (typeof MEAL_TYPES)[number]['value'] {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 21) return 'dinner'
  return 'snack'
}

export default function HealthPage() {
  const queryClient = useQueryClient()
  const [burst, setBurst] = useState<number | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [heightInput, setHeightInput] = useState<string | null>(null)
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]['value']>(defaultMealType)
  const [mealDesc, setMealDesc] = useState('')
  const [homeCooked, setHomeCooked] = useState(false)

  const summary = useQuery({
    queryKey: ['health-summary'],
    queryFn: () => api<HealthSummary>('/health/summary'),
  })

  useEffect(() => {
    if (heightInput === null && summary.data) {
      setHeightInput(summary.data.heightCm?.toString() ?? '')
    }
  }, [heightInput, summary.data])

  function applySummary(response: HealthSummaryResponse) {
    queryClient.setQueryData(['health-summary'], response.summary)
    queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
    if (response.rewards.gemsAwarded > 0) {
      setBurst(response.rewards.gemsAwarded)
    }
  }

  const weighIn = useMutation({
    mutationFn: () =>
      api<HealthSummaryResponse>('/health/weight', {
        method: 'POST',
        body: JSON.stringify({ weightKg: Number(weightInput) }),
      }),
    onSuccess: (response) => {
      setWeightInput('')
      applySummary(response)
    },
  })

  const addMeal = useMutation({
    mutationFn: () =>
      api<HealthSummaryResponse>('/health/meals', {
        method: 'POST',
        body: JSON.stringify({
          mealType,
          description: mealDesc.trim() || null,
          homeCooked,
        }),
      }),
    onSuccess: (response) => {
      setMealDesc('')
      applySummary(response)
    },
  })

  const saveHeight = useMutation({
    mutationFn: () =>
      api<{ heightCm: number }>('/health/profile', {
        method: 'PATCH',
        body: JSON.stringify({ heightCm: Number(heightInput) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-summary'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })

  if (summary.isLoading) {
    return <p className="text-sm text-muted">Opening your health data…</p>
  }
  if (summary.isError || !summary.data) {
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-surface p-8">
        <h1 className="text-xl font-semibold">Could not load health data</h1>
        <p className="mt-2 text-sm text-ink-soft">{summary.error?.message}</p>
      </div>
    )
  }

  const data = summary.data
  const change = data.change7dKg
  const changeLabel =
    change == null ? '—' : change > 0 ? `+${change} kg` : change < 0 ? `${change} kg` : '±0 kg'
  const changeClass = change == null ? 'text-muted' : change < 0 ? 'text-sage-deep' : 'text-ink-soft'

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Health</h1>
        <p className="mt-1 text-sm text-muted">
          Food, weight and the slow signals — habits first, never calorie numerology.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Profile</h2>
          <label className="mt-4 flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
            Height (cm)
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal outline-none transition-colors focus:border-sage"
                value={heightInput ?? ''}
                onChange={(event) => setHeightInput(event.target.value)}
                placeholder="e.g. 175"
              />
              <button
                type="button"
                onClick={() => saveHeight.mutate()}
                disabled={saveHeight.isPending || !heightInput}
                className="shrink-0 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-sage disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </label>
          {saveHeight.isError && <p className="mt-2 text-xs text-rose-300">{saveHeight.error.message}</p>}
          {saveHeight.isSuccess && <p className="mt-2 text-xs text-muted">Height saved ✓</p>}

          <div className="mt-6">
            <p className="text-xs font-medium text-muted">BMI</p>
            {data.bmi != null ? (
              <>
                <p className="mt-1 text-3xl font-semibold">{data.bmi}</p>
                <p className="mt-1 text-xs text-muted">
                  A rough guide from height + latest weight — not a verdict.
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">Add height and one weight to see it.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Weight</h2>
          <div className="mt-3 flex items-baseline gap-3">
            <p className="text-3xl font-semibold text-sage">
              {data.latestWeightKg != null ? `${data.latestWeightKg}` : '—'}
              <span className="ml-1 text-sm font-normal text-muted">kg</span>
            </p>
            <span className={`text-xs font-medium ${changeClass}`}>{changeLabel} / 7d</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {data.latestWeightAt
              ? `Last measured ${formatShortDate(data.latestWeightAt.slice(0, 10))}`
              : 'First weigh-in of the week earns +3 💎'}
          </p>

          <div className="mt-4 flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none transition-colors focus:border-sage"
              value={weightInput}
              onChange={(event) => setWeightInput(event.target.value)}
              placeholder="Today's weight, e.g. 78.4"
            />
            <button
              type="button"
              onClick={() => weighIn.mutate()}
              disabled={weighIn.isPending || !weightInput}
              className="shrink-0 rounded-full bg-sage px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-50"
            >
              Log
            </button>
          </div>
          {weighIn.isError && <p className="mt-2 text-xs text-rose-300">{weighIn.error.message}</p>}

          <div className="mt-5">
            {data.weights.length >= 2 ? (
              <WeightChart points={data.weights} />
            ) : (
              <p className="text-xs text-muted">Log two or more weigh-ins to see the trend.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Food & eating habits</h2>
          <p className="text-xs text-muted">
            Today {data.mealsToday} · This week {data.mealsWeek} meals
            {data.homeCookedRatioWeek != null && ` · ${data.homeCookedRatioWeek}% home-cooked`}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {MEAL_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setMealType(item.value)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                  mealType === item.value
                    ? 'bg-sage-mist font-medium text-sage-deep'
                    : 'bg-paper text-muted hover:text-ink-soft'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none transition-colors focus:border-sage"
              value={mealDesc}
              onChange={(event) => setMealDesc(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addMeal.mutate()
              }}
              placeholder="What did you eat? (optional)"
              maxLength={500}
            />
            <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={homeCooked}
                onChange={(event) => setHomeCooked(event.target.checked)}
                className="h-4 w-4 accent-[#4e8b73]"
              />
              🏠 Home-cooked
            </label>
            <button
              type="button"
              onClick={() => addMeal.mutate()}
              disabled={addMeal.isPending}
              className="shrink-0 rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {addMeal.isError && <p className="text-xs text-rose-300">{addMeal.error.message}</p>}
        </div>

        {data.todayMeals.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2">
            {data.todayMeals.map((meal) => (
              <li
                key={meal.id}
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3"
              >
                <span aria-hidden>{MEAL_ICONS[meal.mealType]}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">
                  {meal.description || meal.mealType}
                </span>
                {meal.homeCooked && (
                  <span className="rounded-full bg-sage-mist px-2 py-0.5 text-[10px] font-medium text-sage-deep">
                    🏠 home
                  </span>
                )}
                <span className="shrink-0 text-xs text-muted">{formatTime(meal.eatenAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
