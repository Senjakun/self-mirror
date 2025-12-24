#!/bin/bash

clear
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🚀 Microsoft Account Creator - Auto Installer         ║"
echo "║         2Captcha + Webshare.io + Telegram Bot             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Config file path
CONFIG_FILE="src/config.js"
ENV_FILE=".env"

# Function to print colored text
print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Detect OS
if [ -f /etc/debian_version ]; then
  OS="debian"
elif [ -f /etc/redhat-release ]; then
  OS="redhat"
else
  OS="unknown"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                    STEP 1: DEPENDENCIES                     ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_status "Installing Chrome/Puppeteer dependencies..."

if [ "$OS" = "debian" ]; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq \
    ca-certificates fonts-liberation libasound2 \
    libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libgbm1 \
    libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 \
    libxrandr2 wget xvfb libxss1 libxtst6 2>/dev/null
  print_success "Chrome dependencies installed"
elif [ "$OS" = "redhat" ]; then
  sudo yum install -y -q \
    alsa-lib atk cups-libs gtk3 libXcomposite libXdamage \
    libXrandr libgbm libxshmfence nss pango 2>/dev/null
  print_success "Chrome dependencies installed"
else
  print_warning "Unknown OS - skipping system dependencies"
fi

print_status "Checking Node.js..."

if ! command -v node &> /dev/null; then
  print_warning "Node.js not found, installing..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  print_success "Node.js installed"
else
  NODE_VERSION=$(node -v)
  print_success "Node.js $NODE_VERSION already installed"
fi

print_status "Installing npm packages (this may take 2-5 minutes)..."
echo ""

# Clean install
rm -rf node_modules package-lock.json 2>/dev/null

# Install with progress
npm install 2>&1 | tail -5

if [ $? -eq 0 ]; then
  print_success "NPM packages installed successfully!"
else
  print_error "NPM install failed. Retrying..."
  npm install
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                    STEP 2: CONFIGURATION                    ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if config already exists
SKIP_CONFIG=false
if [ -f "$ENV_FILE" ]; then
  echo -e "${GREEN}✓ Existing configuration found!${NC}"
  echo ""
  cat $ENV_FILE | head -2
  echo ""
  read -p "   Keep existing config? [Y/n]: " KEEP_CONFIG
  if [ -z "$KEEP_CONFIG" ] || [ "$KEEP_CONFIG" = "Y" ] || [ "$KEEP_CONFIG" = "y" ]; then
    SKIP_CONFIG=true
    print_success "Keeping existing configuration"
    
    # Load existing values
    source $ENV_FILE
    BOT_TOKEN=$TELEGRAM_BOT_TOKEN
    
    # Get existing proxy from config.js
    ROTATING_PROXY=$(grep "ROTATING_PROXY:" $CONFIG_FILE 2>/dev/null | cut -d"'" -f2)
    CAPTCHA_KEY=$(grep "CAPTCHA_API_KEY:" $CONFIG_FILE 2>/dev/null | cut -d"'" -f2)
  fi
fi

if [ "$SKIP_CONFIG" = false ]; then
  # Telegram Bot Token
  echo -e "${YELLOW}📱 TELEGRAM BOT SETUP${NC}"
  echo -e "   Get token from @BotFather on Telegram"
  echo ""
  read -p "   Enter Telegram Bot Token: " BOT_TOKEN
  while [ -z "$BOT_TOKEN" ]; do
    print_error "Bot token cannot be empty!"
    read -p "   Enter Telegram Bot Token: " BOT_TOKEN
  done

  # Admin IDs
  echo ""
  echo -e "   Get your ID from @userinfobot on Telegram"
  read -p "   Enter Admin Telegram ID(s) [comma separated]: " ADMIN_IDS
  while [ -z "$ADMIN_IDS" ]; do
    print_error "Admin ID cannot be empty!"
    read -p "   Enter Admin Telegram ID(s): " ADMIN_IDS
  done

  echo ""
  echo -e "${YELLOW}🔐 2CAPTCHA SETUP${NC}"
  echo -e "   Get API key from https://2captcha.com"
  echo ""
  read -p "   Enter 2Captcha API Key [or press Enter to skip]: " CAPTCHA_KEY

  echo ""
  echo -e "${YELLOW}🌐 WEBSHARE.IO PROXY SETUP${NC}"
  echo -e "   Steps in Webshare Dashboard:"
  echo -e "   1. Go to ${CYAN}Proxy Settings${NC}"
  echo -e "   2. Set Authentication: ${GREEN}IP Authentication${NC}"
  echo -e "   3. Add your server IP to whitelist (run: curl ifconfig.me)"
  echo -e "   4. Set Connection: ${GREEN}Rotating Proxy Endpoint${NC}"
  echo -e "   5. Copy the rotating endpoint"
  echo ""
  read -p "   Enter Rotating Proxy Endpoint [default: p.webshare.io:80]: " ROTATING_PROXY
  if [ -z "$ROTATING_PROXY" ]; then
    ROTATING_PROXY="p.webshare.io:80"
  fi
  echo -e "   ${GREEN}✓ Using: $ROTATING_PROXY${NC}"

  # Create .env file
  print_status "Creating .env file..."
  cat > $ENV_FILE << EOF
