#!/bin/bash

# Скрипт автоматического деплоя СКУД через Docker

set -e

echo "🚀 Начинаем автоматический деплой СКУД..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose down 2>/dev/null || true

# Создаем необходимые директории
echo "📁 Создаем необходимые директории..."
mkdir -p real_data_input
mkdir -p processed_real_skud
mkdir -p backups
mkdir -p logs

# Устанавливаем права доступа
echo "🔐 Устанавливаем права доступа..."
chmod -R 755 real_data_input processed_real_skud backups logs

# Собираем образ
echo "🔨 Собираем Docker образ..."
docker-compose build --no-cache

# Запускаем контейнеры
echo "▶️ Запускаем контейнеры..."
docker-compose up -d

# Проверяем статус
echo "✅ Проверяем статус контейнеров..."
sleep 5
docker-compose ps

echo "📋 Показываем последние логи..."
docker-compose logs --tail=20

echo ""
echo "🎉 Деплой завершен успешно!"
echo ""
echo "Полезные команды:"
echo "  Просмотр логов:     docker-compose logs -f"
echo "  Остановка:          docker-compose down"
echo "  Перезапуск:         docker-compose restart"
echo "  Статус:             docker-compose ps"
echo ""