import { FileUpload } from '@/components/FileUpload'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Загрузка СКУД файлов</h1>
          <p className="mt-2 text-gray-600">
            Загрузите txt файлы с данными СКУД для обработки и добавления в систему
          </p>
        </div>
        
        <FileUpload />
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Инструкции</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. Выберите .txt файл с данными СКУД</p>
            <p>2. Файл будет автоматически обработан и данные добавлены в базу</p>
            <p>3. После успешной загрузки вы увидите статистику обработки</p>
            <p>4. Новые сотрудники будут автоматически добавлены в систему</p>
          </div>
        </div>
      </div>
    </div>
  )
}