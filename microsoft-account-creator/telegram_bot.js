#!/usr/bin/env node
/**
 * Telegram Bot untuk kontrol Microsoft Account Creator
 * 
 * Usage:
 * 1. Set environment variable: TELEGRAM_BOT_TOKEN=your_token
 * 2. Optional: Set ADMIN_IDS=123456,789012 (comma-separated user IDs)
 * 3. Run: node telegram_bot.js
 */

const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) : [];
const CONFIG_PATH = path.join(__dirname, 'src', 'config.js');
const ACCOUNTS_PATH = path.join(__dirname, 'accounts.txt');

// State
let generatorProcess = null;
let isRunning = false;

// Helper functions
function isAdmin(userId) {
  if (ADMIN_IDS.length === 0) return true;
  return ADMIN_IDS.includes(userId);
}

function getConfig() {
  delete require.cache[require.resolve('./src/config')];
  return require('./src/config');
}

function updateConfig(key, value) {
  let content = fs.readFileSync(CONFIG_PATH, 'utf8');
  
  if (typeof value === 'string') {
    content = content.replace(
      new RegExp(`(${key}:\\s*)'[^']*'`),
      `$1'${value}'`
    );
  } else if (typeof value === 'boolean') {
    content = content.replace(
      new RegExp(`(${key}:\\s*)(true|false)`),
      `$1${value}`
    );
  }
  
  fs.writeFileSync(CONFIG_PATH, content);
}

function getAccounts() {
  if (!fs.existsSync(ACCOUNTS_PATH)) return [];
  return fs.readFileSync(ACCOUNTS_PATH, 'utf8')
    .split('\n')
    .filter(line => line.trim() && line.includes(':'));
}

function getAccountsCount() {
  return getAccounts().length;
}

// Initialize bot
const bot = new Telegraf(BOT_TOKEN);

// Middleware - check admin
bot.use(async (ctx, next) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('⛔ Unauthorized. You are not allowed to use this bot.');
  }
  return next();
});

// Start command
bot.start(async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🚀 Generate Account', 'generate')],
    [
      Markup.button.callback('📊 Status', 'status'),
      Markup.button.callback('📧 Accounts', 'accounts')
    ],
    [
      Markup.button.callback('⚙️ Config', 'config'),
      Markup.button.callback('🔌 Proxy', 'proxy')
    ],
    [Markup.button.callback('🛑 Stop Generator', 'stop')]
  ]);

  await ctx.reply(
    '🎯 *Microsoft Account Creator Bot*\n\n' +
    'This bot helps you create Microsoft/Outlook accounts.\n\n' +
    '⚠️ *Note:* CAPTCHA must be solved manually!\n\n' +
    'Select an option:',
    { parse_mode: 'Markdown', ...keyboard }
  );
});

// Generate callback
bot.action('generate', async (ctx) => {
  await ctx.answerCbQuery();
  
  if (isRunning) {
    return ctx.editMessageText(
      '⚠️ Generator is already running!\n\n' +
      'Stop it first before starting a new one.',
      Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'back')]])
    );
  }

  await ctx.editMessageText(
    '🚀 *Starting Generator*\n\n' +
    '⚠️ **Important:** The browser will open and you need to solve the CAPTCHA manually when prompted.\n\n' +
    'Starting in 3 seconds...',
    { parse_mode: 'Markdown' }
  );

  setTimeout(async () => {
    try {
      isRunning = true;
      
      generatorProcess = spawn('node', ['src/index.js'], {
        cwd: __dirname,
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let output = '';
      
      generatorProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
      });

      generatorProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      generatorProcess.on('close', (code) => {
        isRunning = false;
        generatorProcess = null;
        
        ctx.reply(
          code === 0 
            ? '✅ Generator finished successfully!' 
            : `❌ Generator exited with code ${code}`
        );
      });

      await ctx.editMessageText(
        '✅ *Generator Started!*\n\n' +
        '🖥️ Browser window should open now.\n' +
        '⚠️ Solve the CAPTCHA when prompted!\n\n' +
        'Use /status to check progress.',
        { 
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🛑 Stop', 'stop')],
            [Markup.button.callback('⬅️ Back', 'back')]
          ])
        }
      );

    } catch (error) {
      isRunning = false;
      await ctx.editMessageText(`❌ Error: ${error.message}`);
    }
  }, 3000);
});

