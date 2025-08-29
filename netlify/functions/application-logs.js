const logger = require('../../lib/logger');

/**
 * Public endpoint for accessing application logs in JSON format
 * Designed for LLM consumption to analyze and fix application issues
 * 
 * Access: https://stech-sms-app.netlify.app/.netlify/functions/application-logs
 * 
 * Query parameters:
 * - level: Filter by log level (ERROR, WARN, INFO, DEBUG) - defaults to all
 * - limit: Number of logs to return (max 500) - defaults to 100
 * - search: Search term to filter logs
 * - hours: Get logs from last N hours (default 24)
 */

exports.handler = async (event, context) => {
  // CORS headers for public access
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        endpoint: '/.netlify/functions/application-logs',
        method: 'GET',
        description: 'Use GET request to retrieve application logs'
      })
    };
  }

  try {
    // Parse query parameters with defaults for LLM-friendly output
    const params = event.queryStringParameters || {};
    const level = params.level?.toUpperCase() || 'ALL';
    const limit = Math.min(parseInt(params.limit) || 100, 500);
    const search = params.search || '';
    const hours = parseInt(params.hours) || 24;

    // Get logs with appropriate filtering
    let logs = logger.getLogs(level === 'ALL' ? 'DEBUG' : level, limit * 2);

    // Filter by time window
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    logs = logs.filter(log => new Date(log.timestamp) >= cutoffTime);

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data).toLowerCase().includes(searchLower) ||
        (log.stack && log.stack.toLowerCase().includes(searchLower))
      );
    }

    // Filter by level if not ALL
    if (level !== 'ALL') {
      logs = logs.filter(log => log.level === level);
    }

    // Limit results
    logs = logs.slice(0, limit);

    // Analyze logs for patterns and issues
    const analysis = analyzeLogs(logs);

    // Create LLM-friendly response structure
    const response = {
      meta: {
        endpoint: 'https://stech-sms-app.netlify.app/.netlify/functions/application-logs',
        timestamp: new Date().toISOString(),
        query: {
          level: level,
          limit: limit,
          search: search || null,
          hours: hours
        },
        stats: {
          total_logs: logs.length,
          error_count: logs.filter(l => l.level === 'ERROR').length,
          warning_count: logs.filter(l => l.level === 'WARN').length,
          info_count: logs.filter(l => l.level === 'INFO').length,
          debug_count: logs.filter(l => l.level === 'DEBUG').length,
          time_range: {
            from: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
            to: logs.length > 0 ? logs[0].timestamp : null
          }
        }
      },
      analysis: analysis,
      logs: logs.map(formatLogForLLM),
      instructions_for_llm: {
        description: "These are application logs from the SMS messaging app deployed on Netlify",
        common_issues: [
          "Missing Twilio environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)",
          "Invalid phone number format (must include country code)",
          "Missing required fields in SMS requests (to, message)",
          "Configuration errors requiring environment variable setup in Netlify"
        ],
        fix_suggestions: analysis.recommendations,
        next_steps: analysis.next_steps
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    logger.error('Error serving application logs', {
      error: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to retrieve application logs',
        suggestion: 'Try again with different parameters or check application status',
        endpoint: '/.netlify/functions/application-logs'
      }, null, 2)
    };
  }
};

/**
 * Format log entry for LLM consumption
 */
function formatLogForLLM(log) {
  const formatted = {
    timestamp: log.timestamp,
    level: log.level,
    message: log.message,
    request_id: log.requestId || null
  };

  // Include error details if present
  if (log.data) {
    if (log.data.error || log.data.errorMessage) {
      formatted.error_details = {
        message: log.data.errorMessage || log.data.error,
        stack: log.data.stack || null,
        code: log.data.code || null
      };
    }

    // Include request details if present
    if (log.data.method || log.data.path) {
      formatted.request = {
        method: log.data.method,
        path: log.data.path,
        query: log.data.query || null,
        body: log.data.body || null
      };
    }

    // Include Twilio-specific errors
    if (log.data.twilioError) {
      formatted.twilio_error = {
        code: log.data.twilioError.code,
        message: log.data.twilioError.message,
        more_info: log.data.twilioError.moreInfo
      };
    }

    // Include configuration issues
    if (log.data.missing || log.data.validation) {
      formatted.configuration = {
        missing_vars: log.data.missing || null,
        validation: log.data.validation || null,
        configured: log.data.twilioConfigured
      };
    }

    // Include any other relevant data
    const excludeKeys = ['error', 'errorMessage', 'stack', 'method', 'path', 'query', 'body', 'twilioError', 'missing', 'validation', 'twilioConfigured'];
    const additionalData = {};
    Object.keys(log.data).forEach(key => {
      if (!excludeKeys.includes(key)) {
        additionalData[key] = log.data[key];
      }
    });
    
    if (Object.keys(additionalData).length > 0) {
      formatted.additional_data = additionalData;
    }
  }

  return formatted;
}

