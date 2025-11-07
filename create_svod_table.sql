-- Создание таблицы для хранения списка сотрудников в своде ТРК
CREATE TABLE IF NOT EXISTS svod_report_employees (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, report_date)
);

-- Создаем индексы для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_svod_report_date ON svod_report_employees(report_date);
CREATE INDEX IF NOT EXISTS idx_svod_employee_id ON svod_report_employees(employee_id);

-- Комментарии к таблице
COMMENT ON TABLE svod_report_employees IS 'Список сотрудников, добавленных в свод ТРК на конкретную дату';
COMMENT ON COLUMN svod_report_employees.employee_id IS 'ID сотрудника';
COMMENT ON COLUMN svod_report_employees.report_date IS 'Дата отчета';
COMMENT ON COLUMN svod_report_employees.added_at IS 'Дата и время добавления в свод';
