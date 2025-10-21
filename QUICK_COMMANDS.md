# 🚀 БЫСТРАЯ КОМАНДА ДЛЯ КОПИРОВАНИЯ

## Выполните эти команды в PowerShell:

```powershell
# 1. Копируем архив на сервер
scp deploy_package_updated.zip test@192.168.10.47:~/

# 2. Копируем инструкции
scp SSH_DEPLOY_GUIDE.md test@192.168.10.47:~/

# 3. Подключаемся к серверу
ssh test@192.168.10.47

# 4. На сервере разворачиваем систему одной командой:
unzip -q deploy_package_updated.zip && chmod +x quick_deploy.sh && ./quick_deploy.sh
```

## Если спросит пароль - введите пароль для пользователя test

После этого система будет автоматически развернута!