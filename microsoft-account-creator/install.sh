#!/bin/bash

echo "========================================="
echo "  Microsoft Account Creator Installer"
echo "  2Captcha + Webshare.io Support"
echo "========================================="

# Detect OS
if [ -f /etc/debian_version ]; then
  OS="debian"
elif [ -f /etc/redhat-release ]; then
  OS="redhat"
else
  OS="unknown"
fi

echo ""
echo "[1/4] Installing Chrome dependencies..."

if [ "$OS" = "debian" ]; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq \
    ca-certificates fonts-liberation libappindicator3-1 libasound2 \
    libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libgbm1 \
    libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 \
    libxrandr2 wget xvfb 2>/dev/null
fi

echo ""
echo "[2/4] Checking Node.js..."

if ! command -v node &> /dev/null; then
  echo "Installing Node.js 18..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "Node.js $(node -v) OK"
fi

echo ""
echo "[3/4] Installing npm packages..."
npm install

echo ""
echo "[4/4] Creating files..."
touch accounts.txt
touch proxies.txt
chmod +x telegram_bot.js src/index.js

echo ""
echo "========================================="
echo "         ✅ Installation Complete!"
echo "========================================="
echo ""
echo "📌 Setup:"
echo ""
echo "1. Set 2Captcha API Key:"
echo "   Edit src/config.js OR use bot command /setapikey"
echo ""
echo "2. Set Webshare.io Proxy:"
echo "   /setproxy username:password@proxy.webshare.io:80"
echo ""
echo "3. Run with Telegram Bot:"
echo "   export TELEGRAM_BOT_TOKEN='your-token'"
echo "   export ADMIN_IDS='your-telegram-id'"
echo "   npm run bot"
echo ""
echo "4. Or run directly:"
echo "   npm start        # 1 account"
echo "   node src/index.js 10  # 10 accounts"
echo ""
echo "========================================="
