'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, User, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Employee {
  employee_id: number
  full_name: string
  first_entry: string | null
  last_exit: string | null
  first_entry_door: string | null
  last_exit_door: string | null
  is_late: boolean
  late_minutes: number
  work_hours: number | null
  status: string
  exception?: {
    has_exception: boolean
    reason: string
    type: string
  } | null
}

interface ScheduleData {
  date: string
  employees: Employee[]
  total_count: number
  late_count: number
}

export function EmployeeSchedule() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState('')
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const fetchSchedule = async (date?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const url = date 
        ? `http://localhost:8004/employee-schedule?date=${date}`
        : `http://localhost:8004/employee-schedule`
        
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setScheduleData(data)
      
      // Если дата не была установлена, устанавливаем дату из ответа API
      if (!date && data.date) {
        setCurrentDate(data.date)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
      console.error('Ошибка загрузки расписания:', err)
    } finally {
      setLoading(false)
    }
  }

  // Первоначальная загрузка без указания даты - API выберет последнюю доступную
  useEffect(() => {
    if (!initialized) {
      fetchSchedule()
      setInitialized(true)
    }
  }, [initialized])

  // Загрузка при изменении даты пользователем
  useEffect(() => {
    if (currentDate && initialized) {
      fetchSchedule(currentDate)
    }
  }, [currentDate, initialized])

  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/employees/${employeeId}`)
  }

  const exportToExcel = () => {
    if (!scheduleData || !scheduleData.employees.length) {
      alert('Нет данных для экспорта')
      return
    }

    // Подготавливаем данные для Excel
    const excelData = scheduleData.employees.map((employee, index) => ({
      '№': index + 1,
      'ФИО': employee.full_name,
      'Пришел': employee.first_entry || '-',
      'Ушел': employee.last_exit || '-',
      'Часы работы': employee.work_hours ? `${employee.work_hours.toFixed(1)} ч` : '-',
      'Статус': employee.status || (employee.is_late ? 'Опоздал' : 'В норме'),
      'Опоздание (мин)': employee.is_late ? employee.late_minutes : 0,
    }))

    // Создаем рабочую книгу
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    
    // Настраиваем ширину колонок
    const colWidths = [
      { wch: 5 },   // №
      { wch: 25 },  // ФИО
      { wch: 12 },  // Пришел
      { wch: 15 },  // Место входа
      { wch: 12 },  // Ушел
      { wch: 15 },  // Место выхода
      { wch: 12 },  // Часы работы
      { wch: 15 },  // Статус
      { wch: 12 },  // Опоздание
      { wch: 20 }   // Исключение
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Расписание')
    
    // Генерируем имя файла с датой
    const fileName = `Расписание_сотрудников_${scheduleData.date}.xlsx`
    
    // Скачиваем файл
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Выберите дату</h3>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Statistics */}
      {scheduleData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Всего сотрудников</p>
                  <p className="text-2xl font-bold text-blue-900">{scheduleData.total_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Опозданий</p>
                  <p className="text-2xl font-bold text-red-900">{scheduleData.late_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Дата</p>
                  <p className="text-2xl font-bold text-green-900">{scheduleData.date}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Расписание сотрудников</h3>
          {scheduleData && scheduleData.employees.length > 0 && (
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Выгрузить отчет
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Загрузка данных...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              <p>Ошибка: {error}</p>
              <button
                onClick={() => fetchSchedule(currentDate)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Повторить
              </button>
            </div>
          ) : scheduleData?.employees.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              Нет данных за выбранную дату
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ФИО
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
                {scheduleData?.employees.map((employee) => (
                  <tr
                    key={employee.employee_id}
                    className={`hover:bg-gray-50 ${employee.is_late ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEmployeeClick(employee.employee_id)}
                        className={`text-left font-medium ${
                          employee.is_late 
                            ? 'text-red-600 hover:text-red-800' 
                            : 'text-blue-600 hover:text-blue-800'
                        }`}
                      >
                        {employee.full_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {employee.first_entry || '-'}
                        {employee.first_entry_door && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {employee.first_entry_door}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {employee.last_exit || '-'}
                        {employee.last_exit_door && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {employee.last_exit_door}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.work_hours ? `${employee.work_hours.toFixed(1)} ч` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            employee.exception?.has_exception
                              ? 'bg-blue-100 text-blue-800'
                              : employee.is_late
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {employee.status || (employee.is_late ? 'Опоздал' : 'В норме')}
                        </span>
                        {employee.exception?.has_exception && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            🛡️ {employee.exception.reason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
