'use client'

import { BookOpen, Users, Calendar, Shield, Upload, FileText, Settings } from 'lucide-react'

export default function ManualPage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center space-x-3 mb-6">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Инструкция по эксплуатации</h1>
        </div>
        
        <div className="prose max-w-none">
          <p className="text-lg text-gray-600 mb-8">
            Руководство пользователя системы контроля и управления доступом (СКУД)
          </p>

          {/* Раздел 1 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">1. Расписание сотрудников</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Просмотр расписания</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• При входе в систему автоматически загружается расписание за текущий день</li>
                <li>• Отображается информация о времени прихода, ухода, опозданиях и часах работы</li>
                <li>• Сотрудники с опозданиями выделяются красным цветом</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Выбор даты</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Нажмите на кнопку "Календарь" для выбора даты</li>
                <li>• Первый клик - выделяет дату</li>
                <li>• Второй клик по той же дате - загружает данные</li>
                <li>• Клик по второй дате - создает диапазон дат</li>
                <li>• Кнопка "Очистить" возвращает к текущему дню</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Быстрый выбор периода</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Неделя</strong> - последние 7 дней</li>
                <li>• <strong>Месяц</strong> - последние 30 дней</li>
                <li>• <strong>Квартал</strong> - последние 90 дней</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Фильтрация и поиск</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Поиск по ФИО</strong> - введите имя сотрудника в поле поиска</li>
                <li>• <strong>Фильтр по службе</strong> - выберите один или несколько отделов</li>
                <li>• <strong>Сортировка по статусу</strong> - клик по столбцу "Статус":</li>
                <li className="ml-6">- Первый клик: сначала опоздавшие</li>
                <li className="ml-6">- Второй клик: сначала пришедшие вовремя</li>
                <li className="ml-6">- Третий клик: сброс сортировки</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Экспорт в Excel</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Нажмите кнопку "Экспорт в Excel" для сохранения данных</li>
                <li>• Для одной даты - простая таблица со всеми сотрудниками</li>
                <li>• Для диапазона - группировка по датам с разделителями</li>
              </ul>
            </div>
          </section>

          {/* Раздел 2 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">2. Управление сотрудниками</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Список сотрудников</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Перейдите в раздел "Список сотрудников"</li>
                <li>• Сотрудники сгруппированы по службам</li>
                <li>• Клик по сотруднику открывает детальную информацию</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Карточка сотрудника</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Просмотр полной информации о сотруднике</li>
                <li>• История посещений за выбранный период</li>
                <li>• Статистика опозданий и средних часов работы</li>
                <li>• Возможность изменить службу или должность (для администраторов)</li>
              </ul>
            </div>
          </section>

          {/* Раздел 3 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">3. Исключения</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Создание исключения</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Перейдите в раздел "Исключения"</li>
                <li>• Нажмите "Добавить исключение"</li>
                <li>• Выберите сотрудника, дату и причину</li>
                <li>• Для диапазона дат используйте "Диапазон дат"</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Типы исключений</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Без проверки опозданий</strong> - игнорировать опоздания</li>
                <li>• <strong>Больничный</strong> - отсутствие по болезни</li>
                <li>• <strong>Отпуск</strong> - плановое отсутствие</li>
                <li>• <strong>Командировка</strong> - служебная поездка</li>
              </ul>
            </div>
          </section>

          {/* Раздел 4 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">4. Отчеты</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Сводный отчет</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Выберите период для формирования отчета</li>
                <li>• Просмотрите статистику по всем сотрудникам</li>
                <li>• Экспортируйте данные в Excel для дальнейшего анализа</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Отчет по сотруднику</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Выберите конкретного сотрудника</li>
                <li>• Укажите период анализа</li>
                <li>• Получите детальную статистику посещений</li>
              </ul>
            </div>
          </section>

          {/* Раздел 5 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">5. Загрузка данных</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Загрузка файла СКУД</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Перейдите в раздел "Загрузка файлов"</li>
                <li>• Выберите файл формата .xls или .xlsx</li>
                <li>• Максимальный размер файла: 100 МБ</li>
                <li>• После загрузки данные автоматически обработаются</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-blue-900 font-semibold">⚠️ Важно:</p>
              <p className="text-blue-800 mt-2">
                Загружайте только файлы, полученные из системы СКУД. 
                Файлы должны содержать корректные данные о проходах сотрудников.
              </p>
            </div>
          </section>

          {/* Раздел 6 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">6. Администрирование</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Управление пользователями</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Доступно только для администраторов</li>
                <li>• Создание новых пользователей системы</li>
                <li>• Назначение ролей и прав доступа</li>
                <li>• Деактивация учетных записей</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Роли пользователей</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Root (0)</strong> - полный доступ ко всем функциям</li>
                <li>• <strong>Superadmin (1)</strong> - управление пользователями и настройками</li>
                <li>• <strong>Admin (2)</strong> - работа с данными и отчетами</li>
                <li>• <strong>User (3)</strong> - просмотр расписания и сотрудников</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Управление справочниками</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Службы</strong> - добавление и редактирование отделов</li>
                <li>• <strong>Должности</strong> - управление списком должностей</li>
                <li>• Связывание должностей с отделами</li>
              </ul>
            </div>
          </section>

          {/* Техническая поддержка */}
          <section className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Техническая поддержка</h2>
            <div className="space-y-3 text-gray-700">
              <p>При возникновении проблем или вопросов по работе системы обращайтесь:</p>
              <ul className="space-y-2 ml-4">
                <li>• Email: support@skud.local</li>
                <li>• Внутренний телефон: доб. 1234</li>
                <li>• Рабочие часы: Пн-Пт, 9:00-18:00</li>
              </ul>
            </div>
          </section>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Версия документации: 1.0</p>
            <p>Дата обновления: {new Date().toLocaleDateString('ru-RU')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
