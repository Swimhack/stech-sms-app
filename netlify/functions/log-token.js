const crypto = require('crypto');

// Token generator for log access
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Simple authentication - in production, this should be more secure
  const adminKey = event.queryStringParameters?.admin_key;
  const expectedKey = process.env.ADMIN_KEY || 'demo-admin-key';
  
  if (adminKey !== expectedKey) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  const timestamp = Date.now().toString();
  const secret = process.env.LOG_ACCESS_SECRET || 'demo-secret-change-in-production';
  
  const hash = crypto.createHmac('sha256', secret);
  hash.update(timestamp);
  const token = hash.digest('hex');
  
  const logUrl = `${event.headers.host || 'localhost'}/.netlify/functions/logs?token=${token}&timestamp=${timestamp}`;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      token,
      timestamp,
      expiresAt: new Date(parseInt(timestamp) + 60 * 60 * 1000).toISOString(), // 1 hour
      urls: {
        json: `https://${logUrl}`,
        html: `https://${logUrl}&format=html`,
        text: `https://${logUrl}&format=text`
      },
      usage: {
        parameters: {
          level: 'Filter by log level (ERROR, WARN, INFO, DEBUG)',
          limit: 'Limit number of entries (max 1000)',
          format: 'Response format (json, html, text)',
          search: 'Search in log messages and data',
          requestId: 'Filter by specific request ID'
        },
        examples: [
          `https://${logUrl}&level=ERROR`,
          `https://${logUrl}&format=html&limit=50`,
          `https://${logUrl}&search=SMS&format=text`
        ]
      }
    }, null, 2)
  };
};