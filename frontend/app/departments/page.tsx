'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GripVertical } from 'lucide-react';
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      
      // Проверяем, есть ли уже служба с таким приоритетом
      if (newDepartment.priority && newDepartment.priority.trim() !== '') {
        const priorityNum = parseInt(newDepartment.priority);
        const existingDept = departments.find(d => d.priority === priorityNum);
        
        if (existingDept) {
          setError(`Приоритет ${priorityNum} уже занят службой "${existingDept.name}"`);
          setCreating(false);
          return;
        }
      }
      
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
      setError(null);
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

      // Проверяем, есть ли уже служба с таким приоритетом
      if (priority.trim() !== '') {
        const priorityNum = parseInt(priority);
        const existingDept = departments.find(d => 
          d.id !== departmentId && d.priority === priorityNum
        );
        
        if (existingDept) {
          setError(`Приоритет ${priorityNum} уже занят службой "${existingDept.name}"`);
          setUpdating(false);
          return;
        }
      }

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
      setError(null);
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

  // Функции для drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newDepartments = [...filteredDepartments];
    const draggedDept = newDepartments[draggedIndex];
    
    newDepartments.splice(draggedIndex, 1);
    newDepartments.splice(dropIndex, 0, draggedDept);
    
    // Обновляем приоритеты на основе нового порядка
    const updatedDepartments = newDepartments.map((dept, index) => ({
      ...dept,
      priority: index + 1
    }));
    
    // Обновляем состояние локально
    setDepartments(updatedDepartments);
    
    // Сохраняем приоритеты на сервере
    try {
      for (const dept of updatedDepartments) {
        await apiRequest(`/departments/${dept.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: dept.name,
            priority: dept.priority
          })
        });
      }
      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения порядка служб');
      await fetchDepartments();
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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

      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-center py-3 px-2 w-8"></th>
                  <th className="text-left py-3 px-4 w-32">Приоритет</th>
                  <th className="text-left py-3 px-4">Название службы</th>
                  <th className="text-right py-3 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((department: Department, idx: number) => (
                  <tr 
                    key={department.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`border-b hover:bg-gray-50 cursor-move transition-all duration-200 ${
                      draggedIndex === idx ? 'opacity-40 scale-95 bg-gray-100' : ''
                    } ${
                      dragOverIndex === idx && draggedIndex !== idx ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <td className="py-3 px-2 text-center">
                      <GripVertical className={`h-4 w-4 mx-auto transition-colors duration-200 ${
                        draggedIndex === idx ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                    </td>
                    <td className="py-3 px-4">
                      {editingPriority?.departmentId === department.id ? (
                        <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-2">
                          {department.priority !== null && department.priority !== undefined ? (
                            <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                              {department.priority}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              —
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
                    </td>
                    <td className="py-3 px-4">
                      <Link 
                        href={`/departments/${department.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {department.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
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
                        <button
                          onClick={() => deleteDepartment(department.id, department.name)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          title="Удалить службу"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
