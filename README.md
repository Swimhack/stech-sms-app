# SMS Messaging App

A simple SMS messaging application built with Node.js, Express, and Twilio.

## Features

- Send SMS messages to any phone number
- Receive SMS replies via webhook
- View message history with sent/received status
- Real-time message updates
- Clean, responsive web interface

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token  
TWILIO_PHONE_NUMBER=your_twilio_phone_number
PORT=3000
```

3. Start the application:
```bash
npm start
```

4. Open http://localhost:3000 in your browser

## Webhook Configuration

To receive SMS replies, configure your Twilio phone number webhook URL to:
`http://your-domain.com/webhook/sms`

For local development, you can use ngrok:
```bash
ngrok http 3000
```
Then set the webhook URL to: `https://your-ngrok-url.ngrok.io/webhook/sms`

## API Endpoints

- `POST /send-sms` - Send an SMS message
- `POST /webhook/sms` - Receive SMS webhook from Twilio  
- `GET /messages` - Get message history
- `GET /` - Web interface

## Usage

1. Enter a phone number (include country code, e.g., +1234567890)
2. Type your message
3. Click "Send Message"
4. View sent messages and replies in the message history below