#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# Load .env if exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "🤖 Starting bot in background..."
nohup node telegram_bot.js > bot.log 2>&1 &
echo $! > bot.pid

echo "✅ Bot started! PID: $(cat bot.pid)"
echo "   View logs: tail -f bot.log"
echo "   Stop bot:  ./stop.sh"
