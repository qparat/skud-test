"""
База данных для системы контроля доступа (СКУД)
"""
import sqlite3
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, time
import re
import os
import hashlib

class SkudDatabaseManager:
    """Менеджер базы данных для системы СКУД"""
    
    def __init__(self, db_type: str = "sqlite", **kwargs):
        self.db_type = db_type.lower()
        self.connection = None
        self.logger = logging.getLogger(__name__)
        
        if self.db_type == "sqlite":
            self.database = kwargs.get('database', 'skud_data.db')
        elif self.db_type == "postgresql":
            self.host = kwargs.get('host', 'localhost')
            self.port = kwargs.get('port', 5432)
            self.database = kwargs.get('database', 'skud_db')
            self.username = kwargs.get('username', 'postgres')
            self.password = kwargs.get('password', '')
    
    def connect(self) -> bool:
        """Установка соединения с базой данных"""
        try:
            if self.db_type == "sqlite":
                db_dir = os.path.dirname(self.database) if os.path.dirname(self.database) else '.'
                if not os.path.exists(db_dir):
                    os.makedirs(db_dir)
                
                self.connection = sqlite3.connect(self.database, check_same_thread=False)
                self.connection.row_factory = sqlite3.Row
                self.logger.info(f"Подключение к SQLite: {self.database}")
                
            elif self.db_type == "postgresql":
                import psycopg2
                from psycopg2.extras import RealDictCursor
                self.connection = psycopg2.connect(
                    host=self.host,
                    port=self.port,
                    database=self.database,
                    user=self.username,
                    password=self.password,
                    cursor_factory=RealDictCursor
                )
                self.logger.info(f"Подключение к PostgreSQL: {self.username}@{self.host}:{self.port}/{self.database}")
                
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка подключения к базе данных: {e}")
            self.connection = None
            return False
    
    def disconnect(self):
        """Закрытие соединения с базой данных"""
        if self.connection:
            self.connection.close()
            self.connection = None
            self.logger.info("Соединение с базой данных закрыто")
    
    def create_skud_schema(self) -> bool:
        """Создание схемы таблиц для СКУД"""
        if not self.connection:
            self.logger.error("Нет соединения с базой данных")
            return False
            
        try:
            cursor = self.connection.cursor()
            
            if self.db_type == "sqlite":
                # 1. Таблица сотрудников (ФИО и должность)
                employees_table = '''
                CREATE TABLE IF NOT EXISTS employees (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL UNIQUE,
                    position TEXT,
                    department TEXT,
                    card_number TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                '''
                
                # 2. Таблица всех проходов (заходы и выходы)
                access_logs_table = '''
                CREATE TABLE IF NOT EXISTS access_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employee_id INTEGER REFERENCES employees(id),
                    full_name TEXT NOT NULL,
                    access_date DATE NOT NULL,
                    access_time TIME NOT NULL,
                    access_datetime TIMESTAMP NOT NULL,
                    access_type TEXT CHECK(access_type IN ('ВХОД', 'ВЫХОД', 'IN', 'OUT')) NOT NULL,
                    door_location TEXT,
                    card_number TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                '''
                
                # 3. Таблица первого входа и последнего выхода за день
                daily_summary_table = '''
                CREATE TABLE IF NOT EXISTS daily_summary (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employee_id INTEGER REFERENCES employees(id),
                    full_name TEXT NOT NULL,
                    work_date DATE NOT NULL,
                    first_entry_time TIME,
                    first_entry_datetime TIMESTAMP,
                    last_exit_time TIME,
                    last_exit_datetime TIMESTAMP,
                    total_entries INTEGER DEFAULT 0,
                    total_exits INTEGER DEFAULT 0,
                    work_duration_minutes INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(employee_id, work_date)
                )
                '''
                
                # 4. Таблица обеденных перерывов
                lunch_breaks_table = '''
                CREATE TABLE IF NOT EXISTS lunch_breaks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    employee_id INTEGER REFERENCES employees(id),
                    full_name TEXT NOT NULL,
                    break_date DATE NOT NULL,
                    lunch_out_time TIME,
                    lunch_out_datetime TIMESTAMP,
                    lunch_in_time TIME,
                    lunch_in_datetime TIMESTAMP,
                    break_duration_minutes INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                '''
                
                # 5. Таблица для метаданных файлов
                files_metadata_table = '''
                CREATE TABLE IF NOT EXISTS files_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_date DATE,
                    file_hash TEXT UNIQUE NOT NULL,
                    file_size INTEGER,
                    line_count INTEGER,
                    records_processed INTEGER DEFAULT 0,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processing_status TEXT DEFAULT 'pending'
                )
                '''
                
            elif self.db_type == "postgresql":
                # PostgreSQL версии таблиц
                employees_table = '''
                CREATE TABLE IF NOT EXISTS employees (
                    id SERIAL PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL UNIQUE,
                    position VARCHAR(255),
                    department VARCHAR(255),
                    card_number VARCHAR(50),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                '''
                
                access_logs_table = '''
                CREATE TABLE IF NOT EXISTS access_logs (
                    id SERIAL PRIMARY KEY,
                    employee_id INTEGER REFERENCES employees(id),
                    full_name VARCHAR(255) NOT NULL,
                    access_date DATE NOT NULL,
                    access_time TIME NOT NULL,
                    access_datetime TIMESTAMP NOT NULL,
                    access_type VARCHAR(10) CHECK(access_type IN ('ВХОД', 'ВЫХОД', 'IN', 'OUT')) NOT NULL,
                    door_location VARCHAR(255),
                    card_number VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                '''
                
                daily_summary_table = '''
                CREATE TABLE IF NOT EXISTS daily_summary (
                    id SERIAL PRIMARY KEY,
                    employee_id INTEGER REFERENCES employees(id),
                    full_name VARCHAR(255) NOT NULL,
                    work_date DATE NOT NULL,
                    first_entry_time TIME,
                    first_entry_datetime TIMESTAMP,
                    last_exit_time TIME,
                    last_exit_datetime TIMESTAMP,
                    total_entries INTEGER DEFAULT 0,
                    total_exits INTEGER DEFAULT 0,
                    work_duration_minutes INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(employee_id, work_date)
                )
                '''
                
                lunch_breaks_table = '''
                CREATE TABLE IF NOT EXISTS lunch_breaks (
                    id SERIAL PRIMARY KEY,
                    employee_id INTEGER REFERENCES employees(id),
                    full_name VARCHAR(255) NOT NULL,
                    break_date DATE NOT NULL,
                    lunch_out_time TIME,
                    lunch_out_datetime TIMESTAMP,
                    lunch_in_time TIME,
                    lunch_in_datetime TIMESTAMP,
                    break_duration_minutes INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                '''
                
                files_metadata_table = '''
                CREATE TABLE IF NOT EXISTS files_metadata (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    file_path VARCHAR(500) NOT NULL,
                    file_date DATE,
                    file_hash VARCHAR(64) UNIQUE NOT NULL,
                    file_size BIGINT,
                    line_count INTEGER,
                    records_processed INTEGER DEFAULT 0,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processing_status VARCHAR(50) DEFAULT 'pending'
                )
                '''
            
            # Создаем таблицы
            tables = [
                ("employees", employees_table),
                ("access_logs", access_logs_table),
                ("daily_summary", daily_summary_table),
                ("lunch_breaks", lunch_breaks_table),
                ("files_metadata", files_metadata_table)
            ]
            
            for table_name, table_sql in tables:
                cursor.execute(table_sql)
                self.logger.info(f"Таблица {table_name} создана/проверена")
            
            # Создаем индексы
            self.create_indexes(cursor)
            
            self.connection.commit()
            self.logger.info("Схема СКУД создана успешно")
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка создания схемы СКУД: {e}")
            if self.connection:
                self.connection.rollback()
            return False
    
    def create_indexes(self, cursor):
        """Создание индексов для оптимизации запросов"""
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_employees_name ON employees (full_name)",
            "CREATE INDEX IF NOT EXISTS idx_access_logs_employee ON access_logs (employee_id)",
            "CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs (access_date)",
            "CREATE INDEX IF NOT EXISTS idx_access_logs_datetime ON access_logs (access_datetime)",
            "CREATE INDEX IF NOT EXISTS idx_access_logs_name ON access_logs (full_name)",
            "CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summary (work_date)",
            "CREATE INDEX IF NOT EXISTS idx_daily_summary_employee ON daily_summary (employee_id)",
            "CREATE INDEX IF NOT EXISTS idx_lunch_breaks_date ON lunch_breaks (break_date)",
            "CREATE INDEX IF NOT EXISTS idx_lunch_breaks_employee ON lunch_breaks (employee_id)",
            "CREATE INDEX IF NOT EXISTS idx_files_date ON files_metadata (file_date)"
        ]
        
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
            except Exception as e:
                self.logger.warning(f"Не удалось создать индекс: {e}")
    
    def insert_or_update_employee(self, full_name: str, position: str = None, 
                                 department: str = None, card_number: str = None) -> int:
        """Добавление или обновление сотрудника"""
        if not self.connection:
            return None
            
        try:
            cursor = self.connection.cursor()
            
            if self.db_type == "sqlite":
                # Проверяем существование
                cursor.execute("SELECT id FROM employees WHERE full_name = ?", (full_name,))
                existing = cursor.fetchone()
                
                if existing:
                    # НЕ обновляем поля position и department, если они уже заполнены!
                    # Обновляем только card_number и время
                    cursor.execute("""
                        UPDATE employees 
                        SET card_number = COALESCE(?, card_number),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE full_name = ? 
                        AND (position IS NULL OR position = '')
                        AND (department IS NULL OR department = '')
                    """, (card_number, full_name))
                    
                    # Если поля уже заполнены, просто обновляем время
                    cursor.execute("""
                        UPDATE employees 
                        SET updated_at = CURRENT_TIMESTAMP
                        WHERE full_name = ?
                    """, (full_name,))
                    
                    employee_id = existing[0]
                else:
                    # Вставляем нового
                    cursor.execute("""
                        INSERT INTO employees (full_name, position, department, card_number)
                        VALUES (?, ?, ?, ?)
                    """, (full_name, position, department, card_number))
                    employee_id = cursor.lastrowid
                    
            elif self.db_type == "postgresql":
                cursor.execute("""
                    INSERT INTO employees (full_name, position, department, card_number)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (full_name) DO UPDATE SET
                        position = COALESCE(EXCLUDED.position, employees.position),
                        department = COALESCE(EXCLUDED.department, employees.department),
                        card_number = COALESCE(EXCLUDED.card_number, employees.card_number),
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                """, (full_name, position, department, card_number))
                result = cursor.fetchone()
                employee_id = result[0] if result else None
            
            self.connection.commit()
            return employee_id
            
        except Exception as e:
            self.logger.error(f"Ошибка работы с сотрудником {full_name}: {e}")
            if self.connection:
                self.connection.rollback()
            return None
    
    def insert_access_log(self, full_name: str, access_datetime: datetime, 
                         access_type: str, door_location: str = None, 
                         card_number: str = None) -> bool:
        """Добавление записи о проходе"""
        if not self.connection:
            return False
            
        try:
            # Получаем ID сотрудника
            employee_id = self.insert_or_update_employee(full_name)
            
            cursor = self.connection.cursor()
            
            # Нормализуем тип доступа
            access_type = access_type.upper()
            if access_type in ['IN', 'ВХОД', 'ЗАШЕЛ', 'ПРИШЕЛ']:
                access_type = 'ВХОД'
            elif access_type in ['OUT', 'ВЫХОД', 'ВЫШЕЛ', 'УШЕЛ']:
                access_type = 'ВЫХОД'
            
            access_date = access_datetime.date()
            access_time = access_datetime.time().strftime('%H:%M:%S')
            
            if self.db_type == "sqlite":
                cursor.execute("""
                    INSERT INTO access_logs 
                    (employee_id, full_name, access_date, access_time, access_datetime, 
                     access_type, door_location, card_number)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (employee_id, full_name, access_date, access_time, access_datetime, 
                      access_type, door_location, card_number))
            else:
                cursor.execute("""
                    INSERT INTO access_logs 
                    (employee_id, full_name, access_date, access_time, access_datetime, 
                     access_type, door_location, card_number)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (employee_id, full_name, access_date, access_time, access_datetime, 
                      access_type, door_location, card_number))
            
            self.connection.commit()
            
            # Обновляем сводную таблицу
            self.update_daily_summary(employee_id, full_name, access_date, access_datetime, access_type)
            
            # Обрабатываем обеденные перерывы
            self.process_lunch_break(employee_id, full_name, access_date, access_datetime, access_type)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка добавления записи доступа: {e}")
            if self.connection:
                self.connection.rollback()
            return False
    
    def update_daily_summary(self, employee_id: int, full_name: str, work_date: date, 
                           access_datetime: datetime, access_type: str):
        """Обновление ежедневной сводки"""
        try:
            cursor = self.connection.cursor()
            
            # Получаем текущую запись
            if self.db_type == "sqlite":
                cursor.execute("""
                    SELECT first_entry_datetime, last_exit_datetime, total_entries, total_exits
                    FROM daily_summary WHERE employee_id = ? AND work_date = ?
                """, (employee_id, work_date))
            else:
                cursor.execute("""
                    SELECT first_entry_datetime, last_exit_datetime, total_entries, total_exits
                    FROM daily_summary WHERE employee_id = %s AND work_date = %s
                """, (employee_id, work_date))
            
            existing = cursor.fetchone()
            
            if existing:
                # Конвертируем строки обратно в datetime для SQLite
                first_entry_str, last_exit_str, total_entries, total_exits = existing
                
                first_entry = None
                if first_entry_str:
                    try:
                        first_entry = datetime.fromisoformat(first_entry_str.replace(' ', 'T'))
                    except:
                        first_entry = None
                
                last_exit = None
                if last_exit_str:
                    try:
                        last_exit = datetime.fromisoformat(last_exit_str.replace(' ', 'T'))
                    except:
                        last_exit = None
                
                total_entries = total_entries or 0
                total_exits = total_exits or 0
                
                # Обновляем счетчики
                if access_type == 'ВХОД':
                    total_entries += 1
                    if not first_entry or access_datetime < first_entry:
                        first_entry = access_datetime
                elif access_type == 'ВЫХОД':
                    total_exits += 1
                    if not last_exit or access_datetime > last_exit:
                        last_exit = access_datetime
                
                # Вычисляем продолжительность рабочего дня
                work_duration = None
                if first_entry and last_exit:
                    work_duration = int((last_exit - first_entry).total_seconds() / 60)
                
                # Обновляем запись
                if self.db_type == "sqlite":
                    cursor.execute("""
                        UPDATE daily_summary SET
                            first_entry_time = ?, first_entry_datetime = ?,
                            last_exit_time = ?, last_exit_datetime = ?,
                            total_entries = ?, total_exits = ?,
                            work_duration_minutes = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE employee_id = ? AND work_date = ?
                    """, (first_entry.time().strftime('%H:%M:%S') if first_entry else None, first_entry,
                          last_exit.time().strftime('%H:%M:%S') if last_exit else None, last_exit,
                          total_entries, total_exits, work_duration, employee_id, work_date))
                else:
                    cursor.execute("""
                        UPDATE daily_summary SET
                            first_entry_time = %s, first_entry_datetime = %s,
                            last_exit_time = %s, last_exit_datetime = %s,
                            total_entries = %s, total_exits = %s,
                            work_duration_minutes = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE employee_id = %s AND work_date = %s
                    """, (first_entry.time().strftime('%H:%M:%S') if first_entry else None, first_entry,
                          last_exit.time().strftime('%H:%M:%S') if last_exit else None, last_exit,
                          total_entries, total_exits, work_duration, employee_id, work_date))
            else:
                # Создаем новую запись
                if access_type == 'ВХОД':
                    first_entry = access_datetime
                    last_exit = None
                    total_entries = 1
                    total_exits = 0
                else:
                    first_entry = None
                    last_exit = access_datetime
                    total_entries = 0
                    total_exits = 1
                
                if self.db_type == "sqlite":
                    cursor.execute("""
                        INSERT INTO daily_summary 
                        (employee_id, full_name, work_date, first_entry_time, first_entry_datetime,
                         last_exit_time, last_exit_datetime, total_entries, total_exits)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (employee_id, full_name, work_date,
                          first_entry.time().strftime('%H:%M:%S') if first_entry else None, first_entry,
                          last_exit.time().strftime('%H:%M:%S') if last_exit else None, last_exit,
                          total_entries, total_exits))
                else:
                    cursor.execute("""
                        INSERT INTO daily_summary 
                        (employee_id, full_name, work_date, first_entry_time, first_entry_datetime,
                         last_exit_time, last_exit_datetime, total_entries, total_exits)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (employee_id, full_name, work_date,
                          first_entry.time().strftime('%H:%M:%S') if first_entry else None, first_entry,
                          last_exit.time().strftime('%H:%M:%S') if last_exit else None, last_exit,
                          total_entries, total_exits))
            
            self.connection.commit()
            
        except Exception as e:
            self.logger.error(f"Ошибка обновления ежедневной сводки: {e}")
    
    def process_lunch_break(self, employee_id: int, full_name: str, break_date: date, 
                          access_datetime: datetime, access_type: str):
        """Обработка обеденных перерывов (выход ДО 13:00 и возвращение ПОСЛЕ 14:30)"""
        try:
            access_time = access_datetime.time()
            access_time_str = access_time.strftime('%H:%M:%S')
            
            # Новые критерии обеденного перерыва:
            # ВЫХОД - до 13:00
            # ВХОД - после 14:30
            lunch_exit_deadline = time(13, 0)   # 13:00
            lunch_return_start = time(14, 30)   # 14:30
            
            cursor = self.connection.cursor()
            
            # Ищем существующую запись обеда на этот день
            if self.db_type == "sqlite":
                cursor.execute("""
                    SELECT id, lunch_out_datetime, lunch_in_datetime 
                    FROM lunch_breaks WHERE employee_id = ? AND break_date = ?
                    ORDER BY id DESC LIMIT 1
                """, (employee_id, break_date))
            else:
                cursor.execute("""
                    SELECT id, lunch_out_datetime, lunch_in_datetime 
                    FROM lunch_breaks WHERE employee_id = %s AND break_date = %s
                    ORDER BY id DESC LIMIT 1
                """, (employee_id, break_date))
            
            existing = cursor.fetchone()
            
            if access_type == 'ВЫХОД' and access_time < lunch_exit_deadline:
                # Выход до 13:00 - потенциальный обеденный перерыв
                if existing:
                    lunch_id, lunch_out, lunch_in = existing
                    
                    # Конвертируем datetime строки в объекты datetime для SQLite
                    if self.db_type == "sqlite" and lunch_out:
                        if isinstance(lunch_out, str):
                            lunch_out = datetime.strptime(lunch_out, '%Y-%m-%d %H:%M:%S')
                    
                    if not lunch_out:
                        # Обновляем время выхода на обед
                        if self.db_type == "sqlite":
                            cursor.execute("""
                                UPDATE lunch_breaks SET
                                    lunch_out_time = ?, lunch_out_datetime = ?,
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE id = ?
                            """, (access_time_str, access_datetime, lunch_id))
                        else:
                            cursor.execute("""
                                UPDATE lunch_breaks SET
                                    lunch_out_time = %s, lunch_out_datetime = %s,
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE id = %s
                            """, (access_time_str, access_datetime, lunch_id))
                else:
                    # Создаем новую запись обеда для выхода до 13:00
                    if self.db_type == "sqlite":
                        cursor.execute("""
                            INSERT INTO lunch_breaks 
                            (employee_id, full_name, break_date, lunch_out_time, lunch_out_datetime)
                            VALUES (?, ?, ?, ?, ?)
                        """, (employee_id, full_name, break_date, access_time_str, access_datetime))
                    else:
                        cursor.execute("""
                            INSERT INTO lunch_breaks 
                            (employee_id, full_name, break_date, lunch_out_time, lunch_out_datetime)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (employee_id, full_name, break_date, access_time_str, access_datetime))
            
            elif access_type == 'ВХОД' and access_time > lunch_return_start:
                # Вход после 14:30 - завершение обеденного перерыва
                if existing:
                    lunch_id, lunch_out, lunch_in = existing
                    
                    # Конвертируем datetime строки в объекты datetime для SQLite
                    if self.db_type == "sqlite" and lunch_out:
                        if isinstance(lunch_out, str):
                            lunch_out = datetime.strptime(lunch_out, '%Y-%m-%d %H:%M:%S')
                    if self.db_type == "sqlite" and lunch_in:
                        if isinstance(lunch_in, str):
                            lunch_in = datetime.strptime(lunch_in, '%Y-%m-%d %H:%M:%S')
                    
                    if lunch_out and not lunch_in:
                        # Проверяем, что выход был до 13:00 (валидный обеденный перерыв)
                        lunch_out_time = lunch_out.time()
                        if lunch_out_time < lunch_exit_deadline:
                            # Вычисляем продолжительность обеда
                            break_duration = int((access_datetime - lunch_out).total_seconds() / 60)
                            
                            if self.db_type == "sqlite":
                                cursor.execute("""
                                    UPDATE lunch_breaks SET
                                        lunch_in_time = ?, lunch_in_datetime = ?,
                                        break_duration_minutes = ?, updated_at = CURRENT_TIMESTAMP
                                    WHERE id = ?
                                """, (access_time_str, access_datetime, break_duration, lunch_id))
                            else:
                                cursor.execute("""
                                    UPDATE lunch_breaks SET
                                        lunch_in_time = %s, lunch_in_datetime = %s,
                                        break_duration_minutes = %s, updated_at = CURRENT_TIMESTAMP
                                    WHERE id = %s
                                """, (access_time_str, access_datetime, break_duration, lunch_id))
                        else:
                            # Выход был не в обеденное время - не считаем обеденным перерывом
                            self.logger.info(f"Вход после 14:30 для {full_name}, но выход был не в обеденное время ({lunch_out_time})")
            
            # Логируем критерии для отладки
            if access_type == 'ВЫХОД':
                if access_time >= lunch_exit_deadline:
                    self.logger.debug(f"Выход {full_name} в {access_time} НЕ считается обеденным (после 13:00)")
            elif access_type == 'ВХОД':
                if access_time <= lunch_return_start:
                    self.logger.debug(f"Вход {full_name} в {access_time} НЕ считается возвращением с обеда (до 14:30)")
            
            self.connection.commit()
                
        except Exception as e:
            self.logger.error(f"Ошибка обработки обеденного перерыва: {e}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Получение статистики СКУД"""
        if not self.connection:
            return {}
        
        try:
            cursor = self.connection.cursor()
            
            stats = {}
            
            # Общая статистика
            cursor.execute("SELECT COUNT(*) FROM employees WHERE is_active = 1")
            stats['active_employees'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM access_logs WHERE access_date = date('now')")
            stats['today_accesses'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT employee_id) FROM access_logs WHERE access_date = date('now')")
            stats['today_unique_employees'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM daily_summary WHERE work_date = date('now')")
            stats['today_summaries'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM lunch_breaks WHERE break_date = date('now')")
            stats['today_lunch_breaks'] = cursor.fetchone()[0]
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Ошибка получения статистики СКУД: {e}")
            return {}
    
    def extract_date_from_filename(self, filename: str) -> Optional[datetime]:
        """Извлечение даты из названия файла"""
        try:
            # Паттерны для разных форматов дат в названии файла
            patterns = [
                r'(\d{2})(\d{2})(\d{4})',  # DDMMYYYY
                r'(\d{2})[-_.](\d{2})[-_.](\d{4})',  # DD-MM-YYYY, DD_MM_YYYY, DD.MM.YYYY
                r'(\d{4})(\d{2})(\d{2})',  # YYYYMMDD
                r'(\d{4})[-_.](\d{2})[-_.](\d{2})',  # YYYY-MM-DD, YYYY_MM_DD, YYYY.MM.DD
                r'(\d{1,2})[-_.](\d{1,2})[-_.](\d{4})',  # D-M-YYYY, DD-MM-YYYY
            ]
            
            for pattern in patterns:
                match = re.search(pattern, filename)
                if match:
                    groups = match.groups()
                    
                    # Определяем формат и создаем дату
                    if len(groups[0]) == 4:  # Год идет первым
                        year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                    else:  # День идет первым
                        day, month, year = int(groups[0]), int(groups[1]), int(groups[2])
                    
                    return datetime(year, month, day)
                    
        except Exception as e:
            self.logger.warning(f"Не удалось извлечь дату из файла {filename}: {e}")
            
        return None