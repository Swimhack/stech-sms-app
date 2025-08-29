const logger = require('../../lib/logger');
const crypto = require('crypto');

// Simple token-based authentication
const generateToken = (secret, timestamp) => {
  const hash = crypto.createHmac('sha256', secret);
  hash.update(`${timestamp}`);
  return hash.digest('hex');
};

const validateToken = (token, secret, timestamp, windowMinutes = 60) => {
  const now = Date.now();
  const tokenTime = parseInt(timestamp);
  
  // Check if timestamp is within acceptable window
  if (Math.abs(now - tokenTime) > windowMinutes * 60 * 1000) {
    return false;
  }
  
  const expectedToken = generateToken(secret, timestamp);
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
};

exports.handler = async (event, context) => {
  const requestId = crypto.randomUUID();
  
  // Handle CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Authentication via query parameters or headers
    const authToken = event.queryStringParameters?.token || 
                      event.headers?.authorization?.replace('Bearer ', '');
    const timestamp = event.queryStringParameters?.timestamp || 
                      event.headers?.['x-timestamp'];
    
    // Use environment variable as secret, fallback to default for demo
    const secret = process.env.LOG_ACCESS_SECRET || 'demo-secret-change-in-production';
    
    if (!authToken || !timestamp) {
      logger.warn('Unauthorized log access attempt - missing credentials', {
        hasToken: !!authToken,
        hasTimestamp: !!timestamp,
        ip: event.headers?.['x-forwarded-for'] || 'unknown'
      }, requestId);
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Authentication required',
          help: 'Include token and timestamp parameters'
        })
      };
    }

    if (!validateToken(authToken, secret, timestamp)) {
      logger.warn('Unauthorized log access attempt - invalid credentials', {
        ip: event.headers?.['x-forwarded-for'] || 'unknown',
        timestamp
      }, requestId);
      
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid authentication' })
      };
    }

    // Parse query parameters
    const level = event.queryStringParameters?.level;
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 100, 1000);
    const format = event.queryStringParameters?.format || 'json';
    const search = event.queryStringParameters?.search;
    const requestIdFilter = event.queryStringParameters?.requestId;

    logger.info('Authorized log access', {
      level,
      limit,
      format,
      search,
      requestIdFilter,
      ip: event.headers?.['x-forwarded-for'] || 'unknown'
    }, requestId);

    let logs = logger.getLogs(level, limit);

    // Filter by request ID if specified
    if (requestIdFilter) {
      logs = logger.getLogsByRequestId(requestIdFilter);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    // Return different formats
    if (format === 'html') {
      const htmlContent = generateLogHTML(logs);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*'
        },
        body: htmlContent
      };
    }

    if (format === 'text') {
      const textContent = logs.map(log => 
        `[${log.timestamp}] [${log.level}] ${log.message} ${JSON.stringify(log.data)}`
      ).join('\n');
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        },
        body: textContent
      };
    }

    // Default JSON format
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        logs,
        meta: {
          total: logs.length,
          level: level || 'all',
          limit,
          timestamp: new Date().toISOString(),
          requestId
        }
      }, null, 2)
    };

  } catch (error) {
    logger.error('Error retrieving logs', {
      errorMessage: error.message,
      stack: error.stack
    }, requestId);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        requestId
      })
    };
  }
};

function generateLogHTML(logs) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>SMS App Logs</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .log-entry { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; background: #f9f9f9; }
        .log-entry.ERROR { border-left-color: #e74c3c; background: #fdf2f2; }
        .log-entry.WARN { border-left-color: #f39c12; background: #fefbf3; }
        .log-entry.INFO { border-left-color: #3498db; background: #f3f8fd; }
        .log-entry.DEBUG { border-left-color: #95a5a6; background: #f8f9fa; }
        .timestamp { color: #666; font-size: 0.9em; }
        .level { font-weight: bold; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
        .level.ERROR { background: #e74c3c; color: white; }
        .level.WARN { background: #f39c12; color: white; }
        .level.INFO { background: #3498db; color: white; }
        .level.DEBUG { background: #95a5a6; color: white; }
        .message { margin: 5px 0; }
        .data { background: #ecf0f1; padding: 8px; border-radius: 4px; margin-top: 5px; font-size: 0.9em; }
        .request-id { color: #7f8c8d; font-size: 0.8em; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .stats { background: #ecf0f1; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 SMS App Logs</h1>
        <div class="stats">
            <strong>Total Entries:</strong> ${logs.length} | 
            <strong>Generated:</strong> ${new Date().toISOString()}
        </div>
        ${logs.map(log => `
            <div class="log-entry ${log.level}">
                <div>
                    <span class="timestamp">${log.timestamp}</span>
                    <span class="level ${log.level}">${log.level}</span>
                    ${log.requestId ? `<span class="request-id">Request: ${log.requestId}</span>` : ''}
                </div>
                <div class="message">${escapeHtml(log.message)}</div>
                ${Object.keys(log.data).length > 0 ? `<div class="data">${escapeHtml(JSON.stringify(log.data, null, 2))}</div>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}