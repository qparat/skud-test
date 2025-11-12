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
  UserCheck,
  File,
  ChevronUp,
  ChevronDown,
  Cake
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
    birthdays: number
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
  const [modalType, setModalType] = useState<'onTime' | 'late' | 'exceptions' | 'birthdays'>('onTime')
  const [employeeDetails, setEmployeeDetails] = useState<any[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [birthdayEmployees, setBirthdayEmployees] = useState<any[]>([])
  const [birthdayLoading, setBirthdayLoading] = useState(false)
  
  // Получаем сегодняшнюю дату для ограничения выбора
  const today = formatDate(new Date())

  useEffect(() => {
    console.log('useEffect triggered, selectedDate:', selectedDate) // Отладка
    fetchDashboardStats(selectedDate)
    fetchBirthdays(selectedDate)
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

  // Получение детальной информации о сотрудниках (УСКОРЕННАЯ ВЕРСИЯ)
  const fetchEmployeeDetails = async (type: 'onTime' | 'late' | 'exceptions' | 'birthdays') => {
    try {
      setModalLoading(true)
      const targetDate = selectedDate || today
      
      // Для исключений используем специальный endpoint
      if (type === 'exceptions') {
        try {
          const endpoint = `dashboard-employee-exceptions?date=${targetDate}`
          const response = await apiRequest(endpoint)
          
          setEmployeeDetails(response.exceptions || [])
          setModalType(type)
          setShowModal(true)
          return
        } catch (err) {
          console.error('Ошибка получения исключений:', err)
          setEmployeeDetails([])
          setModalType(type)
          setShowModal(true)
          return
        }
      }

      // Для дней рождений используем специальный endpoint
      if (type === 'birthdays') {
        try {
          const endpoint = `dashboard-birthdays?date=${targetDate}`
          const response = await apiRequest(endpoint)
          
          setEmployeeDetails(response.birthdays || [])
          setModalType(type)
          setShowModal(true)
          return
        } catch (err) {
          console.error('Ошибка получения дней рождений:', err)
          setEmployeeDetails([])
          setModalType(type)
          setShowModal(true)
          return
        }
      }
      
      // Пробуем использовать новый быстрый API endpoint для onTime/late
      try {
        const endpoint = `dashboard-employee-lists?date=${targetDate}`
        const response = await apiRequest(endpoint)
        
        // Получаем уже готовые отфильтрованные списки
        const employees = type === 'onTime' ? response.onTime : response.late
        
        setEmployeeDetails(employees || [])
        setModalType(type)
        setShowModal(true)
      } catch (fastApiError) {
        console.log('Fast API failed, falling back to pagination:', fastApiError)
        
        // Fallback: используем старый метод с пагинацией
        let allEmployees: any[] = []
        let page = 1
        let hasMoreData = true
        
        while (hasMoreData) {
          const endpoint = `employee-schedule?date=${targetDate}&per_page=100&page=${page}`
          const response = await apiRequest(endpoint)
          
          if (response.employees && response.employees.length > 0) {
            allEmployees = [...allEmployees, ...response.employees]
            hasMoreData = response.employees.length === 100
            page++
          } else {
            hasMoreData = false
          }
        }
        
        // Фильтруем сотрудников в зависимости от типа
        let filteredEmployees: any[] = []
        if (allEmployees.length > 0) {
          if (type === 'onTime') {
            const onTimeEmployees = allEmployees.filter((emp: any) => 
              emp.first_entry && !emp.is_late
            )
            filteredEmployees = onTimeEmployees.map((emp: any) => ({
              id: emp.id || emp.employee_id || emp.emp_id,
              name: emp.full_name || emp.name,
              first_entry: emp.first_entry,
              is_late: emp.is_late
            }))
          } else if (type === 'late') {
            const lateEmployees = allEmployees.filter((emp: any) => 
              emp.first_entry && emp.is_late
            )
            filteredEmployees = lateEmployees.map((emp: any) => ({
              id: emp.id || emp.employee_id || emp.emp_id,
              name: emp.full_name || emp.name,
              first_entry: emp.first_entry,
              is_late: emp.is_late
            }))
          }
        }
        
        setEmployeeDetails(filteredEmployees)
        setModalType(type)
        setShowModal(true)
      }
    } catch (err) {
      console.error('Ошибка получения данных сотрудников:', err)
      console.error('Error details:', err instanceof Error ? err.message : err)
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

  // Функция для загрузки дней рождения
  const fetchBirthdays = async (date?: string) => {
    setBirthdayLoading(true)
    try {
      const endpoint = `/dashboard-birthdays${date ? `?date=${date}` : ''}`
      const data = await apiRequest(endpoint)
      setBirthdayEmployees(data.employees || [])
    } catch (err) {
      console.error('Ошибка загрузки дней рождения:', err)
      setBirthdayEmployees([])
    } finally {
      setBirthdayLoading(false)
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
    { name: 'Опоздали', value: stats.todayAttendance.late, color: '#ea580c' }
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {selectedDate ? selectedDate : 'Выбрать дату'}
            </button>
            {showCalendar && (
              <div className="absolute top-full mt-2 z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-4" style={{minWidth: '280px', right: 0}}>
                {/* Заголовок календаря */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-1 hover:bg-gray-100 rounded text-gray-600"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </button>
                  <h3 className="text-sm font-medium text-gray-900">
                    {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={goToNextMonth}
                    className="p-1 hover:bg-gray-100 rounded text-gray-600"
                  >
                    <ChevronUp className="h-4 w-4 rotate-90" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer hover:bg-orange-50"
          onClick={() => fetchEmployeeDetails('late')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Опоздания</p>
              <p className="text-3xl font-bold text-orange-600 animate-pulse">
                {stats.todayAttendance.late}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              {total > 0 ? (stats.todayAttendance.late / total * 100).toFixed(1) : 0}% от общего числа
            </div>
            <div className="text-xs text-orange-600 font-medium mt-1">
              Нажмите для просмотра списка
            </div>
          </div>
        </div>



        {/* Исключения */}
        <div 
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer hover:bg-blue-50"
          onClick={() => fetchEmployeeDetails('exceptions')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Исключения</p>
              <p className="text-3xl font-bold text-blue-600 animate-pulse">
                {stats.recentActivity.exceptions}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              За выбранный день
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1">
              Нажмите для просмотра списка
            </div>
          </div>
        </div>

        {/* Дни рождения */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Дни рождения</p>
              <p className="text-3xl font-bold text-yellow-600 animate-pulse">
                {stats.recentActivity.birthdays}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Cake className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              За выбранный день
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
            <File className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">Отчеты</span>
          </button>
        </div>
      </div>

      {/* Блок дней рождения */}
      {birthdayEmployees.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center mb-4">
            <Cake className="h-8 w-8 text-white mr-3" />
            <h3 className="text-xl font-bold">Сегодня день рождения! 🎉</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdayEmployees.map((employee, index) => (
              <div key={index} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/30 rounded-full p-2">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{employee.full_name}</h4>
                    <p className="text-yellow-100 text-sm">{employee.department_name}</p>
                    <p className="text-yellow-100 text-sm">{employee.position_name}</p>
                    <p className="text-white font-medium mt-1">
                      {employee.age} {employee.age === 1 ? 'год' : employee.age < 5 ? 'года' : 'лет'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно со списком сотрудников */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Заголовок модального окна */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {modalType === 'onTime' ? 'Сотрудники, пришедшие вовремя' : 
                   modalType === 'late' ? 'Опоздавшие сотрудники' : 
                   'Сотрудники с исключениями'}
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
                        {modalType === 'exceptions' && (
                          <div>
                            <p className="text-xs text-blue-600">Исключение</p>
                            {employee.exception_reason && (
                              <p className="text-xs text-gray-500 mt-1">{employee.exception_reason}</p>
                            )}
                          </div>
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
                      : modalType === 'late'
                      ? 'Нет опоздавших сотрудников'
                      : 'Нет сотрудников с исключениями'
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