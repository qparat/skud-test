'use client'

import { BookOpen, Users, Calendar, Shield, Upload, FileText, Settings, Building2, Briefcase } from 'lucide-react'

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
                <li>• Отображается информация о времени прихода, ухода, опозданиях, часах работы и статус</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Выбор даты</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Нажмите на кнопку "Календарь" для выбора даты</li>
                <li>• Первый клик - выделяет дату</li>
                <li>• Второй клик по той же дате - загружает данные за день</li>
                <li>• Клик по второй другой дате - создает диапазон дат</li>
                <li>• Кнопка "Очистить" возвращает к текущему дню</li>
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
                <li>• Клик по сотруднику открывает детальную информацию о сотруднике</li>
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
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">3. Отчеты</h2>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">Доступные типы отчетов</h3>
              <p className="text-blue-800">Система предоставляет различные типы отчетов для анализа данных о посещаемости и учете сотрудников</p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">3.1. Отчет СВОД</h3>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="text-base font-semibold mb-3">Просмотр и редактирование отчета</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Перейдите в раздел "Отчет СВОД" в главном меню</li>
                  <li>• Отображается список всех сотрудников с их должностями в порядке очередности</li>
                  <li>• Сотрудники отображаются в том порядке, в котором они будут выгружены в Excel</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="text-base font-semibold mb-3">Изменение порядка сотрудников</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Зажмите</strong> левую кнопку мыши на карточке сотрудника</li>
                  <li>• <strong>Перетащите</strong> карточку вверх или вниз на нужную позицию</li>
                  <li>• <strong>Отпустите</strong> кнопку мыши для фиксации новой позиции</li>
                  <li>• Порядок автоматически сохраняется</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="text-base font-semibold mb-3">Добавление сотрудника с должностью</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Нажмите кнопку "Добавить сотрудника"</li>
                  <li>• Выберите сотрудника из выпадающего списка</li>
                  <li>• При необходимости выберите должность (можно отличную от основной)</li>
                  <li>• Нажмите "Добавить" для подтверждения</li>
                  <li>• Сотрудник появится в конце списка, затем его можно перетащить на нужную позицию</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="text-base font-semibold mb-3">Добавление должности без сотрудника</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Нажмите кнопку "Добавить должность"</li>
                  <li>• Введите название должности в поле</li>
                  <li>• Нажмите "Добавить"</li>
                  <li>• Используется для вакантных позиций или планируемых должностей</li>
                  <li>• Должность отображается без ФИО сотрудника</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="text-base font-semibold mb-3">Предварительный просмотр</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Нажмите кнопку "Посмотреть таблицу"</li>
                  <li>• Откроется окно с предпросмотром того, как будет выглядеть отчет в Excel</li>
                  <li>• Проверьте порядок сотрудников и должностей</li>
                  <li>• Закройте окно для возврата к редактированию</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <h4 className="text-base font-semibold mb-3">Выгрузка отчета</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Нажмите кнопку "Выгрузить" для создания Excel файла</li>
                  <li>• Файл автоматически скачается с именем "Свод_отчет_ГГГГ-ММ-ДД.xlsx"</li>
                  <li>• В отчете будут указаны все сотрудники и должности в установленном порядке</li>
                  <li>• Отчет готов для печати или отправки</li>
                </ul>
              </div>
            </div>

          </section>

          {/* Раздел 4 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">4. Службы</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Просмотр служб</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Перейдите в раздел "Службы"</li>
                <li>• Отображается список всех служб/отделов организации</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Создание новой службы</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Нажмите кнопку "Добавить службу"</li>
                <li>• Введите название службы</li>
                <li>• Сохраните изменения</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Редактирование и удаление</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Нажмите на службу для редактирования названия</li>
                <li>• Используйте кнопку "Удалить" для удаления службы</li>
                <li>• <strong>Внимание:</strong> Удаление службы возможно только если в ней нет сотрудников</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Добавление сотрудников и должностей в службы</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Нажмите на службу для редактирования</li>
                <li>• Выберите сотрудников из списка</li>
                <li>• Нажмите "Добавить" для подтверждения</li>
              </ul>
            </div>
          </section>

          {/* Раздел 5 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">5. Должности</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Управление должностями</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Перейдите в раздел "Должности"</li>
                <li>• Просмотрите список всех должностей</li>
                <li>• Создавайте новые должности для организации</li>
                <li>• Изменяйте созданные должности для организации</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Связь должностей со службами</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Каждая должность может быть связана с несколькими службами</li>
                <li>• При назначении должности сотруднику проверяется соответствие его службе</li>
                <li>• Настройте связи через раздел "Управление связями"</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Добавление и удаление</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Нажмите "Добавить должность" для создания новой</li>
                <li>• Введите название должности</li>
                <li>• Удаление возможно только если должность не назначена сотрудникам</li>
              </ul>
            </div>
          </section>

          {/* Раздел 6 */}
          <section className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">6. Исключения</h2>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Создание исключения</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Перейдите в раздел "Исключения"</li>
                <li>• Нажмите "Добавить исключение"</li>
                <li>• Выберите сотрудника из выпадающего списка</li>
                <li>• Откройте календарь и выберите дату исключения</li>
                <li>• В поле "Примечание" укажите причину исключения (например: "Отпуск", "Больничный", "Командировка")</li>
                <li>• Нажмите "Сохранить" для создания исключения</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Диапазон дат</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Для создания исключения на несколько дней используйте "Диапазон дат"</li>
                <li>• Выберите начальную дату в календаре</li>
                <li>• Выберите конечную дату в календаре</li>
                <li>• Исключение будет применено ко всем дням в выбранном диапазоне</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Просмотр и удаление исключений</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Все созданные исключения отображаются в таблице</li>
                <li>• Используйте фильтры для поиска по ФИО, дате или причине</li>
                <li>• Для удаления исключения нажмите кнопку "Удалить" напротив записи</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
