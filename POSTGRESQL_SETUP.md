# Переход на PostgreSQL для СКУД системы

## Настройка PostgreSQL

### 1. Установка PostgreSQL

**Windows:**
```bash
# Скачать и установить PostgreSQL с официального сайта
# https://www.postgresql.org/download/windows/
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**Docker:**
```bash
docker run -d \
  --name postgres-skud \
  -e POSTGRES_DB=skud_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15
```

### 2. Создание базы данных

```sql
-- Подключиться к PostgreSQL как суперпользователь
psql -U postgres

-- Создать базу данных
CREATE DATABASE skud_db;

-- Создать пользователя (опционально)
CREATE USER skud_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE skud_db TO skud_user;
```

### 3. Настройка конфигурации

Отредактируйте файл `postgres_config.ini`:

```ini
[DATABASE]
host = localhost
port = 5432
database = skud_db
user = postgres
password = your_password

[FILTERING]
exclude_employees = Охрана М., 1 пост о., 2 пост о., Крыша К., Водитель 1 В., Водитель 2 В., Дежурный в., Дежурный В., Водитель 3 В.
exclude_doors = выход паркинг, 1эт серверная, Студия - вн.мир
```

### 4. Создание таблиц

```bash
# Установить зависимости
pip install psycopg2-binary

# Создать таблицы в PostgreSQL
python setup_postgresql.py
```

### 5. Проверка работы

После успешного выполнения `setup_postgresql.py`:
- ✅ Таблицы созданы в PostgreSQL
- ✅ Парсер переключен на PostgreSQL
- ✅ API использует PostgreSQL для хранения данных

## Структура таблиц PostgreSQL

### departments
- `id` SERIAL PRIMARY KEY
- `name` VARCHAR(255) NOT NULL UNIQUE

### positions  
- `id` SERIAL PRIMARY KEY
- `name` VARCHAR(255) NOT NULL UNIQUE

### employees
- `id` SERIAL PRIMARY KEY
- `full_name` VARCHAR(255) NOT NULL UNIQUE
- `birth_date` DATE
- `department_id` INTEGER REFERENCES departments(id)
- `position_id` INTEGER REFERENCES positions(id)
- `card_number` VARCHAR(50)
- `is_active` BOOLEAN DEFAULT TRUE
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### access_logs
- `id` SERIAL PRIMARY KEY
- `employee_id` INTEGER NOT NULL REFERENCES employees(id)
- `access_datetime` TIMESTAMP NOT NULL
- `access_type` VARCHAR(10) NOT NULL CHECK (access_type IN ('ВХОД', 'ВЫХОД', 'IN', 'OUT'))
- `door_location` TEXT
- `card_number` VARCHAR(50)
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `UNIQUE(employee_id, access_datetime, door_location)`

### employee_exceptions
- `id` SERIAL PRIMARY KEY
- `employee_id` INTEGER NOT NULL REFERENCES employees(id)
- `exception_date` DATE NOT NULL
- `reason` TEXT NOT NULL
- `exception_type` VARCHAR(50) DEFAULT 'no_lateness_check'
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `UNIQUE(employee_id, exception_date)`

## Отличия от SQLite

1. **Типы данных:** SERIAL вместо INTEGER PRIMARY KEY, VARCHAR вместо TEXT
2. **Плейсхолдеры:** %s вместо ?
3. **RETURNING:** PostgreSQL поддерживает RETURNING для получения ID
4. **Datetime:** PostgreSQL нативно работает с datetime объектами
5. **Boolean:** TRUE/FALSE вместо 1/0

## Производительность

PostgreSQL обеспечивает:
- ⚡ Лучшую производительность для больших объемов данных
- 🔒 Лучшую поддержку concurrent доступа
- 📈 Масштабируемость
- 🛡️ Лучшие механизмы резервного копирования

## Миграция данных

Если у вас есть данные в SQLite, можно использовать pgloader:

```bash
# Установка pgloader
sudo apt install pgloader

# Миграция данных
pgloader real_skud_data.db postgresql://postgres:password@localhost/skud_db
```