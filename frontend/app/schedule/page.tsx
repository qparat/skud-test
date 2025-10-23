import { EmployeeSchedule } from '@/components/EmployeeSchedule'

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          📋 Расписание сотрудников
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Просмотр расписания работы сотрудников по дням
        </p>
      </div>
      
      <EmployeeSchedule />
    </div>
  )
}
