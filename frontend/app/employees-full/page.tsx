'use client';

import { useState, useEffect } from 'react';
import { Search, Edit2, Save, X, UserCheck, Trash2, ArrowUpDown, UserX, RotateCcw } from 'lucide-react';

interface Employee {
  id: number;
  full_name: string;
  full_name_expanded?: string | null;
  department_name?: string;
  position_name?: string;
  is_active: boolean;
  updated_at?: string | null;
}

export default function EmployeesFullPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortByFullName, setSortByFullName] = useState<'none' | 'empty-first' | 'filled-first'>('none');
  const [sortByStatus, setSortByStatus] = useState<'none' | 'active-first' | 'inactive-first'>('none');
  const [toggleStatusId, setToggleStatusId] = useState<number | null>(null);
  const [confirmWord, setConfirmWord] = useState('');
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let result = [...employees];
    
    // Применяем поиск
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(emp => {
        const fullName = (emp.full_name_expanded || emp.full_name).toLowerCase();
        const shortName = emp.full_name.toLowerCase();
        return fullName.includes(query) ||
          shortName.includes(query) ||
          (emp.department_name && emp.department_name.toLowerCase().includes(query));
      });
    }
    
    // Применяем сортировку по полному ФИО
    if (sortByFullName === 'empty-first') {
      result.sort((a, b) => {
        const aEmpty = !a.full_name_expanded;
        const bEmpty = !b.full_name_expanded;
        if (aEmpty && !bEmpty) return -1;
        if (!aEmpty && bEmpty) return 1;
        return 0;
      });
    } else if (sortByFullName === 'filled-first') {
      result.sort((a, b) => {
        const aEmpty = !a.full_name_expanded;
        const bEmpty = !b.full_name_expanded;
        if (!aEmpty && bEmpty) return -1;
        if (aEmpty && !bEmpty) return 1;
        return 0;
      });
    }
    
    // Применяем сортировку по статусу
    if (sortByStatus === 'active-first') {
      result.sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return 0;
      });
    } else if (sortByStatus === 'inactive-first') {
      result.sort((a, b) => {
        if (!a.is_active && b.is_active) return -1;
        if (a.is_active && !b.is_active) return 1;
        return 0;
      });
    }
    
    setFilteredEmployees(result);
  }, [searchQuery, employees, sortByFullName, sortByStatus]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Загружаем активных сотрудников
      const activeResponse = await fetch('/api/employees-list');
      if (!activeResponse.ok) throw new Error('Ошибка загрузки активных');
      const activeData = await activeResponse.json();
      const activeEmployees = (activeData.employees || []).map((emp: Employee) => ({ ...emp, is_active: true }));
      
      // Загружаем деактивированных сотрудников
      const deactivatedResponse = await fetch('/api/employees/deactivated', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      let allEmployees = activeEmployees;
      if (deactivatedResponse.ok) {
        const deactivatedData = await deactivatedResponse.json();
        const deactivatedEmployees = deactivatedData.map((emp: Employee) => ({ ...emp, is_active: false }));
        
        // Объединяем и удаляем дубликаты по ID
        const employeesMap = new Map();
        [...activeEmployees, ...deactivatedEmployees].forEach(emp => {
          employeesMap.set(emp.id, emp);
        });
        allEmployees = Array.from(employeesMap.values());
      }
      
      setEmployees(allEmployees);
      setFilteredEmployees(allEmployees);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setEditValue(employee.full_name_expanded || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (employeeId: number) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/employees/${employeeId}/full-name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name_expanded: editValue.trim() })
      });

      if (!response.ok) throw new Error('Ошибка сохранения');

      // Обновляем локальное состояние
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, full_name_expanded: editValue.trim() }
          : emp
      ));
      
      setEditingId(null);
      setEditValue('');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const startToggleStatus = (employeeId: number) => {
    setToggleStatusId(employeeId);
    setConfirmWord('');
    setStatusError('');
  };

  const cancelToggleStatus = () => {
    setToggleStatusId(null);
    setConfirmWord('');
    setStatusError('');
  };

  const confirmToggleStatus = async (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const isActivating = !employee.is_active;
    const requiredWord = isActivating ? 'активировать' : 'удалить';

    if (!confirmWord.trim()) {
      setStatusError(`Введите слово "${requiredWord}"`);
      return;
    }

    if (confirmWord.toLowerCase() !== requiredWord) {
      setStatusError(`Для подтверждения введите слово "${requiredWord}"`);
      return;
    }

    try {
      setSaving(true);
      setStatusError('');
      
      const endpoint = isActivating 
        ? `/api/employees/${employeeId}/reactivate`
        : `/api/employees/${employeeId}/deactivate`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ password: confirmWord })
      });

      if (!response.ok) {
        const error = await response.json();
        setStatusError(error.detail || `Ошибка ${isActivating ? 'активации' : 'деактивации'}`);
        setSaving(false);
        return;
      }

      // Обновляем статус в локальном состоянии
      setEmployees(prev => prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, is_active: isActivating }
          : emp
      ));
      
      cancelToggleStatus();
      alert(`Сотрудник ${isActivating ? 'активирован' : 'деактивирован'}`);
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      setStatusError(error instanceof Error ? error.message : 'Не удалось изменить статус');
    } finally {
      setSaving(false);
    }
  };

  const toggleFullNameSort = () => {
    if (sortByFullName === 'none') {
      setSortByFullName('empty-first');
    } else if (sortByFullName === 'empty-first') {
      setSortByFullName('filled-first');
    } else {
      setSortByFullName('none');
    }
  };

  const toggleStatusSort = () => {
    if (sortByStatus === 'none') {
      setSortByStatus('active-first');
    } else if (sortByStatus === 'active-first') {
      setSortByStatus('inactive-first');
    } else {
      setSortByStatus('none');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка сотрудников...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-blue-600" />
                Полные ФИО сотрудников
              </h1>
              <p className="text-gray-600 mt-2">
                Здесь вы можете указать полные имена сотрудников вместо сокращённых
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-center text-sm">
                1. Загрузить сокращённые ФИО
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const text = await file.text();
                    const shortNames = text.split('\n').map(line => line.trim()).filter(line => line);
                    
                    // Сохраняем в localStorage для следующего шага
                    localStorage.setItem('shortNames', JSON.stringify(shortNames));
                    alert(`Загружено ${shortNames.length} сокращённых ФИО.\nТеперь загрузите файл с полными ФИО в том же порядке.`);
                  }}
                />
              </label>
              
              <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-center text-sm">
                2. Загрузить полные ФИО
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const shortNamesJson = localStorage.getItem('shortNames');
                    if (!shortNamesJson) {
                      alert('Сначала загрузите файл с сокращёнными ФИО (кнопка 1)');
                      return;
                    }
                    
                    const shortNames = JSON.parse(shortNamesJson);
                    const text = await file.text();
                    const fullNames = text.split('\n').map(line => line.trim()).filter(line => line);
                    
                    // Функция для нормализации символов (казахский → русский)
                    const normalizeChar = (char: string): string => {
                      const kazToRus: Record<string, string> = {
                        'Ә': 'А', 'ә': 'а',
                        'Ғ': 'Г', 'ғ': 'г',
                        'Қ': 'К', 'қ': 'к',
                        'Ң': 'Н', 'ң': 'н',
                        'Ө': 'О', 'ө': 'о',
                        'Ұ': 'У', 'ұ': 'у',
                        'Ү': 'У', 'ү': 'у',
                        'Һ': 'Х', 'һ': 'х',
                        'І': 'И', 'і': 'и'
                      };
                      return kazToRus[char] || char;
                    };
                    
                    // Функция для нормализации строки
                    const normalizeString = (str: string): string => {
                      return str.split('').map(normalizeChar).join('');
                    };
                    
                    // Функция для создания ключа из ФИО (Фамилия + инициалы)
                    const createKey = (name: string, debug = false): string => {
                      const normalized = normalizeString(name);
                      // Заменяем точки на пробелы, чтобы инициалы разделились
                      const cleaned = normalized.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
                      const parts = cleaned.split(' ').filter(p => p);
                      
                      if (parts.length === 0) return '';
                      
                      // Фамилия - это всегда первая часть
                      const surname = parts[0].toUpperCase();
                      
                      // Собираем ВСЕ инициалы из остальных частей
                      // Для сокращённых (Д Ж) каждая часть - это инициал
                      // Для полных (Дарья Жановна) берём первые буквы
                      const initialsRaw = parts.slice(1).map(part => {
                        // Если часть состоит из одной буквы (инициал), берём её
                        if (part.length === 1) {
                          return part.toUpperCase();
                        }
                        // Иначе берём первую букву (для полных имён)
                        return part[0]?.toUpperCase() || '';
                      });
                      
                      if (debug && initialsRaw.length > 0) {
                        console.log(`  DEBUG: "${name}" → parts:`, parts);
                        console.log(`  DEBUG: initialsRaw:`, initialsRaw);
                        console.log(`  DEBUG: после фильтра:`, initialsRaw.filter(i => i && /[А-ЯA-ZЁЁ]/.test(i)));
                      }
                      
                      const initials = initialsRaw
                        .filter(i => i && /[А-ЯA-ZЁЁ]/.test(i))
                        .join('');
                      
                      return `${surname}${initials}`;
                    };
                    
                    // Создаём маппинг из полных ФИО
                    const fullNamesMap: Record<string, string> = {};
                    console.log('📝 Создание маппинга из полных ФИО...');
                    console.log('Примеры из файла 2 (первые 5):');
                    for (let i = 0; i < Math.min(5, fullNames.length); i++) {
                      const fullName = fullNames[i];
                      const key = createKey(fullName);
                      console.log(`  "${fullName}" → ключ: "${key}"`);
                    }
                    
                    for (const fullName of fullNames) {
                      const key = createKey(fullName);
                      if (key) {
                        fullNamesMap[key] = fullName;
                      }
                    }
                    
                    console.log(`✅ Создано ${Object.keys(fullNamesMap).length} ключей из полных ФИО`);
                    
                    // Создаём маппинг для обновления
                    const mapping: Record<string, string> = {};
                    const notMatchedShort: string[] = [];
                    
                    console.log('\n📝 Сопоставление сокращённых ФИО...');
                    console.log('Примеры из файла 1 (первые 5):');
                    for (let i = 0; i < Math.min(5, shortNames.length); i++) {
                      const shortName = shortNames[i];
                      const key = createKey(shortName, true); // Enable debug for first 5
                      const matched = fullNamesMap[key];
                      console.log(`  "${shortName}" → ключ: "${key}" → ${matched ? '✅ ' + matched : '❌ не найдено'}`);
                    }
                    
                    for (const shortName of shortNames) {
                      const key = createKey(shortName);
                      if (key && fullNamesMap[key]) {
                        mapping[shortName] = fullNamesMap[key];
                      } else {
                        notMatchedShort.push(shortName);
                      }
                    }
                    
                    console.log(`\n✅ Создан маппинг: ${Object.keys(mapping).length} совпадений`);
                    console.log(`❌ Не совпало: ${notMatchedShort.length}`);
                    if (notMatchedShort.length > 0) {
                      console.log('Примеры не совпавших (первые 10):');
                      notMatchedShort.slice(0, 10).forEach(name => {
                        console.log(`  "${name}" → ключ: "${createKey(name)}"`);
                      });
                    }
                    
                    // Обновляем сотрудников через новый API endpoint
                    let updated = 0;
                    let notFound = 0;
                    let errors = 0;
                    
                    for (const [shortName, fullName] of Object.entries(mapping)) {
                      try {
                        // Используем новый endpoint для обновления по короткому имени
                        const response = await fetch(`/api/employees/update-by-name`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            full_name: shortName,
                            full_name_expanded: fullName 
                          })
                        });
                        
                        if (response.ok) {
                          updated++;
                          console.log(`✅ ${shortName} → ${fullName}`);
                        } else if (response.status === 404) {
                          notFound++;
                          console.warn(`⚠️ Не найден в БД: ${shortName}`);
                        } else {
                          errors++;
                          console.error(`❌ Ошибка обновления ${shortName}:`, response.statusText);
                        }
                      } catch (error) {
                        errors++;
                        console.error(`❌ Ошибка обновления ${shortName}:`, error);
                      }
                    }
                    
                    const notMatched = shortNames.length - Object.keys(mapping).length;
                    
                    localStorage.removeItem('shortNames');
                    alert(`Готово!\n\nОбновлено: ${updated}\nНе найдено в БД: ${notFound}\nНе совпало по ФИО: ${notMatched}\nОшибки: ${errors}\n\nВсего из файла 1: ${shortNames.length}\nВсего из файла 2: ${fullNames.length}`);
                    
                    // Обновляем список только если API доступно
                    try {
                      await fetchEmployees();
                    } catch (e) {
                      console.log('Не удалось обновить список (API недоступно)');
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по ФИО, службе..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Найдено сотрудников: {filteredEmployees.length}
          </p>
        </div>

        {/* Таблица */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                    №
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Сокращённое ФИО
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={toggleFullNameSort}
                    title="Нажмите для сортировки"
                  >
                    <div className="flex items-center gap-2">
                      Полное ФИО
                      {sortByFullName === 'empty-first' && <ArrowUpDown className="w-4 h-4 text-blue-600" />}
                      {sortByFullName === 'filled-first' && <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />}
                      {sortByFullName === 'none' && <ArrowUpDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Служба
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={toggleStatusSort}
                    title="Нажмите для сортировки"
                  >
                    <div className="flex items-center gap-2">
                      Статус
                      {sortByStatus === 'active-first' && <ArrowUpDown className="w-4 h-4 text-blue-600" />}
                      {sortByStatus === 'inactive-first' && <ArrowUpDown className="w-4 h-4 text-blue-600 rotate-180" />}
                      {sortByStatus === 'none' && <ArrowUpDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? 'Ничего не найдено' : 'Нет сотрудников'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === employee.id ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="Введите полное ФИО"
                            className="w-full px-3 py-2 border border-blue-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            autoFocus
                            disabled={saving}
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {employee.full_name_expanded || (
                              <span className="text-gray-400 italic">Не указано</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {employee.department_name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {employee.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Активен
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Деактивирован
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === employee.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(employee.id)}
                              disabled={saving}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                              title="Сохранить"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                              title="Отменить"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : toggleStatusId === employee.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={confirmWord}
                              onChange={(e) => setConfirmWord(e.target.value)}
                              placeholder={employee.is_active ? 'Введите "удалить"' : 'Введите "активировать"'}
                              className="w-full px-3 py-2 border border-blue-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                              autoFocus
                              disabled={saving}
                            />
                            {statusError && (
                              <p className="text-xs text-red-600">{statusError}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmToggleStatus(employee.id)}
                                disabled={saving}
                                className={`px-3 py-2 text-white text-xs rounded-md transition-colors disabled:opacity-50 ${
                                  employee.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {employee.is_active ? 'Деактивировать' : 'Активировать'}
                              </button>
                              <button
                                onClick={cancelToggleStatus}
                                disabled={saving}
                                className="px-3 py-2 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 disabled:opacity-50"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(employee)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Редактировать"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            {employee.is_active ? (
                              <button
                                onClick={() => startToggleStatus(employee.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Деактивировать сотрудника"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => startToggleStatus(employee.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                title="Активировать сотрудника"
                              >
                                <RotateCcw className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Статистика */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Всего сотрудников</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {employees.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Активированных</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {employees.filter(e => e.is_active).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Деактивированных</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {employees.filter(e => !e.is_active).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">С полным ФИО</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {employees.filter(e => e.full_name_expanded).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Не заполнено</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {employees.filter(e => !e.full_name_expanded).length}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
