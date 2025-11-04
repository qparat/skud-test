import React from 'react'
import { useParams } from 'next/navigation'

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params?.id;

  // Здесь можно добавить загрузку данных по reportId через API

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Детали отчета #{reportId}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Здесь будет подробная информация по отчету с id: <b>{reportId}</b></p>
        {/* Можно добавить таблицу, список дат, кнопку скачивания и т.д. */}
      </div>
    </div>
  )
}
