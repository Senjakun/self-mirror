#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

if [ -f bot.pid ]; then
  PID=$(cat bot.pid)
  if ps -p "$PID" >/dev/null 2>&1; then
    kill "$PID"
    rm -f bot.pid
    echo "✅ Bot stopped"
    exit 0
  fi
  rm -f bot.pid
fi

pkill -f "node telegram_bot.js" >/dev/null 2>&1 && echo "✅ Bot stopped" || echo "⚠️ Bot not running"
