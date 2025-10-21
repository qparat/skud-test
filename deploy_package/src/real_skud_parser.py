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
    
    Формат: дата\tвремя\tфио\tномер_карты\tместо\tсобытие\tнаправление
    """
    try:
        # Убираем лишние пробелы и разделяем по табуляциям
        parts = [part.strip() for part in line.split('\t')]
        
        if len(parts) < 7:
            return None
            
        date_str = parts[0]
        time_str = parts[1]
        full_name = parts[2]
        card_number = parts[3]
        door_location = parts[4]
        event_type = parts[5]
        direction = parts[6]
        
        # Парсим дату и время
        datetime_str = f"{date_str} {time_str}"
        timestamp = datetime.strptime(datetime_str, "%d.%m.%Y %H:%M:%S")
        
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

def create_real_skud_config() -> Dict[str, Any]:
    """Создает конфигурацию для реального парсера СКУД"""
    return {
        'field_separator': '\t',
        'date_format': '%d.%m.%Y %H:%M:%S',
        'target_events': ['Доступ предоставлен'],
        'encoding': 'utf-8'
    }

def load_config(config_path: str) -> configparser.ConfigParser:
    """Загружает конфигурацию из файла"""
    config = configparser.ConfigParser()
    config.read(config_path, encoding='utf-8')
    return config