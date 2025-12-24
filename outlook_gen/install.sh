#!/bin/bash
# Install script for OutlookGen + Telegram Bot

set -e

echo "🚀 Installing OutlookGen + Telegram Bot..."

# Update system
apt update

# Install Chrome/Chromium
echo "📦 Installing Chromium..."
apt install -y chromium-chromedriver chromium-browser || apt install -y chromium-chromedriver

# Install Python dependencies
echo "📦 Installing Python packages..."
pip3 install -r requirements.txt

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit config.json - set your captcha API key and provider"
echo "2. Add proxies to proxy.txt"
echo "3. Set environment variables:"
echo "   export TELEGRAM_BOT_TOKEN='your_bot_token'"
echo "   export ADMIN_IDS='your_telegram_id'"
echo ""
echo "4. Run the bot:"
echo "   python3 telegram_bot.py"
echo ""
echo "Or run manually:"
echo "   python3 main.py"
