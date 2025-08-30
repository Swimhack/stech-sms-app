# SMS App Docker Deployment Guide

## Quick Start

### Option 1: One-Command Deploy
```bash
./docker-run.sh
```

### Option 2: Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Manual Docker Commands
```bash
# Build image
docker build -t sms-app:latest .

# Run container
docker run -d \
  --name sms-app \
  --restart unless-stopped \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e TWILIO_ACCOUNT_SID=your_account_sid \
  -e TWILIO_AUTH_TOKEN=your_auth_token \
  -e TWILIO_PHONE_NUMBER=your_phone_number \
  sms-app:latest
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `PORT` | `8080` | Server port |
| `TWILIO_ACCOUNT_SID` | *fallback provided* | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | *fallback provided* | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | *fallback provided* | Twilio Phone Number |
| `ADMIN_KEY` | `sms-app-admin-2025` | Admin access key |
| `LOG_ACCESS_SECRET` | `sms-log-secret-2025-secure` | Log access secret |

## Application URLs

Once deployed, the application will be available at:

- **Main App:** http://localhost:8080
- **Health Check:** http://localhost:8080/health  
- **Diagnostics:** http://localhost:8080/diagnostics
- **Logs Viewer:** http://localhost:8080/logs.html
- **API Logs:** http://localhost:8080/.netlify/functions/logs (for compatibility)

## Cloud Deployment

### Deploy to Google Cloud Run

1. **Build and push image:**
```bash
# Tag for Google Container Registry
docker tag sms-app:latest gcr.io/YOUR_PROJECT_ID/sms-app:latest

# Push to registry
docker push gcr.io/YOUR_PROJECT_ID/sms-app:latest

# Deploy to Cloud Run
gcloud run deploy sms-app \
  --image gcr.io/YOUR_PROJECT_ID/sms-app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production,TWILIO_ACCOUNT_SID=your_sid,TWILIO_AUTH_TOKEN=your_token,TWILIO_PHONE_NUMBER=your_number
```

### Deploy to AWS ECS/Fargate

1. **Create ECR repository and push image:**
```bash
# Create repository
aws ecr create-repository --repository-name sms-app

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag sms-app:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/sms-app:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/sms-app:latest
```

2. **Deploy using ECS task definition with environment variables**

### Deploy to Heroku

1. **Using Heroku Container Registry:**
```bash
# Login to Heroku container registry
heroku container:login

# Create Heroku app
heroku create your-sms-app

# Set environment variables
heroku config:set NODE_ENV=production -a your-sms-app
heroku config:set TWILIO_ACCOUNT_SID=your_sid -a your-sms-app
heroku config:set TWILIO_AUTH_TOKEN=your_token -a your-sms-app
heroku config:set TWILIO_PHONE_NUMBER=your_number -a your-sms-app

# Build and push to Heroku
heroku container:push web -a your-sms-app
heroku container:release web -a your-sms-app
```

## Container Management

### View logs
```bash
docker logs sms-app-container -f
```

### Enter container
```bash
docker exec -it sms-app-container sh
```

### Check health
```bash
docker exec sms-app-container node -e "require('http').get('http://localhost:8080/health', r => r.on('data', d => console.log(d.toString())))"
```

### Update container
```bash
# Stop current container
docker stop sms-app-container
docker rm sms-app-container

# Rebuild and run new version
./docker-run.sh
```

## Production Considerations

### Resource Requirements
- **Memory:** 512MB minimum, 1GB recommended
- **CPU:** 0.25 vCPU minimum, 0.5 vCPU recommended
- **Disk:** 1GB for container

### Security
- Container runs as non-root user (`nodejs:1001`)
- No sensitive data in image layers
- Environment variables for configuration
- Health checks enabled

### Monitoring
- Built-in health checks at `/health`
- Application logs via `docker logs`
- Structured logging to stdout
- Log viewer at `/logs.html`

### Scaling
- Stateless application design
- Horizontal scaling supported
- Load balancer compatible
- Session-less architecture

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs sms-app-container

# Check if port is available
sudo netstat -tlnp | grep :8080

# Verify image built correctly
docker images | grep sms-app
```

### Health check failing
```bash
# Test health endpoint manually
curl http://localhost:8080/health

# Check container network
docker network ls
docker inspect sms-app-container
```

### SMS not working
1. Check environment variables: `docker exec sms-app-container env`
2. Test Twilio credentials: Visit `/diagnostics` endpoint
3. Check logs: `docker logs sms-app-container`
4. Verify configuration: Visit `/health` endpoint

### Performance issues
- Increase container memory allocation
- Check container resource usage: `docker stats sms-app-container`
- Review application logs for errors