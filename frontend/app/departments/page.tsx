'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Department {
  id: number;
  name: string;
  employee_count?: number;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '' });
  const [creating, setCreating] = useState(false);

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
      setError(err instanceof Error ? err.message : 'РќРµРёР·РІРµСЃС‚РЅР°СЏ РѕС€РёР±РєР°');
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.name.trim()) return;

    try {
      setCreating(true);
      await apiRequest('/departments', {
        method: 'POST',
        body: JSON.stringify({
          name: newDepartment.name.trim(),
        }),
      });

      setNewDepartment({ name: '' });
      setShowCreateForm(false);
      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'РћС€РёР±РєР° РїСЂРё СЃРѕР·РґР°РЅРёРё СЃР»СѓР¶Р±С‹');
    } finally {
      setCreating(false);
    }
  };

  const deleteDepartment = async (id: number, name: string) => {
    if (!confirm(`Р’С‹ СѓРІРµСЂРµРЅС‹, С‡С‚Рѕ С…РѕС‚РёС‚Рµ СѓРґР°Р»РёС‚СЊ СЃР»СѓР¶Р±Сѓ "${name}"?`)) {
      return;
    }

    try {
      await apiRequest(`/departments/${id}`, {
        method: 'DELETE',
      });

      await fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'РћС€РёР±РєР° РїСЂРё СѓРґР°Р»РµРЅРёРё СЃР»СѓР¶Р±С‹');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Р—Р°РіСЂСѓР·РєР° СЃР»СѓР¶Р±...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">РЈРїСЂР°РІР»РµРЅРёРµ СЃР»СѓР¶Р±Р°РјРё</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Р”РѕР±Р°РІРёС‚СЊ СЃР»СѓР¶Р±Сѓ
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">РЎРѕР·РґР°С‚СЊ РЅРѕРІСѓСЋ СЃР»СѓР¶Р±Сѓ</h2>
          <form onSubmit={createDepartment}>
            <div className="mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  РќР°Р·РІР°РЅРёРµ СЃР»СѓР¶Р±С‹ *
                </label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
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
                  setNewDepartment({ name: '' });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                РћС‚РјРµРЅР°
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department) => (
          <div key={department.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-semibold text-blue-600">
                <Link 
                  href={`/departments/${department.id}`}
                  className="hover:underline"
                >
                  {department.name}
                </Link>
              </h3>
              <button
                onClick={() => deleteDepartment(department.id, department.name)}
                className="text-red-500 hover:text-red-700 text-sm"
                title="РЈРґР°Р»РёС‚СЊ СЃР»СѓР¶Р±Сѓ"
              >
                вњ•
              </button>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/departments/${department.id}`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                РџСЂРѕСЃРјРѕС‚СЂ
              </Link>
              <Link
                href={`/departments/${department.id}/edit`}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
              >
                Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ
              </Link>
            </div>
          </div>
        ))}
      </div>

      {departments.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">РЎР»СѓР¶Р±С‹ РЅРµ РЅР°Р№РґРµРЅС‹</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            РЎРѕР·РґР°С‚СЊ РїРµСЂРІСѓСЋ СЃР»СѓР¶Р±Сѓ
          </button>
        </div>
      )}
    </div>
  );
}

