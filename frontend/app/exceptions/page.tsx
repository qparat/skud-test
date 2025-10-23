'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Calendar, User, AlertCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api'

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

  const fetchExceptions = async () => {
    try {
      const data = await apiRequest('/exceptions')
      setExceptions(data)
    } catch (error) {
      console.error('Ошибка при загрузке исключений:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const data = await apiRequest('/employees')
      setEmployees(data.employees || data)
    } catch (error) {
      console.error('Ошибка при загрузке сотрудников:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingException) {
        await apiRequest(`/exceptions/${editingException.id}`, {
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

        await apiRequest('/exceptions', {
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
      await apiRequest(`/exceptions/${id}`, {
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
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

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
              />
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
