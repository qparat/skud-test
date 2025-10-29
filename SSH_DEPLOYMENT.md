# Развертывание SKUD системы с PostgreSQL на SSH сервере

## Подготовка сервера

### 1. Установка PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib python3-pip python3-venv

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib python3-pip python3-venv
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Настройка PostgreSQL
```bash
# Переключиться на пользователя postgres
sudo -u postgres psql

# В psql создать пользователя и базу данных
CREATE USER skud_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE skud_db OWNER skud_user;
GRANT ALL PRIVILEGES ON DATABASE skud_db TO skud_user;
\q
```

### 3. Настройка аутентификации PostgreSQL
```bash
# Редактировать файл pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Добавить строку для локального подключения:
local   skud_db     skud_user                               md5
host    skud_db     skud_user   127.0.0.1/32               md5

# Перезапустить PostgreSQL
sudo systemctl restart postgresql
```

## Развертывание приложения

### 1. Загрузка кода
```bash
# Клонировать репозиторий или загрузить файлы
git clone [your-repo-url] skud-system
cd skud-system

# Или скопировать файлы через scp:
# scp -r /local/path/to/skud-test2/* user@server:/path/to/skud-system/
```

### 2. Создание виртуального окружения
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
```

### 3. Установка зависимостей
```bash
pip install -r requirements.txt

# Дополнительно для PostgreSQL
pip install psycopg2-binary
```

### 4. Настройка конфигурации PostgreSQL
```bash
# Создать файл postgres_config.ini
cat > postgres_config.ini << EOF
[DATABASE]
host = localhost
port = 5432
database = skud_db
user = skud_user
password = your_strong_password

[FILTERING]
exclude_employees = Охрана М.,1 пост о.,2 пост о.,Крыша К.,Водитель 1 В.,Водитель 2 В.,Дежурный в.,Дежурный В.,Водитель 3 В.
exclude_doors = 
exclude_departments = 
exclude_positions = 
EOF
```

### 5. Инициализация базы данных
```bash
# Запустить скрипт создания таблиц PostgreSQL
python setup_postgresql.py
```

### 6. Перенос данных из SQLite (если есть)
```bash
# Если у вас есть существующая база SQLite, запустить парсер
python real_skud_parser.py

# Или импортировать данные через database_integrator
python -c "
from database_integrator import SkudDatabaseIntegrator
integrator = SkudDatabaseIntegrator(db_type='postgresql')
integrator.create_test_tables()
print('✅ PostgreSQL таблицы созданы')
"
```

## Запуск системы

### 1. Проверка подключения к PostgreSQL
```bash
python -c "
from clean_api import get_db_connection
conn = get_db_connection()
print(f'✅ Подключение: {conn.db_type}')
conn.close()
"
```

### 2. Запуск API сервера
```bash
# Для разработки
uvicorn clean_api:app --host 0.0.0.0 --port 8000 --reload

# Для продакшена с Gunicorn
pip install gunicorn
gunicorn clean_api:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 3. Запуск парсера (в отдельном терминале)
```bash
# Активировать окружение
source venv/bin/activate

# Запустить парсер
python real_skud_parser.py
```

## Мониторинг и обслуживание

### 1. Проверка статуса PostgreSQL
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### 2. Проверка размера базы данных
```bash
sudo -u postgres psql -d skud_db -c "
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats
WHERE schemaname = 'public';
"
```

### 3. Бэкап базы данных
```bash
# Создать бэкап
sudo -u postgres pg_dump skud_db > skud_backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из бэкапа
sudo -u postgres psql skud_db < skud_backup_file.sql
```

## Настройка службы (systemd)

### 1. Создать файл службы для API
```bash
sudo nano /etc/systemd/system/skud-api.service
```

```ini
[Unit]
Description=SKUD API Service
After=network.target postgresql.service

[Service]
Type=forking
User=your_user
Group=your_group
WorkingDirectory=/path/to/skud-system
Environment=PATH=/path/to/skud-system/venv/bin
ExecStart=/path/to/skud-system/venv/bin/gunicorn clean_api:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --daemon
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 2. Создать файл службы для парсера
```bash
sudo nano /etc/systemd/system/skud-parser.service
```

```ini
[Unit]
Description=SKUD Parser Service
After=network.target postgresql.service

[Service]
Type=simple
User=your_user
Group=your_group
WorkingDirectory=/path/to/skud-system
Environment=PATH=/path/to/skud-system/venv/bin
ExecStart=/path/to/skud-system/venv/bin/python real_skud_parser.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Активировать службы
```bash
sudo systemctl daemon-reload
sudo systemctl enable skud-api skud-parser
sudo systemctl start skud-api skud-parser

# Проверить статус
sudo systemctl status skud-api skud-parser
```

## Проверка работоспособности

### 1. Тест API
```bash
curl http://localhost:8000/docs
curl http://localhost:8000/employees
```

### 2. Проверка логов
```bash
# Логи API
sudo journalctl -u skud-api -f

# Логи парсера
sudo journalctl -u skud-parser -f

# Логи PostgreSQL
sudo journalctl -u postgresql -f
```

## Troubleshooting

### 1. Проблемы с подключением к PostgreSQL
```bash
# Проверить подключение
sudo -u postgres psql -d skud_db -c "SELECT 1;"

# Проверить настройки pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep skud

# Проверить логи PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### 2. Проблемы с Python зависимостями
```bash
# Переустановить psycopg2
pip uninstall psycopg2-binary
pip install psycopg2-binary

# Проверить версии
pip list | grep psycopg2
python -c "import psycopg2; print(psycopg2.__version__)"
```

### 3. Проблемы с миграцией данных
```bash
# Проверить существующие таблицы
sudo -u postgres psql -d skud_db -c "\dt"

# Проверить данные в таблицах
sudo -u postgres psql -d skud_db -c "SELECT COUNT(*) FROM employees;"
sudo -u postgres psql -d skud_db -c "SELECT COUNT(*) FROM access_logs;"
```

## Автоматизация развертывания

Создайте скрипт `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Начинаем развертывание SKUD системы..."

# Обновление кода
git pull origin main

# Активация виртуального окружения
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Проверка подключения к PostgreSQL
python -c "from clean_api import get_db_connection; conn = get_db_connection(); print(f'✅ DB: {conn.db_type}'); conn.close()"

# Перезапуск служб
sudo systemctl restart skud-api skud-parser

# Проверка статуса
sleep 5
sudo systemctl is-active skud-api skud-parser

echo "✅ Развертывание завершено!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```