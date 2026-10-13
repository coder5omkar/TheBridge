import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'
import type { UserView } from '../lib/types'

const NAV = [
  { to: '/', label: 'Today', icon: '🏠', end: true },
  { to: '/diary', label: 'Diary', icon: '✍️', end: false },
  { to: '/calm', label: 'Calm', icon: '🧘', end: false },
  { to: '/health', label: 'Health', icon: '🩺', end: false },
  { to: '/garden', label: 'Garden', icon: '🪴', end: false },
]

export default function AppShell() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<UserView>('/auth/me'),
    retry: false,
  })

  function logout() {
    setToken(null)
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pt-5 md:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          TheBridge<span className="text-sage">.</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-40 truncate text-xs text-muted sm:block">{me.data?.email}</span>
          <button
            onClick={logout}
            className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-sage"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 pb-40">
        <Outlet />
      </main>

      {/* SOS — always visible, always free */}
      <Link
        to="/calm/sos"
        title="60-second reset"
        className="fixed bottom-28 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-sage to-[#5d52d6] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-sage/30 transition-transform hover:scale-105 sm:right-[calc(50%-20rem)]"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="calm-pulse absolute inline-flex h-full w-full rounded-full bg-white/70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        Calm me
      </Link>

      {/* Floating bottom nav */}
      <nav className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-surface/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-16 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[10px] transition-colors ${
                isActive ? 'bg-sage font-medium text-white' : 'text-muted hover:text-ink-soft'
              }`
            }
          >
            <span className="text-base leading-none" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
