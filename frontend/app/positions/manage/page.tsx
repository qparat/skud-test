'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Employee {
  employee_id: number;
  full_name: string;
  position: string;
  department_name?: string;
  position_id?: number;
}

interface Position {
  id: number;
  name: string;
}

export default function ManageEmployeePositionsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = employees.filter(employee =>
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.department_name && employee.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [employees, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.position-search-container')) {
        setShowPositionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const employeesData = await apiRequest('/employees');
      
      // Если данные приходят в формате с departments, извлекаем всех сотрудников
      let allEmployees: Employee[] = [];
      if (employeesData.departments) {
        // Обрабатываем формат {departments: {dept1: [employees], dept2: [employees]}}
        Object.entries(employeesData.departments).forEach(([deptName, deptEmployees]: [string, any]) => {
          if (Array.isArray(deptEmployees)) {
            // Проставляем department_name для каждого сотрудника
            allEmployees = allEmployees.concat(
              deptEmployees.map((emp: any) => ({ ...emp, department_name: deptName }))
            );
          }
        });
      } else if (Array.isArray(employeesData)) {
        // Обрабатываем простой массив сотрудников
        allEmployees = employeesData;
      }
      setEmployees(allEmployees);

      const positionsData = await apiRequest('/positions');
      setPositions(positionsData);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const updateEmployeePosition = async () => {
    if (!editingEmployee || !selectedPositionId) return;

    try {
      setUpdating(true);
      await apiRequest(`/employees/${editingEmployee}/position`, {
        method: 'PUT',
        body: JSON.stringify({
          position_id: selectedPositionId,
        }),
      });

      setEditingEmployee(null);
      setSelectedPositionId(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении должности');
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = (employee: Employee) => {
    setEditingEmployee(employee.employee_id);
    setSelectedPositionId(employee.position_id || null);
    setPositionSearch('');
    setShowPositionDropdown(false);
  };

  const cancelEditing = () => {
    setEditingEmployee(null);
    setSelectedPositionId(null);
    setPositionSearch('');
    setShowPositionDropdown(false);
  };

  const filteredPositions = positionSearch.trim()
    ? positions.filter(pos => pos.name.toLowerCase().includes(positionSearch.toLowerCase()))
    : positions;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/positions" className="text-blue-500 hover:underline">
              ← Должности
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Управление должностями сотрудников</h1>
          <p className="text-gray-600 mt-2">Назначайте и изменяйте должности сотрудников</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Сотрудники</h2>
            <span className="text-gray-500 text-sm">
              Всего: {employees.length}
            </span>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Поиск по имени, должности или службе..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ФИО</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Текущая должность</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Служба</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.employee_id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">{employee.employee_id}</td>
                  <td className="py-3 px-4 font-medium">{employee.full_name}</td>
                  <td className="py-3 px-4">
                    {editingEmployee === employee.employee_id ? (
                      <div className="position-search-container relative">
                        <input
                          type="text"
                          placeholder="Поиск по должности..."
                          value={positionSearch}
                          onChange={(e) => {
                            setPositionSearch(e.target.value);
                            setShowPositionDropdown(true);
                            setSelectedPositionId(null);
                          }}
                          onFocus={() => setShowPositionDropdown(true)}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                        {showPositionDropdown && filteredPositions.length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {filteredPositions.map((position) => (
                              <div
                                key={position.id}
                                onClick={() => {
                                  setSelectedPositionId(position.id);
                                  setPositionSearch(position.name);
                                  setShowPositionDropdown(false);
                                }}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                {position.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-blue-600">{employee.position}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{employee.department_name || 'Не назначена'}</td>
                  <td className="py-3 px-4 text-right">
                    {editingEmployee === employee.employee_id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={updateEmployeePosition}
                          disabled={!selectedPositionId || updating}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          {updating ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={updating}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(employee)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Изменить должность
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && employees.length > 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">По запросу "{searchTerm}" ничего не найдено</p>
            </div>
          )}

          {employees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Сотрудники не найдены</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
