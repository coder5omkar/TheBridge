import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'
import type { UserView } from '../lib/types'

const NAV = [
  { to: '/', label: 'Today', icon: '☀️', end: true },
  { to: '/diary', label: 'Diary', icon: '✍️', end: false },
  { to: '/calm', label: 'Calm', icon: '🧘', end: false },
  { to: '/thoughts', label: 'Thoughts', icon: '💭', end: false },
  { to: '/sleep', label: 'Sleep', icon: '🌙', end: false },
  { to: '/meals', label: 'Meals', icon: '🍽️', end: false },
  { to: '/weight', label: 'Weight', icon: '⚖️', end: false },
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
      isActive ? 'bg-sage-mist font-medium text-sage-deep' : 'text-ink-soft hover:bg-paper'
    }`

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface/70 px-4 py-6 md:flex">
        <Link to="/" className="px-3 text-lg font-semibold tracking-tight">
          TheBridge<span className="text-sage">.</span>
        </Link>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate px-3 text-xs text-muted">{me.data?.email ?? ''}</p>
          <button
            onClick={logout}
            className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-paper"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="text-base font-semibold tracking-tight">
              TheBridge<span className="text-sage">.</span>
            </Link>
            <button onClick={logout} className="text-sm text-ink-soft">
              Sign out
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                    isActive ? 'bg-sage-mist font-medium text-sage-deep' : 'text-ink-soft'
                  }`
                }
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>

      {/* SOS — always visible, always free */}
      <Link
        to="/calm/sos"
        title="60-second reset"
        className="fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full bg-gem px-5 py-3 text-sm font-medium text-white shadow-lg shadow-gem/30 transition-transform hover:scale-105"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="calm-pulse absolute inline-flex h-full w-full rounded-full bg-white/70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        Calm me
      </Link>
    </div>
  )
}
