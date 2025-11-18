'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Department {
  id: number;
  name: string;
  priority?: number | null;
  employee_count?: number;
}

interface EditingPriority {
  departmentId: number;
  value: string;
}

export default function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const filteredDepartments = departments.filter((department: Department) =>
    department.name.toLowerCase().includes(search.toLowerCase())
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '', priority: '' });
  const [creating, setCreating] = useState(false);
  const [editingPriority, setEditingPriority] = useState<EditingPriority | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/departments');
      setDepartments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.name.trim()) return;

    try {
      setCreating(true);
      const payload: any = {
        name: newDepartment.name.trim(),
      };
      
      if (newDepartment.priority && newDepartment.priority.trim() !== '') {
        payload.priority = parseInt(newDepartment.priority);
      }
      
      await apiRequest('/departments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setNewDepartment({ name: '', priority: '' });
      setShowCreateForm(false);
      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании службы');
    } finally {
      setCreating(false);
    }
  };

  const updatePriority = async (departmentId: number, priority: string) => {
    try {
      setUpdating(true);
      const department = departments.find(d => d.id === departmentId);
      if (!department) return;

      const payload: any = {
        name: department.name,
      };

      if (priority.trim() !== '') {
        payload.priority = parseInt(priority);
      }

      await apiRequest(`/departments/${departmentId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setEditingPriority(null);
      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении приоритета');
    } finally {
      setUpdating(false);
    }
  };

  const deleteDepartment = async (id: number, name: string) => {
    if (!confirm(`Вы уверены, что хотите удалить службу "${name}"?`)) {
      return;
    }

    try {
      await apiRequest(`/departments/${id}`, {
        method: 'DELETE',
      });

      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении службы');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center">Загрузка служб...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Управление службами</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Добавить службу
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию службы..."
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Создать новую службу</h2>
          <form onSubmit={createDepartment}>
            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название службы *
                </label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Приоритет (необязательно)
                </label>
                <input
                  type="number"
                  value={newDepartment.priority}
                  onChange={(e) => setNewDepartment({ ...newDepartment, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Чем меньше число, тем выше приоритет"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Службы с меньшим числом будут отображаться первыми в отчетах. Службы без приоритета будут идти после всех в алфавитном порядке.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {creating ? 'Создание...' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDepartment({ name: '', priority: '' });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div key={department.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-blue-600">
                  <Link 
                    href={`/departments/${department.id}`}
                    className="hover:underline"
                  >
                    {department.name}
                  </Link>
                </h3>
                
                {editingPriority?.departmentId === department.id ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={editingPriority.value}
                      onChange={(e) => setEditingPriority({ departmentId: department.id, value: e.target.value })}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="№"
                      min="1"
                      autoFocus
                      disabled={updating}
                    />
                    <button
                      onClick={() => updatePriority(department.id, editingPriority.value)}
                      disabled={updating}
                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingPriority(null)}
                      disabled={updating}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    {department.priority !== null && department.priority !== undefined ? (
                      <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                        Приоритет: {department.priority}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Без приоритета
                      </span>
                    )}
                    <button
                      onClick={() => setEditingPriority({ 
                        departmentId: department.id, 
                        value: department.priority?.toString() || '' 
                      })}
                      className="text-purple-600 hover:text-purple-800 text-xs underline"
                      title="Изменить приоритет"
                    >
                      изменить
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteDepartment(department.id, department.name)}
                className="text-red-500 hover:text-red-700 text-sm"
                title="Удалить службу"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Link
                href={`/departments/${department.id}`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Просмотр
              </Link>
              <Link
                href={`/departments/${department.id}/edit`}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
              >
                Редактировать
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Службы не найдены</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            Создать первую службу
          </button>
        </div>
      )}
    </div>
  );
}
