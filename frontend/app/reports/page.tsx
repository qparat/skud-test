import React from 'react'

// Пример списка отчетов (можно заменить на динамический)
const reports = [
  {
    id: 1,
    name: 'Свод ТРК',
    description: 'Таблица с данными о нахождении руководителей',
    file: '/reports/attendance_report.xlsx',
    ready: true
  },
  {
    id: 2,
    name: 'Отчет по исключениям',
    description: 'Список сотрудников с исключениями за месяц.',
    file: '/reports/exceptions_report.xlsx',
    ready: false
  }
]

export default function ReportsPage() {
  // Пример данных для таблицы "Свод ТРК"
  const summaryTable = [
    { position: 'Директор', name: 'Иванов И.И.', comment: 'В отпуске' },
    { position: 'Заместитель директора', name: 'Петров П.П.', comment: 'В командировке' },
    { position: 'Менеджер', name: 'Сидоров С.С.', comment: 'На рабочем месте' }
  ]

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Доступные отчеты</h1>
      {/* Таблица "Свод ТРК" */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Свод ТРК</h2>
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Должность</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ФИО</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {summaryTable.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2 text-gray-900">{row.position}</td>
                <td className="px-4 py-2 text-blue-700 font-semibold">{row.name}</td>
                <td className="px-4 py-2 text-gray-600">{row.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* ...existing code... */}
      <div className="space-y-6">
        {reports.map(report => (
          <div key={report.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{report.name}</div>
              <div className="text-gray-600 text-sm mb-2">{report.description}</div>
              <div className="text-xs text-gray-500">{report.ready ? 'Готов к скачиванию' : 'В процессе генерации'}</div>
            </div>
            <div>
              {report.ready ? (
                <a
                  href={report.file}
                  download
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Скачать Excel
                </a>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                >
                  Недоступно
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
