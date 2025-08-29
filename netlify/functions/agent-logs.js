const crypto = require('crypto');
const logger = require('../../lib/logger');

// Simplified agent access - automatically generates token and returns logs
exports.handler = async (event, context) => {
  const requestId = crypto.randomUUID();

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify admin access
    const adminKey = event.queryStringParameters?.admin_key;
    const expectedKey = process.env.ADMIN_KEY || 'sms-app-admin-2025';
    
    if (adminKey !== expectedKey) {
      logger.warn('Unauthorized agent log access attempt', {
        providedKey: adminKey ? 'provided' : 'missing',
        ip: event.headers?.['x-forwarded-for'] || 'unknown'
      }, requestId);
      
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Unauthorized - valid admin_key required',
          help: 'Include admin_key parameter with valid key'
        })
      };
    }

    // Parse parameters
    const level = event.queryStringParameters?.level || 'ERROR';
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
    const format = event.queryStringParameters?.format || 'text';
    const search = event.queryStringParameters?.search;

    logger.info('Agent log access granted', {
      level, limit, format, search,
      ip: event.headers?.['x-forwarded-for'] || 'unknown'
    }, requestId);

    // Get logs
    let logs = logger.getLogs(level, limit);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    // Return format requested
    if (format === 'text') {
      const textContent = logs.map(log => {
        const dataStr = Object.keys(log.data).length > 0 ? 
          ` ${JSON.stringify(log.data)}` : '';
        return `[${log.timestamp}] [${log.level}] ${log.message}${dataStr}`;
      }).join('\n');
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        },
        body: textContent
      };
    }

    if (format === 'summary') {
      // Agent-friendly summary format
      const errorCount = logs.filter(l => l.level === 'ERROR').length;
      const warnCount = logs.filter(l => l.level === 'WARN').length;
      const recentErrors = logs.filter(l => l.level === 'ERROR').slice(0, 5);
      
      const summary = {
        status: errorCount > 0 ? 'ISSUES_FOUND' : 'HEALTHY',
        summary: `Found ${errorCount} errors, ${warnCount} warnings in last ${limit} entries`,
        errorCount,
        warnCount,
        totalLogs: logs.length,
        recentErrors: recentErrors.map(log => ({
          timestamp: log.timestamp,
          message: log.message,
          data: log.data,
          requestId: log.requestId
        })),
        commonIssues: getCommonIssues(logs),
        recommendations: getRecommendations(logs)
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(summary, null, 2)
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
          level,
          limit,
          search,
          timestamp: new Date().toISOString(),
          agentAccess: true
        }
      }, null, 2)
    };

  } catch (error) {
    logger.error('Error in agent log access', {
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

function getCommonIssues(logs) {
  const errorMessages = logs
    .filter(l => l.level === 'ERROR')
    .map(l => l.message);
  
  const issueTypes = {};
  errorMessages.forEach(msg => {
    if (msg.includes('Missing required fields')) issueTypes.missingFields = (issueTypes.missingFields || 0) + 1;
    if (msg.includes('Invalid JSON')) issueTypes.invalidJSON = (issueTypes.invalidJSON || 0) + 1;
    if (msg.includes('Environment variable')) issueTypes.configIssues = (issueTypes.configIssues || 0) + 1;
    if (msg.includes('Twilio')) issueTypes.twilioErrors = (issueTypes.twilioErrors || 0) + 1;
  });

  return issueTypes;
}

function getRecommendations(logs) {
  const recommendations = [];
  const issues = getCommonIssues(logs);
  
  if (issues.missingFields) {
    recommendations.push('Check client-side form validation - missing "to" or "message" fields');
  }
  if (issues.invalidJSON) {
    recommendations.push('Verify request Content-Type headers and JSON formatting');
  }
  if (issues.configIssues) {
    recommendations.push('Verify Twilio environment variables are properly set');
  }
  if (issues.twilioErrors) {
    recommendations.push('Check Twilio API status and account balance');
  }
  
  return recommendations;
}