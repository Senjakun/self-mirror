module.exports = {
  // Account Creation Settings
  ADD_RECOVERY_EMAIL: true,
  EMAIL_DOMAIN: '@outlook.com', // @outlook.com or @hotmail.com
  
  // CAPTCHA Solver Settings
  CAPTCHA_PROVIDER: 'twocaptcha', // 'twocaptcha', 'anycaptcha', or 'manual'
  CAPTCHA_API_KEY: '', // Your API key from captcha provider
  FUNCAPTCHA_SITE_KEY: 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA', // Microsoft FunCaptcha site key
  
  // Proxy Settings
  USE_PROXY: false,
  PROXY_TYPE: 'http', // 'http' or 'socks5'
  PROXY_IP: '',
  PROXY_PORT: '',
  PROXY_USERNAME: '',
  PROXY_PASSWORD: '',
  
  // File Paths
  NAMES_FILE: 'src/Utils/names.txt',
  WORDS_FILE: 'src/Utils/words5char.txt',
  ACCOUNTS_FILE: 'accounts.txt',
  PROXY_FILE: 'proxies.txt',
  
  // Browser Settings
  HEADLESS: false, // Set to true for headless mode (not recommended for captcha)
  BROWSER_TIMEOUT: 3600000, // 1 hour timeout
  
  // Generation Settings
  PASSWORD_LENGTH: 12,
  MAX_RETRIES: 3,
};
