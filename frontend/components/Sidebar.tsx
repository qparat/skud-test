'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Briefcase,
  Shield,
  Upload,
  UserCog,
  File,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react'

const navigation = [
  { name: 'Расписание', href: '/schedule', icon: LayoutDashboard },
  { name: 'Список сотрудников', href: '/employees', icon: Users },
  { name: 'Смены', href: '/shifts', icon: Calendar, requireRole: 2 },
  { name: 'Отчеты', href: '/reports', icon: File, requireRole: 2 },
  { name: 'Службы', href: '/departments', icon: Building2, requireRole: 2 },
  { name: 'Должности', href: '/positions', icon: Briefcase, requireRole: 2 },
  { name: 'Исключения', href: '/exceptions', icon: Shield, requireRole: 2 },
  { name: 'Пользователи', href: '/users', icon: UserCog, requireRole: 1 },
  { name: 'Загрузка файлов', href: '/upload', icon: Upload, requireRole: 1  },
  { name: 'Список с ФИО полным', href: '/employees-full', icon: BookOpen, requireRole: 1 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { hasRole, hasAnyRole } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(true)

  // Фильтруем навигацию по ролям
  const filteredNavigation = navigation.filter(item => {
    if (item.requireRole) {
      if (Array.isArray(item.requireRole)) {
        return hasAnyRole(item.requireRole)
      }
      return hasRole(item.requireRole)
    }
    return true
  })

  return (
    <div className={`hidden md:flex md:flex-col transition-all duration-300 ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}>
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r relative group">
        {/* Кнопка сворачивания */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-50 z-10 shadow-sm transition-opacity ${
            isCollapsed ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
          style={{ right: '0.7rem', top: '1rem' }}
          title={isCollapsed ? 'Развернуть' : 'Свернуть'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>

        <div className="flex items-center flex-shrink-0 px-4">
          <img src="/SCUD_2.svg" alt="SCUD" className="h-8 w-auto mr-2" />
          {!isCollapsed && <h1 className="text-xl font-bold text-gray-900">СКУД Система</h1>}
        </div>
        <div className="mt-5 flex-grow flex flex-col justify-between">
          <nav className="flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.name : ''}
                >
                  <item.icon
                    className={`
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                      ${isCollapsed ? '' : 'mr-3'} flex-shrink-0 h-5 w-5
                    `}
                  />
                  {!isCollapsed && item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Инструкция в самом низу */}
          <div className="px-2 mt-4 border-t border-gray-200 pt-4">
            <Link
              href="/manual"
              className={`
                ${pathname === '/manual'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
                group flex items-center px-2 py-2 text-sm font-medium rounded-md
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Инструкция по эксплуатации' : ''}
            >
              <BookOpen
                className={`
                  ${pathname === '/manual' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                  ${isCollapsed ? '' : 'mr-3'} flex-shrink-0 h-5 w-5
                `}
              />
              {!isCollapsed && 'Инструкция'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

