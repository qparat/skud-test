#!/usr/bin/env python3
"""
Health check скрипт для Docker контейнера
"""
import os
import sys
import sqlite3
from datetime import datetime

def check_database():
    """Проверка доступности базы данных"""
    try:
        db_path = "/app/real_skud_data.db"
        if not os.path.exists(db_path):
            print("❌ База данных не найдена")
            return False
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        print("✅ База данных доступна")
        return True
    except Exception as e:
        print(f"❌ Ошибка БД: {e}")
        return False

def check_directories():
    """Проверка необходимых директорий"""
    directories = [
        "/app/real_data_input",
        "/app/processed_real_skud", 
        "/app/backups"
    ]
    
    for directory in directories:
        if not os.path.exists(directory):
            print(f"❌ Директория не найдена: {directory}")
            return False
    
    print("✅ Все директории существуют")
    return True

def check_config():
    """Проверка конфигурационного файла"""
    try:
        config_path = "/app/real_skud_config.ini"
        if not os.path.exists(config_path):
            print("❌ Конфигурационный файл не найден")
            return False
        
        print("✅ Конфигурационный файл найден")
        return True
    except Exception as e:
        print(f"❌ Ошибка конфигурации: {e}")
        return False

def main():
    """Основная функция health check"""
    print(f"🏥 Health Check - {datetime.now()}")
    
    checks = [
        check_config(),
        check_directories(),
        check_database()
    ]
    
    if all(checks):
        print("✅ Все проверки пройдены успешно")
        sys.exit(0)
    else:
        print("❌ Обнаружены проблемы")
        sys.exit(1)

if __name__ == "__main__":
    main()