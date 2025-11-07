'use client'
import React, { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'

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

  // Обработчик выбора даты
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
  }

  // Фильтрация по поиску в основной таблице
  const filteredSvodEmployees = svodEmployees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Фильтрация в модальном окне
  const filteredModalEmployees = allEmployees.filter(emp => {
    const matchesSearch = 
      emp.full_name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(modalSearchQuery.toLowerCase())
    
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
        'Служба': emp.department,
        'Комментарий': emp.comment || '-'
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      
      // Настраиваем ширину колонок
      const colWidths = [
        { wch: 5 },   // №
        { wch: 30 },  // Должность
        { wch: 25 },  // ФИО
        { wch: 30 },  // Служба
        { wch: 40 }   // Комментарий
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата отчета</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по ФИО, должности или службе..."
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
            <div className="mb-4 text-sm text-gray-600">
              Всего сотрудников: <span className="font-semibold">{filteredSvodEmployees.length}</span>
              {filteredSvodEmployees.filter(e => e.comment).length > 0 && (
                <span className="ml-4">
                  С комментариями: <span className="font-semibold">{filteredSvodEmployees.filter(e => e.comment).length}</span>
                </span>
              )}
            </div>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Должность</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Служба</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Комментарий</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSvodEmployees.map((emp, idx) => (
                  <tr key={emp.id} className={`hover:bg-gray-50 ${emp.comment ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{emp.position}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-700">{emp.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                    <td className="px-4 py-3 text-sm">
                      {emp.comment ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🛡️ {emp.comment}
                        </span>
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
                placeholder="Поиск по ФИО, должности или службе..."
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Служба</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredModalEmployees.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.full_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.position}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
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
