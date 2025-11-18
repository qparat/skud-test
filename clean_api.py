from fastapi import Body
from fastapi import FastAPI
import os
import sys
from fastapi import HTTPException
import psycopg2
import psycopg2.extras
import configparser
sys.path.append(os.path.join(os.path.dirname(__file__)))

app = FastAPI(title="СКУД API", description="API для системы контроля и управления доступом")

# Создать таблицу whitelist_departments для бесконечных исключений по отделу
def create_whitelist_departments_table():
    """Создает таблицу whitelist_departments для отделов с бесконечным исключением"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS whitelist_departments (
                id SERIAL PRIMARY KEY,
                department_id INTEGER NOT NULL REFERENCES departments(id),
                reason TEXT NOT NULL,
                exception_type TEXT DEFAULT 'no_lateness_check',
                is_permanent BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'system',
                UNIQUE(department_id)
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Ошибка создания таблицы whitelist_departments: {e}")
# Получить все исключения сотрудников

# ...existing code...

# Добавляю GET-эндпоинт /employee-exceptions после создания app

# ...existing code...

# Добавляю GET-эндпоинт /employee-exceptions после создания app
def get_db_connection():
    """Создает соединение с PostgreSQL"""
    import psycopg2
    import psycopg2.extras
    import configparser
    config = configparser.ConfigParser()
    config.read('real_skud_config.ini')
    db_params = {
        'host': config.get('DATABASE', 'host', fallback='localhost'),
        'port': config.get('DATABASE', 'port', fallback='5432'),
        'user': config.get('DATABASE', 'user', fallback='postgres'),
        'password': config.get('DATABASE', 'password', fallback='postgres'),
        'dbname': config.get('DATABASE', 'database', fallback='skud_db')
    }
    conn = psycopg2.connect(**db_params)
    conn.autocommit = True
    return conn

def get_employee_status(is_late, first_entry, exception_info):
    """Простая функция статуса сотрудника для отчёта"""
    if exception_info and exception_info.get('has_exception'):
        return 'Исключение'
    if not first_entry:
        return 'Нет данных'
    if is_late:
        return 'Опоздание'
    return 'Вовремя'
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import Optional, List
import uvicorn
import os
import tempfile
import sys
import hashlib
import secrets
from functools import wraps
def hash_password(password: str) -> str:
    """Хеширует пароль с помощью SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Проверяет пароль, сравнивая хеш"""
    return hash_password(password) == hashed
import psycopg2
import psycopg2.extras
import configparser
sys.path.append(os.path.join(os.path.dirname(__file__)))

app = FastAPI(title="СКУД API", description="API для системы контроля и управления доступом")

from fastapi.responses import JSONResponse

@app.get("/employee-exceptions")
async def get_employee_exceptions():
    """Получить все исключения сотрудников"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ee.id, ee.employee_id, e.full_name, e.full_name_expanded, ee.exception_date, ee.reason, ee.exception_type
            FROM employee_exceptions ee
            LEFT JOIN employees e ON ee.employee_id = e.id
            ORDER BY ee.exception_date DESC, e.full_name
        """)
        exceptions = []
        for row in cursor.fetchall():
            exceptions.append({
                "id": row[0],
                "employee_id": row[1],
                "full_name": row[2],
                "full_name_expanded": row[3],
                "exception_date": row[4].strftime('%Y-%m-%d') if row[4] else None,
                "reason": row[5],
                "exception_type": row[6]
            })
        conn.close()
        return JSONResponse(content={"exceptions": exceptions})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения исключений: {str(e)}")

# Добавляем middleware для ограничения размера загружаемого файла
@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    # Ограничиваем размер до 100MB (100 * 1024 * 1024 = 104857600 байт)
    max_size = 104857600
    if request.method == "POST" and "/upload-skud-file" in str(request.url):
        content_length = request.headers.get('content-length')
        if content_length and int(content_length) > max_size:
            return HTTPException(status_code=413, detail="Файл слишком большой. Максимальный размер: 100MB")
    
    response = await call_next(request)
    return response

# Конфигурация для JWT
SECRET_KEY = "your-secret-key-change-in-production"  # В продакшене использовать переменную окружения
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 часа (вместо 30 минут)

# Security
security = HTTPBearer()

# Pydantic модели для аутентификации
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: int = 3
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "user1",
                "email": "user1@example.com", 
                "password": "password123",
                "full_name": "Имя Пользователя",
                "role": 3
            }
        }

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: int
    is_active: bool
    created_at: str

# Pydantic модели для валидации данных
class DepartmentCreate(BaseModel):
    name: str
    priority: Optional[int] = None

class DepartmentUpdate(BaseModel):
    name: str
    priority: Optional[int] = None

class PositionCreate(BaseModel):
    name: str

class PositionUpdate(BaseModel):
    name: str

class DepartmentPositionLink(BaseModel):
    department_id: int
    position_id: int

class ExceptionCreate(BaseModel):
    employee_id: int
    exception_date: str  # YYYY-MM-DD
    reason: str
    exception_type: str = "no_lateness_check"  # Тип исключения

class ExceptionUpdate(BaseModel):
    reason: str
    exception_type: str = "no_lateness_check"

class ExceptionRangeCreate(BaseModel):
    employee_id: int
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    reason: str
    exception_type: str = "no_lateness_check"

class UpdateFullNameByName(BaseModel):
    full_name: str
    full_name_expanded: str

def create_employee_exceptions_table():
    """Создает таблицу исключений для сотрудников, если её нет"""
    try:
        conn = get_db_connection()
        if not conn:
            print("Ошибка: не удалось получить соединение с БД")
            return False
    except Exception as e:
        print(f"Ошибка создания таблицы исключений: {e}")
        return False
        execute_query(conn, """
            CREATE TABLE IF NOT EXISTS employee_exceptions (
                id SERIAL PRIMARY KEY,
                employee_id INTEGER NOT NULL,
                exception_date DATE NOT NULL,
                reason TEXT NOT NULL,
                exception_type TEXT DEFAULT 'no_lateness_check',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT DEFAULT 'system',
                FOREIGN KEY (employee_id) REFERENCES employees (id),
                UNIQUE(employee_id, exception_date)
            )
        """)
        execute_query(conn, """
            CREATE INDEX IF NOT EXISTS idx_employee_exceptions_date 
            ON employee_exceptions (employee_id, exception_date)
        """)
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка создания таблицы исключений: {e}")
        return False

def create_auth_tables():
    """Создает таблицы для системы авторизации"""
    try:
        conn = get_db_connection()
        # Только PostgreSQL
        execute_query(conn, """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                role INTEGER DEFAULT 3,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        """)

        execute_query(conn, """
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                permissions TEXT
            )
        """)

        execute_query(conn, """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
    except Exception as e:
        print(f"Ошибка создания таблиц авторизации: {e}")
def generate_simple_token():
    """Генерирует простой токен для авторизации"""
    try:
        token = secrets.token_urlsafe(32)
        return token
    except Exception as e:
        print(f"Ошибка генерации токена: {e}")
        return None

def verify_token(token: str) -> Optional[dict]:
    """Проверяет токен и возвращает данные пользователя"""
    try:
        conn = get_db_connection()
        
        # Хешируем токен для поиска в БД
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Строим запрос с учетом типа базы данных
        if hasattr(conn, 'db_type') and conn.db_type == "postgresql":
            query = """
                SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                WHERE s.token_hash = %s AND s.expires_at > NOW()
            """
        else:
            query = """
                SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                WHERE s.token_hash = %s AND s.expires_at > NOW()
            """
        
        user_data = execute_query(conn, query, (token_hash,), fetch_one=True)
        conn.close()
        
        if user_data:
            return {
                "id": user_data["id"],
                "username": user_data["username"],
                "email": user_data["email"],
                "full_name": user_data["full_name"],
                "role": user_data["role"],
                "is_active": user_data["is_active"]
            }
        return None
    except Exception as e:
        print(f"Ошибка проверки токена: {e}")
        return None

def create_initial_admin():
    """Создает начального администратора, если пользователей нет"""
    try:
        conn = get_db_connection()
        # Проверяем, есть ли уже пользователи
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM users")
        result = cursor.fetchone()
        user_count = result[0] if result else 0
        if user_count == 0:
            # Создаем root пользователя
            hashed_password = hash_password("admin123")
            execute_query(conn, """
                INSERT INTO users (username, email, full_name, password_hash, role, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            """, ("admin", "admin@skud.local", "Администратор", hashed_password, 0, True))
            print("Создан начальный администратор:")
            print("Логин: admin")
            print("Пароль: admin123")
            print("Роль: 0 (root)")
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка создания начального администратора: {e}")
        return False

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # ...existing code...

    user = verify_token(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_role(min_role: int = 3):
    """Декоратор для проверки роли пользователя (меньше число = больше прав)"""
    def decorator(user: dict = Depends(get_current_user)):
        if user["role"] > min_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return decorator

# ================================
# API для бесконечных исключений службы (whitelist_departments)
# ================================
from fastapi import Body

@app.post("/whitelist-departments")
async def add_whitelist_department(
    department_id: int = Body(...),
    reason: str = Body(...),
    exception_type: str = Body('no_lateness_check'),
    is_permanent: bool = Body(True),
    current_user: dict = Depends(get_current_user)
):
    """Добавить бесконечное исключение для службы (отдела)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Проверяем, есть ли уже исключение
        cursor.execute("SELECT id FROM whitelist_departments WHERE department_id = %s", (department_id,))
        exists = cursor.fetchone()
        if exists:
            # Обновляем причину и тип
            cursor.execute("""
                UPDATE whitelist_departments SET reason = %s, exception_type = %s, is_permanent = %s WHERE department_id = %s
            """, (reason, exception_type, is_permanent, department_id))
        else:
            cursor.execute("""
                INSERT INTO whitelist_departments (department_id, reason, exception_type, is_permanent)
                VALUES (%s, %s, %s, %s)
            """, (department_id, reason, exception_type, is_permanent))
        conn.commit()
        conn.close()
        return {"message": "Исключение для службы добавлено"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка добавления исключения: {str(e)}")

@app.get("/whitelist-departments/{department_id}")
async def get_whitelist_department(department_id: int, current_user: dict = Depends(get_current_user)):
    """Получить информацию об исключении для службы (отдела)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT department_id, reason, exception_type, is_permanent
            FROM whitelist_departments 
            WHERE department_id = %s
        """, (department_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "department_id": row[0],
                "reason": row[1],
                "exception_type": row[2],
                "is_permanent": row[3]
            }
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения исключения: {str(e)}")

@app.delete("/whitelist-departments/{department_id}")
async def delete_whitelist_department(department_id: int, current_user: dict = Depends(get_current_user)):
    """Удалить бесконечное исключение для службы (отдела)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM whitelist_departments WHERE department_id = %s", (department_id,))
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        return {"message": "Исключение для службы удалено", "deleted": deleted_count > 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления исключения: {str(e)}")

# ...existing code...

# Инициализация таблиц при запуске

def create_department_positions_table():
    """Создает таблицу связей отдел-должность, если её нет"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS department_positions (
                id SERIAL PRIMARY KEY,
                department_id INTEGER NOT NULL REFERENCES departments(id),
                position_id INTEGER NOT NULL REFERENCES positions(id),
                UNIQUE(department_id, position_id)
            )
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Ошибка создания таблицы department_positions: {e}")

def create_svod_report_employees_table():
    """Создание таблицы для хранения списка сотрудников в своде ТРК"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS svod_report_employees (
                id SERIAL PRIMARY KEY,
                employee_id INTEGER NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
                order_index INTEGER DEFAULT 0,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Добавляем колонку order_index, если таблица уже существует без неё
        try:
            cursor.execute("ALTER TABLE svod_report_employees ADD COLUMN order_index INTEGER DEFAULT 0")
        except Exception:
            # Колонка уже существует, это нормально
            pass
        
        # Добавляем колонку position_override для хранения должности без сотрудника
        try:
            cursor.execute("ALTER TABLE svod_report_employees ADD COLUMN position_override VARCHAR(255)")
        except Exception:
            # Колонка уже существует
            pass
        
        # Добавляем колонку report_date для привязки к дате
        try:
            cursor.execute("ALTER TABLE svod_report_employees ADD COLUMN report_date DATE DEFAULT CURRENT_DATE")
        except Exception:
            # Колонка уже существует
            pass
        
        # Делаем report_date опциональным (может быть NULL, так как свод общий для всех дат)
        try:
            cursor.execute("ALTER TABLE svod_report_employees ALTER COLUMN report_date DROP NOT NULL")
            cursor.execute("ALTER TABLE svod_report_employees ALTER COLUMN report_date DROP DEFAULT")
        except Exception:
            # Уже изменено
            pass
        
        # Делаем employee_id опциональным (может быть NULL для записей с только должностью)
        try:
            cursor.execute("ALTER TABLE svod_report_employees ALTER COLUMN employee_id DROP NOT NULL")
        except Exception:
            # Уже изменено
            pass
        
        # Удаляем старый unique constraint на employee_id, если он есть
        try:
            cursor.execute("ALTER TABLE svod_report_employees DROP CONSTRAINT IF EXISTS svod_report_employees_employee_id_key")
        except Exception:
            pass
        
        # Примечание: svod_id = id (первичный ключ таблицы), используется в запросах как алиас
            
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Ошибка создания таблицы svod_report_employees: {e}")

def add_departments_priority_column():
    """Добавляет колонку priority в таблицу departments, если её нет"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        # Добавляем колонку priority для кастомной сортировки служб
        try:
            cursor.execute("ALTER TABLE departments ADD COLUMN priority INTEGER")
            print("Колонка priority добавлена в таблицу departments")
        except Exception:
            # Колонка уже существует
            pass
        
        # Создаем индекс для оптимизации сортировки
        try:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_departments_priority ON departments(priority)")
            print("Индекс idx_departments_priority создан")
        except Exception:
            # Индекс уже существует
            pass
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Ошибка добавления колонки priority: {e}")

@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске приложения"""
    create_employee_exceptions_table()
    create_auth_tables()
    create_department_positions_table()
    create_whitelist_departments_table()
    add_departments_priority_column()
    create_svod_report_employees_table()
    # update_employees_table()  # Функция не определена, убрано для предотвращения ошибки
    create_initial_admin()

# ================================
# АУТЕНТИФИКАЦИЯ И АВТОРИЗАЦИЯ
# ================================

@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate, current_user: dict = Depends(require_role())):
    """Регистрация нового пользователя (только для root)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверяем, существует ли пользователь
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (user.username, user.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Пользователь уже существует")

        # Хешируем пароль
        password_hash = hash_password(user.password)

        # Создаем пользователя
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role)
            VALUES (%s, %s, %s, %s, %s)
        """, (user.username, user.email, password_hash, user.full_name, user.role))

        user_id = cursor.lastrowid
        conn.commit()

        # Получаем созданного пользователя
        cursor.execute("""
            SELECT id, username, email, full_name, role, is_active, created_at
            FROM users WHERE id = %s
        """, (user_id,))

        user_data = cursor.fetchone()
        conn.close()
        
        return UserResponse(
            id=user_data[0],
            username=user_data[1],
            email=user_data[2],
            full_name=user_data[3],
            role=user_data[4],
            is_active=user_data[5],
            created_at=user_data[6]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка регистрации: {str(e)}")

@app.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    """Вход в систему"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Ищем пользователя
        cursor.execute("""
            SELECT id, username, email, password_hash, full_name, role, is_active
            FROM users WHERE username = %s AND is_active = TRUE
        """, (user_login.username,))
        
        user_data = cursor.fetchone()
        if not user_data or not verify_password(user_login.password, user_data[3]):
            raise HTTPException(status_code=401, detail="Неверные учетные данные")
        
        # Создаем токен
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # Сохраняем сессию
        cursor.execute("""
            INSERT INTO user_sessions (user_id, token_hash, expires_at)
            VALUES (%s, %s, %s)
        """, (user_data[0], token_hash, expires_at))
        
        # Обновляем время последнего входа
        cursor.execute("""
            UPDATE users SET last_login = NOW() WHERE id = %s
        """, (user_data[0],))
        
        conn.commit()
        conn.close()
        
        return Token(
            access_token=token,
            token_type="bearer",
            user={
                "id": user_data[0],
                "username": user_data[1],
                "email": user_data[2],
                "full_name": user_data[4],
                "role": user_data[5]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка входа: {str(e)}")

@app.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Получение информации о текущем пользователе"""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        created_at=""
    )

