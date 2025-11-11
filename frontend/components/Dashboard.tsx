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

// Функция для правильного получения даты в формате YYYY-MM-DD без проблем с временной зоной
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'onTime' | 'late'>('onTime')
  const [employeeDetails, setEmployeeDetails] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  
  // Получаем сегодняшнюю дату для ограничения выбора
  const today = formatDate(new Date())

  useEffect(() => {
    console.log('useEffect triggered, selectedDate:', selectedDate) // Отладка
    fetchDashboardStats(selectedDate)
  }, [selectedDate])

  // Закрытие календаря и модального окна при клике вне их области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showCalendar && !target.closest('.calendar-container')) {
        setShowCalendar(false);
      }
      if (showModal && target.classList.contains('modal-backdrop')) {
        setShowModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar, showModal]);

  // Функции для навигации по календарю
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  // Генерация календаря
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Понедельник как первый день
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  // Обработка клика по дате
  const handleDateClick = (dateStr: string) => {
    if (dateStr > today) return // Нельзя выбирать будущие даты
    console.log('Selected date:', dateStr) // Отладка
    setSelectedDate(dateStr)
    setShowCalendar(false)
  }

  // Получение детальной информации о сотрудниках
  const fetchEmployeeDetails = async (type: 'onTime' | 'late') => {
    try {
      setModalLoading(true)
      const targetDate = selectedDate || today
      const endpoint = `employee-schedule?date=${targetDate}`
      console.log('Fetching employee details from:', endpoint) // Отладка
      const response = await apiRequest(endpoint)
      console.log('Employee schedule response:', response) // Отладка
      
      // Фильтруем сотрудников в зависимости от типа
      let filteredEmployees = []
      if (response.employees) {
        if (type === 'onTime') {
          // Сотрудники, которые пришли и не опоздали
          filteredEmployees = response.employees.filter((emp: any) => 
            emp.first_entry && !emp.is_late
          ).map((emp: any) => {
            console.log('Processing onTime employee:', emp) // Отладка структуры
            return {
              id: emp.id || emp.employee_id || emp.emp_id,
              name: emp.full_name || emp.name,
              first_entry: emp.first_entry,
              is_late: emp.is_late
            }
          })
        } else if (type === 'late') {
          // Сотрудники, которые опоздали
          filteredEmployees = response.employees.filter((emp: any) => 
            emp.first_entry && emp.is_late
          ).map((emp: any) => {
            console.log('Processing late employee:', emp) // Отладка структуры
            return {
              id: emp.id || emp.employee_id || emp.emp_id,
              name: emp.full_name || emp.name,
              first_entry: emp.first_entry,
              is_late: emp.is_late
            }
          })
        }
      }
      
      console.log('Filtered employees:', filteredEmployees) // Отладка
      setEmployeeDetails(filteredEmployees)
      setModalType(type)
      setShowModal(true)
    } catch (err) {
      console.error('Ошибка получения данных сотрудников:', err)
      // Показываем mock данные для демонстрации
      const mockEmployees = type === 'onTime' ? [
        { id: 123, name: 'Иванов Иван Иванович', first_entry: '08:45:00', is_late: false },
        { id: 456, name: 'Петров Петр Петрович', first_entry: '08:50:00', is_late: false },
      ] : [
        { id: 789, name: 'Сидоров Сидор Сидорович', first_entry: '09:15:00', is_late: true },
        { id: 101, name: 'Козлов Козел Козлович', first_entry: '09:30:00', is_late: true },
      ]
      setEmployeeDetails(mockEmployees)
      setModalType(type)
      setShowModal(true)
    } finally {
      setModalLoading(false)
    }
  }

  // Обработка клика по карточке сотрудника
  const handleEmployeeClick = (employeeId: number | string) => {
    if (!employeeId || employeeId === 'undefined') {
      console.warn('Invalid employee ID:', employeeId)
      return
    }
    console.log('Opening employee page for ID:', employeeId) // Отладка
    window.open(`/employees/${employeeId}`, '_blank')
  }

  const fetchDashboardStats = async (date?: string) => {
    try {
      setLoading(true)
      // Попробуем получить статистику с сервера, если не получится - используем mock данные
      const endpoint = date ? `dashboard-stats?date=${date}` : 'dashboard-stats'
      console.log('Fetching dashboard stats for:', date, 'endpoint:', endpoint) // Отладка
      const data = await apiRequest(endpoint)
      console.log('Setting stats data:', data) // Отладка
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
              Статистика посещаемости за {selectedDate || new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>
          <div className="relative calendar-container">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors duration-200"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {selectedDate ? selectedDate : 'Выбрать дату'}
            </button>
            {showCalendar && (
              <div className="absolute top-full mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4" style={{minWidth: '280px', right: 0}}>
                {/* Заголовок календаря */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-1 hover:bg-gray-100 rounded text-gray-600"
                  >
                    ←
                  </button>
                  <h3 className="text-sm font-medium text-gray-900">
                    {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={goToNextMonth}
                    className="p-1 hover:bg-gray-100 rounded text-gray-600"
                  >
                    →
                  </button>
                </div>
                {/* Дни недели */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="text-xs text-center text-gray-500 font-medium py-1">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Дни */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendar().map((date, index) => {
                    const dateStr = formatDate(date)
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                    const isToday = dateStr === today
                    const isSelected = dateStr === selectedDate
                    const isFuture = dateStr > today
                    const isDisabled = isFuture
                    return (
                      <button
                        key={index}
                        onClick={() => !isDisabled && handleDateClick(dateStr)}
                        disabled={isDisabled}
                        className={`
                          w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors
                          ${!isCurrentMonth ? 'text-gray-300' : ''}
                          ${isDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : ''}
                          ${isSelected ? 'bg-blue-600 text-white font-bold' : ''}
                          ${isToday && !isSelected ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                          ${!isSelected && !isToday && !isDisabled && isCurrentMonth ? 'hover:bg-gray-100 text-gray-700' : ''}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Пришли вовремя */}
        <div 
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer hover:bg-green-50"
          onClick={() => fetchEmployeeDetails('onTime')}
        >
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
              {total > 0 ? (stats.todayAttendance.onTime / total * 100).toFixed(1) : 0}% от присутствующих
            </div>
            <div className="text-xs text-green-600 font-medium mt-1">
              Нажмите для просмотра списка
            </div>
          </div>
        </div>

        {/* Опоздания */}
        <div 
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer hover:bg-amber-50"
          onClick={() => fetchEmployeeDetails('late')}
        >
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
              {total > 0 ? (stats.todayAttendance.late / total * 100).toFixed(1) : 0}% от общего числа
            </div>
            <div className="text-xs text-amber-600 font-medium mt-1">
              Нажмите для просмотра списка
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

      {/* Модальное окно со списком сотрудников */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Заголовок модального окна */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {modalType === 'onTime' ? 'Сотрудники, пришедшие вовремя' : 'Опоздавшие сотрудники'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 mt-2">
                За {selectedDate || new Date().toLocaleDateString('ru-RU')}
              </p>
            </div>

            {/* Содержимое модального окна */}
            <div className="p-6 overflow-y-auto max-h-96">
              {modalLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : employeeDetails.length > 0 ? (
                <div className="space-y-3">
                  {employeeDetails.map((employee, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                      onClick={() => {
                        console.log('Clicked employee object:', employee) // Отладка
                        console.log('Employee ID:', employee.id) // Отладка
                        handleEmployeeClick(employee.id)
                      }}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {employee.name || employee.full_name || 'Имя не указано'}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {employee.first_entry || 'Не указано'}
                        </p>
                        {modalType === 'late' && (
                          <p className="text-xs text-amber-600">Опоздание</p>
                        )}
                        {modalType === 'onTime' && (
                          <p className="text-xs text-green-600">Вовремя</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    {modalType === 'onTime' 
                      ? 'Нет сотрудников, пришедших вовремя' 
                      : 'Нет опоздавших сотрудников'
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Подвал модального окна */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Всего: {employeeDetails.length} {employeeDetails.length === 1 ? 'сотрудник' : 'сотрудников'}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}