# Скрипт автоматического деплоя СКУД через Docker (Windows PowerShell)

Write-Host "🚀 Начинаем автоматический деплой СКУД..." -ForegroundColor Green

# Проверяем наличие Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker найден" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не установлен. Установите Docker Desktop и попробуйте снова." -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose найден" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose не найден. Убедитесь что установлен Docker Desktop." -ForegroundColor Red
    exit 1
}

# Останавливаем существующие контейнеры
Write-Host "🛑 Останавливаем существующие контейнеры..." -ForegroundColor Yellow
try {
    docker-compose down 2>$null
} catch {
    # Игнорируем ошибки если контейнеры не запущены
}

# Создаем необходимые директории
Write-Host "📁 Создаем необходимые директории..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "real_data_input" | Out-Null
New-Item -ItemType Directory -Force -Path "processed_real_skud" | Out-Null  
New-Item -ItemType Directory -Force -Path "backups" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Собираем образ
Write-Host "🔨 Собираем Docker образ..." -ForegroundColor Yellow
docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при сборке образа" -ForegroundColor Red
    exit 1
}

# Запускаем контейнеры
Write-Host "▶️ Запускаем контейнеры..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при запуске контейнеров" -ForegroundColor Red
    exit 1
}

# Проверяем статус
Write-Host "✅ Проверяем статус контейнеров..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose ps

Write-Host "📋 Показываем последние логи..." -ForegroundColor Yellow
docker-compose logs --tail=20

Write-Host ""
Write-Host "🎉 Деплой завершен успешно!" -ForegroundColor Green
Write-Host ""
Write-Host "Полезные команды:" -ForegroundColor Cyan
Write-Host "  Просмотр логов:     docker-compose logs -f" -ForegroundColor White
Write-Host "  Остановка:          docker-compose down" -ForegroundColor White
Write-Host "  Перезапуск:         docker-compose restart" -ForegroundColor White
Write-Host "  Статус:             docker-compose ps" -ForegroundColor White
Write-Host ""