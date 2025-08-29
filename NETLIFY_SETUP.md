# Netlify Deployment Setup

## Quick Setup

Your SMS app is configured to deploy to Netlify at: https://stech-sms-app.netlify.app/

## 1. Connect GitHub to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Import an existing project"
3. Choose "Deploy with GitHub"
4. Select the repository: `Swimhack/stech-sms-app`
5. Configure build settings:
   - Build command: `npm run build:netlify`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

## 2. Environment Variables

Add these in Netlify Dashboard → Site Settings → Environment Variables:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token  
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## 3. GitHub Secrets (for CI/CD)

Add these secrets to your GitHub repository:

1. **NETLIFY_AUTH_TOKEN**: Get from Netlify → User Settings → Applications → Personal Access Tokens
2. **NETLIFY_SITE_ID**: Get from Netlify → Site Settings → Site Information

## 4. Webhook Configuration

Update your Twilio webhook URL to:
```
https://stech-sms-app.netlify.app/.netlify/functions/webhook-sms
```

## API Endpoints

After deployment, your endpoints will be:

- **Send SMS**: `POST https://stech-sms-app.netlify.app/.netlify/functions/send-sms`
- **Webhook**: `POST https://stech-sms-app.netlify.app/.netlify/functions/webhook-sms`
- **Messages**: `GET https://stech-sms-app.netlify.app/.netlify/functions/messages`
- **Health**: `GET https://stech-sms-app.netlify.app/.netlify/functions/health`

## Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=public --functions=netlify/functions
```

## Troubleshooting

1. **Build fails**: Check Node version is 18+ in netlify.toml
2. **Functions not working**: Verify environment variables are set
3. **CORS issues**: Functions include CORS headers already

## Architecture Note

Netlify uses serverless functions instead of a traditional Express server. Each endpoint is a separate function that scales automatically.