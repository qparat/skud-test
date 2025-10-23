#!/bin/bash#!/bin/bash#!/bin/bash



# Скрипт автоматического деплоя СКУД через Docker с Nginx



set -e# Скрипт автоматического деплоя СКУД через Docker# Скрипт автоматического деплоя СКУД через Docker



echo "🚀 Начинаем автоматический деплой СКУД системы с Nginx..."



# Проверяем наличие Dockerset -eset -e

if ! command -v docker &> /dev/null; then

    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."

    exit 1

fiecho "🚀 Начинаем автоматический деплой СКУД системы..."echo "🚀 Начинаем автоматический деплой СКУД..."



if ! command -v docker-compose &> /dev/null; then

    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."

    exit 1# Проверяем наличие Docker# Проверяем наличие Docker

fi

if ! command -v docker &> /dev/null; thenif ! command -v docker &> /dev/null; then

# Останавливаем существующие контейнеры

echo "🛑 Останавливаем существующие контейнеры..."    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."

docker-compose down 2>/dev/null || true

    exit 1    exit 1

# Создаем необходимые директории

echo "📁 Создаем необходимые директории..."fifi

mkdir -p data_input

mkdir -p uploads



# Устанавливаем права доступаif ! command -v docker-compose &> /dev/null; thenif ! command -v docker-compose &> /dev/null; then

echo "🔐 Устанавливаем права доступа..."

chmod -R 755 data_input uploads    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."



# Собираем образы    exit 1    exit 1

echo "🔨 Собираем Docker образы..."

docker-compose build --no-cachefifi



# Запускаем контейнеры

echo "▶️ Запускаем контейнеры..."

docker-compose up -d# Останавливаем существующие контейнеры# Останавливаем существующие контейнеры



# Проверяем статусecho "🛑 Останавливаем существующие контейнеры..."echo "🛑 Останавливаем существующие контейнеры..."

echo "✅ Проверяем статус контейнеров..."

sleep 15docker-compose down 2>/dev/null || truedocker-compose down 2>/dev/null || true

docker-compose ps



echo "📋 Показываем последние логи..."

docker-compose logs --tail=20# Создаем необходимые директории# Создаем необходимые директории



echo ""echo "📁 Создаем необходимые директории..."echo "📁 Создаем необходимые директории..."

echo "🎉 Деплой завершен успешно!"

echo ""mkdir -p data_inputmkdir -p real_data_input

echo "📱 Приложение доступно по адресам:"

echo "  Главная страница:      http://localhost"mkdir -p uploadsmkdir -p processed_real_skud

echo "  Frontend (прямой):     http://localhost:3000"

echo "  Backend API:           http://localhost/api"mkdir -p backups

echo "  API документация:      http://localhost/docs"

echo "  Health check API:      http://localhost/health"# Устанавливаем права доступаmkdir -p logs

echo "  Nginx health:          http://localhost:8080/nginx-health"

echo ""echo "🔐 Устанавливаем права доступа..."

echo "Полезные команды:"

echo "  Просмотр логов:     docker-compose logs -f"chmod -R 755 data_input uploads# Устанавливаем права доступа

echo "  Остановка:          docker-compose down"

echo "  Перезапуск:         docker-compose restart"echo "🔐 Устанавливаем права доступа..."

echo "  Статус:             docker-compose ps"

echo ""# Собираем образыchmod -R 755 real_data_input processed_real_skud backups logs

echo "🔨 Собираем Docker образы..."

docker-compose build --no-cache# Собираем образ

echo "🔨 Собираем Docker образ..."

# Запускаем контейнерыdocker-compose build --no-cache

echo "▶️ Запускаем контейнеры..."

docker-compose up -d# Запускаем контейнеры

echo "▶️ Запускаем контейнеры..."

# Проверяем статусdocker-compose up -d

echo "✅ Проверяем статус контейнеров..."

sleep 10# Проверяем статус

docker-compose psecho "✅ Проверяем статус контейнеров..."

sleep 5

echo "📋 Показываем последние логи..."docker-compose ps

docker-compose logs --tail=20

echo "📋 Показываем последние логи..."

echo ""docker-compose logs --tail=20

echo "🎉 Деплой завершен успешно!"

echo ""echo ""

echo "📱 Приложение доступно по адресам:"echo "🎉 Деплой завершен успешно!"

echo "  Frontend:           http://localhost:3000"echo ""

echo "  Backend API:        http://localhost:8003"echo "Полезные команды:"

echo "  API документация:   http://localhost:8003/docs"echo "  Просмотр логов:     docker-compose logs -f"

echo ""echo "  Остановка:          docker-compose down"

echo "Полезные команды:"echo "  Перезапуск:         docker-compose restart"

echo "  Просмотр логов:     docker-compose logs -f"echo "  Статус:             docker-compose ps"

echo "  Остановка:          docker-compose down"echo ""
echo "  Перезапуск:         docker-compose restart"
echo "  Статус:             docker-compose ps"
echo ""