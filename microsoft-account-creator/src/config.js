module.exports = {
  // Account Creation Settings
  ADD_RECOVERY_EMAIL: true,
  EMAIL_DOMAIN: '@outlook.com', // @outlook.com or @hotmail.com
  
  // 2Captcha Settings (your subscription)
  CAPTCHA_PROVIDER: 'twocaptcha',
  CAPTCHA_API_KEY: '', // Your 2Captcha API key
  FUNCAPTCHA_SITE_KEY: 'B7D8911C-5CC8-A9A3-35B0-554ACEE604DA',
  
  // Webshare.io Proxy Settings (your subscription)
  // Authentication: IP Authentication (no username/password needed)
  // Connection: Direct Connection (use individual proxy IPs)
  USE_PROXY: true,
  PROXY_TYPE: 'http',
  PROXY_AUTH_METHOD: 'ip', // 'ip' for IP Authentication, 'userpass' for Username/Password
  
  // For IP Authentication - just use IP:PORT from your proxy list
  PROXY_LIST: [
    // Add your proxies here from Webshare proxy list
    // Example: '67.227.42.218:6195'
  ],
  
  // File Paths
  NAMES_FILE: 'src/Utils/names.txt',
  WORDS_FILE: 'src/Utils/words5char.txt',
  ACCOUNTS_FILE: 'accounts.txt',
  PROXY_FILE: 'proxies.txt',
  
  // Browser Settings
  HEADLESS: false,
  BROWSER_TIMEOUT: 3600000,
  
  // Generation Settings
  PASSWORD_LENGTH: 12,
  MAX_RETRIES: 3,
};
