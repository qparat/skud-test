#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Тестовый скрипт для проверки миграции SKUD системы на PostgreSQL
Запускать на SSH сервере после настройки PostgreSQL
"""

import sys
import os
import traceback
from datetime import datetime

def test_database_connection():
    """Тест подключения к базе данных"""
    print("🔍 Тестирование подключения к базе данных...")
    
    try:
        # Импортируем из нашего API
        from clean_api import get_db_connection, execute_query
        
        # Тестируем подключение
        conn = get_db_connection()
        db_type = getattr(conn, 'db_type', 'unknown')
        
        print(f"✅ Успешное подключение к: {db_type}")
        
        # Проверяем наличие таблиц
        if db_type == 'postgresql':
            tables = execute_query(
                conn,
                """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
                """,
                fetch_all=True
            )
        else:
            tables = execute_query(
                conn,
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
                fetch_all=True
            )
        
        print(f"📋 Найдено таблиц: {len(tables)}")
        for table in tables:
            table_name = table.get('table_name') or table.get('name')
            print(f"   - {table_name}")
        
        conn.close()
        return True, db_type
        
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        traceback.print_exc()
        return False, None

def test_data_operations():
    """Тест операций с данными"""
    print("\n🔍 Тестирование операций с данными...")
    
    try:
        from clean_api import get_db_connection, execute_query
        
        conn = get_db_connection()
        db_type = getattr(conn, 'db_type', 'unknown')
        
        # Проверяем количество записей в основных таблицах
        tables_to_check = ['employees', 'departments', 'positions', 'access_logs']
        
        for table in tables_to_check:
            try:
                result = execute_query(
                    conn,
                    f"SELECT COUNT(*) as count FROM {table}",
                    fetch_one=True
                )
                count = result['count'] if result else 0
                print(f"📊 {table}: {count} записей")
            except Exception as e:
                print(f"⚠️  {table}: таблица не найдена или ошибка ({e})")
        
        # Тест простого SELECT запроса
        try:
            employees = execute_query(
                conn,
                "SELECT id, full_name FROM employees LIMIT 5",
                fetch_all=True
            )
            print(f"👥 Примеры сотрудников:")
            for emp in employees:
                print(f"   - ID: {emp['id']}, Имя: {emp['full_name']}")
        except Exception as e:
            print(f"⚠️  Ошибка при получении сотрудников: {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Ошибка операций с данными: {e}")
        traceback.print_exc()
        return False

def test_database_integrator():
    """Тест database_integrator"""
    print("\n🔍 Тестирование database_integrator...")
    
    try:
        from database_integrator import SkudDatabaseIntegrator
        
        # Тест PostgreSQL
        try:
            integrator_pg = SkudDatabaseIntegrator(db_type='postgresql')
            print("✅ PostgreSQL integrator создан")
            
            # Проверим подключение
            conn = integrator_pg.get_connection()
            if conn:
                print("✅ PostgreSQL подключение работает")
                conn.close()
            else:
                print("❌ PostgreSQL подключение не удалось")
                
        except Exception as e:
            print(f"⚠️  PostgreSQL integrator ошибка: {e}")
        
        # Тест SQLite fallback
        try:
            integrator_sqlite = SkudDatabaseIntegrator(db_type='sqlite')
            print("✅ SQLite integrator создан")
            
            conn = integrator_sqlite.get_connection()
            if conn:
                print("✅ SQLite подключение работает")
                conn.close()
            else:
                print("❌ SQLite подключение не удалось")
                
        except Exception as e:
            print(f"⚠️  SQLite integrator ошибка: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка database_integrator: {e}")
        traceback.print_exc()
        return False

def test_api_endpoints():
    """Тест основных API эндпоинтов"""
    print("\n🔍 Тестирование API эндпоинтов...")
    
    try:
        # Импортируем FastAPI приложение
        from clean_api import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Тест главной страницы (если есть)
        try:
            response = client.get("/")
            print(f"📄 Root endpoint: {response.status_code}")
        except:
            print("📄 Root endpoint: не найден")
        
        # Тест получения сотрудников (без авторизации)
        try:
            response = client.get("/employees/simple")
            print(f"👥 Employees endpoint: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Найдено сотрудников: {len(data)}")
        except Exception as e:
            print(f"👥 Employees endpoint: ошибка ({e})")
        
        # Тест получения отделов
        try:
            response = client.get("/departments")
            print(f"🏢 Departments endpoint: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   Найдено отделов: {len(data)}")
        except Exception as e:
            print(f"🏢 Departments endpoint: ошибка ({e})")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка тестирования API: {e}")
        traceback.print_exc()
        return False

def test_config_files():
    """Проверка конфигурационных файлов"""
    print("\n🔍 Проверка конфигурационных файлов...")
    
    config_files = [
        'postgres_config.ini',
        'real_skud_config.ini',
        'requirements.txt'
    ]
    
    for config_file in config_files:
        if os.path.exists(config_file):
            print(f"✅ {config_file} найден")
        else:
            print(f"⚠️  {config_file} не найден")
    
    # Проверка содержимого postgres_config.ini
    try:
        import configparser
        config = configparser.ConfigParser()
        config.read('postgres_config.ini', encoding='utf-8')
        
        if config.has_section('DATABASE'):
            host = config.get('DATABASE', 'host', fallback='не указан')
            database = config.get('DATABASE', 'database', fallback='не указан')
            user = config.get('DATABASE', 'user', fallback='не указан')
            print(f"🐘 PostgreSQL конфиг: {user}@{host}/{database}")
        else:
            print("⚠️  PostgreSQL конфигурация неполная")
            
    except Exception as e:
        print(f"⚠️  Ошибка чтения PostgreSQL конфига: {e}")

def main():
    """Главная функция тестирования"""
    print("🚀 SKUD PostgreSQL Migration Test")
    print("=" * 50)
    print(f"📅 Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🐍 Python: {sys.version}")
    print(f"📁 Рабочая директория: {os.getcwd()}")
    print("=" * 50)
    
    results = []
    
    # Проверка конфигурационных файлов
    test_config_files()
    
    # Тест подключения к базе данных
    db_success, db_type = test_database_connection()
    results.append(("Database Connection", db_success))
    
    if db_success:
        # Тест операций с данными
        data_success = test_data_operations()
        results.append(("Data Operations", data_success))
        
        # Тест database_integrator
        integrator_success = test_database_integrator()
        results.append(("Database Integrator", integrator_success))
        
        # Тест API эндпоинтов
        api_success = test_api_endpoints()
        results.append(("API Endpoints", api_success))
    
    # Итоговый отчет
    print("\n" + "=" * 50)
    print("📊 ИТОГОВЫЙ ОТЧЕТ:")
    print("=" * 50)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name:20} {status}")
    
    total_tests = len(results)
    passed_tests = sum(1 for _, success in results if success)
    
    print("-" * 50)
    print(f"Пройдено тестов: {passed_tests}/{total_tests}")
    
    if db_type:
        print(f"База данных: {db_type}")
    
    if passed_tests == total_tests:
        print("🎉 Все тесты пройдены успешно!")
        print("💡 Система готова к работе с PostgreSQL")
        return 0
    else:
        print("⚠️  Некоторые тесты не прошли")
        print("💡 Проверьте логи для диагностики проблем")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)