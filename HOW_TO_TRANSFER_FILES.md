# 📁 КАК ЗАКИНУТЬ ФАЙЛЫ НА SSH СЕРВЕР

## 🎯 Быстрые способы передачи файлов

### 1. 🚀 **SCP (рекомендуется) - Secure Copy**

```powershell
# Из PowerShell на Windows
scp deploy_package_updated.zip user@192.168.10.47:~/
scp SSH_DEPLOY_GUIDE.md user@192.168.10.47:~/
```

**Если scp не работает, установите OpenSSH:**
```powershell
# Установка OpenSSH в Windows
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### 2. 📋 **SFTP - Интерактивная передача**

```powershell
# Подключение через SFTP
sftp user@192.168.10.47

# В SFTP консоли:
put deploy_package_updated.zip
put SSH_DEPLOY_GUIDE.md
quit
```

### 3. 🔗 **WinSCP (графический интерфейс)**

1. Скачайте WinSCP: https://winscp.net/
2. Подключитесь к серверу `192.168.10.47`
3. Перетащите файлы в домашнюю папку

### 4. 📦 **Через веб-сервер (если есть доступ)**

```powershell
# На сервере запустите простой веб-сервер
python3 -m http.server 8000

# Загрузите файлы через браузер или wget
```

### 5. 💾 **Через USB/сетевую папку**

Если есть физический доступ к серверу.

## 🎯 **ПОШАГОВОЕ РУКОВОДСТВО (SCP)**

### Шаг 1: Подготовка файлов

```powershell
# Убедитесь, что у вас есть файлы
ls deploy_package_updated.zip
ls SSH_DEPLOY_GUIDE.md
```

### Шаг 2: Проверка подключения

```powershell
# Проверьте, что можете подключиться к серверу
ssh user@192.168.10.47
# Если подключение работает, выйдите: exit
```

### Шаг 3: Копирование файлов

```powershell
# Копируем основной архив
scp deploy_package_updated.zip user@192.168.10.47:~/

# Копируем инструкции
scp SSH_DEPLOY_GUIDE.md user@192.168.10.47:~/

# Опционально - копируем полные инструкции
scp DEPLOYMENT_INSTRUCTIONS.md user@192.168.10.47:~/
```

### Шаг 4: Подключение и развертывание

```powershell
# Подключаемся к серверу
ssh user@192.168.10.47

# На сервере проверяем файлы
ls -la *.zip *.md

# Запускаем быстрое развертывание
unzip -q deploy_package_updated.zip && chmod +x quick_deploy.sh && ./quick_deploy.sh
```

## 🔧 **Альтернативные методы**

### А) **Через GitHub (если есть репозиторий)**

```bash
# На сервере
git clone https://github.com/yourusername/skud-system.git
cd skud-system
./quick_deploy.sh
```

### Б) **Через wget (если файлы на веб-сервере)**

```bash
# На сервере
wget http://your-server.com/deploy_package_updated.zip
unzip deploy_package_updated.zip
./quick_deploy.sh
```

### В) **Прямое создание файлов на сервере**

```bash
# Если размер файлов небольшой, можно создать их прямо на сервере
nano main_real_skud.py
# Скопировать содержимое файла
```

## 🚨 **Решение проблем**

### Проблема: "scp command not found"

```powershell
# Установите OpenSSH Client
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# Или используйте PuTTY PSCP
# Скачайте: https://www.putty.org/
pscp deploy_package_updated.zip user@192.168.10.47:/home/user/
```

### Проблема: "Permission denied"

```powershell
# Проверьте логин и пароль
ssh user@192.168.10.47

# Или используйте SSH ключи
ssh-keygen -t rsa
ssh-copy-id user@192.168.10.47
```

### Проблема: "Connection refused"

```powershell
# Проверьте, что SSH сервис запущен на сервере
# На сервере: sudo systemctl status ssh
# Проверьте порт: ssh -p 22 user@192.168.10.47
```

## 📱 **Мобильные приложения**

Если нужно управлять с телефона:
- **Termux** (Android) - полноценный терминал
- **JuiceSSH** (Android) - SSH клиент
- **Blink Shell** (iOS) - SSH клиент

## 🎯 **САМЫЙ ПРОСТОЙ СПОСОБ**

### 1️⃣ Копируем одним архивом:

```powershell
scp deploy_package_updated.zip user@192.168.10.47:~/
```

### 2️⃣ Подключаемся и разворачиваем:

```powershell
ssh user@192.168.10.47
unzip -q deploy_package_updated.zip && chmod +x quick_deploy.sh && ./quick_deploy.sh
```

### 3️⃣ Готово! Система установлена.

---

## 💡 **Совет:**

Если у вас есть доступ к серверу через веб-интерфейс (например, ISPmanager, cPanel), можете загрузить файлы через файловый менеджер в браузере.

**Какой способ вам больше подходит?** 🤔