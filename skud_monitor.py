#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Система мониторинга СКУД
"""

import sqlite3
import os
import logging
from datetime import datetime, date, timedelta
from pathlib import Path

class SkudMonitor:
    """Монитор системы СКУД"""
    
    def __init__(self, db_path: str = "real_skud_data.db"):
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
    
    def get_daily_report(self, target_date: date = None):
        """Генерирует дневной отчет"""
        
        if target_date is None:
            target_date = date.today()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            report = {
                'date': target_date.strftime('%d.%m.%Y'),
                'total_employees': 0,
                'employees_present': 0,
                'total_entries': 0,
                'lunch_breaks': 0,
                'early_arrivals': 0,
                'late_departures': 0
            }
            
            # Общее количество сотрудников
            cursor.execute("SELECT COUNT(*) FROM employees")
            report['total_employees'] = cursor.fetchone()[0]
            
            # Сотрудники присутствующие сегодня
            cursor.execute("""
                SELECT COUNT(DISTINCT employee_id) 
                FROM access_logs 
                WHERE DATE(access_datetime) = ?
            """, (target_date,))
            report['employees_present'] = cursor.fetchone()[0] or 0
            
            # Общее количество проходов
            cursor.execute("""
                SELECT COUNT(*) 
                FROM access_logs 
                WHERE DATE(access_datetime) = ?
            """, (target_date,))
            report['total_entries'] = cursor.fetchone()[0] or 0
            
            # Обеденные перерывы
            cursor.execute("""
                SELECT COUNT(*) 
                FROM lunch_breaks 
                WHERE break_date = ?
            """, (target_date,))
            report['lunch_breaks'] = cursor.fetchone()[0] or 0
            
            # Ранние приходы (до 8:00)
            cursor.execute("""
                SELECT COUNT(DISTINCT employee_id)
                FROM daily_summary 
                WHERE work_date = ? 
                AND TIME(first_entry_time) < '08:00:00'
            """, (target_date,))
            report['early_arrivals'] = cursor.fetchone()[0] or 0
            
            # Поздние уходы (после 18:00)
            cursor.execute("""
                SELECT COUNT(DISTINCT employee_id)
                FROM daily_summary 
                WHERE work_date = ? 
                AND TIME(last_exit_time) > '18:00:00'
            """, (target_date,))
            report['late_departures'] = cursor.fetchone()[0] or 0
            
            return report
            
        except Exception as e:
            self.logger.error(f"Ошибка генерации отчета: {e}")
            return None
        finally:
            conn.close()
    
    def get_top_employees(self, days: int = 7):
        """Топ активных сотрудников за период"""
        
        start_date = date.today() - timedelta(days=days)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT 
                    e.full_name,
                    COUNT(al.id) as total_entries,
                    COUNT(DISTINCT DATE(al.access_datetime)) as days_present
                FROM employees e
                JOIN access_logs al ON e.id = al.employee_id
                WHERE DATE(al.access_datetime) >= ?
                GROUP BY e.id, e.full_name
                ORDER BY total_entries DESC
                LIMIT 10
            """, (start_date,))
            
            return cursor.fetchall()
            
        except Exception as e:
            self.logger.error(f"Ошибка получения топа сотрудников: {e}")
            return []
        finally:
            conn.close()
    
    def get_system_health(self):
        """Проверяет здоровье системы"""
        
        health = {
            'database_status': 'OK',
            'database_size_mb': 0,
            'last_file_processed': 'Нет данных',
            'processing_errors': 0,
            'backup_status': 'OK'
        }
        
        try:
            # Размер базы данных
            if os.path.exists(self.db_path):
                health['database_size_mb'] = round(os.path.getsize(self.db_path) / (1024 * 1024), 2)
            else:
                health['database_status'] = 'Файл БД не найден'
                return health
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Последний обработанный файл
            cursor.execute("""
                SELECT filename, processed_at 
                FROM files_metadata 
                ORDER BY processed_at DESC 
                LIMIT 1
            """)
            result = cursor.fetchone()
            if result:
                health['last_file_processed'] = f"{result[0]} ({result[1]})"
            
            # Проверяем наличие резервных копий
            backup_dir = Path("backups")
            if backup_dir.exists():
                backups = list(backup_dir.glob("skud_backup_*.db"))
                if not backups:
                    health['backup_status'] = 'Нет резервных копий'
                else:
                    latest_backup = max(backups, key=lambda p: p.stat().st_mtime)
                    backup_age = datetime.now() - datetime.fromtimestamp(latest_backup.stat().st_mtime)
                    if backup_age.days > 1:
                        health['backup_status'] = f'Устаревший бэкап ({backup_age.days} дней)'
            else:
                health['backup_status'] = 'Папка бэкапов не найдена'
            
            conn.close()
            
        except Exception as e:
            health['database_status'] = f'Ошибка: {e}'
        
        return health
    
    def print_dashboard(self):
        """Выводит дашборд в консоль"""
        
        print("📊 СКУД Dashboard")
        print("=" * 60)
        
        # Дневной отчет
        today_report = self.get_daily_report()
        if today_report:
            print(f"\n📅 Отчет за {today_report['date']}:")
            print(f"   Всего сотрудников: {today_report['total_employees']}")
            print(f"   Присутствовали: {today_report['employees_present']}")
            print(f"   Всего проходов: {today_report['total_entries']}")
            print(f"   Обеденных перерывов: {today_report['lunch_breaks']}")
            print(f"   Ранних приходов: {today_report['early_arrivals']}")
            print(f"   Поздних уходов: {today_report['late_departures']}")
        
        # Здоровье системы
        health = self.get_system_health()
        print(f"\n🏥 Состояние системы:")
        print(f"   База данных: {health['database_status']}")
        print(f"   Размер БД: {health['database_size_mb']} MB")
        print(f"   Последний файл: {health['last_file_processed']}")
        print(f"   Резервные копии: {health['backup_status']}")
        
        # Топ сотрудников
        top_employees = self.get_top_employees()
        if top_employees:
            print(f"\n🏆 Топ-5 активных сотрудников (7 дней):")
            for i, (name, entries, days) in enumerate(top_employees[:5], 1):
                print(f"   {i}. {name}: {entries} проходов за {days} дней")
        
        print("\n" + "=" * 60)

def main():
    """Основная функция мониторинга"""
    
    logging.basicConfig(level=logging.INFO)
    
    monitor = SkudMonitor()
    monitor.print_dashboard()
    
    # Опционально: генерируем отчеты за последние дни
    print("\n📈 Динамика за последние 7 дней:")
    for i in range(7):
        target_date = date.today() - timedelta(days=i)
        report = monitor.get_daily_report(target_date)
        if report and report['employees_present'] > 0:
            print(f"   {report['date']}: {report['employees_present']} сотр., {report['total_entries']} проходов")

if __name__ == "__main__":
    main()