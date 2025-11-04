'use client'
import { useState } from 'react'

export default function SvodReportPage() {
  const [employees, setEmployees] = useState([
    { position: 'Директор', name: 'Иванов И.И.', comment: 'В отпуске' },
    { position: 'Менеджер', name: 'Сидоров С.С.', comment: 'На рабочем месте' }
  ])
  const [form, setForm] = useState({ position: '', name: '', comment: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.position || !form.name) return
    setEmployees([...employees, form])
    setForm({ position: '', name: '', comment: '' })
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Свод ТРК — Добавить сотрудника</h1>
      <form className="mb-8 space-y-4" onSubmit={handleAdd}>
        <div>
          <label className="block text-sm font-medium mb-1">Должность</label>
          <input
            name="position"
            value={form.position}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ФИО</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Комментарий</label>
          <input
            name="comment"
            value={form.comment}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
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
    </div>
  )
}
