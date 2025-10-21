#!/bin/bash
# Оптимизация базы данных СКУД

cd "$(dirname "$0")"
source venv/bin/activate

echo "🔧 Оптимизация базы данных..."
python3 setup_production_sqlite.py
