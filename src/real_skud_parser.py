#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Модуль для парсинга реального формата СКУД
"""

import re
from datetime import datetime
from dataclasses import dataclass
from typing import Optional, Dict, Any
import configparser

@dataclass
class RealSkudRecord:
    """Запись реального формата СКУД"""
    timestamp: datetime
    full_name: str
    card_number: str
    door_location: str
    event_type: str
    direction: str

def parse_real_skud_line(line: str, line_number: int = 0, config: Dict[str, Any] = None) -> Optional[RealSkudRecord]:
    """
    Парсит строку реального формата СКУД
    
    Реальный формат: РМ\tВремя\tСобытие\tЗона\tДверь\tОписание\tАдрес\tЗона доступа\tХозорган\tКомментарий
    """
    try:
        # Убираем лишние пробелы и разделяем по табуляциям
        parts = [part.strip() for part in line.split('\t')]
        
        if len(parts) < 10:
            return None
            
        # Пропускаем заголовок
        if parts[0] == 'РМ' or parts[1] == 'Время':
            return None
            
        workstation = parts[0]  # РМ (рабочая машина)
        datetime_str = parts[1]  # Время
        event_type = parts[2]    # Событие
        zone = parts[3]          # Зона
        door = parts[4]          # Дверь
        description = parts[5]   # Описание
        address = parts[6]       # Адрес
        access_zone = parts[7]   # Зона доступа
        full_name = parts[8]     # Хозорган (ФИО сотрудника)
        comment = parts[9]       # Комментарий
        
        # Фильтруем только события доступа
        if event_type != 'Доступ предоставлен':
            return None
            
        # Если нет ФИО сотрудника, пропускаем
        if not full_name or full_name == '-':
            return None
            
        # ФИЛЬТРАЦИЯ: Проверяем конфигурацию для исключений
        if config:
            # Исключаем определенных сотрудников (охранники)
            exclude_employees = config.get('exclude_employees', [])
            if isinstance(exclude_employees, str):
                exclude_employees = [name.strip() for name in exclude_employees.split(',')]
            
            if full_name in exclude_employees:
                return None
                
            # Исключаем определенные двери/места
            exclude_doors = config.get('exclude_doors', [])
            if isinstance(exclude_doors, str):
                exclude_doors = [door_name.strip() for door_name in exclude_doors.split(',')]
                
            door_location = door if door and door != '-' else description
            for excluded_door in exclude_doors:
                if excluded_door in door_location or excluded_door in description:
                    return None
        
        # Парсим дату и время
        timestamp = datetime.strptime(datetime_str, "%d.%m.%Y %H:%M:%S")
        
        # Определяем направление из описания
        direction = "вход" if "Вход" in description else "выход" if "Выход" in description else "неизвестно"
        
        # Извлекаем номер карты из описания (если есть)
        card_number = ""
        if "[" in zone and "]" in zone:
            # Номер карты может быть в зоне
            card_match = re.search(r'\[(\d+)\]', zone)
            if card_match:
                card_number = card_match.group(1)
        
        # Определяем место прохода
        door_location = door if door and door != '-' else description
        
        return RealSkudRecord(
            timestamp=timestamp,
            full_name=full_name,
            card_number=card_number,
            door_location=door_location,
            event_type=event_type,
            direction=direction
        )
        
    except (ValueError, IndexError) as e:
        return None

def create_real_skud_config(config_file_path: str = None) -> Dict[str, Any]:
    """Создает конфигурацию для реального парсера СКУД"""
    config = {
        'field_separator': '\t',
        'date_format': '%d.%m.%Y %H:%M:%S',
        'target_events': ['Доступ предоставлен'],
        'encoding': 'utf-8',
        'exclude_employees': [],
        'exclude_doors': []
    }
    
    # Если указан файл конфигурации, загружаем настройки
    if config_file_path:
        try:
            file_config = load_config(config_file_path)
            if file_config.has_section('FILTERING'):
                if file_config.has_option('FILTERING', 'exclude_employees'):
                    config['exclude_employees'] = [name.strip() for name in 
                                                  file_config.get('FILTERING', 'exclude_employees').split(',')]
                if file_config.has_option('FILTERING', 'exclude_doors'):
                    config['exclude_doors'] = [door.strip() for door in 
                                              file_config.get('FILTERING', 'exclude_doors').split(',')]
            
            if file_config.has_section('SETTINGS'):
                if file_config.has_option('SETTINGS', 'encoding'):
                    config['encoding'] = file_config.get('SETTINGS', 'encoding')
                if file_config.has_option('SETTINGS', 'date_format'):
                    config['date_format'] = file_config.get('SETTINGS', 'date_format')
        except Exception as e:
            print(f"⚠️ Ошибка загрузки конфигурации: {e}")
            # Если ошибка загрузки PostgreSQL конфигурации, попробуем старую
            try:
                fallback_config = load_config("real_skud_config.ini")
                if fallback_config.has_section('FILTERING'):
                    if fallback_config.has_option('FILTERING', 'exclude_employees'):
                        config['exclude_employees'] = [name.strip() for name in 
                                                      fallback_config.get('FILTERING', 'exclude_employees').split(',')]
                    if fallback_config.has_option('FILTERING', 'exclude_doors'):
                        config['exclude_doors'] = [door.strip() for door in 
                                                  fallback_config.get('FILTERING', 'exclude_doors').split(',')]
                print("✅ Использована резервная конфигурация из real_skud_config.ini")
            except:
                print("⚠️ Не удалось загрузить резервную конфигурацию")
    
    return config

def load_config(config_path: str) -> configparser.ConfigParser:
    """Загружает конфигурацию из файла"""
    config = configparser.ConfigParser()
    try:
        # Пробуем разные кодировки
        for encoding in ['utf-8', 'windows-1251', 'cp1251']:
            try:
                config.read(config_path, encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
    except Exception as e:
        print(f"⚠️ Ошибка чтения конфигурации: {e}")
    return config