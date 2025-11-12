'use client'

import { useState, useEffect } from 'react'
import { X, BookOpen, CheckCircle, AlertCircle, Users, Calendar } from 'lucide-react'

interface InstructionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InstructionModal({ isOpen, onClose }: InstructionModalProps) {
  if (!isOpen) return null

  const handleClose = () => {
    // Сохраняем текущую дату как дату последнего показа
    localStorage.setItem('instructionLastShown', new Date().toISOString())
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Инструкция по работе с системой СКУД</h2>
                <p className="text-blue-100 mt-1">Краткое руководство пользователя</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Основные функции */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Основные функции системы
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Панель управления</strong> - просмотр статистики посещаемости, опозданий и дней рождения</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Сотрудники</strong> - управление данными сотрудников и просмотр их профилей</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Расписание</strong> - просмотр расписания работы и времени входа/выхода</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Отчеты</strong> - формирование детальных отчетов по посещаемости</span>
                </li>
              </ul>
            </div>

            {/* Навигация */}
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Навигация и основные действия
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Работа с календарем:</h4>
                  <ul className="space-y-1 text-green-700 text-sm">
                    <li>• Выберите дату в календаре для просмотра данных за конкретный день</li>
                    <li>• Нельзя выбирать будущие даты</li>
                    <li>• Статистика обновляется автоматически при смене даты</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Просмотр деталей:</h4>
                  <ul className="space-y-1 text-green-700 text-sm">
                    <li>• Нажмите на карточки статистики для просмотра списков</li>
                    <li>• Кликните по имени сотрудника для открытия профиля</li>
                    <li>• Используйте фильтры для поиска нужной информации</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Важные моменты */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Важные моменты
              </h3>
              <ul className="space-y-2 text-amber-800">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Данные обновляются в реальном времени каждые несколько минут</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>При проблемах с подключением используйте кнопку обновления в заголовке</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Все времена отображаются в местном часовом поясе</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Для выхода из системы используйте кнопку выхода в правом верхнем углу</span>
                </li>
              </ul>
            </div>

            {/* Техническая поддержка */}
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Техническая поддержка
              </h3>
              <p className="text-gray-700">
                При возникновении проблем или вопросов обращайтесь к системному администратору. 
                Также вы можете использовать функцию обновления данных в заголовке системы.
              </p>
            </div>
          </div>
        </div>

        {/* Подвал */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Эта инструкция появляется автоматически раз в месяц
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Понятно, закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Хук для управления показом инструкции
export function useInstructionModal() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const checkShouldShowInstruction = () => {
      const lastShown = localStorage.getItem('instructionLastShown')
      
      if (!lastShown) {
        // Если инструкция никогда не показывалась, показываем её
        setShowModal(true)
        return
      }

      const lastShownDate = new Date(lastShown)
      const now = new Date()
      
      // Вычисляем разность в днях
      const diffTime = now.getTime() - lastShownDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Показываем если прошло больше 30 дней (месяц)
      if (diffDays >= 30) {
        setShowModal(true)
      }
    }

    // Проверяем при загрузке компонента
    checkShouldShowInstruction()
  }, [])

  const closeModal = () => {
    setShowModal(false)
  }

  const showInstructions = () => {
    setShowModal(true)
  }

  return { showModal, closeModal, showInstructions }
}