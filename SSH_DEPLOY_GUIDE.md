# 🚀 БЫСТРОЕ РАЗВЕРТЫВАНИЕ СИСТЕМЫ СКУД НА SSH СЕРВЕРЕ

## 📋 Команды для копирования и выполнения

### 1. Копирование файлов на сервер

```bash
# Копируем архив на сервер
scp deploy_package_updated.zip user@192.168.10.47:~/

# Копируем инструкции
scp DEPLOYMENT_INSTRUCTIONS.md user@192.168.10.47:~/

# Подключаемся к серверу
ssh user@192.168.10.47
```

### 2. Быстрое развертывание одной командой

```bash
# На SSH сервере выполните:
cd ~ && unzip -q deploy_package_updated.zip && chmod +x quick_deploy.sh && ./quick_deploy.sh
```

### 3. Альтернативный способ (пошагово)

```bash
# Распаковка архива
unzip deploy_package_updated.zip

# Запуск быстрого развертывания
chmod +x quick_deploy.sh
./quick_deploy.sh
```

## 🎯 Что делает скрипт автоматически:

✅ **Проверка системы** - Python, архитектура, права доступа
✅ **Создание окружения** - виртуальное окружение Python
✅ **Установка зависимостей** - автоматическая установка пакетов
✅ **Настройка структуры** - создание папок для данных и логов
✅ **Права доступа** - настройка исполняемых файлов
✅ **Тестирование** - проверка работоспособности компонентов

## 📊 После развертывания

```bash
# Переходим в рабочую директорию
cd ~/skud_system

# Активируем окружение
source venv/bin/activate

# Запускаем основную систему
./start_skud.sh

# Запускаем мониторинг
./monitor.sh basic
```

## 🔧 Команды управления

```bash
# Основная система
./start_skud.sh                # Запуск основной системы

# Мониторинг
./monitor.sh basic             # Базовый мониторинг
./monitor.sh interactive       # Интерактивный анализ
./monitor.sh realtime          # Мониторинг в реальном времени

# Обслуживание
./optimize_db.sh               # Оптимизация базы данных
python3 employee_editor.py     # Редактор сотрудников
```

## 🛠️ Настройка автозапуска (systemd)

```bash
# Копирование сервиса
sudo cp skud.service /etc/systemd/system/

# Правка путей (если нужно)
sudo nano /etc/systemd/system/skud.service

# Активация
sudo systemctl daemon-reload
sudo systemctl enable skud.service
sudo systemctl start skud.service

# Проверка статуса
sudo systemctl status skud.service
```

## 📁 Структура после развертывания

```
~/skud_system/
├── 🎯 main_real_skud.py          # Основная система
├── ⚙️ real_skud_config.ini       # Конфигурация
├── 📊 skud_monitor.py            # Мониторинг
├── 🔍 interactive_monitor.py     # Интерактивный анализ
├── ⏱️ minute_monitor.py          # Реальное время
├── 👥 employee_editor.py         # Редактор сотрудников
├── 🔧 setup_production_sqlite.py # Оптимизация БД
├── 🚀 start_skud.sh              # Запуск системы
├── 📊 monitor.sh                 # Скрипт мониторинга
├── 🔧 optimize_db.sh             # Оптимизация БД
├── 📋 skud.service               # Сервис systemd
├── 📂 src/                       # Исходный код
├── 📂 real_data_input/           # Входные файлы
├── 📂 backups/                   # Резервные копии
├── 📂 logs/                      # Логи системы
├── 📂 venv/                      # Виртуальное окружение
└── 📄 deployment_info.txt        # Информация о развертывании
```

## 💡 Полезные команды для SSH сервера

```bash
# Проверка процессов
ps aux | grep python

# Просмотр логов
tail -f logs/skud_system.log

# Проверка размера БД
ls -lh *.db

# Мониторинг ресурсов
htop

# Проверка сетевых соединений
netstat -tulpn

# Просмотр свободного места
df -h
```

---

## 🎉 Готово к использованию!

После выполнения команд выше, система СКУД будет полностью настроена и готова к работе на SSH сервере!