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

print_status "Installing Chrome dependencies..."

if [ "$OS" = "debian" ]; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq \
    ca-certificates fonts-liberation libappindicator3-1 libasound2 \
    libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libgbm1 \
    libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 \
    libxrandr2 wget xvfb 2>/dev/null
  print_success "Chrome dependencies installed"
fi

print_status "Checking Node.js..."

if ! command -v node &> /dev/null; then
  print_warning "Node.js not found, installing..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  print_success "Node.js installed"
else
  print_success "Node.js $(node -v) already installed"
fi

print_status "Installing npm packages..."
npm install --silent
print_success "NPM packages installed"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                    STEP 2: CONFIGURATION                    ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Telegram Bot Token
echo -e "${YELLOW}📱 TELEGRAM BOT SETUP${NC}"
echo ""
read -p "   Enter Telegram Bot Token: " BOT_TOKEN
while [ -z "$BOT_TOKEN" ]; do
  print_error "Bot token cannot be empty!"
  read -p "   Enter Telegram Bot Token: " BOT_TOKEN
done

# Admin IDs
echo ""
read -p "   Enter Admin Telegram ID(s) [comma separated]: " ADMIN_IDS
while [ -z "$ADMIN_IDS" ]; do
  print_error "Admin ID cannot be empty!"
  read -p "   Enter Admin Telegram ID(s): " ADMIN_IDS
done

echo ""
echo -e "${YELLOW}🔐 2CAPTCHA SETUP${NC}"
echo ""
read -p "   Enter 2Captcha API Key [or press Enter to skip]: " CAPTCHA_KEY

echo ""
echo -e "${YELLOW}🌐 WEBSHARE.IO PROXY SETUP${NC}"
echo ""
read -p "   Enter Proxy (format: user:pass@host:port) [or press Enter to skip]: " PROXY_STRING

# Parse proxy string
if [ ! -z "$PROXY_STRING" ]; then
  # Extract username:password and host:port
  PROXY_AUTH=$(echo "$PROXY_STRING" | cut -d'@' -f1)
  PROXY_HOST=$(echo "$PROXY_STRING" | cut -d'@' -f2)
  
  PROXY_USER=$(echo "$PROXY_AUTH" | cut -d':' -f1)
  PROXY_PASS=$(echo "$PROXY_AUTH" | cut -d':' -f2)
  PROXY_IP=$(echo "$PROXY_HOST" | cut -d':' -f1)
  PROXY_PORT=$(echo "$PROXY_HOST" | cut -d':' -f2)
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                    STEP 3: SAVING CONFIG                    ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create .env file
print_status "Creating .env file..."
cat > $ENV_FILE << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=$BOT_TOKEN
ADMIN_IDS=$ADMIN_IDS

# 2Captcha Configuration
CAPTCHA_API_KEY=$CAPTCHA_KEY

# Webshare.io Proxy Configuration
PROXY_USERNAME=$PROXY_USER
PROXY_PASSWORD=$PROXY_PASS
PROXY_IP=$PROXY_IP
PROXY_PORT=$PROXY_PORT
EOF
print_success ".env file created"

# Update config.js with values
print_status "Updating config.js..."
if [ ! -z "$CAPTCHA_KEY" ]; then
  sed -i "s/CAPTCHA_API_KEY: ''/CAPTCHA_API_KEY: '$CAPTCHA_KEY'/" $CONFIG_FILE
fi

if [ ! -z "$PROXY_USER" ]; then
  sed -i "s/PROXY_USERNAME: ''/PROXY_USERNAME: '$PROXY_USER'/" $CONFIG_FILE
  sed -i "s/PROXY_PASSWORD: ''/PROXY_PASSWORD: '$PROXY_PASS'/" $CONFIG_FILE
  sed -i "s/PROXY_IP: 'proxy.webshare.io'/PROXY_IP: '$PROXY_IP'/" $CONFIG_FILE
  sed -i "s/PROXY_PORT: '80'/PROXY_PORT: '$PROXY_PORT'/" $CONFIG_FILE
fi
print_success "config.js updated"

# Create necessary files
touch accounts.txt
touch proxies.txt
chmod +x telegram_bot.js src/index.js

# Create start script
print_status "Creating start script..."
cat > start.sh << 'EOF'
#!/bin/bash
source .env
export TELEGRAM_BOT_TOKEN
export ADMIN_IDS
echo "Starting Microsoft Account Creator Bot..."
npm run bot
EOF
chmod +x start.sh
print_success "start.sh created"

# Create systemd service file
print_status "Creating systemd service..."
CURRENT_DIR=$(pwd)
cat > msac-bot.service << EOF
[Unit]
Description=Microsoft Account Creator Telegram Bot
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
EnvironmentFile=$CURRENT_DIR/.env
ExecStart=/usr/bin/npm run bot
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
print_success "msac-bot.service created"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                    ✅ INSTALLATION COMPLETE                 ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Configuration Summary:${NC}"
echo -e "   Bot Token:  ${YELLOW}${BOT_TOKEN:0:10}...${NC}"
echo -e "   Admin IDs:  ${YELLOW}$ADMIN_IDS${NC}"
if [ ! -z "$CAPTCHA_KEY" ]; then
  echo -e "   2Captcha:   ${GREEN}Configured${NC}"
else
  echo -e "   2Captcha:   ${YELLOW}Not set (use /setapikey in bot)${NC}"
fi
if [ ! -z "$PROXY_USER" ]; then
  echo -e "   Proxy:      ${GREEN}$PROXY_IP:$PROXY_PORT${NC}"
else
  echo -e "   Proxy:      ${YELLOW}Not set (use /setproxy in bot)${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                       HOW TO RUN                            ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Option 1: Quick Start${NC}"
echo -e "   ${GREEN}./start.sh${NC}"
echo ""
echo -e "${YELLOW}Option 2: Run as Service (auto-restart)${NC}"
echo -e "   ${GREEN}sudo cp msac-bot.service /etc/systemd/system/${NC}"
echo -e "   ${GREEN}sudo systemctl daemon-reload${NC}"
echo -e "   ${GREEN}sudo systemctl enable msac-bot${NC}"
echo -e "   ${GREEN}sudo systemctl start msac-bot${NC}"
echo ""
echo -e "${YELLOW}Option 3: Manual Run${NC}"
echo -e "   ${GREEN}source .env && npm run bot${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "🎉 ${GREEN}Ready! Just run ${YELLOW}./start.sh${GREEN} to begin!${NC}"
echo ""
