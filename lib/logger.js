const crypto = require('crypto');

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 log entries
  }

  log(level, message, data = {}, requestId = null) {
    const logEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      data,
      requestId,
      environment: process.env.NODE_ENV || 'development',
      function: process.env.AWS_LAMBDA_FUNCTION_NAME || 'local'
    };

    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for debugging
    console.log(`[${logEntry.level}] ${logEntry.message}`, logEntry.data);
    
    return logEntry;
  }

  error(message, data = {}, requestId = null) {
    return this.log('ERROR', message, data, requestId);
  }

  warn(message, data = {}, requestId = null) {
    return this.log('WARN', message, data, requestId);
  }

  info(message, data = {}, requestId = null) {
    return this.log('INFO', message, data, requestId);
  }

  debug(message, data = {}, requestId = null) {
    return this.log('DEBUG', message, data, requestId);
  }

  getLogs(level = null, limit = 100) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level.toUpperCase());
    }
    
    return filteredLogs
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getLogsByRequestId(requestId) {
    return this.logs.filter(log => log.requestId === requestId);
  }

  clear() {
    this.logs = [];
  }
}

// Global logger instance
const logger = new Logger();

module.exports = logger;