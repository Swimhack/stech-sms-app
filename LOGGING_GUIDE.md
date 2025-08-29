# 📋 Application Logging System

## Overview
The SMS app now includes a comprehensive logging system that captures all application events, errors, and debug information. Logs are accessible via secure URLs for easy monitoring and debugging.

## 🔍 Accessing Logs

### Step 1: Get Access Token
```bash
# Get a temporary access token (admin key required)
GET https://stech-sms-app.netlify.app/.netlify/functions/log-token?admin_key=your_admin_key
```

### Step 2: View Logs
Use the token from Step 1 to access logs:

```bash
# JSON format (default)
https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP

# HTML format (human-readable)
https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP&format=html

# Text format (agent-friendly)
https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP&format=text
```

## 📊 Log Formats

### JSON Format (Default)
Perfect for programmatic access:
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2025-08-29T02:30:15.123Z",
      "level": "ERROR",
      "message": "Failed to send SMS",
      "data": {
        "errorMessage": "Invalid phone number",
        "requestId": "req-123"
      },
      "requestId": "req-123",
      "environment": "production",
      "function": "send-sms"
    }
  ],
  "meta": {
    "total": 50,
    "level": "all",
    "limit": 100
  }
}
```

### HTML Format
Clean, readable web interface with:
- Color-coded log levels
- Expandable JSON data
- Search functionality
- Real-time timestamps

### Text Format
Agent-friendly format:
```
[2025-08-29T02:30:15.123Z] [ERROR] Failed to send SMS {"errorMessage": "Invalid phone number"}
[2025-08-29T02:30:10.456Z] [INFO] SMS sent successfully {"messageSid": "SM123"}
```

## 🔍 Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `level` | Filter by log level | `level=ERROR` |
| `limit` | Max entries (1-1000) | `limit=50` |
| `format` | Response format | `format=html` |
| `search` | Search in messages/data | `search=SMS` |
| `requestId` | Filter by request ID | `requestId=req-123` |

## 🛡️ Security Features

### Token-Based Authentication
- HMAC-SHA256 signed tokens
- Time-based expiration (1 hour default)
- Rate limiting protection
- IP logging for access attempts

### Data Sanitization
- Phone numbers are masked in logs
- Sensitive environment variables excluded
- Request/response data filtered
- PII redaction automatically applied

### Access Control
- Admin key required for token generation
- Configurable via environment variables:
  - `ADMIN_KEY` - For generating tokens
  - `LOG_ACCESS_SECRET` - For signing tokens

## 🚨 Common Error Scenarios

### "undefined" Error in SMS Sending
**Cause:** Missing or invalid request data
**Log Location:** Look for ERROR level logs with `requestId`
**Example:**
```json
{
  "level": "ERROR",
  "message": "Missing required fields",
  "data": {
    "hasTo": false,
    "hasMessage": true,
    "receivedFields": ["message"]
  }
}
```

### Environment Variable Issues
**Cause:** Missing Twilio credentials
**Log Example:**
```json
{
  "level": "ERROR", 
  "message": "Missing environment variables",
  "data": {
    "missingVars": ["TWILIO_AUTH_TOKEN"]
  }
}
```

### Webhook Processing Errors
**Cause:** Malformed webhook data from Twilio
**Log Example:**
```json
{
  "level": "ERROR",
  "message": "Error processing webhook",
  "data": {
    "errorMessage": "Cannot read property 'From' of null",
    "body": "malformed_data"
  }
}
```

## 🤖 Agent Integration

### For AI Agents
Use the text format for easy parsing:
```
URL: https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP&format=text&limit=50&level=ERROR
```

### Example Agent Prompt
```
Analyze these application logs and identify any issues:

[Retrieved from https://stech-sms-app.netlify.app/.netlify/functions/logs?token=...&format=text&level=ERROR]

[2025-08-29T02:30:15.123Z] [ERROR] Missing required fields {"hasTo": false, "hasMessage": true}
[2025-08-29T02:29:45.789Z] [ERROR] Invalid JSON in request body {"parseError": "Unexpected token"}
```

## 📈 Log Levels

| Level | Usage | Examples |
|-------|-------|----------|
| **ERROR** | Critical failures | SMS send failures, authentication errors |
| **WARN** | Potential issues | Invalid requests, deprecated features |
| **INFO** | Normal operations | SMS sent, webhook received |
| **DEBUG** | Detailed tracing | Request validation, environment checks |

## 🔧 Environment Variables

```env
# Required for production
ADMIN_KEY=secure-admin-key-for-token-generation
LOG_ACCESS_SECRET=secure-secret-for-token-signing

# Optional
NODE_ENV=production
```

## 📱 Mobile-Friendly URLs

All log URLs are mobile-responsive and work great on phones/tablets for quick debugging on the go.

## 🔄 Log Rotation

- Keeps last 1000 log entries automatically
- Older logs are purged to prevent memory issues
- Consider external log aggregation for production

## 🆘 Troubleshooting

### Can't Access Logs
1. Verify admin key is correct
2. Check token hasn't expired (1 hour limit)
3. Ensure environment variables are set

### No Logs Showing
1. Generate some activity (send SMS)
2. Check if functions are running
3. Verify logging system is initialized

### Permission Denied
1. Token may be expired
2. Admin key might be incorrect
3. Check timestamp parameter format