const API_URL = 'http://localhost:8000'

let accessToken: string | null = null

let refreshPromise: Promise<string | null> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        accessToken = null
        return null
      }

      const data: { access_token: string } =
        await response.json()

      accessToken = data.access_token

      return accessToken
    } catch {
      accessToken = null
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers)

  if (accessToken) {
    headers.set(
      'Authorization',
      `Bearer ${accessToken}`,
    )
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // La petición funcionó o falló por una razón
  // diferente a autenticación.
  if (response.status !== 401) {
    return response
  }

  // El access token probablemente expiró.
  // Intentamos obtener uno nuevo utilizando
  // el refresh token HttpOnly.
  const newAccessToken = await refreshAccessToken()

  if (!newAccessToken) {
    return response
  }

  // Reintentamos la petición original con
  // el nuevo access token.
  headers.set(
    'Authorization',
    `Bearer ${newAccessToken}`,
  )

  response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  return response
}

