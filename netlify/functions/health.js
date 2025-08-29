const config = require('../../lib/config');

exports.handler = async (event, context) => {
  const validation = config.validate();
  const envInfo = config.getEnvironmentInfo();
  
  // Force environment variable debug info
  const envDebug = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING', 
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? 'SET' : 'MISSING',
    ADMIN_KEY: process.env.ADMIN_KEY ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'undefined'
  };
  
  const healthcheck = {
    uptime: process.uptime(),
    message: validation.isValid ? 'OK' : 'CONFIGURATION_ERROR',
    deployTimestamp: '2025-08-29-15:35:00',  // Force cache invalidation
    timestamp: Date.now(),
    environment: envInfo.nodeEnv,
    twilioConfigured: validation.twilioConfigured,
    function: 'Netlify Function',
    status: validation.isValid ? 'HEALTHY' : 'MISCONFIGURED',
    configSummary: validation.summary,
    platform: envInfo.platform,
    region: envInfo.region,
    envDebug: envDebug
  };
  
  return {
    statusCode: validation.isValid ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(healthcheck, null, 2)
  };
};