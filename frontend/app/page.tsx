export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-4">СКУД - Система Контроля и Управления Доступом</h1>
          <p className="text-xl text-blue-100">Система отслеживания посещаемости сотрудников</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Список сотрудников</h3>
            <p className="text-gray-600 mb-6">Просмотр всех сотрудников, сгруппированных по службам</p>
            <a 
              href="/employees" 
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Смотреть список →
            </a>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 9v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Расписание сотрудников</h3>
            <p className="text-gray-600 mb-6">Просмотр времени прихода и ухода сотрудников по дням</p>
            <a 
              href="/schedule" 
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              Перейти к расписанию →
            </a>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="bg-orange-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Управление должностями</h3>
            <p className="text-gray-600 mb-6">Назначение должностей сотрудникам и управление организационной структурой</p>
            <a 
              href="/positions/manage" 
              className="text-orange-600 hover:text-orange-700 font-medium flex items-center"
            >
              Назначить должности →
            </a>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Исключения</h3>
            <p className="text-gray-600 mb-6">Управление исключениями для сотрудников (отпуск, командировка, больничный)</p>
            <a 
              href="/exceptions" 
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
            >
              Управлять исключениями →
            </a>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <a 
            href="/employees" 
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium inline-flex items-center"
          >
            Начать работу →
          </a>
        </div>
      </div>
    </div>
  )
}
