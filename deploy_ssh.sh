#!/bin/bash
# -*- coding: utf-8 -*-

"""
Скрипт развертывания системы СКУД на SSH сервере
"""

echo "🚀 РАЗВЕРТЫВАНИЕ СИСТЕМЫ СКУД НА SSH СЕРВЕРЕ"
echo "============================================="

# Функция для проверки успешности команды
check_command() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ $1"
        exit 1
    fi
}

# 1. Проверка операционной системы
echo ""
echo "🔍 Проверка системы..."
uname -a
check_command "Информация о системе получена"

# 2. Проверка Python
echo ""
echo "🐍 Проверка Python..."
python3 --version
check_command "Python установлен"

# 3. Проверка pip
pip3 --version
check_command "pip установлен"

# 4. Создание рабочей директории
echo ""
echo "📁 Создание рабочей директории..."
mkdir -p ~/skud_system
cd ~/skud_system
check_command "Рабочая директория создана"

# 5. Создание виртуального окружения
echo ""
echo "🔧 Создание виртуального окружения..."
python3 -m venv venv
check_command "Виртуальное окружение создано"

# 6. Активация виртуального окружения
echo ""
echo "⚡ Активация виртуального окружения..."
source venv/bin/activate
check_command "Виртуальное окружение активировано"

# 7. Создание структуры папок
echo ""
echo "📂 Создание структуры папок..."
mkdir -p real_data_input
mkdir -p backups
mkdir -p logs
mkdir -p src
check_command "Структура папок создана"

# 8. Создание файла requirements.txt
echo ""
echo "📋 Создание requirements.txt..."
cat > requirements.txt << EOF
# Зависимости для системы СКУД
configparser
pathlib2
EOF
check_command "requirements.txt создан"

# 9. Установка зависимостей
echo ""
echo "📦 Установка зависимостей..."
pip install -r requirements.txt
check_command "Зависимости установлены"

# 10. Создание конфигурационного файла
echo ""
echo "⚙️ Создание конфигурации..."
cat > real_skud_config.ini << 'EOF'
[MONITORING]
watch_directory = real_data_input
check_interval = 30
backup_enabled = true
max_backup_files = 10

[DATABASE]
db_file = real_skud_data.db
wal_mode = true
optimize_on_startup = true

[FILTERING]
exclude_employees = Охрана М., 1 пост о., 2 пост о., Крыша К.
exclude_doors = выход паркинг, 1эт серверная, Студия - вн.мир, Паркинг - лифт.холл, 2 лст - внешн.мир

[LOGGING]
level = INFO
log_to_file = true
log_file = logs/skud_system.log
EOF
check_command "Конфигурация создана"

echo ""
echo "🎉 БАЗОВАЯ НАСТРОЙКА ЗАВЕРШЕНА!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Скопируйте файлы системы на сервер"
echo "2. Настройте автозапуск через systemd"
echo "3. Настройте мониторинг"
echo ""
echo "📁 Структура создана в: ~/skud_system/"