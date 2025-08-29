# Container Deployment Guide

## Overview
This SMS application is fully containerized and can be deployed to multiple cloud platforms using Docker.

## Features
- 🔒 **Security**: Multi-stage build, non-root user, minimal attack surface
- 🏥 **Health Checks**: Built-in health and metrics endpoints
- 📊 **Monitoring**: Application metrics and performance data
- 🚀 **CI/CD**: Automated builds and deployments via GitHub Actions
- 🌍 **Multi-Platform**: Deploy to Fly.io, Google Cloud Run, AWS, Azure

## Quick Start

### Local Development with Docker

1. **Build and run locally:**
```bash
# Using Docker directly
docker build -t sms-app .
docker run -p 3000:8080 --env-file .env sms-app

# Using Docker Compose
docker-compose up
```

2. **Access the application:**
- Web UI: http://localhost:3000
- Health: http://localhost:3000/health
- Metrics: http://localhost:3000/metrics

### Production Deployment Options

## 1. Fly.io Deployment

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl auth login
flyctl deploy -a stech-sms

# Set secrets
flyctl secrets set TWILIO_ACCOUNT_SID="your_sid" -a stech-sms
flyctl secrets set TWILIO_AUTH_TOKEN="your_token" -a stech-sms
flyctl secrets set TWILIO_PHONE_NUMBER="your_number" -a stech-sms
```

**Live URL:** https://stech-sms.fly.dev

## 2. Google Cloud Run

```bash
# Configure project
export PROJECT_ID="your-project-id"
export TWILIO_ACCOUNT_SID="your_sid"
export TWILIO_AUTH_TOKEN="your_token"
export TWILIO_PHONE_NUMBER="your_number"

# Deploy
./deploy-cloudrun.sh
```

**Features:**
- Auto-scaling from 0 to 10 instances
- Serverless pricing (pay per request)
- Automatic HTTPS
- Secret Manager integration

## 3. AWS App Runner

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account].dkr.ecr.us-east-1.amazonaws.com
docker build -t sms-app .
docker tag sms-app:latest [account].dkr.ecr.us-east-1.amazonaws.com/sms-app:latest
docker push [account].dkr.ecr.us-east-1.amazonaws.com/sms-app:latest

# Create App Runner service via console or CLI
```

## 4. Azure Container Instances

```bash
# Create resource group
az group create --name sms-app-rg --location eastus

# Create container instance
az container create \
  --resource-group sms-app-rg \
  --name sms-app \
  --image ghcr.io/swimhack/stech-sms-app:latest \
  --dns-name-label stech-sms \
  --ports 8080 \
  --environment-variables \
    NODE_ENV=production \
  --secure-environment-variables \
    TWILIO_ACCOUNT_SID="your_sid" \
    TWILIO_AUTH_TOKEN="your_token" \
    TWILIO_PHONE_NUMBER="your_number"
```

## Container Registry

The application images are available at:
- GitHub Container Registry: `ghcr.io/swimhack/stech-sms-app:latest`
- Docker Hub: `docker pull swimhack/sms-app:latest` (if published)

## Environment Variables

Required environment variables for all deployments:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
PORT=8080  # Optional, defaults to 8080
NODE_ENV=production  # Optional, for production deployments
```

## Health Monitoring

All deployments include health check endpoints:

- **Health Check:** `/health` - Returns application status
- **Metrics:** `/metrics` - Returns usage statistics

Example health check response:
```json
{
  "uptime": 3600,
  "message": "OK",
  "timestamp": 1234567890,
  "environment": "production",
  "twilioConfigured": true
}
```

## CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Runs tests on pull requests
2. Builds multi-platform Docker images
3. Pushes to GitHub Container Registry
4. Deploys to Fly.io (on main branch)
5. Runs security scans with Trivy

### Setting up CI/CD

1. Add secrets to GitHub repository:
   - `FLY_API_TOKEN` - Your Fly.io API token
   - Twilio credentials (if not using platform secrets)

2. Push to main branch to trigger deployment

## Security Best Practices

✅ **Implemented Security Features:**
- Non-root user execution
- Multi-stage builds for smaller attack surface
- Health checks for container orchestration
- Proper signal handling (SIGTERM)
- Secret management via platform services
- Vulnerability scanning in CI/CD

## Performance Optimization

- **Image Size:** ~50MB (Alpine-based)
- **Cold Start:** <2 seconds
- **Memory Usage:** ~50-100MB
- **CPU:** Minimal, scales based on load

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs <container_id>

# Verify environment variables
docker exec <container_id> env

# Test health endpoint
curl http://localhost:8080/health
```

### Deployment fails
```bash
# Fly.io
flyctl logs -a stech-sms

# Cloud Run
gcloud run logs read --service sms-app

# Local
docker-compose logs -f
```

## Advanced Configuration

### Custom nginx proxy (production-like setup)
```bash
docker-compose --profile production up
```

### Build for multiple architectures
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t sms-app:multi .
```

### Run with resource limits
```bash
docker run -p 3000:8080 \
  --memory="256m" \
  --cpus="0.5" \
  --env-file .env \
  sms-app
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/Swimhack/stech-sms-app/issues
- Health Check: https://stech-sms.fly.dev/health