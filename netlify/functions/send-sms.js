const twilio = require('twilio');

let messageHistory = [];

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    const { to, message } = JSON.parse(event.body);
    
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
      status: twilioMessage.status
    };

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
    console.error('Error sending SMS:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to send SMS',
        error: error.message
      })
    };
  }
};