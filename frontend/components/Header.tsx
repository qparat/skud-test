'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

export function Header() {
  const [isOnline, setIsOnline] = useState(true)
  const [currentTime, setCurrentTime] = useState('')
  const [isClient, setIsClient] = useState(false)

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

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Система контроля доступа
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
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
          
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
           title="Обновить данные"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

