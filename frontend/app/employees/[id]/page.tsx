'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, TrendingUp, User } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface DailyRecord {
  date: string
  first_entry: string | null
  last_exit: string | null
  work_hours: number | null
  is_late: boolean
}

interface EmployeeHistory {
  employee_name: string
  total_days: number
  attendance_rate: number
  punctuality_rate: number
  avg_arrival_time: string | null
  avg_departure_time: string | null
  avg_work_hours: number | null
  daily_records: DailyRecord[]
}

interface EmployeePageProps {
  params: {
    id: string
  }
}

export default function EmployeePage({ params }: EmployeePageProps) {
  const router = useRouter()
  const [employeeData, setEmployeeData] = useState<EmployeeHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await apiRequest(`/employee-history/${params.id}`)
        setEmployeeData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
        console.error('Ошибка загрузки данных сотрудника:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeData()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Загрузка данных сотрудника...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка загрузки</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    )
  }

  if (!employeeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Сотрудник не найден</h1>
          <p className="text-gray-600 mb-4">Данные по сотруднику с ID {params.id} не найдены</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Назад
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {employeeData.employee_name}
                  </h1>
                  <p className="text-sm text-gray-500">Профиль сотрудника</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Дней присутствия</p>
                <p className="text-2xl font-bold text-gray-900">{employeeData.total_days}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Посещаемость</p>
                <p className="text-2xl font-bold text-gray-900">{employeeData.attendance_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Пунктуальность</p>
                <p className="text-2xl font-bold text-gray-900">{employeeData.punctuality_rate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Часы работы</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employeeData.avg_work_hours ? `${employeeData.avg_work_hours.toFixed(1)}ч` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Stats */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Средние показатели</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Время прихода</p>
                <p className="text-xl font-bold text-gray-900">
                  {employeeData.avg_arrival_time || '-'}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Время ухода</p>
                <p className="text-xl font-bold text-gray-900">
                  {employeeData.avg_departure_time || '-'}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Средние часы</p>
                <p className="text-xl font-bold text-gray-900">
                  {employeeData.avg_work_hours ? `${employeeData.avg_work_hours.toFixed(1)} ч` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Records Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">История посещений</h3>
            <p className="text-sm text-gray-600">Детальная информация по дням</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пришел
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ушел
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Часы работы
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeeData.daily_records.length > 0 ? (
                  employeeData.daily_records.map((record, index) => (
                    <tr
                      key={`${record.date}-${index}`}
                      className={record.is_late ? 'bg-red-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.first_entry || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.last_exit || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.work_hours ? `${record.work_hours.toFixed(1)} ч` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.is_late
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {record.is_late ? 'Опоздал' : 'В норме'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">Нет данных</p>
                        <p className="text-sm">История посещений пуста</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}