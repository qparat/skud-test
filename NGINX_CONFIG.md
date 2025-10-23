# 🌐 Nginx Configuration для СКУД

## 📋 Обзор

Nginx настроен как reverse proxy для маршрутизации запросов между frontend и backend сервисами.

## 🔗 Маршрутизация

### Доступные URL:

- **http://localhost** - главная страница (frontend)
- **http://localhost/api/** - API запросы (backend)
- **http://localhost/docs** - документация API
- **http://localhost/health** - health check API
- **http://localhost:8080/nginx-health** - health check Nginx

## 🏗️ Архитектура

```
Internet/Browser
       ↓
  [Nginx :80]
       ↓
   ┌─────────┬─────────┐
   ↓         ↓         ↓
[Frontend] [Backend] [Static]
 :3000      :8003    Files
```

## ⚙️ Основная конфигурация

### API маршруты (`/api/*`)
- Проксируются на `backend:8003`
- Автоматическое добавление заголовков
- Настроены таймауты (60s)
- Включена буферизация

### Frontend маршруты (`/*`)
- Проксируются на `frontend:3000`
- Поддержка WebSocket для hot reload
- Кэширование статических файлов

### Статические файлы
- Next.js статика (`/_next/static/`) - кэш 1 год
- Медиа файлы (css, js, images) - кэш 30 дней

## 🔧 Настройки производительности

### Gzip сжатие
```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript;
```

### Кэширование
```nginx
# Статические файлы Next.js
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Медиа файлы
location ~* \.(ico|css|js|gif|jpe?g|png|svg)$ {
    expires 30d;
    add_header Cache-Control "public";
}
```

### Таймауты
```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

## 🏥 Health Checks

### Nginx health check
```bash
curl http://localhost:8080/nginx-health
# Ответ: healthy
```

### API health check
```bash
curl http://localhost/health
# Ответ: JSON с информацией о состоянии API
```

## 🛠️ Логирование

### Файлы логов (внутри контейнера)
- `/var/log/nginx/access.log` - логи доступа
- `/var/log/nginx/error.log` - логи ошибок

### Просмотр логов
```bash
# Логи Nginx
docker-compose logs nginx

# Live логи
docker-compose logs -f nginx

# Логи внутри контейнера
docker exec skud-nginx tail -f /var/log/nginx/access.log
```

## 🔄 Режимы работы

### Production (с Nginx)
```bash
docker-compose up -d
```

### Development (без Nginx)
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## 🚨 Troubleshooting

### Проблемы с проксированием
```bash
# Проверка конфигурации
docker exec skud-nginx nginx -t

# Перезагрузка конфигурации
docker exec skud-nginx nginx -s reload
```

### Проблемы с портами
```bash
# Проверка занятых портов
netstat -an | grep :80
netstat -an | grep :8080

# Windows
Get-NetTCPConnection -LocalPort 80
```

### Отладка маршрутизации
```bash
# Тестирование API через Nginx
curl -v http://localhost/api/health

# Прямое обращение к backend (должно работать только внутри Docker сети)
docker exec skud-backend curl http://localhost:8003/health
```

## 🔧 Кастомизация

### Изменение портов
Отредактируйте `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"      # Веб-порт
    - "8081:8080"    # Health check порт
```

### Добавление SSL
1. Добавьте сертификаты в `nginx.conf`
2. Обновите порты в `docker-compose.yml`
3. Добавьте volume с сертификатами

### Кастомная конфигурация
1. Отредактируйте `nginx.conf`
2. Пересоберите контейнеры: `docker-compose restart nginx`

## 📊 Мониторинг

### Метрики
```bash
# Статистика Nginx
curl http://localhost:8080/nginx-health

# Статистика контейнеров
docker stats skud-nginx
```

### Проверка доступности
```bash
# Проверка всех endpoint'ов
curl -s http://localhost/ | head -10
curl -s http://localhost/health
curl -s http://localhost/docs | head -10
```