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

export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = parseInt(params.id as string);

  const [department, setDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (departmentId) {
      fetchDepartment();
    }
  }, [departmentId]);

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
    </div>
  );
}