#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт подготовки файлов для развертывания на SSH сервере
"""

import os
import shutil
import zipfile
from pathlib import Path

def create_deployment_package():
    """Создает пакет для развертывания на SSH сервере"""
    
    print("📦 СОЗДАНИЕ ПАКЕТА ДЛЯ РАЗВЕРТЫВАНИЯ")
    print("=" * 50)
    
    # Создаем папку для развертывания
    deploy_dir = Path("deploy_package")
    if deploy_dir.exists():
        shutil.rmtree(deploy_dir)
    deploy_dir.mkdir()
    
    print(f"📁 Создана папка: {deploy_dir}")
    
    # Список файлов для копирования
    files_to_copy = [
        "main_real_skud.py",
        "real_skud_config.ini", 
        "skud_monitor.py",
        "interactive_monitor.py",
        "minute_monitor.py",
        "employee_editor.py",
        "setup_production_sqlite.py",
        "requirements.txt"
    ]
    
    # Папки для копирования
    dirs_to_copy = [
        "src",
        "real_data_input"
    ]
    
    # Копируем файлы
    print("\n📄 Копирование файлов:")
    for file_name in files_to_copy:
        if os.path.exists(file_name):
            shutil.copy2(file_name, deploy_dir)
            print(f"   ✅ {file_name}")
        else:
            print(f"   ❌ {file_name} (не найден)")
    
    # Копируем папки
    print("\n📂 Копирование папок:")
    for dir_name in dirs_to_copy:
        if os.path.exists(dir_name):
            shutil.copytree(dir_name, deploy_dir / dir_name)
            print(f"   ✅ {dir_name}/")
        else:
            print(f"   ❌ {dir_name}/ (не найдена)")
    
    # Создаем скрипты запуска для Linux
    create_linux_scripts(deploy_dir)
    
    # Создаем архив
    create_archive(deploy_dir)
    
    print(f"\n🎉 Пакет готов в папке: {deploy_dir}")
    print(f"📦 Архив создан: deploy_package.zip")

def create_linux_scripts(deploy_dir):
    """Создает скрипты запуска для Linux"""
    
    print("\n🐧 Создание Linux скриптов:")
    
    # Скрипт активации окружения
    activate_script = """#!/bin/bash
# Активация виртуального окружения и запуск системы СКУД

cd "$(dirname "$0")"

# Проверяем виртуальное окружение
if [ ! -d "venv" ]; then
    echo "❌ Виртуальное окружение не найдено!"
    echo "   Запустите сначала: bash deploy_ssh.sh"
    exit 1
fi

# Активируем окружение
source venv/bin/activate

echo "✅ Виртуальное окружение активировано"
echo "📁 Рабочая директория: $(pwd)"
"""
    
    with open(deploy_dir / "activate.sh", "w", encoding="utf-8") as f:
        f.write(activate_script)
    os.chmod(deploy_dir / "activate.sh", 0o755)
    print("   ✅ activate.sh")
    
    # Скрипт запуска основной системы
    main_script = """#!/bin/bash
# Запуск основной системы СКУД

cd "$(dirname "$0")"
source venv/bin/activate

echo "🚀 Запуск системы СКУД..."
python3 main_real_skud.py
"""
    
    with open(deploy_dir / "start_skud.sh", "w", encoding="utf-8") as f:
        f.write(main_script)
    os.chmod(deploy_dir / "start_skud.sh", 0o755)
    print("   ✅ start_skud.sh")
    
    # Скрипт мониторинга
    monitor_script = """#!/bin/bash
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
        echo ""
        echo "Доступные режимы:"
        echo "  basic       - Базовый мониторинг"
        echo "  interactive - Интерактивный анализ"
        echo "  realtime    - Мониторинг в реальном времени"
        exit 1
        ;;
esac
"""
    
    with open(deploy_dir / "monitor.sh", "w", encoding="utf-8") as f:
        f.write(monitor_script)
    os.chmod(deploy_dir / "monitor.sh", 0o755)
    print("   ✅ monitor.sh")
    
    # Скрипт оптимизации БД
    optimize_script = """#!/bin/bash
# Оптимизация базы данных СКУД

cd "$(dirname "$0")"
source venv/bin/activate

echo "🔧 Оптимизация базы данных..."
python3 setup_production_sqlite.py
"""
    
    with open(deploy_dir / "optimize_db.sh", "w", encoding="utf-8") as f:
        f.write(optimize_script)
    os.chmod(deploy_dir / "optimize_db.sh", 0o755)
    print("   ✅ optimize_db.sh")
    
    # Systemd сервис
    service_script = """[Unit]
Description=SKUD Monitoring System
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/skud_system
ExecStart=/home/ubuntu/skud_system/venv/bin/python /home/ubuntu/skud_system/main_real_skud.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
"""
    
    with open(deploy_dir / "skud.service", "w", encoding="utf-8") as f:
        f.write(service_script)
    print("   ✅ skud.service")

def create_archive(deploy_dir):
    """Создает ZIP архив для передачи"""
    
    with zipfile.ZipFile("deploy_package.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(deploy_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, deploy_dir)
                zipf.write(file_path, arcname)

def create_deployment_instructions():
    """Создает инструкции по развертыванию"""
    
    instructions = """# 🚀 ИНСТРУКЦИИ ПО РАЗВЕРТЫВАНИЮ СИСТЕМЫ СКУД НА SSH СЕРВЕРЕ

## 📋 Пошаговое развертывание

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Python и необходимых пакетов
sudo apt install -y python3 python3-pip python3-venv sqlite3

# Создание пользователя (если нужно)
sudo useradd -m -s /bin/bash skud
sudo usermod -aG sudo skud
```

### 2. Копирование файлов

```bash
# Создание рабочей директории
mkdir -p ~/skud_system
cd ~/skud_system

