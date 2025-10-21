# 🚀 CHECKLIST ДЛЯ DOCKER DEPLOYMENT

## Перед коммитом в GitHub

### ✅ Подготовка файлов
- [x] `Dockerfile` - создан
- [x] `docker-compose.yml` - создан  
- [x] `.dockerignore` - создан
- [x] `deploy_docker.sh` - создан (Linux/Mac)
- [x] `deploy_docker.ps1` - создан (Windows)
- [x] `healthcheck.py` - создан
- [x] `.env.example` - создан
- [x] `DOCKER_DEPLOYMENT.md` - документация создана
- [x] `.github/workflows/docker.yml` - CI/CD настроен

### 🔧 Конфигурация
- [ ] Проверить `real_skud_config.ini`
- [ ] Убедиться что `requirements.txt` содержит все зависимости
- [ ] Создать `.env` файл из `.env.example` (локально, НЕ коммитить)

### 📁 Директории (создаются автоматически)
- `real_data_input/` - входящие файлы
- `processed_real_skud/` - обработанные файлы  
- `backups/` - резервные копии
- `logs/` - файлы логов

## После коммита в GitHub

### 🐳 Локальный запуск

1. **Клонировать репозиторий:**
```bash
git clone https://github.com/qparat/skud-test.git
cd skud-test
```

2. **Быстрый запуск (Windows):**
```powershell
.\deploy_docker.ps1
```

3. **Быстрый запуск (Linux/Mac):**
```bash
chmod +x deploy_docker.sh
./deploy_docker.sh
```

4. **Ручной запуск:**
```bash
docker-compose up -d
```

### 📋 Проверка работы

```bash
# Статус контейнеров
docker-compose ps

# Логи приложения
docker-compose logs -f skud-app

# Health check
docker-compose exec skud-app python healthcheck.py

# Проверка базы данных
docker-compose exec skud-app ls -la real_skud_data.db
```

### 🛠️ Управление

```bash
# Остановка
docker-compose down

# Перезапуск после изменений
docker-compose down
docker-compose build --no-cache  
docker-compose up -d

# Обновление из GitHub
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Просмотр логов
docker-compose logs --tail=50 -f

# Очистка (осторожно - удалит данные!)
docker-compose down -v
docker system prune -f
```

### 🌐 Production deployment

1. **На сервере установить:**
   - Docker
   - Docker Compose
   - Git

2. **Клонировать и запустить:**
```bash
git clone https://github.com/qparat/skud-test.git
cd skud-test
./deploy_docker.sh
```

3. **Настроить автозапуск:**
```bash
# Создать systemd сервис для автозапуска
sudo systemctl enable docker
```

### 🔄 Автоматическое обновление

Через GitHub Actions будет автоматически:
- Собираться Docker образ при push в main
- Образ будет доступен в GitHub Container Registry
- Можно настроить автодеплой на продакшн сервер

## Полезные команды

```bash
# Мониторинг ресурсов
docker stats

# Вход в контейнер для отладки  
docker-compose exec skud-app bash

# Копирование файлов в контейнер
docker cp local_file.txt skud-monitor:/app/

# Копирование файлов из контейнера
docker cp skud-monitor:/app/real_skud_data.db ./backup.db

# Просмотр информации об образе
docker image inspect skud-test_skud-app

# Логи конкретного контейнера
docker logs skud-monitor -f --tail=100
```