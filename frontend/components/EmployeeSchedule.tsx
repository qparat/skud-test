'use client'
import * as React from 'react';
import { useRef } from 'react';
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
  const [departmentSearch, setDepartmentSearch] = useState('')
  const filterRef = useRef<HTMLDivElement>(null);
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [lastLoadedDate, setLastLoadedDate] = useState('') // Для визуального выделения
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
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(new Set())
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<number[]>([])
  const [showFilter, setShowFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [currentViewDate, setCurrentViewDate] = useState('') // Для отслеживания текущей просматриваемой даты
  
  // Получаем сегодняшнюю дату для ограничения выбора (без проблем с временной зоной)
  const today = formatDate(new Date())

  const fetchSchedule = async (date?: string, start?: string, end?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      let endpoint = 'employee-schedule'
      
      // Build the base endpoint with pagination parameters
      const pageParams = `page=${currentPage}&per_page=${itemsPerPage}`
      
      if (start && end) {
        endpoint = `employee-schedule-range?start_date=${start}&end_date=${end}&${pageParams}`
      } else if (date) {
        endpoint = `employee-schedule?date=${date}&${pageParams}`
      } else {
        endpoint = `${endpoint}?${pageParams}`
      }
      
      console.log('Fetching schedule:', { endpoint, currentPage, itemsPerPage, date, start, end })
        
      const data = await apiRequest(endpoint)
      console.log('scheduleData:', data)
      setScheduleData(data)
      
      // Calculate total pages based on total count
      const totalPages = Math.ceil(data.total_count / itemsPerPage)
      setTotalPages(totalPages)
      
      // НЕ сбрасываем сортировку при загрузке новых данных - пользователь должен сохранить свой выбор
      // setSortBy('none')
      
      // Сбрасываем состояние развернутых сотрудников при загрузке новых данных
      setExpandedEmployees(new Set())
      
      // При первоначальной загрузке НЕ устанавливаем дату автоматически
      // Пользователь должен сам выбрать дату в календаре
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
      console.error('Ошибка загрузки расписания:', err)
    } finally {
      setLoading(false)
    }
  }

  // Первоначальная загрузка данных за сегодняшний день
  useEffect(() => {
    if (!initialized) {
      // Загружаем данные за сегодняшний день, но НЕ устанавливаем выбранную дату в календаре
      setCurrentViewDate(today)
      fetchSchedule(today)
      setInitialized(true)
    }
  }, [])

  // Закрытие календаря при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Для календаря
      if (showCalendar && !target.closest('.calendar-container')) {
        setShowCalendar(false);
      }
      // Для фильтра - проверяем, что клик не внутри filter-container (включая кнопку)
      if (showFilter && !target.closest('.filter-container')) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar, showFilter]);

  // Загрузка при изменении даты пользователем или страницы
  useEffect(() => {
    if (initialized) {
      if (startDate && endDate) {
        // Загружаем данные для диапазона дат
        fetchSchedule(undefined, startDate, endDate)
      } else if (currentViewDate) {
        // Загружаем данные для одной даты при изменении страницы
        fetchSchedule(currentViewDate)
      }
    }
  }, [startDate, endDate, currentPage, initialized, currentViewDate]) // Добавляем currentViewDate в зависимости

  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/employees/${employeeId}`)
  }

  // Функция для переключения развернутого состояния сотрудника
  const toggleEmployeeExpanded = (employeeId: number) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId)
      } else {
        newSet.add(employeeId)
      }
      return newSet
    })
  }

  // Функции для быстрого выбора периодов
  const selectWeekPeriod = () => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 7)
    
    const startStr = formatDate(weekStart)
    const endStr = formatDate(today)
    
    setStartDate(startStr)
    setEndDate(endStr)
    setSelectedDate('')
    setShowCalendar(false)
    setCurrentPage(1) // Reset page when selecting week period
  }

  const selectMonthPeriod = () => {
    const today = new Date()
    const monthStart = new Date(today)
    monthStart.setDate(today.getDate() - 30)
    
    const startStr = formatDate(monthStart)
    const endStr = formatDate(today)
    
    setStartDate(startStr)
    setEndDate(endStr)
    setSelectedDate('')
    setShowCalendar(false)
    setCurrentPage(1) // Reset page when selecting month period
  }

  const selectQuarterPeriod = () => {
    const today = new Date()
    const quarterStart = new Date(today)
    quarterStart.setDate(today.getDate() - 90)
    
    const startStr = formatDate(quarterStart)
    const endStr = formatDate(today)
    
    setStartDate(startStr)
    setEndDate(endStr)
    setSelectedDate('')
    setShowCalendar(false)
    setCurrentPage(1) // Reset page when selecting quarter period
  }

  // Обработка клика по дате в календаре
  const handleDateClick = (dateStr: string) => {
    if (dateStr > today) return // Нельзя выбирать будущие даты
    
    // Reset page when changing dates
    setCurrentPage(1)
    
    // Проверяем текущее состояние
    const hasSelectedDate = selectedDate !== ''
    const hasRange = startDate !== '' && endDate !== ''
    
    if (!hasSelectedDate && !hasRange) {
      // Ничего не выбрано - выбираем дату и сразу выделяем визуально
      setSelectedDate(dateStr)
      setStartDate('')
      setEndDate('')
      setLastLoadedDate(dateStr) // Сразу выделяем дату визуально
      // НЕ ЗАГРУЖАЕМ данные, только выделяем дату
      // НЕ закрываем календарь, чтобы пользователь мог кликнуть повторно
    } else if (hasSelectedDate && !hasRange) {
      if (dateStr === selectedDate) {
        // Клик по той же уже выбранной дате - загружаем данные для этой даты
        setCurrentViewDate(selectedDate)
        fetchSchedule(selectedDate)
        setLastLoadedDate(selectedDate) // Сохраняем для визуального выделения
        setSelectedDate('') // Очищаем выбранную дату после загрузки
        setShowCalendar(false) // Закрываем календарь после загрузки данных
        return
      } else {
        // Второй клик по другой дате - создаем диапазон
        const start = dateStr < selectedDate ? dateStr : selectedDate
        const end = dateStr < selectedDate ? selectedDate : dateStr
        
        setStartDate(start)
        setEndDate(end)
        setSelectedDate('')
        setCurrentViewDate('') // Очищаем при выборе диапазона
        setLastLoadedDate(dateStr) // Выделяем последнюю выбранную дату
        setShowCalendar(false) // Закрываем календарь после создания диапазона
        // Данные загрузятся автоматически через useEffect
      }
    } else {
      // Уже есть диапазон - сбрасываем и выбираем новую дату с визуальным выделением
      setSelectedDate(dateStr)
      setStartDate('')
      setEndDate('')
      setLastLoadedDate(dateStr) // Сразу выделяем новую дату визуально
      // НЕ ЗАГРУЖАЕМ данные, только выделяем дату
      // НЕ закрываем календарь, чтобы пользователь мог кликнуть повторно
    }
  }

  // Сброс выбора дат и возврат к сегодняшнему дню
  const clearDates = () => {
    setSelectedDate('')
    setStartDate('')
    setEndDate('')
    setLastLoadedDate('') // Очищаем визуальное выделение
    // Возвращаемся к сегодняшнему дню
    setSelectedDepartment([])
    setCurrentPage(1) // Reset page when clearing dates
    setCurrentViewDate(today)
    fetchSchedule(today)
  }

  // Генерация календаря
  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      // Данные будут загружены через useEffect, который следит за изменением currentPage
    }
  }

  const renderPagination = () => {
    if (!scheduleData) return null;
    
    // Используем total_count из API (серверная пагинация)
    const actualTotalCount = scheduleData.total_count;
    
    if (actualTotalCount <= itemsPerPage) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    const calculatedTotalPages = Math.ceil(actualTotalCount / itemsPerPage);
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(calculatedTotalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-4 mb-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Назад
        </button>

        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`px-3 py-1 rounded-md ${
              currentPage === number
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            {number}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === calculatedTotalPages}
          className={`px-3 py-1 rounded-md ${
            currentPage === calculatedTotalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Вперед
        </button>
      </div>
    );
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    // Определяем день недели для первого дня месяца (0 - воскресенье, 1 - понедельник, ...)
    let dayOfWeek = firstDay.getDay();
    // Для понедельника как первого дня недели: если воскресенье (0), то 6, иначе dayOfWeek - 1
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - dayOfWeek); // Начинаем с понедельника

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 недель по 7 дней
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
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

    // Фильтрация по отделам (мультивыбор)
    if (selectedDepartment.length > 0) {
      if (isRangeData) {
        filteredEmployees = (filteredEmployees as EmployeeWithDays[]).filter(e => {
          // Если department_id есть на верхнем уровне
          if ((e as any).department_id !== undefined) {
            return selectedDepartment.includes((e as any).department_id)
          }
          // Если department_id есть в days
          if (Array.isArray((e as any).days)) {
            return (e as any).days.some((d: any) => selectedDepartment.includes(d.department_id))
          }
          // Если нет department_id, не исключаем сотрудника
          return true
        })
      } else {
        filteredEmployees = (filteredEmployees as Employee[]).filter(e => {
          if ((e as any).department_id !== undefined) {
            return selectedDepartment.includes((e as any).department_id)
          }
          // Если нет department_id, не исключаем сотрудника
          return true
        })
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
          return (filteredEmployees as Employee[]).sort((a, b) => 
            a.full_name.localeCompare(b.full_name)
          )
      }
    } else {
      // Логика для диапазона дат - преобразуем в плоский список
      const flatData: (Employee & { date: string })[] = []
      
      ;(filteredEmployees as EmployeeWithDays[]).forEach(emp => {
        emp.days.forEach(day => {
          flatData.push({
            employee_id: emp.employee_id,
            full_name: emp.full_name,
            date: day.date,
            first_entry: day.first_entry,
            last_exit: day.last_exit,
            first_entry_door: day.first_entry_door,
            last_exit_door: day.last_exit_door,
            is_late: day.is_late,
            late_minutes: day.late_minutes,
            work_hours: day.work_hours,
            status: day.status,
            exception: day.exception
          })
        })
      })

      // Сортировка для диапазона дат
      switch (sortBy) {
        case 'late-first':
          return flatData.sort((a, b) => {
            if (a.is_late && !b.is_late) return -1
            if (!a.is_late && b.is_late) return 1
            // Сначала по ФИО, потом по дате
            const nameCompare = a.full_name.localeCompare(b.full_name)
            if (nameCompare !== 0) return nameCompare
            return a.date.localeCompare(b.date)
          })
        case 'normal-first':
          return flatData.sort((a, b) => {
            if (!a.is_late && b.is_late) return -1
            if (a.is_late && !b.is_late) return 1
            // Сначала по ФИО, потом по дате
            const nameCompare = a.full_name.localeCompare(b.full_name)
            if (nameCompare !== 0) return nameCompare
            return a.date.localeCompare(b.date)
          })
        default:
          return flatData.sort((a, b) => {
            // Сначала по ФИО, потом по дате
            const nameCompare = a.full_name.localeCompare(b.full_name)
            if (nameCompare !== 0) return nameCompare
            return a.date.localeCompare(b.date)
          })
      }
    }
  }

  // Функция для получения данных с группировкой для отображения
  const getDisplayData = () => {
    const sortedData = getSortedEmployees()
    
    // Для одной даты возвращаем как есть
    const isRangeData = sortedData.length > 0 && 'date' in sortedData[0]
    if (!isRangeData) {
      // Серверная пагинация уже применена - просто возвращаем данные
      return sortedData.map(emp => ({ ...emp, isFirstInGroup: true, totalInGroup: 1 }))
    }

    // Для диапазона дат группируем по employee_id
    const grouped: Record<number, (Employee & { date: string })[]> = {}
    const typedData = sortedData as (Employee & { date: string })[]
    
    typedData.forEach(emp => {
      if (!grouped[emp.employee_id]) {
        grouped[emp.employee_id] = []
      }
      grouped[emp.employee_id].push(emp)
    })

    // Создаем плоский список с метаданными для отображения
    const displayData: Array<Employee & { date?: string; isFirstInGroup: boolean; totalInGroup: number; groupIndex: number }> = []
    
    // Сортируем группы по ФИО первого элемента для корректного порядка отображения
    // Учитываем текущую сортировку
    const sortedGroupEntries = Object.entries(grouped).sort(([, aDays], [, bDays]) => {
      const aFirst = aDays[0]
      const bFirst = bDays[0]
      
      // Если есть сортировка по статусу, применяем её
      if (sortBy === 'late-first') {
        if (aFirst.is_late && !bFirst.is_late) return -1
        if (!aFirst.is_late && bFirst.is_late) return 1
      } else if (sortBy === 'normal-first') {
        if (!aFirst.is_late && bFirst.is_late) return -1
        if (aFirst.is_late && !bFirst.is_late) return 1
      }
      
      // В любом случае вторичная сортировка по ФИО
      return aFirst.full_name.localeCompare(bFirst.full_name)
    })
    
    // Серверная пагинация уже применена - обрабатываем все полученные группы
    const allGroups = sortedGroupEntries
    
    allGroups.forEach(([employeeId, employeeDays]) => {
      const empId = parseInt(employeeId)
      const isExpanded = expandedEmployees.has(empId)
      
      employeeDays.forEach((emp, index) => {
        // Показываем первую строку всегда, остальные только если развернуто
        if (index === 0 || isExpanded) {
          displayData.push({
            ...emp,
            isFirstInGroup: index === 0,
            totalInGroup: employeeDays.length,
            groupIndex: index
          })
        }
      })
    })

    return displayData
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

    const sortedData = getSortedEmployees()
    let excelData: any[] = []
    const isRangeData = sortedData.length > 0 && 'date' in sortedData[0]

    if (isRangeData) {
      // Группировка по датам и пустые строки — только для диапазона
      const grouped = {} as Record<string, (Employee & { date: string })[]>
      (sortedData as (Employee & { date: string })[]).forEach((emp: Employee & { date: string }) => {
        if (!grouped[emp.date]) grouped[emp.date] = []
        grouped[emp.date].push(emp)
      })
      const sortedDates = Object.keys(grouped).sort()
      let rowIndex = 1
      sortedDates.forEach(date => {
        // Первая строка — только дата
        excelData.push({
          '№': '',
          'ФИО': date,
          'Пришел': '',
          'Ушел': '',
          'Часы работы': '',
          'Статус': '',
          'Опоздание (мин)': '',
          'Исключение': ''
        })
        // Данные сотрудников за эту дату (без столбца 'Дата')
        grouped[date].forEach(emp => {
          excelData.push({
            '№': rowIndex++,
            'ФИО': emp.full_name,
            'Пришел': emp.first_entry || '-',
            'Ушел': emp.last_exit || '-',
            'Часы работы': emp.work_hours !== null && emp.work_hours !== undefined ? `${emp.work_hours.toFixed(1)} ч` : '-',
            'Статус': emp.status || (emp.is_late ? 'Опоздал' : 'В норме'),
            'Опоздание (мин)': emp.is_late ? emp.late_minutes : 0,
            'Исключение': emp.exception?.has_exception ? emp.exception.reason : '-'
          })
        })
        // Пустая строка после данных за дату
        excelData.push({
          '№': '',
          'ФИО': '',
          'Пришел': '',
          'Ушел': '',
          'Часы работы': '',
          'Статус': '',
          'Опоздание (мин)': '',
          'Исключение': ''
        })
      })
    } else {
      // Обычный экспорт для одной даты — без строки с датой, без столбца 'Дата', без пустых строк
      excelData = (sortedData as Employee[]).map((employee, index) => ({
        '№': index + 1,
        'ФИО': employee.full_name,
        'Пришел': employee.first_entry || '-',
        'Ушел': employee.last_exit || '-',
        'Часы работы': employee.work_hours !== null && employee.work_hours !== undefined ? `${employee.work_hours.toFixed(1)} ч` : '-',
        'Статус': employee.status || (employee.is_late ? 'Опоздал' : 'В норме'),
        'Опоздание (мин)': employee.is_late ? employee.late_minutes : 0,
        'Исключение': employee.exception?.has_exception ? employee.exception.reason : '-'
      }))
    }

    // Создаем рабочую книгу
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    
    // Настраиваем ширину колонок
    const colWidths = [
      { wch: 5 },   // №
      { wch: 25 },  // ФИО
      { wch: 12 },  // Дата (только для диапазона)
      { wch: 15 },  // День недели (только для диапазона)
      { wch: 12 },  // Пришел
      { wch: 12 },  // Ушел
      { wch: 12 },  // Часы работы
      { wch: 25 },  // Статус
      { wch: 12 },  // Опоздание
      { wch: 20 }   // Исключение (только для диапазона)
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

  // Загрузка отделов (приоритет - ответ от сервера, если нет - из данных расписания)
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const resp = await apiRequest('departments')
        if (Array.isArray(resp)) {
          setDepartments(resp.map((d: any) => ({ id: d.id, name: d.name })))
        }
      } catch (e) {
        if (scheduleData && Array.isArray(scheduleData.employees)) {
          const uniqueDeps = Array.from(new Set((scheduleData.employees as any[])
            .map(e => e.department_id && e.department_name ? `${e.department_id}|${e.department_name}` : null)
            .filter(Boolean)))
          setDepartments(
            uniqueDeps
              .map((str): { id: number; name: string } | null => {
                if (!str) return null
                const [id, name] = str.split('|')
                return { id: Number(id), name }
              })
              .filter((item): item is { id: number; name: string } => Boolean(item))
          )
        }
      }
    }
    fetchDepartments()
  }, [scheduleData])

  return (
    <div className="space-y-6">
      {/* Employee table */}
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {scheduleData && scheduleData.employees.length > 0 && (
              <div className="flex items-center space-x-4">
                <div className="">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <p className="text-s font-medium text-gray-600">Всего сотрудников</p>
                      <p className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">{scheduleData.total_count}</p>
                    </div>
                  </div>
                </div>
                
                <div className="">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <p className="text-s font-medium text-gray-600">
                        Опозданий
                        {sortBy === 'late-first' && ' (сверху)'}
                        {sortBy === 'normal-first' && ' (снизу)'}
                      </p>
                      <p className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">{scheduleData.late_count}</p>
                    </div>
                  </div>
                </div>
                
                {/* <div className="">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-2">
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
                </div> */}
              </div>
            )}
            {/* Поиск по ФИО и фильтр по отделу */}
            <div className="flex items-center space-x-4 relative calendar-container">
              <div className="w-84">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по ФИО"
                  className="w-full inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                />
              </div>
              {/* Кнопка фильтра и выпадающий список отделов */}
              <div className="filter-container">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Фильтр
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
                {showFilter && (
                  <div ref={filterRef} className="absolute mt-2 z-[10000] bg-white border border-gray-200 rounded-lg shadow-xl p-4" style={{ minWidth: '500px', top: 'auto', right: '1rem' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Службы</label>
                    <input
                      type="text"
                      value={departmentSearch}
                      onChange={e => setDepartmentSearch(e.target.value)}
                      placeholder="Поиск по службам"
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {departments
                        .filter(dep => dep.name.toLowerCase().includes(departmentSearch.trim().toLowerCase()))
                        .map((dep: { id: number; name: string }) => (
                        <label key={dep.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedDepartment.includes(dep.id)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              if (e.target.checked) {
                                setSelectedDepartment((prev: number[]) => [...prev, dep.id])
                              } else {
                                setSelectedDepartment((prev: number[]) => prev.filter((id: number) => id !== dep.id))
                              }
                            }}
                            className="form-checkbox h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{dep.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDepartment([])
                        setShowFilter(false)
                        setDepartmentSearch('')
                      }}
                      className="mt-4 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    >
                      Сбросить фильтр
                    </button>
                  </div>
                )}
              </div>
              {/* ...existing calendar and export buttons... */}
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {startDate && endDate 
                  ? `${startDate} - ${endDate}`
                  : selectedDate 
                  ? selectedDate
                  : scheduleData?.date
                  ? `Сегодня (${scheduleData.date})`
                  : 'Выбрать дату'
                }
              </button>
              {(selectedDate || (startDate && endDate)) && (
                <button
                  onClick={clearDates}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Сбросить
                </button>
              )}
              {/* ...existing calendar popup... */}
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
                      const isLoadedDate = dateStr === lastLoadedDate
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
                            w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors
                            ${!isCurrentMonth ? 'text-gray-300' : ''}
                            ${isDisabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : ''}
                            ${isStartDate || isEndDate ? 'bg-green-600 text-white font-bold' : ''}
                            ${isInRange && !isStartDate && !isEndDate ? 'bg-green-100 text-green-800' : ''}
                            ${isLoadedDate && !isStartDate && !isEndDate ? 'bg-blue-600 text-white font-bold' : ''}
                            ${isToday && !isLoadedDate && !isStartDate && !isEndDate && !isInRange ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                            ${!isLoadedDate && !isInRange && !isToday && !isDisabled && isCurrentMonth && !isStartDate && !isEndDate ? 'hover:bg-gray-100' : ''}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600 mb-2">Быстрый выбор периода:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={selectWeekPeriod}
                        className="px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                      >
                        За неделю
                      </button>
                      <button
                        onClick={selectMonthPeriod}
                        className="px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                      >
                        За месяц
                      </button>
                      <button
                        onClick={selectQuarterPeriod}
                        className="px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                      >
                        За квартал
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
          ) : !scheduleData ? (
            <div className="p-6 text-center text-gray-600">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Загрузка данных...</h3>
              <p>Пожалуйста, подождите</p>
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
                  {scheduleData?.employees.some(emp => 'days' in emp) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                  )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getDisplayData().map((employee, index) => {
                  // Проверяем, есть ли поле date (это означает, что это данные диапазона в плоском формате)
                  const isRangeData = 'date' in employee
                  const hasExpandButton = isRangeData && employee.isFirstInGroup && employee.totalInGroup > 1
                  const isExpanded = expandedEmployees.has(employee.employee_id)
                  
                  if (!isRangeData) {
                    // Отображение для одной даты
                    const emp = employee as Employee & { isFirstInGroup: boolean; totalInGroup: number }
                    return (
                      <tr
                        key={emp.employee_id}
                        className={`hover:bg-gray-50 ${emp.is_late ? 'bg-white' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEmployeeClick(emp.employee_id)}
                            className={`text-left font-medium ${
                              emp.is_late 
                                ? 'text-blue-600 hover:text-blue-800' 
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
                          {emp.work_hours !== null && emp.work_hours !== undefined ? `${emp.work_hours.toFixed(1)} ч` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              emp.exception?.has_exception
                                ? 'bg-blue-100 text-blue-800'
                                : emp.is_late
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {emp.exception?.has_exception ? (
                              <>🛡️ {emp.exception.reason}</>
                            ) : (
                              emp.status || (emp.is_late ? 'Опоздал' : 'В норме')
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  } else {
                    // Отображение для диапазона дат (плоский формат с группировкой)
                    const emp = employee as Employee & { date: string; isFirstInGroup: boolean; totalInGroup: number; groupIndex: number }
                    return (
                      <tr
                        key={`${emp.employee_id}-${emp.date}`}
                        className={`hover:bg-gray-50 ${emp.exception?.has_exception ? 'bg-grey-200' : (emp.is_late ? 'bg-grey-200' : '')}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-between">
                            {emp.isFirstInGroup ? (
                              <button
                                onClick={() => handleEmployeeClick(emp.employee_id)}
                                className={`text-left font-medium ${
                                  emp.is_late 
                                    ? 'text-blue-600 hover:text-blue-800' 
                                    : 'text-blue-600 hover:text-blue-800'
                                }`}
                              >
                                {emp.full_name}
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">↳</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(emp.date).toLocaleDateString('ru-RU', { 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(emp.date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                            </span>
                          </div>
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              emp.exception?.has_exception
                                ? 'bg-blue-100 text-blue-800'
                                : emp.is_late
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {emp.exception?.has_exception ? (
                              <>🛡️ {emp.exception.reason}</>
                            ) : (
                              emp.status || (emp.is_late ? 'Опоздал' : 'В норме')
                            )}
                          </span>
                        </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end">
                            {hasExpandButton && (
                              <button
                                onClick={() => toggleEmployeeExpanded(emp.employee_id)}
                                className="ml-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                                title={isExpanded ? 'Свернуть' : `Показать все элементы`}
                                // title={isExpanded ? 'Свернуть' : `Показать еще ${emp.totalInGroup - 1} дней`}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-6 w-6" />
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    {/* Счетчики дней без опозданий, с опозданием и с исключением */}
                                      {(() => {
                                        // Получаем все дни сотрудника из исходных scheduleData.employees
                                        // Включаем текущий отображаемый день в счетчики (не исключаем emp.date)
                                        let allDays: DayData[] = [];
                                        let totalDays = 0;
                                        if (scheduleData && Array.isArray(scheduleData.employees)) {
                                          const found = (scheduleData.employees as any[]).find(e => e.employee_id === emp.employee_id && Array.isArray(e.days));
                                          if (found && Array.isArray(found.days)) {
                                            // включаем все дни, включая текущую строку
                                            allDays = [...found.days];
                                            totalDays = found.days.length;
                                          }
                                        }
                                        const lateDays = allDays.filter(d => d.is_late && !(d.exception?.has_exception)).length;
                                        const okDays = allDays.filter(d => !d.is_late && !(d.exception?.has_exception)).length;
                                        const excDays = allDays.filter(d => d.exception?.has_exception).length;
                                        return (
                                          <>
                                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">Вовремя: {okDays}</span>
                                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full ml-1">Опозданий: {lateDays}</span>
                                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full ml-1">Исключений: {excDays}</span>
                                            <div className="flex items-center text-sm text-gray-500">Элементов: {totalDays}</div>

                                            <ChevronDown className="h-6 w-6 ml-2" />
                                          </>
                                        );
                                      })()}
                                  </div>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  }
                })}
              </tbody>
            </table>
          )}
          {/* Pagination */}
          {renderPagination()}
        </div>
      </div>
    </div>
  )
}
