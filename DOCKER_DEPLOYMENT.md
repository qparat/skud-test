# СКУД Мониторинг - Docker Deployment

## Быстрый старт

### Предварительные требования
- Docker
- Docker Compose

### Запуск приложения

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/qparat/skud-test.git
cd skud-test
```

2. **Создайте необходимые директории:**
```bash
mkdir -p real_data_input processed_real_skud backups logs
```

3. **Настройте конфигурацию:**
Отредактируйте `real_skud_config.ini` под ваши нужды.

4. **Запустите приложение:**
```bash
docker-compose up -d
```

### Управление контейнером

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f skud-app

# Перезапуск
docker-compose restart

# Обновление (после изменений кода)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Мониторинг

```bash
# Статус контейнера
docker-compose ps

# Логи в реальном времени
docker-compose logs -f

# Вход в контейнер для отладки
docker-compose exec skud-app bash
```

### Структура данных

- `real_data_input/` - входящие файлы данных
- `processed_real_skud/` - обработанные файлы
- `backups/` - резервные копии
- `logs/` - файлы логов
- `real_skud_data.db` - база данных SQLite

### Конфигурация

Основная конфигурация находится в `real_skud_config.ini`. После изменения конфигурации перезапустите контейнер:

```bash
docker-compose restart
```

### Troubleshooting

1. **Проблемы с правами доступа:**
```bash
sudo chown -R $USER:$USER real_data_input processed_real_skud backups logs
```

2. **Очистка и пересборка:**
```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

3. **Просмотр детальных логов:**
```bash
docker-compose logs --tail=100 skud-app
```