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

  const phases = useMemo(() => {
    const numeric = Array.isArray(exercise.pattern) ? exercise.pattern : []
    return buildPhases(numeric)
  }, [exercise.pattern])

  const initialDuration = autoStart ? Math.min(...exercise.durationOptions) : null
  const [duration, setDuration] = useState<number | null>(initialDuration)
  const [running, setRunning] = useState(autoStart)
  const [finished, setFinished] = useState(false)
  const [burst, setBurst] = useState<number | null>(null)
  const [clock, setClock] = useState(() => ({
    elapsed: 0,
    phaseIdx: 0,
    phaseLeft: phases[0].seconds,
  }))
  const startedAtRef = useRef<string | null>(autoStart ? new Date().toISOString() : null)
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

  // The breathing clock: tick every 250 ms, advance phases, complete on time.
  useEffect(() => {
    if (!running || duration == null) return
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
  }, [running, duration, phases, totalSeconds])

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

  // Natural completion
  useEffect(() => {
    if (running && duration != null && clock.elapsed >= totalSeconds) {
      setRunning(false)
      setFinished(true)
      submit(true, totalSeconds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock.elapsed, running, duration, totalSeconds])

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
          className="relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-sage to-sage-deep shadow-xl shadow-sage/30 transition-transform ease-in-out"
          style={{ transform: `scale(${scale})`, transitionDuration: `${phase.seconds}s` }}
        >
          <span className="text-sm font-medium text-white">{running ? phase.label : ''}</span>
        </div>
      </div>

      {duration == null && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted">{exercise.description}</p>
          <div className="flex gap-2">
            {exercise.durationOptions.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => start(minutes)}
                className="rounded-xl bg-sage px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
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
