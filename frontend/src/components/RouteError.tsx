import { Link, useRouteError } from 'react-router-dom'

/** Friendly fallback for render errors — usually a stale dev-server update. */
export default function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : 'Something went wrong.'

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center">
        <p className="text-3xl">🛟</p>
        <h1 className="mt-3 text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Usually a refresh fixes it — your data is safe.
        </p>
        <p className="mt-4 break-all rounded-xl bg-paper px-3 py-2 text-left text-[11px] text-muted">
          {message}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-sage px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep"
          >
            Refresh
          </button>
          <Link
            to="/"
            className="rounded-xl border border-line bg-paper px-5 py-2.5 text-sm text-ink-soft transition-colors hover:border-sage"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
