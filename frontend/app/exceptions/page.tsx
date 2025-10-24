'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Calendar, User, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { apiRequest } from '@/lib/api'

// Функция для правильного получения даты в формате YYYY-MM-DD без проблем с временной зоной
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface Employee {
  id: number
  full_name: string
}

interface Exception {
  id: number
  employee_id: number
  employee_name: string
  exception_date: string
  reason: string
  exception_type: string
  created_at: string
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingException, setEditingException] = useState<Exception | null>(null)
  const [isDateRange, setIsDateRange] = useState(false)
  
  // Состояния для календаря
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Получаем сегодняшнюю дату для ограничения выбора
  const today = formatDate(new Date())
  
  const [formData, setFormData] = useState({
    employee_id: '',
    exception_date: '',
    start_date: '',
    end_date: '',
    reason: '',
    exception_type: 'no_lateness_check'
  })

  useEffect(() => {
    fetchExceptions()
    fetchEmployees()
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

  // Обработка клика по дате в календаре
  const handleDateClick = (dateStr: string) => {
    // Проверяем текущее состояние
    const hasSelectedDate = selectedDate !== ''
    const hasRange = startDate !== '' && endDate !== ''
    
    if (!hasSelectedDate && !hasRange) {
      // Ничего не выбрано - выбираем одну дату
      setSelectedDate(dateStr)
      setStartDate('')
      setEndDate('')
      setFormData(prev => ({ ...prev, exception_date: dateStr, start_date: '', end_date: '' }))
      setIsDateRange(false)
    } else if (hasSelectedDate && !hasRange) {
      // Уже выбрана одна дата - создаем диапазон
      if (dateStr === selectedDate) {
        // Клик по той же дате - остается одна дата
        return
      }
      
      const start = dateStr < selectedDate ? dateStr : selectedDate
      const end = dateStr < selectedDate ? selectedDate : dateStr
      
      setStartDate(start)
      setEndDate(end)
      setSelectedDate('')
      setFormData(prev => ({ ...prev, exception_date: '', start_date: start, end_date: end }))
      setIsDateRange(true)
    } else {
      // Уже есть диапазон или что-то выбрано - сбрасываем и выбираем новую дату
      setSelectedDate(dateStr)
      setStartDate('')
      setEndDate('')
      setFormData(prev => ({ ...prev, exception_date: dateStr, start_date: '', end_date: '' }))
      setIsDateRange(false)
    }
    
    setShowCalendar(false)
  }

  // Сброс выбора дат
  const clearDates = () => {
    setSelectedDate('')
    setStartDate('')
    setEndDate('')
    setFormData(prev => ({ ...prev, exception_date: '', start_date: '', end_date: '' }))
    setIsDateRange(false)
  }

  // Генерация календаря
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
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

  const fetchExceptions = async () => {
    try {
      const data = await apiRequest('employee-exceptions')
      setExceptions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Ошибка при загрузке исключений:', error)
      setExceptions([]) // Устанавливаем пустой массив при ошибке
    }
  }

  const fetchEmployees = async () => {
    try {
      const data = await apiRequest('employees/simple')
      setEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Ошибка при загрузке сотрудников:', error)
      setEmployees([]) // Устанавливаем пустой массив при ошибке
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingException) {
        await apiRequest(`employee-exceptions/${editingException.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            reason: formData.reason,
            exception_type: formData.exception_type
          })
        })
      } else {
        const payload = isDateRange ? {
          employee_id: parseInt(formData.employee_id),
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          exception_type: formData.exception_type
        } : {
          employee_id: parseInt(formData.employee_id),
          exception_date: formData.exception_date,
          reason: formData.reason,
          exception_type: formData.exception_type
        }

        const endpoint = isDateRange ? 'employee-exceptions/range' : 'employee-exceptions'
        await apiRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      }

      resetForm()
      fetchExceptions()
      alert(editingException ? 'Исключение обновлено!' : 'Исключение создано!')
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
      alert('Ошибка при сохранении исключения')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить это исключение?')) return

    try {
      await apiRequest(`employee-exceptions/${id}`, {
        method: 'DELETE'
      })
      fetchExceptions()
      alert('Исключение удалено!')
    } catch (error) {
      console.error('Ошибка при удалении:', error)
      alert('Ошибка при удалении исключения')
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: '',
      exception_date: '',
      start_date: '',
      end_date: '',
      reason: '',
      exception_type: 'no_lateness_check'
    })
    setEditingException(null)
    setIsDateRange(false)
    setShowAddForm(false)
    
    // Сбрасываем состояния календаря
    setSelectedDate('')
    setStartDate('')
    setEndDate('')
    setShowCalendar(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Исключения для сотрудников
        </h1>
        <p className="text-gray-600">
          Управление исключениями по датам (отсутствие проверки опозданий)
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить исключение
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {editingException ? 'Редактировать исключение' : 'Новое исключение'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сотрудник
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Выберите сотрудника</option>
                {Array.isArray(employees) && employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="calendar-container relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата исключения
              </label>
              
              {/* Кнопка для открытия календаря */}
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full inline-flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {startDate && endDate 
                    ? `${startDate} - ${endDate} (диапазон)`
                    : selectedDate 
                    ? selectedDate
                    : 'Выбрать дату 📅'
                  }
                </div>
              </button>
              
              {/* Кнопка сброса */}
              {(selectedDate || (startDate && endDate)) && (
                <button
                  type="button"
                  onClick={clearDates}
                  className="absolute right-2 top-8 text-sm text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              )}
              
              {/* Календарь */}
              {showCalendar && (
                <div className="absolute top-full mt-2 z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-4" style={{minWidth: '280px', right: 0}}>
                  {/* Заголовок календаря */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronUp className="h-4 w-4 rotate-270" />
                    </button>
                    <h3 className="text-sm font-medium">
                      {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      type="button"
                      onClick={goToNextMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
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
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDateClick(dateStr)}
                          className={`
                            w-8 h-8 text-xs rounded-full flex items-center justify-center
                            ${!isCurrentMonth ? 'text-gray-300' : ''}
                            ${isToday ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                            ${isSelected ? 'bg-blue-600 text-white' : ''}
                            ${isStartDate || isEndDate ? 'bg-green-600 text-white' : ''}
                            ${isInRange && !isStartDate && !isEndDate ? 'bg-green-100 text-green-800' : ''}
                            ${!isSelected && !isInRange && !isToday && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <p>• Один клик = одна дата</p>
                    <p>• Два клика = диапазон дат</p>
                    <p>• Диапазон создаст исключения на все дни</p>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Причина исключения
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Например: командировка, больничный, отпуск"
                required
              />
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {editingException ? 'Обновить' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Активные исключения ({exceptions.length})
          </h2>
        </div>

        {exceptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Исключений пока нет</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сотрудник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Причина
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(exceptions) && exceptions.map((exception) => (
                  <tr key={exception.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {exception.employee_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(exception.exception_date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {exception.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDelete(exception.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
