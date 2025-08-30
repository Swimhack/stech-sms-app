require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let messageHistory = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;

  try {
    const config = require('./lib/config');
    const twilioConfig = config.getTwilioConfig();
    const twilio = require('twilio');
    const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

    const twilioMessage = await client.messages.create({
      body: message,
      from: twilioConfig.phoneNumber,
      to: to
    });

    const messageRecord = {
      id: twilioMessage.sid,
      to: to,
      from: twilioConfig.phoneNumber,
      body: message,
      direction: 'outbound',
      timestamp: new Date().toISOString(),
      status: twilioMessage.status
    };

    messageHistory.push(messageRecord);

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: messageRecord
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending SMS',
      error: error.message
    });
  }
});

app.post('/webhook/sms', (req, res) => {
  const { From, To, Body, MessageSid } = req.body;

  const messageRecord = {
    id: MessageSid,
    to: To,
    from: From,
    body: Body,
    direction: 'inbound',
    timestamp: new Date().toISOString(),
    status: 'received'
  };

  messageHistory.push(messageRecord);
  console.log('Received SMS:', messageRecord);

  res.status(200).send('OK');
});

app.get('/messages', (req, res) => {
  res.json({
    success: true,
    messages: messageHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  });
});

app.get('/health', (req, res) => {
  const config = require('./lib/config');
  const validation = config.validate();
  
  const healthcheck = {
    uptime: process.uptime(),
    message: validation.isValid ? 'OK' : 'CONFIGURATION_ERROR',
    timestamp: Date.now(),
    environment: config.get('NODE_ENV'),
    twilioConfigured: validation.twilioConfigured,
    status: validation.isValid ? 'HEALTHY' : 'MISCONFIGURED',
    configSummary: validation.summary
  };
  
  try {
    res.status(validation.isValid ? 200 : 500).json(healthcheck);
  } catch (error) {
    healthcheck.message = error.message;
    res.status(503).json(healthcheck);
  }
});

app.get('/metrics', (req, res) => {
  res.json({
    messagesSent: messageHistory.filter(m => m.direction === 'outbound').length,
    messagesReceived: messageHistory.filter(m => m.direction === 'inbound').length,
    totalMessages: messageHistory.length,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: Date.now()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(port, () => {
  const config = require('./lib/config');
  console.log(`🚀 SMS app listening at http://localhost:${port}`);
  console.log(`📱 Twilio phone number: ${config.get('TWILIO_PHONE_NUMBER') || 'Not configured'}`);
  console.log(`🌍 Environment: ${config.get('NODE_ENV') || 'development'}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Configuration: ${config.validate().isValid ? 'READY' : 'NEEDS_SETUP'}`);
});