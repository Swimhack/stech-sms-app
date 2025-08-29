# SMS Messaging Application - Project Instructions

## Project Overview
This is a production-ready SMS messaging application built with Node.js, Express, Twilio, and comprehensive logging. The application provides SMS sending/receiving capabilities with multi-platform deployment support including Netlify serverless functions, Docker containers, and cloud platforms.

## Important Instructions
- Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal.
- ALWAYS prefer editing an existing file to creating a new one.
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested.
- Prioritize security and proper error handling in all implementations.

## Project Architecture
- **Backend:** Node.js with Express.js server (traditional) + Netlify Functions (serverless)
- **SMS Integration:** Twilio API for sending/receiving SMS messages
- **Logging:** Comprehensive structured logging with secure web-accessible endpoints
- **Deployment:** Multi-platform support (Netlify, Fly.io, Docker containers, Cloud platforms)
- **Frontend:** Vanilla HTML/CSS/JavaScript for maximum compatibility

## Core Configuration

### Twilio Integration
- **Account SID:** [Configured via environment variables]
- **Auth Token:** [Configured via environment variables]
- **Phone Number:** [Configured via environment variables]
- **Webhook URL:** `https://stech-sms-app.netlify.app/.netlify/functions/webhook-sms`

### Environment Variables Setup
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
NODE_ENV=production
ADMIN_KEY=sms-app-admin-2025
LOG_ACCESS_SECRET=sms-log-secret-2025-secure
PORT=8080
```

## Application Structure

### Core Endpoints
- **Web UI:** `/` - Main application interface
- **Send SMS:** `POST /send-sms` - Send SMS messages via API
- **Webhook:** `POST /webhook/sms` - Receive SMS messages from Twilio
- **Messages:** `GET /messages` - Retrieve message history
- **Health Check:** `GET /health` - Application health status
- **Metrics:** `GET /metrics` - Application performance metrics

### Netlify Functions
- `netlify/functions/send-sms.js` - SMS sending serverless function
- `netlify/functions/webhook-sms.js` - SMS webhook handler
- `netlify/functions/health.js` - Health check endpoint
- `netlify/functions/messages.js` - Message history retrieval
- `netlify/functions/logs.js` - **LOG ACCESS ENDPOINT** 
- `netlify/functions/log-token.js` - **LOG TOKEN GENERATOR**

## Agent Logging Access System

### Critical Agent Integration Points

#### 1. Log Token Generation
**Endpoint:** `https://stech-sms-app.netlify.app/.netlify/functions/log-token`
**Method:** GET
**Parameters:**
- `admin_key=sms-app-admin-2025`

**Response:**
```json
{
  "success": true,
  "token": "signed_hex_token",
  "timestamp": "1693123456789",
  "expiresAt": "2025-08-29T03:30:00Z",
  "urls": {
    "json": "https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP",
    "html": "https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP&format=html",
    "text": "https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP&format=text"
  }
}
```

#### 2. Agent-Friendly Log Access
**Primary URL for Agents:**
```
https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP&format=text&level=ERROR&limit=100
```

**Query Parameters for Agents:**
- `format=text` - Plain text format for agent parsing
- `level=ERROR` - Filter critical issues only
- `limit=50` - Limit entries for focused analysis
- `search=undefined` - Search for specific error patterns
- `requestId=req-123` - Track specific request flows

## Security Architecture

### Authentication Layers
1. **Admin Key Protection:** Prevents unauthorized token generation
2. **HMAC Token Signing:** Cryptographically secure log access tokens
3. **Time-based Expiration:** Tokens expire after 1 hour
4. **IP Logging:** All access attempts are logged
5. **Data Sanitization:** Phone numbers masked, PII redacted

### Token Security Model
```javascript
// Token Generation (HMAC-SHA256)
token = HMAC-SHA256(timestamp, LOG_ACCESS_SECRET)

// Token Validation
isValid = crypto.timingSafeEqual(
  Buffer.from(receivedToken, 'hex'),
  Buffer.from(expectedToken, 'hex')
) && (now - timestamp) < 3600000
```

## Deployment Configuration

### Live Deployment
- **Primary URL:** https://stech-sms-app.netlify.app/
- **Platform:** Netlify Functions (Serverless)
- **Auto-deployment:** GitHub Actions CI/CD pipeline
- **Container Support:** Docker multi-stage build available