TELEGRAM_BOT_TOKEN=$BOT_TOKEN
ADMIN_IDS=$ADMIN_IDS
EOF
  print_success ".env file created"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                    STEP 3: SAVING CONFIG                    ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Update config.js with values
print_status "Updating config.js..."

# Create updated config.js
cat > $CONFIG_FILE << CONFIGEOF
module.exports = {
  // Account Creation Settings
  ADD_RECOVERY_EMAIL: true,
  EMAIL_DOMAIN: '@outlook.com',
  
  // 2Captcha Settings
  CAPTCHA_PROVIDER: 'twocaptcha',
  CAPTCHA_API_KEY: '$CAPTCHA_KEY',
  FUNCAPTCHA_SITE_KEY: 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA',
  
  // Webshare.io Rotating Proxy (IP Authentication)
  USE_PROXY: true,
  PROXY_TYPE: 'http',
  ROTATING_PROXY: '$ROTATING_PROXY',
  
  // File Paths
  NAMES_FILE: 'src/Utils/names.txt',
  WORDS_FILE: 'src/Utils/words5char.txt',
  ACCOUNTS_FILE: 'accounts.txt',
  
  // Browser Settings
  HEADLESS: false,
  BROWSER_TIMEOUT: 3600000,
  
  // Generation Settings
  PASSWORD_LENGTH: 12,
  MAX_RETRIES: 3,
};
CONFIGEOF
print_success "config.js updated"

# Create necessary files
touch accounts.txt 2>/dev/null

# Create start script
print_status "Creating start.sh..."
cat > start.sh << 'STARTEOF'
#!/bin/bash
cd "$(dirname "$0")"

# Load .env
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

echo "🤖 Starting Microsoft Account Creator Bot..."
echo "   Press Ctrl+C to stop"
echo ""

node telegram_bot.js
STARTEOF
chmod +x start.sh
print_success "start.sh created"

# Create background start script
print_status "Creating start-bg.sh (background mode)..."
cat > start-bg.sh << 'BGEOF'
#!/bin/bash
cd "$(dirname "$0")"

# Load .env
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

echo "🤖 Starting bot in background..."
nohup node telegram_bot.js > bot.log 2>&1 &
echo $! > bot.pid
echo "✅ Bot started! PID: $(cat bot.pid)"
echo "   View logs: tail -f bot.log"
echo "   Stop bot:  ./stop.sh"
BGEOF
chmod +x start-bg.sh
print_success "start-bg.sh created"

# Create stop script
print_status "Creating stop.sh..."
cat > stop.sh << 'STOPEOF'
#!/bin/bash
cd "$(dirname "$0")"

if [ -f bot.pid ]; then
  PID=$(cat bot.pid)
  if ps -p $PID > /dev/null 2>&1; then
    kill $PID
    rm bot.pid
    echo "✅ Bot stopped"
  else
    echo "⚠️ Bot not running (stale PID file)"
    rm bot.pid
  fi
else
  # Try to find and kill node process
  pkill -f "node telegram_bot.js" 2>/dev/null && echo "✅ Bot stopped" || echo "⚠️ Bot not running"
fi
STOPEOF
chmod +x stop.sh
print_success "stop.sh created"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                    ✅ INSTALLATION COMPLETE                 ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Configuration:${NC}"
echo -e "   Bot Token:  ${YELLOW}${BOT_TOKEN:0:15}...${NC}"
echo -e "   Admin IDs:  ${YELLOW}$ADMIN_IDS${NC}"
if [ ! -z "$CAPTCHA_KEY" ]; then
  echo -e "   2Captcha:   ${GREEN}✓ Configured${NC}"
else
  echo -e "   2Captcha:   ${YELLOW}Not set (use /setapikey in bot)${NC}"
fi
echo -e "   Proxy:      ${GREEN}✓ $ROTATING_PROXY (Rotating)${NC}"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                         HOW TO RUN                          ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "   ${YELLOW}./start.sh${NC}      - Run in foreground (see logs)"
echo -e "   ${YELLOW}./start-bg.sh${NC}   - Run in background"
echo -e "   ${YELLOW}./stop.sh${NC}       - Stop the bot"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "🎉 ${GREEN}Ready! Run ${YELLOW}./start.sh${GREEN} to start the bot!${NC}"
echo ""
