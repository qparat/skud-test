# 🎯 БЫСТРАЯ НАСТРОЙКА GITHUB

## 📝 Пошаговый план:

### 1️⃣ **Создайте репозиторий на GitHub:**
- Зайдите на https://github.com
- Нажмите "New" (зеленая кнопка)
- Название: `skud-system`
- Выберите Public или Private
- НЕ добавляйте README, .gitignore, license
- Нажмите "Create repository"

### 2️⃣ **Скопируйте URL репозитория:**
Будет выглядеть как: `https://github.com/ВАШЕ_ИМЯ/skud-system.git`

### 3️⃣ **Выполните команды в PowerShell:**
```powershell
# Замените URL на ваш репозиторий
git remote add origin https://github.com/ВАШЕ_ИМЯ/skud-system.git
git branch -M main
git push -u origin main
```

### 4️⃣ **На SSH сервере выполните:**
```bash
# Подключение к серверу
ssh test@192.168.10.47

# Установка одной командой (замените URL)
curl -sSL https://raw.githubusercontent.com/ВАШЕ_ИМЯ/skud-system/main/install_from_git.sh | bash
```

## 🎯 **Альтернатива - без GitHub:**

Если не хотите создавать репозиторий, используйте локальную Git установку:

```bash
# На SSH сервере
ssh test@192.168.10.47

# Скачиваем скрипт установки
wget https://pastebin.com/raw/XXXXXXXX -O install_skud.sh

# Или создаем файл вручную
nano install_skud.sh
# Вставляем содержимое install_from_git.sh

# Запускаем
chmod +x install_skud.sh
./install_skud.sh
```

---

**Готовы создать GitHub репозиторий?** 🚀