/**
 * Analyze logs for patterns and generate recommendations
 */
function analyzeLogs(logs) {
  const errors = logs.filter(l => l.level === 'ERROR');
  const warnings = logs.filter(l => l.level === 'WARN');
  
  const patterns = {
    configuration_errors: 0,
    missing_fields: 0,
    twilio_errors: 0,
    validation_errors: 0,
    authentication_errors: 0,
    other_errors: 0
  };

  const specific_issues = [];
  const seen_issues = new Set();

  errors.forEach(log => {
    const msg = log.message.toLowerCase();
    const data = JSON.stringify(log.data || {}).toLowerCase();
    
    if (msg.includes('configuration') || msg.includes('environment')) {
      patterns.configuration_errors++;
      if (!seen_issues.has('config')) {
        specific_issues.push('Missing or invalid Twilio configuration');
        seen_issues.add('config');
      }
    }
    
    if (msg.includes('missing required') || msg.includes('missing field')) {
      patterns.missing_fields++;
      if (!seen_issues.has('fields')) {
        specific_issues.push('Required fields missing in API requests');
        seen_issues.add('fields');
      }
    }
    
    if (msg.includes('twilio') || data.includes('twilio')) {
      patterns.twilio_errors++;
      if (!seen_issues.has('twilio')) {
        specific_issues.push('Twilio API errors or authentication issues');
        seen_issues.add('twilio');
      }
    }
    
    if (msg.includes('validation') || msg.includes('invalid')) {
      patterns.validation_errors++;
      if (!seen_issues.has('validation')) {
        specific_issues.push('Input validation failures');
        seen_issues.add('validation');
      }
    }
    
    if (msg.includes('unauthorized') || msg.includes('authentication')) {
      patterns.authentication_errors++;
      if (!seen_issues.has('auth')) {
        specific_issues.push('Authentication or authorization failures');
        seen_issues.add('auth');
      }
    }
  });

  patterns.other_errors = errors.length - (
    patterns.configuration_errors + 
    patterns.missing_fields + 
    patterns.twilio_errors + 
    patterns.validation_errors + 
    patterns.authentication_errors
  );

  // Generate recommendations based on patterns
  const recommendations = [];
  const next_steps = [];

  if (patterns.configuration_errors > 0) {
    recommendations.push('Configure Twilio environment variables in Netlify dashboard');
    next_steps.push('Go to https://app.netlify.com/sites/stech-sms-app/settings/env and add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
  }

  if (patterns.missing_fields > 0) {
    recommendations.push('Ensure all API requests include required fields (to, message for SMS)');
    next_steps.push('Update client-side validation to check for required fields before sending requests');
  }

  if (patterns.twilio_errors > 0) {
    recommendations.push('Verify Twilio account status and credentials');
    next_steps.push('Check Twilio console for account balance and verify phone number is active');
  }

  if (patterns.validation_errors > 0) {
    recommendations.push('Review input validation rules for phone numbers and message content');
    next_steps.push('Ensure phone numbers include country code (e.g., +1 for US)');
  }

  if (patterns.authentication_errors > 0) {
    recommendations.push('Check admin key and authentication tokens');
    next_steps.push('Verify ADMIN_KEY environment variable is set correctly');
  }

  if (errors.length === 0) {
    recommendations.push('No errors detected - application appears healthy');
    if (warnings.length > 0) {
      recommendations.push(`Review ${warnings.length} warning(s) for potential issues`);
    }
  }

  return {
    summary: errors.length > 0 
      ? `Found ${errors.length} error(s) and ${warnings.length} warning(s) requiring attention`
      : `Application healthy with ${warnings.length} warning(s)`,
    error_patterns: patterns,
    specific_issues: specific_issues,
    recommendations: recommendations,
    next_steps: next_steps,
    health_status: errors.length === 0 ? 'HEALTHY' : 
                   patterns.configuration_errors > 0 ? 'CONFIGURATION_ERROR' : 
                   'ERRORS_DETECTED'
  };
}