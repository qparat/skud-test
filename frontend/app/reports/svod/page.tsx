'use client'
import React, { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import { Calendar, ChevronLeft, ChevronRight, GripVertical, Plus, FileText, Trash2, X } from 'lucide-react'

interface SvodEmployee {
  id: number
  full_name: string
  position: string
  department: string
  comment: string
  exception_type: string | null
}

interface AllEmployee {
  id: number
  full_name: string
  position: string
  department: string
}

interface BirthdayEmployee {
  id: number
  full_name: string
  position: string
  department: string
  birth_date: string
}

// Функция для форматирования даты
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Функция для форматирования даты по-русски
const formatDateRussian = (dateStr: string) => {
  const date = new Date(dateStr)
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} года`
}

export default function SvodReportPage() {
  const [svodEmployees, setSvodEmployees] = useState<SvodEmployee[]>([])
  const [allEmployees, setAllEmployees] = useState<AllEmployee[]>([])
  const [birthdayEmployees, setBirthdayEmployees] = useState<BirthdayEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [modalSearchQuery, setModalSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // Состояния для календаря
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Состояния для drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Загрузка сводной таблицы и дней рождений
  useEffect(() => {
    loadSvodReport()
    loadBirthdays()
  }, [selectedDate])

  const loadSvodReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest(`svod-report?date=${selectedDate}`)
      // Показываем только тех, кто в своде
      const inSvod = data.employees?.filter((emp: any) => emp.in_svod) || []
      setSvodEmployees(inSvod)
    } catch (err) {
      setError('Ошибка загрузки данных')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadBirthdays = async () => {
    try {
      const data = await apiRequest(`dashboard-birthdays?date=${selectedDate}`)
      setBirthdayEmployees(data.birthdays || [])
    } catch (err) {
      console.error('Ошибка загрузки дней рождений:', err)
      setBirthdayEmployees([])
    }
  }

  // Загрузка всех сотрудников для модального окна
  const loadAllEmployees = async () => {
    try {
      const data = await apiRequest('employees/simple')
      setAllEmployees(data.employees || [])
    } catch (err) {
      console.error('Ошибка загрузки списка сотрудников:', err)
    }
  }

  // Открыть модальное окно
  const openModal = () => {
    setShowModal(true)
    loadAllEmployees()
    setModalSearchQuery('')
  }

  const closeModal = () => {
    setShowModal(false)
    setModalSearchQuery('')
  }

  // Добавить сотрудника в свод
  const addToSvod = async (employee: AllEmployee) => {
    setActionLoading(employee.id)
    try {
      await apiRequest('svod-report/add-employee', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: employee.id,
          report_date: selectedDate
        })
      })
      await loadSvodReport()
      setShowModal(false)
    } catch (err) {
      console.error('Ошибка добавления в свод:', err)
      alert('Ошибка добавления в свод')
    } finally {
      setActionLoading(null)
    }
  }

  // Убрать сотрудника из свода
  const removeFromSvod = async (employeeId: number) => {
    setActionLoading(employeeId)
    try {
      await apiRequest(`svod-report/remove-employee?employee_id=${employeeId}&report_date=${selectedDate}`, {
        method: 'DELETE'
      })
      await loadSvodReport()
    } catch (err) {
      console.error('Ошибка удаления из свода:', err)
      alert('Ошибка удаления из свода')
    } finally {
      setActionLoading(null)
    }
  }

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

  // Генерация календаря
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    let dayOfWeek = firstDay.getDay()
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const days = []
    const currentDate = new Date(startDate)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return days
  }

  // Навигация по месяцам
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  // Выбор даты из календаря
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr)
    setShowCalendar(false)
  }

  // Функции для drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newEmployees = [...filteredSvodEmployees]
    const draggedEmployee = newEmployees[draggedIndex]
    
    // Удаляем элемент из старой позиции
    newEmployees.splice(draggedIndex, 1)
    
    // Вставляем элемент в новую позицию
    newEmployees.splice(dropIndex, 0, draggedEmployee)
    
    // Обновляем порядок в основном массиве
    let updatedSvodEmployees = [...svodEmployees]
    
    // Если есть фильтрация, нужно корректно обновить порядок
    if (searchQuery.trim() === '') {
      updatedSvodEmployees = newEmployees
    } else {
      // При фильтрации обновляем только отфильтрованные элементы в правильном порядке
      const filteredIds = newEmployees.map((emp: SvodEmployee) => emp.id)
      const nonFilteredEmployees = svodEmployees.filter((emp: SvodEmployee) => !filteredIds.includes(emp.id))
      updatedSvodEmployees = [...newEmployees, ...nonFilteredEmployees]
    }
    
    // Обновляем состояние локально
    setSvodEmployees(updatedSvodEmployees)
    
    // Сохраняем новый порядок на сервере
    try {
      const orderData = updatedSvodEmployees.map((emp: SvodEmployee, index: number) => ({
        employee_id: emp.id,
        order_index: index
      }))
      
      await apiRequest('svod-report/update-order', {
        method: 'POST',
        body: JSON.stringify({ order: orderData })
      })
      
      console.log('Порядок сотрудников сохранен на сервере')
    } catch (err) {
      console.error('Ошибка сохранения порядка:', err)
      // При ошибке перезагружаем данные с сервера
      loadSvodReport()
      alert('Ошибка сохранения порядка сотрудников. Данные восстановлены.')
    }
    
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Фильтрация по поиску в основной таблице
  const filteredSvodEmployees = svodEmployees.filter((emp: SvodEmployee) => 
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Фильтрация в модальном окне
  const filteredAllEmployees = allEmployees.filter((emp: AllEmployee) => {
    const matchesSearch = 
      emp.full_name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(modalSearchQuery.toLowerCase())
    
    // Не показываем тех, кто уже в своде
    const alreadyInSvod = svodEmployees.some((se: SvodEmployee) => se.id === emp.id)
    
    return matchesSearch && !alreadyInSvod
  })

  // Экспорт в Excel
  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      
      const excelData = filteredSvodEmployees.map((emp: SvodEmployee, index: number) => ({
        '№': index + 1,
        'Должность': emp.position,
        'ФИО': emp.full_name,
        'Комментарий': emp.comment || '-'
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      
      // Настраиваем ширину колонок
      const colWidths = [
        { wch: 5 },   // №
        { wch: 40 },  // Должность
        { wch: 30 },  // ФИО
        { wch: 50 }   // Комментарий
      ]
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, 'Свод ТРК')
      XLSX.writeFile(wb, `Свод_ТРК_${selectedDate}.xlsx`)
    } catch (err) {
      console.error('Ошибка экспорта:', err)
      alert('Ошибка при экспорте в Excel')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Основная панель управления отчетом */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Сводный отчет ТРК
          </h1>
          <p className="text-gray-600">
            Сведения о местонахождении руководящего состава на {formatDateRussian(selectedDate)}
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Загрузка данных...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{svodEmployees.length}</div>
                <div className="text-sm text-blue-800">Всего в своде</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{birthdayEmployees.length}</div>
                <div className="text-sm text-green-800">Дни рождения</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {svodEmployees.filter(emp => emp.comment).length}
                </div>
                <div className="text-sm text-purple-800">С комментариями</div>
              </div>
            </div>

            {/* Список сотрудников (краткий вид) */}
            {svodEmployees.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Сотрудники в отчете:</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {svodEmployees.slice(0, 10).map((emp, idx) => (
                      <div key={emp.id} className="flex items-center space-x-2 text-sm">
                        <span className="font-medium text-gray-500">{idx + 1}.</span>
                        <span className="text-gray-800">{emp.full_name}</span>
                        <span className="text-gray-500 text-xs">({emp.position})</span>
                      </div>
                    ))}
                    {svodEmployees.length > 10 && (
                      <div className="text-sm text-gray-500 italic col-span-2">
                        ...и еще {svodEmployees.length - 10} сотрудников
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg mb-6">
                <div className="text-gray-400 text-lg mb-2">📋</div>
                <p className="text-gray-500 text-lg mb-2">Отчет пуст</p>
                <p className="text-gray-400 text-sm">Добавьте сотрудников для формирования отчета</p>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowReportModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 font-medium"
              >
                <FileText className="h-5 w-5" />
                <span>Посмотреть таблицу</span>
              </button>
              
              <button
                onClick={openModal}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Добавить сотрудника</span>
              </button>
              
              {svodEmployees.length > 0 && (
                <button
                  onClick={exportToExcel}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2 font-medium"
                >
                  <FileText className="h-5 w-5" />
                  <span>Экспорт Excel</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      
      {/* Панель настройки даты */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
        <div className="flex items-center justify-center">
          <div className="calendar-container relative">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Дата отчета</label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="inline-flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              style={{ minWidth: '180px' }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {selectedDate}
            </button>
            
            {/* Календарь */}
            {showCalendar && (
              <div className="absolute top-full mt-2 z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-4" style={{minWidth: '280px', left: '50%', transform: 'translateX(-50%)'}}>
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={goToPreviousMonth} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="text-sm font-medium">
                    {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button type="button" onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="text-xs text-center text-gray-500 font-medium py-1">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendar().map((date, index) => {
                    const dateStr = formatDate(date)
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                    const isToday = dateStr === formatDate(new Date())
                    const isSelected = dateStr === selectedDate
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDateClick(dateStr)}
                        className={`w-8 h-8 text-xs rounded-full flex items-center justify-center
                          ${!isCurrentMonth ? 'text-gray-300' : ''}
                          ${isToday ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                          ${isSelected ? 'bg-blue-600 text-white' : ''}
                          ${!isSelected && !isToday && isCurrentMonth ? 'hover:bg-gray-100' : ''}`}
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

      {/* Модальное окно просмотра отчета */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Официальный отчет - {formatDateRussian(selectedDate)}</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]" style={{ fontFamily: 'Times New Roman, serif' }}>
              {/* Заголовок отчета */}
              <div className="text-center mb-8">
                <div className="text-sm font-bold leading-relaxed">
                  Сведения о местонахождении руководящего состава
                  <br />
                  РГП на ПХВ «Телерадиокомплекс
                  <br />
                  Президента Республики Казахстан»
                  <br />
                  Управление делами Президента
                  <br />
                  Республики Казахстан
                </div>
              </div>

              {/* Дата */}
              <div className="text-center mb-6 font-bold">
                {formatDateRussian(selectedDate)}
              </div>

              {/* Основная таблица */}
              <div className="mb-8">
                <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
                  <thead>
                    <tr>
                      <th className="border border-black p-2 text-sm font-bold" style={{ width: '60px' }}>
                        п/п
                      </th>
                      <th className="border border-black p-2 text-sm font-bold" style={{ width: '40%' }}>
                        Наименование должности
                      </th>
                      <th className="border border-black p-2 text-sm font-bold" style={{ width: '35%' }}>
                        Ф.И.О.
                      </th>
                      <th className="border border-black p-2 text-sm font-bold">
                        Примечание
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {svodEmployees.length === 0 ? (
                      Array.from({ length: 10 }, (_, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-center text-sm">{i + 1}</td>
                          <td className="border border-black p-2 text-sm"></td>
                          <td className="border border-black p-2 text-sm"></td>
                          <td className="border border-black p-2 text-sm"></td>
                        </tr>
                      ))
                    ) : (
                      <>
                        {svodEmployees.map((emp, idx) => (
                          <tr key={emp.id}>
                            <td className="border border-black p-2 text-center text-sm">{idx + 1}</td>
                            <td className="border border-black p-2 text-sm">{emp.position}</td>
                            <td className="border border-black p-2 text-sm">{emp.full_name}</td>
                            <td className="border border-black p-2 text-sm">{emp.comment || ''}</td>
                          </tr>
                        ))}
                        {/* Добавляем пустые строки до 45 */}
                        {Array.from({ length: Math.max(0, 45 - svodEmployees.length) }, (_, i) => (
                          <tr key={`empty-${i}`}>
                            <td className="border border-black p-2 text-center text-sm">{svodEmployees.length + i + 1}</td>
                            <td className="border border-black p-2 text-sm"></td>
                            <td className="border border-black p-2 text-sm"></td>
                            <td className="border border-black p-2 text-sm"></td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Секция "Дни рождения" */}
              <div>
                <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
                  <thead>
                    <tr>
                      <td 
                        className="border border-black p-2 text-center text-sm font-bold bg-gray-100" 
                        colSpan={4}
                      >
                        Дни рождения
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 text-center text-sm font-bold" style={{ width: '60px' }}>
                        п/п
                      </td>
                      <td className="border border-black p-2 text-sm font-bold" style={{ width: '40%' }}>
                        Наименование должности
                      </td>
                      <td className="border border-black p-2 text-sm font-bold" style={{ width: '35%' }}>
                        Ф.И.О.
                      </td>
                      <td className="border border-black p-2 text-sm font-bold">
                        Примечание
                      </td>
                    </tr>
                    {birthdayEmployees.length === 0 ? (
                      <tr>
                        <td className="border border-black p-2 text-center text-sm">1</td>
                        <td className="border border-black p-2 text-sm"></td>
                        <td className="border border-black p-2 text-sm"></td>
                        <td className="border border-black p-2 text-sm"></td>
                      </tr>
                    ) : (
                      birthdayEmployees.map((emp, idx) => (
                        <tr key={emp.id}>
                          <td className="border border-black p-2 text-center text-sm">{idx + 1}</td>
                          <td className="border border-black p-2 text-sm">{emp.position}</td>
                          <td className="border border-black p-2 text-sm">{emp.full_name}</td>
                          <td className="border border-black p-2 text-sm">День рождения</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Управление из модального окна */}
              {svodEmployees.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h4 className="text-lg font-semibold mb-4">Управление отчетом:</h4>
                  <div className="space-y-2">
                    {svodEmployees.map((emp, idx) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-2 bg-gray-50 border rounded text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-600">{idx + 1}.</span>
                          <span className="text-gray-800">{emp.full_name}</span>
                          <span className="text-gray-500 text-xs">({emp.position})</span>
                        </div>
                        <button
                          onClick={() => removeFromSvod(emp.id)}
                          disabled={actionLoading === emp.id}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 flex items-center"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {actionLoading === emp.id ? 'Удаление...' : 'Удалить'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t p-4 flex justify-between">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Экспорт Excel
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для добавления сотрудников */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Добавить сотрудников в отчет</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder="Поиск сотрудников..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Выбрать</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ФИО</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Должность</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Отдел</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllEmployees.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <button
                          onClick={() => addToSvod(emp)}
                          disabled={actionLoading === emp.id}
                          className={`px-3 py-1 text-sm rounded ${
                            actionLoading === emp.id
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {actionLoading === emp.id ? 'Добавление...' : 'Добавить'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-sm">{emp.full_name}</td>
                      <td className="px-4 py-2 text-sm">{emp.position || '-'}</td>
                      <td className="px-4 py-2 text-sm">{emp.department || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAllEmployees.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Сотрудники не найдены
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}