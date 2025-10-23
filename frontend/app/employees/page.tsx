'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Calendar, Search, Building2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface Employee {
  employee_id: number
  full_name: string
  position: string
}

interface DepartmentsData {
  departments: Record<string, Employee[]>
  total_employees: number
}

export default function EmployeesPage() {
  const router = useRouter()
  const [departmentsData, setDepartmentsData] = useState<DepartmentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const data = await apiRequest('/employees')
        setDepartmentsData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных сотрудников')
        console.error('Ошибка загрузки данных сотрудников:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/employees/${employeeId}`)
  }

  const handleScheduleClick = () => {
    router.push('/schedule')
  }

  // Фильтрация сотрудников по введенному запросу
  const getFilteredDepartments = () => {
    if (!departmentsData || !searchTerm) return departmentsData?.departments || {}
    
    const filtered: Record<string, Employee[]> = {}
    
    Object.entries(departmentsData.departments).forEach(([departmentName, employees]) => {
      const filteredEmployees = employees.filter(emp => 
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
      
      if (filteredEmployees.length > 0) {
        filtered[departmentName] = filteredEmployees
      }
    })
    
    return filtered
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
  const totalFiltered = Object.values(filteredDepartments).reduce((sum, employees) => sum + employees.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-7 w-7" />
              Список сотрудников
          </h1>
          <p className="mt-1 text-sm text-gray-600">
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
          placeholder="Поиск по ФИО или должности..."
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
          Object.entries(filteredDepartments).map(([departmentName, employees]) => (
            <div key={departmentName} className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {departmentName}
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    {employees.length}
                  </span>
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {employees.map((employee) => (
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
                            {employee.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {employee.position}
                          </p>
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
          ))
        )}
      </div>
    </div>
  )
}

