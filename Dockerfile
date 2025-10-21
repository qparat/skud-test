FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файл требований
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код
COPY . .

# Создаем директории для данных
RUN mkdir -p /app/real_data_input
RUN mkdir -p /app/processed_real_skud
RUN mkdir -p /app/backups

# Устанавливаем права доступа
RUN chmod +x main_real_skud.py
RUN chmod +x healthcheck.py

# Переменные окружения
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python healthcheck.py || exit 1

# Экспонируем порт (если нужен веб-интерфейс)
EXPOSE 8000

# Команда по умолчанию
CMD ["python", "main_real_skud.py"]