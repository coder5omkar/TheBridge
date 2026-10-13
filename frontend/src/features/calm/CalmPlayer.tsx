import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatClock } from '../../lib/format'
import GemBurst from '../../components/GemBurst'
import type { CalmSessionResponse, ExerciseView } from '../../lib/types'

type Phase = { label: string; seconds: number; scale: number }

function buildPhases(pattern: number[]): Phase[] {
  const [inhale = 0, holdA = 0, exhale = 0, holdB = 0] = pattern
  const phases: Phase[] = []
  if (inhale > 0) phases.push({ label: 'Inhale', seconds: inhale, scale: 1 })
  if (holdA > 0) phases.push({ label: 'Hold', seconds: holdA, scale: 1 })
  if (exhale > 0) phases.push({ label: 'Exhale', seconds: exhale, scale: 0.55 })
  if (holdB > 0) phases.push({ label: 'Hold', seconds: holdB, scale: 0.55 })
  if (phases.length === 0) phases.push({ label: 'Breathe', seconds: 5, scale: 1 })
  return phases
}

type Props = {
  exercise: ExerciseView
  kind: 'regular' | 'sos'
  autoStart?: boolean
}

export default function CalmPlayer({ exercise, kind, autoStart = false }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Grounding exercises walk through steps instead of a breathing pattern.
  const steps = useMemo(() => {
    if (exercise.type !== 'grounding' || !exercise.pattern || Array.isArray(exercise.pattern)) {
      return null
    }
    const record = exercise.pattern as Record<string, unknown>
    return Array.isArray(record.steps) ? (record.steps as string[]) : null
  }, [exercise])

  const phases = useMemo(() => {
    const numeric = Array.isArray(exercise.pattern) ? exercise.pattern : []
    return buildPhases(numeric)
  }, [exercise.pattern])

  const initialDuration = autoStart && !steps ? Math.min(...exercise.durationOptions) : null
  const [duration, setDuration] = useState<number | null>(steps ? null : initialDuration)
  const [running, setRunning] = useState(autoStart && !steps)
  const [finished, setFinished] = useState(false)
  const [burst, setBurst] = useState<number | null>(null)
  const [clock, setClock] = useState(() => ({
    elapsed: 0,
    phaseIdx: 0,
    phaseLeft: phases[0].seconds,
  }))
  const [stepIndex, setStepIndex] = useState(-1)
  const startedAtRef = useRef<string | null>(autoStart && !steps ? new Date().toISOString() : null)
  const startEpochRef = useRef<number | null>(null)
  const submittedRef = useRef(false)

  const totalSeconds = duration != null ? duration * 60 : 0

  const mutation = useMutation({
    mutationFn: (payload: {
      exerciseId: number
      kind: string
      startedAt: string
      durationSec: number
      completed: boolean
    }) =>
      api<CalmSessionResponse>('/calm/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-today'] })
      queryClient.invalidateQueries({ queryKey: ['insights-weekly'] })
      if (response.rewards.gemsAwarded > 0) {
        setBurst(response.rewards.gemsAwarded)
        setTimeout(() => navigate('/calm'), 1900)
      } else {
        setTimeout(() => navigate('/calm'), 700)
      }
    },
    onError: () => {
      setTimeout(() => navigate('/calm'), 900)
    },
  })

  function submit(completed: boolean, durationSec: number) {
    if (submittedRef.current) return
    submittedRef.current = true
    mutation.mutate({
      exerciseId: exercise.id,
      kind,
      startedAt: startedAtRef.current ?? new Date().toISOString(),
      durationSec,
      completed,
    })
  }

  // The breathing clock: tick every 250 ms, advance phases, complete on time.
  useEffect(() => {
    if (!running || duration == null || steps) return
    const id = setInterval(() => {
      setClock((current) => {
        let { elapsed, phaseIdx, phaseLeft } = current
        elapsed = Math.min(totalSeconds, elapsed + 0.25)
        phaseLeft = Math.round((phaseLeft - 0.25) * 100) / 100
        while (phaseLeft <= 0 && elapsed < totalSeconds) {
          phaseIdx = (phaseIdx + 1) % phases.length
          phaseLeft += phases[phaseIdx].seconds
        }
        return { elapsed, phaseIdx, phaseLeft }
      })
    }, 250)
    return () => clearInterval(id)
  }, [running, duration, phases, totalSeconds, steps])

  // Natural completion (breathing)
  useEffect(() => {
    if (running && duration != null && !steps && clock.elapsed >= totalSeconds) {
      setRunning(false)
      setFinished(true)
      submit(true, totalSeconds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock.elapsed, running, duration, totalSeconds, steps])

  // ---------- Grounding mode ----------
  if (steps) {
    function startGrounding() {
      startedAtRef.current = new Date().toISOString()
      startEpochRef.current = Date.now()
      submittedRef.current = false
      setStepIndex(0)
    }

    function finishGrounding() {
      const elapsed = startEpochRef.current
        ? Math.max(1, Math.round((Date.now() - startEpochRef.current) / 1000))
        : 1
      submit(true, elapsed)
    }

    return (
      <div className="flex flex-col items-center gap-8 py-6">
        {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

        <header className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">{exercise.name}</h1>
          <p className="mt-1 max-w-sm text-xs text-muted">{exercise.description}</p>
        </header>

        {stepIndex === -1 ? (
          <>
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-sage-mist text-5xl">
              🧎
            </div>
            <button
              type="button"
              onClick={startGrounding}
              className="rounded-full bg-sage px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
            >
              Begin · {steps.length} steps
            </button>
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <div className="flex min-h-36 w-full max-w-md items-center justify-center rounded-3xl border border-line bg-surface px-8 py-10 text-center">
              <p className="text-xl font-medium leading-snug">{steps[stepIndex]}</p>
            </div>
            <div className="flex gap-3">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex(stepIndex - 1)}
                  className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm text-ink-soft transition-colors hover:border-sage"
                >
                  Back
                </button>
              )}
              {stepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStepIndex(stepIndex + 1)}
                  className="rounded-full bg-sage px-7 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishGrounding}
                  className="rounded-full bg-sage px-7 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
                >
                  Finish ✓
                </button>
              )}
            </div>
            {mutation.isPending && <p className="text-sm text-muted">Saving your practice…</p>}
            {mutation.isError && <p className="text-xs text-rose-300">{mutation.error.message}</p>}
          </>
        )}
      </div>
    )
  }

  // ---------- Breathing mode ----------
  function start(minutes: number) {
    setDuration(minutes)
    setClock({ elapsed: 0, phaseIdx: 0, phaseLeft: phases[0].seconds })
    startedAtRef.current = new Date().toISOString()
    submittedRef.current = false
    setFinished(false)
    setRunning(true)
  }

  function finishEarly() {
    setRunning(false)
    setFinished(true)
    submit(false, Math.max(0, Math.floor(clock.elapsed)))
  }

  const remaining = totalSeconds - clock.elapsed
  const phase = phases[Math.min(clock.phaseIdx, phases.length - 1)]
  const scale = running || finished ? phase.scale : 0.55

  return (
    <div className="flex flex-col items-center gap-10 py-6">
      {burst !== null && <GemBurst amount={burst} onDone={() => setBurst(null)} />}

      <header className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">{exercise.name}</h1>
        <p className="mt-1 text-xs text-muted">
          {kind === 'sos' ? 'SOS reset · ' : ''}
          {duration != null
            ? running
              ? `${formatClock(remaining)} remaining`
              : finished
                ? 'Session complete'
                : 'Ready when you are'
            : 'Choose a length'}
        </p>
      </header>

      <div className="relative flex h-64 w-64 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-sage-mist" />
        <div
          className="relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-sage to-[#8b5cf6] shadow-xl shadow-sage/30 transition-transform ease-in-out"
          style={{ transform: `scale(${scale})`, transitionDuration: `${phase.seconds}s` }}
        >
          <span className="text-sm font-medium text-white">{running ? phase.label : ''}</span>
        </div>
      </div>

      {duration == null && (
        <div className="flex flex-col items-center gap-3">
          <p className="max-w-sm text-center text-xs text-muted">{exercise.description}</p>
          <div className="flex gap-2">
            {exercise.durationOptions.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => start(minutes)}
                className="rounded-full bg-sage px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>
      )}

      {running && (
        <button
          type="button"
          onClick={finishEarly}
          className="text-xs text-muted underline-offset-2 hover:text-ink-soft hover:underline"
        >
          Finish early (no gems)
        </button>
      )}

      {finished && (
        <p className="text-sm text-sage-deep">
          {mutation.isPending && 'Saving your practice…'}
          {mutation.isError && 'Saved locally — sync failed.'}
        </p>
      )}
    </div>
  )
}
