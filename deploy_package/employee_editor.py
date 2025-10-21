#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Редактор данных сотрудников СКУД
Позволяет безопасно редактировать должности и отделы
"""

import sqlite3
from datetime import datetime

class EmployeeEditor:
    """Редактор данных сотрудников"""
    
    def __init__(self, db_path="real_skud_data.db"):
        self.db_path = db_path
    
    def list_employees(self, limit=20):
        """Показывает список сотрудников"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, full_name, position, department 
            FROM employees 
            ORDER BY full_name 
            LIMIT ?
        """, (limit,))
        
        employees = cursor.fetchall()
        
        print(f"{'ID':<4} {'ФИО':<30} {'Должность':<25} {'Отдел':<20}")
        print("-" * 80)
        
        for emp_id, name, position, department in employees:
            pos_str = position or "Не указано"
            dept_str = department or "Не указано" 
            print(f"{emp_id:<4} {name[:29]:<30} {pos_str[:24]:<25} {dept_str[:19]:<20}")
        
        conn.close()
        return employees
    
    def search_employee(self, search_term):
        """Поиск сотрудника по имени"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, full_name, position, department 
            FROM employees 
            WHERE full_name LIKE ? 
            ORDER BY full_name
        """, (f"%{search_term}%",))
        
        return cursor.fetchall()
    
    def update_employee(self, emp_id, position=None, department=None):
        """Обновляет данные сотрудника"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT full_name FROM employees WHERE id = ?", (emp_id,))
        employee = cursor.fetchone()
        
        if not employee:
            print(f"❌ Сотрудник с ID {emp_id} не найден")
            conn.close()
            return False
        
        # Обновляем данные
        updates = []
        params = []
        
        if position is not None:
            updates.append("position = ?")
            params.append(position)
        
        if department is not None:
            updates.append("department = ?")
            params.append(department)
        
        if updates:
            updates.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(emp_id)
            
            sql = f"UPDATE employees SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(sql, params)
            conn.commit()
            
            print(f"✅ Данные сотрудника {employee[0]} обновлены")
            
            # Показываем новые данные
            cursor.execute("SELECT position, department FROM employees WHERE id = ?", (emp_id,))
            new_data = cursor.fetchone()
            print(f"   Должность: {new_data[0] or 'Не указано'}")
            print(f"   Отдел: {new_data[1] or 'Не указано'}")
        
        conn.close()
        return True

def main():
    """Основная функция редактора"""
    
    editor = EmployeeEditor()
    
    print("👥 РЕДАКТОР ДАННЫХ СОТРУДНИКОВ СКУД")
    print("=" * 50)
    
    while True:
        print("\n📋 Доступные команды:")
        print("1. Показать список сотрудников")
        print("2. Найти сотрудника")
        print("3. Редактировать данные сотрудника")
        print("4. Выход")
        
        try:
            choice = input("\nВыберите действие (1-4): ").strip()
            
            if choice == "1":
                limit = input("Сколько записей показать? (по умолчанию 20): ").strip()
                limit = int(limit) if limit.isdigit() else 20
                editor.list_employees(limit)
            
            elif choice == "2":
                search_term = input("Введите часть имени для поиска: ").strip()
                if search_term:
                    results = editor.search_employee(search_term)
                    if results:
                        print(f"\nНайдено сотрудников: {len(results)}")
                        print(f"{'ID':<4} {'ФИО':<30} {'Должность':<25} {'Отдел':<20}")
                        print("-" * 80)
                        for emp_id, name, position, department in results:
                            pos_str = position or "Не указано"
                            dept_str = department or "Не указано"
                            print(f"{emp_id:<4} {name[:29]:<30} {pos_str[:24]:<25} {dept_str[:19]:<20}")
                    else:
                        print("❌ Сотрудники не найдены")
            
            elif choice == "3":
                emp_id = input("Введите ID сотрудника: ").strip()
                if emp_id.isdigit():
                    emp_id = int(emp_id)
                    
                    position = input("Новая должность (Enter - не менять): ").strip()
                    department = input("Новый отдел (Enter - не менять): ").strip()
                    
                    position = position if position else None
                    department = department if department else None
                    
                    if position or department:
                        editor.update_employee(emp_id, position, department)
                    else:
                        print("❌ Нет данных для обновления")
                else:
                    print("❌ Введите корректный ID")
            
            elif choice == "4":
                print("👋 До свидания!")
                break
            
            else:
                print("❌ Неверный выбор")
                
        except KeyboardInterrupt:
            print("\n👋 До свидания!")
            break
        except Exception as e:
            print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main()
