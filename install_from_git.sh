#!/bin/bash
# -*- coding: utf-8 -*-

"""
Автоматическое развертывание системы СКУД через Git
"""

echo "🚀 РАЗВЕРТЫВАНИЕ СИСТЕМЫ СКУД ЧЕРЕЗ GIT"
echo "======================================"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL вашего Git репозитория (замените на ваш)
GIT_REPO_URL="https://github.com/yourusername/skud-system.git"

# Функции для логирования
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

# Проверяем систему
log_info "Проверка системы..."
echo "Система: $(uname -s)"
echo "Пользователь: $(whoami)"
echo "Домашняя папка: $HOME"

# Проверяем наличие Git
log_info "Проверка Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    log_success "Git найден: $GIT_VERSION"
else
    log_error "Git не найден! Установите Git."
    echo "Ubuntu/Debian: sudo apt update && sudo apt install -y git"
    echo "CentOS/RHEL: sudo yum install -y git"
    echo "Alpine: sudo apk add git"
    exit 1
fi

# Проверяем Python
log_info "Проверка Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python найден: $PYTHON_VERSION"
else
    log_error "Python3 не найден! Установите Python3."
    echo "Ubuntu/Debian: sudo apt install -y python3 python3-pip python3-venv"
    exit 1
fi

# Определяем рабочую директорию
WORK_DIR="$HOME/skud_system"

# Спрашиваем URL репозитория
echo ""
log_info "Настройка Git репозитория..."
read -p "Введите URL Git репозитория (или Enter для локальной установки): " REPO_INPUT

if [ ! -z "$REPO_INPUT" ]; then
    GIT_REPO_URL="$REPO_INPUT"
    USE_GIT=true
    log_info "Будет использован репозиторий: $GIT_REPO_URL"
else
    USE_GIT=false
    log_info "Будет использована локальная установка"
fi

# Создаем/очищаем рабочую директорию
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

# Клонируем репозиторий или создаем директорию
if [ "$USE_GIT" = true ]; then
    log_info "Клонирование репозитория..."
    git clone "$GIT_REPO_URL" "$WORK_DIR"
    check_command "Репозиторий склонирован"
else
    log_info "Создание рабочей директории..."
    mkdir -p "$WORK_DIR"
    check_command "Рабочая директория создана"
fi

cd "$WORK_DIR"

# Если не используем Git, создаем базовые файлы
if [ "$USE_GIT" = false ]; then
    log_info "Создание базовой структуры..."
    mkdir -p src real_data_input backups logs
    
    # Создаем базовую конфигурацию
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
    
    # Создаем requirements.txt
    cat > requirements.txt << 'EOF'
# Зависимости для системы СКУД
configparser
pathlib2
EOF
    
    log_success "Базовая структура создана"
fi

# Создаем виртуальное окружение
log_info "Создание виртуального окружения..."
python3 -m venv venv
check_command "Виртуальное окружение создано"

# Активируем окружение
log_info "Активация виртуального окружения..."
source venv/bin/activate
check_command "Виртуальное окружение активировано"

# Обновляем pip
log_info "Обновление pip..."
pip install --upgrade pip
check_command "pip обновлен"

# Устанавливаем зависимости
if [ -f "requirements.txt" ]; then
    log_info "Установка зависимостей..."
    pip install -r requirements.txt
    check_command "Зависимости установлены"
else
    log_warning "Файл requirements.txt не найден"
fi

# Создаем недостающие папки
log_info "Создание структуры папок..."
mkdir -p real_data_input backups logs
check_command "Структура папок создана"

# Делаем скрипты исполняемыми
if [ -f "start_skud.sh" ]; then
    chmod +x *.sh
    log_success "Права доступа настроены"
fi

# Проверяем основные файлы
log_info "Проверка файлов системы..."
ESSENTIAL_FILES=(
    "main_real_skud.py"
    "real_skud_config.ini"
    "skud_monitor.py"
)