### Container Deployment Options
- **Fly.io:** `flyctl deploy -a stech-sms`
- **Google Cloud Run:** `./deploy-cloudrun.sh`
- **Local Docker:** `docker-compose up`
- **AWS/Azure:** Container registry available

### GitHub Repository
- **URL:** https://github.com/Swimhack/stech-sms-app
- **Branch:** main
- **CI/CD:** Automated testing, building, and deployment

## Logging System Specifications

### Log Structure
```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "level": "ERROR|WARN|INFO|DEBUG",
  "message": "Human readable message",
  "data": {
    "structured": "data",
    "requestId": "tracking-id"
  },
  "requestId": "request-correlation-id",
  "environment": "production|development",
  "function": "function-name"
}
```

### Log Levels
- **ERROR:** Critical failures requiring immediate attention
- **WARN:** Potential issues that may need investigation
- **INFO:** Normal operational events and successful operations
- **DEBUG:** Detailed tracing for troubleshooting

### Agent Access Patterns
```bash
# Get fresh token
curl "https://stech-sms-app.netlify.app/.netlify/functions/log-token?admin_key=sms-app-admin-2025"

# Access logs for analysis
curl "https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP&format=text&level=ERROR"
```

## Error Handling & Common Issues

### "undefined" Error Root Causes
1. **Missing Request Body:** Client not sending POST data properly
2. **Invalid JSON:** Malformed request body structure
3. **Missing Fields:** Required 'to' and 'message' fields not provided
4. **Environment Variables:** Twilio credentials not properly configured

### Diagnostic Approach
1. Generate log token using admin key
2. Access error logs with level=ERROR filter
3. Look for requestId correlation in logs
4. Check environment variable validation logs
5. Verify Twilio API responses

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Run locally
npm run dev

# Test with Docker
docker-compose up
```

### Production Deployment
```bash
# Via GitHub (triggers CI/CD)
git push origin main

# Manual Netlify
netlify deploy --prod

# Container deployment
docker build -t sms-app . && docker run -p 3000:8080 sms-app
```

## Best Practices

### For Agents
- Always use the log token endpoint before accessing logs
- Use text format for easier parsing in prompts
- Filter by ERROR level for focused troubleshooting
- Include requestId in analysis for request tracing
- Mask sensitive data when sharing logs

### For Development
- Implement proper error handling with detailed logging
- Use request correlation IDs for tracing
- Sanitize all logged data to prevent PII exposure
- Test logging endpoints regularly
- Monitor log retention and rotation

### For Production
- Rotate admin keys regularly
- Monitor log access patterns
- Set up alerts for critical errors
- Backup important logs externally
- Use HTTPS for all log access

## Critical File Locations

### Configuration Files
- `/netlify.toml` - Netlify deployment configuration
- `/package.json` - Dependencies and build scripts
- `/Dockerfile` - Container build instructions
- `/docker-compose.yml` - Local development stack

### Core Application Files
- `/server.js` - Traditional Express server
- `/public/index.html` - Web interface
- `/lib/logger.js` - **Logging system core**
- `/netlify/functions/` - **Serverless function implementations**

### Documentation
- `/LOGGING_GUIDE.md` - Comprehensive logging documentation
- `/CONTAINER_DEPLOYMENT.md` - Container deployment guide
- `/NETLIFY_SETUP.md` - Netlify-specific setup instructions

## Agent Integration Examples

### Error Analysis Prompt
```
Analyze these application logs for the SMS app and identify root cause:

[Fetch logs from: https://stech-sms-app.netlify.app/.netlify/functions/logs?token=TOKEN&timestamp=TIMESTAMP&format=text&level=ERROR&limit=20]

Focus on "undefined" errors in SMS sending functionality.
```

### Health Check Integration
```
Monitor application health using:
https://stech-sms-app.netlify.app/.netlify/functions/health

Expected response includes:
- Twilio configuration status
- Uptime information  
- Environment validation
```

## Security Notes
- **NEVER** commit the ADMIN_KEY to version control
- **ALWAYS** use environment variables for secrets in production
- **ROTATE** access keys regularly
- **MONITOR** log access patterns for anomalies
- **SANITIZE** all logged data to prevent information disclosure