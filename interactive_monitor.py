#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Интерактивный мониторинг СКУД с возможностью выбора даты
"""

import sqlite3
import os
from datetime import datetime, date, timedelta
from skud_monitor import SkudMonitor

def show_available_dates():
    """Показывает доступные даты в базе данных"""
    conn = sqlite3.connect("real_skud_data.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT access_date, COUNT(*) as records_count
        FROM access_logs 
        GROUP BY access_date 
        ORDER BY access_date DESC
    """)
    
    dates = cursor.fetchall()
    conn.close()
    
    print("\n📅 Доступные даты в базе данных:")
    print("-" * 40)
    for i, (date_str, count) in enumerate(dates, 1):
        print(f"{i:2d}. {date_str} ({count:,} записей)")
    
    return dates

def get_date_choice(available_dates):
    """Получает выбор даты от пользователя"""
    
    while True:
        try:
            choice = input(f"\nВыберите дату (1-{len(available_dates)}) или Enter для последней: ").strip()
            
            if choice == "":
                return available_dates[0][0]  # Последняя дата
            
            choice_num = int(choice)
            if 1 <= choice_num <= len(available_dates):
                return available_dates[choice_num - 1][0]
            else:
                print(f"❌ Выберите число от 1 до {len(available_dates)}")
                
        except ValueError:
            print("❌ Введите число или нажмите Enter")
        except KeyboardInterrupt:
            print("\n👋 До свидания!")
            exit()

def show_detailed_report(target_date_str):
    """Показывает детальный отчет за выбранную дату"""
    
    # Преобразуем строку в date объект
    target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
    
    monitor = SkudMonitor()
    
    print(f"\n📊 ДЕТАЛЬНЫЙ ОТЧЕТ ЗА {target_date.strftime('%d.%m.%Y')}")
    print("=" * 70)
    
    # Основной отчет
    report = monitor.get_daily_report(target_date)
    if report:
        print(f"\n📈 Общая статистика:")
        print(f"   👥 Всего сотрудников в системе: {report['total_employees']}")
        print(f"   ✅ Присутствовали на работе: {report['employees_present']}")
        print(f"   🚪 Всего проходов через турникеты: {report['total_entries']:,}")
        print(f"   🍽️  Обеденных перерывов: {report['lunch_breaks']}")
        print(f"   🌅 Ранних приходов (до 8:00): {report['early_arrivals']}")
        print(f"   🌙 Поздних уходов (после 18:00): {report['late_departures']}")
    
    # Топ сотрудников за период
    conn = sqlite3.connect("real_skud_data.db")
    cursor = conn.cursor()
    
    # Самые активные сотрудники за этот день
    cursor.execute("""
        SELECT full_name, COUNT(*) as entries
        FROM access_logs 
        WHERE access_date = ?
        GROUP BY employee_id, full_name
        ORDER BY entries DESC
        LIMIT 5
    """, (target_date_str,))
    
    top_daily = cursor.fetchall()
    if top_daily:
        print(f"\n🏆 Топ-5 активных сотрудников за день:")
        for i, (name, entries) in enumerate(top_daily, 1):
            print(f"   {i}. {name}: {entries} проходов")
    
    # Статистика по времени
    cursor.execute("""
        SELECT 
            CASE 
                WHEN TIME(access_time) < '09:00:00' THEN 'Раннее утро (до 9:00)'
                WHEN TIME(access_time) < '12:00:00' THEN 'Утро (9:00-12:00)'
                WHEN TIME(access_time) < '14:00:00' THEN 'Обед (12:00-14:00)'
                WHEN TIME(access_time) < '18:00:00' THEN 'День (14:00-18:00)'
                ELSE 'Вечер (после 18:00)'
            END as time_period,
            COUNT(*) as entries
        FROM access_logs 
        WHERE access_date = ?
        GROUP BY time_period
        ORDER BY entries DESC
    """, (target_date_str,))
    
    time_stats = cursor.fetchall()
    if time_stats:
        print(f"\n⏰ Активность по времени суток:")
        for period, entries in time_stats:
            print(f"   {period}: {entries:,} проходов")
    
    # Статистика по турникетам
    cursor.execute("""
        SELECT door_location, COUNT(*) as entries
        FROM access_logs 
        WHERE access_date = ? AND door_location IS NOT NULL
        GROUP BY door_location
        ORDER BY entries DESC
    """, (target_date_str,))
    
    door_stats = cursor.fetchall()
    if door_stats:
        print(f"\n🚪 Активность по турникетам:")
        for door, entries in door_stats:
            print(f"   {door}: {entries:,} проходов")
    
    conn.close()
    print("\n" + "=" * 70)

def main():
    """Основная функция интерактивного мониторинга"""
    
    print("🔍 ИНТЕРАКТИВНЫЙ МОНИТОРИНГ СИСТЕМЫ СКУД")
    print("=" * 50)
    
    # Проверяем наличие базы данных
    if not os.path.exists("real_skud_data.db"):
        print("❌ База данных не найдена!")
        return
    
    # Показываем общее состояние системы
    monitor = SkudMonitor()
    health = monitor.get_system_health()
    print(f"\n🏥 Состояние системы:")
    print(f"   📊 Размер БД: {health['database_size_mb']} MB")
    print(f"   💾 Резервные копии: {health['backup_status']}")
    
    while True:
        try:
            # Показываем доступные даты
            available_dates = show_available_dates()
            
            if not available_dates:
                print("❌ В базе данных нет записей!")
                break
            
            # Получаем выбор пользователя
            selected_date = get_date_choice(available_dates)
            
            # Показываем детальный отчет
            show_detailed_report(selected_date)
            
            # Спрашиваем, продолжить ли
            continue_choice = input("\n🔄 Посмотреть другую дату? (y/N): ").strip().lower()
            if continue_choice not in ['y', 'yes', 'д', 'да']:
                break
                
        except KeyboardInterrupt:
            print("\n👋 До свидания!")
            break
    
    print("\n✅ Мониторинг завершен.")

if __name__ == "__main__":
    main()