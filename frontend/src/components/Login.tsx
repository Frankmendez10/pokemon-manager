import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { login } from '../services/authApi'

interface LoginProps {
onLogin: (token: string) => void
}

export default function Login({ onLogin }: LoginProps) {
const [username, setUsername] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)

async function handleSubmit(event: SubmitEvent) {
  event.preventDefault()

  setError('')
  setLoading(true)

  try {
    const response = await login(username, password)

    onLogin(response.access_token)
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'No fue posible iniciar sesión',
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

  <section className="login-card">
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
      <h1>Bienvenido</h1>
      <p>
        Inicia sesión para administrar tu colección de Pokémon.
      </p>
    </div>

    <form onSubmit={handleSubmit} className="login-form">
      <div className="login-field">
        <label htmlFor="username">
          Usuario
        </label>

        <input
          id="username"
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
        <label htmlFor="password">
          Contraseña
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="Ingresa tu contraseña"
          required
          autoComplete="current-password"
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
            Iniciando sesión...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </button>
    </form>

    <div className="login-footer">
      <span>Pokémon Manager</span>
      <span>•</span>
      <span>Tu colección, organizada.</span>
    </div>
  </section>
</main>

)
}