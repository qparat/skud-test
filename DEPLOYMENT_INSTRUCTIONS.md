# 🚀 ИНСТРУКЦИИ ПО РАЗВЕРТЫВАНИЮ СИСТЕМЫ СКУД НА SSH СЕРВЕРЕ

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