# Загрузка файлов (используйте один из способов):

# Способ 1: через scp
scp deploy_package.zip user@server:~/skud_system/

# Способ 2: через git clone (если используете репозиторий)
git clone <ваш_репозиторий> .

# Способ 3: через wget (если файлы на веб-сервере)
wget <ссылка_на_архив>

# Распаковка архива
unzip deploy_package.zip
```

### 3. Настройка окружения

```bash
# Создание виртуального окружения
python3 -m venv venv

# Активация окружения
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Создание необходимых папок
mkdir -p real_data_input backups logs
```

### 4. Настройка автозапуска (systemd)

```bash
# Копирование файла сервиса
sudo cp skud.service /etc/systemd/system/

# Правка путей в сервисе (если нужно)
sudo nano /etc/systemd/system/skud.service

# Перезагрузка systemd
sudo systemctl daemon-reload

# Включение автозапуска
sudo systemctl enable skud.service

# Запуск сервиса
sudo systemctl start skud.service

# Проверка статуса
sudo systemctl status skud.service
```

### 5. Настройка логирования

```bash
# Создание папки для логов
sudo mkdir -p /var/log/skud
sudo chown $USER:$USER /var/log/skud

# Настройка ротации логов
sudo nano /etc/logrotate.d/skud
```

Содержимое файла logrotate:
```
/var/log/skud/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 skud skud
}
```

## 🔧 Использование системы

### Основные команды

```bash
# Активация окружения
source venv/bin/activate

# Запуск основной системы
./start_skud.sh

# Мониторинг
./monitor.sh basic        # Базовый мониторинг
./monitor.sh interactive  # Интерактивный анализ
./monitor.sh realtime     # Мониторинг в реальном времени

# Оптимизация БД
./optimize_db.sh

# Управление сервисом
sudo systemctl start skud     # Запуск
sudo systemctl stop skud      # Остановка
sudo systemctl restart skud   # Перезапуск
sudo systemctl status skud    # Статус
```

### Мониторинг системы

```bash
# Просмотр логов
tail -f logs/skud_system.log

# Просмотр логов сервиса
sudo journalctl -u skud -f

# Проверка процессов
ps aux | grep python

# Проверка использования ресурсов
htop
```

## 📊 Конфигурация

### Файл `real_skud_config.ini`

```ini
[MONITORING]
watch_directory = real_data_input
check_interval = 30
backup_enabled = true

[DATABASE]
db_file = real_skud_data.db
wal_mode = true

[FILTERING]
exclude_employees = Охрана М., 1 пост о., 2 пост о., Крыша К.
exclude_doors = выход паркинг, 1эт серверная, Студия - вн.мир

[LOGGING]
level = INFO
log_to_file = true
log_file = logs/skud_system.log
```

## 🔒 Безопасность

### Настройка firewall

```bash
# Открытие только необходимых портов
sudo ufw allow ssh
sudo ufw enable
```

### Настройка SSH

```bash
# Редактирование конфигурации SSH
sudo nano /etc/ssh/sshd_config

# Рекомендуемые настройки:
# Port 2222                    # Нестандартный порт
# PermitRootLogin no          # Запрет входа root
# PasswordAuthentication no   # Только ключи
# PubkeyAuthentication yes    # Аутентификация по ключам

# Перезапуск SSH
sudo systemctl restart ssh
```

## 🚨 Troubleshooting

### Частые проблемы

1. **Ошибка прав доступа**
   ```bash
   chmod +x *.sh
   chown -R $USER:$USER ~/skud_system
   ```

2. **Проблемы с Python**
   ```bash
   which python3
   python3 --version
   pip3 list
   ```

3. **Проблемы с базой данных**
   ```bash
   sqlite3 real_skud_data.db ".tables"
   ./optimize_db.sh
   ```

4. **Проблемы с сервисом**
   ```bash
   sudo journalctl -u skud -n 50
   sudo systemctl daemon-reload
   sudo systemctl restart skud
   ```

## ✅ Проверка работоспособности

```bash
# Проверка файлов
ls -la ~/skud_system/

# Проверка БД
sqlite3 real_skud_data.db "SELECT COUNT(*) FROM employees;"

# Проверка мониторинга
./monitor.sh basic

# Проверка сервиса
sudo systemctl is-active skud
```

---

**🎉 Система СКУД готова к работе на сервере!**
"""
    
    with open("DEPLOYMENT_INSTRUCTIONS.md", "w", encoding="utf-8") as f:
        f.write(instructions)
    
    print("✅ Создан файл DEPLOYMENT_INSTRUCTIONS.md")

def main():
    """Основная функция подготовки развертывания"""
    
    # Создаем пакет развертывания
    create_deployment_package()
    
    # Создаем инструкции
    create_deployment_instructions()
    
    print("\n" + "="*60)
    print("🎯 ПОДГОТОВКА К РАЗВЕРТЫВАНИЮ ЗАВЕРШЕНА!")
    print("="*60)
    print("\n📦 Создан пакет: deploy_package/")
    print("📁 Создан архив: deploy_package.zip")
    print("📋 Созданы инструкции: DEPLOYMENT_INSTRUCTIONS.md")
    print("\n🚀 Следующие шаги:")
    print("1. Скопируйте deploy_package.zip на SSH сервер")
    print("2. Следуйте инструкциям в DEPLOYMENT_INSTRUCTIONS.md")
    print("3. Настройте автозапуск через systemd")
    print("\n💡 Команды для копирования на сервер:")
    print("   scp deploy_package.zip user@server:~/")
    print("   scp DEPLOYMENT_INSTRUCTIONS.md user@server:~/")

if __name__ == "__main__":
    main()