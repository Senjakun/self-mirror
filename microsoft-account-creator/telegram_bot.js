const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Bot configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()).filter(Boolean);

if (!BOT_TOKEN) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN environment variable is required');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Paths
const configPath = path.join(__dirname, 'src', 'config.js');
const accountsPath = path.join(__dirname, 'accounts.txt');
const proxiesPath = path.join(__dirname, 'proxies.txt');

// State
let isGenerating = false;
let generatorProcess = null;

// Check admin
function isAdmin(userId) {
  if (ADMIN_IDS.length === 0) return true;
  return ADMIN_IDS.includes(userId.toString());
}

// Load/Save config
function loadConfig() {
  delete require.cache[require.resolve(configPath)];
  return require(configPath);
}

function saveConfig(config) {
  const content = `module.exports = ${JSON.stringify(config, null, 2).replace(/"([^"]+)":/g, '$1:')};`;
  fs.writeFileSync(configPath, content);
}

// Main menu
function getMainMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Generate', callback_data: 'menu_generate' },
          { text: '📊 Status', callback_data: 'status' }
        ],
        [
          { text: '📋 Accounts', callback_data: 'accounts' },
          { text: '⚙️ Settings', callback_data: 'menu_settings' }
        ],
        [
          { text: '🌐 Proxy', callback_data: 'menu_proxy' },
          { text: '❓ Help', callback_data: 'help' }
        ]
      ]
    }
  };
}

// /start
bot.onText(/\/start/, (msg) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, '❌ Unauthorized');

  const config = loadConfig();
  bot.sendMessage(msg.chat.id, 
    `🔐 *Microsoft Account Creator*\n\n` +
    `🎯 Captcha: \`2Captcha\`\n` +
    `🌐 Proxy: \`${config.USE_PROXY ? 'Webshare.io' : 'OFF'}\`\n` +
    `📧 Domain: \`${config.EMAIL_DOMAIN}\`\n` +
    `🔄 Recovery: \`${config.ADD_RECOVERY_EMAIL ? 'ON' : 'OFF'}\``,
    { parse_mode: 'Markdown', ...getMainMenu() }
  );
});

