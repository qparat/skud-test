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
      setError(err instanceof Error ? err.message : 'РќРµРёР·РІРµСЃС‚РЅР°СЏ РѕС€РёР±РєР°');
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
      setError(err instanceof Error ? err.message : 'РћС€РёР±РєР° РїСЂРё СЃРѕР·РґР°РЅРёРё РґРѕР»Р¶РЅРѕСЃС‚Рё');
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
      setError(err instanceof Error ? err.message : 'РћС€РёР±РєР° РїСЂРё РѕР±РЅРѕРІР»РµРЅРёРё РґРѕР»Р¶РЅРѕСЃС‚Рё');
    }
  };

  const deletePosition = async (id: number, name: string) => {
    if (!confirm(`Р’С‹ СѓРІРµСЂРµРЅС‹, С‡С‚Рѕ С…РѕС‚РёС‚Рµ СѓРґР°Р»РёС‚СЊ РґРѕР»Р¶РЅРѕСЃС‚СЊ "${name}"?`)) {
      return;
    }

    try {
      await apiRequest(`/positions/${id}`, {
        method: 'DELETE',
      });

      await fetchPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'РћС€РёР±РєР° РїСЂРё СѓРґР°Р»РµРЅРёРё РґРѕР»Р¶РЅРѕСЃС‚Рё');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Р—Р°РіСЂСѓР·РєР° РґРѕР»Р¶РЅРѕСЃС‚РµР№...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">РЈРїСЂР°РІР»РµРЅРёРµ РґРѕР»Р¶РЅРѕСЃС‚СЏРјРё</h1>
        <div className="flex gap-2">
          <Link
            href="/positions/manage"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
          >
            РќР°Р·РЅР°С‡РёС‚СЊ РґРѕР»Р¶РЅРѕСЃС‚Рё
          </Link>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Р”РѕР±Р°РІРёС‚СЊ РґРѕР»Р¶РЅРѕСЃС‚СЊ
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">РЎРѕР·РґР°С‚СЊ РЅРѕРІСѓСЋ РґРѕР»Р¶РЅРѕСЃС‚СЊ</h2>
          <form onSubmit={createPosition}>
            <div className="mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  РќР°Р·РІР°РЅРёРµ РґРѕР»Р¶РЅРѕСЃС‚Рё *
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
                {creating ? 'РЎРѕР·РґР°РЅРёРµ...' : 'РЎРѕР·РґР°С‚СЊ'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPosition({ name: '' });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                РћС‚РјРµРЅР°
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
                  <th className="text-left py-3 px-4">РќР°Р·РІР°РЅРёРµ</th>
                  <th className="text-left py-3 px-4">РљРѕР»РёС‡РµСЃС‚РІРѕ СЃРѕС‚СЂСѓРґРЅРёРєРѕРІ</th>
                  <th className="text-right py-3 px-4">Р”РµР№СЃС‚РІРёСЏ</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => (
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
                              РЎРѕС…СЂР°РЅРёС‚СЊ
                            </button>
                            <button
                              onClick={() => setEditingPosition(null)}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              РћС‚РјРµРЅР°
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
                              РР·РјРµРЅРёС‚СЊ
                            </button>
                            <button
                              onClick={() => deletePosition(position.id, position.name)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              РЈРґР°Р»РёС‚СЊ
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {positions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Р”РѕР»Р¶РЅРѕСЃС‚Рё РЅРµ РЅР°Р№РґРµРЅС‹</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                >
                  РЎРѕР·РґР°С‚СЊ РїРµСЂРІСѓСЋ РґРѕР»Р¶РЅРѕСЃС‚СЊ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

