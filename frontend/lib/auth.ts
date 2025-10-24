import { createContext, useContext } from 'react'

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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
  [USER_ROLES.USER]: 'User'
} as const

// Проверка прав доступа
export const hasPermission = (userRole: number, requiredRole: number): boolean => {
  return userRole <= requiredRole // Меньше число = больше прав
}

// Утилиты для работы с токенами
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export const setStoredToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

export const removeStoredToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null
  const userData = localStorage.getItem('auth_user')
  return userData ? JSON.parse(userData) : null
}

export const setStoredUser = (user: User): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_user', JSON.stringify(user))
}

export const removeStoredUser = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_user')
}