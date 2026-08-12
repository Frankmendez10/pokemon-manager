import { setAccessToken } from './apiClient'

const API_URL = 'http://localhost:8000'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const formData = new URLSearchParams()

  formData.append('username', username)
  formData.append('password', password)

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    throw new Error(
      error?.detail ?? 'Usuario o contraseña incorrectos',
    )
  }

  const data: LoginResponse = await response.json()

  setAccessToken(data.access_token)

  return data
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  setAccessToken(null)
}

export async function restoreSession(): Promise<string | null> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    setAccessToken(null)
    return null
  }

  const data: LoginResponse = await response.json()

  setAccessToken(data.access_token)

  return data.access_token
}