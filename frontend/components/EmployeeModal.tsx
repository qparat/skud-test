'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, TrendingUp } from 'lucide-react'

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

interface EmployeeModalProps {
  employeeId: number
  onClose: () => void
}

export function EmployeeModal({ employeeId, onClose }: EmployeeModalProps) {
  const [historyData, setHistoryData] = useState<EmployeeHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`http://localhost:8004/employee-history/${employeeId}`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setHistoryData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
        console.error('Ошибка загрузки истории:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [employeeId])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {historyData ? `История: ${historyData.employee_name}` : 'Загрузка...'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Загрузка истории сотрудника...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Ошибка: {error}</p>
            </div>
          ) : historyData ? (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-900">Дней присутствия</h4>
                  <p className="text-2xl font-bold text-blue-600">{historyData.total_days}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-900">Посещаемость</h4>
                  <p className="text-2xl font-bold text-green-600">{historyData.attendance_rate.toFixed(1)}%</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-orange-900">Пунктуальность</h4>
                  <p className="text-2xl font-bold text-orange-600">{historyData.punctuality_rate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Average stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Средние показатели</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Время прихода:</span>{' '}
                    <span className="font-medium">{historyData.avg_arrival_time || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Время ухода:</span>{' '}
                    <span className="font-medium">{historyData.avg_departure_time || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Часы работы:</span>{' '}
                    <span className="font-medium">
                      {historyData.avg_work_hours ? `${historyData.avg_work_hours.toFixed(1)} ч` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily records table */}
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
                    {historyData.daily_records.map((record) => (
                      <tr
                        key={record.date}
                        className={record.is_late ? 'bg-red-50' : ''}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
