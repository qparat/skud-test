#!/bin/bash
# Запуск мониторинга СКУД

cd "$(dirname "$0")"
source venv/bin/activate

case "$1" in
    "basic")
        echo "📊 Запуск базового мониторинга..."
        python3 skud_monitor.py
        ;;
    "interactive")
        echo "🔍 Запуск интерактивного мониторинга..."
        python3 interactive_monitor.py
        ;;
    "realtime")
        echo "⏱️ Запуск мониторинга в реальном времени..."
        python3 minute_monitor.py
        ;;
    *)
        echo "Использование: $0 {basic|interactive|realtime}"
        echo ""
        echo "Доступные режимы:"
        echo "  basic       - Базовый мониторинг"
        echo "  interactive - Интерактивный анализ"
        echo "  realtime    - Мониторинг в реальном времени"
        exit 1
        ;;
esac
