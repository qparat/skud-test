"""
Основное приложение СКУД для реального формата данных
"""
import sys
import os
import configparser
import json
import logging
from typing import Dict, Any, List
from datetime import datetime, date

# Добавляем src директорию в путь для импортов
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.skud_database import SkudDatabaseManager
from src.real_skud_parser import parse_real_skud_line, create_real_skud_config, RealSkudRecord
import hashlib

class RealSkudDataLoader:
    """Загрузчик данных реального формата СКУД"""
    
    def __init__(self, config_file: str = "real_skud_config.ini"):
        self.config_file = config_file
        self.config = None
        self.db_manager = None
        self.parser_config = None
        
        # Настройка логирования
        self.setup_logging()
        self.logger = logging.getLogger(__name__)
    
    def setup_logging(self):
        """Настройка системы логирования"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('real_skud_data_loader.log', encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
    
    def load_config(self) -> bool:
        """Загрузка конфигурации"""
        try:
            if not os.path.exists(self.config_file):
                self.logger.info(f"Создаем конфигурацию: {self.config_file}")
                self.create_default_config()
            
            self.config = configparser.ConfigParser()
            self.config.read(self.config_file, encoding='utf-8')
            
            self.logger.info(f"Конфигурация загружена из {self.config_file}")
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка загрузки конфигурации: {e}")
            return False
    
    def create_default_config(self):
        """Создание конфигурации по умолчанию для реального формата"""
        config = configparser.ConfigParser()
        
        config['DATABASE'] = {
            'type': 'sqlite',
            'database': 'real_skud_data.db'
        }
        
        config['FILES'] = {
            'input_directory': 'real_data_input',
            'backup_directory': 'processed_real_skud',
            'file_extensions': '.txt',
            'encoding': 'windows-1251'
        }
        
        config['PARSING'] = {
            'field_separator': 'tab',
            'date_format': '%%d.%%m.%%Y %%H:%%M:%%S',
            'target_events': 'Доступ предоставлен'
        }
        
        config['MONITORING'] = {
            'enabled': 'false',
            'check_interval': '60'
        }
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            config.write(f)
    
    def initialize_database(self) -> bool:
        """Инициализация базы данных"""
        try:
            db_type = self.config.get('DATABASE', 'type', fallback='sqlite')
            
            if db_type == 'sqlite':
                db_config = {
                    'db_type': 'sqlite',
                    'database': self.config.get('DATABASE', 'database', fallback='real_skud_data.db')
                }
            else:
                self.logger.error(f"Пока поддерживается только SQLite")
                return False
            
            self.db_manager = SkudDatabaseManager(**db_config)
            
            if not self.db_manager.connect():
                self.logger.error("Не удалось подключиться к базе данных")
                return False
            
            if not self.db_manager.create_skud_schema():
                self.logger.error("Не удалось создать схему СКУД")
                return False
            
            self.logger.info(f"База данных {db_type} инициализирована успешно")
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка инициализации базы данных: {e}")
            return False
    
    def should_exclude_employee(self, employee_name: str) -> bool:
        """Проверяет, нужно ли исключить сотрудника из сохранения"""
        try:
            # Получаем список исключений из конфигурации
            excluded_list = self.config.get('FILTERING', 'exclude_employees', fallback='')
            
            if not excluded_list:
                return False
            
            # Разбираем список исключений
            excluded_employees = [name.strip() for name in excluded_list.split(',')]
            
            # Проверяем точное совпадение
            if employee_name in excluded_employees:
                self.logger.debug(f"Сотрудник '{employee_name}' исключен из сохранения")
                return True
            
            # Проверяем частичное совпадение для безопасности
            for excluded in excluded_employees:
                if excluded in employee_name or employee_name in excluded:
                    self.logger.debug(f"Сотрудник '{employee_name}' исключен (частичное совпадение с '{excluded}')")
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Ошибка проверки исключений для {employee_name}: {e}")
            return False
    
    def should_exclude_door_location(self, door_location: str) -> bool:
        """Проверяет, нужно ли исключить запись по местоположению двери"""
        try:
            # Получаем список исключений по местоположению из конфигурации
            excluded_locations = self.config.get('FILTERING', 'exclude_door_locations', fallback='')
            
            if not excluded_locations:
                return False
            
            # Разбираем список исключений
            excluded_list = [location.strip() for location in excluded_locations.split(',')]
            
            # Приводим к нижнему регистру для сравнения
            door_location_lower = door_location.lower()
            
            # Проверяем точное совпадение и частичное вхождение
            for excluded in excluded_list:
                excluded_lower = excluded.lower()
                if excluded_lower in door_location_lower or door_location_lower in excluded_lower:
                    self.logger.debug(f"Местоположение '{door_location}' исключено (совпадение с '{excluded}')")
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Ошибка проверки исключений для местоположения {door_location}: {e}")
            return False
    
    def process_real_file(self, file_path: str) -> bool:
        """Обработка файла реального формата СКУД"""
        try:
            self.logger.info(f"Обработка реального файла СКУД: {file_path}")
            
            filename = os.path.basename(file_path)
            encoding = self.config.get('FILES', 'encoding', fallback='windows-1251')
            
            # Читаем файл с автоопределением кодировки
            content = None
            encodings_to_try = [encoding, 'utf-8', 'windows-1251', 'cp1252', 'latin1']
            
            for enc in encodings_to_try:
                try:
                    with open(file_path, 'r', encoding=enc) as f:
                        content = f.read()
                        lines = content.splitlines()
                    self.logger.debug(f"Файл прочитан с кодировкой: {enc}")
                    encoding = enc  # Сохраняем успешную кодировку
                    break
                except UnicodeDecodeError:
                    continue
            
            if content is None:
                raise Exception("Не удалось прочитать файл ни с одной кодировкой")
            
            # Получаем информацию о файле
            file_size = len(content.encode(encoding))
            file_hash = hashlib.md5(content.encode(encoding)).hexdigest()
            line_count = len(lines)
            
            # Извлекаем дату из названия файла (формат: 2025.08.19.txt)
            file_date = None
            try:
                date_str = filename.replace('.txt', '')
                file_date = datetime.strptime(date_str, '%Y.%m.%d').date()
            except:
                self.logger.warning(f"Не удалось извлечь дату из имени файла: {filename}")
            
            # Парсим содержимое
            parser_config = create_real_skud_config()
            valid_records = []
            total_parsed = 0
            
            for line_number, line in enumerate(lines, 1):
                record = parse_real_skud_line(line, line_number, parser_config)
                if record:
                    total_parsed += 1
                    if record.is_valid:
                        valid_records.append(record)
            
            self.logger.info(f"Файл {filename}: распознано {total_parsed} записей, валидных {len(valid_records)}")
            
            # Сохраняем записи в базу данных
            success_count = 0
            excluded_count = 0
            
            for record in valid_records:
                # Проверяем, нужно ли исключить этого сотрудника
                if self.should_exclude_employee(record.employee_name):
                    excluded_count += 1
                    continue
                
                # Проверяем, нужно ли исключить по местоположению двери
                if self.should_exclude_door_location(record.door):
                    excluded_count += 1
                    continue
                
                success = self.db_manager.insert_access_log(
                    full_name=record.employee_name,
                    access_datetime=record.event_datetime,
                    access_type=record.access_type,
                    door_location=record.door,
                    card_number=None
                )
                if success:
                    success_count += 1
                
                # Обновляем информацию о сотруднике
                self.db_manager.insert_or_update_employee(
                    full_name=record.employee_name,
                    position=None,
                    card_number=None
                )
            
            if excluded_count > 0:
                self.logger.info(f"Файл {filename}: исключено {excluded_count} записей (охрана/посты/неразрешенные двери)")
            
            self.logger.info(f"Файл {filename}: успешно сохранено {success_count} из {len(valid_records) - excluded_count} записей")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Ошибка обработки файла {file_path}: {e}")
            return False
    
    def process_directory(self, directory_path: str) -> Dict[str, Any]:
        """Обработка всех файлов в директории"""
        results = {
            'processed_files': 0,
            'successful_files': 0,
            'failed_files': 0,
            'total_records': 0
        }
        
        try:
            if not os.path.exists(directory_path):
                self.logger.error(f"Директория не найдена: {directory_path}")
                return results
            
            # Получаем список txt файлов
            txt_files = []
            for filename in os.listdir(directory_path):
                if filename.lower().endswith('.txt'):
                    txt_files.append(os.path.join(directory_path, filename))
            
            self.logger.info(f"Найдено {len(txt_files)} файлов для обработки")
            
            for file_path in txt_files:
                results['processed_files'] += 1
                
                if self.process_real_file(file_path):
                    results['successful_files'] += 1
                else:
                    results['failed_files'] += 1
            
            return results
            
        except Exception as e:
            self.logger.error(f"Ошибка обработки директории {directory_path}: {e}")
            return results
    
    def show_statistics(self):
        """Показ статистики базы данных"""
        try:
            stats = self.db_manager.get_statistics()
            if stats:
                self.logger.info("=== Статистика реального СКУД ===")
                self.logger.info(f"Активных сотрудников: {stats.get('active_employees', 0)}")
                self.logger.info(f"Проходов сегодня: {stats.get('today_accesses', 0)}")
                self.logger.info(f"Уникальных сотрудников сегодня: {stats.get('today_unique_employees', 0)}")
                self.logger.info(f"Сводок за сегодня: {stats.get('today_summaries', 0)}")
                self.logger.info(f"Обеденных перерывов сегодня: {stats.get('today_lunch_breaks', 0)}")
                self.logger.info("=" * 35)
        except Exception as e:
            self.logger.error(f"Ошибка получения статистики: {e}")
    
    def run_batch_processing(self):
        """Запуск пакетной обработки"""
        self.logger.info("=== Запуск обработки реального формата СКУД ===")
        
        # Загружаем конфигурацию
        if not self.load_config():
            return False
        
        # Инициализируем компоненты
        if not self.initialize_database():
            return False
        
        # Показываем текущую статистику
        self.show_statistics()
        
        # Обрабатываем директорию
        input_dir = self.config.get('FILES', 'input_directory', fallback='real_data_input')
        
        if not os.path.exists(input_dir):
            self.logger.warning(f"Создаем директорию: {input_dir}")
            os.makedirs(input_dir)
        
        results = self.process_directory(input_dir)
        
        self.logger.info("=== Результаты обработки ===")
        self.logger.info(f"Обработано файлов: {results['processed_files']}")
        self.logger.info(f"Успешно: {results['successful_files']}")
        self.logger.info(f"С ошибками: {results['failed_files']}")
        
        # Показываем обновленную статистику
        self.show_statistics()
        
        # Закрываем подключение
        if self.db_manager:
            self.db_manager.disconnect()
        
        return True

def main():
    """Главная функция"""
    print("🏢 Real СКУД Data Loader - Обработка реальных данных СКУД")
    print("=" * 65)
    
    # Запускаем обработку
    loader = RealSkudDataLoader()
    success = loader.run_batch_processing()
    
    if success:
        print("\n🎉 Обработка завершена успешно!")
        print("\n📊 База данных: real_skud_data.db")
        print("\n📁 Обработанные файлы перемещены в: processed_real_skud")
    else:
        print("\n❌ Ошибка при обработке данных")
        sys.exit(1)

if __name__ == "__main__":
    main()