MISSING_FILES=()
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "Найден: $file"
    else
        log_warning "Отсутствует: $file"
        MISSING_FILES+=("$file")
    fi
done

# Создаем скрипты запуска, если их нет
if [ ! -f "start_skud.sh" ]; then
    log_info "Создание скрипта запуска..."
    cat > start_skud.sh << 'EOF'
#!/bin/bash
# Запуск основной системы СКУД

cd "$(dirname "$0")"
source venv/bin/activate

echo "🚀 Запуск системы СКУД..."
python3 main_real_skud.py
EOF
    chmod +x start_skud.sh
    log_success "Скрипт запуска создан"
fi

if [ ! -f "monitor.sh" ]; then
    log_info "Создание скрипта мониторинга..."
    cat > monitor.sh << 'EOF'
#!/bin/bash
# Запуск мониторинга СКУД

cd "$(dirname "$0")"
source venv/bin/activate

case "$1" in
    "basic")
        echo "📊 Запуск базового мониторинга..."
        python3 skud_monitor.py
        ;;
    "interactive")
        echo "🔍 Запуск интерактивного мониторинга..."
        python3 interactive_monitor.py
        ;;
    "realtime")
        echo "⏱️ Запуск мониторинга в реальном времени..."
        python3 minute_monitor.py
        ;;
    *)
        echo "Использование: $0 {basic|interactive|realtime}"
        exit 1
        ;;
esac
EOF
    chmod +x monitor.sh
    log_success "Скрипт мониторинга создан"
fi

# Тестируем систему
log_info "Тестирование системы..."
python3 -c "import sqlite3; print('✅ SQLite работает')"
python3 -c "import configparser; print('✅ ConfigParser работает')"
check_command "Базовые модули протестированы"

# Создаем информацию о развертывании
cat > deployment_info.txt << EOF
=== ИНФОРМАЦИЯ О РАЗВЕРТЫВАНИИ ===
Дата развертывания: $(date)
Метод: Git
Репозиторий: $GIT_REPO_URL
Система: $(uname -a)
Python версия: $(python3 --version)
Рабочая директория: $WORK_DIR
Пользователь: $(whoami)

=== ФАЙЛЫ ===
$(ls -la)

=== СТАТУС ===
Развертывание через Git завершено успешно
EOF

# Показываем итоговую информацию
echo ""
echo "🎉 РАЗВЕРТЫВАНИЕ ЧЕРЕЗ GIT ЗАВЕРШЕНО!"
echo "===================================="
echo ""
echo "📁 Рабочая директория: $WORK_DIR"
echo "🐍 Python окружение: $WORK_DIR/venv"
echo "⚙️ Конфигурация: $WORK_DIR/real_skud_config.ini"

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    log_warning "Отсутствующие файлы:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "💡 Скопируйте недостающие файлы в $WORK_DIR"
fi

echo ""
echo "🚀 Команды для запуска:"
echo "cd $WORK_DIR"
echo "source venv/bin/activate"
echo ""
if [ -f "start_skud.sh" ]; then
    echo "# Основная система:"
    echo "./start_skud.sh"
    echo ""
fi
if [ -f "monitor.sh" ]; then
    echo "# Мониторинг:"
    echo "./monitor.sh basic        # Базовый мониторинг"
    echo "./monitor.sh interactive  # Интерактивный анализ"
    echo "./monitor.sh realtime     # Мониторинг в реальном времени"
    echo ""
fi

echo "# Прямой запуск:"
echo "python3 main_real_skud.py         # Основная система"
echo "python3 skud_monitor.py           # Мониторинг"
echo "python3 employee_editor.py        # Редактор сотрудников"

echo ""
log_success "Система готова к использованию!"

if [ "$USE_GIT" = true ]; then
    echo ""
    echo "💡 Для обновления системы используйте:"
    echo "cd $WORK_DIR && git pull"
fi