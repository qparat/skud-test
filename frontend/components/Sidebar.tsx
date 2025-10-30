'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Briefcase,
  Shield,
  Upload,
  UserCog
} from 'lucide-react'

const navigation = [
  { name: 'Расписание', href: '/', icon: LayoutDashboard },
  { name: 'Список сотрудников', href: '/employees', icon: Users },
  { name: 'Службы', href: '/departments', icon: Building2 },
  { name: 'Должности', href: '/positions', icon: Briefcase },
  { name: 'Исключения', href: '/exceptions', icon: Shield },
  { name: 'Пользователи', href: '/users', icon: UserCog, requireRole: 3 },
    { name: 'Загрузка файлов', href: '/upload', icon: Upload, requireRole: 3  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { hasRole } = useAuth()

  // Фильтруем навигацию по ролям
  const filteredNavigation = navigation.filter(item => {
    if (item.requireRole) {
      return hasRole(item.requireRole)
    }
    return true
  })

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r">
        <div className="flex items-center flex-shrink-0 px-4">
     <h1 className="text-xl font-bold text-gray-900">СКУД Система</h1>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  `}
                >
                  <item.icon
                    className={`
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                      mr-3 flex-shrink-0 h-5 w-5
                    `}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

