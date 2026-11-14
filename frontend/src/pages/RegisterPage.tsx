import { useId, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import useRegister, { type RegisterError } from '../hooks/useRegister'
import './LoginPage.css'

type RegisterPageProps = {
  // Called after the account is created and the user is logged in.
  onSuccess?: () => void
  // Shows the login page instead (until we have a router).
  onShowLogin?: () => void
}

type Field = 'username' | 'email' | 'password' | 'confirm'
type FieldErrors = Partial<Record<Field, string>>

const MIN_PASSWORD_LENGTH = 8

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Django REST Framework sends 400 errors as { field: ["message", ...] }.
// Field errors go next to their input; anything else goes in the alert.
function serverErrors(error: RegisterError | null): {
  fields: FieldErrors
  general: string | null
} {
  if (!error) return { fields: {}, general: null }
  const { data } = error
  if (error.status !== 400 || !data || typeof data !== 'object') {
    return { fields: {}, general: error.message }
  }
  const fields: FieldErrors = {}
  const general: string[] = []
  for (const [key, value] of Object.entries(data)) {
    const message = capitalize(Array.isArray(value) ? value.join(' ') : String(value))
    if (key === 'username' || key === 'email' || key === 'password') {
      fields[key] = message
    } else {
      general.push(message)
    }
  }
  return { fields, general: general.length ? general.join(' ') : null }
}

function validate(values: Record<Field, string>): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.username) errors.username = 'Enter a username.'
  if (!values.email) errors.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (values.confirm !== values.password) errors.confirm = 'The passwords do not match.'
  return errors
}

export default function RegisterPage({ onSuccess, onShowLogin }: RegisterPageProps) {
  const { register } = useRegister()
  const [clientErrors, setClientErrors] = useState<FieldErrors>({})
  const baseId = useId()
  const id = (name: string) => `${baseId}-${name}`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values = {
      username: String(form.get('username') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
      confirm: String(form.get('confirm') ?? ''),
    }
    const errors = validate(values)
    setClientErrors(errors)
    if (Object.keys(errors).length > 0) {
      register.reset()
      return
    }
    register.mutate(
      { username: values.username, email: values.email, password: values.password },
      { onSuccess },
    )
  }

  const server = serverErrors(register.error)
  const errorFor = (field: Field) => clientErrors[field] ?? server.fields[field]

  function renderField(
    field: Field,
    label: string,
    inputProps: InputHTMLAttributes<HTMLInputElement>,
  ) {
    const error = errorFor(field)
    return (
      <>
        <label htmlFor={id(field)}>{label}</label>
        <input
          id={id(field)}
          name={field}
          required
          disabled={register.isPending}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? id(`${field}-error`) : undefined}
          {...inputProps}
        />
        {error && (
          <p id={id(`${field}-error`)} className="login-field-error">
            {error}
          </p>
        )}
      </>
    )
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-brand">Adaptive Study Planner</p>
        <h2>Create an account</h2>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {renderField('username', 'Username', {
            type: 'text',
            autoComplete: 'username',
            autoCapitalize: 'none',
            spellCheck: false,
          })}
          {renderField('email', 'Email', { type: 'email', autoComplete: 'email' })}
          {renderField('password', 'Password', {
            type: 'password',
            autoComplete: 'new-password',
            minLength: MIN_PASSWORD_LENGTH,
          })}
          {renderField('confirm', 'Confirm password', {
            type: 'password',
            autoComplete: 'new-password',
          })}

          {server.general && (
            <p className="login-error" role="alert">
              {server.general}
            </p>
          )}

          <button type="submit" className="login-button" disabled={register.isPending}>
            {register.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {onShowLogin && (
          <p className="login-switch">
            Already have an account?{' '}
            <button type="button" onClick={onShowLogin}>
              Log in
            </button>
          </p>
        )}
      </section>
    </main>
  )
}
