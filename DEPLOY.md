# Deploy to stech-sms.fly.dev

## 1. Install Fly CLI (if not already installed)
```bash
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"
```

## 2. Authenticate with Fly.io
```bash
flyctl auth login
```

## 3. Create or connect to the app
```bash
flyctl apps create stech-sms
# OR if app already exists:
flyctl apps list
```

## 4. Set environment variables
```bash
flyctl secrets set TWILIO_ACCOUNT_SID="your_twilio_account_sid" -a stech-sms
flyctl secrets set TWILIO_AUTH_TOKEN="your_twilio_auth_token" -a stech-sms  
flyctl secrets set TWILIO_PHONE_NUMBER="your_twilio_phone_number" -a stech-sms
```

## 5. Deploy the application
```bash
flyctl deploy -a stech-sms
```

## 6. Verify deployment
```bash
flyctl status -a stech-sms
flyctl logs -a stech-sms
```

## 7. Configure Twilio Webhook
Once deployed, set your Twilio webhook URL to:
`https://stech-sms.fly.dev/webhook/sms`

## Your live app will be available at:
https://stech-sms.fly.dev

## Troubleshooting
- Check logs: `flyctl logs -a stech-sms`
- Scale app: `flyctl scale count 1 -a stech-sms`
- Restart: `flyctl apps restart stech-sms`