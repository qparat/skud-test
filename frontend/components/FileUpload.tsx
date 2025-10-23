'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'
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

export function FileUpload() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)

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

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setResult({
          success: false,
          message: data.detail || 'Ошибка загрузки файла'
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
