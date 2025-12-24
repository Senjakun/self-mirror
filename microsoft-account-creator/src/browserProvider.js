const os = require('os');

/**
 * Cross-platform browser provider.
 *
 * - Windows: uses puppeteer-with-fingerprints (if installed)
 * - Linux/macOS: falls back to vanilla puppeteer
 */
function parseProxy(proxyString) {
  // Accept: user:pass@host:port  OR  host:port
  if (!proxyString) return null;

  const hasAuth = proxyString.includes('@');
  if (!hasAuth) {
    return { server: proxyString };
  }

  const [auth, addr] = proxyString.split('@');
  const [username, password] = auth.split(':');
  const [host, port] = addr.split(':');

  return {
    server: `${host}:${port}`,
    username,
    password,
  };
}

function createLinuxProvider() {
  const puppeteer = require('puppeteer');
  let activeProxy = null;

  const plugin = {
    setServiceKey: () => {},
    fetch: async () => ({}),
    useFingerprint: () => {},
    useProxy: (proxyString) => {
      activeProxy = parseProxy(proxyString);
    },
    launch: async (options = {}) => {
      const args = Array.isArray(options.args) ? [...options.args] : [];

      // Running as root on VPS commonly requires this.
      try {
        if (typeof process.getuid === 'function' && process.getuid() === 0) {
          args.push('--no-sandbox', '--disable-setuid-sandbox');
        }
      } catch (_) {}

      if (activeProxy?.server) {
        args.push(`--proxy-server=${activeProxy.server}`);
      }

      return puppeteer.launch({
        ...options,
        args,
      });
    },
  };

  async function applyProxyAuth(page) {
    if (activeProxy?.username) {
      await page.authenticate({
        username: activeProxy.username,
        password: activeProxy.password || '',
      });
    }
  }

  return { plugin, applyProxyAuth };
}

function createWindowsProvider() {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { plugin } = require('puppeteer-with-fingerprints');

    return {
      plugin,
      applyProxyAuth: async () => {},
    };
  } catch (e) {
    // If optional dependency isn't installed, fall back.
    return createLinuxProvider();
  }
}

const provider = process.platform === 'win32' ? createWindowsProvider() : createLinuxProvider();

module.exports = provider;
