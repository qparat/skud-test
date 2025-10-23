// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// API helper function
export async function apiRequest(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  // РџСЂРѕРІРµСЂСЏРµРј, РµСЃС‚СЊ Р»Рё СЃРѕРґРµСЂР¶РёРјРѕРµ РґР»СЏ РїР°СЂСЃРёРЅРіР°
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
