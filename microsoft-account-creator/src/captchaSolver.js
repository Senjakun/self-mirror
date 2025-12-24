const https = require('https');
const http = require('http');
const log = require('./Utils/log');

// TwoCaptcha API
class TwoCaptchaSolver {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://2captcha.com';
  }

  async getBalance() {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/res.php?key=${this.apiKey}&action=getbalance&json=1`;
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.status === 1 ? parseFloat(result.request) : 0);
          } catch (e) {
            resolve(0);
          }
        });
      }).on('error', reject);
    });
  }

  async solveFunCaptcha(siteUrl, siteKey) {
    log('Sending FunCaptcha to 2Captcha...', 'yellow');
    
    // Submit task
    const taskId = await this.createTask(siteUrl, siteKey);
    if (!taskId) throw new Error('Failed to create 2Captcha task');
    
    log(`Task created: ${taskId}, waiting for solution...`, 'yellow');
    
    // Wait for solution
    const solution = await this.waitForResult(taskId);
    return solution;
  }

  async createTask(siteUrl, siteKey) {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        key: this.apiKey,
        method: 'funcaptcha',
        publickey: siteKey,
        pageurl: siteUrl,
        json: '1'
      });
      
      const url = `${this.baseUrl}/in.php?${params.toString()}`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.status === 1) {
              resolve(result.request);
            } else {
              log(`2Captcha error: ${result.request}`, 'red');
              resolve(null);
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async waitForResult(taskId, maxAttempts = 120) {
    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(5000); // Wait 5 seconds between checks
      
      const result = await this.getResult(taskId);
      if (result.status === 1) {
        log('Captcha solved!', 'green');
        return result.request;
      } else if (result.request !== 'CAPCHA_NOT_READY') {
        throw new Error(`2Captcha error: ${result.request}`);
      }
      
      if (i % 6 === 0) { // Log every 30 seconds
        log(`Still solving... (${Math.floor((i * 5) / 60)}m ${(i * 5) % 60}s)`, 'yellow');
      }
    }
    throw new Error('Captcha solving timeout');
  }

  async getResult(taskId) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/res.php?key=${this.apiKey}&action=get&id=${taskId}&json=1`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// AnyCaptcha API
class AnyCaptchaSolver {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anycaptcha.com';
  }

  async getBalance() {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        clientKey: this.apiKey,
        softId: 847
      });

      const options = {
        hostname: 'api.anycaptcha.com',
        path: '/getBalance',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            resolve(result.balance || 0);
          } catch (e) {
            resolve(0);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async solveFunCaptcha(siteUrl, siteKey) {
    log('Sending FunCaptcha to AnyCaptcha...', 'yellow');
    
    // Submit task
    const taskId = await this.createTask(siteUrl, siteKey);
    if (!taskId) throw new Error('Failed to create AnyCaptcha task');
    
    log(`Task created: ${taskId}, waiting for solution...`, 'yellow');
    
    // Wait for solution
    const solution = await this.waitForResult(taskId);
    return solution;
  }

  async createTask(siteUrl, siteKey) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        clientKey: this.apiKey,
        task: {
          type: 'FunCaptchaTaskProxyless',
          websiteURL: siteUrl,
          websitePublicKey: siteKey
        },
        softId: 847,
        languagePool: 'en'
      });

      const options = {
        hostname: 'api.anycaptcha.com',
        path: '/createTask',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            if (result.errorId === 0) {
              resolve(result.taskId);
            } else {
              log(`AnyCaptcha error: ${result.errorDescription}`, 'red');
              resolve(null);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async waitForResult(taskId, maxAttempts = 120) {
    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(3000); // Wait 3 seconds between checks
      
      const result = await this.getResult(taskId);
      if (result.status === 'ready') {
        log('Captcha solved!', 'green');
        return result.solution.token;
      } else if (result.errorId !== 0) {
        throw new Error(`AnyCaptcha error: ${result.errorDescription}`);
      }
      
      if (i % 10 === 0) { // Log every 30 seconds
        log(`Still solving... (${Math.floor((i * 3) / 60)}m ${(i * 3) % 60}s)`, 'yellow');
      }
    }
    throw new Error('Captcha solving timeout');
  }

  async getResult(taskId) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        clientKey: this.apiKey,
        taskId: taskId
      });

      const options = {
        hostname: 'api.anycaptcha.com',
        path: '/getTaskResult',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Manual captcha solver (waits for user)
class ManualCaptchaSolver {
  async getBalance() {
    return 'N/A (Manual)';
  }

  async solveFunCaptcha(page) {
    log('Please solve the captcha manually...', 'yellow');
    // This will be handled by waiting for captcha frame to disappear
    return 'manual';
  }
}

// Factory function to get the right solver
function createCaptchaSolver(provider, apiKey) {
  switch (provider.toLowerCase()) {
    case 'twocaptcha':
    case '2captcha':
      return new TwoCaptchaSolver(apiKey);
    case 'anycaptcha':
      return new AnyCaptchaSolver(apiKey);
    case 'manual':
    default:
      return new ManualCaptchaSolver();
  }
}

module.exports = {
  createCaptchaSolver,
  TwoCaptchaSolver,
  AnyCaptchaSolver,
  ManualCaptchaSolver
};
