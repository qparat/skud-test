#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ПРОСТОЙ ПАРСЕР ДАННЫХ СКУД
Просто положи txt файл в папку data_input и запусти этот скрипт
"""

import time
import os
from pathlib import Path
from database_integrator import SkudDatabaseIntegrator

def main():
    print("🔍 СКУД Парсер - Поиск новых файлов...")
    
    # Папка для входных данных
    input_folder = Path("data_input")
    processed_folder = Path("processed_real_skud")
    processed_folder.mkdir(exist_ok=True)
    
    # Ищем txt файлы
    txt_files = list(input_folder.glob("*.txt"))
    
    if not txt_files:
        print("❌ Нет файлов для обработки в папке data_input")
        print("📁 Положи txt файлы в папку data_input и запусти снова")
        input("Нажми Enter для выхода...")
        return
    
    print(f"📂 Найдено файлов: {len(txt_files)}")
    for file in txt_files:
        print(f"   📄 {file.name}")
    
    # Подключаемся к базе
    print("\n🔗 Подключение к базе данных...")
    integrator = SkudDatabaseIntegrator()
    if not integrator.connect():
        print("❌ Ошибка подключения к базе данных")
        input("Нажми Enter для выхода...")
        return
    
    print("\n📊 Текущая статистика:")
    integrator.get_statistics()
    
    print(f"\n🚀 Начинаю обработку {len(txt_files)} файла(ов)...")
    
    total_new_records = 0
    total_time = 0
    
    for txt_file in txt_files:
        print(f"\n📄 Обрабатываю: {txt_file.name}")
        start_time = time.time()
        
        try:
            success = integrator.import_from_file(str(txt_file))
            end_time = time.time()
            processing_time = end_time - start_time
            total_time += processing_time
            
            if success:
                print(f"   ✅ Файл обработан за {processing_time:.2f} сек")
                
                # Перемещаем в processed
                processed_file = processed_folder / txt_file.name
                if processed_file.exists():
                    processed_file.unlink()  # Удаляем если существует
                txt_file.rename(processed_file)
                print(f"   📦 Перемещен в: processed_real_skud/{txt_file.name}")
            else:
                print(f"   ❌ Ошибка при обработке файла")
                
        except Exception as e:
            print(f"   ❌ Ошибка: {e}")
    
    print(f"\n📊 ИТОГОВАЯ СТАТИСТИКА:")
    integrator.get_statistics()
    
    integrator.connection.close()
    
    print(f"\n🎯 РЕЗУЛЬТАТ:")
    print(f"   ⏱️ Время обработки: {total_time:.2f} сек")
    print(f"   ✅ Данные загружены в базу")
    print(f"   🌐 Доступны в веб-интерфейсе")
    print("\n✅ ГОТОВО! Можешь проверить данные в фронтенде.")
    
    input("\nНажми Enter для выхода...")

if __name__ == "__main__":
    main()