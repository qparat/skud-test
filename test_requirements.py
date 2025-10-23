#!/usr/bin/env python3
"""
Тест проверки зависимостей для requirements.txt
"""

def test_requirements():
    """Проверяет валидность файла requirements.txt"""
    with open('requirements.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print("📋 Проверка requirements.txt:")
    print(f"  Найдено строк: {len(lines)}")
    
    valid_packages = []
    invalid_lines = []
    
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:  # Пустая строка
            continue
            
        if line.startswith('#'):  # Комментарий
            continue
            
        # Проверяем формат пакета
        if '>=' in line:
            package_name = line.split('>=')[0]
            version = line.split('>=')[1]
            if package_name and version:
                valid_packages.append(line)
                print(f"  ✅ {line}")
            else:
                invalid_lines.append((i, line))
                print(f"  ❌ Строка {i}: {line}")
        else:
            invalid_lines.append((i, line))
            print(f"  ❌ Строка {i}: {line}")
    
    print(f"\n📊 Результат:")
    print(f"  Валидных пакетов: {len(valid_packages)}")
    print(f"  Невалидных строк: {len(invalid_lines)}")
    
    if invalid_lines:
        print(f"\n❌ Найдены ошибки в строках: {[line[0] for line in invalid_lines]}")
        return False
    else:
        print(f"\n✅ Файл requirements.txt корректен!")
        return True

if __name__ == "__main__":
    test_requirements()