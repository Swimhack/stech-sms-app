const twilio = require('twilio');
const logger = require('../../lib/logger');
const crypto = require('crypto');

let messageHistory = global.messageHistory || [];
global.messageHistory = messageHistory;

exports.handler = async (event, context) => {
  const requestId = crypto.randomUUID();
  
  logger.info('SMS send request received', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    queryStringParameters: event.queryStringParameters
  }, requestId);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    logger.warn('Invalid HTTP method', { method: event.httpMethod }, requestId);
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed', requestId })
    };
  }

  // Validate environment variables
  const requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Missing environment variables', { missingVars }, requestId);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Server configuration error',
        error: `Missing environment variables: ${missingVars.join(', ')}`,
        requestId
      })
    };
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    // Validate request body
    if (!event.body) {
      logger.error('Empty request body', {}, requestId);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Empty request body',
          requestId
        })
      };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      logger.error('Invalid JSON in request body', { 
        body: event.body,
        parseError: parseError.message 
      }, requestId);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body',
          error: parseError.message,
          requestId
        })
      };
    }

    const { to, message } = parsedBody;
    
    // Validate required fields
    if (!to || !message) {
      logger.error('Missing required fields', { 
        hasTo: !!to, 
        hasMessage: !!message,
        receivedFields: Object.keys(parsedBody)
      }, requestId);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: to and message are required',
          requestId
        })
      };
    }

    logger.info('Sending SMS via Twilio', {
      to: to.replace(/\d(?=\d{4})/g, '*'), // Mask phone number for security
      messageLength: message.length,
      from: process.env.TWILIO_PHONE_NUMBER
    }, requestId);
    
    const twilioMessage = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    const messageRecord = {
      id: twilioMessage.sid,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message,
      direction: 'outbound',
      timestamp: new Date().toISOString(),
      status: twilioMessage.status,
      requestId
    };

    messageHistory.push(messageRecord);
    logger.info('SMS sent successfully', {
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
      totalMessages: messageHistory.length
    }, requestId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'SMS sent successfully',
        data: messageRecord
      })
    };
  } catch (error) {
    logger.error('Error sending SMS', {
      errorMessage: error.message,
      errorCode: error.code,
      errorStatus: error.status,
      stack: error.stack
    }, requestId);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to send SMS',
        error: error.message,
        requestId
      })
    };
  }
};