const { plugin, applyProxyAuth } = require('./browserProvider');
const fs = require("fs");
const path = require("path");
const config = require('./config');
const log = require('./Utils/log');
const recMail = require('./Utils/recMail');
const { createCaptchaSolver } = require('./captchaSolver');

// Statistics
let stats = {
  generated: 0,
  failed: 0,
  captchaSolved: 0
};

// Proxy rotation index
let currentProxyIndex = 0;

// Captcha solver instance
let captchaSolver = null;

function getNextProxy() {
  if (!config.USE_PROXY || !config.PROXY_LIST || config.PROXY_LIST.length === 0) {
    return null;
  }
  const proxy = config.PROXY_LIST[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % config.PROXY_LIST.length;
  return proxy;
}

async function initCaptchaSolver() {
  captchaSolver = createCaptchaSolver(config.CAPTCHA_PROVIDER, config.CAPTCHA_API_KEY);
  
  if (config.CAPTCHA_PROVIDER !== 'manual') {
    try {
      const balance = await captchaSolver.getBalance();
      log(`Captcha provider: ${config.CAPTCHA_PROVIDER}`, 'green');
      log(`Balance: $${balance}`, 'green');
    } catch (e) {
      log(`Warning: Could not check captcha balance: ${e.message}`, 'yellow');
    }
  } else {
    log('Using manual captcha solving mode', 'yellow');
  }
}

async function start(count = 1) {
  console.clear();
  log("=== Microsoft Account Creator (Hybrid) ===", "green");
  log(`Provider: ${config.CAPTCHA_PROVIDER} | Target: ${count} accounts`, "green");
  
  await initCaptchaSolver();
  
  for (let i = 0; i < count; i++) {
    log(`\n--- Creating account ${i + 1}/${count} ---`, "cyan");
    
    try {
      await createSingleAccount();
      stats.generated++;
      log(`Account ${i + 1} created successfully!`, "green");
    } catch (e) {
      stats.failed++;
      log(`Account ${i + 1} failed: ${e.message}`, "red");
    }
    
    // Wait between accounts to avoid detection
    if (i < count - 1) {
      const waitTime = 5000 + Math.random() * 10000;
      log(`Waiting ${Math.round(waitTime/1000)}s before next account...`, "yellow");
      await delay(waitTime);
    }
  }
  
  log(`\n=== Finished ===`, "green");
  log(`Generated: ${stats.generated} | Failed: ${stats.failed} | Captchas: ${stats.captchaSolved}`, "green");
  
  return stats;
}

async function createSingleAccount() {
  log("Fetching Fingerprint...", "yellow");
  plugin.setServiceKey('');
  const fingerprint = await plugin.fetch({
    tags: ['Microsoft Windows', 'Chrome'],
  });

  log("Applying Fingerprint...", "yellow");
  plugin.useFingerprint(fingerprint);

  const proxy = getNextProxy();
  if (proxy) {
    log(`Using proxy: ${proxy}`, "green");
    plugin.useProxy(proxy, {
      detectExternalIP: true,
      changeGeolocation: true,
      changeBrowserLanguage: true,
      changeTimezone: true,
      changeWebRTC: true,
    });
  }

  log("Launching browser...", "green");
  const browser = await plugin.launch({
    headless: config.HEADLESS
  });
  
  try {
    const page = await browser.newPage();
    await applyProxyAuth(page);
    await page.setDefaultTimeout(config.BROWSER_TIMEOUT);

    const viewport = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    }));
    log(`Viewport: [${viewport.width}x${viewport.height}]`, "green");

    await createAccount(page);
    await page.close();
  } finally {
    await browser.close();
  }
}

