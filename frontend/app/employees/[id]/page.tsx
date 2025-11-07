'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, TrendingUp, User, Edit2, Save, X } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/components/AuthProvider'

interface DailyRecord {
  date: string
  first_entry: string | null
  last_exit: string | null
  work_hours: number | null
  is_late: boolean
  has_exception?: boolean
  exception_info?: {
    reason: string
    exception_type: string
  } | null
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

interface EmployeeDetails {
  id: number
  full_name: string
  birth_date?: string
  card_number?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  department?: {
    id: number
    name: string
  }
  position?: {
    id: number
    name: string
  }
}

interface EmployeePageProps {
  params: {
    id: string
  }
}

export default function EmployeePage({ params }: EmployeePageProps) {
  const { hasAnyRole } = useAuth();
  const router = useRouter()
  const [employeeData, setEmployeeData] = useState<EmployeeHistory | null>(null)
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Состояния для редактирования
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false)
  const [newBirthDate, setNewBirthDate] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Загружаем историю сотрудника и его детальную информацию параллельно
        const [historyData, detailsData] = await Promise.all([
          apiRequest(`/employee-history/${params.id}`),
          apiRequest(`/employees/${params.id}`)
        ])
        
        setEmployeeData(historyData)
        setEmployeeDetails(detailsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
        console.error('Ошибка загрузки данных сотрудника:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeData()
  }, [params.id])

  const handleEditBirthDate = () => {
    setNewBirthDate(employeeDetails?.birth_date || '')
    setIsEditingBirthDate(true)
  }

  const handleSaveBirthDate = async () => {
    if (!employeeDetails) return

    setUpdating(true)
    try {
      await apiRequest(`/employees/${employeeDetails.id}`, {
        method: 'PUT',
        body: JSON.stringify({ birth_date: newBirthDate })
      })

      // Обновляем локальное состояние
      setEmployeeDetails(prev => prev ? { ...prev, birth_date: newBirthDate } : null)
      setIsEditingBirthDate(false)
    } catch (err) {
      console.error('Ошибка обновления даты рождения:', err)
      alert('Ошибка обновления даты рождения')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingBirthDate(false)
    setNewBirthDate('')
  }

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
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Профиль сотрудника</span>
                    {employeeDetails?.birth_date && (
                      <>
                        <span>•</span>
                        <span>Дата рождения: {employeeDetails.birth_date}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards (только для ролей 1 и 2) */}
        {hasAnyRole([0]) && (
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
        )}

        {/* Personal Information */}
        {employeeDetails && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Персональная информация</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">ФИО</p>
                  <p className="text-lg font-medium text-gray-900">{employeeDetails.full_name}</p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-600">Дата рождения</p>
                    {!isEditingBirthDate && (
                      <button
                        onClick={handleEditBirthDate}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        title="Редактировать дату рождения"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {isEditingBirthDate ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={newBirthDate}
                        onChange={(e) => setNewBirthDate(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        disabled={updating}
                      />
                      <button
                        onClick={handleSaveBirthDate}
                        disabled={updating}
                        className="text-green-600 hover:text-green-800 p-1 rounded disabled:opacity-50"
                        title="Сохранить"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updating}
                        className="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                        title="Отменить"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-lg font-medium text-blue-900">
                      {employeeDetails.birth_date || 'Не указана'}
                    </p>
                  )}
                </div>
                
                {employeeDetails.department && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Отдел</p>
                    <p className="text-lg font-medium text-green-900">{employeeDetails.department.name}</p>
                  </div>
                )}
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Должность</p>
                  <p className="text-lg font-medium text-purple-900">
                    {employeeDetails.position?.name || 'Не указана'}
                  </p>
                </div>
                
                {employeeDetails.card_number && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Номер карты</p>
                    <p className="text-lg font-medium text-orange-900">{employeeDetails.card_number}</p>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">ID сотрудника</p>
                  <p className="text-lg font-medium text-gray-900">{employeeDetails.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  employeeData.daily_records.map((record, index) => {
                    // Логика для статуса: если есть исключение, показываем исключение; иначе если опоздал, показываем "Опоздал"; иначе "В норме"
                    let statusBadge;
                    if (record.has_exception) {
                      statusBadge = (
                        <div className="flex items-center space-x-2">
                          {record.exception_info && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800" title={record.exception_info.reason}>
                              {record.exception_info.reason.length > 20 
                                ? `🛡️ ${record.exception_info.reason.substring(0, 20)}...`
                                : `🛡️ ${record.exception_info.reason}`
                              }
                            </div>
                          )}
                        </div>
                      );
                    } else if (record.is_late) {
                      statusBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Опоздал
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          В норме
                        </span>
                      );
                    }
                    return (
                      <tr
                        key={`${record.date}-${index}`}
                        className={record.has_exception 
                          ? 'bg-blue-50' 
                          : record.is_late 
                            ? 'bg-red-50' 
                            : 'hover:bg-gray-50'
                        }
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
                          {statusBadge}
                        </td>
                      </tr>
                    );
                  })
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