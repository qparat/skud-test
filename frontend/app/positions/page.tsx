'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Position {
  id: number;
  name: string;
  employee_count?: number;
}

export default function PositionsPage() {
  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPosition, setNewPosition] = useState({ name: '' });
  const [creating, setCreating] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/positions');
      setPositions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const createPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosition.name.trim()) return;

    try {
      setCreating(true);
      await apiRequest('/positions', {
        method: 'POST',
        body: JSON.stringify({
          name: newPosition.name.trim(),
        }),
      });

      setNewPosition({ name: '' });
      setShowCreateForm(false);
      await fetchPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании должности');
    } finally {
      setCreating(false);
    }
  };

  const updatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition || !editingPosition.name.trim()) return;

    try {
      await apiRequest(`/positions/${editingPosition.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingPosition.name.trim(),
        }),
      });

      setEditingPosition(null);
      await fetchPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении должности');
    }
  };

  const deletePosition = async (id: number, name: string) => {
    if (!confirm(`Вы уверены, что хотите удалить должность "${name}"?`)) {
      return;
    }

    try {
      await apiRequest(`/positions/${id}`, {
        method: 'DELETE',
      });

      await fetchPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении должности');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center">Загрузка должностей...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Управление должностями</h1>
        <div className="flex gap-2">
          <Link
            href="/positions/manage"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          >
                 Назначить должности
          </Link>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Добавить должность
          </button>
        </div>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск по названию должности..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
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
          <h2 className="text-xl font-semibold mb-4">Создать новую должность</h2>
          <form onSubmit={createPosition}>
            <div className="mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                   Название должности*
                </label>
                <input
                  type="text"
                  value={newPosition.name}
                  onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
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
                  setNewPosition({ name: '' });
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
                  <th className="text-left py-3 px-4">Название</th>
                  <th className="text-left py-3 px-4">Количество сотрудников</th>
                  <th className="text-right py-3 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = positions.filter(pos => pos.name.toLowerCase().includes(searchTerm.toLowerCase()));
                  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                  const startIdx = (currentPage - 1) * PAGE_SIZE;
                  const pagePositions = filtered.slice(startIdx, startIdx + PAGE_SIZE);
                  return pagePositions.map((position) => (
                    <tr key={position.id} className="border-b hover:bg-gray-50">
                      {editingPosition?.id === position.id ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editingPosition.name}
                              onChange={(e) => setEditingPosition({ ...editingPosition, name: e.target.value })}
                              className="w-full border border-gray-300 rounded px-2 py-1"
                            />
                          </td>
                          <td className="py-3 px-4 text-gray-600">{position.employee_count || 0}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={updatePosition}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                              >
                                Сохранить
                              </button>
                              <button
                                onClick={() => setEditingPosition(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                              >
                                 Отмена
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-medium">{position.name}</td>
                          <td className="py-3 px-4 text-gray-600">{position.employee_count || 0}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingPosition(position)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                              >
                                 Изменить
                              </button>
                              <button
                                onClick={() => deletePosition(position.id, position.name)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                              >
                                  Удалить
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
            {/* Pagination controls */}
            {(() => {
              const filtered = positions.filter(pos => pos.name.toLowerCase().includes(searchTerm.toLowerCase()));
              const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
              if (totalPages > 1) {
                return (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    >
                      Назад
                    </button>
                    <span className="text-sm text-gray-600">Страница {currentPage} из {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    >
                      Вперед
                    </button>
                  </div>
                )
              }
              return null;
            })()}

            {positions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Должности не найдены</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                >
                Создать первую должность
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

