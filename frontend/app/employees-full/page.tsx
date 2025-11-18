'use client';

import { useState, useEffect } from 'react';
import { Search, Edit2, Save, X, UserCheck, Trash2, ArrowUpDown } from 'lucide-react';

interface Employee {
  id: number;
  full_name: string;
  full_name_expanded?: string | null;
  department_name?: string;
  position_name?: string;
  is_active: boolean;
}

export default function EmployeesFullPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortByEmpty, setSortByEmpty] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let result = [...employees];
    
    // Применяем поиск
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(emp => 
        emp.full_name.toLowerCase().includes(query) ||
        (emp.full_name_expanded && emp.full_name_expanded.toLowerCase().includes(query)) ||
        (emp.department_name && emp.department_name.toLowerCase().includes(query))
      );
    }
    
    // Применяем сортировку
    if (sortByEmpty) {
      result.sort((a, b) => {
        const aEmpty = !a.full_name_expanded;
        const bEmpty = !b.full_name_expanded;
        if (aEmpty && !bEmpty) return -1;
        if (!aEmpty && bEmpty) return 1;
        return 0;
      });
    }
    
    setFilteredEmployees(result);
  }, [searchQuery, employees, sortByEmpty]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees-list');
      if (!response.ok) throw new Error('Ошибка загрузки');
      const data = await response.json();
      setEmployees(data.employees || []);
      setFilteredEmployees(data.employees || []);
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

  const startDelete = (employeeId: number) => {
    setDeletingId(employeeId);
    setDeletePassword('');
    setDeleteError('');
  };

  const cancelDelete = () => {
    setDeletingId(null);
    setDeletePassword('');
    setDeleteError('');
  };

  const confirmDelete = async (employeeId: number) => {
    if (!deletePassword.trim()) {
      setDeleteError('Введите пароль');
      return;
    }

    try {
      setSaving(true);
      setDeleteError('');
      
      const response = await fetch(`/api/employees/${employeeId}/deactivate`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      if (response.status === 401) {
        setDeleteError('Неверный пароль');
        return;
      }

      if (response.status === 403) {
        setDeleteError('Недостаточно прав');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Ошибка деактивации');
      }

      // Удаляем из локального состояния (так как показываем только активных)
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      
      cancelDelete();
      alert('Сотрудник деактивирован (is_active = false)');
    } catch (error) {
      console.error('Ошибка деактивации:', error);
      setDeleteError(error instanceof Error ? error.message : 'Не удалось деактивировать сотрудника');
    } finally {
      setSaving(false);
    }
  };

  const toggleSort = () => {
    setSortByEmpty(!sortByEmpty);
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
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

        {/* Поиск и сортировка */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
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
          <button
            onClick={toggleSort}
            className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
              sortByEmpty 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title="Показать сначала без полного ФИО"
          >
            <ArrowUpDown className="w-5 h-5" />
            <span className="whitespace-nowrap">Без ФИО вверх</span>
          </button>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Полное ФИО
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Служба
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-40">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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
                        ) : deletingId === employee.id ? (
                          <div className="space-y-2">
                            <input
                              type="password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              placeholder="Введите ваш пароль"
                              className="w-full px-3 py-2 border border-red-500 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                              autoFocus
                              disabled={saving}
                            />
                            {deleteError && (
                              <p className="text-xs text-red-600">{deleteError}</p>
                            )}
                          </div>
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
                        ) : deletingId === employee.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmDelete(employee.id)}
                              disabled={saving}
                              className="px-3 py-2 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                              title="Деактивировать сотрудника"
                            >
                              Деактивировать
                            </button>
                            <button
                              onClick={cancelDelete}
                              disabled={saving}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                              title="Отменить"
                            >
                              <X className="w-5 h-5" />
                            </button>
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
                            <button
                              onClick={() => startDelete(employee.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Деактивировать сотрудника"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Всего сотрудников</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {employees.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">С полным ФИО</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
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
