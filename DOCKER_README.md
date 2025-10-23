# 🐳 СКУД - Docker Deployment

Создана полная система контейнеризации для СКУД системы с помощью Docker.

## 📦 Созданные файлы

### Docker конфигурация
- ✅ `Dockerfile.backend` - образ для Python/FastAPI backend
- ✅ `Dockerfile.frontend` - образ для Next.js frontend  
- ✅ `docker-compose.yml` - оркестрация всех сервисов
- ✅ `.dockerignore` - исключения для Docker сборки

### Скрипты автодеплоя
- ✅ `deploy_docker.sh` - автодеплой для Linux/Mac
- ✅ `deploy_docker.ps1` - автодеплой для Windows PowerShell

### Документация
- ✅ `DOCKER_DEPLOYMENT.md` - полная документация по deployment
- ✅ Обновлен `requirements.txt` с FastAPI зависимостями

## 🏗️ Архитектура системы

```
┌─────────────────┐    HTTP    ┌─────────────────┐
│   Frontend      │◄────────────►│    Backend      │
│   (Next.js)     │    API      │   (FastAPI)     │
│   Port: 3000    │   Calls     │   Port: 8003    │
└─────────────────┘             └─────────────────┘
         │                               │
         │                               │
         └───────────────┬───────────────┘
                         │
              ┌─────────────────┐
              │  SQLite DB      │
              │ real_skud_data  │
              └─────────────────┘
```

## 🚀 Команды запуска

### Быстрый автоматический запуск:

**Windows:**
```powershell
.\deploy_docker.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy_docker.sh
./deploy_docker.sh
```

### Ручной запуск:
```bash
# Создание директорий
mkdir -p data_input uploads

# Сборка и запуск
docker-compose up -d

# Проверка статуса
docker-compose ps
```

## 📱 Доступ к приложению

После запуска будет доступно:

- **🌐 Frontend**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8003  
- **📚 API Docs**: http://localhost:8003/docs
- **❤️ Health Check**: http://localhost:8003/health

## 🛠️ Управление

```bash
# Просмотр логов
docker-compose logs -f

# Остановка всех сервисов
docker-compose down

# Перезапуск
docker-compose restart

# Обновление после изменений кода
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 💾 Persistence данных

Следующие данные сохраняются между перезапусками:
- `./real_skud_data.db` - основная база данных SQLite
- `./real_skud_config.ini` - конфигурационный файл
- `./data_input/` - входящие файлы данных
- `./uploads/` - загруженные через веб-интерфейс файлы

## ✅ Готово к использованию!

Система полностью готова к deployment в любой среде с Docker support:
- Локальная разработка
- Staging сервер  
- Production environment
- Cloud deployment (AWS, Azure, GCP)

Все зависимости изолированы в контейнерах, что гарантирует стабильную работу в любой среде.