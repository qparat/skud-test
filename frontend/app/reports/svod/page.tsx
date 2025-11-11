'use client'
import React, { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import { Calendar, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'

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

// Функция для форматирования даты
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function SvodReportPage() {
  const [svodEmployees, setSvodEmployees] = useState<SvodEmployee[]>([])
  const [allEmployees, setAllEmployees] = useState<AllEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [modalSearchQuery, setModalSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // Состояния для календаря
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Состояния для drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Загрузка сводной таблицы (только те кто в своде)
  useEffect(() => {
    loadSvodReport()
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

  // Добавить сотрудника в свод
  const addToSvod = async (employeeId: number) => {
    setActionLoading(employeeId)
    try {
      await apiRequest('svod-report/add-employee', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: employeeId,
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
      const filteredIds = newEmployees.map(emp => emp.id)
      const nonFilteredEmployees = svodEmployees.filter(emp => !filteredIds.includes(emp.id))
      updatedSvodEmployees = [...newEmployees, ...nonFilteredEmployees]
    }
    
    // Обновляем состояние локально
    setSvodEmployees(updatedSvodEmployees)
    
    // Сохраняем новый порядок на сервере
    try {
      const orderData = updatedSvodEmployees.map((emp, index) => ({
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
  const filteredSvodEmployees = svodEmployees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Фильтрация в модальном окне
  const filteredModalEmployees = allEmployees.filter(emp => {
    const matchesSearch = 
      emp.full_name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(modalSearchQuery.toLowerCase())
    
    // Не показываем тех, кто уже в своде
    const alreadyInSvod = svodEmployees.some(se => se.id === emp.id)
    
    return matchesSearch && !alreadyInSvod
  })

  // Экспорт в Excel
  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      
      const excelData = filteredSvodEmployees.map((emp, index) => ({
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Свод ТРК</h1>
        <button
          onClick={openModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Добавить сотрудника
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="calendar-container relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата отчета</label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="inline-flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ minWidth: '160px' }}
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {selectedDate}
                </div>
              </button>
              
              {/* Выпадающий календарь */}
              {showCalendar && (
                <div className="absolute top-full mt-2 z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-4" style={{minWidth: '280px', left: 0}}>
                  {/* Заголовок календаря */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h3 className="text-sm font-medium">
                      {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      type="button"
                      onClick={goToNextMonth}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Дни недели */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                      <div key={day} className="text-xs text-center text-gray-500 font-medium py-1">{day}</div>
                    ))}
                  </div>
                  
                  {/* Дни месяца */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по ФИО или должности..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minWidth: '300px' }}
              />
            </div>
          </div>
          
          {svodEmployees.length > 0 && (
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Выгрузить в Excel
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600">Загрузка данных...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : svodEmployees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">Список свода пуст</p>
            <p className="text-gray-400 text-sm">Нажмите "Добавить сотрудника" для начала работы</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
              <div>
                Всего сотрудников: <span className="font-semibold">{filteredSvodEmployees.length}</span>
                {filteredSvodEmployees.filter(e => e.comment).length > 0 && (
                  <span className="ml-4">
                    С комментариями: <span className="font-semibold">{filteredSvodEmployees.filter(e => e.comment).length}</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <GripVertical className="h-3 w-3 mr-1" />
                Перетащите строки для изменения порядка
              </div>
            </div>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Должность</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Комментарий</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSvodEmployees.map((emp, idx) => (
                  <tr 
                    key={emp.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-gray-50 cursor-move transition-colors duration-200
                      ${emp.exception_type && emp.exception_type !== 'at_work' ? 'bg-blue-50' : ''}
                      ${draggedIndex === idx ? 'opacity-50' : ''}
                      ${dragOverIndex === idx ? 'border-t-2 border-blue-500' : ''}`}
                  >
                    <td className="px-2 py-3 text-center">
                      <GripVertical className="h-4 w-4 text-gray-400 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{emp.position}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-700">{emp.full_name}</td>
                    <td className="px-4 py-3 text-sm">
                      {emp.comment ? (
                        emp.exception_type === 'at_work' ? (
                          <span className="text-gray-900">{emp.comment}</span>
                        ) : (
                          <span className="inline-flex items-center text-sm font-medium text-gray-900">
                            🛡️ {emp.comment}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeFromSvod(emp.id)}
                        disabled={actionLoading === emp.id}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === emp.id ? 'Удаление...' : 'Убрать'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredSvodEmployees.length === 0 && svodEmployees.length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">По запросу "{searchQuery}" ничего не найдено</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно для добавления сотрудников */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Заголовок */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Добавить сотрудника в свод</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Поиск */}
            <div className="px-6 py-4 border-b">
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder="Поиск по ФИО или должности..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Список сотрудников */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredModalEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {modalSearchQuery ? 'Нет результатов по запросу' : 'Все сотрудники уже добавлены в свод'}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Должность</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredModalEmployees.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.full_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.position}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => addToSvod(emp.id)}
                            disabled={actionLoading === emp.id}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === emp.id ? 'Добавление...' : 'Добавить'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Подвал */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Найдено сотрудников: <span className="font-semibold">{filteredModalEmployees.length}</span>
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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
