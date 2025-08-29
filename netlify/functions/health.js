const config = require('../../lib/config');

exports.handler = async (event, context) => {
  const validation = config.validate();
  const envInfo = config.getEnvironmentInfo();
  
  const healthcheck = {
    uptime: process.uptime(),
    message: validation.isValid ? 'OK' : 'CONFIGURATION_ERROR',
    timestamp: Date.now(),
    environment: envInfo.nodeEnv,
    twilioConfigured: validation.twilioConfigured,
    function: 'Netlify Function',
    status: validation.isValid ? 'HEALTHY' : 'MISCONFIGURED',
    configSummary: validation.summary,
    platform: envInfo.platform,
    region: envInfo.region
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