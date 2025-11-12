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
      
      // Создаем данные для экспорта
      const excelData = []
      
      // Заголовок организации
      excelData.push(['Сведения о местонахождении руководящего состава'])
      excelData.push(['РГП на ПХВ «Телерадиокомплекс'])
      excelData.push(['Президента Республики Казахстан»'])
      excelData.push(['Управление делами Президента'])
      excelData.push(['Республики Казахстан'])
      excelData.push([]) // пустая строка
      
      // Дата отчета
      excelData.push([formatDateRussian(selectedDate)])
      excelData.push([]) // пустая строка
      
      // Заголовки основной таблицы
      excelData.push(['п/п', 'Наименование должности', 'Ф.И.О.', 'Примечание'])
      
      // Данные сотрудников (минимум 45 строк)
      const maxRows = Math.max(45, svodEmployees.length)
      for (let i = 0; i < maxRows; i++) {
        if (i < svodEmployees.length) {
          const emp = svodEmployees[i]
          excelData.push([
            i + 1,
            emp.position,
            emp.full_name,
            emp.comment || ''
          ])
        } else {
          excelData.push([i + 1, '', '', ''])
        }
      }
      
      excelData.push([]) // пустая строка
      
      // Секция "Дни рождения"
      excelData.push(['Дни рождения', '', '', ''])
      excelData.push(['п/п', 'Наименование должности', 'Ф.И.О.', 'Примечание'])
      
      // Данные дней рождения
      if (birthdayEmployees.length === 0) {
        excelData.push([1, '', '', ''])
      } else {
        birthdayEmployees.forEach((emp, idx) => {
          excelData.push([
            idx + 1,
            emp.position,
            emp.full_name,
            'День рождения'
          ])
        })
      }

      // Создаем рабочий лист
      const ws = XLSX.utils.aoa_to_sheet(excelData)
      
      // Объединяем ячейки для заголовка
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Заголовок 1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Заголовок 2
        { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Заголовок 3
        { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Заголовок 4
        { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // Заголовок 5
        { s: { r: 6, c: 0 }, e: { r: 6, c: 3 } }  // Дата
      ]
      
      // Находим строку "Дни рождения" и объединяем ее
      const birthdayRowIndex = excelData.findIndex(row => row[0] === 'Дни рождения')
      if (birthdayRowIndex !== -1) {
        merges.push({ s: { r: birthdayRowIndex, c: 0 }, e: { r: birthdayRowIndex, c: 3 } })
      }
      
      ws['!merges'] = merges
      
      // Настраиваем ширину колонок
      ws['!cols'] = [
        { wch: 8 },   // п/п
        { wch: 45 },  // Должность
        { wch: 35 },  // ФИО
        { wch: 30 }   // Примечание
      ]
      
      // Применяем стили к конкретным ячейкам
      Object.keys(ws).forEach(key => {
        if (key[0] === '!' || !ws[key].v) return
        
        const cellRef = XLSX.utils.decode_cell(key)
        const row = cellRef.r
        const col = cellRef.c
        
        // Базовый стиль для всех ячеек
        let cellStyle = {
          font: { name: 'Times New Roman', sz: 14 },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
        }
        
        // Первая строка заголовка - полужирная и по центру
        if (row === 0) {
          cellStyle = {
            font: { name: 'Times New Roman', sz: 14, b: true } as any,
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
          }
        }
        // Строки 2-5 заголовка - по центру
        else if (row >= 1 && row <= 4) {
          cellStyle = {
            font: { name: 'Times New Roman', sz: 14 },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
          }
        }
        // Дата - полужирная и по центру
        else if (row === 6) {
          cellStyle = {
            font: { name: 'Times New Roman', sz: 14, b: true } as any,
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
          }
        }
        // Заголовки таблиц - полужирные и по центру
        else if (ws[key].v === 'п/п' || ws[key].v === 'Наименование должности' || 
                 ws[key].v === 'Ф.И.О.' || ws[key].v === 'Примечание' || 
                 ws[key].v === 'Дни рождения') {
          cellStyle = {
            font: { name: 'Times New Roman', sz: 14, b: true } as any,
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
          }
        }
        
        ws[key].s = cellStyle
      })

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Свод ТРК')
      XLSX.writeFile(wb, `Свод_ТРК_${selectedDate}.xlsx`)
    } catch (err) {
      console.error('Ошибка экспорта:', err)
      alert('Ошибка при экспорте в Excel')
    }
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
                <div className="text-sm leading-relaxed">
                  <div className="font-bold">Сведения о местонахождении руководящего состава</div>
                  <div>РГП на ПХВ «Телерадиокомплекс</div>
                  <div>Президента Республики Казахстан»</div>
                  <div>Управление делами Президента</div>
                  <div>Республики Казахстан</div>
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