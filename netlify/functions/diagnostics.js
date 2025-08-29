const logger = require('../../lib/logger');
const config = require('../../lib/config');
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
    const diagnostics = config.generateConfigReport();
    diagnostics.timestamp = new Date().toISOString();
    diagnostics.requestId = requestId;
    
    // Add fix instructions
    diagnostics.fixInstructions = {
      netlifyDashboard: 'https://app.netlify.com/sites/stech-sms-app/settings/env',
      steps: [
        '1. Go to Netlify Dashboard → stech-sms-app → Site Settings → Environment Variables',
        '2. Add missing environment variables listed in nextSteps',
        '3. Trigger new deployment from Deploys tab',
        '4. Test /health endpoint to verify configuration'
      ],
      verificationUrls: {
        health: 'https://stech-sms-app.netlify.app/health',
        diagnostics: 'https://stech-sms-app.netlify.app/diagnostics',
        smsApp: 'https://stech-sms-app.netlify.app/'
      }
    };

    logger.info('Diagnostics completed', {
      status: diagnostics.status,
      missingVars: diagnostics.validation.missing.length,
      isValid: diagnostics.validation.isValid
    }, requestId);

    return {
      statusCode: diagnostics.validation.isValid ? 200 : 500,
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
        requestId,
        fix: 'Check server logs and ensure all environment variables are configured'
      })
    };
  }
};