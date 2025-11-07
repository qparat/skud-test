-- Миграция таблицы svod_report_employees
-- Убираем привязку к дате - один список сотрудников на все даты

-- Удаляем старую таблицу
DROP TABLE IF EXISTS svod_report_employees;

-- Создаем новую таблицу без поля report_date
CREATE TABLE svod_report_employees (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индекс
CREATE INDEX IF NOT EXISTS idx_svod_employee_id ON svod_report_employees(employee_id);

-- Комментарии
COMMENT ON TABLE svod_report_employees IS 'Список сотрудников в своде ТРК (общий для всех дат)';
COMMENT ON COLUMN svod_report_employees.employee_id IS 'ID сотрудника (уникальный)';
COMMENT ON COLUMN svod_report_employees.added_at IS 'Дата добавления в свод';