async function createAccount(page) {
  // Going to Outlook register page
  await page.goto("https://outlook.live.com/owa/?nlp=1&signup=1");
  await page.waitForSelector(SELECTORS.USERNAME_INPUT);

  // Generate Random Personal Info
  const PersonalInfo = await generatePersonalInfo();

  // Select domain if hotmail
  if (config.EMAIL_DOMAIN === '@hotmail.com') {
    try {
      await page.waitForSelector('#LiveDomainBoxList', { timeout: 5000 });
      await page.select('#LiveDomainBoxList', 'hotmail.com');
    } catch (e) {
      log('Could not change domain, using default', 'yellow');
    }
  }

  // Username
  await page.type(SELECTORS.USERNAME_INPUT, PersonalInfo.username);
  await page.keyboard.press("Enter");

  // Password
  const password = await generatePassword();
  await page.waitForSelector(SELECTORS.PASSWORD_INPUT);
  await page.type(SELECTORS.PASSWORD_INPUT, password);
  await page.keyboard.press("Enter");

  // First Name and Last Name
  await page.waitForSelector(SELECTORS.FIRST_NAME_INPUT);
  await page.type(SELECTORS.FIRST_NAME_INPUT, PersonalInfo.randomFirstName);
  await page.type(SELECTORS.LAST_NAME_INPUT, PersonalInfo.randomLastName);
  await page.keyboard.press("Enter");

  // Birth Date
  await page.waitForSelector(SELECTORS.BIRTH_DAY_INPUT);
  await delay(1000);
  await page.select(SELECTORS.BIRTH_DAY_INPUT, PersonalInfo.birthDay);
  await page.select(SELECTORS.BIRTH_MONTH_INPUT, PersonalInfo.birthMonth);
  await page.type(SELECTORS.BIRTH_YEAR_INPUT, PersonalInfo.birthYear);
  await page.keyboard.press("Enter");
  
  const email = await page.$eval(SELECTORS.EMAIL_DISPLAY, el => el.textContent);
  log(`Email: ${email}`, 'cyan');

  // Wait for captcha
  await page.waitForSelector(SELECTORS.FUNCAPTCHA, { timeout: 60000 });
  
  // Solve captcha based on provider
  if (config.CAPTCHA_PROVIDER === 'manual') {
    log("Please solve the captcha manually...", "yellow");
    await page.waitForFunction(
      (selector) => !document.querySelector(selector),
      { timeout: 600000 }, // 10 minutes for manual
      SELECTORS.FUNCAPTCHA
    );
  } else {
    // Auto solve with 2captcha or anycaptcha
    const siteUrl = page.url();
    try {
      const token = await captchaSolver.solveFunCaptcha(siteUrl, config.FUNCAPTCHA_SITE_KEY);
      stats.captchaSolved++;
      
      // Inject the captcha token
      await page.evaluate((token) => {
        // Find and set the captcha response
        const fcCallback = window.fc && window.fc.callback;
        if (fcCallback) {
          fcCallback(token);
        } else {
          // Alternative: Try to find the verification callback
          const verificationFrame = document.querySelector('#enforcementFrame');
          if (verificationFrame && verificationFrame.contentWindow) {
            verificationFrame.contentWindow.postMessage({ token: token }, '*');
          }
        }
      }, token);
      
      // Wait for captcha frame to disappear
      await page.waitForFunction(
        (selector) => !document.querySelector(selector),
        { timeout: 30000 },
        SELECTORS.FUNCAPTCHA
      );
    } catch (e) {
      log(`Auto captcha failed: ${e.message}, please solve manually`, 'red');
      await page.waitForFunction(
        (selector) => !document.querySelector(selector),
        { timeout: 600000 },
        SELECTORS.FUNCAPTCHA
      );
    }
  }
  
  log("Captcha Solved!", "green");

  // Wait for account confirmation
  try {
    await page.waitForSelector(SELECTORS.DECLINE_BUTTON, { timeout: 10000 });
    await page.click(SELECTORS.DECLINE_BUTTON);
  } catch (error) {
    log("Checking for alternative confirmation...", "yellow");
    const postRedirectFormExists = await page.$(SELECTORS.POST_REDIRECT_FORM);
    if (postRedirectFormExists) {
      await page.waitForSelector(SELECTORS.CLOSE_BUTTON, { timeout: 10000 });
      await page.click(SELECTORS.CLOSE_BUTTON);
    }
  }
  
  await page.waitForSelector(SELECTORS.OUTLOOK_PAGE, { timeout: 30000 });

  // Add recovery email if enabled
  if (config.ADD_RECOVERY_EMAIL) {
    log("Adding Recovery Email...", "yellow");
    try {
      await addRecoveryEmail(page);
    } catch (e) {
      log(`Recovery email failed: ${e.message}`, 'yellow');
    }
  }

  await writeCredentials(email, password);
  return { email, password };
}

