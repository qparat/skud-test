#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Улучшенная версия SQLite для продакшена
С оптимизацией, индексами и мониторингом
"""

import sqlite3
import os
import shutil
import logging
from datetime import datetime
from pathlib import Path

class ProductionSQLiteManager:
    """Менеджер SQLite для продакшена с оптимизациями"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger(__name__)
        
    def optimize_database(self):
        """Оптимизирует базу данных для продакшена"""
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Включаем WAL режим для лучшей производительности
            cursor.execute("PRAGMA journal_mode=WAL")
            
            # Увеличиваем размер кэша
            cursor.execute("PRAGMA cache_size=10000")
            
            # Включаем автоматическую очистку
            cursor.execute("PRAGMA auto_vacuum=INCREMENTAL")
            
            # Оптимизируем временную память
            cursor.execute("PRAGMA temp_store=MEMORY")
            
            # Синхронизация в нормальном режиме (быстрее, но безопасно)
            cursor.execute("PRAGMA synchronous=NORMAL")
            
            # Создаем дополнительные индексы для оптимизации
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp_employee ON access_logs(timestamp, employee_id)",
                "CREATE INDEX IF NOT EXISTS idx_access_logs_date_door ON access_logs(DATE(timestamp), door_location)",
                "CREATE INDEX IF NOT EXISTS idx_daily_summary_date_employee ON daily_summary(work_date, employee_id)",
                "CREATE INDEX IF NOT EXISTS idx_lunch_breaks_date_employee ON lunch_breaks(work_date, employee_id)",
                "CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(full_name)",
                "CREATE INDEX IF NOT EXISTS idx_files_metadata_filename ON files_metadata(filename)",
            ]
            
            for index_sql in indexes:
                cursor.execute(index_sql)
                
            # Анализируем статистику для оптимизатора
            cursor.execute("ANALYZE")
            
            conn.commit()
            self.logger.info("База данных оптимизирована для продакшена")
            
        except Exception as e:
            self.logger.error(f"Ошибка оптимизации: {e}")
        finally:
            conn.close()
    
    def create_backup(self):
        """Создает резервную копию базы данных"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"skud_backup_{timestamp}.db"
        backup_path = self.backup_dir / backup_name
        
        try:
            shutil.copy2(self.db_path, backup_path)
            self.logger.info(f"Резервная копия создана: {backup_path}")
            
            # Удаляем старые бэкапы (оставляем только последние 10)
            backups = sorted(self.backup_dir.glob("skud_backup_*.db"))
            if len(backups) > 10:
                for old_backup in backups[:-10]:
                    old_backup.unlink()
                    self.logger.info(f"Удален старый бэкап: {old_backup}")
                    
            return backup_path
            
        except Exception as e:
            self.logger.error(f"Ошибка создания бэкапа: {e}")
            return None
    
    def get_database_stats(self):
        """Возвращает статистику базы данных"""
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            stats = {}
            
            # Размер файла базы данных
            stats['file_size_mb'] = os.path.getsize(self.db_path) / (1024 * 1024)
            
            # Количество страниц
            cursor.execute("PRAGMA page_count")
            stats['page_count'] = cursor.fetchone()[0]
            
            # Размер страницы
            cursor.execute("PRAGMA page_size")
            stats['page_size'] = cursor.fetchone()[0]
            
            # Статистика таблиц
            tables = ['employees', 'access_logs', 'daily_summary', 'lunch_breaks', 'files_metadata']
            
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                stats[f'{table}_count'] = cursor.fetchone()[0]
            
            # Проверяем режим журнала
            cursor.execute("PRAGMA journal_mode")
            stats['journal_mode'] = cursor.fetchone()[0]
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Ошибка получения статистики: {e}")
            return {}
        finally:
            conn.close()
    
    def vacuum_database(self):
        """Выполняет очистку и дефрагментацию базы данных"""
        
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Выполняем инкрементальную очистку
            conn.execute("PRAGMA incremental_vacuum")
            
            # Полная очистка (может занять время)
            conn.execute("VACUUM")
            
            conn.close()
            self.logger.info("База данных очищена и дефрагментирована")
            
        except Exception as e:
            self.logger.error(f"Ошибка очистки базы данных: {e}")

def setup_production_sqlite():
    """Настраивает SQLite для продакшена"""
    
    print("🏭 Настройка SQLite для продуктивного использования")
    print("=" * 60)
    
    db_path = "real_skud_data.db"
    
    if not os.path.exists(db_path):
        print(f"❌ База данных не найдена: {db_path}")
        return
    
    manager = ProductionSQLiteManager(db_path)
    
    # Создаем бэкап перед оптимизацией
    print("📦 Создание резервной копии...")
    backup_path = manager.create_backup()
    if backup_path:
        print(f"✅ Резервная копия: {backup_path}")
    
    # Оптимизируем базу данных
    print("⚡ Оптимизация базы данных...")
    manager.optimize_database()
    
    # Получаем статистику
    print("📊 Статистика базы данных:")
    stats = manager.get_database_stats()
    
    for key, value in stats.items():
        if 'size_mb' in key:
            print(f"   {key}: {value:.2f} MB")
        elif 'count' in key:
            print(f"   {key}: {value:,}")
        else:
            print(f"   {key}: {value}")
    
    # Очистка базы данных
    print("🧹 Очистка и дефрагментация...")
    manager.vacuum_database()
    
    print("\n✅ SQLite настроен для продакшена!")
    print("\n📋 Рекомендации:")
    print("   1. Регулярно создавайте резервные копии")
    print("   2. Мониторьте размер базы данных")
    print("   3. Периодически выполняйте очистку")
    print("   4. Для высоких нагрузок рассмотрите PostgreSQL")

if __name__ == "__main__":
    setup_production_sqlite()