 'use client'
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
  // Пример дат для отчетов
  const reportDates = {
    1: ['2025-10-20', '2025-10-21', '2025-10-22', '2025-10-23'],
    2: ['2025-10-01', '2025-10-15', '2025-10-31']
  }

  const [openReportId, setOpenReportId] = React.useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Доступные отчеты</h1>
      {/* ...existing code... */}
      <div className="space-y-6">
        {reports.map(report => (
          <div key={report.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <a
                  href={`/reports/${report.id}`}
                  className="text-lg font-semibold text-blue-700 hover:underline focus:outline-none"
                >
                  {report.name}
                </a>
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
          </div>
        ))}
      </div>
    </div>
  )
}
