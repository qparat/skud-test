#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тестирование миграции API на PostgreSQL
"""

import sys
import os
import configparser
import psycopg2
import sqlite3
from contextlib import contextmanager

# Добавляем текущую директорию в путь
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Импортируем функции из clean_api
from clean_api import get_db_connection, execute_query

def test_postgresql_connection():
    """Тестирует подключение к PostgreSQL"""
    print("🔧 Тестирование подключения к PostgreSQL...")
    
    try:
        conn = get_db_connection()
        print(f"✅ Подключение установлено: {conn.db_type}")
        
        # Проверяем, что базовые таблицы существуют
        tables_to_check = ['employees', 'departments', 'positions', 'access_logs']
        
        for table in tables_to_check:
            try:
                if conn.db_type == "postgresql":
                    result = execute_query(
                        conn,
                        """
                        SELECT COUNT(*) as count 
                        FROM information_schema.tables 
                        WHERE table_name = ?
                        """,
                        (table,),
                        fetch_one=True
                    )
                    exists = result['count'] > 0
                else:
                    # SQLite
                    cursor = conn.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
                    exists = cursor.fetchone() is not None
                
                print(f"  {'✅' if exists else '❌'} Таблица {table}: {'найдена' if exists else 'НЕ НАЙДЕНА'}")
                
            except Exception as e:
                print(f"  ❌ Ошибка проверки таблицы {table}: {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return False

def test_api_queries():
    """Тестирует основные запросы API"""
    print("\n🔧 Тестирование запросов API...")
    
    try:
        conn = get_db_connection()
        print(f"✅ Подключение: {conn.db_type}")
        
        # Тест 1: Получение списка сотрудников
        print("\n📋 Тест 1: Получение списка сотрудников")
        try:
            results = execute_query(
                conn,
                """
                SELECT COUNT(*) as count 
                FROM employees 
                WHERE is_active = ?
                """,
                (True,),
                fetch_one=True
            )
            print(f"  ✅ Найдено активных сотрудников: {results['count']}")
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")
        
        # Тест 2: Получение отделов
        print("\n🏢 Тест 2: Получение отделов")
        try:
            results = execute_query(
                conn,
                "SELECT COUNT(*) as count FROM departments",
                fetch_one=True
            )
            print(f"  ✅ Найдено отделов: {results['count']}")
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")
        
        # Тест 3: Получение логов доступа
        print("\n📊 Тест 3: Получение логов доступа")
        try:
            results = execute_query(
                conn,
                "SELECT COUNT(*) as count FROM access_logs",
                fetch_one=True
            )
            print(f"  ✅ Найдено записей логов: {results['count']}")
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")
        
        # Тест 4: JOIN запрос (аналог employee-schedule)
        print("\n🔗 Тест 4: JOIN запрос сотрудники + логи")
        try:
            results = execute_query(
                conn,
                """
                SELECT COUNT(*) as count
                FROM access_logs al
                JOIN employees e ON al.employee_id = e.id
                WHERE e.is_active = ?
                """,
                (True,),
                fetch_one=True
            )
            print(f"  ✅ Найдено записей с JOIN: {results['count']}")
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Общая ошибка тестирования: {e}")
        return False

def test_configuration():
    """Проверяет конфигурационные файлы"""
    print("\n🔧 Проверка конфигурации...")
    
    # Проверка postgres_config.ini
    if os.path.exists('postgres_config.ini'):
        print("  ✅ postgres_config.ini найден")
        
        config = configparser.ConfigParser()
        config.read('postgres_config.ini', encoding='utf-8')
        
        if config.has_section('DATABASE'):
            print("  ✅ Секция [DATABASE] найдена")
            host = config.get('DATABASE', 'host', fallback='не указан')
            database = config.get('DATABASE', 'database', fallback='не указан')
            print(f"    - Host: {host}")
            print(f"    - Database: {database}")
        else:
            print("  ❌ Секция [DATABASE] не найдена")
    else:
        print("  ❌ postgres_config.ini НЕ НАЙДЕН")
    
    # Проверка SQLite файла
    if os.path.exists('real_skud_data.db'):
        print("  ✅ real_skud_data.db найден")
    else:
        print("  ❌ real_skud_data.db НЕ НАЙДЕН")

def main():
    """Основная функция тестирования"""
    print("🚀 ТЕСТИРОВАНИЕ МИГРАЦИИ API НА POSTGRESQL")
    print("=" * 50)
    
    # Тест 1: Конфигурация
    test_configuration()
    
    # Тест 2: Подключение
    connection_ok = test_postgresql_connection()
    
    # Тест 3: Запросы API
    if connection_ok:
        test_api_queries()
    else:
        print("\n⚠️ Пропускаем тесты запросов - нет подключения к базе")
    
    print("\n" + "=" * 50)
    print("🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")

if __name__ == "__main__":
    main()