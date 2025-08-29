const twilio = require('twilio');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method not allowed'
    };
  }

  const params = new URLSearchParams(event.body);
  const messageData = {
    From: params.get('From'),
    To: params.get('To'),
    Body: params.get('Body'),
    MessageSid: params.get('MessageSid')
  };

  console.log('Received SMS:', messageData);

  const twiml = new twilio.twiml.MessagingResponse();
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml'
    },
    body: twiml.toString()
  };
};