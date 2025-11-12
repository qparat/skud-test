'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, BookOpen, CheckCircle, AlertCircle, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface InstructionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InstructionModal({ isOpen, onClose }: InstructionModalProps) {
  const [currentPage, setCurrentPage] = useState(0)
  
  // Определяем страницы инструкции (мемоизируем для стабильности ссылки)
  const pages = useMemo(() => [
    {
      title: "Добро пожаловать в систему СКУД",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Система контроля и управления доступом</h3>
            <p className="text-lg text-gray-600 mb-6">
              Добро пожаловать! Эта инструкция поможет вам освоить основные функции системы.
            </p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Что вы узнаете:</h4>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Основные функции и разделы системы
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Навигация и работа с интерфейсом
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Полезные советы и рекомендации
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Контакты технической поддержки
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Основные функции системы",
      content: (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Основные функции системы
          </h3>
          <ul className="space-y-3 text-blue-800">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Панель управления</strong>
                <p className="text-sm text-blue-700 mt-1">Просмотр статистики посещаемости, опозданий и дней рождения. Здесь отображается общая картина по всем сотрудникам за выбранный день.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Сотрудники</strong>
                <p className="text-sm text-blue-700 mt-1">Управление данными сотрудников, просмотр их профилей, добавление новых и редактирование существующих записей.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Расписание</strong>
                <p className="text-sm text-blue-700 mt-1">Просмотр расписания работы сотрудников, времени входа и выхода, фильтрация по различным критериям.</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Отчеты</strong>
                <p className="text-sm text-blue-700 mt-1">Формирование детальных отчетов по посещаемости, экспорт данных в различные форматы.</p>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Навигация и работа с интерфейсом",
      content: (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Навигация и основные действия
          </h3>
          <div className="grid md:grid-cols-1 gap-6">
            <div>
              <h4 className="font-medium text-green-800 mb-3">Работа с календарем:</h4>
              <ul className="space-y-2 text-green-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Выберите дату в календаре для просмотра данных за конкретный день
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Нельзя выбирать будущие даты - они отображаются серым цветом
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Статистика обновляется автоматически при смене даты
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-3">Просмотр деталей:</h4>
              <ul className="space-y-2 text-green-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Нажмите на карточки статистики для просмотра подробных списков
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Используйте фильтры для поиска нужной информации
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Важные моменты и советы",
      content: (
        <div className="space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Важные моменты
            </h3>
            <ul className="space-y-3 text-amber-800">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>При проблемах с подключением используйте кнопку обновления в заголовке</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span>Для выхода из системы используйте кнопку выхода в правом верхнем углу</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Полезные советы:</h4>
            <ul className="space-y-1 text-blue-800 text-sm">
              <li>• Используйте кнопку "На главную" в заголовке для быстрого возврата</li>
              <li>• Статистика на главной странице кликабельна - нажимайте для подробностей</li>
              <li>• Кнопка "?" в заголовке всегда покажет эту инструкцию</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Техническая поддержка",
      content: (
        <div className="space-y-6">
          <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Техническая поддержка
            </h3>
            <div className="space-y-4 text-gray-700">
              <p>
                При возникновении проблем или вопросов обращайтесь к системному администратору.
              </p>
              
              <div className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-900 mb-2">Что делать при проблемах:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Попробуйте обновить страницу (кнопка обновления в заголовке)</li>
                  <li>Проверьте подключение к интернету</li>
                  <li>Очистите кэш браузера</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="text-center bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Спасибо за внимание!</h4>
          </div>
        </div>
      )
    }
  ], [])

  const handleClose = useCallback(() => {
    // Сохраняем текущую дату как дату последнего показа
    localStorage.setItem('instructionLastShown', new Date().toISOString())
    setCurrentPage(0) // Сбрасываем на первую страницу при закрытии
    onClose()
  }, [onClose])

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Добавляем поддержку клавиатурной навигации
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          if (currentPage > 0) setCurrentPage(currentPage - 1)
          break
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          if (currentPage < pages.length - 1) setCurrentPage(currentPage + 1)
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
        case 'Home':
          e.preventDefault()
          setCurrentPage(0)
          break
        case 'End':
          e.preventDefault()
          setCurrentPage(pages.length - 1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentPage, pages.length, handleClose])

  if (!isOpen) return null

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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">{pages[currentPage].title}</h2>
                <p className="text-blue-100 mt-1">Страница {currentPage + 1} из {pages.length}</p>
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

        {/* Содержимое текущей страницы */}
        <div className="p-6 overflow-y-auto min-h-[400px] max-h-[calc(90vh-200px)]">
          {pages[currentPage].content}
        </div>

        {/* Подвал с навигацией */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          {/* Левая часть - кнопка назад */}
          <div>
            {currentPage > 0 ? (
              <button
                onClick={prevPage}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Назад
              </button>
            ) : (
              <div className="w-20 text-xs text-gray-500">
                {/* Подсказка о горячих клавишах */}
                <div className="hidden md:block" title="Горячие клавиши: ← → для навигации, Esc для закрытия">
                  ⌨️ ← →
                </div>
              </div>
            )}
          </div>

          {/* Центр - индикатор страниц */}
          <div className="flex items-center space-x-2">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentPage
                    ? 'bg-blue-600'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Страница ${index + 1}`}
              />
            ))}
          </div>

          {/* Правая часть - кнопка вперед или закрыть */}
          <div>
            {currentPage < pages.length - 1 ? (
              <button
                onClick={nextPage}
                className="flex items-center px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                Далее
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Понятно, закрыть
              </button>
            )}
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