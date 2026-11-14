import { useId, type FormEvent } from 'react'
import useLogin from '../hooks/useLogin'
import useLogout from '../hooks/useLogout'
import useCurrentUser from '../hooks/useCurrentUser'
import './LoginPage.css'

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
      <main className="login-page">
        <p className="login-status">Checking your session…</p>
      </main>
    )
  }

  if (user) {
    return (
      <main className="login-page">
        <section className="login-card">
          <h2>You are logged in</h2>
          <p className="login-status">
            Signed in as <strong>{user.username}</strong>.
          </p>
          <button type="button" className="login-button" onClick={logout}>
            Log out
          </button>
        </section>
      </main>
    )
  }

  const error = login.error?.message ?? null

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-brand">Adaptive Study Planner</p>
        <h2>Log in</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor={usernameId}>Username</label>
          <input
            id={usernameId}
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={login.isPending}
            aria-describedby={error ? errorId : undefined}
          />

          <label htmlFor={passwordId}>Password</label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={login.isPending}
            aria-describedby={error ? errorId : undefined}
          />

          {error && (
            <p id={errorId} className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-button" disabled={login.isPending}>
            {login.isPending ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        {onShowRegister && (
          <p className="login-switch">
            No account yet?{' '}
            <button type="button" onClick={onShowRegister}>
              Create one
            </button>
          </p>
        )}
      </section>
    </main>
  )
}
