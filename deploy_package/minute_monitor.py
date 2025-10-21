#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Минутный мониторинг СКУД в реальном времени
Обновляется каждую минуту, показывает живую активность
"""

import sqlite3
import os
import time
import threading
from datetime import datetime, date, timedelta
from pathlib import Path
import sys

class RealTimeSkudMonitor:
    """Монитор СКУД в реальном времени с минутными обновлениями"""
    
    def __init__(self, db_path: str = "real_skud_data.db"):
        self.db_path = db_path
        self.running = False
        self.last_update = None
        self.stats_cache = {}
    
    def clear_screen(self):
        """Очищает экран консоли"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def get_current_stats(self):
        """Получает текущую статистику системы"""
        if not os.path.exists(self.db_path):
            return None
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            stats = {
                'timestamp': datetime.now(),
                'db_size_mb': round(os.path.getsize(self.db_path) / (1024 * 1024), 2),
                'total_employees': 0,
                'total_records': 0,
                'date_range': {'min': None, 'max': None},
                'last_activity': None,
                'today_activity': 0,
                'recent_entries': [],
                'daily_summary': {}
            }
            
            # Общая информация
            cursor.execute("SELECT COUNT(*) FROM employees")
            stats['total_employees'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM access_logs")
            stats['total_records'] = cursor.fetchone()[0]
            
            # Диапазон дат
            cursor.execute("SELECT MIN(access_date), MAX(access_date) FROM access_logs")
            min_date, max_date = cursor.fetchone()
            stats['date_range']['min'] = min_date
            stats['date_range']['max'] = max_date
            
            # Последняя активность
            cursor.execute("""
                SELECT full_name, access_datetime, access_type, door_location
                FROM access_logs 
                ORDER BY access_datetime DESC 
                LIMIT 1
            """)
            last_record = cursor.fetchone()
            if last_record:
                stats['last_activity'] = {
                    'name': last_record[0],
                    'datetime': last_record[1],
                    'type': last_record[2],
                    'door': last_record[3]
                }
            
            # Активность за сегодня
            today = date.today()
            cursor.execute("""
                SELECT COUNT(*) FROM access_logs 
                WHERE DATE(access_datetime) = ?
            """, (today,))
            stats['today_activity'] = cursor.fetchone()[0]
            
            # Последние записи (топ 10)
            cursor.execute("""
                SELECT full_name, access_datetime, access_type, door_location
                FROM access_logs 
                ORDER BY access_datetime DESC 
                LIMIT 10
            """)
            stats['recent_entries'] = cursor.fetchall()
            
            # Сводка по дням (последние 7 дней с данными)
            cursor.execute("""
                SELECT 
                    access_date, 
                    COUNT(*) as total_entries,
                    COUNT(DISTINCT employee_id) as unique_employees,
                    COUNT(CASE WHEN access_type = 'ВХОД' THEN 1 END) as entries,
                    COUNT(CASE WHEN access_type = 'ВЫХОД' THEN 1 END) as exits
                FROM access_logs 
                GROUP BY access_date 
                ORDER BY access_date DESC 
                LIMIT 7
            """)
            
            daily_data = cursor.fetchall()
            for row in daily_data:
                stats['daily_summary'][row[0]] = {
                    'total': row[1],
                    'employees': row[2], 
                    'entries': row[3],
                    'exits': row[4]
                }
            
            return stats
            
        except Exception as e:
            print(f"❌ Ошибка получения статистики: {e}")
            return None
        finally:
            conn.close()
    
    def display_dashboard(self, stats):
        """Отображает дашборд в реальном времени"""
        if not stats:
            print("❌ Нет данных для отображения")
            return
        
        self.clear_screen()
        
        # Заголовок с временем обновления
        print("🔴 СКУД МОНИТОРИНГ В РЕАЛЬНОМ ВРЕМЕНИ")
        print("=" * 80)
        print(f"🕒 Обновлено: {stats['timestamp'].strftime('%d.%m.%Y %H:%M:%S')}")
        print(f"💾 Размер БД: {stats['db_size_mb']} MB")
        
        # Основная статистика
        print(f"\n📊 ОБЩАЯ СТАТИСТИКА:")
        print("-" * 40)
        print(f"👥 Всего сотрудников: {stats['total_employees']:,}")
        print(f"📋 Всего записей: {stats['total_records']:,}")
        print(f"📅 Период данных: {stats['date_range']['min']} — {stats['date_range']['max']}")
        print(f"📈 За сегодня: {stats['today_activity']} записей")
        
        # Последняя активность
        print(f"\n🕐 ПОСЛЕДНЯЯ АКТИВНОСТЬ:")
        print("-" * 40)
        if stats['last_activity']:
            last = stats['last_activity']
            print(f"👤 Сотрудник: {last['name']}")
            print(f"📅 Время: {last['datetime']}")
            print(f"🚪 Действие: {last['type']} через {last['door'] or 'неизвестно'}")
        else:
            print("Нет записей об активности")
        
        # Последние 10 записей
        print(f"\n📝 ПОСЛЕДНИЕ 10 ЗАПИСЕЙ:")
        print("-" * 80)
        if stats['recent_entries']:
            print(f"{'№':<3} {'Сотрудник':<25} {'Время':<20} {'Действие':<8} {'Место':<15}")
            print("-" * 80)
            for i, (name, dt, action, door) in enumerate(stats['recent_entries'], 1):
                door_short = (door or '')[:14]
                name_short = name[:24]
                dt_short = dt[:19] if dt else ''
                print(f"{i:<3} {name_short:<25} {dt_short:<20} {action:<8} {door_short:<15}")
        
        # Сводка по дням
        print(f"\n📈 АКТИВНОСТЬ ПО ДНЯМ:")
        print("-" * 60)
        print(f"{'Дата':<12} {'Записей':<10} {'Сотрудников':<12} {'Входы':<8} {'Выходы':<8}")
        print("-" * 60)
        
        for date_str, summary in stats['daily_summary'].items():
            dt_formatted = datetime.strptime(date_str, '%Y-%m-%d').strftime('%d.%m.%Y')
            print(f"{dt_formatted:<12} {summary['total']:<10,} {summary['employees']:<12} "
                  f"{summary['entries']:<8} {summary['exits']:<8}")
        
        # Статус системы
        print(f"\n🏥 СТАТУС СИСТЕМЫ:")
        print("-" * 30)
        
        # Проверка бэкапов
        backup_dir = Path("backups")
        backup_status = "❌ Нет бэкапов"
        if backup_dir.exists():
            backups = list(backup_dir.glob("skud_backup_*.db"))
            if backups:
                latest_backup = max(backups, key=lambda p: p.stat().st_mtime)
                backup_time = datetime.fromtimestamp(latest_backup.stat().st_mtime)
                backup_age = datetime.now() - backup_time
                if backup_age.total_seconds() < 86400:  # Менее суток
                    backup_status = f"✅ Свежий бэкап ({backup_age.seconds//3600}ч назад)"
                else:
                    backup_status = f"⚠️ Старый бэкап ({backup_age.days} дней)"
        
        print(f"💾 Резервные копии: {backup_status}")
        
        # Проверка активности главной системы
        main_log = Path("skud_processing.log")
        main_status = "❓ Статус неизвестен"
        if main_log.exists():
            log_time = datetime.fromtimestamp(main_log.stat().st_mtime)
            log_age = datetime.now() - log_time
            if log_age.total_seconds() < 300:  # Менее 5 минут
                main_status = "🟢 Система активна"
            elif log_age.total_seconds() < 1800:  # Менее 30 минут
                main_status = "🟡 Система неактивна"
            else:
                main_status = "🔴 Система остановлена"
        
        print(f"🔄 Основная система: {main_status}")
        
        # Инструкции
        print(f"\n💡 УПРАВЛЕНИЕ:")
        print("Ctrl+C - выход из мониторинга")
        print("Обновление каждые 60 секунд...")
        
        print("=" * 80)
    
    def run_monitoring(self, update_interval: int = 60):
        """Запускает мониторинг с заданным интервалом обновления"""
        
        self.running = True
        print(f"🚀 Запуск мониторинга СКУД (обновление каждые {update_interval} сек)")
        
        try:
            while self.running:
                # Получаем и отображаем статистику
                stats = self.get_current_stats()
                self.display_dashboard(stats)
                
                # Ждем до следующего обновления
                for i in range(update_interval):
                    if not self.running:
                        break
                    time.sleep(1)
                    
                    # Показываем обратный отсчет в заголовке
                    remaining = update_interval - i - 1
                    if remaining > 0 and remaining % 10 == 0:
                        sys.stdout.write(f"\r🔄 Следующее обновление через {remaining} секунд...")
                        sys.stdout.flush()
        
        except KeyboardInterrupt:
            self.stop_monitoring()
        except Exception as e:
            print(f"❌ Ошибка мониторинга: {e}")
            self.stop_monitoring()
    
    def stop_monitoring(self):
        """Останавливает мониторинг"""
        self.running = False
        self.clear_screen()
        print("🛑 Мониторинг СКУД остановлен")
        print("👋 До свидания!")

def main():
    """Основная функция для запуска минутного мониторинга"""
    
    print("🔍 ИНИЦИАЛИЗАЦИЯ МИНУТНОГО МОНИТОРИНГА СКУД")
    print("-" * 50)
    
    # Проверяем наличие базы данных
    if not os.path.exists("real_skud_data.db"):
        print("❌ База данных 'real_skud_data.db' не найдена!")
        print("   Убедитесь, что основная система СКУД запущена.")
        return
    
    # Создаем и запускаем монитор
    monitor = RealTimeSkudMonitor()
    
    # Предлагаем выбор интервала обновления
    print("\nВыберите интервал обновления:")
    print("1. Каждую минуту (60 сек) - рекомендуется")
    print("2. Каждые 30 секунд - быстро")
    print("3. Каждые 10 секунд - очень быстро")
    print("4. Каждые 5 секунд - максимально быстро")
    
    try:
        choice = input("\nВыберите вариант (1-4) или Enter для минутного: ").strip()
        
        intervals = {'1': 60, '2': 30, '3': 10, '4': 5, '': 60}
        interval = intervals.get(choice, 60)
        
        print(f"\n🎯 Интервал обновления установлен: {interval} секунд")
        print("   Нажмите Ctrl+C для остановки мониторинга")
        
        time.sleep(2)  # Пауза перед запуском
        
        monitor.run_monitoring(interval)
        
    except KeyboardInterrupt:
        print("\n🛑 Запуск отменен пользователем")
    except Exception as e:
        print(f"❌ Ошибка запуска: {e}")

if __name__ == "__main__":
    main()