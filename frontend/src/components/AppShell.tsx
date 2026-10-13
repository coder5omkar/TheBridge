import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'
import type { UserView } from '../lib/types'

const NAV_MENU = [
  { to: '/', label: 'Today', icon: '🏠', end: true },
  { to: '/diary', label: 'Diary', icon: '✍️', end: false },
  { to: '/calm', label: 'Calm', icon: '🧘', end: false },
]

const NAV_LIFE = [
  { to: '/health', label: 'Health', icon: '🩺', end: false },
  { to: '/garden', label: 'Garden', icon: '🪴', end: false },
]

const NAV_MOBILE = [...NAV_MENU, ...NAV_LIFE]

const sidebarClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
    isActive
      ? 'bg-sage font-semibold text-white shadow-lg shadow-sage/25'
      : 'text-muted hover:bg-surface hover:text-ink-soft'
  }`

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

  const initials = (me.data?.displayName ?? '?').trim().charAt(0).toUpperCase()

  return (
    <div className="min-h-screen p-3 md:p-6">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[28px] bg-paper shadow-2xl shadow-black/30 md:h-[calc(100vh-3rem)]">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-line/60 bg-[#101013] p-5 md:flex">
          <div className="flex items-center gap-3 rounded-2xl bg-surface/60 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sage to-[#8b5cf6] text-sm font-bold text-white">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {me.data?.displayName ?? '…'}
              </span>
              <span className="block truncate text-[11px] text-muted">{me.data?.email ?? ''}</span>
            </span>
          </div>

          <p className="mt-6 px-2 text-[10px] font-bold uppercase tracking-widest text-muted">Menu</p>
          <nav className="mt-2 flex flex-col gap-1">
            {NAV_MENU.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={sidebarClass}>
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <p className="mt-5 px-2 text-[10px] font-bold uppercase tracking-widest text-muted">Life</p>
          <nav className="mt-2 flex flex-col gap-1">
            {NAV_LIFE.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={sidebarClass}>
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={logout}
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink-soft"
          >
            <span aria-hidden>↩️</span>
            Log out
          </button>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line/60 px-5 py-3 md:hidden">
            <Link to="/" className="text-base font-semibold tracking-tight">
              TheBridge<span className="text-sage">.</span>
            </Link>
            <button
              onClick={logout}
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-ink-soft"
            >
              Sign out
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 pb-32 md:p-7 md:pb-7">
            <Outlet />
          </main>
        </div>
      </div>

      {/* SOS — always visible, always free */}
      <Link
        to="/calm/sos"
        title="60-second reset"
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-[#4e54f5] to-[#8b5cf6] px-5 py-3 text-sm font-medium text-white shadow-lg shadow-sage/40 transition-transform hover:scale-105 md:bottom-8 md:right-[max(1.25rem,calc(50%-35rem))]"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="calm-pulse absolute inline-flex h-full w-full rounded-full bg-white/70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>
        Calm me
      </Link>

      {/* Bottom nav (mobile only) */}
      <nav className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-surface/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur md:hidden">
        {NAV_MOBILE.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-14 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[10px] transition-colors ${
                isActive ? 'bg-sage font-medium text-white' : 'text-muted'
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