async function addRecoveryEmail(page) {
  await page.goto("https://account.live.com/proofs/Manage");

  await page.waitForSelector(SELECTORS.RECOVERY_EMAIL_INPUT, { timeout: 30000 });
  const recoveryEmail = await recMail.getEmail();
  await page.type(SELECTORS.RECOVERY_EMAIL_INPUT, recoveryEmail.email);
  await page.keyboard.press("Enter");
  
  await page.waitForSelector(SELECTORS.EMAIL_CODE_INPUT, { timeout: 60000 });
  log("Waiting for verification code...", "yellow");
  
  let code = await recMail.getMessage(recoveryEmail);
  log(`Code received: ${code}`, "green");
  await page.type(SELECTORS.EMAIL_CODE_INPUT, code);
  await page.keyboard.press("Enter");
  await delay(5000);

  // Check for verification error and retry if needed
  if (await page.$(SELECTORS.VERIFICATION_ERROR)) {
    log("Verification error, retrying...", "yellow");
    await page.click(SELECTORS.RESEND_CODE);
    await page.waitForSelector(SELECTORS.EMAIL_CODE_INPUT);
    code = await recMail.getMessage(recoveryEmail);
    await page.type(SELECTORS.EMAIL_CODE_INPUT, code);
    await page.keyboard.press("Enter");
  }

  // Handle potential second verification
  try {
    await page.waitForSelector(SELECTORS.INTERRUPT_CONTAINER, { timeout: 10000 });
    log("Recovery email added!", "green");
  } catch (e) {
    const afterCodeExists = await page.$(SELECTORS.AFTER_CODE);
    if (afterCodeExists) {
      log("Second verification needed...", "yellow");
      await page.click(SELECTORS.AFTER_CODE);
      await page.waitForSelector(SELECTORS.DOUBLE_VERIFY_EMAIL);
      await page.type(SELECTORS.DOUBLE_VERIFY_EMAIL, recoveryEmail.email);
      await page.keyboard.press("Enter");
      await page.waitForSelector(SELECTORS.DOUBLE_VERIFY_CODE);
      
      const secondCode = await recMail.getMessage(recoveryEmail);
      log(`Second code received: ${secondCode}`, "green");
      await page.type(SELECTORS.DOUBLE_VERIFY_CODE, secondCode);
      await page.keyboard.press("Enter");
      await page.waitForSelector(SELECTORS.INTERRUPT_CONTAINER, { timeout: 30000 });
    }
  }
  
  log("Recovery email setup complete!", "green");
}

async function writeCredentials(email, password) {
  const account = `${email}:${password}`;
  log(`SUCCESS: ${account}`, "green");
  const accountsPath = path.join(__dirname, '..', config.ACCOUNTS_FILE);
  fs.appendFileSync(accountsPath, `${account}\n`);
}

async function generatePersonalInfo() {
  const namesPath = path.join(__dirname, config.NAMES_FILE.replace('src/', ''));
  const names = fs.readFileSync(namesPath, "utf8").split("\n").filter(n => n.trim());
  const randomFirstName = names[Math.floor(Math.random() * names.length)].trim();
  const randomLastName = names[Math.floor(Math.random() * names.length)].trim();
  const username = randomFirstName.toLowerCase() + randomLastName.toLowerCase() + Math.floor(Math.random() * 9999);
  const birthDay = (Math.floor(Math.random() * 28) + 1).toString();
  const birthMonth = (Math.floor(Math.random() * 12) + 1).toString();
  const birthYear = (Math.floor(Math.random() * 10) + 1990).toString();
  return { username, randomFirstName, randomLastName, birthDay, birthMonth, birthYear };
}

async function generatePassword() {
  const wordsPath = path.join(__dirname, config.WORDS_FILE.replace('src/', ''));
  const words = fs.readFileSync(wordsPath, "utf8").split("\n").filter(w => w.trim());
  const firstword = words[Math.floor(Math.random() * words.length)].trim();
  const secondword = words[Math.floor(Math.random() * words.length)].trim();
  return firstword + secondword + Math.floor(Math.random() * 9999) + '!';
}

const SELECTORS = {
  USERNAME_INPUT: '#usernameInput',
  PASSWORD_INPUT: '#Password',
  FIRST_NAME_INPUT: '#firstNameInput',
  LAST_NAME_INPUT: '#lastNameInput',
  BIRTH_DAY_INPUT: '#BirthDay',
  BIRTH_MONTH_INPUT: '#BirthMonth',
  BIRTH_YEAR_INPUT: '#BirthYear',
  EMAIL_DISPLAY: '#userDisplayName',
  DECLINE_BUTTON: '#declineButton',
  OUTLOOK_PAGE: '#mainApp',
  RECOVERY_EMAIL_INPUT: '#EmailAddress',
  EMAIL_CODE_INPUT: '#iOttText',
  AFTER_CODE: '#idDiv_SAOTCS_Proofs_Section',
  DOUBLE_VERIFY_EMAIL: '#idTxtBx_SAOTCS_ProofConfirmation',
  DOUBLE_VERIFY_CODE: '#idTxtBx_SAOTCC_OTC',
  INTERRUPT_CONTAINER: '#interruptContainer',
  VERIFICATION_ERROR: '#iVerificationErr',
  RESEND_CODE: '#iShowSendCode',
  POST_REDIRECT_FORM: 'form[data-testid="post-redirect-form"]',
  CLOSE_BUTTON: '#close-button',
  FUNCAPTCHA: '#enforcementFrame',
};

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Export for telegram bot
module.exports = { 
  start, 
  createSingleAccount,
  generatePersonalInfo, 
  generatePassword,
  stats,
  getStats: () => stats,
  resetStats: () => { stats = { generated: 0, failed: 0, captchaSolved: 0 }; }
};

// Run if called directly
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 1;
  start(count).then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
