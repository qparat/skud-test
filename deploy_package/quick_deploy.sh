#!/bin/bash
# -*- coding: utf-8 -*-

"""
Быстрое развертывание системы СКУД на SSH сервере
Выполните этот скрипт после копирования файлов на сервер
"""

echo "🚀 БЫСТРОЕ РАЗВЕРТЫВАНИЕ СИСТЕМЫ СКУД"
echo "====================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Функция проверки команды
check_command() {
    if [ $? -eq 0 ]; then
        log_success "$1"
    else
        log_error "$1"
        exit 1
    fi
}

# Получаем информацию о системе
log_info "Проверка системы..."
echo "Система: $(uname -s)"
echo "Архитектура: $(uname -m)"
echo "Пользователь: $(whoami)"
echo "Домашняя папка: $HOME"

# Проверяем наличие Python
log_info "Проверка Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python найден: $PYTHON_VERSION"
else
    log_error "Python3 не найден! Установите Python3."
    echo "Команда: sudo apt update && sudo apt install -y python3 python3-pip python3-venv"
    exit 1
fi

# Проверяем наличие архива
if [ ! -f "deploy_package.zip" ]; then
    log_warning "Файл deploy_package.zip не найден в текущей директории"
    echo "Скопируйте файл на сервер командой:"
    echo "scp deploy_package.zip user@server:~/"
    
    # Предлагаем альтернативные варианты
    echo ""
    echo "Альтернативные варианты:"
    echo "1. Загрузка через wget:"
    echo "   wget http://your-server.com/deploy_package.zip"
    echo "2. Клонирование из Git:"
    echo "   git clone https://github.com/your-repo/skud-system.git ."
    
    exit 1
fi

# Создаем рабочую директорию
log_info "Создание рабочей директории..."
WORK_DIR="$HOME/skud_system"
if [ -d "$WORK_DIR" ]; then
    log_warning "Директория $WORK_DIR уже существует"
    read -p "Удалить существующую директорию? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$WORK_DIR"
        log_success "Старая директория удалена"
    else
        log_error "Развертывание отменено"
        exit 1
    fi
fi

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"
check_command "Рабочая директория создана: $WORK_DIR"

# Копируем и распаковываем архив
log_info "Распаковка файлов..."
cp ~/deploy_package.zip .
unzip -q deploy_package.zip
check_command "Файлы распакованы"

# Создаем виртуальное окружение
log_info "Создание виртуального окружения..."
python3 -m venv venv
check_command "Виртуальное окружение создано"

# Активируем окружение
log_info "Активация виртуального окружения..."
source venv/bin/activate
check_command "Виртуальное окружение активировано"

# Устанавливаем зависимости
log_info "Установка зависимостей..."
pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    check_command "Зависимости установлены"
else
    log_warning "Файл requirements.txt не найден, пропускаем установку зависимостей"
fi

# Создаем необходимые папки
log_info "Создание структуры папок..."
mkdir -p real_data_input backups logs
check_command "Структура папок создана"

# Делаем скрипты исполняемыми
log_info "Настройка прав доступа..."
chmod +x *.sh
check_command "Права доступа настроены"

# Проверяем наличие базы данных
if [ ! -f "real_skud_data.db" ]; then
    log_warning "База данных не найдена, будет создана при первом запуске"
fi

# Тестируем систему
log_info "Тестирование системы..."
python3 -c "import sqlite3; print('SQLite работает')"
check_command "SQLite протестирован"

# Предлагаем настроить автозапуск
echo ""
log_info "Настройка автозапуска (systemd)..."
if [ -f "skud.service" ]; then
    echo "Для настройки автозапуска выполните:"
    echo "sudo cp skud.service /etc/systemd/system/"
    echo "sudo systemctl daemon-reload"
    echo "sudo systemctl enable skud.service"
    echo "sudo systemctl start skud.service"
else
    log_warning "Файл skud.service не найден"
fi

# Показываем итоговую информацию
echo ""
echo "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "=========================="
echo ""
echo "📁 Рабочая директория: $WORK_DIR"
echo "🐍 Python окружение: $WORK_DIR/venv"
echo "⚙️ Конфигурация: $WORK_DIR/real_skud_config.ini"
echo ""
echo "🚀 Команды для запуска:"
echo "cd $WORK_DIR"
echo "source venv/bin/activate"
echo ""
echo "# Основная система:"
echo "./start_skud.sh"
echo ""
echo "# Мониторинг:"
echo "./monitor.sh basic        # Базовый мониторинг"
echo "./monitor.sh interactive  # Интерактивный анализ"  
echo "./monitor.sh realtime     # Мониторинг в реальном времени"
echo ""
echo "# Оптимизация БД:"
echo "./optimize_db.sh"
echo ""
echo "# Редактор сотрудников:"
echo "python3 employee_editor.py"
echo ""

# Создаем файл с информацией о развертывании
cat > deployment_info.txt << EOF
=== ИНФОРМАЦИЯ О РАЗВЕРТЫВАНИИ ===
Дата развертывания: $(date)
Система: $(uname -a)
Python версия: $(python3 --version)
Рабочая директория: $WORK_DIR
Пользователь: $(whoami)

=== ФАЙЛЫ ===
$(ls -la)

=== СТАТУС ===
Развертывание завершено успешно
EOF

log_success "Информация о развертывании сохранена в deployment_info.txt"

echo ""
log_success "Система СКУД готова к работе!"
echo ""
echo "💡 Следующие шаги:"
echo "1. Поместите файлы данных в папку: real_data_input/"
echo "2. Запустите систему: ./start_skud.sh"
echo "3. Проверьте мониторинг: ./monitor.sh basic"
echo "4. Настройте автозапуск (см. инструкции выше)"