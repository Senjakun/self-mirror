#!/bin/bash
# Install script for Microsoft Account Creator + Telegram Bot

set -e

echo "🚀 Installing Microsoft Account Creator..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "📦 Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing npm packages..."
npm install

# Install Chrome dependencies (Linux)
if [ -f /etc/debian_version ]; then
    echo "📦 Installing Chrome dependencies..."
    sudo apt-get update
    sudo apt-get install -y \
        libnss3 \
        libatk-bridge2.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libgbm1 \
        libasound2 \
        libxshmfence1 \
        xvfb || true
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Get your Telegram bot token from @BotFather"
echo ""
echo "2. Set environment variables:"
echo "   export TELEGRAM_BOT_TOKEN='your_bot_token'"
echo "   export ADMIN_IDS='your_telegram_id'"
echo ""
echo "3. Run the bot:"
echo "   npm run bot"
echo ""
echo "   Or with virtual display (headless VPS):"
echo "   xvfb-run --auto-servernum npm run bot"
echo ""
echo "4. Open Telegram and send /start to your bot"
