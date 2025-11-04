'use client'
import React, { useState, useEffect } from 'react'



export default function SvodReportPage() {
  const [allEmployees, setAllEmployees] = useState<{ id: number; name: string; position: string }[]>([]);
  const [employeeExceptions, setEmployeeExceptions] = useState<{ [key: string]: { date: string; comment: string } }>({});
  const [employees, setEmployees] = useState<{ position: string; name: string; comment: string }[]>([]);
  const [form, setForm] = useState({ employeeId: '', position: '', name: '', comment: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate] = useState(() => {
    // Можно добавить выбор даты, пока используем сегодня
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  // Загрузка сотрудников и исключений
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/employees').then(r => r.json()),
      fetch(`/api/exceptions?date=${selectedDate}`).then(r => r.json())
    ])
      .then(([employeesData, exceptionsData]) => {
        setAllEmployees(employeesData);
        setEmployeeExceptions(exceptionsData);
        setLoading(false);
      })
      .catch((err) => {
        setError('Ошибка загрузки данных');
        setLoading(false);
      });
  }, [selectedDate]);

  // При выборе сотрудника — автозаполнение
  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const emp = allEmployees.find(emp => String(emp.id) === id);
    let comment = '';
    if (emp && employeeExceptions[String(emp.id)]) {
      comment = employeeExceptions[String(emp.id)].comment;
    }
    setForm({
      employeeId: id,
      position: emp ? emp.position : '',
      name: emp ? emp.name : '',
      comment
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.position || !form.name) return;
    setEmployees([...employees, { position: form.position, name: form.name, comment: form.comment }]);
    setForm({ employeeId: '', position: '', name: '', comment: '' });
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Свод ТРК — Добавить сотрудника</h1>
      <div>
        {loading ? (
          <div className="p-6 text-center text-gray-600">Загрузка данных...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <>
            <form className="mb-8 space-y-4" onSubmit={handleAdd}>
              <div>
                <label className="block text-sm font-medium mb-1">Сотрудник</label>
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleEmployeeSelect}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Выберите сотрудника</option>
                  {allEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              {form.employeeId && (
                <div className="flex space-x-4 items-center">
                  <div className="text-sm text-gray-700"><b>ФИО:</b> {form.name}</div>
                  <div className="text-sm text-gray-700"><b>Должность:</b> {form.position}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Комментарий</label>
                <input
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Комментарий или исключение"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Добавить</button>
            </form>
            <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Должность</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ФИО</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2 text-gray-900">{row.position}</td>
                    <td className="px-4 py-2 text-blue-700 font-semibold">{row.name}</td>
                    <td className="px-4 py-2 text-gray-600">{row.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
  )
}
