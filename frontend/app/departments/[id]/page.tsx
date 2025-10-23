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
  employee_count?: number;
}

interface DepartmentPosition {
  department_id: number;
  position_id: number;
  position: Position;
}

interface Employee {
  employee_id: number;
  full_name: string;
  position: string;
  department?: string;
}

interface EmployeesResponse {
  department_name: string;
  employees: Employee[];
  total_count: number;
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = parseInt(params.id as string);

  const [department, setDepartment] = useState<Department | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentDetails();
      fetchAllPositions();
      fetchAllEmployees();
    }
  }, [departmentId]);

  useEffect(() => {
    // Фильтруем сотрудников по поисковому запросу
    if (employeeSearch.trim()) {
      const filtered = employees.filter(employee =>
        employee.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        employee.position.toLowerCase().includes(employeeSearch.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [employees, employeeSearch]);

  const fetchDepartmentDetails = async () => {
    try {
      setLoading(true);
      
      // Получаем данные о службе
      const deptData = await apiRequest(`/departments/${departmentId}`);
      setDepartment(deptData);

      // Получаем должности службы
      try {
        const posData = await apiRequest(`/department-positions/${departmentId}`);
        setPositions(posData.map((dp: DepartmentPosition) => dp.position));
      } catch (err) {
        console.log('Должности не найдены');
      }

      // Получаем сотрудников службы
      try {
        const empData: EmployeesResponse = await apiRequest(`/employees/by-department/${departmentId}`);
        setEmployees(empData.employees);
      } catch (err) {
        console.log('Сотрудники не найдены');
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPositions = async () => {
    try {
      const data = await apiRequest('/positions');
      setAllPositions(data);
    } catch (err) {
      console.error('Ошибка при загрузке всех должностей:', err);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const data = await apiRequest('/employees/unassigned');
      setAllEmployees(data);
    } catch (err) {
      console.error('Ошибка при загрузке всех сотрудников:', err);
    }
  };

  const addPositionToDepartment = async () => {
    if (!selectedPositionId) return;

    try {
      await apiRequest('/department-positions', {
        method: 'POST',
        body: JSON.stringify({
          department_id: departmentId,
          position_id: selectedPositionId,
        }),
      });

      setShowAddPosition(false);
      setSelectedPositionId(null);
      await fetchDepartmentDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении должности');
    }
  };

  const removePositionFromDepartment = async (positionId: number, positionName: string) => {
    if (!confirm(`Вы уверены, что хотите убрать должность "${positionName}" из службы?`)) {
      return;
    }

    try {
      await apiRequest(`/department-positions/${departmentId}/${positionId}`, {
        method: 'DELETE',
      });

      await fetchDepartmentDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении должности');
    }
  };

  const deleteDepartment = async () => {
    if (!department) return;
    
    if (!confirm(`Вы уверены, что хотите удалить службу "${department.name}"?`)) {
      return;
    }

    try {
      await apiRequest(`/departments/${departmentId}`, {
        method: 'DELETE',
      });

      router.push('/departments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении службы');
    }
  };

  const addEmployeeToDepartment = async () => {
    if (!selectedEmployeeId) return;

    try {
      await apiRequest(`/employees/${selectedEmployeeId}/department`, {
        method: 'PUT',
        body: JSON.stringify({
          department_id: departmentId,
        }),
      });

      setShowAddEmployee(false);
      setSelectedEmployeeId(null);
      await fetchDepartmentDetails();
      await fetchAllEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при назначении сотрудника');
    }
  };

  const removeEmployeeFromDepartment = async (employeeId: number, employeeName: string) => {
    if (!confirm(`Вы уверены, что хотите убрать сотрудника "${employeeName}" из службы?`)) {
      return;
    }

    try {
      await apiRequest(`/employees/${employeeId}/department`, {
        method: 'PUT',
        body: JSON.stringify({
          department_id: null,
        }),
      });

      await fetchDepartmentDetails();
      await fetchAllEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении сотрудника из службы');
    }
  };

  const availablePositions = allPositions.filter(
    pos => !positions.some(p => p.id === pos.id)
  );

  const availableEmployees = allEmployees.filter(
    emp => !employees.some(e => e.employee_id === emp.employee_id)
  );

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/departments" className="text-blue-500 hover:underline">
              ← Службы
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{department.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/departments/${departmentId}/edit`}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
          >
            Редактировать
          </Link>
          <button
            onClick={deleteDepartment}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Удалить службу
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Левый столбец - Должности */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Должности в службе</h2>
            <button
              onClick={() => setShowAddPosition(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Добавить должность
            </button>
          </div>

          {showAddPosition && (
            <div className="bg-gray-50 border rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium mb-3">Добавить должность</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <select
                    value={selectedPositionId || ''}
                    onChange={(e) => setSelectedPositionId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Выберите должность</option>
                    {availablePositions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addPositionToDepartment}
                  disabled={!selectedPositionId}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Добавить
                </button>
                <button
                  onClick={() => {
                    setShowAddPosition(false);
                    setSelectedPositionId(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {positions.length > 0 ? (
            <div className="space-y-3">
              {positions.map((position) => (
                <div key={position.id} className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{position.name}</h3>
                    <button
                      onClick={() => removePositionFromDepartment(position.id, position.name)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Убрать должность из службы"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Сотрудников: {position.employee_count || 0}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">В данной службе пока нет должностей</p>
              <button
                onClick={() => setShowAddPosition(true)}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              >
                Добавить первую должность
              </button>
            </div>
          )}
        </div>

        {/* Правый столбец - Сотрудники */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Сотрудники службы</h2>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">
                Всего: {employees.length}
              </span>
              <button
                onClick={() => setShowAddEmployee(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Добавить сотрудника
              </button>
            </div>
          </div>

          {showAddEmployee && (
            <div className="bg-gray-50 border rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium mb-3">Добавить сотрудника</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <select
                    value={selectedEmployeeId || ''}
                    onChange={(e) => setSelectedEmployeeId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Выберите сотрудника</option>
                    {availableEmployees.map((employee) => (
                      <option key={employee.employee_id} value={employee.employee_id}>
                        {employee.full_name} - {employee.position} {employee.department && `(${employee.department})`}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addEmployeeToDepartment}
                  disabled={!selectedEmployeeId}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Добавить
                </button>
                <button
                  onClick={() => {
                    setShowAddEmployee(false);
                    setSelectedEmployeeId(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {employees.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Поиск по имени или должности..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}

          {filteredEmployees.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <div key={employee.employee_id} className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{employee.full_name}</h3>
                      <p className="text-sm text-blue-600 mt-1">{employee.position}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">ID: {employee.employee_id}</span>
                      <button
                        onClick={() => removeEmployeeFromDepartment(employee.employee_id, employee.full_name)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="Убрать сотрудника из службы"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : employees.length > 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">По запросу "{employeeSearch}" ничего не найдено</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">В данной службе пока нет сотрудников</p>
              <button
                onClick={() => setShowAddEmployee(true)}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Добавить первого сотрудника
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}