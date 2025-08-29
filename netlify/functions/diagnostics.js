const logger = require('../../lib/logger');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  const requestId = crypto.randomUUID();
  
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  logger.info('Diagnostics endpoint accessed', {
    httpMethod: event.httpMethod,
    ip: event.headers?.['x-forwarded-for'] || 'unknown'
  }, requestId);

  try {
    const requiredEnvVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN', 
      'TWILIO_PHONE_NUMBER'
    ];

    const optionalEnvVars = [
      'ADMIN_KEY',
      'LOG_ACCESS_SECRET',
      'NODE_ENV'
    ];

    const envStatus = {};
    
    // Check required variables
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      envStatus[varName] = {
        configured: !!value,
        hasValue: !!value,
        length: value ? value.length : 0,
        type: 'REQUIRED'
      };
    });

    // Check optional variables
    optionalEnvVars.forEach(varName => {
      const value = process.env[varName];
      envStatus[varName] = {
        configured: !!value,
        hasValue: !!value,
        length: value ? value.length : 0,
        type: 'OPTIONAL'
      };
    });

    const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
    const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      requestId,
      status: missingRequired.length > 0 ? 'CONFIGURATION_ERROR' : 'OK',
      environment: {
        nodeEnv: process.env.NODE_ENV || 'not-set',
        platform: 'netlify-functions',
        region: process.env.AWS_REGION || 'unknown'
      },
      configuration: {
        requiredVariables: {
          total: requiredEnvVars.length,
          configured: requiredEnvVars.length - missingRequired.length,
          missing: missingRequired,
          status: envStatus
        },
        optionalVariables: {
          total: optionalEnvVars.length,
          configured: optionalEnvVars.length - missingOptional.length,
          missing: missingOptional
        }
      },
      twilioStatus: {
        accountSidConfigured: !!process.env.TWILIO_ACCOUNT_SID,
        authTokenConfigured: !!process.env.TWILIO_AUTH_TOKEN,
        phoneNumberConfigured: !!process.env.TWILIO_PHONE_NUMBER,
        allConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
      },
      recommendations: [],
      nextSteps: []
    };

    // Add recommendations
    if (missingRequired.length > 0) {
      diagnostics.recommendations.push('Configure missing required environment variables in Netlify dashboard');
      diagnostics.recommendations.push('Go to Site Settings > Environment Variables in Netlify');
      diagnostics.nextSteps.push('Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    }

    if (!process.env.ADMIN_KEY) {
      diagnostics.recommendations.push('Set ADMIN_KEY for log access security');
      diagnostics.nextSteps.push('Add ADMIN_KEY=sms-app-admin-2025');
    }

    if (!process.env.LOG_ACCESS_SECRET) {
      diagnostics.recommendations.push('Set LOG_ACCESS_SECRET for log token signing');
      diagnostics.nextSteps.push('Add LOG_ACCESS_SECRET=sms-log-secret-2025-secure');
    }

    logger.info('Diagnostics completed', {
      status: diagnostics.status,
      missingRequired: missingRequired.length,
      missingOptional: missingOptional.length
    }, requestId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(diagnostics, null, 2)
    };

  } catch (error) {
    logger.error('Error in diagnostics', {
      errorMessage: error.message,
      stack: error.stack
    }, requestId);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Diagnostics failed',
        message: error.message,
        requestId
      })
    };
  }
};