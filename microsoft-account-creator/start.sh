#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# Load .env if exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN environment variable is required"
  echo "Tip: create .env (see .env.example) or export TELEGRAM_BOT_TOKEN before running."
  exit 1
fi

echo "🤖 Starting Microsoft Account Creator Bot..."
echo "   Press Ctrl+C to stop"
echo ""

node telegram_bot.js
