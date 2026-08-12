import { useState, type SubmitEventHandler } from 'react'
import { register } from '../services/authApi'

interface RegisterProps {
  onBackToLogin: () => void
}

export default function Register({
  onBackToLogin,
}: RegisterProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError('Todos los campos son obligatorios.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    try {
      await register(username, email, password)

      alert(
        'Cuenta creada correctamente. Ahora puedes iniciar sesión.',
      )

      onBackToLogin()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear la cuenta.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-background">
        <div className="login-glow login-glow-one" />
        <div className="login-glow login-glow-two" />
      </div>

      <section className="login-card register-card">
        <div className="login-brand">
          <div className="login-logo">
            <span>⚡</span>
          </div>

          <div>
            <span className="login-brand-name">
              Pokémon Manager
            </span>

            <span className="login-brand-subtitle">
              POKÉDEX MANAGEMENT
            </span>
          </div>
        </div>

        <div className="login-header">
          <h1>Crear cuenta</h1>

          <p>
            Regístrate para comenzar a administrar tu colección
            de Pokémon.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          <div className="login-field">
            <label htmlFor="register-username">
              Usuario
            </label>

            <input
              id="register-username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Ingresa tu usuario"
              required
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-email">
              Correo electrónico
            </label>

            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Ingresa tu correo"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-password">
              Contraseña
            </label>

            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-confirm-password">
              Confirmar contraseña
            </label>

            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirma tu contraseña"
              required
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        <div className="register-footer">
          <span>¿Ya tienes una cuenta?</span>

          <button
            type="button"
            className="login-register-link"
            onClick={onBackToLogin}
            disabled={loading}
          >
            Inicia sesión
          </button>
        </div>

        <div className="login-footer register-bottom-footer">
          <span>Pokémon Manager</span>
          <span>•</span>
          <span>Tu colección, organizada.</span>
        </div>
      </section>
    </main>
  )
}