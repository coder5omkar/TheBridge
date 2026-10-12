import type { ReactNode } from 'react'

type Props = {
  icon: string
  title: string
  phase: number
  children: ReactNode
}

export default function PlaceholderPage({ icon, title, phase, children }: Props) {
  return (
    <div className="max-w-xl">
      <div className="rounded-3xl border border-line bg-surface p-8">
        <div className="text-3xl">{icon}</div>
        <h1 className="mt-3 text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">Arrives in Phase {phase}.</p>
        <p className="mt-4 text-sm leading-6 text-ink-soft">{children}</p>
      </div>
    </div>
  )
}
