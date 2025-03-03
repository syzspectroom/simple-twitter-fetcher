const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Make sure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Nicer date format for logs
const timestamp = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss'
});

// Log line formatter
const format = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level}] ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: false }),
        timestamp,
        format
      )
    }),
    // File logger
    new winston.transports.File({
      filename: path.join(logsDir, 'twitter-fetcher.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        timestamp,
        format
      ),
    })
  ]
});

module.exports = logger;
