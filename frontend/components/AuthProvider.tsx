'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiRequest } from './api'

export interface User {
  id: number
  username: string
  email: string
  full_name?: string
  role: number
  is_active: boolean
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  hasRole: (minRole: number) => boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Роли пользователей
export const USER_ROLES = {
  ROOT: 0,
  SUPERADMIN: 2,
  USER: 3
} as const

export const ROLE_NAMES = {
  [USER_ROLES.ROOT]: 'Root',
  [USER_ROLES.SUPERADMIN]: 'Super Admin',
  [USER_ROLES.USER]: 'Пользователь'
} as const

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          
          // Проверяем валидность токена
          await apiRequest('me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })
        } catch (error) {
          // Токен недействителен, очищаем
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest('login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const { access_token, user: userData } = response
      
      // Сохраняем токен и данные пользователя
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      
      setToken(access_token)
      setUser(userData)
    } catch (error) {
      throw new Error('Неверные учетные данные')
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await apiRequest('logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Ошибка выхода:', error)
    } finally {
      // Всегда очищаем локальные данные
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setToken(null)
      setUser(null)
    }
  }

  const hasRole = (minRole: number): boolean => {
    if (!user) return false
    return user.role <= minRole // Меньше число = больше прав
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    hasRole,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Компонент для защиты маршрутов
interface ProtectedRouteProps {
  children: ReactNode
  minRole?: number
  fallback?: ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  minRole = USER_ROLES.USER,
  fallback = null 
}) => {
  const { isAuthenticated, hasRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Требуется авторизация</h1>
          <p className="text-gray-600">Пожалуйста, войдите в систему для доступа к этой странице</p>
        </div>
      </div>
    )
  }

  if (!hasRole(minRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Недостаточно прав</h1>
          <p className="text-gray-600">У вас нет прав для доступа к этой странице</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}