// Status callback
bot.action('status', async (ctx) => {
  await ctx.answerCbQuery();
  
  const config = getConfig();
  const accountsCount = getAccountsCount();
  
  const statusText = isRunning ? '🟢 Running' : '🔴 Stopped';
  const proxyStatus = config.USE_PROXY ? '✅ Enabled' : '❌ Disabled';
  const recoveryStatus = config.ADD_RECOVERY_EMAIL ? '✅ Enabled' : '❌ Disabled';

  await ctx.editMessageText(
    '📊 *Generator Status*\n\n' +
    `Status: ${statusText}\n` +
    `Generated Accounts: ${accountsCount}\n\n` +
    `*Settings:*\n` +
    `Proxy: ${proxyStatus}\n` +
    `Recovery Email: ${recoveryStatus}\n` +
    (config.USE_PROXY ? `Proxy: ${config.PROXY_IP}:${config.PROXY_PORT}` : ''),
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'back')]])
    }
  );
});

// Accounts callback
bot.action('accounts', async (ctx) => {
  await ctx.answerCbQuery();
  
  const accounts = getAccounts();
  
  if (accounts.length === 0) {
    return ctx.editMessageText(
      '📧 *Generated Accounts*\n\nNo accounts generated yet.',
      { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'back')]])
      }
    );
  }

  // Show last 10 accounts
  const recent = accounts.slice(-10);
  let text = `📧 *Generated Accounts* (${accounts.length} total)\n\nLast 10:\n`;
  recent.forEach((acc, i) => {
    text += `${i + 1}. \`${acc}\`\n`;
  });
  
  text += '\nUse /download to download all accounts.';

  await ctx.editMessageText(
    text,
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📥 Download All', 'download')],
        [Markup.button.callback('⬅️ Back', 'back')]
      ])
    }
  );
});

// Download callback
bot.action('download', async (ctx) => {
  await ctx.answerCbQuery();
  
  if (!fs.existsSync(ACCOUNTS_PATH)) {
    return ctx.reply('❌ No accounts file found.');
  }

  const accounts = getAccounts();
  if (accounts.length === 0) {
    return ctx.reply('❌ No accounts to download.');
  }

  await ctx.replyWithDocument(
    { source: ACCOUNTS_PATH, filename: `accounts_${Date.now()}.txt` },
    { caption: `📧 ${accounts.length} accounts` }
  );
});

// Config callback
bot.action('config', async (ctx) => {
  await ctx.answerCbQuery();
  
  const config = getConfig();

  await ctx.editMessageText(
    '⚙️ *Configuration*\n\n' +
    `Recovery Email: ${config.ADD_RECOVERY_EMAIL ? '✅ Enabled' : '❌ Disabled'}\n` +
    `Use Proxy: ${config.USE_PROXY ? '✅ Enabled' : '❌ Disabled'}\n\n` +
    (config.USE_PROXY ? 
      `Proxy: ${config.PROXY_USERNAME}:***@${config.PROXY_IP}:${config.PROXY_PORT}\n\n` : '') +
    '*Commands:*\n' +
    '`/setproxy ip:port:user:pass` - Set proxy\n' +
    '`/toggleproxy` - Toggle proxy on/off\n' +
    '`/togglerecovery` - Toggle recovery email',
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Toggle Proxy', 'toggle_proxy')],
        [Markup.button.callback('📧 Toggle Recovery', 'toggle_recovery')],
        [Markup.button.callback('⬅️ Back', 'back')]
      ])
    }
  );
});

// Toggle proxy
bot.action('toggle_proxy', async (ctx) => {
  await ctx.answerCbQuery();
  
  const config = getConfig();
  updateConfig('USE_PROXY', !config.USE_PROXY);
  
  await ctx.reply(`Proxy ${!config.USE_PROXY ? '✅ Enabled' : '❌ Disabled'}`);
});

// Toggle recovery
bot.action('toggle_recovery', async (ctx) => {
  await ctx.answerCbQuery();
  
  const config = getConfig();
  updateConfig('ADD_RECOVERY_EMAIL', !config.ADD_RECOVERY_EMAIL);
  
  await ctx.reply(`Recovery Email ${!config.ADD_RECOVERY_EMAIL ? '✅ Enabled' : '❌ Disabled'}`);
});

// Proxy callback
bot.action('proxy', async (ctx) => {
  await ctx.answerCbQuery();
  
  const config = getConfig();

  await ctx.editMessageText(
    '🔌 *Proxy Settings*\n\n' +
    `Status: ${config.USE_PROXY ? '✅ Enabled' : '❌ Disabled'}\n` +
    (config.USE_PROXY ? 
      `Current: ${config.PROXY_IP}:${config.PROXY_PORT}\n` +
      `Username: ${config.PROXY_USERNAME}\n` : '') +
    '\nTo set proxy, use:\n' +
    '`/setproxy ip:port:username:password`',
    { 
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Toggle Proxy', 'toggle_proxy')],
        [Markup.button.callback('⬅️ Back', 'back')]
      ])
    }
  );
});

