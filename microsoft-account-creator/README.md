# Microsoft/Outlook Account Creator + Telegram Bot

Create Microsoft/Outlook accounts with browser fingerprint protection and Telegram bot control.

**Based on:** [silvestrodecaro/microsoft-account-creator](https://github.com/silvestrodecaro/microsoft-account-creator)

## ✨ Features

- Browser fingerprint protection (puppeteer-with-fingerprints)
- Automatic Italian names/surnames generation
- Strong password generation
- Recovery email auto-setup (via SMAIL PRO)
- Proxy support
- **Telegram bot control**

## ⚠️ Important Notes

- **CAPTCHA must be solved manually** - the browser will open and you need to solve it
- First run downloads a browser (~500MB) - takes a few minutes
- Works best on Windows (resolution check), but also runs on Linux

## 🚀 Quick Install (VPS)

```bash
# Clone repo
git clone YOUR_REPO_URL microsoft-account-creator
cd microsoft-account-creator

# Install dependencies
npm install

# Set up Telegram bot
export TELEGRAM_BOT_TOKEN="your_bot_token"
export ADMIN_IDS="your_telegram_id"  # Optional

# Run Telegram bot
npm run bot
```

## 📱 Telegram Bot Commands

- `/start` - Main menu with buttons
- `/setproxy ip:port:user:pass` - Set proxy
- `/toggleproxy` - Enable/disable proxy
- `/togglerecovery` - Enable/disable recovery email
- `/download` - Download accounts file
- `/help` - Show help

## 🔧 Manual Run (without Telegram)

```bash
npm start
# or
node src/index.js
```

## ⚙️ Configuration

Edit `src/config.js`:

```javascript
module.exports = {
  ADD_RECOVERY_EMAIL: true,  // Add recovery email
  USE_PROXY: false,          // Use proxy
  PROXY_USERNAME: 'username',
  PROXY_PASSWORD: 'password',
  PROXY_IP: 'ip',
  PROXY_PORT: 'port',
  NAMES_FILE: 'src/Utils/names.txt',
  WORDS_FILE: 'src/Utils/words5char.txt',
  ACCOUNTS_FILE: 'accounts.txt',
};
```

## 📋 Requirements

- Node.js 16+
- Google Chrome (latest)
- Display server (for headful browser)

## 🐧 Linux VPS Setup

For headless VPS, you need a virtual display:

```bash
# Install Xvfb
apt install xvfb

# Run with virtual display
xvfb-run --auto-servernum node telegram_bot.js
```

## 📝 License

MIT License - Based on work by [silvestrodecaro](https://github.com/silvestrodecaro)
