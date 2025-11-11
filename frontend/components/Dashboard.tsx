'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  MapPin,
  Activity,
  UserCheck
} from 'lucide-react'
import { apiRequest } from '@/lib/api'

// Простая круговая диаграмма без внешних зависимостей
interface PieChartProps {
  data: { name: string; value: number; color: string }[]
  size?: number
}

function PieChart({ data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90 // Начинаем сверху

  if (total === 0) return null

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform rotate-0">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const angle = (item.value / total) * 360
          const radius = size / 2 - 20
          const centerX = size / 2
          const centerY = size / 2

          const startAngle = (currentAngle * Math.PI) / 180
          const endAngle = ((currentAngle + angle) * Math.PI) / 180

          const x1 = centerX + radius * Math.cos(startAngle)
          const y1 = centerY + radius * Math.sin(startAngle)
          const x2 = centerX + radius * Math.cos(endAngle)
          const y2 = centerY + radius * Math.sin(endAngle)

          const largeArcFlag = angle > 180 ? 1 : 0

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ')

          currentAngle += angle

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              className="transition-all duration-1000 ease-in-out hover:brightness-110"
              style={{
                animation: `pieSlideIn 0.8s ease-out ${index * 0.1}s both`
              }}
            />
          )
        })}
      </svg>
      
      {/* Центральная статистика */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-bold text-gray-900">{total}</div>
        <div className="text-sm text-gray-500">Всего</div>
      </div>

      <style jsx>{`
        @keyframes pieSlideIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

interface DashboardStats {
  todayAttendance: {
    onTime: number
    late: number
  }
  weeklyTrend: {
    totalEmployees: number
    averageAttendance: number
    latePercentage: number
  }
  recentActivity: {
    totalEntries: number
    activeEmployees: number
    exceptions: number
  }
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      // Попробуем получить статистику с сервера, если не получится - используем mock данные
      const data = await apiRequest('dashboard-stats').catch(() => {
        // Mock данные для демонстрации
        return {
          todayAttendance: {
            onTime: 234,
            late: 45
          },
          weeklyTrend: {
            totalEmployees: 300,
            averageAttendance: 89.5,
            latePercentage: 15.2
          },
          recentActivity: {
            totalEntries: 1456,
            activeEmployees: 279,
            exceptions: 12
          }
        }
      })
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700">Ошибка загрузки: {error}</p>
      </div>
    )
  }

  if (!stats) return null

  const attendanceData = [
    { name: 'Вовремя', value: stats.todayAttendance.onTime, color: '#10b981' },
    { name: 'Опоздали', value: stats.todayAttendance.late, color: '#f59e0b' }
  ]

  const total = stats.todayAttendance.onTime + stats.todayAttendance.late

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Панель управления СКУД</h1>
            <p className="text-blue-100">
              Статистика посещаемости за {new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>
          <Calendar className="h-16 w-16 text-blue-200" />
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Пришли вовремя */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Пришли вовремя</p>
              <p className="text-3xl font-bold text-green-600 animate-pulse">
                {stats.todayAttendance.onTime}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              {(stats.todayAttendance.onTime / total * 100).toFixed(1)}% от присутствующих
            </div>
          </div>
        </div>

        {/* Опоздания */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Опоздания</p>
              <p className="text-3xl font-bold text-amber-600 animate-pulse">
                {stats.todayAttendance.late}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              {(stats.todayAttendance.late / total * 100).toFixed(1)}% от общего числа
            </div>
          </div>
        </div>



        {/* Активные сотрудники */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Активные сотрудники</p>
              <p className="text-3xl font-bold text-blue-600 animate-pulse">
                {stats.recentActivity.activeEmployees}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              Сейчас в здании
            </div>
          </div>
        </div>
      </div>

      {/* Графики и детальная статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Круговая диаграмма посещаемости */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение посещаемости</h3>
          <div className="flex items-center justify-center">
            <PieChart data={attendanceData} size={250} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-center">
            {attendanceData.map((item, index) => (
              <div key={index} className="p-3">
                <div className="flex items-center justify-center mb-2">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Недельная статистика */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Недельная статистика</h3>
          <div className="space-y-6">
            
            {/* Средняя посещаемость */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Средняя посещаемость</span>
                <span className="text-sm font-bold text-green-600">{stats.weeklyTrend.averageAttendance}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats.weeklyTrend.averageAttendance}%` }}
                ></div>
              </div>
            </div>

            {/* Процент опозданий */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Процент опозданий</span>
                <span className="text-sm font-bold text-amber-600">{stats.weeklyTrend.latePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats.weeklyTrend.latePercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Дополнительная информация</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Всего сотрудников</span>
                  <span className="font-semibold text-gray-900">{stats.weeklyTrend.totalEmployees}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Исключения</span>
                  <span className="font-semibold text-blue-600">{stats.recentActivity.exceptions}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200">
            <Calendar className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">Расписание</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200">
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">Сотрудники</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors duration-200">
            <AlertCircle className="h-8 w-8 text-amber-600 mb-2" />
            <span className="text-sm font-medium text-amber-700">Исключения</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200">
            <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">Отчеты</span>
          </button>
        </div>
      </div>
    </div>
  )
}