// Stop callback
bot.action('stop', async (ctx) => {
  await ctx.answerCbQuery();
  
  if (!isRunning || !generatorProcess) {
    return ctx.editMessageText(
      'ℹ️ Generator is not running.',
      Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'back')]])
    );
  }

  generatorProcess.kill('SIGTERM');
  isRunning = false;
  generatorProcess = null;

  await ctx.editMessageText(
    '🛑 Generator stopped.',
    Markup.inlineKeyboard([[Markup.button.callback('⬅️ Back', 'back')]])
  );
});

// Back callback
bot.action('back', async (ctx) => {
  await ctx.answerCbQuery();
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🚀 Generate Account', 'generate')],
    [
      Markup.button.callback('📊 Status', 'status'),
      Markup.button.callback('📧 Accounts', 'accounts')
    ],
    [
      Markup.button.callback('⚙️ Config', 'config'),
      Markup.button.callback('🔌 Proxy', 'proxy')
    ],
    [Markup.button.callback('🛑 Stop Generator', 'stop')]
  ]);

  await ctx.editMessageText(
    '🎯 *Microsoft Account Creator Bot*\n\n' +
    'Select an option:',
    { parse_mode: 'Markdown', ...keyboard }
  );
});

// Set proxy command
bot.command('setproxy', async (ctx) => {
  const args = ctx.message.text.split(' ')[1];
  
  if (!args) {
    return ctx.reply('Usage: /setproxy ip:port:username:password');
  }

  const parts = args.split(':');
  if (parts.length !== 4) {
    return ctx.reply('Invalid format. Use: /setproxy ip:port:username:password');
  }

  const [ip, port, username, password] = parts;
  
  updateConfig('PROXY_IP', ip);
  updateConfig('PROXY_PORT', port);
  updateConfig('PROXY_USERNAME', username);
  updateConfig('PROXY_PASSWORD', password);
  updateConfig('USE_PROXY', true);

  await ctx.reply(`✅ Proxy set to ${ip}:${port}`);
  
  // Delete command message for security
  try { await ctx.deleteMessage(); } catch (e) {}
});

// Toggle commands
bot.command('toggleproxy', async (ctx) => {
  const config = getConfig();
  updateConfig('USE_PROXY', !config.USE_PROXY);
  await ctx.reply(`Proxy ${!config.USE_PROXY ? '✅ Enabled' : '❌ Disabled'}`);
});

bot.command('togglerecovery', async (ctx) => {
  const config = getConfig();
  updateConfig('ADD_RECOVERY_EMAIL', !config.ADD_RECOVERY_EMAIL);
  await ctx.reply(`Recovery Email ${!config.ADD_RECOVERY_EMAIL ? '✅ Enabled' : '❌ Disabled'}`);
});

// Download command
bot.command('download', async (ctx) => {
  if (!fs.existsSync(ACCOUNTS_PATH)) {
    return ctx.reply('❌ No accounts file found.');
  }

  const accounts = getAccounts();
  if (accounts.length === 0) {
    return ctx.reply('❌ No accounts to download.');
  }

  await ctx.replyWithDocument(
    { source: ACCOUNTS_PATH, filename: `accounts_${Date.now()}.txt` },
    { caption: `📧 ${accounts.length} accounts` }
  );
});

// Help command
bot.help(async (ctx) => {
  await ctx.reply(
    '*Available Commands:*\n\n' +
    '/start - Main menu\n' +
    '/setproxy ip:port:user:pass - Set proxy\n' +
    '/toggleproxy - Toggle proxy\n' +
    '/togglerecovery - Toggle recovery email\n' +
    '/download - Download accounts file\n' +
    '/help - Show this help',
    { parse_mode: 'Markdown' }
  );
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Start bot
if (BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ Please set TELEGRAM_BOT_TOKEN environment variable!');
  console.log('\nUsage:');
  console.log('  export TELEGRAM_BOT_TOKEN="your_token_here"');
  console.log('  node telegram_bot.js');
  process.exit(1);
}

console.log('🤖 Starting Microsoft Account Creator Telegram Bot...');
bot.launch()
  .then(() => console.log('✅ Bot started!'))
  .catch(err => {
    console.error('❌ Failed to start bot:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => {
  if (generatorProcess) generatorProcess.kill();
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  if (generatorProcess) generatorProcess.kill();
  bot.stop('SIGTERM');
});
