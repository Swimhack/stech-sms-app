# 🐳 SMS App Docker Deployment - Complete Guide

## 🚀 One-Command Deployment

```bash
# Make script executable and run
chmod +x docker-run.sh
./docker-run.sh
```

This will:
1. Build the Docker image
2. Stop any existing containers
3. Start the new container with proper configuration
4. Test the health endpoint
5. Display access URLs and management commands

## 📋 Prerequisites

- Docker installed and running
- Port 8080 available
- 512MB+ available RAM

## 🛠️ Manual Deployment Steps

### 1. Build the Image
```bash
docker build -t sms-app:latest .
```

### 2. Run the Container
```bash
docker run -d \
  --name sms-app-container \
  --restart unless-stopped \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e TWILIO_ACCOUNT_SID=your_twilio_account_sid \
  -e TWILIO_AUTH_TOKEN=your_twilio_auth_token \
  -e TWILIO_PHONE_NUMBER=your_twilio_phone_number \
  -e ADMIN_KEY=sms-app-admin-2025 \
  -e LOG_ACCESS_SECRET=sms-log-secret-2025-secure \
  sms-app:latest
```

### 3. Verify Deployment
```bash
# Check container status
docker ps

# Test health endpoint
curl http://localhost:8080/health

# View logs
docker logs sms-app-container
```

## 🌐 Application Access Points

After deployment, access your SMS app at:

- **Main Application:** http://localhost:8080
- **SMS Interface:** http://localhost:8080 (send SMS messages)
- **Health Check:** http://localhost:8080/health
- **Diagnostics:** http://localhost:8080/diagnostics  
- **Logs Viewer:** http://localhost:8080/logs.html
- **API Logs (JSON):** http://localhost:8080/.netlify/functions/logs

## 🔧 Container Management

### View Real-time Logs
```bash
docker logs -f sms-app-container
```

### Restart Container
```bash
docker restart sms-app-container
```

### Stop Container
```bash
docker stop sms-app-container
```

### Remove Container
```bash
docker rm -f sms-app-container
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./docker-run.sh
```

## ☁️ Cloud Deployment Options

### Option 1: Google Cloud Run
```bash
# Build and tag for Google Container Registry
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
  --memory 1Gi \
  --max-instances 10
```

### Option 2: AWS ECS Fargate
```bash
# Create ECR repository
aws ecr create-repository --repository-name sms-app

# Get login token and login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag sms-app:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sms-app:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sms-app:latest

# Create ECS task definition and service (via AWS Console or CLI)
```

### Option 3: Digital Ocean App Platform
```bash
# Create app.yaml configuration file
# Deploy via Digital Ocean App Platform with container source
```

### Option 4: Heroku Container Registry
```bash
# Login to Heroku container registry
heroku container:login

# Create app
heroku create your-sms-app-name

# Set environment variables
heroku config:set NODE_ENV=production -a your-sms-app-name

# Build and push
heroku container:push web -a your-sms-app-name
heroku container:release web -a your-sms-app-name
```

## 🔍 Testing SMS Functionality

Once deployed, test SMS functionality:

### 1. Check Configuration
```bash
curl http://localhost:8080/health
# Should show: "twilioConfigured": true
```

### 2. Send Test SMS
```bash
curl -X POST http://localhost:8080/send-sms \
  -H "Content-Type: application/json" \
  -d '{"to":"+1234567890","message":"Hello from Docker!"}'
```

### 3. View Logs  
```bash
# Via container logs
docker logs sms-app-container

# Via web interface
# Open: http://localhost:8080/logs.html
```

## ✅ Verification Checklist

- [ ] Docker container is running (`docker ps`)
- [ ] Health check returns 200 OK
- [ ] Web interface loads at http://localhost:8080
- [ ] SMS endpoint accepts requests
- [ ] Configuration shows Twilio as configured
- [ ] Logs are accessible and updating

## 🚨 Troubleshooting

### Container Won't Start
```bash
# Check Docker logs
docker logs sms-app-container

# Verify port availability
sudo netstat -tlnp | grep :8080

# Check Docker daemon
docker info
```

### SMS Not Working
1. **Check health endpoint:** `curl http://localhost:8080/health`
2. **Verify configuration:** Should show `"twilioConfigured": true`
3. **Check environment variables:** `docker exec sms-app-container env`
4. **Review logs:** `docker logs sms-app-container -f`

### Performance Issues
```bash
# Check resource usage
docker stats sms-app-container

# Increase memory if needed
docker run --memory="1g" ...
```

## 📊 Production Recommendations

### Resource Allocation
- **Memory:** 1GB minimum for production
- **CPU:** 0.5 vCPU minimum  
- **Storage:** 2GB for logs and temporary files

### Security
- Run behind reverse proxy (nginx, Traefik)
- Use HTTPS in production
- Set up log rotation
- Regular security updates

### Monitoring
- Set up health check monitoring
- Log aggregation (ELK stack, Splunk)
- Application performance monitoring
- Container resource monitoring

### Backup & Recovery
- Regular database backups (if using external DB)
- Container image versioning
- Configuration backup
- Disaster recovery plan

## 🎯 Success Criteria

Your SMS app is successfully deployed when:

1. ✅ Container is running and healthy
2. ✅ Web interface is accessible
3. ✅ Health endpoint returns OK
4. ✅ SMS messages can be sent
5. ✅ Logs are being generated
6. ✅ All endpoints respond correctly

**Your SMS app is now ready to use! 🎉**