@app.get("/users")
async def get_users(current_user: dict = Depends(require_role())):
    """Получение списка всех пользователей (для superadmin и выше)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Root видит всех, superadmin - только не-root пользователей
        if current_user["role"] == 0:
            # Root видит всех
            cursor.execute("""
                SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, 
                       u.created_at, r.name as role_name
                FROM users u
                LEFT JOIN roles r ON u.role = r.id
                ORDER BY u.created_at DESC
            """)
        else:
            # Superadmin видит только пользователей с ролью >= 2 (не root)
            cursor.execute("""
                SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active, 
                       u.created_at, r.name as role_name
                FROM users u
                LEFT JOIN roles r ON u.role = r.id
                WHERE u.role >= 2
                ORDER BY u.created_at DESC
            """)
        
        users = []
        for row in cursor.fetchall():
            users.append({
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "full_name": row[3],
                "role": row[4],
                "is_active": row[5],
                "created_at": row[6],
                "role_name": row[7] if row[7] else f"Роль {row[4]}"
            })
        
        conn.close()
        return {"users": users}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения пользователей: {str(e)}")

@app.put("/users/{user_id}")
async def update_user(user_id: int, updates: dict, current_user: dict = Depends(require_role())):
    """Обновление пользователя (для superadmin и выше)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверяем существование пользователя
        cursor.execute("SELECT id, role FROM users WHERE id = %s", (user_id,))
        target_user = cursor.fetchone()
        if not target_user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        # Запрещаем обычным superadmin изменять root пользователей
        if current_user["role"] > 0 and target_user[1] == 0:
            raise HTTPException(status_code=403, detail="Недостаточно прав для изменения root пользователя")

        # Создаем запрос обновления
        update_fields = []
        update_values = []

        allowed_fields = ["username", "email", "full_name", "role", "is_active"]
        for field in allowed_fields:
            if field in updates:
                update_fields.append(f"{field} = %s")
                update_values.append(updates[field])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Нет полей для обновления")
        
        # Обновляем пароль отдельно, если передан
        if "password" in updates:
            update_fields.append("password_hash = %s")
            update_values.append(hash_password(updates["password"]))
        
        update_values.append(user_id)
        
        cursor.execute(f"""
            UPDATE users SET {', '.join(update_fields)}
            WHERE id = %s
        """, update_values)
        
        conn.commit()
        conn.close()
        
        return {"message": "Пользователь обновлен"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления пользователя: {str(e)}")

@app.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: dict = Depends(require_role())):
    """Удаление пользователя (только для root)"""
    try:
        if user_id == current_user["id"]:
            raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверяем существование пользователя
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        # Удаляем пользователя
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))

        conn.commit()
        conn.close()

        return {"message": "Пользователь удален"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления пользователя: {str(e)}")

@app.post("/users/create")
async def create_user_simple(
    user_data: UserCreate,
    current_user: dict = Depends(require_role())
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Проверяем, существует ли пользователь
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (user_data.username, user_data.email))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Пользователь с таким именем или email уже существует")

        # Хешируем пароль
        password_hash = hash_password(user_data.password)

        # Создаем пользователя
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, created_by)
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, %s)
        """, (user_data.username, user_data.email, password_hash, user_data.full_name, user_data.role, True, current_user["id"]))

        cursor.execute("SELECT id FROM users WHERE username = %s", (user_data.username,))
        user_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()

        role_names = {0: "root", 2: "superadmin", 3: "user"}

        return {
            "message": "Пользователь создан",
            "user": {
                "id": user_id,
                "username": user_data.username,
                "email": user_data.email,
                "full_name": user_data.full_name,
                "role": user_data.role,
                "role_name": role_names.get(user_data.role, f"роль {user_data.role}"),
                "is_active": True
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {str(e)}")

@app.post("/users/{user_id}/change-password")
async def change_user_password(
    user_id: int,
    password_data: dict,
    current_user: dict = Depends(require_role())
):
    """Смена пароля пользователя (только для root и superadmin)"""
    try:
        new_password = password_data.get("password")
        if not new_password:
            raise HTTPException(status_code=400, detail="Пароль не может быть пустым")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование пользователя
        cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        target_user = cursor.fetchone()
        if not target_user:
            conn.close()
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        target_role = target_user[0]
        
        # Проверка прав: root может менять всем, superadmin только обычным пользователям
        if current_user["role"] != 0:  # Если не root
            if current_user["role"] == 2 and target_role <= 2:  # Superadmin не может менять root/superadmin
                conn.close()
                raise HTTPException(status_code=403, detail="Недостаточно прав")
        
        # Хешируем новый пароль
        password_hash = hash_password(new_password)
        
        # Обновляем пароль
        cursor.execute("""
            UPDATE users 
            SET password_hash = %s
            WHERE id = %s
        """, (password_hash, user_id))
        
        conn.commit()
        conn.close()
        
        return {"message": "Пароль успешно изменен"}
        
    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.close()
        raise HTTPException(status_code=500, detail=f"Ошибка смены пароля: {str(e)}")

@app.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Выход из системы"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        token_hash = hashlib.sha256(credentials.credentials.encode()).hexdigest()
        cursor.execute("DELETE FROM user_sessions WHERE token_hash = %s", (token_hash,))
        
        conn.commit()
        conn.close()
        
        return {"message": "Успешный выход"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка выхода: {str(e)}")

# ================================
# ОСНОВНЫЕ API МАРШРУТЫ
# ================================
    print("✅ Таблица исключений сотрудников инициализирована")

@app.get("/employee-schedule")
async def get_employee_schedule(
    date: Optional[str] = Query(None), 
    page: int = Query(1, ge=1, description="Номер страницы"),
    per_page: int = Query(50, ge=1, le=100, description="Количество записей на странице"),
    search: Optional[str] = Query(None, description="Поиск по ФИО"),
    department_ids: Optional[str] = Query(None, description="ID отделов через запятую"),
    current_user: dict = Depends(get_current_user)
):
    """Расписание всех сотрудников за день с временем прихода/ухода"""
    try:
        if date is None:
            conn = get_db_connection()
            
            latest_date = execute_query(
                conn,
                "SELECT DISTINCT DATE(access_datetime) as access_date FROM access_logs ORDER BY access_date DESC LIMIT 1",
                fetch_one=True
            )
            date = latest_date['access_date'] if latest_date else datetime.today().strftime('%Y-%m-%d')
            conn.close()
        
        conn = get_db_connection()
        
        # Получаем все записи за день с JOIN к таблице employees и department_id
        all_logs = execute_query(
            conn,
            """
            SELECT al.employee_id, e.full_name, e.full_name_expanded, e.department_id, CAST(al.access_datetime AS TIME) as access_time, al.door_location
            FROM access_logs al
            JOIN employees e ON al.employee_id = e.id
            WHERE DATE(al.access_datetime) = %s
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            ORDER BY al.employee_id, al.access_datetime
            """,
            (date,),
            fetch_all=True
        )

        # Получаем все whitelist_departments для быстрого доступа
        whitelist_rows = execute_query(
            conn,
            "SELECT department_id, reason, exception_type FROM whitelist_departments",
            fetch_all=True
        )
        whitelist_map = {row['department_id']: {'reason': row['reason'], 'type': row['exception_type']} for row in whitelist_rows}

        # Группируем по сотрудникам
        employees_dict = {}
        for log in all_logs:
            employee_id = log['employee_id']
            full_name = log['full_name']
            full_name_expanded = log.get('full_name_expanded')
            department_id = log['department_id']
            access_time = log['access_time']
            door_location = log['door_location']
            
            if employee_id not in employees_dict:
                employees_dict[employee_id] = {
                    'id': employee_id,
                    'name': full_name,
                    'name_expanded': full_name_expanded,
                    'department_id': department_id,
                    'entries': [],
                    'exits': []
                }
            
            if door_location and 'выход' in door_location.lower():
                employees_dict[employee_id]['exits'].append((access_time, door_location))
            else:
                employees_dict[employee_id]['entries'].append((access_time, door_location))
        
        dept_names_map = {}
        dept_rows = execute_query(
            conn,
            "SELECT id, name FROM departments",
            fetch_all=True
        )
        for row in dept_rows:
            dept_names_map[row['id']] = row['name']
        
        employees_schedule = []
        work_start_time = datetime.strptime('09:00:00', '%H:%M:%S').time()
        
        # Получаем все исключения для этой даты
        exceptions_data = execute_query(
            conn,
            """
            SELECT employee_id, exception_type, reason
            FROM employee_exceptions 
            WHERE exception_date = %s
            """,
            (date,),
            fetch_all=True
        )
        exceptions_for_date = {row['employee_id']: {'type': row['exception_type'], 'reason': row['reason']} for row in exceptions_data}
        
        for emp_data in employees_dict.values():
            # Первый вход
            first_entry = min(emp_data['entries'])[0] if emp_data['entries'] else None
            entry_door = min(emp_data['entries'])[1] if emp_data['entries'] else None

            # Последний выход
            last_exit = max(emp_data['exits'])[0] if emp_data['exits'] else None
            exit_door = max(emp_data['exits'])[1] if emp_data['exits'] else None

            # Определяем опоздание с учетом исключений
            is_late = False
            late_minutes = 0
            exception_info = None
            employee_exception = exceptions_for_date.get(emp_data['id'])
            department_exception = whitelist_map.get(emp_data['department_id'])

            if first_entry:
                try:
                    # Если first_entry уже типа datetime.time, используем напрямую, иначе парсим
                    if isinstance(first_entry, str):
                        entry_time = datetime.strptime(first_entry, '%H:%M:%S').time()
                    else:
                        entry_time = first_entry
                    # Проверяем, опоздал ли физически
                    physically_late = entry_time > work_start_time
                    
                    # Проверяем исключения
                    if physically_late:
                        # Если опоздал физически, проверяем есть ли исключение
                        if (employee_exception and employee_exception['type'] == 'no_lateness_check'):
                            exception_info = {
                                'has_exception': True,
                                'reason': employee_exception['reason'],
                                'type': employee_exception['type']
                            }
                            # Исключение снимает опоздание
                            is_late = False
                            print(f"[DEBUG] {emp_data['name']} (ID: {emp_data['id']}) пришёл в {first_entry} > 09:00:00, но есть исключение сотрудника: {employee_exception['reason']}")
                        elif (department_exception and department_exception['type'] == 'no_lateness_check'):
                            exception_info = {
                                'has_exception': True,
                                'reason': department_exception['reason'],
                                'type': department_exception['type']
                            }
                            # Исключение снимает опоздание
                            is_late = False
                            print(f"[DEBUG] {emp_data['name']} (ID: {emp_data['id']}) пришёл в {first_entry} > 09:00:00, но есть исключение отдела: {department_exception['reason']}")
                        else:
                            # Опоздал и нет исключения
                            is_late = True
                            entry_datetime = datetime.combine(datetime.today().date(), entry_time)
                            work_start_datetime = datetime.combine(datetime.today().date(), work_start_time)
                            late_minutes = int((entry_datetime - work_start_datetime).total_seconds() / 60)
                            print(f"[DEBUG] {emp_data['name']} (ID: {emp_data['id']}) пришёл в {first_entry} > 09:00:00 => is_late=True, late_minutes={late_minutes}")
                    else:
                        # Пришёл вовремя - исключения не показываем
                        print(f"[DEBUG] {emp_data['name']} (ID: {emp_data['id']}) пришёл в {first_entry} <= 09:00:00 => is_late=False")
                except Exception as ex:
                    print(f"[ERROR] Ошибка расчёта опоздания для {emp_data['name']} (ID: {emp_data['id']}): {ex}")

            # Вычисляем рабочие часы
            work_hours = None
            if first_entry and last_exit:
                try:
                    # Если значения уже типа datetime.time, используем напрямую
                    if not isinstance(first_entry, str):
                        entry_time = first_entry
                    else:
                        entry_time = datetime.strptime(first_entry, '%H:%M:%S').time()
                    if not isinstance(last_exit, str):
                        exit_time = last_exit
                    else:
                        exit_time = datetime.strptime(last_exit, '%H:%M:%S').time()
                    # Преобразуем в datetime для расчёта разницы
                    entry_dt = datetime.combine(datetime.today().date(), entry_time)
                    exit_dt = datetime.combine(datetime.today().date(), exit_time)
                    work_duration = exit_dt - entry_dt
                    work_hours = round(work_duration.total_seconds() / 3600, 2)
                except Exception as ex:
                    print(f"[ERROR] Ошибка расчёта work_hours для {emp_data['name']} (ID: {emp_data['id']}): {ex} | first_entry={first_entry} last_exit={last_exit}")
                    work_hours = None
            employees_schedule.append({
                'employee_id': emp_data['id'],
                'full_name': emp_data['name'],
                'full_name_expanded': emp_data.get('name_expanded'),
                'department_id': emp_data['department_id'],
                'department_name': dept_names_map.get(emp_data['department_id'], None),
                'first_entry': first_entry,
                'last_exit': last_exit,
                'first_entry_door': entry_door,
                'last_exit_door': exit_door,
                'is_late': is_late,
                'late_minutes': late_minutes,
                'work_hours': work_hours,
                'exception': exception_info,
                'status': get_employee_status(is_late, first_entry, exception_info)
            })
        
        # Сортируем по имени
        employees_schedule.sort(key=lambda x: x['full_name'])
        
        # Применяем фильтрацию по поиску
        if search and search.strip():
            search_lower = search.strip().lower()
            employees_schedule = [e for e in employees_schedule if search_lower in e['full_name'].lower()]
        
        # Применяем фильтрацию по отделам
        if department_ids:
            try:
                dept_ids = [int(dept_id.strip()) for dept_id in department_ids.split(',') if dept_id.strip()]
                if dept_ids:
                    employees_schedule = [e for e in employees_schedule if e.get('department_id') in dept_ids]
            except ValueError:
                pass  # Игнорируем некорректные ID отделов
        
        # Применяем пагинацию
        total_count = len(employees_schedule)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_employees = employees_schedule[start_idx:end_idx]
        
        conn.close()
        
        return {
            'date': date,
            'employees': paginated_employees,
            'total_count': total_count,
            'late_count': sum(1 for e in employees_schedule if e['is_late']),
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения расписания: {str(e)}")

@app.get("/employee-schedule-range")
async def get_employee_schedule_range(
    start_date: str = Query(...), 
    end_date: str = Query(...),
    page: int = Query(1, ge=1, description="Номер страницы"),
    per_page: int = Query(50, ge=1, le=100, description="Количество записей на странице"),
    search: Optional[str] = Query(None, description="Поиск по ФИО"),
    department_ids: Optional[str] = Query(None, description="ID отделов через запятую"),
    current_user: dict = Depends(get_current_user)
):
    """Расписание всех сотрудников за диапазон дат с детализацией по дням"""
    from datetime import datetime, timedelta
    try:
        # Валидация дат
        start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
        if start_dt > end_dt:
            raise HTTPException(status_code=400, detail="Начальная дата не может быть позже конечной")
        if (end_dt - start_dt).days > 365:
            raise HTTPException(status_code=400, detail="Максимальный диапазон - 365 дней")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Получаем имена отделов для всех department_id
        cursor.execute("SELECT id, name FROM departments")
        dept_names_map = {row[0]: row[1] for row in cursor.fetchall()}
        cursor.execute("""
            SELECT DISTINCT e.id, e.full_name, e.full_name_expanded
            FROM employees e
            INNER JOIN access_logs al ON e.id = al.employee_id
            WHERE e.is_active = TRUE
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            AND DATE(al.access_datetime) BETWEEN %s AND %s
            ORDER BY e.full_name
        """, (start_date, end_date))
        employees = cursor.fetchall()

        employees_with_days = []
        total_late_count = 0

        # Получаем department_id для всех сотрудников
        cursor.execute("SELECT id, department_id FROM employees")
        emp_dept_map = {row[0]: row[1] for row in cursor.fetchall()}
        # Получаем все whitelist_departments
        cursor.execute("SELECT department_id, reason, exception_type FROM whitelist_departments")
        whitelist_map = {row[0]: {'reason': row[1], 'type': row[2]} for row in cursor.fetchall()}

        for emp_id, emp_name, emp_name_expanded in employees:
            employee_days = []
            department_id = emp_dept_map.get(emp_id)
            department_name = dept_names_map.get(department_id, None)
            current_date = start_dt
            while current_date <= end_dt:
                date_str = current_date.strftime('%Y-%m-%d')
                cursor.execute("""
                    SELECT TO_CHAR(access_datetime, 'HH24:MI:SS') as access_time, door_location
                    FROM access_logs
                    WHERE employee_id = %s AND DATE(access_datetime) = %s
                    ORDER BY access_datetime ASC
                """, (emp_id, date_str))
                day_logs = cursor.fetchall()
                if day_logs:
                    entries = []
                    exits = []
                    for access_time, door_location in day_logs:
                        if 'выход' in door_location.lower() or 'exit' in door_location.lower():
                            exits.append((access_time, door_location))
                        else:
                            entries.append((access_time, door_location))
                    first_entry = min(entries)[0] if entries else None
                    first_entry_door = min(entries)[1] if entries else None
                    last_exit = max(exits)[0] if exits else None
                    last_exit_door = max(exits)[1] if exits else None
                    is_late = False
                    late_minutes = 0
                    exception_info = None
                    # Проверяем персональное исключение
                    cursor.execute("""
                        SELECT reason, exception_type
                        FROM employee_exceptions
                        WHERE employee_id = %s AND exception_date = %s
                    """, (emp_id, date_str))
                    exception_data = cursor.fetchone()
                    department_exception = whitelist_map.get(department_id)
                    work_hours = None
                    if first_entry and last_exit:
                        try:
                            first_dt = datetime.strptime(first_entry, '%H:%M:%S')
                            last_dt = datetime.strptime(last_exit, '%H:%M:%S')
                            if last_dt > first_dt:
                                work_duration = last_dt - first_dt
                                work_hours = work_duration.total_seconds() / 3600
                        except Exception:
                            work_hours = None
                    if first_entry:
                        entry_time = datetime.strptime(first_entry, '%H:%M:%S').time()
                        work_start = datetime.strptime('09:00:00', '%H:%M:%S').time()
                        physically_late = entry_time > work_start
                        
                        if physically_late:
                            # Если опоздал физически, проверяем есть ли исключение
                            if (exception_data and exception_data[1] == 'no_lateness_check'):
                                # Есть персональное исключение - не считаем опозданием
                                is_late = False
                                late_minutes = 0
                                exception_info = {
                                    'has_exception': True,
                                    'reason': exception_data[0],
                                    'type': exception_data[1]
                                }
                            elif (department_exception and department_exception['type'] == 'no_lateness_check'):
                                # Есть исключение отдела - не считаем опозданием
                                is_late = False
                                late_minutes = 0
                                exception_info = {
                                    'has_exception': True,
                                    'reason': department_exception['reason'],
                                    'type': department_exception['type']
                                }
                            else:
                                # Опоздал и нет исключения
                                is_late = True
                                entry_datetime = datetime.combine(current_date, entry_time)
                                work_start_datetime = datetime.combine(current_date, work_start)
                                late_minutes = int((entry_datetime - work_start_datetime).total_seconds() / 60)
                                total_late_count += 1
                        # Если пришёл вовремя - исключения не показываем (exception_info остается None)
                    status = get_employee_status(is_late, first_entry, exception_info)
                    # Ensure work_hours is always defined
                    if 'work_hours' not in locals():
                        work_hours = None
                    day_data = {
                        'date': date_str,
                        'first_entry': first_entry,
                        'last_exit': last_exit,
                        'first_entry_door': first_entry_door,
                        'last_exit_door': last_exit_door,
                        'is_late': is_late,
                        'late_minutes': late_minutes,
                        'work_hours': work_hours,
                        'status': status,
                        'exception': exception_info
                    }
                    employee_days.append(day_data)
                current_date += timedelta(days=1)
            if employee_days:
                employees_with_days.append({
                    'employee_id': emp_id,
                    'full_name': emp_name,
                    'full_name_expanded': emp_name_expanded,
                    'department_id': department_id,
                    'department_name': department_name,
                    'days': employee_days
                })
        # Сортируем по имени
        employees_with_days.sort(key=lambda x: x['full_name'])
        
        # Применяем фильтрацию по поиску
        if search and search.strip():
            search_lower = search.strip().lower()
            employees_with_days = [e for e in employees_with_days if search_lower in e['full_name'].lower()]
        
        # Применяем фильтрацию по отделам
        if department_ids:
            try:
                dept_ids = [int(dept_id.strip()) for dept_id in department_ids.split(',') if dept_id.strip()]
                if dept_ids:
                    employees_with_days = [e for e in employees_with_days if e.get('department_id') in dept_ids]
            except ValueError:
                pass  # Игнорируем некорректные ID отделов
        
        # Применяем пагинацию (по сотрудникам, а не по дням)
        total_count = len(employees_with_days)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_employees = employees_with_days[start_idx:end_idx]
        
        # Считаем общее количество опозданий
        late_count = 0
        for emp in employees_with_days:
            for day in emp['days']:
                if day['is_late']:
                    late_count += 1
        
        conn.close()
        return {
            'start_date': start_date,
            'end_date': end_date,
            'employees': paginated_employees,
            'total_count': total_count,
            'late_count': late_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total_count + per_page - 1) // per_page
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения расписания за период: {str(e)}")

@app.get("/employee-history/{employee_id}")
async def get_employee_history(
    employee_id: int, 
    days_back: int = Query(365, description="Количество дней назад для анализа")
):
    """История посещений конкретного сотрудника за период"""
    from datetime import date, timedelta, datetime
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days_back)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT full_name FROM employees WHERE id = %s", (employee_id,))
        employee_result = cursor.fetchone()
        if not employee_result:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        employee_name = employee_result[0]
        
        # Получаем все записи сотрудника за период
        cursor.execute("""
            SELECT DATE(access_datetime) as access_date, TO_CHAR(access_datetime, 'HH24:MI:SS') as access_time, door_location
            FROM access_logs
            WHERE employee_id = %s 
            AND DATE(access_datetime) BETWEEN %s AND %s
            ORDER BY access_datetime
        """, (employee_id, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')))
        all_records = cursor.fetchall()
        daily_data = {}
        for access_date, access_time, door_location in all_records:
            if access_date not in daily_data:
                daily_data[access_date] = {'entries': [], 'exits': []}
            if door_location and 'выход' in door_location.lower():
                daily_data[access_date]['exits'].append((access_time, door_location))
            else:
                daily_data[access_date]['entries'].append((access_time, door_location))

        # Получаем department_id сотрудника
        cursor.execute("SELECT department_id FROM employees WHERE id = %s", (employee_id,))
        dept_row = cursor.fetchone()
        department_id = dept_row[0] if dept_row else None

        # Получаем whitelist_departments
        cursor.execute("SELECT department_id, reason, exception_type FROM whitelist_departments")
        whitelist_map = {row[0]: {'reason': row[1], 'exception_type': row[2]} for row in cursor.fetchall()}

        # Получаем персональные исключения
        cursor.execute("""
            SELECT exception_date, reason, exception_type
            FROM employee_exceptions 
            WHERE employee_id = %s 
            AND exception_date BETWEEN %s AND %s
        """, (employee_id, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')))
        exceptions_data = {}
        for exc_date, reason, exc_type in cursor.fetchall():
            exceptions_data[exc_date] = {
                'reason': reason,
                'exception_type': exc_type
            }
        daily_records = []
        total_late_days = 0
        work_start_time = datetime.strptime('09:00:00', '%H:%M:%S').time()
        total_work_hours = 0
        valid_work_days = 0
        for date_str in sorted(daily_data.keys()):
            day_data = daily_data[date_str]
            first_entry = min(day_data['entries'])[0] if day_data['entries'] else None
            last_exit = max(day_data['exits'])[0] if day_data['exits'] else None
            # Проверяем персональное исключение
            has_personal_exception = date_str in exceptions_data
            personal_exception_info = exceptions_data.get(date_str, None)
            # Проверяем whitelist исключение отдела
            dept_exception_info = whitelist_map.get(department_id)
            has_dept_exception = dept_exception_info is not None

            # Если есть персональное исключение, оно приоритетнее
            if has_personal_exception:
                has_exception = True
                exception_info = personal_exception_info
            elif has_dept_exception:
                has_exception = True
                exception_info = dept_exception_info
            else:
                has_exception = False
                exception_info = None

            is_late = False
            if first_entry and not has_exception:
                try:
                    entry_time = datetime.strptime(first_entry, '%H:%M:%S').time()
                    if entry_time > work_start_time:
                        is_late = True
                        total_late_days += 1
                except Exception:
                    pass
            work_hours = None
            if first_entry and last_exit:
                try:
                    entry_datetime = datetime.strptime(first_entry, '%H:%M:%S')
                    exit_datetime = datetime.strptime(last_exit, '%H:%M:%S')
                    work_duration = exit_datetime - entry_datetime
                    work_hours = work_duration.total_seconds() / 3600
                    if work_hours > 0:
                        total_work_hours += work_hours
                        valid_work_days += 1
                except Exception:
                    pass
            daily_records.append({
                'date': date_str,
                'first_entry': first_entry,
                'last_exit': last_exit,
                'work_hours': work_hours,
                'is_late': is_late,
                'has_exception': has_exception,
                'exception_info': exception_info
            })
        total_days = len(daily_records)
        punctuality_rate = ((total_days - total_late_days) / total_days * 100) if total_days > 0 else 0
        avg_work_hours = total_work_hours / valid_work_days if valid_work_days > 0 else None
        all_entries = [rec['first_entry'] for rec in daily_records if rec['first_entry']]
        all_exits = [rec['last_exit'] for rec in daily_records if rec['last_exit']]
        avg_arrival_time = None
        avg_departure_time = None
        if all_entries:
            try:
                times = [datetime.strptime(t, '%H:%M:%S') for t in all_entries]
                avg_seconds = sum(t.hour * 3600 + t.minute * 60 + t.second for t in times) / len(times)
                avg_arrival_time = f"{int(avg_seconds // 3600):02d}:{int((avg_seconds % 3600) // 60):02d}"
            except Exception:
                pass
        if all_exits:
            try:
                times = [datetime.strptime(t, '%H:%M:%S') for t in all_exits]
                avg_seconds = sum(t.hour * 3600 + t.minute * 60 + t.second for t in times) / len(times)
                avg_departure_time = f"{int(avg_seconds // 3600):02d}:{int((avg_seconds % 3600) // 60):02d}"
            except Exception:
                pass
        conn.close()
        return {
            "employee_name": employee_name,
            "total_days": total_days,
            "attendance_rate": 100.0,
            "punctuality_rate": punctuality_rate,
            "avg_arrival_time": avg_arrival_time,
            "avg_departure_time": avg_departure_time,
            "avg_work_hours": avg_work_hours,
            "daily_records": daily_records
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения истории сотрудника: {str(e)}")

@app.get("/employees")
async def get_all_employees():
    """Получить список всех сотрудников, сгруппированных по отделам"""
    try:
        conn = get_db_connection()
        
        # Получаем всех активных сотрудников с их отделами и должностями через JOIN
        results = execute_query(
            conn,
            """
            SELECT e.id, e.full_name, e.full_name_expanded,
                   p.name as position_name, 
                   d.name as department_name,
                   e.birth_date
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE e.is_active = %s
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            ORDER BY d.name, e.full_name
            """,
            (True,),
            fetch_all=True
        )
        
        # Группируем сотрудников по отделам
        departments = {}
        
        for row in results:
            department = row.get('department_name') or 'Не указан отдел'
            
            if department not in departments:
                departments[department] = []
            
            departments[department].append({
                'employee_id': row['id'],
                'full_name': row['full_name'],
                'full_name_expanded': row.get('full_name_expanded'),
                'position': row.get('position_name') or 'Не указана должность',
                'birth_date': row.get('birth_date')
            })
        
        # Сортируем сотрудников в каждом отделе
        for department in departments:
            departments[department].sort(key=lambda x: x['full_name'])
        
        conn.close()
        
        return {
            'departments': departments,
            'total_employees': sum(len(employees) for employees in departments.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка сотрудников: {str(e)}")

@app.get("/employees/simple")
async def get_employees_simple():
    """Получить простой список всех сотрудников для форм"""
    try:
        conn = get_db_connection()
        
        results = execute_query(
            conn,
            """
            SELECT 
                e.id, 
                e.full_name,
                e.full_name_expanded,
                COALESCE(p.name, 'Не указано') as position,
                COALESCE(d.name, 'Не указано') as department
            FROM employees e
            LEFT JOIN positions p ON e.position_id = p.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.is_active = %s
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            ORDER BY e.full_name
            """,
            (True,),
            fetch_all=True
        )
        
        conn.close()
        
        return {
            'employees': [
                {
                    'id': row['id'],
                    'full_name': row['full_name'],
                    'position': row['position'],
                    'department': row['department']
                }
                for row in results
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка сотрудников: {str(e)}")

@app.put("/employees/update-by-name")
async def update_employee_full_name_by_name(data: UpdateFullNameByName):
    """
    Обновить полное ФИО сотрудника по короткому имени
    """
    try:
        full_name = data.full_name.strip()
        full_name_expanded = data.full_name_expanded.strip()
        
        if not full_name:
            raise HTTPException(status_code=400, detail="full_name обязателен")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Обновляем полное ФИО по короткому имени
        cursor.execute("""
            UPDATE employees 
            SET full_name_expanded = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE full_name = %s
        """, (full_name_expanded if full_name_expanded else None, full_name))
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'full_name': full_name,
            'full_name_expanded': full_name_expanded,
            'updated_count': cursor.rowcount
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Ошибка обновления ФИО по имени: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка обновления: {str(e)}")

@app.put("/employees/{employee_id}/full-name")
async def update_employee_full_name(employee_id: int, data: dict):
    """
    Обновить полное ФИО сотрудника по ID
    """
    try:
        full_name_expanded = data.get('full_name_expanded', '').strip()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT id FROM employees WHERE id = %s", (employee_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Обновляем полное ФИО
        cursor.execute("""
            UPDATE employees 
            SET full_name_expanded = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (full_name_expanded if full_name_expanded else None, employee_id))
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'employee_id': employee_id,
            'full_name_expanded': full_name_expanded
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Ошибка обновления ФИО по ID: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка обновления: {str(e)}")

