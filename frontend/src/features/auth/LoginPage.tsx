import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, setToken } from '../../lib/api'
import type { AuthResponse, AuthStatus } from '../../lib/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  const status = useQuery({
    queryKey: ['auth-status'],
    queryFn: () => api<AuthStatus>('/auth/status'),
  })

  const mutation = useMutation({
    mutationFn: () => {
      if (mode === 'register') {
        return api<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            displayName,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        })
      }
      return api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    },
    onSuccess: (data) => {
      setToken(data.token)
      navigate('/', { replace: true })
    },
  })

  const registrationOpen = status.data?.registrationOpen ?? false

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      {/* calm background blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sage-mist blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-gem-soft blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            TheBridge<span className="text-sage">.</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your private bridge between mind, body and routine.
          </p>
        </div>

        <form
          className="rounded-3xl border border-line bg-surface p-8 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <h2 className="text-base font-semibold">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {mode === 'login'
              ? 'Sign in to continue your practice.'
              : 'This is a single-person app — the first account becomes the only account.'}
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {mode === 'register' && (
              <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
                Name
                <input
                  className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-sage"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  maxLength={100}
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
              Email
              <input
                type="email"
                className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-sage"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-soft">
              Password
              <input
                type="password"
                className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-sage"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 8 : undefined}
              />
            </label>
          </div>

          {mutation.isError && (
            <p className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {mutation.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-6 w-full rounded-full bg-sage py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-deep disabled:opacity-50"
          >
            {mutation.isPending ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          {registrationOpen && (
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                mutation.reset()
              }}
              className="mt-3 w-full text-center text-xs text-muted transition-colors hover:text-ink-soft"
            >
              {mode === 'login'
                ? 'First time here? Create your account'
                : 'Already have an account? Sign in'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
