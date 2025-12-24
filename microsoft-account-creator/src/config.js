module.exports = {
  // Account Creation Settings
  ADD_RECOVERY_EMAIL: true,
  EMAIL_DOMAIN: '@outlook.com', // @outlook.com or @hotmail.com
  
  // 2Captcha Settings (your subscription)
  CAPTCHA_PROVIDER: 'twocaptcha',
  CAPTCHA_API_KEY: '', // Your 2Captcha API key
  FUNCAPTCHA_SITE_KEY: 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA',
  
  // Webshare.io Proxy Settings
  // Authentication: IP Authentication (whitelist your server IP in Webshare dashboard)
  // Connection: Rotating Proxy Endpoint (auto-rotates IP each request)
  USE_PROXY: true,
  PROXY_TYPE: 'http',
  
  // Rotating Proxy Endpoint from Webshare
  // Go to Proxy Settings > Get rotating endpoint
  // Format: p.webshare.io:80 (or proxy.webshare.io:80)
  ROTATING_PROXY: 'p.webshare.io:80',
  
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
