// Simple colored logging without external dependencies

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function log(message, color = 'white') {
  const timestamp = new Date().toLocaleTimeString();
  const colorCode = COLORS[color] || COLORS.white;
  console.log(`${colorCode}[${timestamp}]${COLORS.reset} ${message}`);
}

module.exports = log;
