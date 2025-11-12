'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Wifi, WifiOff, User, LogOut, Home, HelpCircle } from 'lucide-react'
import { useAuth, USER_ROLES, ROLE_NAMES } from './AuthProvider'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface HeaderProps {
  onShowInstructions?: () => void
}

export function Header({ onShowInstructions }: HeaderProps = {}) {
  const [isOnline, setIsOnline] = useState(true)
  const [currentTime, setCurrentTime] = useState('')
  const [isClient, setIsClient] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const pathname = usePathname()
  
  // Проверяем, находимся ли мы на главной странице
  const isHomePage = pathname === '/'

  // Prevent hydration mismatch by only showing time on client
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date().toLocaleTimeString('ru-RU'))
  }, [])

  // Update time every second
  useEffect(() => {
    if (!isClient) return
    
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ru-RU'))
    }, 1000)
    return () => clearInterval(interval)
  }, [isClient])

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      logout()
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          {isHomePage ? (
            <h2 className="text-lg font-semibold text-gray-900">
              Система контроля доступа
            </h2>
          ) : (
            <Link 
              href="/" 
              className="flex items-center space-x-2 px-3 py-2 text-lg font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
            >
              <Home className="h-5 w-5" />
              <span>На главную</span>
            </Link>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
           title="Обновить данные"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          {/* Кнопка справки */}
          {onShowInstructions && (
            <button
              onClick={onShowInstructions}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
              title="Показать инструкцию"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          )}
          <span className="text-sm text-gray-600">
            {isClient ? currentTime : '--:--:--'}
          </span>
          
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
                 {isOnline ? 'Подключено' : 'Нет связи'}
            </span>
          </div>

          {/* Информация о пользователе */}
          {isAuthenticated && user && (
            <div className="flex items-center space-x-3 bg-gray-50 px-3 py-2 rounded-md">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {user.full_name || user.username}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ROLE_NAMES[user.role as keyof typeof ROLE_NAMES] || 'Пользователь'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                title="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

