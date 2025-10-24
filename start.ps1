# PowerShell скрипт для сборки и запуска СКУД системы на сервере

Write-Host "🚀 Запуск системы СКУД с авторизацией (сервер)" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Получаем IP адрес сервера
$ServerIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object {$_.IPAddress -notlike "169.254.*" -and $_.IPAddress -notlike "127.*"})[0].IPAddress
if (!$ServerIP) { $ServerIP = "YOUR_SERVER_IP" }

# Остановка контейнеров если они запущены
Write-Host "🛑 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker compose down

# Пересборка образов
Write-Host "🔨 Сборка Docker образов..." -ForegroundColor Yellow
docker compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при сборке образов!" -ForegroundColor Red
    exit 1
}

# Запуск системы
Write-Host "▶️  Запуск системы..." -ForegroundColor Yellow
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при запуске системы!" -ForegroundColor Red
    exit 1
}

# Проверка статуса
Write-Host "🔍 Проверка статуса контейнеров..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker compose ps

Write-Host ""
Write-Host "✅ Система запущена на сервере!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Доступные сервисы:" -ForegroundColor Cyan
Write-Host "   • Frontend:  http://$ServerIP" -ForegroundColor White
Write-Host "   • API:       http://$ServerIP/api" -ForegroundColor White
Write-Host "   • Nginx:     http://$ServerIP`:8080" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Создание первого пользователя:" -ForegroundColor Cyan
Write-Host "   docker compose exec backend python create_root_user.py" -ForegroundColor White
Write-Host ""
Write-Host "📊 Просмотр логов:" -ForegroundColor Cyan
Write-Host "   docker compose logs -f [backend|frontend|nginx]" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Остановка системы:" -ForegroundColor Cyan
Write-Host "   docker compose down" -ForegroundColor White