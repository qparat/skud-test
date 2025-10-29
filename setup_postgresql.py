#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Скрипт для создания таблиц PostgreSQL для СКУД системы
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from database_integrator import SkudDatabaseIntegrator
import configparser

def create_postgresql_database():
    """Создает базу данных и таблицы в PostgreSQL"""
    
    print("🚀 Создание базы данных PostgreSQL для СКУД системы...")
    
    # Загружаем конфигурацию PostgreSQL
    config = configparser.ConfigParser()
    config.read('postgres_config.ini', encoding='utf-8')
    
    # Настройки подключения к PostgreSQL
    pg_config = {
        'host': config.get('DATABASE', 'host', fallback='localhost'),
        'port': config.getint('DATABASE', 'port', fallback=5432),
        'database': config.get('DATABASE', 'database', fallback='skud_db'),
        'user': config.get('DATABASE', 'user', fallback='postgres'),
        'password': config.get('DATABASE', 'password', fallback='password')
    }
    
    print(f"📡 Подключение к PostgreSQL: {pg_config['host']}:{pg_config['port']}/{pg_config['database']}")
    
    # Создаем интегратор для PostgreSQL
    integrator = SkudDatabaseIntegrator(db_type="postgresql", **pg_config)
    
    if not integrator.connect():
        print("❌ Ошибка подключения к PostgreSQL!")
        return False
    
    print("✅ Подключение к PostgreSQL успешно!")
    
    # Создаем таблицы
    if integrator.create_test_tables():
        print("✅ Таблицы PostgreSQL созданы успешно!")
        
        # Создаем базовые записи
        dept_id, pos_id = integrator.get_or_create_unknown_ids()
        print(f"✅ Созданы базовые записи (Department ID: {dept_id}, Position ID: {pos_id})")
        
        print("\n🎉 База данных PostgreSQL готова к использованию!")
        print("\nТаблицы созданы:")
        print("  - departments (отделы)")
        print("  - positions (должности)")
        print("  - employees (сотрудники)")
        print("  - access_logs (логи доступа)")
        print("  - employee_exceptions (исключения сотрудников)")
        
        return True
    else:
        print("❌ Ошибка создания таблиц PostgreSQL!")
        return False

if __name__ == "__main__":
    if create_postgresql_database():
        print("\n✅ Настройка PostgreSQL завершена успешно!")
        print("🔄 Теперь парсер будет использовать PostgreSQL вместо SQLite")
    else:
        print("\n❌ Ошибка настройки PostgreSQL!")
        sys.exit(1)