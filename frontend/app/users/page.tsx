'use client'

import { useState, useEffect } from 'react'
import { User as UserIcon, UserPlus, Edit3, Trash2, Shield, Mail, Calendar } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/components/AuthProvider'

interface UserData {
  id: number
  username: string
  email: string
  full_name: string
  role: number
  role_name: string
  is_active: boolean
  created_at: string
}

interface CreateUserForm {
  username: string
  password: string
  email: string
  full_name: string
  role: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    password: '',
    email: '',
    full_name: '',
    role: 3
  })
  
  const { user: currentUser, hasRole } = useAuth()

  // Проверяем права доступа
  if (!hasRole(2)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступ запрещен</h2>
          <p className="text-gray-600">У вас недостаточно прав для просмотра этой страницы</p>
        </div>
      </div>
    )
  }

  // Роли для выбора
  const roleOptions = [
    { value: 0, label: 'Root', description: 'Максимальные права' },
    { value: 2, label: 'Супер-администратор', description: 'Управление системой' },
    { value: 3, label: 'Пользователь', description: 'Базовые права просмотра' }
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/users')
      setUsers(response.users || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки пользователей')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await apiRequest('/users/create', {
        method: 'POST',
        body: JSON.stringify(createForm)
      })
      
      setCreateForm({
        username: '',
        password: '',
        email: '',
        full_name: '',
        role: 3
      })
      setShowCreateForm(false)
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Ошибка создания пользователя')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (userId: number, updates: Partial<UserData>) => {
    try {
      setLoading(true)
      await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
      
      setEditingUser(null)
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления пользователя')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return
    }
    
    try {
      setLoading(true)
      await apiRequest(`/users/${userId}`, {
        method: 'DELETE'
      })
      
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления пользователя')
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: number) => {
    switch (role) {
      case 0: return 'bg-red-100 text-red-800'
      case 2: return 'bg-blue-100 text-blue-800'
      case 3: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canEditRole = (targetRole: number) => {
    if (!currentUser) return false
    // Root может редактировать всех
    if (currentUser.role === 0) return true
    // Superadmin не может создавать/редактировать root
    if (currentUser.role === 2 && targetRole === 0) return false
    return currentUser.role <= 2
  }

  const canDeleteUser = () => {
    return currentUser?.role === 0 // Только root может удалять
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Загрузка пользователей...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-gray-600 mt-2">Создание и управление пользователями системы</p>
        </div>
        
        {hasRole(2) && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Создать пользователя
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-800 mt-2 text-sm"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Форма создания пользователя */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Создать нового пользователя</h2>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя пользователя
              </label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Полное имя
              </label>
              <input
                type="text"
                required
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Роль
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roleOptions.map(option => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={!canEditRole(option.value)}
                  >
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Создание...' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список пользователей */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Список пользователей ({users.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Создан
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser?.id === user.id ? (
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: parseInt(e.target.value) })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        {roleOptions.map(option => (
                          <option 
                            key={option.value} 
                            value={option.value}
                            disabled={!canEditRole(option.value)}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {user.role_name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Активен' : 'Заблокирован'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {editingUser?.id === user.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateUser(user.id, {
                              role: editingUser.role,
                              is_active: editingUser.is_active
                            })}
                            className="text-green-600 hover:text-green-800"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          {canEditRole(user.role) && (
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteUser() && user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}