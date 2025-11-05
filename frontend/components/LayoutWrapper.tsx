'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { useAuth } from '@/components/AuthProvider'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  
  // Публичные страницы, которые не требуют авторизации
  const publicPages = ['/login']
  const isPublicPage = publicPages.includes(pathname)
  
  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublicPage) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, isPublicPage, router])
  
  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }
  
  // Если это публичная страница, показываем без layout
  if (isPublicPage) {
    return (
      <div className={`min-h-screen ${pathname === '/login' ? 'bg-white' : 'bg-gray-50'}`}>
        {children}
      </div>
    )
  }
  
  // Если пользователь не авторизован, ничего не показываем (будет редирект)
  if (!isAuthenticated) {
    return null
  }
  
 // Страницы, которые должны отображаться без Sidebar (только главная)
  // const fullWidthPages = ['/']
  
  // const isFullWidth = fullWidthPages.includes(pathname)

  // if (isFullWidth) {
  //   return (
  //     <div className="min-h-screen bg-gray-50">
  //       {children}
  //     </div>
  //   )
  // }

 // Страницы отдельных сотрудников не используют стандартный layout
  if (pathname.startsWith('/employees/') && pathname !== '/employees') {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-2">
          {children}
        </main>
      </div>
    </div>
  )
}

