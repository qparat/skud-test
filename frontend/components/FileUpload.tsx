'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2, FolderOpen } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface UploadStats {
  processed_lines: number
  new_employees: number
  new_access_records: number
}

interface UploadResponse {
  success: boolean
  message: string
  stats?: UploadStats
}

interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error'
}

export function FileUpload() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [checkingFolder, setCheckingFolder] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.txt')) {
      setResult({
        success: false,
        message: 'Поддерживаются только .txt файлы'
      })
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-skud-file', {
        method: 'POST',
        body: formData
      })

      // Проверяем, что ответ - это JSON
      const contentType = response.headers.get('content-type')
      let data

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // Если ответ не JSON (например, HTML-страница ошибки)
        const textResponse = await response.text()
        data = {
          detail: response.status === 413 
            ? 'Файл слишком большой. Максимальный размер: 100MB' 
            : `Ошибка сервера (${response.status}): ${textResponse.substring(0, 100)}...`
        }
      }

      if (response.ok) {
        setResult(data)
      } else {
        setResult({
          success: false,
          message: data.detail || `Ошибка загрузки (${response.status})`
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка загрузки файла'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const checkPrishelFolder = async () => {
    setCheckingFolder(true)

    try {
      await apiRequest('check-prishel-folder-now', { method: 'POST' })
      // Сразу загружаем свежие логи
      fetchLogs()
    } catch (error) {
      console.error('Ошибка запуска проверки:', error)
    } finally {
      setCheckingFolder(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const data = await apiRequest('folder-check-logs')
      if (data.success && data.logs) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Ошибка получения логов:', error)
    }
  }

  // Автоматическое обновление логов каждые 5 секунд
  useEffect(() => {
    // Первая загрузка логов
    fetchLogs()
    
    // Обновляем логи каждые 5 секунд
    const intervalId = setInterval(fetchLogs, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Загрузка СКУД файла</h3>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12">
              {uploading ? (
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400" />
              )}
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900">
                {uploading ? 'Загрузка файла...' : 'Перетащите файл сюда или выберите'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Поддерживаются только .txt файлы
              </p>
            </div>

            {!uploading && (
              <div>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Выбрать файл
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Check folder button */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Автоматическая загрузка из папки</h3>
        <p className="text-sm text-gray-600 mb-4">
          Сервер автоматически проверяет папку <code className="bg-gray-100 px-2 py-1 rounded">prishel_txt</code> каждые 30 минут
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={checkPrishelFolder}
              disabled={checkingFolder || uploading}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {checkingFolder ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4 mr-2" />
              )}
              {checkingFolder ? 'Запуск проверки...' : 'Проверить сейчас'}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>
                Автопроверка активна на сервере (каждые 30 минут)
              </span>
            </div>
          </div>
        </div>

        {/* Console Log */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Консоль:</h4>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Очистить
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500">Ожидание событий...</div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className={`${
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    'text-gray-300'
                  }`}>
                    <span className="text-gray-500">[{log.time}]</span> {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Folder check result */}
      {folderResult && (
        <div className={`rounded-lg p-4 ${
          folderResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {folderResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div className="ml-3 w-full">
              <h4 className={`text-sm font-medium ${
                folderResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {folderResult.success ? 'Папка успешно обработана!' : 'Ошибка обработки папки'}
              </h4>
              <p className={`text-sm mt-1 ${
                folderResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {folderResult.message}
              </p>

              {folderResult.success && folderResult.files_processed !== undefined && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-green-800">
                    Обработано файлов: {folderResult.files_processed}
                  </p>
                  
                  {folderResult.total_stats && (
                    <div className="mt-2 space-y-1 text-sm text-green-700">
                      <p>• Всего строк: {folderResult.total_stats.processed_lines}</p>
                      <p>• Новых сотрудников: {folderResult.total_stats.new_employees}</p>
                      <p>• Новых записей доступа: {folderResult.total_stats.new_access_records}</p>
                    </div>
                  )}

                  {folderResult.results && folderResult.results.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-green-800">Детали по файлам:</p>
                      {folderResult.results.map((fileResult, index) => (
                        <div key={index} className={`text-sm p-2 rounded ${
                          fileResult.success ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <p className="font-medium">{fileResult.filename}</p>
                          {fileResult.success && fileResult.stats && (
                            <p className="text-xs text-green-700 mt-1">
                              Строк: {fileResult.stats.processed_lines}, 
                              Новых сотрудников: {fileResult.stats.new_employees}, 
                              Записей: {fileResult.stats.new_access_records}
                            </p>
                          )}
                          {!fileResult.success && fileResult.error && (
                            <p className="text-xs text-red-700 mt-1">Ошибка: {fileResult.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-lg p-4 ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? 'Файл успешно загружен!' : 'Ошибка загрузки'}
              </h4>
              <p className={`text-sm mt-1 ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>

              {result.success && result.stats && (
                <div className="mt-3 space-y-1 text-sm text-green-700">
                  <p>• Обработано строк: {result.stats.processed_lines}</p>
                  <p>• Новых сотрудников: {result.stats.new_employees}</p>
                  <p>• Новых записей доступа: {result.stats.new_access_records}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
