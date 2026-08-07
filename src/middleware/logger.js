const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../../logs');
const LOGS_FILE = path.join(LOGS_DIR, 'access.log');

// Ensure the logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Console color helpers using ANSI escape codes
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Methods
  GET: '\x1b[32m',    // Green
  POST: '\x1b[36m',   // Cyan
  PUT: '\x1b[33m',    // Yellow
  DELETE: '\x1b[31m', // Red
  
  // Statuses
  status2xx: '\x1b[32m', // Green
  status3xx: '\x1b[35m', // Magenta
  status4xx: '\x1b[33m', // Yellow
  status5xx: '\x1b[41m\x1b[37m' // White on Red
};

/**
 * Helper to select status color
 */
function getStatusColor(status) {
  if (status >= 500) return COLORS.status5xx;
  if (status >= 400) return COLORS.status4xx;
  if (status >= 300) return COLORS.status3xx;
  return COLORS.status2xx;
}

/**
 * Custom request logger middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Intercept the response finish event to calculate duration and log
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const status = res.statusCode;
    
    // 1. Format file log (plain text, no ANSI escape codes)
    const logLine = `[${timestamp}] ${ip} - ${method} ${originalUrl} ${status} - ${duration}ms\n`;
    try {
      fs.appendFileSync(LOGS_FILE, logLine, 'utf-8');
    } catch (err) {
      console.error('Failed to write access log to file:', err.message);
    }
    
    // 2. Format console log (beautifully colorized)
    const methodColor = COLORS[method] || COLORS.bright;
    const statusColor = getStatusColor(status);
    
    console.log(
      `${COLORS.dim}[${timestamp}]${COLORS.reset} ` +
      `${methodColor}${method.padEnd(6)}${COLORS.reset} ` +
      `${originalUrl} ` +
      `${statusColor}${status}${COLORS.reset} ` +
      `${COLORS.dim}- ${duration}ms${COLORS.reset}`
    );
  });
  
  next();
}

module.exports = requestLogger;
