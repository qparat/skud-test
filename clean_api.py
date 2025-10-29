import sqlite3
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
import jwt
from functools import wraps
import psycopg2
import psycopg2.extras
import configparser
sys.path.append(os.path.join(os.path.dirname(__file__)))

app = FastAPI(title="СКУД API", description="API для системы контроля и управления доступом")

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
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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

class DepartmentUpdate(BaseModel):
    name: str

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

def create_employee_exceptions_table():
    """Создает таблицу исключений для сотрудников, если её нет"""
    try:
        conn = get_db_connection()
        conn = ensure_db_type(conn)
        
        if hasattr(conn, 'db_type') and conn.db_type == "postgresql":
            # PostgreSQL синтаксис
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
        else:
            # SQLite синтаксис
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS employee_exceptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            conn.commit()
        
        # Создаем индекс для быстрого поиска
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
        conn = ensure_db_type(conn)
        
        if hasattr(conn, 'db_type') and conn.db_type == "postgresql":
            # PostgreSQL синтаксис
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
                    id INTEGER PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    description TEXT,
                    permissions TEXT
                )
            """)
            
            execute_query(conn, """
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    token_hash VARCHAR(255) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
        else:
            # SQLite синтаксис
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    full_name TEXT,
                    role INTEGER DEFAULT 3,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    created_by INTEGER,
                    FOREIGN KEY (created_by) REFERENCES users (id)
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS roles (
                    id INTEGER PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    permissions TEXT
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token_hash TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            """)
            conn.commit()
        
        # Вставляем базовые роли (универсально)
        try:
            execute_query(conn, """
                INSERT INTO roles (id, name, description, permissions) VALUES
                (0, 'root', 'Суперпользователь с полными правами', 'all')
                ON CONFLICT (id) DO NOTHING
            """)
        except:
            # Fallback для SQLite
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR IGNORE INTO roles (id, name, description, permissions) VALUES
                (0, 'root', 'Суперпользователь с полными правами', 'all'),
                (2, 'superadmin', 'Администратор с расширенными правами', 'read,write,delete,manage_users'),
                (3, 'user', 'Обычный пользователь с ограниченными правами', 'read')
            """)
            conn.commit()
        
        # Создаем индексы
        execute_query(conn, "CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)")
        execute_query(conn, "CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)")
        execute_query(conn, "CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions (token_hash)")
        execute_query(conn, "CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions (expires_at)")
        
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка создания таблиц авторизации: {e}")
        return False

def update_employees_table():
    """Добавляет колонку birth_date в таблицу employees, если её нет"""
    try:
        conn = get_db_connection()
        conn = ensure_db_type(conn)
        
        # Проверяем, есть ли уже колонка birth_date
        if hasattr(conn, 'db_type') and conn.db_type == "postgresql":
            # PostgreSQL - проверяем через information_schema
            check_column = execute_query(
                conn,
                """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = ? AND column_name = ?
                """,
                ('employees', 'birth_date'),
                fetch_one=True
            )
            
            if not check_column:
                # Добавляем колонку birth_date в PostgreSQL
                execute_query(conn, "ALTER TABLE employees ADD COLUMN birth_date DATE")
                print("✅ Добавлена колонка birth_date в таблицу employees (PostgreSQL)")
        else:
            # SQLite - используем PRAGMA
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(employees)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'birth_date' not in columns:
                # Добавляем колонку birth_date
                cursor.execute("ALTER TABLE employees ADD COLUMN birth_date DATE")
                conn.commit()
                print("✅ Добавлена колонка birth_date в таблицу employees (SQLite)")
        
        conn.close()
        return True
    except Exception as e:
        print(f"Ошибка обновления таблицы employees: {e}")
        return False