// Callback handler
bot.on('callback_query', async (query) => {
  if (!isAdmin(query.from.id)) {
    return bot.answerCallbackQuery(query.id, { text: '❌ Unauthorized' });
  }

  const chatId = query.message.chat.id;
  const msgId = query.message.message_id;
  const config = loadConfig();

  switch (query.data) {
    case 'menu_generate':
      await bot.editMessageText('🚀 *Generate Accounts*\n\nPilih jumlah:', {
        chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '1️⃣', callback_data: 'gen_1' },
              { text: '5️⃣', callback_data: 'gen_5' },
              { text: '🔟', callback_data: 'gen_10' }
            ],
            [
              { text: '25', callback_data: 'gen_25' },
              { text: '50', callback_data: 'gen_50' },
              { text: '100', callback_data: 'gen_100' }
            ],
            [{ text: '⬅️ Back', callback_data: 'back_main' }]
          ]
        }
      });
      break;

    case 'menu_settings':
      await bot.editMessageText(
        `⚙️ *Settings*\n\n` +
        `📧 Domain: \`${config.EMAIL_DOMAIN}\`\n` +
        `🔄 Recovery: \`${config.ADD_RECOVERY_EMAIL ? 'ON' : 'OFF'}\`\n` +
        `🖥️ Headless: \`${config.HEADLESS ? 'ON' : 'OFF'}\``,
        {
          chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `📧 Domain: ${config.EMAIL_DOMAIN}`, callback_data: 'toggle_domain' }],
              [{ text: `🔄 Recovery: ${config.ADD_RECOVERY_EMAIL ? '✅' : '❌'}`, callback_data: 'toggle_recovery' }],
              [{ text: `🖥️ Headless: ${config.HEADLESS ? '✅' : '❌'}`, callback_data: 'toggle_headless' }],
              [{ text: '⬅️ Back', callback_data: 'back_main' }]
            ]
          }
        }
      );
      break;

    case 'menu_proxy':
      await bot.editMessageText(
        `🌐 *Webshare.io Rotating Proxy*\n\n` +
        `Status: \`${config.USE_PROXY ? 'ON' : 'OFF'}\`\n` +
        `Host: \`${config.PROXY_HOST || 'p.webshare.io'}\`\n` +
        `Port: \`${config.PROXY_PORT || '80'}\`\n` +
        `User: \`${config.PROXY_USERNAME || 'Not set'}\`\n\n` +
        `Set proxy dengan:\n\`/setproxy user:pass@host:port\`\n` +
        `Contoh: \`/setproxy nyrtjgvw-rotate:xxx@p.webshare.io:80\``,
        {
          chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `🌐 Proxy: ${config.USE_PROXY ? '✅ ON' : '❌ OFF'}`, callback_data: 'toggle_proxy' }],
              [{ text: '⬅️ Back', callback_data: 'back_main' }]
            ]
          }
        }
      );
      break;

    case 'toggle_domain':
      config.EMAIL_DOMAIN = config.EMAIL_DOMAIN === '@outlook.com' ? '@hotmail.com' : '@outlook.com';
      saveConfig(config);
      await bot.answerCallbackQuery(query.id, { text: `Domain: ${config.EMAIL_DOMAIN}` });
      bot.emit('callback_query', { ...query, data: 'menu_settings' });
      break;

    case 'toggle_recovery':
      config.ADD_RECOVERY_EMAIL = !config.ADD_RECOVERY_EMAIL;
      saveConfig(config);
      await bot.answerCallbackQuery(query.id, { text: `Recovery: ${config.ADD_RECOVERY_EMAIL ? 'ON' : 'OFF'}` });
      bot.emit('callback_query', { ...query, data: 'menu_settings' });
      break;

    case 'toggle_headless':
      config.HEADLESS = !config.HEADLESS;
      saveConfig(config);
      await bot.answerCallbackQuery(query.id, { text: `Headless: ${config.HEADLESS ? 'ON' : 'OFF'}` });
      bot.emit('callback_query', { ...query, data: 'menu_settings' });
      break;

    case 'toggle_proxy':
      config.USE_PROXY = !config.USE_PROXY;
      saveConfig(config);
      await bot.answerCallbackQuery(query.id, { text: `Proxy: ${config.USE_PROXY ? 'ON' : 'OFF'}` });
      bot.emit('callback_query', { ...query, data: 'menu_proxy' });
      break;

    case 'gen_1': case 'gen_5': case 'gen_10': 
    case 'gen_25': case 'gen_50': case 'gen_100':
      const count = parseInt(query.data.split('_')[1]);
      await startGeneration(chatId, msgId, count);
      break;

    case 'status':
      let accountCount = 0;
      try {
        const accounts = fs.readFileSync(accountsPath, 'utf8');
        accountCount = accounts.split('\n').filter(l => l.includes(':')).length;
      } catch (e) {}
      
      await bot.editMessageText(
        `📊 *Status*\n\n` +
        `🔄 Running: \`${isGenerating ? 'YES' : 'NO'}\`\n` +
        `📧 Total: \`${accountCount} accounts\`\n` +
        `🎯 2Captcha Key: \`${config.CAPTCHA_API_KEY ? 'Set ✅' : 'Not set ❌'}\`\n` +
        `🌐 Proxy: \`${config.USE_PROXY ? 'ON' : 'OFF'}\``,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', ...getMainMenu() }
      );
      break;

    case 'accounts':
      try {
        const accounts = fs.readFileSync(accountsPath, 'utf8');
        const lines = accounts.split('\n').filter(l => l.includes(':'));
        const last10 = lines.slice(-10);
        
        await bot.editMessageText(
          last10.length > 0
            ? `📋 *Last 10 Accounts*\n\n\`\`\`\n${last10.join('\n')}\n\`\`\`\nTotal: ${lines.length}`
            : '📋 *No accounts yet*',
          {
            chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📥 Download', callback_data: 'download' }],
                [{ text: '⬅️ Back', callback_data: 'back_main' }]
              ]
            }
          }
        );
      } catch (e) {
        await bot.editMessageText('📋 *No accounts file*', 
          { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', ...getMainMenu() });
      }
      break;

    case 'download':
      try {
        await bot.sendDocument(chatId, accountsPath, { caption: '📥 Generated Accounts' });
      } catch (e) {
        await bot.sendMessage(chatId, '❌ No accounts file');
      }
      break;

    case 'stop':
      if (generatorProcess) {
        generatorProcess.kill();
        generatorProcess = null;
      }
      isGenerating = false;
      await bot.editMessageText('🛑 *Stopped*', 
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', ...getMainMenu() });
      break;

    case 'help':
      await bot.editMessageText(
        `❓ *Help*\n\n` +
        `*Commands:*\n` +
        `/start - Main menu\n` +
        `/setapikey KEY - Set 2Captcha API key\n` +
        `/setproxy endpoint:port - Set rotating proxy\n` +
        `/balance - Check 2Captcha balance\n\n` +
        `*Webshare Rotating Proxy:*\n` +
        `1. Whitelist VPS IP di Webshare\n` +
        `2. Set ke IP Authentication\n` +
        `3. Set ke Rotating Proxy Endpoint\n` +
        `4. Copy endpoint: \`p.webshare.io:80\``,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', ...getMainMenu() }
      );
      break;

    case 'back_main':
      const cfg = loadConfig();
      await bot.editMessageText(
        `🔐 *Microsoft Account Creator*\n\n` +
        `🎯 Captcha: \`2Captcha\`\n` +
        `🌐 Proxy: \`${cfg.USE_PROXY ? 'ON' : 'OFF'}\`\n` +
        `📧 Domain: \`${cfg.EMAIL_DOMAIN}\``,
        { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', ...getMainMenu() }
      );
      break;
  }
  
  await bot.answerCallbackQuery(query.id);
});

// Start generation
async function startGeneration(chatId, msgId, count) {
  if (isGenerating) {
    return bot.editMessageText('⚠️ Already running!', {
      chat_id: chatId, message_id: msgId,
      reply_markup: { inline_keyboard: [[{ text: '🛑 Stop', callback_data: 'stop' }]] }
    });
  }

  const config = loadConfig();
  if (!config.CAPTCHA_API_KEY) {
    return bot.editMessageText('❌ Set 2Captcha API key first!\n\n`/setapikey YOUR_KEY`', 
      { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', ...getMainMenu() });
  }

  isGenerating = true;
  
  await bot.editMessageText(`🚀 *Generating ${count} accounts...*\n\n⏳ Please wait...`, {
    chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [[{ text: '🛑 Stop', callback_data: 'stop' }]] }
  });

  const { spawn } = require('child_process');
  generatorProcess = spawn('node', ['src/index.js', count.toString()], {
    cwd: __dirname,
    env: process.env
  });

  let output = '';
  
  generatorProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString());
  });

  generatorProcess.stderr.on('data', (data) => console.error(data.toString()));

  generatorProcess.on('close', async () => {
    isGenerating = false;
    generatorProcess = null;
    const successCount = (output.match(/SUCCESS:/g) || []).length;
    
    await bot.sendMessage(chatId,
      `✅ *Done!*\n\n📊 Generated: ${successCount}/${count}`,
      { parse_mode: 'Markdown', ...getMainMenu() }
    );
  });
}

