'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Save, X, Clock } from 'lucide-react';

interface ShiftType {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  color: string;
}

interface ShiftSchedule {
  id: number;
  name: string;
  month: number;
  year: number;
  shift_types: ShiftType[];
  created_at: string;
}

interface EmployeeShift {
  employee_id: number;
  employee_name: string;
  days: string[]; // Массив из 31 элемента: "1", "2", "В", "Отпуск" и т.д.
}

interface ScheduleWithEmployees {
  schedule: ShiftSchedule;
  employees: EmployeeShift[];
}

interface Employee {
  id: number;
  full_name: string;
  full_name_expanded?: string;
}

export default function ShiftsPage() {
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleWithEmployees | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{empId: number, day: number} | null>(null);
  const [cellValue, setCellValue] = useState('');

  // Форма создания графика
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleMonth, setNewScheduleMonth] = useState(new Date().getMonth() + 1);
  const [newScheduleYear, setNewScheduleYear] = useState(new Date().getFullYear());
  const [newShiftTypes, setNewShiftTypes] = useState<Omit<ShiftType, 'id'>[]>([
    { name: '1 смена', start_time: '09:00', end_time: '21:00', duration_hours: 12, color: '#3b82f6' },
    { name: 'В', start_time: '00:00', end_time: '00:00', duration_hours: 0, color: '#ef4444' }
  ]);

  useEffect(() => {
    fetchSchedules();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees-list');
      if (response.ok) {
        const data = await response.json();
        setAvailableEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // TODO: Заменить на реальный API
      // const response = await fetch('/api/shift-schedules');
      // const data = await response.json();
      // setSchedules(data);
      
      // Временные данные для демонстрации
      setSchedules([
        {
          id: 1,
          name: 'График 1 (2 через 2)',
          month: 12,
          year: 2024,
          shift_types: [
            { id: 1, name: '1 смена', start_time: '09:00', end_time: '21:00', duration_hours: 12, color: '#3b82f6' },
            { id: 2, name: 'В', start_time: '00:00', end_time: '00:00', duration_hours: 0, color: '#ef4444' }
          ],
          created_at: '2024-11-01'
        },
        {
          id: 2,
          name: 'График 2 (день/ночь)',
          month: 12,
          year: 2024,
          shift_types: [
            { id: 3, name: '1 смена', start_time: '08:00', end_time: '20:00', duration_hours: 12, color: '#3b82f6' },
            { id: 4, name: '2 смена', start_time: '20:00', end_time: '08:00', duration_hours: 12, color: '#8b5cf6' },
            { id: 5, name: 'В', start_time: '00:00', end_time: '00:00', duration_hours: 0, color: '#ef4444' }
          ],
          created_at: '2024-11-01'
        }
      ]);
    } catch (error) {
      console.error('Ошибка загрузки графиков:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScheduleData = async (scheduleId: number) => {
    try {
      // TODO: Заменить на реальный API
      // const response = await fetch(`/api/shift-schedules/${scheduleId}`);
      // const data = await response.json();
      // setScheduleData(data);

      const schedule = schedules.find(s => s.id === scheduleId);
      if (!schedule) return;

      // Временные данные для демонстрации
      const daysInMonth = new Date(schedule.year, schedule.month, 0).getDate();
      
      if (scheduleId === 1) {
        // График 2 через 2
        const pattern = ['1', '1', 'В', 'В'];
        setScheduleData({
          schedule,
          employees: [
            {
              employee_id: 1,
              employee_name: 'Иванов И.И.',
              days: Array.from({ length: daysInMonth }, (_, i) => pattern[i % pattern.length])
            },
            {
              employee_id: 2,
              employee_name: 'Петров П.П.',
              days: Array.from({ length: daysInMonth }, (_, i) => {
                if (i >= 27) return 'Отпуск';
                return pattern[i % pattern.length];
              })
            }
          ]
        });
      } else {
        // График день/ночь
        const pattern = ['1', '2', 'В', 'В'];
        setScheduleData({
          schedule,
          employees: [
            {
              employee_id: 3,
              employee_name: 'Сидоров С.С.',
              days: Array.from({ length: daysInMonth }, (_, i) => pattern[i % pattern.length])
            },
            {
              employee_id: 4,
              employee_name: 'Козлов К.К.',
              days: Array.from({ length: daysInMonth }, (_, i) => pattern[i % pattern.length])
            }
          ]
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных графика:', error);
    }
  };

  const addShiftType = () => {
    setNewShiftTypes([
      ...newShiftTypes,
      { name: 'Новая смена', start_time: '09:00', end_time: '18:00', duration_hours: 9, color: '#10b981' }
    ]);
  };

  const removeShiftType = (index: number) => {
    setNewShiftTypes(newShiftTypes.filter((_, i) => i !== index));
  };

  const updateShiftType = (index: number, field: keyof Omit<ShiftType, 'id'>, value: string | number) => {
    const updated = [...newShiftTypes];
    updated[index] = { ...updated[index], [field]: value };
    setNewShiftTypes(updated);
  };

  const createSchedule = async () => {
    try {
      // TODO: Заменить на реальный API
      // const response = await fetch('/api/shift-schedules', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: newScheduleName,
      //     month: newScheduleMonth,
      //     year: newScheduleYear,
      //     shift_types: newShiftTypes
      //   })
      // });
      
      alert('График создан (функция в разработке)');
      setShowCreateModal(false);
      fetchSchedules();
    } catch (error) {
      console.error('Ошибка создания графика:', error);
    }
  };

  const addEmployeeToSchedule = () => {
    if (!selectedEmployeeId || !scheduleData) return;

    const employee = availableEmployees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    const daysInMonth = new Date(scheduleData.schedule.year, scheduleData.schedule.month, 0).getDate();
    const newEmployee: EmployeeShift = {
      employee_id: employee.id,
      employee_name: employee.full_name_expanded || employee.full_name,
      days: Array(daysInMonth).fill('В')
    };

    setScheduleData({
      ...scheduleData,
      employees: [...scheduleData.employees, newEmployee]
    });

    setShowAddEmployeeModal(false);
    setSelectedEmployeeId(null);
  };

  const updateCellValue = (empId: number, dayIndex: number, value: string) => {
    if (!scheduleData) return;

    setScheduleData({
      ...scheduleData,
      employees: scheduleData.employees.map(emp => 
        emp.employee_id === empId
          ? { ...emp, days: emp.days.map((d, i) => i === dayIndex ? value : d) }
          : emp
      )
    });
  };

  const startEditCell = (empId: number, day: number, currentValue: string) => {
    setEditingCell({ empId, day });
    setCellValue(currentValue);
  };

  const saveCell = () => {
    if (editingCell) {
      updateCellValue(editingCell.empId, editingCell.day, cellValue);
      setEditingCell(null);
      setCellValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setCellValue('');
  };

  const removeEmployeeFromSchedule = (empId: number) => {
    if (!scheduleData) return;
    if (!confirm('Удалить сотрудника из графика?')) return;

    setScheduleData({
      ...scheduleData,
      employees: scheduleData.employees.filter(emp => emp.employee_id !== empId)
    });
  };

  const applyPatternToEmployee = (empId: number, pattern: string[]) => {
    if (!scheduleData) return;

    const employee = scheduleData.employees.find(e => e.employee_id === empId);
    if (!employee) return;

    const newDays = Array.from({ length: employee.days.length }, (_, i) => pattern[i % pattern.length]);
    
    setScheduleData({
      ...scheduleData,
      employees: scheduleData.employees.map(emp => 
        emp.employee_id === empId
          ? { ...emp, days: newDays }
          : emp
      )
    });
  };

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Графики смен
            </h1>
            <p className="text-gray-600 mt-2">
              Управление графиками работы сотрудников
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Создать график
          </button>
        </div>

        {/* Список графиков */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {schedules.map(schedule => (
            <div
              key={schedule.id}
              className={`bg-white p-6 rounded-lg shadow cursor-pointer transition-all ${
                selectedSchedule === schedule.id
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => {
                setSelectedSchedule(schedule.id);
                loadScheduleData(schedule.id);
              }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {schedule.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {months[schedule.month - 1]} {schedule.year}
              </p>
              <div className="space-y-1">
                {schedule.shift_types.map(st => (
                  <div key={st.id} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: st.color }}
                    ></div>
                    <span className="font-medium">{st.name}</span>
                    {st.duration_hours > 0 && (
                      <span className="text-gray-500">
                        {st.start_time} - {st.end_time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Таблица с графиком */}
        {scheduleData && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {scheduleData.schedule.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {months[scheduleData.schedule.month - 1]} {scheduleData.schedule.year}
                </p>
              </div>
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Добавить сотрудника
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                      Сотрудник
                    </th>
                    {Array.from(
                      { length: new Date(scheduleData.schedule.year, scheduleData.schedule.month, 0).getDate() },
                      (_, i) => i + 1
                    ).map(day => (
                      <th
                        key={day}
                        className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[40px]"
                      >
                        {day}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scheduleData.employees.map(emp => (
                    <tr key={emp.employee_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200">
                        <div className="flex flex-col">
                          <span>{emp.employee_name}</span>
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => applyPatternToEmployee(emp.employee_id, ['1', '1', 'В', 'В'])}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              title="2 через 2"
                            >
                              2/2
                            </button>
                            <button
                              onClick={() => applyPatternToEmployee(emp.employee_id, ['1', '2', 'В', 'В'])}
                              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              title="День/Ночь/2 выходных"
                            >
                              Д/Н
                            </button>
                          </div>
                        </div>
                      </td>
                      {emp.days.map((day, idx) => {
                        const isEditing = editingCell?.empId === emp.employee_id && editingCell?.day === idx;
                        const shiftType = scheduleData.schedule.shift_types.find(
                          st => st.name === day || st.name === `${day} смена`
                        );
                        const isCustom = !shiftType && day !== 'В' && !day.match(/^\d+$/);
                        
                        return (
                          <td
                            key={idx}
                            className="px-2 py-3 text-center text-sm font-medium cursor-pointer hover:ring-2 hover:ring-blue-400"
                            style={{
                              backgroundColor: shiftType
                                ? `${shiftType.color}20`
                                : isCustom
                                ? '#fef3c7'
                                : day === 'В'
                                ? '#fee2e2'
                                : undefined,
                              color: shiftType?.color || (isCustom ? '#92400e' : day === 'В' ? '#991b1b' : '#374151')
                            }}
                            onClick={() => !isEditing && startEditCell(emp.employee_id, idx, day)}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                onBlur={saveCell}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveCell();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                className="w-full px-1 py-1 text-center border-2 border-blue-500 rounded focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              day
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center sticky right-0 bg-white border-l border-gray-200">
                        <button
                          onClick={() => removeEmployeeFromSchedule(emp.employee_id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Удалить из графика"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Легенда */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Обозначения:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduleData.schedule.shift_types.map(st => (
                  <div key={st.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: st.color }}
                    >
                      {st.name.match(/^\d+/) ? st.name.match(/^\d+/)?.[0] : st.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{st.name}</div>
                      {st.duration_hours > 0 && (
                        <div className="text-sm text-gray-600">
                          {st.start_time} - {st.end_time} ({st.duration_hours}ч)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно создания графика */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Создать новый график</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Основная информация */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название графика
                    </label>
                    <input
                      type="text"
                      value={newScheduleName}
                      onChange={(e) => setNewScheduleName(e.target.value)}
                      placeholder="Например: График 1 (2 через 2)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Месяц
                    </label>
                    <select
                      value={newScheduleMonth}
                      onChange={(e) => setNewScheduleMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {months.map((month, idx) => (
                        <option key={idx} value={idx + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Год
                    </label>
                    <input
                      type="number"
                      value={newScheduleYear}
                      onChange={(e) => setNewScheduleYear(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Типы смен */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Типы смен
                    </label>
                    <button
                      onClick={addShiftType}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить смену
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newShiftTypes.map((st, idx) => (
                      <div key={idx} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
                        <input
                          type="color"
                          value={st.color}
                          onChange={(e) => updateShiftType(idx, 'color', e.target.value)}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={st.name}
                            onChange={(e) => updateShiftType(idx, 'name', e.target.value)}
                            placeholder="Название"
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="time"
                            value={st.start_time}
                            onChange={(e) => updateShiftType(idx, 'start_time', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="time"
                            value={st.end_time}
                            onChange={(e) => updateShiftType(idx, 'end_time', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="number"
                            value={st.duration_hours}
                            onChange={(e) => updateShiftType(idx, 'duration_hours', Number(e.target.value))}
                            placeholder="Часов"
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <button
                          onClick={() => removeShiftType(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={createSchedule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Создать график
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно добавления сотрудника */}
        {showAddEmployeeModal && scheduleData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Добавить сотрудника в график</h2>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите сотрудника
                </label>
                <select
                  value={selectedEmployeeId || ''}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Выберите --</option>
                  {availableEmployees
                    .filter(emp => !scheduleData.employees.find(se => se.employee_id === emp.id))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name_expanded || emp.full_name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  По умолчанию все дни будут отмечены как выходные (В). Вы сможете изменить их после добавления.
                </p>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddEmployeeModal(false);
                    setSelectedEmployeeId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={addEmployeeToSchedule}
                  disabled={!selectedEmployeeId}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
