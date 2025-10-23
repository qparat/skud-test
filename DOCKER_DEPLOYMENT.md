# 🐳 Docker Deployment - СКУД Система# СКУД Мониторинг - Docker Deployment



## 📋 Описание## Быстрый старт



Docker deployment для полноценной СКУД системы, включающей:### Предварительные требования

- **Backend** (FastAPI) - API сервер на порту 8003- Docker

- **Frontend** (Next.js) - веб-интерфейс на порту 3000- Docker Compose



## 🚀 Быстрый запуск### Запуск приложения



### Windows (PowerShell)1. **Клонируйте репозиторий:**

```powershell```bash

git clone https://github.com/qparat/skud-test.gitgit clone https://github.com/qparat/skud-test.git

cd skud-testcd skud-test

.\deploy_docker.ps1```

```

2. **Создайте необходимые директории:**

### Linux/Mac```bash

```bashmkdir -p real_data_input processed_real_skud backups logs

git clone https://github.com/qparat/skud-test.git```

cd skud-test

chmod +x deploy_docker.sh3. **Настройте конфигурацию:**

./deploy_docker.shОтредактируйте `real_skud_config.ini` под ваши нужды.

```

4. **Запустите приложение:**

### Ручной запуск```bash

```bashdocker-compose up -d

docker-compose up -d```

```

### Управление контейнером

## 📱 Доступ к приложению

```bash

После успешного запуска:# Запуск

- **Frontend**: http://localhost:3000docker-compose up -d

- **Backend API**: http://localhost:8003

- **API документация**: http://localhost:8003/docs# Остановка

docker-compose down

## 🏗️ Архитектура

# Просмотр логов

```docker-compose logs -f skud-app

┌─────────────────┐    ┌─────────────────┐

│   Frontend      │    │    Backend      │# Перезапуск

│   (Next.js)     │◄──►│   (FastAPI)     │docker-compose restart

│   Port: 3000    │    │   Port: 8003    │

└─────────────────┘    └─────────────────┘# Обновление (после изменений кода)

         │                       │docker-compose down

         └───────────────────────┘docker-compose build --no-cache

                    │docker-compose up -d

         ┌─────────────────┐```

         │  SQLite Database │

         │ (real_skud_data) │### Мониторинг

         └─────────────────┘

``````bash

# Статус контейнера

## 📁 Структура файловdocker-compose ps



```# Логи в реальном времени

├── Dockerfile.backend          # Backend (Python/FastAPI)docker-compose logs -f

├── Dockerfile.frontend         # Frontend (Node.js/Next.js)

├── docker-compose.yml          # Оркестрация сервисов# Вход в контейнер для отладки

├── deploy_docker.sh            # Автодеплой (Linux/Mac)docker-compose exec skud-app bash

├── deploy_docker.ps1           # Автодеплой (Windows)```

├── .dockerignore              # Исключения для Docker

├── requirements.txt            # Python зависимости### Структура данных

└── frontend/

    ├── package.json           # Node.js зависимости- `real_data_input/` - входящие файлы данных

    └── ...                    # React компоненты- `processed_real_skud/` - обработанные файлы

```- `backups/` - резервные копии

- `logs/` - файлы логов

## 🔧 Управление контейнерами- `real_skud_data.db` - база данных SQLite



```bash### Конфигурация

# Запуск

docker-compose up -dОсновная конфигурация находится в `real_skud_config.ini`. После изменения конфигурации перезапустите контейнер:



# Остановка```bash

docker-compose downdocker-compose restart

```

# Просмотр логов

docker-compose logs -f### Troubleshooting



# Перезапуск конкретного сервиса1. **Проблемы с правами доступа:**

docker-compose restart backend```bash

docker-compose restart frontendsudo chown -R $USER:$USER real_data_input processed_real_skud backups logs

```

# Статус контейнеров

docker-compose ps2. **Очистка и пересборка:**

```bash

# Просмотр ресурсовdocker-compose down

docker statsdocker system prune -f

```docker-compose build --no-cache

docker-compose up -d

## 📊 Мониторинг```



### Health Checks3. **Просмотр детальных логов:**

- Backend: http://localhost:8003/health```bash

- Frontend: автоматическая проверка на порту 3000docker-compose logs --tail=100 skud-app

```
### Логи
```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend

# Последние 50 строк
docker-compose logs --tail=50
```

## 🔄 Обновление

```bash
# Остановка текущих контейнеров
docker-compose down

# Пересборка образов
docker-compose build --no-cache

# Запуск обновленной версии
docker-compose up -d
```

## 🗄️ Данные и persistence

### Монтируемые директории
- `./real_skud_data.db` → `/app/real_skud_data.db` (база данных)
- `./real_skud_config.ini` → `/app/real_skud_config.ini` (конфигурация)
- `./data_input/` → `/app/data_input/` (входящие файлы)
- `./uploads/` → `/app/uploads/` (загруженные файлы)

### Бэкап данных
```bash
# Бэкап базы данных
cp real_skud_data.db backup_$(date +%Y%m%d_%H%M%S).db

# Восстановление
cp backup_20241023_155930.db real_skud_data.db
docker-compose restart backend
```

## 🛠️ Разработка

### Локальная разработка
```bash
# Backend
cd /
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn clean_api:app --reload --port 8003

# Frontend
cd frontend
npm install
npm run dev
```

### Debug режим
```bash
# Запуск в development режиме
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 🚨 Troubleshooting

### Проблемы с портами
```bash
# Проверка занятых портов
netstat -an | grep :3000
netstat -an | grep :8003

# Остановка процессов
lsof -ti:3000 | xargs kill -9  # Linux/Mac
Get-Process -Port 3000 | Stop-Process  # Windows
```

### Проблемы с Docker
```bash
# Очистка системы
docker system prune -f

# Пересборка без кэша
docker-compose build --no-cache --pull

# Проверка состояния Docker
docker info
```

### Ошибки зависимостей
```bash
# Пересборка frontend
docker-compose exec frontend npm install

# Переустановка Python пакетов
docker-compose exec backend pip install --upgrade -r requirements.txt
```

## 📝 Конфигурация

### Environment Variables
```bash
# Backend
PYTHONUNBUFFERED=1

# Frontend
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_URL=http://localhost:8003
```

### Кастомизация портов
Измените порты в `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "8004:8003"  # Изменить внешний порт
  frontend:
    ports:
      - "3001:3000"  # Изменить внешний порт
```

## 🔗 Полезные ссылки

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)