// /setapikey
bot.onText(/\/setapikey (.+)/, (msg, match) => {
  if (!isAdmin(msg.from.id)) return;
  
  const config = loadConfig();
  config.CAPTCHA_API_KEY = match[1].trim();
  config.CAPTCHA_PROVIDER = 'twocaptcha';
  saveConfig(config);
  
  bot.sendMessage(msg.chat.id, `✅ 2Captcha API key set!\n\nKey: \`${match[1].trim().substring(0, 8)}....\``, 
    { parse_mode: 'Markdown' });
});

// /setproxy (Format: user:pass@host:port)
bot.onText(/\/setproxy (.+)/, (msg, match) => {
  if (!isAdmin(msg.from.id)) return;
  
  const proxy = match[1].trim();
  const config = loadConfig();
  
  if (proxy.includes('@')) {
    // Format: user:pass@host:port
    const [auth, addr] = proxy.split('@');
    const [user, pass] = auth.split(':');
    const [host, port] = addr.split(':');
    config.PROXY_USERNAME = user;
    config.PROXY_PASSWORD = pass;
    config.PROXY_HOST = host;
    config.PROXY_PORT = port || '80';
  } else {
    // Format: host:port (IP auth, no credentials)
    const [host, port] = proxy.split(':');
    config.PROXY_HOST = host;
    config.PROXY_PORT = port || '80';
    config.PROXY_USERNAME = '';
    config.PROXY_PASSWORD = '';
  }
  
  config.USE_PROXY = true;
  saveConfig(config);
  
  bot.sendMessage(msg.chat.id, 
    `✅ Rotating proxy configured!\n\n` +
    `🌐 Host: \`${config.PROXY_HOST}:${config.PROXY_PORT}\`\n` +
    `👤 User: \`${config.PROXY_USERNAME || 'IP Auth'}\``,
    { parse_mode: 'Markdown' }
  );
});

// /balance - Check 2captcha balance
bot.onText(/\/balance/, async (msg) => {
  if (!isAdmin(msg.from.id)) return;
  
  const config = loadConfig();
  if (!config.CAPTCHA_API_KEY) {
    return bot.sendMessage(msg.chat.id, '❌ Set API key first: `/setapikey KEY`', { parse_mode: 'Markdown' });
  }
  
  const https = require('https');
  const url = `https://2captcha.com/res.php?key=${config.CAPTCHA_API_KEY}&action=getbalance&json=1`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.status === 1) {
          bot.sendMessage(msg.chat.id, `💰 *2Captcha Balance*\n\n$${result.request}`, { parse_mode: 'Markdown' });
        } else {
          bot.sendMessage(msg.chat.id, `❌ Error: ${result.request}`);
        }
      } catch (e) {
        bot.sendMessage(msg.chat.id, '❌ Failed to check balance');
      }
    });
  });
});

console.log('🤖 Bot started!');
console.log(`Admin IDs: ${ADMIN_IDS.length > 0 ? ADMIN_IDS.join(', ') : 'Open access'}`);
