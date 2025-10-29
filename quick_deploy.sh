#!/bin/bash

# Скрипт быстрого развертывания SKUD системы с PostgreSQL
# Использование: ./quick_deploy.sh

set -e

echo "🚀 Быстрое развертывание SKUD системы с PostgreSQL"
echo "=================================================="

# Проверка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден. Установите Python3."
    exit 1
fi

# Создание виртуального окружения если его нет
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

# Активация виртуального окружения
echo "🔧 Активация виртуального окружения..."
source venv/bin/activate

# Обновление pip
echo "📋 Обновление pip..."
pip install --upgrade pip

# Установка зависимостей
echo "📦 Установка зависимостей..."
pip install -r requirements.txt

# Проверка наличия PostgreSQL конфигурации
if [ ! -f "postgres_config.ini" ]; then
    echo "⚠️  Файл postgres_config.ini не найден!"
    echo "💡 Создайте его по примеру из SSH_DEPLOYMENT.md"
    echo "📄 Или скопируйте postgres_config.ini.example"
    exit 1
fi

# Тестирование подключения к базе данных
echo "🔍 Тестирование подключения к базе данных..."
python3 -c "
try:
    from clean_api import get_db_connection
    conn = get_db_connection()
    print(f'✅ Подключение успешно: {getattr(conn, \"db_type\", \"unknown\")}')
    conn.close()
except Exception as e:
    print(f'❌ Ошибка подключения: {e}')
    exit(1)
"

# Инициализация базы данных PostgreSQL
echo "🗄️  Инициализация базы данных..."
if [ -f "setup_postgresql.py" ]; then
    python3 setup_postgresql.py
else
    echo "⚠️  setup_postgresql.py не найден, пропускаем..."
fi

# Полное тестирование миграции
echo "🧪 Запуск тестов миграции..."
if [ -f "test_postgresql_migration.py" ]; then
    python3 test_postgresql_migration.py
else
    echo "⚠️  test_postgresql_migration.py не найден, пропускаем тесты..."
fi

# Проверка API
echo "🌐 Проверка API..."
python3 -c "
try:
    from clean_api import app
    print('✅ API модуль загружен успешно')
except Exception as e:
    print(f'❌ Ошибка загрузки API: {e}')
    exit(1)
"

echo ""
echo "✅ Развертывание завершено!"
echo ""
echo "🚀 Для запуска API сервера:"
echo "   source venv/bin/activate"
echo "   uvicorn clean_api:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "📊 Для запуска парсера:"
echo "   source venv/bin/activate" 
echo "   python3 real_skud_parser.py"
echo ""
echo "🔗 API будет доступно по адресу: http://localhost:8000/docs"
echo ""

# Создание скрипта для запуска API
cat > start_api.sh << 'EOF'
#!/bin/bash
source venv/bin/activate
uvicorn clean_api:app --host 0.0.0.0 --port 8000 --reload
EOF

chmod +x start_api.sh

# Создание скрипта для запуска парсера
cat > start_parser.sh << 'EOF'
#!/bin/bash
source venv/bin/activate
python3 real_skud_parser.py
EOF

chmod +x start_parser.sh

echo "📜 Созданы скрипты запуска:"
echo "   ./start_api.sh    - для запуска API"
echo "   ./start_parser.sh - для запуска парсера"