import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
    })
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Export logger methods with metadata support
export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
    // Also log to CloudWatch if in AWS environment
    if (process.env.AWS_REGION) {
      console.error(JSON.stringify({ 
        level: 'ERROR', 
        message, 
        ...meta,
        timestamp: new Date().toISOString(),
        service: 'everconnect-backend'
      }));
    }
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
    if (process.env.AWS_REGION) {
      console.warn(JSON.stringify({ 
        level: 'WARN', 
        message, 
        ...meta,
        timestamp: new Date().toISOString(),
        service: 'everconnect-backend'
      }));
    }
  },
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
    if (process.env.AWS_REGION) {
      console.log(JSON.stringify({ 
        level: 'INFO', 
        message, 
        ...meta,
        timestamp: new Date().toISOString(),
        service: 'everconnect-backend'
      }));
    }
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
    if (process.env.AWS_REGION && process.env.LOG_LEVEL === 'debug') {
      console.log(JSON.stringify({ 
        level: 'DEBUG', 
        message, 
        ...meta,
        timestamp: new Date().toISOString(),
        service: 'everconnect-backend'
      }));
    }
  },
};

export default log;