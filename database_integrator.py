#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Интеграция парсера СКУД с существующей базой данных
"""

import sys
import os
import sqlite3
from datetime import datetime
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from real_skud_parser import parse_real_skud_line, create_real_skud_config

class SkudDatabaseIntegrator:
    """Класс для интеграции парсера с существующей базой данных"""
    
    def __init__(self, db_path="real_skud_data.db"):
        self.db_path = db_path
        self.connection = None
    
    def connect(self):
        """Подключение к базе данных"""
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.row_factory = sqlite3.Row
            return True
        except Exception as e:
            print(f"❌ Ошибка подключения к БД: {e}")
            return False
    
    def create_test_tables(self):
        """Создает тестовые таблицы для проверки фильтрации"""
        if not self.connection:
            return False
            
        cursor = self.connection.cursor()
        
        # Создаем минимальные таблицы для тестирования
        cursor.executescript('''
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            );
            
            CREATE TABLE IF NOT EXISTS positions (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            );
            
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY,
                full_name TEXT NOT NULL UNIQUE,
                department_id INTEGER,
                position_id INTEGER,
                card_number TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id),
                FOREIGN KEY (position_id) REFERENCES positions(id)
            );
            
            CREATE TABLE IF NOT EXISTS access_logs (
                id INTEGER PRIMARY KEY,
                employee_id INTEGER NOT NULL,
                access_datetime TEXT NOT NULL,
                access_type TEXT NOT NULL CHECK (access_type IN ('ВХОД', 'ВЫХОД', 'IN', 'OUT')),
                door_location TEXT,
                card_number TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                UNIQUE(employee_id, access_datetime, door_location)
            );
        ''')
        
        self.connection.commit()
        return True
    
    def get_or_create_unknown_ids(self):
        """Создает или находит ID для неопределенной службы и должности"""
        cursor = self.connection.cursor()
        
        # Ищем или создаем службу "Неопределено"
        cursor.execute("SELECT id FROM departments WHERE name = ?", ("Неопределено",))
        dept = cursor.fetchone()
        if not dept:
            cursor.execute("INSERT INTO departments (name) VALUES (?)", ("Неопределено",))
            dept_id = cursor.lastrowid
            print("➕ Создана служба 'Неопределено'")
        else:
            dept_id = dept[0]
        
        # Ищем или создаем должность "Неопределено"
        cursor.execute("SELECT id FROM positions WHERE name = ?", ("Неопределено",))
        pos = cursor.fetchone()
        if not pos:
            cursor.execute("INSERT INTO positions (name) VALUES (?)", ("Неопределено",))
            pos_id = cursor.lastrowid
            print("➕ Создана должность 'Неопределено'")
        else:
            pos_id = pos[0]
        
        self.connection.commit()
        return dept_id, pos_id
    
    def get_or_create_employee(self, full_name, card_number=None):
        """Находит существующего сотрудника или создает нового"""
        cursor = self.connection.cursor()
        
        # Ищем существующего сотрудника
        cursor.execute("SELECT id FROM employees WHERE full_name = ?", (full_name,))
        employee = cursor.fetchone()
        
        if employee:
            employee_id = employee[0]
            
            # Обновляем номер карты, если он не задан
            if card_number and card_number.strip():
                cursor.execute(
                    "UPDATE employees SET card_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (card_number IS NULL OR card_number = '')",
                    (card_number, employee_id)
                )
                self.connection.commit()
            
            return employee_id
        else:
            # Получаем ID для неопределенной службы и должности
            dept_id, pos_id = self.get_or_create_unknown_ids()
            
            # Создаем нового сотрудника с неопределенной службой и должностью
            cursor.execute("""
                INSERT INTO employees (full_name, department_id, position_id, card_number, is_active)
                VALUES (?, ?, ?, ?, 1)
            """, (full_name, dept_id, pos_id, card_number or ''))
            
            employee_id = cursor.lastrowid
            self.connection.commit()
            
            print(f"➕ Создан новый сотрудник: {full_name} (ID: {employee_id}) со службой/должностью 'Неопределено'")
            return employee_id
    
    def is_duplicate_access_log(self, employee_id, access_datetime, door_location):
        """Проверяет, существует ли уже такая запись доступа"""
        cursor = self.connection.cursor()
        
        # Проверяем запись с точностью до секунды
        cursor.execute("""
            SELECT id FROM access_logs 
            WHERE employee_id = ? 
            AND access_datetime = ? 
            AND door_location = ?
        """, (employee_id, access_datetime.strftime('%Y-%m-%d %H:%M:%S'), door_location))
        
        return cursor.fetchone() is not None
    
    def add_access_log(self, skud_record):
        """Добавляет запись доступа в базу данных"""
        try:
            # Получаем ID сотрудника
            employee_id = self.get_or_create_employee(
                skud_record.full_name, 
                skud_record.card_number
            )
            
            # Проверяем на дубликаты
            if self.is_duplicate_access_log(
                employee_id, 
                skud_record.timestamp, 
                skud_record.door_location
            ):
                return False  # Запись уже существует
            
            cursor = self.connection.cursor()
            
            # Определяем тип доступа на основе направления - соответствует CHECK constraint в БД
            if skud_record.direction == "вход":
                access_type = "ВХОД"
            elif skud_record.direction == "выход":
                access_type = "ВЫХОД"
            else:
                access_type = "ВХОД"  # По умолчанию
            
            # Вставляем запись доступа
            cursor.execute("""
                INSERT INTO access_logs (
                    employee_id, 
                    access_datetime, 
                    access_type, 
                    door_location, 
                    card_number
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                employee_id,
                skud_record.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                access_type,
                skud_record.door_location,
                skud_record.card_number or ''
            ))
            
            self.connection.commit()
            return True
            
        except Exception as e:
            print(f"❌ Ошибка добавления записи доступа: {e}")
            return False
    
    def import_from_file(self, file_path, limit=None, config_file=None):
        """Импортирует данные из файла СКУД"""
        
        if not self.connect():
            return False
        
        print(f"📂 Импорт данных из файла: {file_path}")
        
        # Загружаем конфигурацию с фильтрацией
        config_path = config_file or "real_skud_config.ini"
        config = create_real_skud_config(config_path)
        
        # Показываем информацию о фильтрации
        if config.get('exclude_employees'):
            print(f"🚫 Исключаются сотрудники: {', '.join(config['exclude_employees'])}")
        if config.get('exclude_doors'):
            print(f"🚫 Исключаются двери: {', '.join(config['exclude_doors'])}")
        
        total_lines = 0
        new_records = 0
        duplicates = 0
        errors = 0
        new_employees = 0
        filtered_employees = 0
        filtered_doors = 0
        
        try:
            with open(file_path, 'r', encoding='windows-1251') as f:
                for line_num, line in enumerate(f, 1):
                    total_lines += 1
                    
                    # Ограничение для тестирования
                    if limit and new_records >= limit:
                        break
                    
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Парсим строку
                    skud_record = parse_real_skud_line(line, line_num, config)
                    
                    if skud_record:
                        # Проверяем, новый ли это сотрудник
                        cursor = self.connection.cursor()
                        cursor.execute("SELECT id FROM employees WHERE full_name = ?", (skud_record.full_name,))
                        existing_employee = cursor.fetchone()
                        
                        # Добавляем запись
                        if self.add_access_log(skud_record):
                            new_records += 1
                            
                            # Считаем новых сотрудников
                            if not existing_employee:
                                new_employees += 1
                            
                            # Прогресс каждые 1000 записей
                            if new_records % 1000 == 0:
                                print(f"📊 Обработано: {new_records} новых записей из {total_lines} строк")
                        else:
                            duplicates += 1
                    else:
                        errors += 1
            
            print(f"\n✅ Импорт завершен!")
            print(f"📄 Всего строк обработано: {total_lines}")
            print(f"➕ Добавлено новых записей доступа: {new_records}")
            print(f"👥 Создано новых сотрудников: {new_employees}")
            print(f"🔄 Пропущено дубликатов: {duplicates}")
            print(f"❌ Ошибок парсинга: {errors}")
            
            return True
            
        except Exception as e:
            print(f"❌ Ошибка импорта: {e}")
            return False
        finally:
            if self.connection:
                self.connection.close()
    
    def get_statistics(self):
        """Выводит статистику базы данных после импорта"""
        if not self.connect():
            return
        
        cursor = self.connection.cursor()
        
        # Общая статистика
        cursor.execute("SELECT COUNT(*) FROM employees")
        total_employees = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM access_logs")
        total_access_logs = cursor.fetchone()[0]
        
        # Последние записи
        cursor.execute("""
            SELECT al.access_datetime, e.full_name, al.access_type, al.door_location
            FROM access_logs al
            JOIN employees e ON al.employee_id = e.id
            ORDER BY al.access_datetime DESC
            LIMIT 5
        """)
        recent_logs = cursor.fetchall()
        
        # Статистика по сегодняшним записям
        today = datetime.now().date()
        cursor.execute("""
            SELECT COUNT(*) FROM access_logs 
            WHERE DATE(access_datetime) = ?
        """, (today,))
        today_logs = cursor.fetchone()[0]
        
        print(f"\n📊 Статистика базы данных:")
        print(f"👥 Всего сотрудников: {total_employees}")
        print(f"📋 Всего записей доступа: {total_access_logs}")
        print(f"📅 Записей за сегодня: {today_logs}")
        
        print(f"\n📝 Последние 5 записей:")
        for i, (timestamp, name, access_type, door) in enumerate(recent_logs, 1):
            print(f"   {i}. {timestamp} - {name} - {access_type} - {door}")
        
        self.connection.close()
    
    def process_skud_file(self, file_path):
        """Обрабатывает файл СКУД и возвращает результат для API"""
        
        if not self.connect():
            return {
                'success': False,
                'error': 'Ошибка подключения к базе данных'
            }
        
        print(f"📂 Обработка файла: {file_path}")
        
        # Загружаем конфигурацию
        config_path = "real_skud_config.ini"
        config = create_real_skud_config(config_path)
        
        total_lines = 0
        new_records = 0
        duplicates = 0
        errors = 0
        new_employees = 0
        
        try:
            with open(file_path, 'r', encoding='windows-1251') as f:
                for line_num, line in enumerate(f, 1):
                    total_lines += 1
                    
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Парсим строку
                    skud_record = parse_real_skud_line(line, line_num, config)
                    
                    if skud_record:
                        # Проверяем, новый ли это сотрудник
                        cursor = self.connection.cursor()
                        cursor.execute("SELECT id FROM employees WHERE full_name = ?", (skud_record.full_name,))
                        existing_employee = cursor.fetchone()
                        
                        # Добавляем запись
                        if self.add_access_log(skud_record):
                            new_records += 1
                            
                            # Считаем новых сотрудников
                            if not existing_employee:
                                new_employees += 1
                        else:
                            duplicates += 1
                    else:
                        errors += 1
            
            result = {
                'success': True,
                'processed_lines': total_lines,
                'new_access_records': new_records,
                'new_employees': new_employees,
                'duplicates': duplicates,
                'errors': errors
            }
            
            print(f"✅ Файл обработан: {new_records} новых записей, {new_employees} новых сотрудников")
            return result
            
        except Exception as e:
            print(f"❌ Ошибка обработки файла: {e}")
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            if self.connection:
                self.connection.close()

def main():
    """Основная функция для тестирования интеграции"""
    
    print("🔄 Тестирование интеграции парсера с существующей базой данных")
    
    integrator = SkudDatabaseIntegrator()
    
    # Показываем текущую статистику
    print("\n📊 Статистика ДО импорта:")
    integrator.get_statistics()
    
    # Импортируем ограниченное количество записей для тестирования
    file_path = "processed_real_skud/2025.08.19.txt"
    
    print(f"\n🔄 Импорт первых 100 записей из файла...")
    success = integrator.import_from_file(file_path, limit=100)
    
    if success:
        print("\n📊 Статистика ПОСЛЕ импорта:")
        integrator.get_statistics()
    else:
        print("❌ Импорт не удался")

if __name__ == "__main__":
    main()