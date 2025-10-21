#!/bin/bash
# Запуск основной системы СКУД

cd "$(dirname "$0")"
source venv/bin/activate

echo "🚀 Запуск системы СКУД..."
python3 main_real_skud.py