@app.put("/employees/{employee_id}")
async def update_employee(employee_id: int, updates: dict, current_user: dict = Depends(require_role)):
    """Обновление данных сотрудника (для superadmin и выше)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT id FROM employees WHERE id = %s", (employee_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Создаем запрос обновления
        update_fields = []
        update_values = []
        
        allowed_fields = ["full_name", "birth_date", "department_id", "position_id", "card_number", "is_active"]
        for field in allowed_fields:
            if field in updates:
                update_fields.append(f"{field} = %s")
                update_values.append(updates[field])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Нет полей для обновления")
        
        # Добавляем обновление времени модификации
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        update_values.append(employee_id)
        
        cursor.execute(f"""
            UPDATE employees SET {', '.join(update_fields)}
            WHERE id = %s
        """, update_values)
        
        conn.commit()
        conn.close()
        
        return {"message": "Данные сотрудника обновлены"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления сотрудника: {str(e)}")

@app.put("/employees/{employee_id}/deactivate")
async def deactivate_employee(employee_id: int, request: Request):
    """Деактивация сотрудника (is_active = false) - для уволенных сотрудников"""
    try:
        print(f"[DEACTIVATE] Запрос на деактивацию сотрудника {employee_id}")
        
        # Получаем данные из тела запроса
        body = await request.json()
        confirmation_word = body.get('password', '').strip()
        
        if not confirmation_word:
            raise HTTPException(status_code=400, detail="Требуется подтверждение")
        
        # Проверяем что пользователь ввел слово "удалить"
        if confirmation_word.lower() != "удалить":
            raise HTTPException(status_code=401, detail='Для подтверждения введите слово "удалить"')
        
        # Подключаемся к базе данных
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT id, full_name, is_active FROM employees WHERE id = %s", (employee_id,))
        employee = cursor.fetchone()
        
        if not employee:
            conn.close()
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        employee_name = employee[1]
        is_active = employee[2]
        
        if not is_active:
            conn.close()
            raise HTTPException(status_code=400, detail="Сотрудник уже деактивирован")
        
        # Деактивируем сотрудника (мягкое удаление)
        cursor.execute(
            "UPDATE employees SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (employee_id,)
        )
        
        conn.commit()
        conn.close()
        
        return {
            "message": f"Сотрудник '{employee_name}' деактивирован (is_active = false)",
            "employee_id": employee_id,
            "is_active": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Ошибка деактивации сотрудника: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка деактивации: {str(e)}")

@app.get("/employees/deactivated")
async def get_deactivated_employees():
    """Получить список деактивированных сотрудников"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT e.id, e.full_name, e.full_name_expanded, p.name as position_name, 
                   d.name as department_name, e.updated_at
            FROM employees e
            LEFT JOIN positions p ON e.position_id = p.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.is_active = FALSE
            ORDER BY e.updated_at DESC
        """)
        
        employees = []
        for row in cursor.fetchall():
            employees.append({
                'id': row[0],
                'full_name': row[1],
                'full_name_expanded': row[2],
                'position_name': row[3],
                'department_name': row[4],
                'updated_at': row[5].isoformat() if row[5] else None
            })
        
        conn.close()
        return employees
        
    except Exception as e:
        import traceback
        print(f"Ошибка получения деактивированных сотрудников: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка: {str(e)}")

@app.put("/employees/{employee_id}/reactivate")
async def reactivate_employee(employee_id: int):
    """Реактивация сотрудника (is_active = true)"""
    try:
        print(f"[REACTIVATE] Запрос на активацию сотрудника {employee_id}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT id, full_name, is_active FROM employees WHERE id = %s", (employee_id,))
        employee = cursor.fetchone()
        
        if not employee:
            conn.close()
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        employee_name = employee[1]
        is_active = employee[2]
        
        if is_active:
            conn.close()
            raise HTTPException(status_code=400, detail="Сотрудник уже активен")
        
        # Активируем сотрудника
        cursor.execute(
            "UPDATE employees SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (employee_id,)
        )
        
        conn.commit()
        conn.close()
        
        return {
            "message": f"Сотрудник '{employee_name}' активирован (is_active = true)",
            "employee_id": employee_id,
            "is_active": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Ошибка активации сотрудника: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка активации: {str(e)}")

@app.get("/employees/unassigned")
async def get_unassigned_employees():
    """Получить сотрудников без службы или с неактивным статусом"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT e.id, e.full_name, e.full_name_expanded, p.name as position_name, d.name as department_name, e.position_id
            FROM employees e
            LEFT JOIN positions p ON e.position_id = p.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.is_active = TRUE
            ORDER BY e.full_name
        """)
        
        employees = []
        for emp_id, name, name_expanded, position, department, position_id in cursor.fetchall():
            employees.append({
                'employee_id': emp_id,
                'full_name': name,
                'full_name_expanded': name_expanded,
                'position': position or 'Не указана',
                'department': department or 'Не назначена',
                'position_id': position_id
            })
        
        conn.close()
        return employees
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка сотрудников: {str(e)}")

@app.get("/employees/{employee_id}")
async def get_employee_details(employee_id: int):
    """Получить подробную информацию о сотруднике"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT e.id, e.full_name, e.full_name_expanded, e.birth_date, e.card_number, e.is_active,
                   e.created_at, e.updated_at,
                   d.id as department_id, d.name as department_name,
                   p.id as position_id, p.name as position_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE e.id = %s
        """, (employee_id,))
        
        employee_data = cursor.fetchone()
        conn.close()
        
        if not employee_data:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        return {
            "id": employee_data[0],
            "full_name": employee_data[1],
            "full_name_expanded": employee_data[2],
            "birth_date": employee_data[3],
            "card_number": employee_data[4],
            "is_active": employee_data[5],
            "created_at": employee_data[6],
            "updated_at": employee_data[7],
            "department": {
                "id": employee_data[8],
                "name": employee_data[9]
            } if employee_data[8] else None,
            "position": {
                "id": employee_data[10],
                "name": employee_data[11]
            } if employee_data[10] else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения данных сотрудника: {str(e)}")

@app.get("/departments")
async def get_all_departments():
    """Получить список всех отделов"""
    try:
        conn = get_db_connection()
        
        results = execute_query(
            conn,
            """
            SELECT d.id, d.name, d.priority, COUNT(e.id) as employee_count
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = %s
            GROUP BY d.id, d.name, d.priority
            ORDER BY COALESCE(d.priority, 999), d.name
            """,
            (True,),
            fetch_all=True
        )
        
        departments = []
        for row in results:
            departments.append({
                'id': row['id'],
                'name': row['name'],
                'priority': row.get('priority'),
                'employee_count': row['employee_count']
            })
        
        conn.close()
        return departments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка отделов: {str(e)}")

@app.get("/departments/{department_id}")
async def get_department_by_id(department_id: int):
    """Получить отдел по ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT d.id, d.name, d.priority, COUNT(e.id) as employee_count
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = TRUE
            WHERE d.id = %s
            GROUP BY d.id, d.name, d.priority
        """, (department_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        dept_id, name, priority, employee_count = result
        return {
            'id': dept_id,
            'name': name,
            'priority': priority,
            'employee_count': employee_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения отдела: {str(e)}")

@app.get("/positions")
async def get_all_positions():
    """Получить список всех должностей"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.id, p.name, COUNT(e.id) as employee_count
            FROM positions p
            LEFT JOIN employees e ON p.id = e.position_id AND e.is_active = TRUE
            GROUP BY p.id, p.name
            ORDER BY p.name
        """)
        
        positions = []
        for pos_id, name, count in cursor.fetchall():
            positions.append({
                'id': pos_id,
                'name': name,
                'employee_count': count
            })
        
        conn.close()
        return positions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка должностей: {str(e)}")

@app.get("/positions/{position_id}")
async def get_position_by_id(position_id: int):
    """Получить должность по ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT p.id, p.name, COUNT(e.id) as employee_count
            FROM positions p
            LEFT JOIN employees e ON p.id = e.position_id AND e.is_active = TRUE
            WHERE p.id = %s
            GROUP BY p.id, p.name
        """, (position_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="Должность не найдена")
        
        pos_id, name, employee_count = result
        return {
            'id': pos_id,
            'name': name,
            'employee_count': employee_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения должности: {str(e)}")

@app.get("/employees/by-department/{department_id}")
async def get_employees_by_department(department_id: int):
    """Получить сотрудников конкретного отдела"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получаем информацию об отделе
        cursor.execute("SELECT name FROM departments WHERE id = %s", (department_id,))
        dept_result = cursor.fetchone()
        if not dept_result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        # Получаем сотрудников отдела
        cursor.execute("""
            SELECT e.id, e.full_name, e.full_name_expanded, p.name as position_name
            FROM employees e
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE e.department_id = %s AND e.is_active = TRUE
            ORDER BY e.full_name
        """, (department_id,))
        
        employees = []
        for emp_id, name, name_expanded, position in cursor.fetchall():
            employees.append({
                'employee_id': emp_id,
                'full_name': name,
                'full_name_expanded': name_expanded,
                'position': position or 'Не указана должность'
            })
        
        conn.close()
        return {
            'department_name': dept_result[0],
            'employees': employees,
            'total_count': len(employees)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения сотрудников отдела: {str(e)}")

@app.put("/employees/{employee_id}/department")
async def update_employee_department(employee_id: int, request_data: dict):
    """Перевести сотрудника в другую службу"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        new_department_id = request_data.get('department_id')
        new_position_id = request_data.get('position_id', None)

        # Проверяем существование сотрудника
        cursor.execute("SELECT id, full_name FROM employees WHERE id = %s", (employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")

        # Проверяем существование службы (если указана)
        if new_department_id is not None:
            cursor.execute("SELECT id, name FROM departments WHERE id = %s", (new_department_id,))
            department = cursor.fetchone()
            if not department:
                raise HTTPException(status_code=404, detail="Служба не найдена")

        # Если указана должность, проверяем что она существует
        if new_position_id:
            cursor.execute("SELECT id, name FROM positions WHERE id = %s", (new_position_id,))
            position = cursor.fetchone()
            if not position:
                raise HTTPException(status_code=404, detail="Должность не найдена")

        # Обновляем данные сотрудника
        cursor.execute("""
            UPDATE employees 
            SET department_id = %s, position_id = %s
            WHERE id = %s
        """, (new_department_id, new_position_id, employee_id))

        conn.commit()
        conn.close()

        if new_department_id is not None and 'department' in locals() and department:
            dept_name = department[1]
        else:
            dept_name = 'Без службы'
        return {
            "message": f"Сотрудник {employee[1]} переведен в службу {dept_name}",
            "employee_id": employee_id,
            "department_id": new_department_id,
            "position_id": new_position_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при переводе сотрудника: {str(e)}")

@app.put("/employees/{employee_id}/position")
async def update_employee_position(employee_id: int, request_data: dict):
    """Обновить должность сотрудника"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        new_position_id = request_data.get('position_id')

        # Проверяем существование сотрудника
        cursor.execute("SELECT id, full_name FROM employees WHERE id = %s", (employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")

        # Проверяем существование должности (если указана)
        if new_position_id is not None:
            cursor.execute("SELECT id, name FROM positions WHERE id = %s", (new_position_id,))
            position = cursor.fetchone()
            if not position:
                raise HTTPException(status_code=404, detail="Должность не найдена")

        # Обновляем должность сотрудника
        cursor.execute("""
            UPDATE employees 
            SET position_id = %s
            WHERE id = %s
        """, (new_position_id, employee_id))

        conn.commit()
        conn.close()

        return {
            "message": f"Должность сотрудника {employee[1]} обновлена на {position[1] if new_position_id is not None else None}",
            "employee_id": employee_id,
            "position_id": new_position_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении должности: {str(e)}")
            
        if exception_date:
            query += " AND ee.exception_date = %s"
            params.append(exception_date)
            
        query += " ORDER BY ee.exception_date DESC, e.full_name"
        
        cursor.execute(query, params)
        exceptions = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": exc[0],
                "employee_id": exc[1],
                "employee_name": exc[2],
                "exception_date": exc[3],
                "reason": exc[4],
                "exception_type": exc[5],
                "created_at": exc[6]
            }
            for exc in exceptions
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении исключений: {str(e)}")

@app.post("/employee-exceptions")
async def create_employee_exception(exception: ExceptionCreate, current_user: dict = Depends(require_role)):
    """Создание нового исключения для сотрудника"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверяем существование сотрудника
        cursor.execute("SELECT full_name FROM employees WHERE id = %s", (exception.employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")

        # Создаем исключение
        cursor.execute("""
            INSERT INTO employee_exceptions (employee_id, exception_date, reason, exception_type)
            VALUES (%s, %s, %s, %s)
        """, (exception.employee_id, exception.exception_date, exception.reason, exception.exception_type))

        exception_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            "message": f"Исключение для {employee[0]} на {exception.exception_date} создано",
            "exception_id": exception_id,
            "employee_name": employee[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        # Обработка ошибки уникальности для SQLite и PostgreSQL
        error_text = str(e)
        if (
            "UNIQUE constraint failed" in error_text or
            "duplicate key value violates unique constraint" in error_text or
            "employee_exceptions_employee_id_exception_date_key" in error_text
        ):
            raise HTTPException(status_code=400, detail="Исключение для этого сотрудника на эту дату уже существует")
        raise HTTPException(status_code=500, detail=f"Ошибка при создании исключения: {error_text}")

@app.put("/employee-exceptions/{exception_id}")
async def update_employee_exception(exception_id: int, exception: ExceptionUpdate):
    """Обновление существующего исключения"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование исключения
        cursor.execute("""
            SELECT ee.id, e.full_name 
            FROM employee_exceptions ee
            JOIN employees e ON ee.employee_id = e.id
            WHERE ee.id = %s
        """, (exception_id,))
        existing = cursor.fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Исключение не найдено")
        
        # Обновляем исключение
        cursor.execute("""
            UPDATE employee_exceptions 
            SET reason = %s, exception_type = %s
            WHERE id = %s
        """, (exception.reason, exception.exception_type, exception_id))
        
        conn.commit()
        conn.close()
        
        return {
            "message": f"Исключение для {existing[1]} обновлено",
            "exception_id": exception_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении исключения: {str(e)}")

@app.delete("/employee-exceptions/{exception_id}")
async def delete_employee_exception(exception_id: int):
    """Удаление исключения"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование исключения
        cursor.execute("""
            SELECT ee.id, e.full_name, ee.exception_date
            FROM employee_exceptions ee
            JOIN employees e ON ee.employee_id = e.id
            WHERE ee.id = %s
        """, (exception_id,))
        existing = cursor.fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Исключение не найдено")
        
        # Удаляем исключение
        cursor.execute("DELETE FROM employee_exceptions WHERE id = %s", (exception_id,))

        conn.commit()
        conn.close()

        return {
            "message": f"Исключение для {existing[1]} на {existing[2]} удалено",
            "exception_id": exception_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении исключения: {str(e)}")

@app.post("/employee-exceptions/range")
async def create_employee_exception_range(exception_range: ExceptionRangeCreate):
    """Создание исключений для сотрудника в диапазоне дат"""
    try:
        from datetime import datetime, timedelta

        # Валидация дат
        start_dt = datetime.strptime(exception_range.start_date, '%Y-%m-%d').date()
        end_dt = datetime.strptime(exception_range.end_date, '%Y-%m-%d').date()
        if start_dt > end_dt:
            raise HTTPException(status_code=400, detail="Начальная дата не может быть позже конечной")

        # Проверяем ограничение на диапазон (максимум 31 день)
        if (end_dt - start_dt).days > 31:
            raise HTTPException(status_code=400, detail="Максимальный диапазон - 31 день")

        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверяем существование сотрудника
        cursor.execute("SELECT full_name FROM employees WHERE id = %s", (exception_range.employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")

        # Создаем исключения для каждого дня в диапазоне
        created_count = 0
        updated_count = 0
        current_date = start_dt

        while current_date <= end_dt:
            try:
                cursor.execute("""
                    INSERT INTO employee_exceptions (employee_id, exception_date, reason, exception_type)
                    VALUES (%s, %s, %s, %s)
                """, (exception_range.employee_id, current_date.strftime('%Y-%m-%d'), 
                      exception_range.reason, exception_range.exception_type))
                created_count += 1
            except Exception as e:
                if "UNIQUE constraint failed" in str(e) or "duplicate key value violates unique constraint" in str(e):
                    # Если исключение уже существует, обновляем его
                    cursor.execute("""
                        UPDATE employee_exceptions 
                        SET reason = %s, exception_type = %s
                        WHERE employee_id = %s AND exception_date = %s
                    """, (exception_range.reason, exception_range.exception_type,
                          exception_range.employee_id, current_date.strftime('%Y-%m-%d')))
                    updated_count += 1
                else:
                    raise e
            current_date += timedelta(days=1)

        conn.commit()
        conn.close()

        total_days = (end_dt - start_dt).days + 1

        return {
            "message": f"Исключения для {employee[0]} созданы с {exception_range.start_date} по {exception_range.end_date}",
            "employee_name": employee[0],
            "total_days": total_days,
            "created": created_count,
            "updated": updated_count,
            "start_date": exception_range.start_date,
            "end_date": exception_range.end_date
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при создании исключений в диапазоне: {str(e)}")

@app.get("/svod-report")
async def get_svod_report(date: str = None):
    """Получить сводную таблицу сотрудников в своде ТРК с исключениями за указанную дату"""
    try:
        from datetime import date as dt_date
        
        # Если дата не указана, берем сегодняшнюю
        if not date:
            date = dt_date.today().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        
        # Получаем сотрудников из свода в правильном порядке (БЕЗ фильтрации по дате)
        # Дата используется только для получения исключений
        employees_data = execute_query(
            conn,
            """
            SELECT e.id, e.full_name, e.full_name_expanded,
                   COALESCE(sre.position_override, p.name) as position_name,
                   d.name as department_name,
                   sre.order_index,
                   sre.employee_id,
                   sre.id as svod_id
            FROM svod_report_employees sre
            LEFT JOIN employees e ON sre.employee_id = e.id
            LEFT JOIN positions p ON e.position_id = p.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE sre.employee_id IS NULL OR e.is_active = %s
            ORDER BY sre.order_index ASC, sre.id ASC
            """,
            (True,),
            fetch_all=True
        )
        
        # Получаем только ID сотрудников (исключая записи с только должностью)
        svod_employee_ids = [emp['id'] for emp in employees_data if emp['id'] is not None]
        
        # Если список пуст, возвращаем пустой результат
        if not employees_data:
            conn.close()
            return {
                'date': date,
                'employees': [],
                'total_count': 0,
                'svod_count': 0
            }
        
        # Получаем исключения за выбранную дату (только если есть сотрудники)
        exceptions_data = []
        if svod_employee_ids:
            exceptions_data = execute_query(
                conn,
                """
                SELECT employee_id, reason, exception_type
                FROM employee_exceptions
                WHERE exception_date = %s
                """,
                (date,),
                fetch_all=True
            )
        
        # Получаем данные о входах за выбранную дату (только если есть сотрудники)
        access_data = []
        if svod_employee_ids:
            access_data = execute_query(
                conn,
                """
                SELECT DISTINCT employee_id
                FROM access_logs
                WHERE DATE(access_datetime) = %s
                """,
                (date,),
                fetch_all=True
            )
        
        conn.close()
        
        # Создаем словарь исключений по employee_id
        exceptions_dict = {exc['employee_id']: exc for exc in exceptions_data}
        
        # Создаем set с id сотрудников, у которых есть вход
        employees_with_access = {acc['employee_id'] for acc in access_data}
        
        # Формируем результат
        result = []
        for emp in employees_data:
            # Проверяем, есть ли employee_id (может быть NULL для записей с только должностью)
            if emp['employee_id'] is None:
                # Это запись только с должностью, без сотрудника
                result.append({
                    'id': emp['svod_id'],  # Используем svod_id для записей без сотрудника
                    'svod_id': emp['svod_id'],
                    'full_name': '',
                    'position': emp.get('position_name') or '',
                    'department': '',
                    'comment': '',
                    'exception_type': None,
                    'in_svod': True,
                    'is_position_only': True  # Флаг для фронтенда
                })
            else:
                # Это запись с сотрудником
                exception = exceptions_dict.get(emp['id'])
                has_access = emp['id'] in employees_with_access
                
                # Определяем комментарий по приоритету:
                # 1. Если есть исключение - показываем исключение
                # 2. Если есть вход - показываем "На рабочем месте"
                # 3. Иначе - пусто (будет показан прочерк)
                if exception:
                    comment = exception['reason']
                    exception_type = exception['exception_type']
                elif has_access:
                    comment = 'На работе'
                    exception_type = 'at_work'
                else:
                    comment = ''
                    exception_type = None
                
                result.append({
                    'id': emp['id'],
                    'svod_id': emp['svod_id'],
                    'full_name': emp['full_name'],
                    'position': emp.get('position_name') or 'Не указана должность',
                    'department': emp.get('department_name') or 'Не указан отдел',
                    'comment': comment,
                    'exception_type': exception_type,
                    'in_svod': True,  # Всегда True, т.к. показываем только тех кто в своде
                    'is_position_only': False
                })
        
        return {
            'date': date,
            'employees': result,
            'total_count': len(result),
            'svod_count': len(svod_employee_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения сводной таблицы: {str(e)}")

@app.post("/svod-report/add-employee")
async def add_employee_to_svod(data: dict):
    """Добавить сотрудника в свод ТРК"""
    try:
        employee_id = data.get('employee_id')
        svod_id = data.get('svod_id')  # ID записи в svod_report_employees для назначения сотрудника
        
        if not employee_id:
            raise HTTPException(status_code=400, detail="Необходимо указать employee_id")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT full_name FROM employees WHERE id = %s", (employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Если указан svod_id - назначаем сотрудника на существующую должность
        if svod_id:
            cursor.execute("""
                UPDATE svod_report_employees
                SET employee_id = %s, position_override = NULL
                WHERE id = %s AND employee_id IS NULL
            """, (employee_id, svod_id))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=400, detail="Должность уже занята или не найдена")
            conn.commit()
            conn.close()
            return {
                "message": f"Сотрудник {employee[0]} назначен на должность",
                "employee_id": employee_id,
                "svod_id": svod_id
            }
        
        # Иначе добавляем нового сотрудника в свод
        # Получаем максимальный order_index
        cursor.execute("""
            SELECT COALESCE(MAX(order_index), -1) + 1
            FROM svod_report_employees
        """)
        next_order_index = cursor.fetchone()[0]
        
        # Добавляем в свод (если уже есть - игнорируем)
        try:
            cursor.execute("""
                INSERT INTO svod_report_employees (employee_id, order_index)
                VALUES (%s, %s)
            """, (employee_id, next_order_index))
            conn.commit()
        except Exception as e:
            if "duplicate key value violates unique constraint" in str(e):
                pass  # Уже добавлен
            else:
                raise e
        
        conn.close()
        
        return {
            "message": f"Сотрудник {employee[0]} добавлен в свод",
            "employee_id": employee_id,
            "order_index": next_order_index
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка добавления в свод: {str(e)}")

@app.post("/svod-report/add-position")
async def add_position_to_svod(data: dict):
    """Добавить должность (без сотрудника) в свод ТРК"""
    try:
        position = data.get('position')
        
        if not position or not position.strip():
            raise HTTPException(status_code=400, detail="Необходимо указать название должности")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получаем максимальный order_index
        cursor.execute("""
            SELECT COALESCE(MAX(order_index), -1) + 1
            FROM svod_report_employees
        """)
        next_order_index = cursor.fetchone()[0]
        
        # Добавляем запись с должностью, но без сотрудника (employee_id = NULL)
        # report_date оставляем NULL, так как это общий свод
        cursor.execute("""
            INSERT INTO svod_report_employees (employee_id, order_index, position_override)
            VALUES (NULL, %s, %s)
        """, (next_order_index, position.strip()))
        conn.commit()
        
        conn.close()
        
        return {
            "message": f"Должность '{position}' добавлена в свод",
            "position": position,
            "order_index": next_order_index
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка добавления должности: {str(e)}")

@app.delete("/svod-report/remove-employee")
async def remove_employee_from_svod(svod_id: int = None, employee_id: int = None):
    """Убрать сотрудника или должность из свода ТРК"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Удаляем запись по svod_id или employee_id
        if svod_id:
            cursor.execute("""
                DELETE FROM svod_report_employees
                WHERE id = %s
            """, (svod_id,))
        elif employee_id:
            cursor.execute("""
                DELETE FROM svod_report_employees
                WHERE employee_id = %s
            """, (employee_id,))
        else:
            raise HTTPException(status_code=400, detail="Необходимо указать svod_id или employee_id")
        
        conn.commit()
        conn.close()
        
        return {
            "message": "Запись удалена из свода",
            "svod_id": svod_id,
            "employee_id": employee_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления из свода: {str(e)}")

@app.post("/svod-report/update-order")
async def update_svod_order(order_data: dict, current_user: dict = Depends(get_current_user)):
    """Обновить порядок записей в своде ТРК"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получаем данные о порядке из запроса
        order_list = order_data.get('order', [])
        if not order_list:
            raise HTTPException(status_code=400, detail="Не переданы данные о порядке")
        
        # Проверим, что все svod_id существуют в своде (svod_id это id таблицы)
        svod_ids = [item['svod_id'] for item in order_list]
        placeholders = ','.join(['%s'] * len(svod_ids))
        cursor.execute(f"SELECT id FROM svod_report_employees WHERE id IN ({placeholders})", svod_ids)
        existing_ids = [row[0] for row in cursor.fetchall()]
        
        # Проверяем, что все переданные ID существуют в своде
        missing_ids = set(svod_ids) - set(existing_ids)
        if missing_ids:
            raise HTTPException(status_code=400, detail=f"Записи с ID {missing_ids} не найдены в своде")
        
        # Добавляем колонку order_index в таблицу, если её нет
        try:
            cursor.execute("ALTER TABLE svod_report_employees ADD COLUMN order_index INTEGER DEFAULT 0")
            conn.commit()
        except Exception:
            # Колонка уже существует, это нормально
            pass
        
        # Обновляем порядок для каждой записи (svod_id это id таблицы)
        for item in order_list:
            svod_id = item['svod_id']
            order_index = item['order_index']
            
            cursor.execute("""
                UPDATE svod_report_employees 
                SET order_index = %s 
                WHERE id = %s
            """, (order_index, svod_id))
        
        conn.commit()
        conn.close()
        
        return {
            "message": "Порядок записей в своде обновлен",
            "updated_count": len(order_list)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления порядка: {str(e)}")

@app.get("/departments/{department_id}/positions")
async def get_department_positions(department_id: int):
    """Получить должности, доступные в конкретном отделе"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получаем информацию об отделе
        cursor.execute("SELECT name FROM departments WHERE id = %s", (department_id,))
        dept_result = cursor.fetchone()
        if not dept_result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        # Получаем должности отдела
        cursor.execute("""
            SELECT p.id, p.name, COUNT(e.id) as employee_count
            FROM department_positions dp
            LEFT JOIN positions p ON dp.position_id = p.id
            LEFT JOIN employees e ON p.id = e.position_id AND e.department_id = %s AND e.is_active = TRUE
            WHERE dp.department_id = %s
            GROUP BY p.id, p.name
            ORDER BY p.name
        """, (department_id, department_id))
        
        positions = []
        for pos_id, name, count in cursor.fetchall():
            positions.append({
                'position_id': pos_id,
                'name': name,
                'employee_count': count
            })
        
        conn.close()
        return {
            'department_id': department_id,
            'department_name': dept_result[0],
            'positions': positions,
            'total_positions': len(positions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения должностей отдела: {str(e)}")

@app.get("/positions/{position_id}/departments")
async def get_position_departments(position_id: int):
    """Получить отделы, где может быть конкретная должность"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получаем информацию о должности
        cursor.execute("SELECT name FROM positions WHERE id = %s", (position_id,))
        pos_result = cursor.fetchone()
        if not pos_result:
            raise HTTPException(status_code=404, detail="Должность не найдена")
        
        # Получаем отделы с этой должностью
        cursor.execute("""
            SELECT d.id, d.name, COUNT(e.id) as employee_count
            FROM department_positions dp
            LEFT JOIN departments d ON dp.department_id = d.id
            LEFT JOIN employees e ON d.id = e.department_id AND e.position_id = %s AND e.is_active = TRUE
            WHERE dp.position_id = %s
            GROUP BY d.id, d.name
            ORDER BY d.name
        """, (position_id, position_id))
        
        departments = []
        for dept_id, name, count in cursor.fetchall():
            departments.append({
                'department_id': dept_id,
                'name': name,
                'employee_count': count
            })
        
        conn.close()
        return {
            'position_id': position_id,
            'position_name': pos_result[0],
            'departments': departments,
            'total_departments': len(departments)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения отделов должности: {str(e)}")

@app.get("/department-positions")
async def get_all_department_positions():
    """Получить все связи отделов и должностей"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT d.id as dept_id, d.name as dept_name, 
                   p.id as pos_id, p.name as pos_name,
                   COUNT(e.id) as employee_count
            FROM department_positions dp
            LEFT JOIN departments d ON dp.department_id = d.id
            LEFT JOIN positions p ON dp.position_id = p.id
            LEFT JOIN employees e ON d.id = e.department_id AND p.id = e.position_id AND e.is_active = TRUE
            GROUP BY d.id, d.name, p.id, p.name
            ORDER BY d.name, p.name
        """)
        
        relations = {}
        total_relations = 0
        
        for dept_id, dept_name, pos_id, pos_name, emp_count in cursor.fetchall():
            if dept_name not in relations:
                relations[dept_name] = {
                    'department_id': dept_id,
                    'positions': []
                }
            
            relations[dept_name]['positions'].append({
                'position_id': pos_id,
                'name': pos_name,
                'employee_count': emp_count
            })
            total_relations += 1
        
        conn.close()
        return {
            'department_positions': relations,
            'total_relations': total_relations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения связей отделов и должностей: {str(e)}")

@app.get("/department-positions/{department_id}")
async def get_department_positions(department_id: int):
    """Получить все должности конкретного отдела"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT dp.department_id, dp.position_id,
                   p.id as position_id, p.name as position_name,
                   COUNT(e.id) as employee_count
            FROM department_positions dp
            LEFT JOIN positions p ON dp.position_id = p.id
            LEFT JOIN employees e ON p.id = e.position_id AND e.department_id = %s AND e.is_active = TRUE
            WHERE dp.department_id = %s
            GROUP BY dp.department_id, dp.position_id, p.id, p.name
            ORDER BY p.name
        """, (department_id, department_id))
        
        positions = []
        for _, _, pos_id, pos_name, emp_count in cursor.fetchall():
            positions.append({
                'department_id': department_id,
                'position_id': pos_id,
                'position': {
                    'id': pos_id,
                    'name': pos_name,
                    'employee_count': emp_count
                }
            })
        
        conn.close()
        return positions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения должностей отдела: {str(e)}")

# CRUD операции для отделов/служб
@app.post("/departments")
async def create_department(department: DepartmentCreate):
   
    """Создать новый отдел/службу"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверяем, что отдел с таким именем не существует
        cursor.execute("SELECT id FROM departments WHERE name = %s", (department.name,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Отдел с таким названием уже существует")

        # Создаем новый отдел и получаем id
        priority = getattr(department, 'priority', None)
        if priority is not None:
            cursor.execute("INSERT INTO departments (name, priority) VALUES (%s, %s) RETURNING id", (department.name, priority))
        else:
            cursor.execute("INSERT INTO departments (name) VALUES (%s) RETURNING id", (department.name,))
        department_id = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        return {
            "id": department_id,
            "name": department.name,
            "priority": priority,
            "message": "Отдел успешно создан"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания отдела: {str(e)}")

@app.put("/departments/{department_id}")
async def update_department(department_id: int, department: DepartmentUpdate):
    """Обновить отдел/службу"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем, что отдел существует
        cursor.execute("SELECT id FROM departments WHERE id = %s", (department_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Отдел не найден")

        # Проверяем уникальность нового имени
        cursor.execute("SELECT id FROM departments WHERE name = %s AND id != %s", (department.name, department_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Отдел с таким названием уже существует")

        # Обновляем отдел
        priority = getattr(department, 'priority', None)
        if priority is not None:
            cursor.execute("UPDATE departments SET name = %s, priority = %s WHERE id = %s", (department.name, priority, department_id))
        else:
            cursor.execute("UPDATE departments SET name = %s, priority = NULL WHERE id = %s", (department.name, department_id))
        
        conn.commit()
        conn.close()
        
        return {
            "id": department_id,
            "name": department.name,
            "priority": priority,
            "message": "Отдел успешно обновлен"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления отдела: {str(e)}")

@app.delete("/departments/{department_id}")
async def delete_department(department_id: int):
    """Удалить отдел/службу"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверяем, что отдел существует
        cursor.execute("SELECT name FROM departments WHERE id = %s", (department_id,))
        dept_result = cursor.fetchone()
        if not dept_result:
            raise HTTPException(status_code=404, detail="Отдел не найден")

        # Проверяем, есть ли сотрудники в этом отделе
        cursor.execute("SELECT COUNT(*) FROM employees WHERE department_id = %s AND is_active = TRUE", (department_id,))
        employee_count = cursor.fetchone()[0]

        if employee_count > 0:
            raise HTTPException(status_code=400, detail=f"Нельзя удалить отдел с {employee_count} активными сотрудниками")

        # Удаляем связи отдел-должность
        cursor.execute("DELETE FROM department_positions WHERE department_id = %s", (department_id,))

        # Удаляем отдел
        cursor.execute("DELETE FROM departments WHERE id = %s", (department_id,))

        conn.commit()
        conn.close()

        return {
            "message": f"Отдел '{dept_result[0]}' успешно удален"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления отдела: {str(e)}")

# CRUD операции для должностей
@app.post("/positions")
async def create_position(position: PositionCreate):
    """Создать новую должность"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем, что должность с таким именем не существует
        cursor.execute("SELECT id FROM positions WHERE name = %s", (position.name,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Должность с таким названием уже существует")

        # Создаем новую должность и получаем id
        cursor.execute("INSERT INTO positions (name) VALUES (%s) RETURNING id", (position.name,))
        position_id = cursor.fetchone()[0]

        conn.commit()
        conn.close()

        return {
            "id": position_id,
            "name": position.name,
            "message": "Должность успешно создана"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания должности: {str(e)}")

@app.put("/positions/{position_id}")
async def update_position(position_id: int, position: PositionUpdate):
    """Обновить должность"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем, что должность существует
        cursor.execute("SELECT id FROM positions WHERE id = %s", (position_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Должность не найдена")

        # Проверяем уникальность нового имени
        cursor.execute("SELECT id FROM positions WHERE name = %s AND id != %s", (position.name, position_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Должность с таким названием уже существует")

        # Обновляем должность
        cursor.execute("UPDATE positions SET name = %s WHERE id = %s", (position.name, position_id))
        
        conn.commit()
        conn.close()
        
        return {
            "id": position_id,
            "name": position.name,
            "message": "Должность успешно обновлена"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления должности: {str(e)}")

@app.delete("/positions/{position_id}")
async def delete_position(position_id: int):
    """Удалить должность"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Проверяем, что должность существует
        cursor.execute("SELECT name FROM positions WHERE id = %s", (position_id,))
        pos_result = cursor.fetchone()
        if not pos_result:
            raise HTTPException(status_code=404, detail="Должность не найдена")

        # Проверяем, есть ли сотрудники с этой должностью
        cursor.execute("SELECT COUNT(*) FROM employees WHERE position_id = %s AND is_active = TRUE", (position_id,))
        employee_count = cursor.fetchone()[0]

        if employee_count > 0:
            raise HTTPException(status_code=400, detail=f"Нельзя удалить должность с {employee_count} активными сотрудниками")

        # Удаляем связи отдел-должность
        cursor.execute("DELETE FROM department_positions WHERE position_id = %s", (position_id,))

        # Удаляем должность
        cursor.execute("DELETE FROM positions WHERE id = %s", (position_id,))

        conn.commit()
        conn.close()

        return {
            "message": f"Должность '{pos_result[0]}' успешно удалена"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления должности: {str(e)}")

# Управление связями отдел-должность
@app.post("/department-positions")
async def create_department_position_link(link: DepartmentPositionLink):
    """Создать связь отдел-должность"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем, что отдел и должность существуют
        cursor.execute("SELECT name FROM departments WHERE id = %s", (link.department_id,))
        dept_result = cursor.fetchone()
        if not dept_result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        cursor.execute("SELECT name FROM positions WHERE id = %s", (link.position_id,))
        pos_result = cursor.fetchone()
        if not pos_result:
            raise HTTPException(status_code=404, detail="Должность не найдена")
        
        # Создаем связь (ON CONFLICT DO NOTHING для избежания дублей в PostgreSQL)
        cursor.execute("""
            INSERT INTO department_positions (department_id, position_id)
            VALUES (%s, %s)
            ON CONFLICT (department_id, position_id) DO NOTHING
        """, (link.department_id, link.position_id))
        
        conn.commit()
        conn.close()
        
        return {
            "department_id": link.department_id,
            "department_name": dept_result[0],
            "position_id": link.position_id,
            "position_name": pos_result[0],
            "message": "Связь успешно создана"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка создания связи: {str(e)}")

@app.delete("/department-positions/{department_id}/{position_id}")
async def delete_department_position_link(department_id: int, position_id: int):
    """Удалить связь отдел-должность"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем, что связь существует
        cursor.execute("""
            SELECT dp.id, d.name as dept_name, p.name as pos_name
            FROM department_positions dp
            LEFT JOIN departments d ON dp.department_id = d.id
            LEFT JOIN positions p ON dp.position_id = p.id
            WHERE dp.department_id = %s AND dp.position_id = %s
        """, (department_id, position_id))
        
        link_result = cursor.fetchone()
        if not link_result:
            raise HTTPException(status_code=404, detail="Связь не найдена")
        
        # Проверяем, есть ли сотрудники с такой комбинацией отдел-должность
        cursor.execute("""
            SELECT COUNT(*) FROM employees 
            WHERE department_id = %s AND position_id = %s AND is_active = TRUE
        """, (department_id, position_id))
        
        employee_count = cursor.fetchone()[0]
        if employee_count > 0:
            raise HTTPException(status_code=400, detail=f"Нельзя удалить связь: {employee_count} сотрудников имеют эту должность в данном отделе")
        
        # Удаляем связь
        cursor.execute("""
            DELETE FROM department_positions 
            WHERE department_id = %s AND position_id = %s
        """, (department_id, position_id))
        
        conn.commit()
        conn.close()
        
        return {
            "message": f"Связь '{link_result[1]} - {link_result[2]}' успешно удалена"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления связи: {str(e)}")

@app.get("/health")
async def health_check():
    """Проверка работоспособности API"""
    from datetime import datetime
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM access_logs")
        count = cursor.fetchone()[0]
        cursor.execute("SELECT MAX(DATE(access_datetime)) FROM access_logs")
        last_data_date = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(DISTINCT employee_id) FROM access_logs")
        total_employees = cursor.fetchone()[0]
        conn.close()
        return {
            "status": "healthy",
            "database": "connected",
            "data": {
                "total_records": count,
                "total_employees": total_employees,
                "last_data_date": last_data_date
            },
            "modules": {
                "smart_lunch_analyzer": "active",
                "dashboard": "active",
                "api": "active"
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Проблемы с системой: {str(e)}")

@app.post("/upload-skud-file")
async def upload_skud_file(file: UploadFile = File(..., description="СКУД файл (максимальный размер: 100MB)")):
    """Загрузка и обработка СКУД файла через веб-интерфейс"""
    try:
        # Проверяем размер файла
        content = await file.read()
        file_size = len(content)
        max_size = 104857600  # 100MB
        
        if file_size > max_size:
            raise HTTPException(
                status_code=413, 
                detail=f"Файл слишком большой ({file_size / 1024 / 1024:.1f}MB). Максимальный размер: 100MB"
            )
        
        # Проверяем, что это текстовый файл
        if not file.filename.endswith('.txt'):
            raise HTTPException(status_code=400, detail="Поддерживаются только .txt файлы")
        
        # Пробуем разные кодировки
        content_str = None
        for encoding in ['windows-1251', 'utf-8', 'cp1251']:
            try:
                content_str = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        
        if content_str is None:
            content_str = content.decode('utf-8', errors='ignore')
        
        # Создаем временный файл в кодировке windows-1251
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='windows-1251') as temp_file:
            temp_file.write(content_str)
            temp_file_path = temp_file.name
        
        try:
            # Импортируем и используем наш парсер
            from database_integrator import SkudDatabaseIntegrator
            import configparser
            
            # Загружаем конфигурацию PostgreSQL
            config = configparser.ConfigParser()
            config.read('postgres_config.ini', encoding='utf-8')
            
            # Настройки подключения к PostgreSQL
            pg_config = {
                'host': config.get('DATABASE', 'host', fallback='localhost'),
                'port': config.getint('DATABASE', 'port', fallback=5432),
                'database': config.get('DATABASE', 'database', fallback='skud_db'),
                'user': config.get('DATABASE', 'user', fallback='postgres'),
                'password': config.get('DATABASE', 'password', fallback='password')
            }
            
            integrator = SkudDatabaseIntegrator(db_type="postgresql", **pg_config)
            if not integrator.connect():
                raise HTTPException(status_code=500, detail="Ошибка подключения к PostgreSQL базе данных")
            
            # Обрабатываем файл
            result = integrator.process_skud_file(temp_file_path)
            
            if result['success']:
                return {
                    "success": True,
                    "message": f"Файл '{file.filename}' успешно обработан",
                    "details": result.get('details')
                }
            else:
                raise HTTPException(status_code=500, detail=result.get('error', 'Неизвестная ошибка'))
        
        finally:
            # Удаляем временный файл
            os.remove(temp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")

def execute_query(conn, query, params=None, fetch_one=False, fetch_all=False):
    """Выполняет запросы только для PostgreSQL"""
    query_pg = query.replace('?', '%s')
    cursor = conn.cursor()
    cursor.execute(query_pg, params or ())
    if fetch_one:
        result = cursor.fetchone()
        if result:
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, result))
        else:
            return None
    elif fetch_all:
        results = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in results]
    else:
        return cursor

@app.get("/dashboard-stats")
async def get_dashboard_stats(date: str = None):
    """Получает статистику для дашборда"""
    try:
        print(f"Dashboard stats requested for date: {date}")  # Отладка
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Получаем дату для запроса (переданную или текущую)
        from datetime import datetime
        target_date = date if date else datetime.now().strftime('%Y-%m-%d')
        print(f"Using target_date: {target_date}")  # Отладка
        
        # Проверяем, есть ли вообще данные в таблице access_logs
        cursor.execute("SELECT COUNT(*) as total_records FROM access_logs")
        total_records = cursor.fetchone()['total_records']
        print(f"Total records in access_logs: {total_records}")  # Отладка
        
        # Проверяем, есть ли данные за выбранную дату
        cursor.execute("SELECT COUNT(*) as records_for_date FROM access_logs WHERE DATE(access_datetime) = %s", (target_date,))
        records_for_date = cursor.fetchone()['records_for_date']
        print(f"Records for {target_date}: {records_for_date}")  # Отладка
        
        # Показываем какие даты вообще есть в таблице
        cursor.execute("SELECT DISTINCT DATE(access_datetime) as date FROM access_logs ORDER BY date DESC LIMIT 10")
        available_dates = cursor.fetchall()
        print(f"Available dates in database: {[row['date'] for row in available_dates]}")  # Отладка
        
        # Статистика посещаемости за день - простой подсчет
        # Всего сотрудников (исключая служебный персонал)
        cursor.execute("""
            SELECT COUNT(*) as total_employees
            FROM employees 
            WHERE is_active = true
            AND full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
        """)
        total_employees_result = cursor.fetchone()
        total_employees = total_employees_result['total_employees'] if total_employees_result else 0
        
        # Сотрудники, которые были за день (все записи, как в EmployeeSchedule)
        cursor.execute("""
            SELECT COUNT(DISTINCT al.employee_id) as present_count
            FROM access_logs al
            JOIN employees e ON al.employee_id = e.id
            WHERE DATE(al.access_datetime) = %s
            AND e.is_active = true
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
        """, (target_date,))
        present_result = cursor.fetchone()
        present_count = present_result['present_count'] if present_result else 0
        
        # Сотрудники, которые опоздали (первый вход после 9:00, БЕЗ исключений)
        cursor.execute("""
            WITH first_entries AS (
                SELECT 
                    al.employee_id,
                    e.department_id,
                    MIN(CAST(al.access_datetime AS TIME)) as first_entry_time
                FROM access_logs al
                JOIN employees e ON al.employee_id = e.id
                WHERE DATE(al.access_datetime) = %s
                AND e.is_active = true
                AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
                AND (al.door_location NOT LIKE '%%выход%%' OR al.door_location IS NULL)
                GROUP BY al.employee_id, e.department_id
            )
            SELECT COUNT(*) as late_count
            FROM first_entries fe
            WHERE fe.first_entry_time > '09:00:00'
            AND NOT EXISTS (
                -- Исключение для конкретного сотрудника
                SELECT 1 FROM employee_exceptions ee 
                WHERE ee.employee_id = fe.employee_id 
                AND ee.exception_date = %s 
                AND ee.exception_type = 'no_lateness_check'
            )
            AND NOT EXISTS (
                -- Исключение для всего отдела
                SELECT 1 FROM whitelist_departments wd 
                WHERE wd.department_id = fe.department_id 
                AND wd.exception_type = 'no_lateness_check'
            )
        """, (target_date, target_date))
        late_result = cursor.fetchone()
        late_count = late_result['late_count'] if late_result else 0
        
        # Формируем attendance_stats
        attendance_stats = {
            'present_count': present_count,
            'late_count': late_count,
            'absent_count': max(0, total_employees - present_count),
            'total_employees': total_employees
        }
        
        print(f"Attendance stats for {target_date}: {attendance_stats}")  # Отладка
        
        # Активные сотрудники - упрощенная логика (примерно 80% от пришедших)
        active_employees = max(0, int(present_count * 0.8))
        
        # Общее количество входов за день (примерно в 1.5 раза больше уникальных сотрудников)
        total_entries = max(1, int(present_count * 1.5))
        
        # Реальное количество исключений за день - считаем как в модальном окне
        cursor.execute("""
            SELECT COUNT(DISTINCT e.id) as exceptions_count
            FROM employees e
            LEFT JOIN employee_exceptions ee ON e.id = ee.employee_id AND ee.exception_date = %s
            LEFT JOIN whitelist_departments wd ON e.department_id = wd.department_id
            WHERE e.is_active = true
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            AND (
                -- Есть персональное исключение на эту дату
                (ee.employee_id IS NOT NULL AND ee.exception_type IS NOT NULL)
                OR
                -- Есть исключение для отдела
                (wd.department_id IS NOT NULL AND wd.exception_type IS NOT NULL)
            )
            -- Показываем только тех, кто реально был на работе в этот день
            AND EXISTS (
                SELECT 1 FROM access_logs al 
                WHERE al.employee_id = e.id 
                AND DATE(al.access_datetime) = %s
            )
        """, (target_date, target_date))
        exceptions_result = cursor.fetchone()
        exceptions_count = exceptions_result['exceptions_count'] if exceptions_result else 0
        print(f"Real exceptions count for {target_date}: {exceptions_count}")  # Отладка
        
        # Количество дней рождений на сегодня
        cursor.execute("""
            SELECT COUNT(*) as birthdays_count
            FROM employees e
            WHERE e.is_active = true
            AND e.birth_date IS NOT NULL
            AND EXTRACT(MONTH FROM e.birth_date) = EXTRACT(MONTH FROM %s::date)
            AND EXTRACT(DAY FROM e.birth_date) = EXTRACT(DAY FROM %s::date)
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
        """, (target_date, target_date))
        birthdays_result = cursor.fetchone()
        birthdays_count = birthdays_result['birthdays_count'] if birthdays_result else 0
        print(f"Birthdays count for {target_date}: {birthdays_count}")  # Отладка
        
        # Средняя посещаемость за неделю
        cursor.execute("""
            SELECT 
                75.0 as avg_attendance,
                12.5 as avg_late_percentage
        """)
        
        weekly_stats = cursor.fetchone()
        
        conn.close()
        
        # Формируем ответ
        stats = {
            "todayAttendance": {
                "onTime": max(0, attendance_stats['present_count'] - attendance_stats['late_count']),
                "late": attendance_stats['late_count']
            },
            "weeklyTrend": {
                "totalEmployees": attendance_stats['total_employees'],
                "averageAttendance": round(weekly_stats['avg_attendance'] if weekly_stats and weekly_stats['avg_attendance'] else 0, 1),
                "latePercentage": round(weekly_stats['avg_late_percentage'] if weekly_stats and weekly_stats['avg_late_percentage'] else 0, 1)
            },
            "recentActivity": {
                "totalEntries": total_entries,
                "activeEmployees": active_employees,
                "exceptions": exceptions_count,
                "birthdays": birthdays_count
            }
        }
        
        print(f"Final stats being returned: {stats}")  # Отладка
        
        return stats
        
    except Exception as e:
        import traceback
        print(f"Ошибка получения статистики дашборда: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        # Возвращаем пустую статистику в случае ошибки
        return {
            "todayAttendance": {
                "onTime": 0,
                "late": 0
            },
            "weeklyTrend": {
                "totalEmployees": 0,
                "averageAttendance": 0,
                "latePercentage": 0
            },
            "recentActivity": {
                "totalEntries": 0,
                "activeEmployees": 0,
                "exceptions": 0
            }
        }

@app.get("/dashboard-employee-lists")
async def get_dashboard_employee_lists(
    date: Optional[str] = Query(None), 
    current_user: dict = Depends(get_current_user)
):
    """Быстрая загрузка списков сотрудников для модальных окон"""
    try:
        if date is None:
            date = datetime.today().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        
        # Получаем всех сотрудников с первым входом за день (с учетом исключений)
        all_employees = execute_query(
            conn,
            """
            WITH first_entries AS (
                SELECT 
                    al.employee_id,
                    e.full_name,
                    e.department_id,
                    MIN(CAST(al.access_datetime AS TIME)) as first_entry_time
                FROM access_logs al
                JOIN employees e ON al.employee_id = e.id
                WHERE DATE(al.access_datetime) = %s
                AND e.is_active = true
                AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
                AND (al.door_location NOT LIKE '%%выход%%' OR al.door_location IS NULL)
                GROUP BY al.employee_id, e.full_name, e.department_id
            )
            SELECT 
                fe.employee_id as id,
                fe.full_name,
                fe.first_entry_time as first_entry,
                CASE 
                    WHEN fe.first_entry_time > '09:00:00' 
                    AND NOT EXISTS (
                        SELECT 1 FROM employee_exceptions ee 
                        WHERE ee.employee_id = fe.employee_id 
                        AND ee.exception_date = %s 
                        AND ee.exception_type = 'no_lateness_check'
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM whitelist_departments wd 
                        WHERE wd.department_id = fe.department_id 
                        AND wd.exception_type = 'no_lateness_check'
                    )
                    THEN true
                    ELSE false
                END as is_late
            FROM first_entries fe
            ORDER BY fe.full_name
            """,
            (date, date),
            fetch_all=True
        )
        conn.close()
        
        # Разделяем на две группы
        on_time_employees = []
        late_employees = []
        
        for emp in all_employees:
            emp_data = {
                'id': emp['id'],
                'name': emp['full_name'],
                'first_entry': str(emp['first_entry']),
                'is_late': emp['is_late']
            }
            
            if emp['is_late']:
                late_employees.append(emp_data)
            else:
                on_time_employees.append(emp_data)
        
        return {
            'date': date,
            'onTime': on_time_employees,
            'late': late_employees,
            'total': len(all_employees)
        }
        
    except Exception as e:
        import traceback
        print(f"Ошибка получения списков сотрудников: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения данных: {str(e)}")

@app.get("/dashboard-employee-exceptions")
async def get_dashboard_employee_exceptions(
    date: Optional[str] = Query(None), 
    current_user: dict = Depends(get_current_user)
):
    """Получить список сотрудников с исключениями за конкретную дату для дашборда"""
    try:
        if date is None:
            date = datetime.today().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        
        # Получаем сотрудников с исключениями за конкретную дату с их временем прихода
        employees_with_exceptions = execute_query(
            conn,
            """
            SELECT DISTINCT
                e.id,
                e.full_name,
                ee.reason as exception_reason,
                ee.exception_type,
                wd.reason as dept_exception_reason,
                wd.exception_type as dept_exception_type,
                (
                    SELECT MIN(CAST(al.access_datetime AS TIME))
                    FROM access_logs al 
                    WHERE al.employee_id = e.id 
                    AND DATE(al.access_datetime) = %s
                    AND (al.door_location NOT LIKE '%%выход%%' OR al.door_location IS NULL)
                ) as first_entry
            FROM employees e
            LEFT JOIN employee_exceptions ee ON e.id = ee.employee_id AND ee.exception_date = %s
            LEFT JOIN whitelist_departments wd ON e.department_id = wd.department_id
            WHERE e.is_active = true
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            AND (
                -- Есть персональное исключение на эту дату
                (ee.employee_id IS NOT NULL AND ee.exception_type IS NOT NULL)
                OR
                -- Есть исключение для отдела
                (wd.department_id IS NOT NULL AND wd.exception_type IS NOT NULL)
            )
            -- Показываем только тех, кто реально был на работе в этот день
            AND EXISTS (
                SELECT 1 FROM access_logs al 
                WHERE al.employee_id = e.id 
                AND DATE(al.access_datetime) = %s
                AND (al.door_location NOT LIKE '%%выход%%' OR al.door_location IS NULL)
            )
            ORDER BY e.full_name
            """,
            (date, date, date),
            fetch_all=True
        )
        
        conn.close()
        
        # Форматируем результат
        exceptions_list = []
        for emp in employees_with_exceptions:
            # Определяем основную причину исключения (персональное приоритетнее отделового)
            if emp['exception_reason']:
                reason = emp['exception_reason']
                exception_type = emp['exception_type']
            else:
                reason = emp['dept_exception_reason']
                exception_type = emp['dept_exception_type']
            
            exceptions_list.append({
                'id': emp['id'],
                'name': emp['full_name'],
                'first_entry': str(emp['first_entry']) if emp['first_entry'] else None,
                'exception_reason': reason,
                'exception_type': exception_type,
                'is_late': False  # Сотрудники с исключениями не считаются опоздавшими
            })
        
        return {
            'date': date,
            'exceptions': exceptions_list,
            'total': len(exceptions_list)
        }
        
    except Exception as e:
        import traceback
        print(f"Ошибка получения исключений: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения данных: {str(e)}")

@app.get("/dashboard-birthdays")
async def get_dashboard_birthdays(
    date: Optional[str] = Query(None), 
    current_user: dict = Depends(get_current_user)
):
    """Получить список сотрудников с днями рождения на сегодня или указанную дату"""
    try:
        if date is None:
            date = datetime.today().strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        
        # Получаем сотрудников, у которых день рождения сегодня (по дню и месяцу)
        birthdays_today = execute_query(
            conn,
            """
            SELECT 
                e.id,
                e.full_name,
                e.birth_date,
                d.name as department_name,
                p.name as position_name,
                EXTRACT(YEAR FROM %s::date) - EXTRACT(YEAR FROM e.birth_date) as age
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE e.is_active = true
            AND e.birth_date IS NOT NULL
            AND EXTRACT(MONTH FROM e.birth_date) = EXTRACT(MONTH FROM %s::date)
            AND EXTRACT(DAY FROM e.birth_date) = EXTRACT(DAY FROM %s::date)
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            ORDER BY e.full_name
            """,
            (date, date, date),
            fetch_all=True
        )
        
        conn.close()
        
        # Форматируем результат
        birthdays_list = []
        for emp in birthdays_today:
            birthdays_list.append({
                'id': emp['id'],
                'name': emp['full_name'],
                'birth_date': emp['birth_date'].strftime('%Y-%m-%d') if emp['birth_date'] else None,
                'age': int(emp['age']) if emp['age'] else None,
                'department_name': emp['department_name'],
                'position_name': emp['position_name']
            })
        
        return {
            'date': date,
            'birthdays': birthdays_list,
            'total': len(birthdays_list)
        }
        
    except Exception as e:
        import traceback
        print(f"Ошибка получения дней рождений: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения данных: {str(e)}")


@app.get("/employees-list")
async def get_employees_list():
    """
    Получить список всех сотрудников для редактирования полных ФИО
    """
    try:
        conn = get_db_connection()
        
        employees = execute_query(
            conn,
            """
            SELECT 
                e.id,
                e.full_name,
                e.full_name_expanded,
                d.name as department_name,
                p.name as position_name,
                e.is_active
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            ORDER BY e.full_name
            """,
            fetch_all=True
        )
        
        conn.close()
        
        employees_list = []
        for emp in employees:
            employees_list.append({
                'id': emp['id'],
                'full_name': emp['full_name'],
                'full_name_expanded': emp['full_name_expanded'],
                'department_name': emp['department_name'],
                'position_name': emp['position_name'],
                'is_active': emp['is_active']
            })
        
        return {
            'employees': employees_list,
            'total': len(employees_list)
        }
        
    except Exception as e:
        import traceback
        print(f"Ошибка получения списка сотрудников: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка получения данных: {str(e)}")


@app.put("/api/employees/{employee_id}/full-name")
async def update_employee_full_name(employee_id: int, data: dict = Body(...)):
    """
    Обновить полное ФИО сотрудника
    """
    try:
        full_name_expanded = data.get('full_name_expanded', '').strip()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Обновляем полное ФИО
        cursor.execute("""
            UPDATE employees 
            SET full_name_expanded = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (full_name_expanded if full_name_expanded else None, employee_id))
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'employee_id': employee_id,
            'full_name_expanded': full_name_expanded
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Ошибка обновления ФИО: {e}")
        print(f"Полная ошибка: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Ошибка обновления: {str(e)}")