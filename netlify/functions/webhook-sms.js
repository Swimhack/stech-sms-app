const twilio = require('twilio');
const logger = require('../../lib/logger');
const crypto = require('crypto');

let messageHistory = global.messageHistory || [];
global.messageHistory = messageHistory;

exports.handler = async (event, context) => {
  const requestId = crypto.randomUUID();
  
  logger.info('Webhook request received', {
    httpMethod: event.httpMethod,
    contentType: event.headers['content-type'],
    bodyLength: event.body ? event.body.length : 0
  }, requestId);

  if (event.httpMethod !== 'POST') {
    logger.warn('Invalid HTTP method for webhook', { method: event.httpMethod }, requestId);
    return {
      statusCode: 405,
      body: 'Method not allowed'
    };
  }

  try {
    const params = new URLSearchParams(event.body || '');
    const messageData = {
      From: params.get('From'),
      To: params.get('To'),
      Body: params.get('Body'),
      MessageSid: params.get('MessageSid'),
      MessageStatus: params.get('MessageStatus'),
      SmsStatus: params.get('SmsStatus')
    };

    logger.info('SMS webhook received', {
      from: messageData.From ? messageData.From.replace(/\d(?=\d{4})/g, '*') : null,
      to: messageData.To,
      messageSid: messageData.MessageSid,
      status: messageData.MessageStatus || messageData.SmsStatus,
      bodyLength: messageData.Body ? messageData.Body.length : 0
    }, requestId);

    // Store incoming message
    if (messageData.MessageSid && messageData.From && messageData.Body) {
      const messageRecord = {
        id: messageData.MessageSid,
        to: messageData.To,
        from: messageData.From,
        body: messageData.Body,
        direction: 'inbound',
        timestamp: new Date().toISOString(),
        status: 'received',
        requestId
      };

      messageHistory.push(messageRecord);
      logger.info('Inbound message stored', {
        messageSid: messageData.MessageSid,
        totalMessages: messageHistory.length
      }, requestId);
    }

    const twiml = new twilio.twiml.MessagingResponse();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/xml'
      },
      body: twiml.toString()
    };
  } catch (error) {
    logger.error('Error processing webhook', {
      errorMessage: error.message,
      stack: error.stack,
      body: event.body
    }, requestId);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/xml'
      },
      body: '<Response></Response>'
    };
  }
};