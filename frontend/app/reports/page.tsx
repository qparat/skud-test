 'use client'
import React from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'

const reports = [
  {
    id: 1,
    name: 'Свод ТРК',
    description: 'Таблица с данными о нахождении руководителей',
    path: '/reports/svod'
  }
]

export default function ReportsPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Доступные отчеты</h1>
      <div className="space-y-6">
        {reports.map(report => (
          <Link 
            key={report.id} 
            href={report.path}
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h2 className="text-lg font-semibold text-blue-700 hover:underline">
                  {report.name}
                </h2>
                <p className="text-gray-600 text-sm mt-1">{report.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
