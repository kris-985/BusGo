import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { routes } from '@/app/router/routes'
import { useAuth } from '@/features/auth/model/authContext'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { getUserFriendlyErrorMessage } from '@/shared/api/errors'

type AuthMode = 'login' | 'signup'

export function AuthPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<AuthMode>('login')
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? routes.profile()

  if (auth.isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        await auth.signup({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
        })
      } else {
        await auth.login({
          email: values.email.trim(),
          password: values.password,
        })
      }
      navigate(from, { replace: true })
    } catch (submitError) {
      setError(getUserFriendlyErrorMessage(submitError, 'Authentication failed. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
      <section className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase text-cyan-100">
          Passenger account
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          {mode === 'signup' ? 'Create your BusGo account' : 'Login to BusGo'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Use an account to keep tickets attached to your profile and unlock the admin dashboard when your MongoDB user has role admin.
        </p>
        <div className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">Profile tickets</div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">Protected checkout</div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">Role admin panel</div>
        </div>
      </section>

      <Card className="p-6">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <button
            className={`h-10 rounded-md text-sm font-semibold ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
          >
            Login
          </button>
          <button
            className={`h-10 rounded-md text-sm font-semibold ${mode === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
          >
            Sign up
          </button>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <Input
              label="Name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              required
            />
          ) : null}
          <Input
            label="Email"
            type="email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            minLength={6}
            value={values.password}
            onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            required
          />

          {error ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
