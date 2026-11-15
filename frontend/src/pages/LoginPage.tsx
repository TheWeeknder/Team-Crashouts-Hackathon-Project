import { useId, type FormEvent } from 'react'
import useLogin from '../hooks/useLogin'
import useLogout from '../hooks/useLogout'
import useCurrentUser from '../hooks/useCurrentUser'
import AuthLayout from '../components/AuthLayout'

type LoginPageProps = {
  // Called after a successful login, e.g. to navigate to the dashboard.
  onSuccess?: () => void
  // Shows the register page instead (until we have a router).
  onShowRegister?: () => void
}

export default function LoginPage({ onSuccess, onShowRegister }: LoginPageProps) {
  const { login } = useLogin()
  const logout = useLogout()
  const { user, isLoading } = useCurrentUser()
  const usernameId = useId()
  const passwordId = useId()
  const errorId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    login.mutate(
      {
        username: String(form.get('username') ?? '').trim(),
        password: String(form.get('password') ?? ''),
      },
      { onSuccess },
    )
  }

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-3 py-8 text-base-content/70">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p>Checking your session…</p>
        </div>
      </AuthLayout>
    )
  }

  if (user) {
    return (
      <AuthLayout>
        <h2 className="text-2xl font-bold">You are logged in</h2>
        <p className="text-base-content/70">
          Signed in as <strong>{user.username}</strong>.
        </p>
        <button type="button" className="btn btn-primary mt-2" onClick={logout}>
          Log out
        </button>
      </AuthLayout>
    )
  }

  const error = login.error?.message ?? null

  return (
    <AuthLayout>
      <div>
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Log in to see your study plan.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <fieldset className="fieldset gap-1">
          <label htmlFor={usernameId} className="fieldset-legend pb-1 text-sm">
            Username
          </label>
          <input
            id={usernameId}
            name="username"
            type="text"
            className="input w-full"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={login.isPending}
            aria-describedby={error ? errorId : undefined}
          />
        </fieldset>

        <fieldset className="fieldset gap-1">
          <label htmlFor={passwordId} className="fieldset-legend pb-1 text-sm">
            Password
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            className="input w-full"
            autoComplete="current-password"
            required
            disabled={login.isPending}
            aria-describedby={error ? errorId : undefined}
          />
        </fieldset>

        {error && (
          <div id={errorId} className="alert alert-error alert-soft text-sm" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={login.isPending}>
          {login.isPending && <span className="loading loading-spinner loading-sm" />}
          {login.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      {onShowRegister && (
        <p className="text-center text-sm text-base-content/70">
          No account yet?{' '}
          <button type="button" className="link link-primary font-medium" onClick={onShowRegister}>
            Create one
          </button>
        </p>
      )}
    </AuthLayout>
  )
}
