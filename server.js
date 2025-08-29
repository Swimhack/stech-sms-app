require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

let messageHistory = [];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/send-sms', async (req, res) => {
  const { to, message } = req.body;

  try {
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
      message: 'Failed to send SMS',
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

  const twiml = new twilio.twiml.MessagingResponse();
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

app.get('/messages', (req, res) => {
  res.json({
    success: true,
    messages: messageHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  });
});

app.get('/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  };
  
  try {
    res.status(200).json(healthcheck);
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

const server = app.listen(port, () => {
  console.log(`SMS app listening at http://localhost:${port}`);
  console.log(`Twilio phone number: ${process.env.TWILIO_PHONE_NUMBER}`);
  console.log(`Health check available at: http://localhost:${port}/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});