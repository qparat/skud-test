// API Configuration
export const API_BASE_URL = '/api'

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// API helper function
export async function apiRequest(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  
  // Automatically add auth token if available
  const token = getAuthToken()
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options?.headers,
  })
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  const response = await fetch(url, {
    headers,
    ...options,
  })

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      // Перенаправляем на страницу логина только если мы не на ней
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    throw new Error('Сессия истекла. Требуется повторная авторизация.')
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  // Проверяем, есть ли содержимое для парсинга
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  
  return response.text()
}

// Convenience methods
export const apiGet = (endpoint: string) => apiRequest(endpoint, { method: 'GET' })

export const apiPost = (endpoint: string, data?: any) => apiRequest(endpoint, {
  method: 'POST',
  body: data ? JSON.stringify(data) : undefined,
})

export const apiPut = (endpoint: string, data?: any) => apiRequest(endpoint, {
  method: 'PUT', 
  body: data ? JSON.stringify(data) : undefined,
})

export const apiDelete = (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' })
