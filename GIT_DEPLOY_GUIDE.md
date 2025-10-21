# 🚀 РАЗВЕРТЫВАНИЕ ЧЕРЕЗ GIT/GITHUB

## 📋 Варианты развертывания

### 🎯 **Вариант 1: Через GitHub (рекомендуется)**

#### Шаг 1: Создаем репозиторий на GitHub
1. Зайдите на https://github.com
2. Создайте новый репозиторий `skud-system`
3. Сделайте его публичным или приватным

#### Шаг 2: Загружаем код
```powershell
# Добавляем удаленный репозиторий (замените на ваш URL)
git remote add origin https://github.com/ВАШЕ_ИМЯ/skud-system.git

# Отправляем код
git branch -M main
git push -u origin main
```

#### Шаг 3: Развертывание на SSH сервере
```bash
# Подключаемся к серверу
ssh test@192.168.10.47

# Клонируем репозиторий и разворачиваем
curl -sSL https://raw.githubusercontent.com/ВАШЕ_ИМЯ/skud-system/main/install_from_git.sh | bash
```

### 🎯 **Вариант 2: Прямое клонирование**

```bash
# На SSH сервере
ssh test@192.168.10.47

# Клонируем репозиторий
git clone https://github.com/ВАШЕ_ИМЯ/skud-system.git ~/skud_system

# Переходим в папку и разворачиваем
cd ~/skud_system
chmod +x install_from_git.sh
./install_from_git.sh
```

### 🎯 **Вариант 3: Локальная установка без Git**

```bash
# На SSH сервере
ssh test@192.168.10.47

# Скачиваем скрипт установки
curl -sSL https://raw.githubusercontent.com/ВАШЕ_ИМЯ/skud-system/main/install_from_git.sh -o install_skud.sh

# Запускаем (выберете "локальная установка")
chmod +x install_skud.sh
./install_skud.sh
```

## 📦 **Автоматическая установка одной командой**

### Полная установка:
```bash
curl -sSL https://raw.githubusercontent.com/ВАШЕ_ИМЯ/skud-system/main/install_from_git.sh | bash -s -- --auto
```

### С указанием репозитория:
```bash
curl -sSL https://raw.githubusercontent.com/ВАШЕ_ИМЯ/skud-system/main/install_from_git.sh | bash -s -- --repo https://github.com/ВАШЕ_ИМЯ/skud-system.git
```

## 🔧 **Настройка GitHub репозитория**

### 1. Создание репозитория:
```powershell
# Локально (в папке проекта)
git remote add origin https://github.com/ВАШЕ_ИМЯ/skud-system.git
git branch -M main
git push -u origin main
```

### 2. Обновление кода:
```powershell
# При изменениях
git add .
git commit -m "Обновление системы СКУД"
git push
```

### 3. Обновление на сервере:
```bash
# На SSH сервере
cd ~/skud_system
git pull
source venv/bin/activate
pip install -r requirements.txt
```

## 🎯 **Пошаговый план для вас:**

### 1️⃣ **Создайте GitHub репозиторий**
- Зайдите на https://github.com
- New Repository → `skud-system`
- Public или Private (ваш выбор)

### 2️⃣ **Загрузите код** (выполните в PowerShell):
```powershell
# Замените USERNAME на ваше имя на GitHub
git remote add origin https://github.com/USERNAME/skud-system.git
git branch -M main
git push -u origin main
```

### 3️⃣ **Разверните на сервере** (одна команда):
```bash
# Подключитесь к серверу и выполните:
ssh test@192.168.10.47
curl -sSL https://raw.githubusercontent.com/USERNAME/skud-system/main/install_from_git.sh | bash
```

### 4️⃣ **Готово!** Система автоматически развернется:
- Создастся виртуальное окружение
- Установятся зависимости  
- Настроится структура папок
- Создадутся скрипты запуска

## 🚀 **Команды после установки:**

```bash
# Переход в рабочую папку
cd ~/skud_system

# Активация окружения
source venv/bin/activate

# Запуск системы
./start_skud.sh

# Мониторинг
./monitor.sh basic
```

## 💡 **Преимущества Git развертывания:**

✅ **Быстро** - одна команда для полной установки
✅ **Безопасно** - версионность кода
✅ **Обновляемо** - `git pull` для обновлений
✅ **Переносимо** - работает на любом Linux сервере
✅ **Автоматически** - скрипт сам настроит все

---

**Какой способ выберете? Создать GitHub репозиторий или использовать другой метод?** 🤔