# 🌐 СКУД - Развертывание на сервере

## 📋 Конфигурация обновлена для сервера

### ✅ Изменения для серверного окружения:

1. **API URL**: Изменен с `http://localhost:8002` на относительный путь `/api`
2. **Docker compose**: Настроен для работы через nginx reverse proxy
3. **Скрипты запуска**: Автоматически определяют IP сервера

## 🚀 Запуск на сервере:

### Linux/Unix сервер:
```bash
# Сделать скрипт исполняемым
chmod +x start.sh

# Запуск системы
./start.sh
```

### Windows Server:
```powershell
# Запуск в PowerShell
.\start.ps1
```

### Ручной запуск:
```bash
docker compose down
docker compose build
docker compose up -d
```

## 🔐 Создание root пользователя:

После запуска системы:
```bash
docker compose exec backend python create_root_user.py
```

## 🌐 Доступ к системе:

Система будет доступна по IP адресу вашего сервера:

- **Frontend**: `http://YOUR_SERVER_IP`
- **API**: `http://YOUR_SERVER_IP/api`
- **Nginx status**: `http://YOUR_SERVER_IP:8080`

## 🔧 Настройка firewall (если нужно):

### Ubuntu/Debian:
```bash
# Открыть порты
sudo ufw allow 80/tcp
sudo ufw allow 8080/tcp

# Проверить статус
sudo ufw status
```

### CentOS/RHEL:
```bash
# Открыть порты
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

## 📊 Мониторинг системы:

### Просмотр логов:
```bash
# Все сервисы
docker compose logs -f

# Отдельные сервисы
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### Статус контейнеров:
```bash
docker compose ps
```

### Использование ресурсов:
```bash
docker stats
```

## 🔍 Устранение неполадок:

### Проверка доступности портов:
```bash
# Проверить что порты открыты
netstat -tulpn | grep -E ':(80|8080|8002|3000)'

# Или с ss
ss -tulpn | grep -E ':(80|8080|8002|3000)'
```

### Проверка Docker:
```bash
# Версия Docker
docker --version
docker compose version

# Статус Docker daemon
sudo systemctl status docker
```

### Перезапуск при проблемах:
```bash
# Полная перезагрузка
docker compose down
docker compose build --no-cache
docker compose up -d
```

## 📱 Первый вход в систему:

1. Откройте браузер и перейдите на `http://YOUR_SERVER_IP`
2. Система перенаправит на страницу логина `/login`
3. Войдите используя созданные root учетные данные
4. После входа вы увидите главную страницу с доступными модулями

## 🛡️ Безопасность:

### Рекомендации для продакшена:
- Используйте HTTPS (настройте SSL сертификат в nginx)
- Смените дефолтный SECRET_KEY в `clean_api.py`
- Настройте регулярные бэкапы базы данных
- Ограничьте доступ к портам через firewall
- Используйте strong пароли для пользователей

### SSL сертификат (Let's Encrypt):
```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com
```

## 📁 Структура файлов на сервере:

```
/path/to/skud-test/
├── docker-compose.yml
├── nginx.conf
├── start.sh / start.ps1
├── clean_api.py
├── real_skud_data.db (создается автоматически)
├── frontend/
└── uploads/ (создается автоматически)
```

Система готова для работы на сервере!