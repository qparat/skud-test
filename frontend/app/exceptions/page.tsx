'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Calendar, User, AlertCircle } from 'lucide-react'

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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingException, setEditingException] = useState<Exception | null>(null)
  const [isDateRange, setIsDateRange] = useState(false) // Переключатель диапазона дат

  // Форма для добавления/редактирования исключения
  const [formData, setFormData] = useState({
    employee_id: '',
    exception_date: '',
    start_date: '', // Для диапазона
    end_date: '',   // Для диапазона
    reason: '',
    exception_type: 'no_lateness_check'
  })

  useEffect(() => {
    fetchEmployees()
    fetchExceptions()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:8003/employees/simple')
      const data = await response.json()
      console.log('Employees data:', data) // Для отладки
      
      // Проверяем, является ли data массивом
      if (Array.isArray(data)) {
        setEmployees(data)
      } else {
        console.error('Employees data is not an array:', data)
        setEmployees([])
      }
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error)
      setEmployees([])
    }
  }

  const fetchExceptions = async () => {
    try {
      const response = await fetch('http://localhost:8003/employee-exceptions')
      const data = await response.json()
      setExceptions(data)
      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки исключений:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Валидация диапазона дат
    if (isDateRange && !editingException) {
      if (!formData.start_date || !formData.end_date) {
        alert('Пожалуйста, заполните обе даты для диапазона')
        return
      }
      
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
      if (startDate > endDate) {
        alert('Начальная дата не может быть позже конечной')
        return
      }
      
      // Ограничение на максимальный диапазон (31 день)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 31) {
        alert('Максимальный диапазон - 31 день')
        return
      }
    }
    
    try {
      let url, method, body
      
      if (editingException) {
        // Редактирование существующего исключения
        url = `http://localhost:8003/employee-exceptions/${editingException.id}`
        method = 'PUT'
        body = { reason: formData.reason, exception_type: formData.exception_type }
      } else if (isDateRange) {
        // Создание исключений в диапазоне дат
        url = 'http://localhost:8003/employee-exceptions/range'
        method = 'POST'
        body = {
          employee_id: parseInt(formData.employee_id),
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          exception_type: formData.exception_type
        }
      } else {
        // Создание одиночного исключения
        url = 'http://localhost:8003/employee-exceptions'
        method = 'POST'
        body = {
          employee_id: parseInt(formData.employee_id),
          exception_date: formData.exception_date,
          reason: formData.reason,
          exception_type: formData.exception_type
        }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json()
        fetchExceptions()
        resetForm()
        
        if (isDateRange && !editingException) {
          alert(`Исключения созданы на ${result.total_days} дней (с ${result.start_date} по ${result.end_date})`)
        } else {
          alert(editingException ? 'Исключение обновлено!' : 'Исключение создано!')
        }
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.detail}`)
      }
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
      alert('Ошибка при сохранении исключения')
    }
  }

  const handleDelete = async (exceptionId: number) => {
    if (!confirm('Удалить это исключение?')) return

    try {
      const response = await fetch(`http://localhost:8003/employee-exceptions/${exceptionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchExceptions()
        alert('Исключение удалено!')
      } else {
        alert('Ошибка при удалении')
      }
    } catch (error) {
      console.error('Ошибка при удалении:', error)
      alert('Ошибка при удалении исключения')
    }
  }

  const startEdit = (exception: Exception) => {
    setEditingException(exception)
    setIsDateRange(false) // Редактирование только для одиночных дат
    setFormData({
      employee_id: exception.employee_id.toString(),
      exception_date: exception.exception_date,
      start_date: '',
      end_date: '',
      reason: exception.reason,
      exception_type: exception.exception_type
    })
    setShowAddForm(true)
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
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Исключения для сотрудников
        </h1>
        <p className="text-gray-600">
          Управление исключениями по датам (отсутствие проверки опозданий)
        </p>
      </div>

      {/* Кнопка добавления */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить исключение
        </button>
      </div>

      {/* Форма добавления/редактирования */}
      {showAddForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {editingException ? 'Редактировать исключение' : 'Новое исключение'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editingException && (
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isDateRange}
                    onChange={(e) => setIsDateRange(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Диапазон дат (несколько дней подряд)
                  </span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сотрудник
              </label>
              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
                disabled={!!editingException}
              >
                <option value="">Выберите сотрудника</option>
                {Array.isArray(employees) && employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Поля дат */}
            {isDateRange && !editingException ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Начальная дата
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Конечная дата
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                    min={formData.start_date} // Ограничиваем минимальную дату
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата исключения
                </label>
                <input
                  type="date"
                  value={formData.exception_date}
                  onChange={(e) => setFormData({...formData, exception_date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                  disabled={!!editingException}
                />
              </div>
            )}

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип исключения
              </label>
              <select
                value={formData.exception_type}
                onChange={(e) => setFormData({...formData, exception_type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="no_lateness_check">Не проверять опоздания</option>
              </select>
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

      {/* Список исключений */}
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
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Создано
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exceptions.map((exception) => (
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
                          {formatDate(exception.exception_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {exception.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Без проверки опозданий
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(exception.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(exception)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
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
