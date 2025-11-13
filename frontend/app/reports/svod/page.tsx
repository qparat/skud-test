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

  // Экспорт в Excel (с использованием HTML для сохранения стилей Times New Roman 14pt)
  const exportToExcel = () => {
    try {
      // Создаем HTML таблицу со стилями
      let htmlTable = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                font-size: 14pt; 
                margin: 0; 
                padding: 20px; 
              }
              table { 
                font-family: 'Times New Roman', serif; 
                font-size: 14pt; 
                border-collapse: collapse; 
                width: 100%; 
                border: 2px solid black;
              }
              th, td { 
                border: 1px solid black; 
                padding: 8px; 
                text-align: left; 
                vertical-align: middle; 
                font-family: 'Times New Roman', serif; 
                font-size: 14pt;
              }
              .header { 
                font-weight: bold; 
                text-align: center; 
                font-size: 14pt; 
                font-family: 'Times New Roman', serif;
              }
              .center { 
                text-align: center; 
                font-family: 'Times New Roman', serif; 
                font-size: 14pt;
              }
              .bold { 
                font-weight: bold; 
                font-family: 'Times New Roman', serif; 
                font-size: 14pt;
              }
              .table-header {
                background-color: #f0f0f0;
                font-weight: bold;
                text-align: center;
                font-family: 'Times New Roman', serif; 
                font-size: 14pt;
              }
            </style>
          </head>
          <body>
            <table>
      `

      // Заголовок организации
      htmlTable += `
        <tr><td colspan="4" class="header">Сведения о местонахождении руководящего состава</td></tr>
        <tr><td colspan="4" class="center">РГП на ПХВ «Телерадиокомплекс</td></tr>
        <tr><td colspan="4" class="center">Президента Республики Казахстан»</td></tr>
        <tr><td colspan="4" class="center">Управление делами Президента</td></tr>
        <tr><td colspan="4" class="center">Республики Казахстан</td></tr>
        <tr><td colspan="4">&nbsp;</td></tr>
        <tr><td colspan="4" class="header">${formatDateRussian(selectedDate)}</td></tr>
        <tr><td colspan="4">&nbsp;</td></tr>
      `

      // Заголовки основной таблицы
      htmlTable += `
        <tr>
          <th class="table-header">п/п</th>
          <th class="table-header">Наименование должности</th>
          <th class="table-header">Ф.И.О.</th>
          <th class="table-header">Примечание</th>
        </tr>
      `

      // Данные сотрудников (минимум 45 строк)
      const maxRows = Math.max(45, svodEmployees.length)
      for (let i = 0; i < maxRows; i++) {
        if (i < svodEmployees.length) {
          const emp = svodEmployees[i]
          htmlTable += `
            <tr>
              <td class="center" style="border: 1px solid black;">${i + 1}</td>
              <td style="border: 1px solid black;">${emp.position}</td>
              <td style="border: 1px solid black;">${emp.full_name}</td>
              <td style="border: 1px solid black;">${emp.comment || ''}</td>
            </tr>
          `
        } else {
          htmlTable += `
            <tr>
              <td class="center" style="border: 1px solid black;">${i + 1}</td>
              <td style="border: 1px solid black;"></td>
              <td style="border: 1px solid black;"></td>
              <td style="border: 1px solid black;"></td>
            </tr>
          `
        }
      }

      // Секция "Дни рождения"
      htmlTable += `
        <tr><td colspan="4" style="border: 1px solid black;">&nbsp;</td></tr>
        <tr><td colspan="4" class="header">Дни рождения</td></tr>
        <tr>
          <th class="table-header">п/п</th>
          <th class="table-header">Наименование должности</th>
          <th class="table-header">Ф.И.О.</th>
          <th class="table-header">Примечание</th>
        </tr>
      `

      // Данные дней рождения
      if (birthdayEmployees.length === 0) {
        htmlTable += `
          <tr>
            <td class="center" style="border: 1px solid black;">1</td>
            <td style="border: 1px solid black;"></td>
            <td style="border: 1px solid black;"></td>
            <td style="border: 1px solid black;"></td>
          </tr>
        `
      } else {
        birthdayEmployees.forEach((emp: any, idx: number) => {
          htmlTable += `
            <tr>
              <td class="center" style="border: 1px solid black;">${idx + 1}</td>
              <td style="border: 1px solid black;">${emp.position}</td>
              <td style="border: 1px solid black;">${emp.full_name}</td>
              <td style="border: 1px solid black;">День рождения</td>
            </tr>
          `
        })
      }

      htmlTable += `
            </table>
          </body>
        </html>
      `

      // Создаем Blob с HTML содержимым
      const blob = new Blob([htmlTable], { 
        type: 'application/vnd.ms-excel;charset=utf-8' 
      })
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Свод_ТРК_${selectedDate}.xls`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Освобождаем память
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Ошибка экспорта:', err)
      alert('Ошибка при экспорте в Excel')
    }
  }

  // Функции для модального окна (не изменялись)
  const filterEmployee = (emp: AllEmployee) => {
    const matchesSearch = 
      emp.full_name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(modalSearchQuery.toLowerCase())
    const alreadyInSvod = svodEmployees.some((se: SvodEmployee) => se.id === emp.id)
    return matchesSearch && !alreadyInSvod
  }


  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Панель управления */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="calendar-container relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата отчета</label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="inline-flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                style={{ minWidth: '160px' }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {selectedDate}
              </button>
              
              {/* Календарь */}
              {showCalendar && (
                <div className="absolute top-full mt-2 z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-4" style={{minWidth: '280px', left: 0}}>
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
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Посмотреть таблицу
            </button>
            <button
              onClick={openModal}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить сотрудника
            </button>
            {svodEmployees.length > 0 && (
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Выгрузить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Основная таблица */}
      <div className="bg-white rounded-lg shadow-sm border">
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
            <div className="mb-4 flex justify-between items-center text-sm text-gray-600 p-4">
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

      {/* Модальное окно добавления сотрудника */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Добавить сотрудника в свод</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 border-b">
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder="Поиск по ФИО или должности..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="overflow-y-auto flex-grow">
              {filteredAllEmployees.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  {allEmployees.length === 0 ? 'Загрузка списка сотрудников...' : 'Сотрудники не найдены или уже в своде.'}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredAllEmployees.map((emp) => (
                    <li key={emp.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-gray-900">{emp.full_name}</div>
                        <div className="text-sm text-gray-500">{emp.position}</div>
                      </div>
                      <button
                        onClick={() => addToSvod(emp)}
                        disabled={actionLoading === emp.id}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === emp.id ? 'Добавление...' : 'Добавить'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

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
                <div className="text-sm leading-relaxed" style={{ fontSize: '14pt' }}>
                  <div className="font-bold">Сведения о местонахождении руководящего состава</div>
                  <div>РГП на ПХВ «Телерадиокомплекс</div>
                  <div>Президента Республики Казахстан»</div>
                  <div>Управление делами Президента</div>
                  <div>Республики Казахстан</div>
                </div>
              </div>

              {/* Дата */}
              <div className="text-center mb-6 font-bold" style={{ fontSize: '14pt' }}>
                {formatDateRussian(selectedDate)}
              </div>

              {/* Основная таблица */}
              <div className="mb-8">
                <table className="w-full border-collapse" style={{ border: '2px solid black', fontSize: '14pt' }}>
                  <thead>
                    <tr>
                      <th className="border border-black p-2 text-sm font-bold bg-gray-100" style={{ width: '60px', fontSize: '14pt' }}>
                        п/п
                      </th>
                      <th className="border border-black p-2 text-sm font-bold bg-gray-100" style={{ width: '40%', fontSize: '14pt' }}>
                        Наименование должности
                      </th>
                      <th className="border border-black p-2 text-sm font-bold bg-gray-100" style={{ width: '35%', fontSize: '14pt' }}>
                        Ф.И.О.
                      </th>
                      <th className="border border-black p-2 text-sm font-bold bg-gray-100" style={{ fontSize: '14pt' }}>
                        Примечание
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {svodEmployees.length === 0 ? (
                      Array.from({ length: 10 }, (_, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2 text-center text-sm" style={{ fontSize: '14pt' }}>{i + 1}</td>
                          <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                          <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                          <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                        </tr>
                      ))
                    ) : (
                      <>
                        {svodEmployees.map((emp, idx) => (
                          <tr key={emp.id}>
                            <td className="border border-black p-2 text-center text-sm" style={{ fontSize: '14pt' }}>{idx + 1}</td>
                            <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}>{emp.position}</td>
                            <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}>{emp.full_name}</td>
                            <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}>{emp.comment || ''}</td>
                          </tr>
                        ))}
                        {/* Добавляем пустые строки до 45 */}
                        {Array.from({ length: Math.max(0, 45 - svodEmployees.length) }, (_, i) => (
                          <tr key={`empty-${i}`}>
                            <td className="border border-black p-2 text-center text-sm" style={{ fontSize: '14pt' }}>{svodEmployees.length + i + 1}</td>
                            <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                            <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                            <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Секция "Дни рождения" */}
              <div>
                <table className="w-full border-collapse" style={{ border: '2px solid black', fontSize: '14pt' }}>
                  <thead>
                    <tr>
                      <td 
                        className="border border-black p-2 text-center text-sm font-bold bg-gray-100" 
                        colSpan={4}
                        style={{ fontSize: '14pt' }}
                      >
                        Дни рождения
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 text-center text-sm font-bold bg-gray-100" style={{ width: '60px', fontSize: '14pt' }}>
                        п/п
                      </td>
                      <td className="border border-black p-2 text-sm font-bold bg-gray-100" style={{ width: '40%', fontSize: '14pt' }}>
                        Наименование должности
                      </td>
                      <td className="border border-black p-2 text-sm font-bold bg-gray-100" style={{ width: '35%', fontSize: '14pt' }}>
                        Ф.И.О.
                      </td>
                      <td className="border border-black p-2 text-sm font-bold bg-gray-100" style={{ fontSize: '14pt' }}>
                        Примечание
                      </td>
                    </tr>
                    {birthdayEmployees.length === 0 ? (
                      <tr>
                        <td className="border border-black p-2 text-center text-sm" style={{ fontSize: '14pt' }}>1</td>
                        <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                        <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                        <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}></td>
                      </tr>
                    ) : (
                      birthdayEmployees.map((emp, idx) => (
                        <tr key={emp.id}>
                          <td className="border border-black p-2 text-center text-sm" style={{ fontSize: '14pt' }}>{idx + 1}</td>
                          <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}>{emp.position}</td>
                          <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}>{emp.full_name}</td>
                          <td className="border border-black p-2 text-sm" style={{ fontSize: '14pt' }}>День рождения</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
