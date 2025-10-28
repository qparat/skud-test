'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Department {
  id: number;
  name: string;
  employee_count?: number;
}

interface Position {
  id: number;
  name: string;
  department_id?: number;
}

export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = parseInt(params.id as string);

  const [department, setDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для управления должностями
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [departmentPositions, setDepartmentPositions] = useState<Position[]>([]);
  const [positionSearch, setPositionSearch] = useState('');
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);

  useEffect(() => {
    if (departmentId) {
      fetchDepartment();
      fetchPositions();
      fetchDepartmentPositions();
    }
  }, [departmentId]);

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.position-dropdown')) {
        setShowPositionDropdown(false);
      }
    };

    if (showPositionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPositionDropdown]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/departments/${departmentId}`);
      setDepartment(data);
      setFormData({
        name: data.name,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке службы');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const data = await apiRequest('/positions');
      setAllPositions(data);
    } catch (err) {
      console.error('Ошибка загрузки должностей:', err);
    }
  };

  const fetchDepartmentPositions = async () => {
    try {
      const data = await apiRequest(`/departments/${departmentId}/positions`);
      setDepartmentPositions(data);
    } catch (err) {
      console.error('Ошибка загрузки должностей департамента:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSaving(true);
      await apiRequest(`/departments/${departmentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name.trim(),
        }),
      });

      router.push(`/departments/${departmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении службы');
    } finally {
      setSaving(false);
    }
  };

  // Функции для работы с должностями
  const getFilteredPositions = () => {
    if (!positionSearch.trim()) return allPositions;
    
    return allPositions.filter(position =>
      position.name.toLowerCase().includes(positionSearch.toLowerCase()) &&
      !departmentPositions.some(dp => dp.id === position.id)
    );
  };

  const addPositionToDepartment = async (position: Position) => {
    try {
      setLoadingPositions(true);
      await apiRequest(`/departments/${departmentId}/positions`, {
        method: 'POST',
        body: JSON.stringify({ position_id: position.id }),
      });
      
      // Обновляем списки
      setDepartmentPositions([...departmentPositions, position]);
      setPositionSearch('');
      setShowPositionDropdown(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении должности');
    } finally {
      setLoadingPositions(false);
    }
  };

  const removePositionFromDepartment = async (positionId: number) => {
    try {
      setLoadingPositions(true);
      await apiRequest(`/departments/${departmentId}/positions/${positionId}`, {
        method: 'DELETE',
      });
      
      // Обновляем список
      setDepartmentPositions(departmentPositions.filter(p => p.id !== positionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении должности');
    } finally {
      setLoadingPositions(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Служба не найдена</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/departments" className="text-blue-500 hover:underline">
            ← Службы
          </Link>
          <span className="text-gray-400">/</span>
          <Link href={`/departments/${departmentId}`} className="text-blue-500 hover:underline">
            {department.name}
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Редактирование службы</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название службы *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link
              href={`/departments/${departmentId}`}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md inline-block text-center"
            >
              Отмена
            </Link>
          </div>
        </form>
      </div>

      {/* Секция управления должностями */}
      <div className="bg-white border rounded-lg p-6 shadow-sm mt-6">
        <h2 className="text-xl font-semibold mb-4">Должности службы</h2>
        
        {/* Поиск и добавление должностей */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Добавить должность
          </label>
          <div className="relative position-dropdown">
            <input
              type="text"
              value={positionSearch}
              onChange={(e) => {
                setPositionSearch(e.target.value);
                setShowPositionDropdown(true);
              }}
              onFocus={() => setShowPositionDropdown(true)}
              placeholder="Поиск должности для добавления..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Выпадающий список должностей */}
            {showPositionDropdown && positionSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {getFilteredPositions().length > 0 ? (
                  getFilteredPositions().map((position) => (
                    <button
                      key={position.id}
                      type="button"
                      onClick={() => addPositionToDepartment(position)}
                      disabled={loadingPositions}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:opacity-50"
                    >
                      {position.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">
                    Должности не найдены
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Список текущих должностей */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Текущие должности ({departmentPositions.length})
          </h3>
          {departmentPositions.length > 0 ? (
            <div className="space-y-2">
              {departmentPositions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                >
                  <span className="font-medium">{position.name}</span>
                  <button
                    type="button"
                    onClick={() => removePositionFromDepartment(position.id)}
                    disabled={loadingPositions}
                    className="text-red-600 hover:text-red-800 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Должности не назначены
            </p>
          )}
        </div>
      </div>
    </div>
  );
}