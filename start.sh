#!/bin/bash

# Скрипт для сборки и запуска СКУД системы на сервере

echo "🚀 Запуск системы СКУД с авторизацией (сервер)"
echo "=============================================="

# Получаем IP адрес сервера
SERVER_IP=$(hostname -I | awk '{print $1}')

# Остановка контейнеров если они запущены
echo "🛑 Остановка существующих контейнеров..."
docker compose down

# Пересборка образов
echo "🔨 Сборка Docker образов..."
docker compose build

# Запуск системы
echo "▶️  Запуск системы..."
docker compose up -d

# Проверка статуса
echo "🔍 Проверка статуса контейнеров..."
sleep 5
docker compose ps

echo ""
echo "✅ Система запущена на сервере!"
echo ""
echo "📋 Доступные сервисы:"
echo "   • Frontend:  http://$SERVER_IP"
echo "   • API:       http://$SERVER_IP/api"
echo "   • Nginx:     http://$SERVER_IP:8080"
echo ""
echo "🔐 Создание первого пользователя:"
echo "   docker compose exec backend python create_root_user.py"
echo ""
echo "📊 Просмотр логов:"
echo "   docker compose logs -f [backend|frontend|nginx]"
echo ""
echo "🛑 Остановка системы:"
echo "   docker compose down"