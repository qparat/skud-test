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
  id?: number; // Добавляем поле id для совместимости с разными эндпоинтами
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
  const [showAssignPositionForEmployeeId, setShowAssignPositionForEmployeeId] = useState<number | null>(null);
  const [assignPositionSearch, setAssignPositionSearch] = useState('');
  const [assignSelectedPositionId, setAssignSelectedPositionId] = useState<number | null>(null);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Назначить должность сотруднику
  const assignPositionToEmployee = async (employeeId: number) => {
    if (!assignSelectedPositionId) return;
    try {
      await apiRequest(`/employees/${employeeId}/position`, {
        method: 'PUT',
        body: JSON.stringify({ position_id: assignSelectedPositionId }),
      });
      setShowAssignPositionForEmployeeId(null);
      setAssignSelectedPositionId(null);
      setAssignPositionSearch('');
      setShowAssignDropdown(false);
      await fetchDepartmentDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при назначении должности');
    }
  };

  // Фильтрация доступных должностей для назначения
  const getAvailablePositionsForAssign = () => {
    if (!assignPositionSearch.trim()) {
      return allPositions;
    }
    return allPositions.filter((position: Position) =>
      position.name.toLowerCase().includes(assignPositionSearch.toLowerCase())
    );
  };
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
  const [positionSearch, setPositionSearch] = useState('');
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeDropdownSearch, setEmployeeDropdownSearch] = useState('');

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
      const filtered = employees.filter((employee: Employee) =>
        employee.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        employee.position.toLowerCase().includes(employeeSearch.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [employees, employeeSearch]);

  useEffect(() => {
    // Закрытие выпадающего списка при клике вне компонента
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.position-search-container')) {
        setShowPositionDropdown(false);
      }
      if (!target.closest('.employee-search-container')) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      setPositionSearch('');
      setShowPositionDropdown(false);
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
    (pos: Position) => !positions.some((p: Position) => p.id === pos.id)
  );

  const getFilteredPositions = () => {
    if (!positionSearch.trim()) {
      return availablePositions;
    }
    return availablePositions.filter((position: Position) =>
      position.name.toLowerCase().includes(positionSearch.toLowerCase())
    );
  };

  const handlePositionSelect = (position: Position) => {
    setSelectedPositionId(position.id);
    setPositionSearch(position.name);
    setShowPositionDropdown(false);
  };

  const getFilteredEmployees = () => {
    if (!employeeDropdownSearch.trim()) {
      return availableEmployees;
    }
    return availableEmployees.filter((employee: Employee) =>
      employee.full_name.toLowerCase().includes(employeeDropdownSearch.toLowerCase()) ||
      employee.position.toLowerCase().includes(employeeDropdownSearch.toLowerCase()) ||
      (employee.department && employee.department.toLowerCase().includes(employeeDropdownSearch.toLowerCase()))
    );
  };

  const handleEmployeeSelect = (employee: Employee) => {
    const empId = employee.id || employee.employee_id;
    setSelectedEmployeeId(empId);
    setEmployeeDropdownSearch(employee.full_name);
    setShowEmployeeDropdown(false);
  };

  const availableEmployees = allEmployees.filter(
    (emp: Employee) => {
      const empId = emp.id || emp.employee_id;
      return !employees.some((e: Employee) => e.employee_id === empId);
    }
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
                <div className="flex-1 relative position-search-container">
                  <input
                    type="text"
                    value={positionSearch}
                    onChange={(e) => {
                      setPositionSearch(e.target.value);
                      setShowPositionDropdown(true);
                      setSelectedPositionId(null);
                    }}
                    onFocus={() => setShowPositionDropdown(true)}
                    placeholder="Поиск должности..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {showPositionDropdown && getFilteredPositions().length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                      {getFilteredPositions().map((position) => (
                        <div
                          key={position.id}
                          onClick={() => handlePositionSelect(position)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          {position.name}
                        </div>
                      ))}
                    </div>
                  )}
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
                    setPositionSearch('');
                    setShowPositionDropdown(false);
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
                <div className="flex-1 employee-search-container relative">
                  <input
                    type="text"
                    placeholder="Поиск сотрудника..."
                    value={employeeDropdownSearch}
                    onChange={(e) => {
                      setEmployeeDropdownSearch(e.target.value);
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  {showEmployeeDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {getFilteredEmployees().length > 0 ? (
                        getFilteredEmployees().map((employee) => {
                          const empId = employee.id || employee.employee_id;
                          return (
                            <div
                              key={empId}
                              onClick={() => handleEmployeeSelect(employee)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">{employee.full_name}</div>
                              <div className="text-sm text-gray-600">
                                {employee.position} {employee.department && `• ${employee.department}`}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-center">
                          Сотрудники не найдены
                        </div>
                      )}
                    </div>
                  )}
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
                    setEmployeeDropdownSearch('');
                    setShowEmployeeDropdown(false);
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
            <div className="space-y-3 overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <div key={employee.employee_id} className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{employee.full_name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-blue-600 mt-1">{employee.position}</p>
                        {employee.position === 'Не указана должность' && (
                          <>
                            <button
                              className="ml-2 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                              onClick={() => {
                                setShowAssignPositionForEmployeeId(employee.employee_id);
                                setAssignPositionSearch('');
                                setAssignSelectedPositionId(null);
                                setShowAssignDropdown(true);
                              }}
                            >
                              Назначить должность
                            </button>
                          </>
                        )}
                      </div>
                      {showAssignPositionForEmployeeId === employee.employee_id && (
                        <div className="mt-2 position-search-container relative">
                          <input
                            type="text"
                            value={assignPositionSearch}
                            onChange={(e) => {
                              setAssignPositionSearch(e.target.value);
                              setShowAssignDropdown(true);
                              setAssignSelectedPositionId(null);
                            }}
                            onFocus={() => setShowAssignDropdown(true)}
                            placeholder="Поиск должности..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                          {showAssignDropdown && getAvailablePositionsForAssign().length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                              {getAvailablePositionsForAssign().map((position) => (
                                <div
                                  key={position.id}
                                  onClick={() => {
                                    setAssignSelectedPositionId(position.id);
                                    setAssignPositionSearch(position.name);
                                    setShowAssignDropdown(false);
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  {position.name}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => assignPositionToEmployee(employee.employee_id)}
                              disabled={!assignSelectedPositionId}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                            >
                              Назначить
                            </button>
                            <button
                              onClick={() => {
                                setShowAssignPositionForEmployeeId(null);
                                setAssignSelectedPositionId(null);
                                setAssignPositionSearch('');
                                setShowAssignDropdown(false);
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      )}
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