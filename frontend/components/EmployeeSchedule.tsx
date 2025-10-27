'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, User, Download, ChevronUp, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import { apiRequest } from '@/lib/api'

// Функция для правильного получения даты в формате YYYY-MM-DD без проблем с временной зоной
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

interface DayData {
  date: string
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

interface EmployeeWithDays {
  employee_id: number
  full_name: string
  days: DayData[]
}

interface ScheduleData {
  date: string
  start_date?: string
  end_date?: string
  employees: Employee[] | EmployeeWithDays[]
  total_count: number
  late_count: number
}

export function EmployeeSchedule() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [sortBy, setSortBy] = useState<'none' | 'late-first' | 'normal-first'>('none')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Получаем сегодняшнюю дату для ограничения выбора (без проблем с временной зоной)
  const today = formatDate(new Date())

  const fetchSchedule = async (date?: string, start?: string, end?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      let endpoint = 'employee-schedule'
      
      if (start && end) {
        endpoint = `employee-schedule-range?start_date=${start}&end_date=${end}`
      } else if (date) {
        endpoint = `employee-schedule?date=${date}`
      }
        
      const data = await apiRequest(endpoint)
      setScheduleData(data)
      
      // Сбрасываем сортировку при загрузке новых данных
      setSortBy('none')
      
      // При первоначальной загрузке НЕ устанавливаем дату автоматически
      // Пользователь должен сам выбрать дату в календаре
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
      console.error('Ошибка загрузки расписания:', err)
    } finally {
      setLoading(false)
    }
  }

  // Первоначальная загрузка данных только после выбора даты
  useEffect(() => {
    // Не загружаем данные автоматически при инициализации
    // Данные будут загружены только после выбора даты в календаре
    setInitialized(true)
  }, [])

  // Закрытие календаря при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showCalendar && !target.closest('.calendar-container')) {
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCalendar])

  // Загрузка при изменении даты пользователем
  useEffect(() => {
    if (initialized) {
      if (startDate && endDate) {
        // Загружаем данные для диапазона дат
        fetchSchedule(undefined, startDate, endDate)
      }
      // НЕ загружаем данные автоматически при выборе одной даты
      // Данные загрузятся только при повторном клике по той же дате
    }
  }, [startDate, endDate, initialized]) // Убираем selectedDate из зависимостей

  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/employees/${employeeId}`)
  }

  // Обработка клика по дате в календаре
  const handleDateClick = (dateStr: string) => {
    if (dateStr > today) return // Нельзя выбирать будущие даты
    
    // Проверяем текущее состояние
    const hasSelectedDate = selectedDate !== ''
    const hasRange = startDate !== '' && endDate !== ''
    
    if (!hasSelectedDate && !hasRange) {
      // Ничего не выбрано - только выбираем дату, не загружаем данные
      setSelectedDate(dateStr)
      setStartDate('')
      setEndDate('')
      // НЕ ЗАГРУЖАЕМ данные, только выделяем дату
    } else if (hasSelectedDate && !hasRange) {
      if (dateStr === selectedDate) {
        // Клик по той же уже выбранной дате - загружаем данные для этой даты
        fetchSchedule(selectedDate)
        setShowCalendar(false)
        return
      } else {
        // Клик по другой дате - создаем диапазон и загружаем данные
        const start = dateStr < selectedDate ? dateStr : selectedDate
        const end = dateStr < selectedDate ? selectedDate : dateStr
        
        setStartDate(start)
        setEndDate(end)
        setSelectedDate('')
        // Данные загрузятся автоматически через useEffect
      }
    } else {
      // Уже есть диапазон - сбрасываем и выбираем новую дату (без загрузки)
      setSelectedDate(dateStr)
      setStartDate('')
      setEndDate('')
      // НЕ ЗАГРУЖАЕМ данные, только выделяем дату
    }
    
    setShowCalendar(false)
  }

  // Сброс выбора дат
  const clearDates = () => {
    setSelectedDate('')
    setStartDate('')
    setEndDate('')
  }

  // Генерация календаря
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Начинаем с воскресенья
    
    const days = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) { // 6 недель по 7 дней
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  // Навигация по месяцам
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  const handleStatusSort = () => {
    if (sortBy === 'none') {
      setSortBy('late-first')
    } else if (sortBy === 'late-first') {
      setSortBy('normal-first')
    } else {
      setSortBy('none')
    }
  }

  const getSortedEmployees = () => {
    if (!scheduleData?.employees) return []
    const employees = [...scheduleData.employees]

    // Проверяем, работаем ли мы с диапазоном дат (EmployeeWithDays) или одной датой (Employee)
    const isRangeData = employees.length > 0 && 'days' in employees[0]

    // Фильтрация по ФИО (case-insensitive)
    const search = searchQuery.trim().toLowerCase()
    let filteredEmployees: (Employee | EmployeeWithDays)[] = employees
    if (search) {
      if (isRangeData) {
        filteredEmployees = (employees as EmployeeWithDays[]).filter(e =>
          e.full_name.toLowerCase().includes(search)
        )
      } else {
        filteredEmployees = (employees as Employee[]).filter(e =>
          e.full_name.toLowerCase().includes(search)
        )
      }
    }

    if (!isRangeData) {
      // Логика для одной даты (как было раньше)
      switch (sortBy) {
        case 'late-first':
          return (filteredEmployees as Employee[]).sort((a, b) => {
            if (a.is_late && !b.is_late) return -1
            if (!a.is_late && b.is_late) return 1
            return a.full_name.localeCompare(b.full_name)
          })
        case 'normal-first':
          return (filteredEmployees as Employee[]).sort((a, b) => {
            if (!a.is_late && b.is_late) return -1
            if (a.is_late && !b.is_late) return 1
            return a.full_name.localeCompare(b.full_name)
          })
        default:
          return filteredEmployees as Employee[]
      }
    } else {
      // Логика для диапазона дат - пока сортируем только по имени
      return (filteredEmployees as EmployeeWithDays[]).sort((a, b) => 
        a.full_name.localeCompare(b.full_name)
      )
    }
  }

  const getSortIcon = () => {
    switch (sortBy) {
      case 'late-first':
        return <ChevronDown className="h-4 w-4" />
      case 'normal-first':
        return <ChevronUp className="h-4 w-4" />
      default:
        return null
    }
  }

  const exportToExcel = () => {
    if (!scheduleData || !scheduleData.employees.length) {
      alert('Нет данных для экспорта')
      return
    }

    // Проверяем, работаем ли с диапазоном дат или одной датой
    const employees = scheduleData.employees
    const isRangeData = employees.length > 0 && 'days' in employees[0]

    let excelData: any[] = []

    if (!isRangeData) {
      // Экспорт для одной даты
      excelData = (employees as Employee[]).map((employee, index) => ({
        '№': index + 1,
        'ФИО': employee.full_name,
        'Пришел': employee.first_entry || '-',
        'Ушел': employee.last_exit || '-',
        'Часы работы': employee.work_hours ? `${employee.work_hours.toFixed(1)} ч` : '-',
        'Статус': employee.status || (employee.is_late ? 'Опоздал' : 'В норме'),
        'Опоздание (мин)': employee.is_late ? employee.late_minutes : 0,
      }))
    } else {
      // Экспорт для диапазона дат
      const empWithDays = employees as EmployeeWithDays[]
      excelData = []
      empWithDays.forEach((employee) => {
        employee.days.forEach((day, dayIndex) => {
          excelData.push({
            '№': `${employee.employee_id}-${dayIndex + 1}`,
            'ФИО': employee.full_name,
            'Дата': day.date,
            'День недели': new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'long' }),
            'Пришел': day.first_entry || '-',
            'Ушел': day.last_exit || '-',
            'Часы работы': day.work_hours ? `${day.work_hours.toFixed(1)} ч` : '-',
            'Статус': day.status || (day.is_late ? 'Опоздал' : 'В норме'),
            'Опоздание (мин)': day.is_late ? day.late_minutes : 0,
            'Исключение': day.exception?.has_exception ? day.exception.reason : '-'
          })
        })
      })
    }

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
      { wch: 25 },  // Статус
      { wch: 12 },  // Опоздание
      { wch: 20 }   // Исключение
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Расписание')
    
    // Генерируем имя файла с датой
    let fileName: string
    if (!isRangeData) {
      fileName = `Расписание_сотрудников_${scheduleData.date}.xlsx`
    } else {
      const start = scheduleData.start_date || startDate
      const end = scheduleData.end_date || endDate
      fileName = `Расписание_сотрудников_${start}_${end}.xlsx`
    }
    
    // Скачиваем файл
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div className="space-y-6">
      {/* Employee table */}
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Statistics */}
            {scheduleData && scheduleData.employees.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-4">
                      <p className="text-s font-medium text-gray-600">Всего сотрудников</p>
                      <p className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">{scheduleData.total_count}</p>
                    </div>
                  </div>
                </div>
                
                <div className="">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-4">
                      <p className="text-s font-medium text-gray-600">
                        Опозданий
                        {sortBy === 'late-first' && ' (сверху)'}
                        {sortBy === 'normal-first' && ' (снизу)'}
                      </p>
                      <p className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">{scheduleData.late_count}</p>
                    </div>
                  </div>
                </div>
                
                <div className="">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-4">
                      <p className="text-s font-medium text-gray-600">
                        {startDate && endDate ? 'Период' : 'Дата'}
                      </p>
                      <p className="text-s font-medium text-gray-900">
                        {startDate && endDate 
                          ? `${startDate} - ${endDate}`
                          : selectedDate || scheduleData.date
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Поиск по ФИО */}
              <div className="ml-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по ФИО"
                  className="w-64 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            
            <div className="flex items-center space-x-4 relative calendar-container">
              {/* Кнопка для открытия календаря */}
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {startDate && endDate 
                  ? `${startDate} - ${endDate}`
                  : selectedDate 
                  ? selectedDate
                  : 'Выбрать дату'
                }
              </button>
              
              {/* Кнопка сброса */}
              {(selectedDate || (startDate && endDate)) && (
                <button
                  onClick={clearDates}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Сбросить
                </button>
              )}
              
              {/* Календарь */}
              {showCalendar && (
                <div className="absolute top-full mt-2 z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-4" style={{minWidth: '280px', right: 0}}>
                  {/* Заголовок календаря */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </button>
                    <h3 className="text-sm font-medium">
                      {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={goToNextMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronUp className="h-4 w-4 rotate-90" />
                    </button>
                  </div>
                  
                  {/* Дни недели */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
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
                      const isInRange = startDate && endDate && dateStr >= startDate && dateStr <= endDate
                      const isStartDate = dateStr === startDate
                      const isEndDate = dateStr === endDate
                      const isFuture = dateStr > today
                      const isDisabled = isFuture
                      
                      return (
                        <button
                          key={index}
                          onClick={() => !isDisabled && handleDateClick(dateStr)}
                          disabled={isDisabled}
                          className={`
                            w-8 h-8 text-xs rounded-full flex items-center justify-center
                            ${!isCurrentMonth ? 'text-gray-300' : ''}
                            ${isToday ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                            ${isSelected ? 'bg-blue-600 text-white' : ''}
                            ${isStartDate || isEndDate ? 'bg-green-600 text-white' : ''}
                            ${isInRange && !isStartDate && !isEndDate ? 'bg-green-100 text-green-800' : ''}
                            ${isDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                            ${!isSelected && !isInRange && !isToday && !isDisabled && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <p>• Один клик = выбор даты</p>
                    <p>• Повторный клик = загрузка данных</p>
                    <p>• Клик на другую дату = диапазон</p>
                    <p>• Нельзя выбрать будущие даты</p>
                  </div>
                </div>
              )}
            </div>
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
        </div>
        
        <div className="overflow-x-auto overflow-y-visible">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Загрузка данных...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              <p>Ошибка: {error}</p>
              <button
                onClick={() => {
                  if (startDate && endDate) {
                    fetchSchedule(undefined, startDate, endDate)
                  } else if (selectedDate) {
                    fetchSchedule(selectedDate)
                  }
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Повторить
              </button>
            </div>
          ) : !selectedDate && !startDate && !endDate ? (
            <div className="p-6 text-center text-gray-600">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите дату</h3>
              <p>Нажмите на кнопку "Выбрать дату" выше, чтобы просмотреть расписание сотрудников</p>
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
                  {!scheduleData?.employees.some(emp => 'days' in emp) ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пришел
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ушел
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Часы работы
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={handleStatusSort}
                        title={
                          sortBy === 'none' 
                            ? 'Нажмите для сортировки: сначала опоздавшие'
                            : sortBy === 'late-first'
                            ? 'Нажмите для сортировки: сначала без опозданий'
                            : 'Нажмите для сброса сортировки'
                        }
                      >
                        <div className="flex items-center space-x-1">
                          <span>Статус</span>
                          {getSortIcon()}
                        </div>
                      </th>
                    </>
                  ) : (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Данные по дням
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedEmployees().map((employee) => {
                  const isRangeData = 'days' in employee
                  
                  if (!isRangeData) {
                    // Отображение для одной даты
                    const emp = employee as Employee
                    return (
                      <tr
                        key={emp.employee_id}
                        className={`hover:bg-gray-50 ${emp.is_late ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEmployeeClick(emp.employee_id)}
                            className={`text-left font-medium ${
                              emp.is_late 
                                ? 'text-red-600 hover:text-red-800' 
                                : 'text-blue-600 hover:text-blue-800'
                            }`}
                          >
                            {emp.full_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            {emp.first_entry || '-'}
                            {emp.first_entry_door && (
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {emp.first_entry_door}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            {emp.last_exit || '-'}
                            {emp.last_exit_door && (
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {emp.last_exit_door}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {emp.work_hours ? `${emp.work_hours.toFixed(1)} ч` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                emp.exception?.has_exception
                                  ? 'bg-blue-100 text-blue-800'
                                  : emp.is_late
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {emp.status || (emp.is_late ? 'Опоздал' : 'В норме')}
                            </span>
                            {emp.exception?.has_exception && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                🛡️ {emp.exception.reason}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  } else {
                    // Отображение для диапазона дат
                    const empWithDays = employee as EmployeeWithDays
                    return (
                      <tr key={empWithDays.employee_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 align-top">
                          <button
                            onClick={() => handleEmployeeClick(empWithDays.employee_id)}
                            className="text-left font-medium text-blue-600 hover:text-blue-800"
                          >
                            {empWithDays.full_name}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {empWithDays.days.map((day, index) => (
                              <div key={index} className={`p-2 rounded ${day.is_late ? 'bg-red-50' : 'bg-gray-50'} border-l-4 ${day.is_late ? 'border-red-400' : 'border-green-400'}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm text-gray-900">
                                    {new Date(day.date).toLocaleDateString('ru-RU', { 
                                      weekday: 'short', 
                                      day: '2-digit', 
                                      month: '2-digit' 
                                    })}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    day.exception?.has_exception
                                      ? 'bg-blue-100 text-blue-800'
                                      : day.is_late
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {day.status || (day.is_late ? 'Опоздал' : 'В норме')}
                                  </span>
                                </div>
                                <div className="flex space-x-4 mt-1 text-xs text-gray-600">
                                  <span>Пришел: {day.first_entry || '-'}</span>
                                  <span>Ушел: {day.last_exit || '-'}</span>
                                  {day.work_hours && <span>Часов: {day.work_hours.toFixed(1)}</span>}
                                </div>
                                {day.exception?.has_exception && (
                                  <div className="mt-1">
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      🛡️ {day.exception.reason}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  }
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
