#!/usr/bin/env python3
"""
Скрипт для создания первого root пользователя в системе СКУД
"""

import sqlite3
import hashlib
import getpass
import sys
import os

def hash_password(password: str) -> str:
    """Хеширует пароль"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_root_user():
    """Создает первого root пользователя"""
    
    # Проверяем наличие БД
    db_path = "real_skud_data.db"
    if not os.path.exists(db_path):
        print("❌ База данных не найдена. Сначала запустите API сервер для создания таблиц.")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Проверяем, есть ли уже root пользователи
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 0")
        root_count = cursor.fetchone()[0]
        
        if root_count > 0:
            print("⚠️  Root пользователь уже существует в системе.")
            response = input("Создать еще одного root пользователя? (y/N): ")
            if response.lower() != 'y':
                return False
        
        print("🔐 Создание Root пользователя")
        print("=" * 40)
        
        # Получаем данные пользователя
        username = input("Имя пользователя: ").strip()
        if not username:
            print("❌ Имя пользователя не может быть пустым")
            return False
            
        email = input("Email: ").strip()
        if not email:
            print("❌ Email не может быть пустым")
            return False
            
        full_name = input("Полное имя (необязательно): ").strip()
        
        # Получаем пароль
        password = getpass.getpass("Пароль: ")
        if len(password) < 6:
            print("❌ Пароль должен содержать минимум 6 символов")
            return False
            
        password_confirm = getpass.getpass("Подтвердите пароль: ")
        if password != password_confirm:
            print("❌ Пароли не совпадают")
            return False
        
        # Проверяем уникальность
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email))
        if cursor.fetchone():
            print("❌ Пользователь с таким именем или email уже существует")
            return False
        
        # Хешируем пароль
        password_hash = hash_password(password)
        
        # Создаем пользователя
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role, is_active)
            VALUES (?, ?, ?, ?, 0, 1)
        """, (username, email, password_hash, full_name if full_name else None))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        print(f"✅ Root пользователь создан успешно!")
        print(f"   ID: {user_id}")
        print(f"   Имя пользователя: {username}")
        print(f"   Email: {email}")
        print(f"   Полное имя: {full_name if full_name else 'Не указано'}")
        print(f"   Роль: Root (0)")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка создания пользователя: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

def main():
    print("🚀 СКУД - Создание Root пользователя")
    print("=" * 50)
    
    if create_root_user():
        print("\n🎉 Теперь вы можете войти в систему используя созданные учетные данные.")
        print("   Для входа откройте http://localhost:3000/login")
    else:
        print("\n❌ Не удалось создать пользователя.")
        sys.exit(1)

if __name__ == "__main__":
    main()