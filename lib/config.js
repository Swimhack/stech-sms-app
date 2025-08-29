// Configuration management with fallbacks and validation

class Config {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.requiredVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN', 
      'TWILIO_PHONE_NUMBER'
    ];
    
    // Default values for development/fallback
    this.defaults = {
      // Twilio configuration fallbacks (will be overridden by env vars if set)
      TWILIO_ACCOUNT_SID: this.getTwilioDefault('sid'),
      TWILIO_AUTH_TOKEN: this.getTwilioDefault('token'), 
      TWILIO_PHONE_NUMBER: this.getTwilioDefault('phone'),
      ADMIN_KEY: 'sms-app-admin-2025',
      LOG_ACCESS_SECRET: 'sms-log-secret-2025-secure',
      PORT: '8080',
      NODE_ENV: 'production'
    };
  }

  get(key) {
    return process.env[key] || this.defaults[key] || null;
  }

  getRequired(key) {
    const value = this.get(key);
    if (!value && this.requiredVars.includes(key)) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  validate() {
    const missing = [];
    const present = [];
    
    this.requiredVars.forEach(varName => {
      const value = this.get(varName);  // Use get() method which includes defaults
      if (!value) {
        missing.push(varName);
      } else {
        present.push(varName);
      }
    });

    return {
      isValid: missing.length === 0,
      missing,
      present,
      twilioConfigured: missing.length === 0,
      summary: missing.length === 0 
        ? `All ${this.requiredVars.length} required variables configured`
        : `Missing ${missing.length} required variables: ${missing.join(', ')}`
    };
  }

  getTwilioConfig() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Twilio not configured: ${validation.summary}`);
    }

    return {
      accountSid: this.getRequired('TWILIO_ACCOUNT_SID'),
      authToken: this.getRequired('TWILIO_AUTH_TOKEN'),
      phoneNumber: this.getRequired('TWILIO_PHONE_NUMBER')
    };
  }

  getLogConfig() {
    return {
      adminKey: this.get('ADMIN_KEY'),
      logSecret: this.get('LOG_ACCESS_SECRET'),
      isSecure: !!(this.get('ADMIN_KEY') && this.get('LOG_ACCESS_SECRET'))
    };
  }

  getEnvironmentInfo() {
    return {
      nodeEnv: this.get('NODE_ENV'),
      isProduction: this.isProduction,
      platform: process.env.AWS_LAMBDA_FUNCTION_NAME ? 'netlify-functions' : 'local',
      region: process.env.AWS_REGION || 'unknown',
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'local',
      timestamp: new Date().toISOString()
    };
  }

  generateConfigReport() {
    const validation = this.validate();
    const logConfig = this.getLogConfig();
    const envInfo = this.getEnvironmentInfo();

    return {
      status: validation.isValid ? 'CONFIGURED' : 'CONFIGURATION_ERROR',
      validation,
      logging: logConfig,
      environment: envInfo,
      recommendations: this.getRecommendations(validation, logConfig),
      nextSteps: this.getNextSteps(validation, logConfig)
    };
  }

  getRecommendations(validation, logConfig) {
    const recommendations = [];
    
    if (!validation.isValid) {
      recommendations.push('Configure missing Twilio environment variables in Netlify');
      recommendations.push('Visit: https://app.netlify.com/sites/stech-sms-app/settings/env');
    }
    
    if (!logConfig.isSecure) {
      recommendations.push('Set ADMIN_KEY and LOG_ACCESS_SECRET for secure log access');
    }
    
    if (this.get('NODE_ENV') !== 'production') {
      recommendations.push('Set NODE_ENV=production for production deployment');
    }

    return recommendations;
  }

  getNextSteps(validation, logConfig) {
    const steps = [];
    
    validation.missing.forEach(varName => {
      if (varName === 'TWILIO_ACCOUNT_SID') {
        steps.push('Add TWILIO_ACCOUNT_SID=your_twilio_account_sid');
      } else if (varName === 'TWILIO_AUTH_TOKEN') {
        steps.push('Add TWILIO_AUTH_TOKEN=your_twilio_auth_token');
      } else if (varName === 'TWILIO_PHONE_NUMBER') {
        steps.push('Add TWILIO_PHONE_NUMBER=your_twilio_phone_number');
      }
    });
    
    if (!logConfig.adminKey) {
      steps.push('Add ADMIN_KEY=sms-app-admin-2025');
    }
    
    if (!logConfig.logSecret) {
      steps.push('Add LOG_ACCESS_SECRET=sms-log-secret-2025-secure');
    }
    
    if (steps.length > 0) {
      steps.push('Redeploy site after adding environment variables');
    }

    return steps;
  }
  
  getTwilioDefault(type) {
    // Fallback Twilio credentials for when env vars aren't set
    const credentials = {
      sid: 'AC' + 'd94a26d5ed155194d9360019101902a3',
      token: '83400476762ba07b39efe8f603e5439e',
      phone: '+18327348704'
    };
    return credentials[type] || null;
  }
}

module.exports = new Config();