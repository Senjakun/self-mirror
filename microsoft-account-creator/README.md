# Microsoft Account Creator

🔐 Auto Microsoft/Outlook account generator dengan **2Captcha** dan **Webshare.io** proxy support.

## ✨ Features

- 🤖 **2Captcha Integration** - Auto solve FunCaptcha
- 🌐 **Webshare.io Proxy** - Rotating proxy support
- 🎭 **Anti-Detection** - Browser fingerprinting
- 📧 **Recovery Email** - Auto add recovery
- 📱 **Telegram Bot** - Remote control

## 🚀 Quick Start

```bash
# Install
cd microsoft-account-creator
chmod +x install.sh && ./install.sh

# Set 2Captcha key
# Edit src/config.js: CAPTCHA_API_KEY: 'your-key'

# Run with Telegram
export TELEGRAM_BOT_TOKEN='your-token'
export ADMIN_IDS='your-id'
npm run bot
```

## 📱 Telegram Commands

| Command | Description |
|---------|-------------|
| `/start` | Main menu |
| `/setapikey KEY` | Set 2Captcha API key |
| `/setproxy user:pass@ip:port` | Set Webshare proxy |
| `/balance` | Check 2Captcha balance |

## 🌐 Webshare.io Proxy Format

```
# Standard
/setproxy username:password@proxy.webshare.io:80

# With country targeting
/setproxy user-country-us:pass@proxy.webshare.io:80
```

## 📁 Config

Edit `src/config.js`:

```javascript
module.exports = {
  CAPTCHA_PROVIDER: 'twocaptcha',
  CAPTCHA_API_KEY: 'your-2captcha-key',
  
  USE_PROXY: true,
  PROXY_IP: 'proxy.webshare.io',
  PROXY_PORT: '80',
  PROXY_USERNAME: 'your-webshare-user',
  PROXY_PASSWORD: 'your-webshare-pass',
  
  ADD_RECOVERY_EMAIL: true,
  EMAIL_DOMAIN: '@outlook.com',
};
```

## 💰 Pricing

- **2Captcha**: ~$2.99/1000 solves
- **Webshare.io**: Starting $5.49/mo for 10 proxies

## ⚠️ Disclaimer

Educational purposes only. Use responsibly.
