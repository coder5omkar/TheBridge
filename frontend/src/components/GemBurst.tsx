import { useEffect, useState } from 'react'

/**
 * Floating "+N 💎" burst after a rewarded action. Fires on mount and reports back
 * when its animation has ended so the parent can clear it.
 */
export default function GemBurst({ amount, onDone }: { amount: number; onDone?: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, 1900)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center">
      <div className="gem-float flex items-center gap-1.5 rounded-full bg-gem px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gem/30">
        <span className="text-base">💎</span> +{amount}
      </div>
    </div>
  )
}
