'use client'

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Plus, Edit3, Trash2, Calendar, User, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { apiRequest } from '@/lib/api';

// Функция для правильного получения даты в формате YYYY-MM-DD без проблем с временной зоной
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


interface Employee {
  id: number;
  full_name: string;
}

interface Exception {
  id: number;
  employee_id: number;
  full_name: string; // добавлено для совместимости с backend
  exception_date: string;
  reason: string;
  exception_type: string;
  created_at?: string;
}

interface ExceptionFormData {
  employee_id: string;
  exception_date: string;
  start_date: string;
  end_date: string;
  reason: string;
  exception_type: string;
}

export default function ExceptionsPage() {
  // ...existing code...

  // Пагинация
  const PAGE_SIZE = 50;
  const [page, setPage] = useState<number>(1);
  const totalPages = Math.ceil(filteredExceptions.length / PAGE_SIZE);
  const paginatedExceptions = filteredExceptions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // Для визуального выделения последней выбранной даты
  const [lastLoadedDate, setLastLoadedDate] = useState<string>('');
  // Фильтры для поиска
  const [searchName, setSearchName] = useState<string>('');
  const [searchReason, setSearchReason] = useState<string>('');
  const [searchDate, setSearchDate] = useState<string>('');
  const [showDateCalendar, setShowDateCalendar] = useState<boolean>(false);
  const [dateCalendarMonth, setDateCalendarMonth] = useState<Date>(new Date());
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingException, setEditingException] = useState<Exception | null>(null);
  const [isDateRange, setIsDateRange] = useState<boolean>(false);
  
  // Состояния для поиска сотрудника
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  
  // Состояния для календаря
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Получаем сегодняшнюю дату для ограничения выбора
  const today = formatDate(new Date());

  const [formData, setFormData] = useState<ExceptionFormData>({
    employee_id: '',
    exception_date: '',
    start_date: '',
    end_date: '',
    reason: '',
    exception_type: 'no_lateness_check'
  });

    if (hasSelectedDate && !hasRange) {
      if (dateStr === selectedDate) {
        // Второй клик по той же дате — выбираем один день
  setFormData((prev: typeof formData) => ({ ...prev, exception_date: dateStr, start_date: '', end_date: '' }));
        setIsDateRange(false);
        setShowCalendar(false);
        setSelectedDate('');
        setStartDate('');
        setEndDate('');
        // TypeScript interfaces must be at the top of the file
        interface Employee {
          id: number;
          full_name: string;
        }

        interface Exception {
          id: number;
          employee_id: number;
          full_name: string; // добавлено для совместимости с backend
          exception_date: string;
          reason: string;
          exception_type: string;
          created_at?: string;
        }

        interface ExceptionFormData {
          employee_id: string;
          exception_date: string;
          start_date: string;
          end_date: string;
          reason: string;
          exception_type: string;
        }

        'use client'

        import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
        import { Plus, Edit3, Trash2, Calendar, User, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
        import { apiRequest } from '@/lib/api';

        // Функция для правильного получения даты в формате YYYY-MM-DD без проблем с временной зоной
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        export default function ExceptionsPage() {
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - 7);
    const startStr = formatDate(weekStart);
    const endStr = formatDate(todayDate);
    setStartDate(startStr);
    setEndDate(endStr);
    setSelectedDate('');
    setShowCalendar(false);
    setLastLoadedDate(endStr);
  };

  const selectMonthPeriod = () => {
    const todayDate = new Date();
    const monthStart = new Date(todayDate);
    monthStart.setDate(todayDate.getDate() - 30);
    const startStr = formatDate(monthStart);
    const endStr = formatDate(todayDate);
    setStartDate(startStr);
    setEndDate(endStr);
    setSelectedDate('');
    setShowCalendar(false);
    setLastLoadedDate(endStr);
  };

  const selectWeekPeriod = () => {
    const todayDate = new Date();
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - 7);
    const startStr = formatDate(weekStart);
    const endStr = formatDate(todayDate);
    setStartDate(startStr);
    setEndDate(endStr);
    setSelectedDate('');
    setShowCalendar(false);
    setLastLoadedDate(endStr);
  };

  // Remove duplicate selectMonthPeriod and selectQuarterPeriod declarations
      // ...existing code...
      // Restore correct JSX structure
      return (
        <div className="">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Исключения для сотрудников
            </h1>
            <p className="text-gray-600">
              Управление исключениями по датам (отсутствие проверки опозданий)
            </p>
          </div>
          {/* ...rest of the JSX code for filters, add form, table, and pagination... */}
        </div>
      );
    }
            Активные исключения ({exceptions.length})
          </h2>
        </div>

        {/* Фильтрация исключений */}
        {filteredExceptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Исключений пока нет</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Причина</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExceptions.map((exception) => (
                    <tr key={exception.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {exception.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {new Date(exception.exception_date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {exception.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDelete(exception.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4">
                <button
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Назад
                </button>
                <span className="text-sm">Страница {page} из {totalPages}</span>
                <button
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Вперёд
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
