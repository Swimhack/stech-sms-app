#!/bin/bash

# SMS App Docker Deployment Script
echo "🐳 SMS App Docker Deployment"
echo "============================="

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t sms-app:latest .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Stop existing container if running
echo "🔄 Stopping existing container..."
docker stop sms-app-container 2>/dev/null || true
docker rm sms-app-container 2>/dev/null || true

# Run the container
echo "🚀 Starting SMS app container..."
docker run -d \
    --name sms-app-container \
    --restart unless-stopped \
    -p 8080:8080 \
    -e NODE_ENV=production \
    -e PORT=8080 \
    -e TWILIO_ACCOUNT_SID=your_twilio_account_sid \
    -e TWILIO_AUTH_TOKEN=your_twilio_auth_token \
    -e TWILIO_PHONE_NUMBER=your_twilio_phone_number \
    -e ADMIN_KEY=sms-app-admin-2025 \
    -e LOG_ACCESS_SECRET=sms-log-secret-2025-secure \
    sms-app:latest

if [ $? -eq 0 ]; then
    echo "✅ SMS app deployed successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Main App:      http://localhost:8080"
    echo "   Health Check:  http://localhost:8080/health"
    echo "   Logs:          http://localhost:8080/logs.html"
    echo ""
    echo "📊 Container Status:"
    docker ps --filter name=sms-app-container
    echo ""
    echo "📝 Container Logs:"
    echo "   docker logs sms-app-container"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   Stop:    docker stop sms-app-container"
    echo "   Restart: docker restart sms-app-container"
    echo "   Remove:  docker rm -f sms-app-container"
    echo ""
    
    # Wait a moment for app to start, then test health
    echo "⏳ Testing application health..."
    sleep 5
    
    HEALTH_RESPONSE=$(curl -s http://localhost:8080/health 2>/dev/null || echo "Connection failed")
    echo "🏥 Health Check Response:"
    echo "$HEALTH_RESPONSE" | head -10
    
else
    echo "❌ Failed to start container!"
    exit 1
fi