# Функции для работы с паролями и токенами
def hash_password(password: str) -> str:
    """Хеширует пароль"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    """Проверяет пароль"""
    return hash_password(password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Создает JWT токен"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    
    # Используем простое кодирование вместо JWT для упрощения
    token = secrets.token_urlsafe(32)
    return token

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
                WHERE s.token_hash = ? AND s.expires_at > NOW()
            """
        else:
            query = """
                SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active
                FROM users u
                JOIN user_sessions s ON u.id = s.user_id
                WHERE s.token_hash = ? AND s.expires_at > datetime('now')
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
        conn = ensure_db_type(conn)
        
        # Проверяем, есть ли уже пользователи
        count_result = execute_query(conn, "SELECT COUNT(*) as count FROM users", fetch_one=True)
        user_count = count_result['count'] if count_result else 0
        
        if user_count == 0:
            # Создаем root пользователя
            hashed_password = hash_password("admin123")
            
            if hasattr(conn, 'db_type') and conn.db_type == "postgresql":
                execute_query(conn, """
                    INSERT INTO users (username, email, full_name, password_hash, role, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, ("admin", "admin@skud.local", "Администратор", hashed_password, 0, True))
            else:
                execute_query(conn, """
                    INSERT INTO users (username, email, full_name, password_hash, role, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
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
    """Получает текущего пользователя из токена"""
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

def get_employee_status(is_late, first_entry, exception_info):
    """Определяет статус сотрудника с учетом исключений"""
    if exception_info and exception_info.get('has_exception'):
        if is_late:
            return f"Опоздал (исключение: {exception_info['reason']})"
        else:
            return f"В норме (исключение: {exception_info['reason']})"
    else:
        if is_late:
            return "Опоздал"
        elif first_entry:
            return "В норме"
        else:
            return "Отсутствовал"

def get_db_connection():
    """Создает подключение к базе данных (PostgreSQL или SQLite в качестве fallback)"""
    try:
        # Пробуем подключиться к PostgreSQL
        config = configparser.ConfigParser()
        config.read('postgres_config.ini', encoding='utf-8')
        
        if config.has_section('DATABASE'):
            pg_config = {
                'host': config.get('DATABASE', 'host', fallback='localhost'),
                'port': config.getint('DATABASE', 'port', fallback=5432),
                'database': config.get('DATABASE', 'database', fallback='skud_db'),
                'user': config.get('DATABASE', 'user', fallback='postgres'),
                'password': config.get('DATABASE', 'password', fallback='password')
            }
            
            # Попытка подключения к PostgreSQL
            conn = psycopg2.connect(**pg_config)
            conn.autocommit = True  # Для совместимости с SQLite
            # Добавляем атрибут для определения типа БД
            conn.db_type = "postgresql"
            # Принудительно вызываем ensure_db_type для гарантии
            conn = ensure_db_type(conn)
            print("✅ PostgreSQL подключение успешно")
            return conn
    except Exception as e:
        print(f"⚠️ PostgreSQL недоступен, используем SQLite: {e}")
    
    # Fallback на SQLite
    try:
        conn = sqlite3.connect("real_skud_data.db")
        conn.execute("PRAGMA encoding = 'UTF-8'")
        conn.db_type = "sqlite"
        # Принудительно вызываем ensure_db_type для гарантии
        conn = ensure_db_type(conn)
        print("✅ SQLite подключение успешно")
        return conn
    except Exception as e:
        print(f"❌ Критическая ошибка SQLite: {e}")
        raise

def ensure_db_type(conn):
    """Убеждается, что у соединения есть атрибут db_type"""
    if not hasattr(conn, 'db_type'):
        # Определяем тип по модулю соединения
        conn_type_str = str(type(conn))
        if 'psycopg2' in conn_type_str:
            conn.db_type = "postgresql"
            print("🔧 Установлен db_type = postgresql для psycopg2 соединения")
        else:
            conn.db_type = "sqlite"
            print("🔧 Установлен db_type = sqlite для sqlite3 соединения")
    else:
        print(f"✅ db_type уже установлен: {conn.db_type}")
    
    return conn

def execute_query(conn, query, params=None, fetch_one=False, fetch_all=False):
    """Универсальная функция для выполнения запросов с поддержкой разных БД"""
    # Убеждаемся, что у соединения есть db_type
    conn = ensure_db_type(conn)
    
    if hasattr(conn, 'db_type') and conn.db_type == "postgresql":
        # PostgreSQL - используем %s плейсхолдеры
        query_pg = query.replace('?', '%s')
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query_pg, params or ())
        
        if fetch_one:
            result = cursor.fetchone()
            return dict(result) if result else None
        elif fetch_all:
            results = cursor.fetchall()
            return [dict(row) for row in results]
        else:
            return cursor
    else:
        # SQLite
        cursor = conn.cursor()
        cursor.execute(query, params or ())
        
        if fetch_one:
            result = cursor.fetchone()
            if result:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, result))
            return None
        elif fetch_all:
            results = cursor.fetchall()
            # Преобразуем в словари для совместимости
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            return [dict(zip(columns, row)) for row in results]
        else:
            return cursor

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация таблиц при запуске
@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске приложения"""
    create_employee_exceptions_table()
    create_auth_tables()
    update_employees_table()
    create_initial_admin()

# ================================
# АУТЕНТИФИКАЦИЯ И АВТОРИЗАЦИЯ
# ================================

@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate, current_user: dict = Depends(require_role(0))):
    """Регистрация нового пользователя (только для root)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем, существует ли пользователь
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", 
                      (user.username, user.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Пользователь уже существует")
        
        # Хешируем пароль
        password_hash = hash_password(user.password)
        
        # Создаем пользователя
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        """, (user.username, user.email, password_hash, user.full_name, user.role))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # Получаем созданного пользователя
        cursor.execute("""
            SELECT id, username, email, full_name, role, is_active, created_at
            FROM users WHERE id = ?
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
            FROM users WHERE username = ? AND is_active = 1
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
            VALUES (?, ?, ?)
        """, (user_data[0], token_hash, expires_at))
        
        # Обновляем время последнего входа
        cursor.execute("""
            UPDATE users SET last_login = datetime('now') WHERE id = ?
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
async def get_users(current_user: dict = Depends(require_role(2))):
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
async def update_user(user_id: int, updates: dict, current_user: dict = Depends(require_role(2))):
    """Обновление пользователя (для superadmin и выше)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование пользователя
        cursor.execute("SELECT id, role FROM users WHERE id = ?", (user_id,))
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
                update_fields.append(f"{field} = ?")
                update_values.append(updates[field])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Нет полей для обновления")
        
        # Обновляем пароль отдельно, если передан
        if "password" in updates:
            update_fields.append("password_hash = ?")
            update_values.append(hash_password(updates["password"]))
        
        update_values.append(user_id)
        
        cursor.execute(f"""
            UPDATE users SET {', '.join(update_fields)}
            WHERE id = ?
        """, update_values)
        
        conn.commit()
        conn.close()
        
        return {"message": "Пользователь обновлен"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления пользователя: {str(e)}")

@app.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: dict = Depends(require_role(0))):
    """Удаление пользователя (только для root)"""
    try:
        if user_id == current_user["id"]:
            raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование пользователя
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Удаляем пользователя
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        
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
    current_user: dict = Depends(require_role(2))
):
    """Упрощенное создание пользователя"""
    try:
        # Запрещаем создавать root пользователей обычным superadmin
        if current_user["role"] > 0 and user_data.role == 0:
            raise HTTPException(status_code=403, detail="Недостаточно прав для создания root пользователя")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем, существует ли пользователь
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", 
                      (user_data.username, user_data.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Пользователь с таким именем или email уже существует")
        
        # Хешируем пароль
        password_hash = hash_password(user_data.password)
        
        # Создаем пользователя
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
        """, (user_data.username, user_data.email, password_hash, user_data.full_name, user_data.role, True, current_user["id"]))
        
        user_id = cursor.lastrowid
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
        raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {str(e)}")

@app.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Выход из системы"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        token_hash = hashlib.sha256(credentials.credentials.encode()).hexdigest()
        cursor.execute("DELETE FROM user_sessions WHERE token_hash = ?", (token_hash,))
        
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
async def get_employee_schedule(date: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
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
        
        # Быстрый запрос - получаем все записи за день одним запросом с JOIN к таблице employees
        all_logs = execute_query(
            conn,
            """
            SELECT al.employee_id, e.full_name, TIME(al.access_datetime) as access_time, al.door_location
            FROM access_logs al
            JOIN employees e ON al.employee_id = e.id
            WHERE DATE(al.access_datetime) = ?
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            ORDER BY al.employee_id, al.access_datetime
            """,
            (date,),
            fetch_all=True
        )
        
        # Группируем по сотрудникам
        employees_dict = {}
        for log in all_logs:
            employee_id = log['employee_id']
            full_name = log['full_name']
            access_time = log['access_time']
            door_location = log['door_location']
            
            if employee_id not in employees_dict:
                employees_dict[employee_id] = {
                    'id': employee_id,
                    'name': full_name,
                    'entries': [],
                    'exits': []
                }
            
            if door_location and 'выход' in door_location.lower():
                employees_dict[employee_id]['exits'].append((access_time, door_location))
            else:
                employees_dict[employee_id]['entries'].append((access_time, door_location))
        
        employees_schedule = []
        work_start_time = datetime.strptime('09:00:00', '%H:%M:%S').time()
        
        # Получаем все исключения для этой даты
        exceptions_data = execute_query(
            conn,
            """
            SELECT employee_id, exception_type, reason
            FROM employee_exceptions 
            WHERE exception_date = ?
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
            
            # Проверяем наличие исключения для этого сотрудника на эту дату
            employee_exception = exceptions_for_date.get(emp_data['id'])
            
            if first_entry:
                try:
                    entry_time = datetime.strptime(first_entry, '%H:%M:%S').time()
                    if entry_time > work_start_time:
                        # Если есть исключение типа "no_lateness_check", не помечаем как опоздавшего
                        if employee_exception and employee_exception['type'] == 'no_lateness_check':
                            is_late = False
                            late_minutes = 0
                            exception_info = {
                                'has_exception': True,
                                'reason': employee_exception['reason'],
                                'type': employee_exception['type']
                            }
                        else:
                            is_late = True
                            entry_datetime = datetime.combine(datetime.today().date(), entry_time)
                            work_start_datetime = datetime.combine(datetime.today().date(), work_start_time)
                            late_minutes = int((entry_datetime - work_start_datetime).total_seconds() / 60)
                    else:
                        # Если пришел вовремя, но есть исключение, все равно отмечаем его
                        if employee_exception:
                            exception_info = {
                                'has_exception': True,
                                'reason': employee_exception['reason'],
                                'type': employee_exception['type']
                            }
                except:
                    pass

            # Вычисляем рабочие часы
            work_hours = None
            if first_entry and last_exit:
                try:
                    entry_datetime = datetime.strptime(first_entry, '%H:%M:%S')
                    exit_datetime = datetime.strptime(last_exit, '%H:%M:%S')
                    work_duration = exit_datetime - entry_datetime
                    work_hours = work_duration.total_seconds() / 3600
                except:
                    work_hours = None
            
            employees_schedule.append({
                'employee_id': emp_data['id'],
                'full_name': emp_data['name'],
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
        
        conn.close()
        
        return {
            'date': date,
            'employees': employees_schedule,
            'total_count': len(employees_schedule),
            'late_count': sum(1 for emp in employees_schedule if emp['is_late'])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения расписания: {str(e)}")

@app.get("/employee-schedule-range")
async def get_employee_schedule_range(start_date: str = Query(...), end_date: str = Query(...), current_user: dict = Depends(get_current_user)):
    """Расписание всех сотрудников за диапазон дат с детализацией по дням"""
    try:
        from datetime import datetime, timedelta
        
        # Валидация дат
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")
        
        if start_dt > end_dt:
            raise HTTPException(status_code=400, detail="Начальная дата не может быть позже конечной")
        
        # Ограничение на диапазон (максимум 31 день)
        if (end_dt - start_dt).days > 31:
            raise HTTPException(status_code=400, detail="Максимальный диапазон - 31 день")
        
        conn = sqlite3.connect("real_skud_data.db")
        cursor = conn.cursor()
        
        # Получаем только сотрудников, у которых есть записи доступа в указанном диапазоне дат
        cursor.execute("""
            SELECT DISTINCT e.id, e.full_name 
            FROM employees e
            INNER JOIN access_logs al ON e.id = al.employee_id
            WHERE e.is_active = 1
            AND e.full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            AND DATE(al.access_datetime) BETWEEN ? AND ?
            ORDER BY e.full_name
        """, (start_date, end_date))
        employees = cursor.fetchall()
        
        employees_with_days = []
        total_late_count = 0
        
        for emp_id, emp_name in employees:
            employee_days = []
            
            # Проходим по каждому дню в диапазоне
            current_date = start_dt
            while current_date <= end_dt:
                date_str = current_date.strftime('%Y-%m-%d')
                
                # Получаем записи доступа за день для этого сотрудника
                cursor.execute("""
                    SELECT TIME(access_datetime) as access_time, door_location
                    FROM access_logs
                    WHERE employee_id = ? AND DATE(access_datetime) = ?
                    ORDER BY access_datetime ASC
                """, (emp_id, date_str))
                
                day_logs = cursor.fetchall()
                
                if day_logs:
                    # Разделяем на входы и выходы
                    entries = []
                    exits = []
                    
                    for access_time, door_location in day_logs:
                        if 'выход' in door_location.lower() or 'exit' in door_location.lower():
                            exits.append((access_time, door_location))
                        else:
                            entries.append((access_time, door_location))
                    
                    # Первый вход и последний выход
                    first_entry = min(entries)[0] if entries else None
                    first_entry_door = min(entries)[1] if entries else None
                    last_exit = max(exits)[0] if exits else None
                    last_exit_door = max(exits)[1] if exits else None
                    
                    # Проверка опоздания (после 09:00)
                    is_late = False
                    late_minutes = 0
                    
                    if first_entry:
                        entry_time = datetime.strptime(first_entry, '%H:%M:%S').time()
                        work_start = datetime.strptime('09:00:00', '%H:%M:%S').time()
                        is_late = entry_time > work_start
                        
                        if is_late:
                            entry_datetime = datetime.combine(current_date, entry_time)
                            work_start_datetime = datetime.combine(current_date, work_start)
                            late_minutes = int((entry_datetime - work_start_datetime).total_seconds() / 60)
                            total_late_count += 1
                    
                    # Расчет рабочих часов
                    work_hours = None
                    if first_entry and last_exit:
                        try:
                            first_dt = datetime.strptime(first_entry, '%H:%M:%S')
                            last_dt = datetime.strptime(last_exit, '%H:%M:%S')
                            if last_dt > first_dt:
                                work_duration = last_dt - first_dt
                                work_hours = work_duration.total_seconds() / 3600
                        except:
                            pass
                    
                    # Проверка исключений
                    cursor.execute("""
                        SELECT reason, exception_type
                        FROM employee_exceptions
                        WHERE employee_id = ? AND exception_date = ?
                    """, (emp_id, date_str))
                    exception_data = cursor.fetchone()
                    
                    exception_info = None
                    if exception_data:
                        exception_info = {
                            'has_exception': True,
                            'reason': exception_data[0],
                            'type': exception_data[1]
                        }
                    
                    status = get_employee_status(is_late, first_entry, exception_info)
                    
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
                # Если нет записей за день, то НЕ добавляем этот день в результат
                # Показываем только дни с фактическими записями доступа
                
                current_date += timedelta(days=1)
            
            # Добавляем сотрудника только если у него есть хотя бы один день с записями
            if employee_days:
                employees_with_days.append({
                    'employee_id': emp_id,
                    'full_name': emp_name,
                    'days': employee_days
                })
        
        conn.close()
        
        return {
            'start_date': start_date,
            'end_date': end_date,
            'employees': employees_with_days,
            'total_count': len(employees_with_days),
            'late_count': total_late_count
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
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days_back)
        
        conn = sqlite3.connect("real_skud_data.db")
        cursor = conn.cursor()
        
        # Получаем информацию о сотруднике из таблицы employees
        cursor.execute("SELECT full_name FROM employees WHERE id = ?", (employee_id,))
        employee_result = cursor.fetchone()
        if not employee_result:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        employee_name = employee_result[0]
        
        # Получаем все записи сотрудника за период
        cursor.execute("""
            SELECT DATE(access_datetime) as access_date, TIME(access_datetime) as access_time, door_location
            FROM access_logs
            WHERE employee_id = ? 
            AND DATE(access_datetime) BETWEEN ? AND ?
            ORDER BY access_datetime
        """, (employee_id, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')))
        
        all_records = cursor.fetchall()
        
        # Группируем по дням
        daily_data = {}
        for access_date, access_time, door_location in all_records:
            if access_date not in daily_data:
                daily_data[access_date] = {'entries': [], 'exits': []}
            
            if door_location and 'выход' in door_location.lower():
                daily_data[access_date]['exits'].append((access_time, door_location))
            else:
                daily_data[access_date]['entries'].append((access_time, door_location))
        
        # Получаем исключения для сотрудника за период
        cursor.execute("""
            SELECT exception_date, reason, exception_type
            FROM employee_exceptions 
            WHERE employee_id = ? 
            AND exception_date BETWEEN ? AND ?
        """, (employee_id, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')))
        
        exceptions_data = {}
        for exc_date, reason, exc_type in cursor.fetchall():
            exceptions_data[exc_date] = {
                'reason': reason,
                'exception_type': exc_type
            }
        
        # Формируем ответ
        daily_records = []
        total_late_days = 0
        work_start_time = datetime.strptime('09:00:00', '%H:%M:%S').time()
        total_work_hours = 0
        valid_work_days = 0
        
        for date_str in sorted(daily_data.keys()):
            day_data = daily_data[date_str]
            
            # Первый вход и последний выход
            first_entry = min(day_data['entries'])[0] if day_data['entries'] else None
            last_exit = max(day_data['exits'])[0] if day_data['exits'] else None
            
            # Проверка исключения для этого дня
            has_exception = date_str in exceptions_data
            exception_info = exceptions_data.get(date_str, None)
            
            # Проверка опоздания (не считается опозданием, если есть исключение)
            is_late = False
            if first_entry and not has_exception:
                try:
                    entry_time = datetime.strptime(first_entry, '%H:%M:%S').time()
                    if entry_time > work_start_time:
                        is_late = True
                        total_late_days += 1
                except:
                    pass
            
            # Рабочие часы
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
                except:
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
        
        # Статистика
        total_days = len(daily_records)
        punctuality_rate = ((total_days - total_late_days) / total_days * 100) if total_days > 0 else 0
        avg_work_hours = total_work_hours / valid_work_days if valid_work_days > 0 else None
        
        # Средние времена (упрощенно)
        all_entries = [rec['first_entry'] for rec in daily_records if rec['first_entry']]
        all_exits = [rec['last_exit'] for rec in daily_records if rec['last_exit']]
        
        avg_arrival_time = None
        avg_departure_time = None
        
        if all_entries:
            try:
                # Простое среднее время
                times = [datetime.strptime(t, '%H:%M:%S') for t in all_entries]
                avg_seconds = sum(t.hour * 3600 + t.minute * 60 + t.second for t in times) / len(times)
                avg_arrival_time = f"{int(avg_seconds // 3600):02d}:{int((avg_seconds % 3600) // 60):02d}"
            except:
                pass
                
        if all_exits:
            try:
                times = [datetime.strptime(t, '%H:%M:%S') for t in all_exits]
                avg_seconds = sum(t.hour * 3600 + t.minute * 60 + t.second for t in times) / len(times)
                avg_departure_time = f"{int(avg_seconds // 3600):02d}:{int((avg_seconds % 3600) // 60):02d}"
            except:
                pass
        
        conn.close()
        
        return {
            "employee_name": employee_name,
            "total_days": total_days,
            "attendance_rate": 100.0,  # Упрощенно - если есть записи, значит присутствовал
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
            SELECT e.id, e.full_name, 
                   p.name as position_name, 
                   d.name as department_name,
                   e.birth_date
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE e.is_active = ?
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
            SELECT id, full_name
            FROM employees
            WHERE is_active = ?
            AND full_name NOT IN ('Охрана М.', '1 пост о.', '2 пост о.', 'Крыша К.', 'Водитель 1 В.', 'Водитель 2 В.', 'Дежурный в.', 'Дежурный В.')
            ORDER BY full_name
            """,
            (True,),
            fetch_all=True
        )
        
        conn.close()
        
        return [
            {
                'id': row['id'],
                'full_name': row['full_name']
            }
            for row in results
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения списка сотрудников: {str(e)}")

@app.put("/employees/{employee_id}")
async def update_employee(employee_id: int, updates: dict, current_user: dict = Depends(require_role(2))):
    """Обновление данных сотрудника (для superadmin и выше)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT id FROM employees WHERE id = ?", (employee_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Создаем запрос обновления
        update_fields = []
        update_values = []
        
        allowed_fields = ["full_name", "birth_date", "department_id", "position_id", "card_number", "is_active"]
        for field in allowed_fields:
            if field in updates:
                update_fields.append(f"{field} = ?")
                update_values.append(updates[field])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Нет полей для обновления")
        
        # Добавляем обновление времени модификации
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        update_values.append(employee_id)
        
        cursor.execute(f"""
            UPDATE employees SET {', '.join(update_fields)}
            WHERE id = ?
        """, update_values)
        
        conn.commit()
        conn.close()
        
        return {"message": "Данные сотрудника обновлены"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления сотрудника: {str(e)}")

@app.get("/employees/unassigned")
async def get_unassigned_employees():
    """Получить сотрудников без службы или с неактивным статусом"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT e.id, e.full_name, p.name as position_name, d.name as department_name, e.position_id
            FROM employees e
            LEFT JOIN positions p ON e.position_id = p.id
            LEFT JOIN departments d ON e.department_id = d.id
            WHERE e.is_active = 1
            ORDER BY e.full_name
        """)
        
        employees = []
        for emp_id, name, position, department, position_id in cursor.fetchall():
            employees.append({
                'employee_id': emp_id,
                'full_name': name,
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
            SELECT e.id, e.full_name, e.birth_date, e.card_number, e.is_active,
                   e.created_at, e.updated_at,
                   d.id as department_id, d.name as department_name,
                   p.id as position_id, p.name as position_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE e.id = ?
        """, (employee_id,))
        
        employee_data = cursor.fetchone()
        conn.close()
        
        if not employee_data:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        return {
            "id": employee_data[0],
            "full_name": employee_data[1],
            "birth_date": employee_data[2],
            "card_number": employee_data[3],
            "is_active": employee_data[4],
            "created_at": employee_data[5],
            "updated_at": employee_data[6],
            "department": {
                "id": employee_data[7],
                "name": employee_data[8]
            } if employee_data[7] else None,
            "position": {
                "id": employee_data[9],
                "name": employee_data[10]
            } if employee_data[9] else None
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
            SELECT d.id, d.name, COUNT(e.id) as employee_count
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = ?
            GROUP BY d.id, d.name
            ORDER BY d.name
            """,
            (True,),
            fetch_all=True
        )
        
        departments = []
        for row in results:
            departments.append({
                'id': row['id'],
                'name': row['name'],
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
            SELECT d.id, d.name, COUNT(e.id) as employee_count
            FROM departments d
            LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = 1
            WHERE d.id = ?
            GROUP BY d.id, d.name
        """, (department_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        dept_id, name, employee_count = result
        return {
            'id': dept_id,
            'name': name,
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
            LEFT JOIN employees e ON p.id = e.position_id AND e.is_active = 1
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
            LEFT JOIN employees e ON p.id = e.position_id AND e.is_active = 1
            WHERE p.id = ?
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
        cursor.execute("SELECT name FROM departments WHERE id = ?", (department_id,))
        dept_result = cursor.fetchone()
        if not dept_result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        # Получаем сотрудников отдела
        cursor.execute("""
            SELECT e.id, e.full_name, p.name as position_name
            FROM employees e
            LEFT JOIN positions p ON e.position_id = p.id
            WHERE e.department_id = ? AND e.is_active = 1
            ORDER BY e.full_name
        """, (department_id,))
        
        employees = []
        for emp_id, name, position in cursor.fetchall():
            employees.append({
                'employee_id': emp_id,
                'full_name': name,
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
        cursor.execute("SELECT id, full_name FROM employees WHERE id = ?", (employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
            
        # Проверяем существование службы (если указана)
        if new_department_id is not None:
            cursor.execute("SELECT id, name FROM departments WHERE id = ?", (new_department_id,))
            department = cursor.fetchone()
            if not department:
                raise HTTPException(status_code=404, detail="Служба не найдена")
            
        # Если указана должность, проверяем что она существует
        if new_position_id:
            cursor.execute("SELECT id, name FROM positions WHERE id = ?", (new_position_id,))
            position = cursor.fetchone()
            if not position:
                raise HTTPException(status_code=404, detail="Должность не найдена")
        
        # Обновляем данные сотрудника
        cursor.execute("""
            UPDATE employees 
            SET department_id = ?, position_id = ?
            WHERE id = ?
        """, (new_department_id, new_position_id, employee_id))
        
        conn.commit()
        conn.close()
        
        return {
            "message": f"Сотрудник {employee[1]} переведен в службу {department[1]}",
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
        cursor.execute("SELECT id, full_name FROM employees WHERE id = ?", (employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
            
        # Проверяем существование должности (если указана)
        if new_position_id is not None:
            cursor.execute("SELECT id, name FROM positions WHERE id = ?", (new_position_id,))
            position = cursor.fetchone()
            if not position:
                raise HTTPException(status_code=404, detail="Должность не найдена")
        
        # Обновляем должность сотрудника
        cursor.execute("""
            UPDATE employees 
            SET position_id = ?
            WHERE id = ?
        """, (new_position_id, employee_id))
        
        conn.commit()
        conn.close()
        
        position_name = position[1] if new_position_id and position else "не указана"
        
        return {
            "message": f"Должность сотрудника {employee[1]} изменена на '{position_name}'",
            "employee_id": employee_id,
            "position_id": new_position_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении должности: {str(e)}")

# ======================= ИСКЛЮЧЕНИЯ СОТРУДНИКОВ =======================

@app.get("/employee-exceptions")
async def get_employee_exceptions(employee_id: Optional[int] = Query(None), 
                                exception_date: Optional[str] = Query(None)):
    """Получение исключений для сотрудников"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT ee.id, ee.employee_id, e.full_name, ee.exception_date, 
                   ee.reason, ee.exception_type, ee.created_at
            FROM employee_exceptions ee
            JOIN employees e ON ee.employee_id = e.id
            WHERE 1=1
        """
        params = []
        
        if employee_id:
            query += " AND ee.employee_id = ?"
            params.append(employee_id)
            
        if exception_date:
            query += " AND ee.exception_date = ?"
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
async def create_employee_exception(exception: ExceptionCreate, current_user: dict = Depends(require_role(2))):
    """Создание нового исключения для сотрудника"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT full_name FROM employees WHERE id = ?", (exception.employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Создаем исключение
        cursor.execute("""
            INSERT INTO employee_exceptions (employee_id, exception_date, reason, exception_type)
            VALUES (?, ?, ?, ?)
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
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="Исключение для этого сотрудника на эту дату уже существует")
        raise HTTPException(status_code=500, detail=f"Ошибка при создании исключения: {str(e)}")

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
            WHERE ee.id = ?
        """, (exception_id,))
        existing = cursor.fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Исключение не найдено")
        
        # Обновляем исключение
        cursor.execute("""
            UPDATE employee_exceptions 
            SET reason = ?, exception_type = ?
            WHERE id = ?
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
            WHERE ee.id = ?
        """, (exception_id,))
        existing = cursor.fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Исключение не найдено")
        
        # Удаляем исключение
        cursor.execute("DELETE FROM employee_exceptions WHERE id = ?", (exception_id,))
        
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
        try:
            start_date = datetime.strptime(exception_range.start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(exception_range.end_date, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")
        
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="Начальная дата не может быть позже конечной")
        
        # Проверяем ограничение на диапазон (максимум 31 день)
        if (end_date - start_date).days > 31:
            raise HTTPException(status_code=400, detail="Максимальный диапазон - 31 день")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование сотрудника
        cursor.execute("SELECT full_name FROM employees WHERE id = ?", (exception_range.employee_id,))
        employee = cursor.fetchone()
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Создаем исключения для каждого дня в диапазоне
        created_count = 0
        updated_count = 0
        current_date = start_date
        
        while current_date <= end_date:
            try:
                cursor.execute("""
                    INSERT INTO employee_exceptions (employee_id, exception_date, reason, exception_type)
                    VALUES (?, ?, ?, ?)
                """, (exception_range.employee_id, current_date.strftime('%Y-%m-%d'), 
                      exception_range.reason, exception_range.exception_type))
                created_count += 1
            except Exception as e:
                if "UNIQUE constraint failed" in str(e):
                    # Если исключение уже существует, обновляем его
                    cursor.execute("""
                        UPDATE employee_exceptions 
                        SET reason = ?, exception_type = ?
                        WHERE employee_id = ? AND exception_date = ?
                    """, (exception_range.reason, exception_range.exception_type,
                          exception_range.employee_id, current_date.strftime('%Y-%m-%d')))
                    updated_count += 1
                else:
                    raise e
            
            current_date += timedelta(days=1)
        
        conn.commit()
        conn.close()
        
        total_days = (end_date - start_date).days + 1
        
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

@app.get("/departments/{department_id}/positions")
async def get_department_positions(department_id: int):
    """Получить должности, доступные в конкретном отделе"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получаем информацию об отделе
        cursor.execute("SELECT name FROM departments WHERE id = ?", (department_id,))
        dept_result = cursor.fetchone()
        if not dept_result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        # Получаем должности отдела
        cursor.execute("""
            SELECT p.id, p.name, COUNT(e.id) as employee_count
            FROM department_positions dp
            LEFT JOIN positions p ON dp.position_id = p.id
            LEFT JOIN employees e ON p.id = e.position_id AND e.department_id = ? AND e.is_active = 1
            WHERE dp.department_id = ?
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
        cursor.execute("SELECT name FROM positions WHERE id = ?", (position_id,))
        pos_result = cursor.fetchone()
        if not pos_result:
            raise HTTPException(status_code=404, detail="Должность не найдена")
        
        # Получаем отделы с этой должностью
        cursor.execute("""
            SELECT d.id, d.name, COUNT(e.id) as employee_count
            FROM department_positions dp
            LEFT JOIN departments d ON dp.department_id = d.id
            LEFT JOIN employees e ON d.id = e.department_id AND e.position_id = ? AND e.is_active = 1
            WHERE dp.position_id = ?
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
            LEFT JOIN employees e ON d.id = e.department_id AND p.id = e.position_id AND e.is_active = 1
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
            LEFT JOIN employees e ON p.id = e.position_id AND e.department_id = ? AND e.is_active = 1
            WHERE dp.department_id = ?
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
        cursor.execute("SELECT id FROM departments WHERE name = ?", (department.name,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Отдел с таким названием уже существует")
        
        # Создаем новый отдел
        cursor.execute("INSERT INTO departments (name) VALUES (?)", (department.name,))
        department_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return {
            "id": department_id,
            "name": department.name,
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
        cursor.execute("SELECT id FROM departments WHERE id = ?", (department_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        # Проверяем уникальность нового имени
        cursor.execute("SELECT id FROM departments WHERE name = ? AND id != ?", (department.name, department_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Отдел с таким названием уже существует")
        
        # Обновляем отдел
        cursor.execute("UPDATE departments SET name = ? WHERE id = ?", (department.name, department_id))
        
        conn.commit()
        conn.close()
        
        return {
            "id": department_id,
            "name": department.name,
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
        cursor.execute("SELECT name FROM departments WHERE id = ?", (department_id,))
        dept_result = cursor.fetchone()
        if not dept_result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        # Проверяем, есть ли сотрудники в этом отделе
        cursor.execute("SELECT COUNT(*) FROM employees WHERE department_id = ? AND is_active = 1", (department_id,))
        employee_count = cursor.fetchone()[0]
        
        if employee_count > 0:
            raise HTTPException(status_code=400, detail=f"Нельзя удалить отдел с {employee_count} активными сотрудниками")
        
        # Удаляем связи отдел-должность
        cursor.execute("DELETE FROM department_positions WHERE department_id = ?", (department_id,))
        
        # Удаляем отдел
        cursor.execute("DELETE FROM departments WHERE id = ?", (department_id,))
        
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
        cursor.execute("SELECT id FROM positions WHERE name = ?", (position.name,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Должность с таким названием уже существует")
        
        # Создаем новую должность
        cursor.execute("INSERT INTO positions (name) VALUES (?)", (position.name,))
        position_id = cursor.lastrowid
        
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
        cursor.execute("SELECT id FROM positions WHERE id = ?", (position_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Должность не найдена")
        
        # Проверяем уникальность нового имени
        cursor.execute("SELECT id FROM positions WHERE name = ? AND id != ?", (position.name, position_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Должность с таким названием уже существует")
        
        # Обновляем должность
        cursor.execute("UPDATE positions SET name = ? WHERE id = ?", (position.name, position_id))
        
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
        cursor.execute("SELECT name FROM positions WHERE id = ?", (position_id,))
        pos_result = cursor.fetchone()
        if not pos_result:
            raise HTTPException(status_code=404, detail="Должность не найдена")
        
        # Проверяем, есть ли сотрудники с этой должностью
        cursor.execute("SELECT COUNT(*) FROM employees WHERE position_id = ? AND is_active = 1", (position_id,))
        employee_count = cursor.fetchone()[0]
        
        if employee_count > 0:
            raise HTTPException(status_code=400, detail=f"Нельзя удалить должность с {employee_count} активными сотрудниками")
        
        # Удаляем связи отдел-должность
        cursor.execute("DELETE FROM department_positions WHERE position_id = ?", (position_id,))
        
        # Удаляем должность
        cursor.execute("DELETE FROM positions WHERE id = ?", (position_id,))
        
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
        cursor.execute("SELECT name FROM departments WHERE id = ?", (link.department_id,))
        dept_result = cursor.fetchone()
        if not dept_result:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        cursor.execute("SELECT name FROM positions WHERE id = ?", (link.position_id,))
        pos_result = cursor.fetchone()
        if not pos_result:
            raise HTTPException(status_code=404, detail="Должность не найдена")
        
        # Создаем связь (INSERT OR IGNORE для избежания дублей)
        cursor.execute("""
            INSERT OR IGNORE INTO department_positions (department_id, position_id) 
            VALUES (?, ?)
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
            WHERE dp.department_id = ? AND dp.position_id = ?
        """, (department_id, position_id))
        
        link_result = cursor.fetchone()
        if not link_result:
            raise HTTPException(status_code=404, detail="Связь не найдена")
        
        # Проверяем, есть ли сотрудники с такой комбинацией отдел-должность
        cursor.execute("""
            SELECT COUNT(*) FROM employees 
            WHERE department_id = ? AND position_id = ? AND is_active = 1
        """, (department_id, position_id))
        
        employee_count = cursor.fetchone()[0]
        if employee_count > 0:
            raise HTTPException(status_code=400, detail=f"Нельзя удалить связь: {employee_count} сотрудников имеют эту должность в данном отделе")
        
        # Удаляем связь
        cursor.execute("""
            DELETE FROM department_positions 
            WHERE department_id = ? AND position_id = ?
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
    try:
        conn = sqlite3.connect("real_skud_data.db")
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM access_logs")
        count = cursor.fetchone()[0]
        
        # Получаем последнюю дату данных
        cursor.execute("SELECT MAX(DATE(access_datetime)) FROM access_logs")
        last_data_date = cursor.fetchone()[0]
        
        # Общая статистика
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
                    "stats": {
                        "processed_lines": result.get('processed_lines', 0),
                        "new_employees": result.get('new_employees', 0),
                        "new_access_records": result.get('new_access_records', 0)
                    }
                }
            else:
                raise HTTPException(status_code=400, detail=f"Ошибка обработки файла: {result.get('error', 'Неизвестная ошибка')}")
                
        finally:
            # Удаляем временный файл
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки файла: {str(e)}")

if __name__ == "__main__":
    # Создаем таблицы при запуске
    create_employee_exceptions_table()
    create_auth_tables()
    update_employees_table()
    create_initial_admin()
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=True)