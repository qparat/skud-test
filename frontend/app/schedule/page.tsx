import { EmployeeSchedule } from '@/components/EmployeeSchedule'

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Расписание сотрудников
        </h1>
        <p className="text-gray-600">
           Просмотр расписания работы сотрудников по дням
        </p>
      </div>
      
      <EmployeeSchedule />
    </div>
  )
}

