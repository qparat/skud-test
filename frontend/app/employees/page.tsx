'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Calendar, Search, Building2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface Employee {
  employee_id: number
  full_name: string
  full_name_expanded?: string | null
  position: string
  birth_date?: string
  department?: string
  department_id?: number
}

interface DepartmentsData {
  departments: Record<string, Employee[]>
  total_employees: number
}

interface Department {
  id: number
  name: string
}

export default function EmployeesPage() {
  const router = useRouter()
  const [departmentsData, setDepartmentsData] = useState<DepartmentsData | null>(null)
  const [departmentsList, setDepartmentsList] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Загружаем сотрудников и департаменты параллельно
        const [employeesData, departmentsData] = await Promise.all([
          apiRequest('/employees'),
          apiRequest('/departments')
        ])
        
        setDepartmentsData(employeesData)
        setDepartmentsList(Array.isArray(departmentsData) ? departmentsData : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных сотрудников')
        console.error('Ошибка загрузки данных сотрудников:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/employees/${employeeId}`)
  }

  const handleDepartmentClick = (departmentId: number) => {
    router.push(`/departments/${departmentId}`)
  }

  const handleScheduleClick = () => {
    router.push('/schedule')
  }

  // Функция для получения ID департамента по названию
  const getDepartmentId = (departmentName: string): number | null => {
    const dept = departmentsList.find(d => d.name === departmentName)
    return dept ? dept.id : null
  }

  // Фильтрация сотрудников по введенному запросу
  const getFilteredDepartments = () => {
    if (!departmentsData || !searchTerm.trim()) return departmentsData?.departments || {}
    const filtered: Record<string, Employee[]> = {}
    Object.entries(departmentsData.departments).forEach(([departmentName, employees]) => {
      const empList = employees as Employee[];
      const term = searchTerm.toLowerCase();
      // Фильтруем по ФИО, должности или названию службы
      if (departmentName.toLowerCase().includes(term)) {
        filtered[departmentName] = empList;
      } else {
        const filteredEmployees = empList.filter((emp: Employee) =>
          (emp.full_name_expanded || emp.full_name).toLowerCase().includes(term) ||
          emp.position.toLowerCase().includes(term) ||
          (emp.department && emp.department.toLowerCase().includes(term))
        );
        if (filteredEmployees.length > 0) {
          filtered[departmentName] = filteredEmployees;
        }
      }
    });
    return filtered;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Загрузка списка сотрудников...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка загрузки</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
       Попробовать снова
        </button>
      </div>
    )
  }

  const filteredDepartments = getFilteredDepartments()
  const totalFiltered = Object.values(filteredDepartments).reduce((sum: number, employees: unknown) => sum + ((employees as Employee[]).length), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Список сотрудников
          </h1>
          <p className="text-gray-600">
            Всего сотрудников: {departmentsData?.total_employees || 0}
            {searchTerm && totalFiltered !== departmentsData?.total_employees && 
              ` (найдено: ${totalFiltered})`
            }
          </p>
        </div>
        
        <button
          onClick={handleScheduleClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Расписание на сегодня
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Поиск по ФИО, должности или названию службы..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Departments and Employees */}
      <div className="space-y-6">
        {Object.entries(filteredDepartments).length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Сотрудники не найдены' : 'Нет сотрудников'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Попробуйте изменить запрос поиска' : 'Список сотрудников пуст'}
            </p>
          </div>
        ) : (
          Object.entries(filteredDepartments).map(([departmentName, employees]) => {
            // Получаем department_id по названию департамента
            const employeeList = employees as Employee[];
            const departmentId = getDepartmentId(departmentName);
            
            return (
              <div key={departmentName} className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {departmentId ? (
                      <button
                        onClick={() => handleDepartmentClick(departmentId)}
                        className="hover:text-blue-600 transition-colors hover:underline"
                      >
                        {departmentName}
                      </button>
                    ) : (
                      <span>{departmentName}</span>
                    )}
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                      {employeeList.length}
                    </span>
                  </h3>
                </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {employeeList.map((employee) => (
                    <button
                      key={employee.employee_id}
                      onClick={() => handleEmployeeClick(employee.employee_id)}
                      className="text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 group-hover:bg-blue-200 p-2 rounded-full">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {employee.full_name_expanded || employee.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {employee.position}
                          </p>
                          {employee.birth_date && (
                            <p className="text-xs text-blue-600 truncate">
                              Дата рождения: {employee.birth_date}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            ID: {employee.employee_id}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  )
}

