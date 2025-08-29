#!/bin/bash

# Google Cloud Run Deployment Script
# Prerequisites: gcloud CLI installed and authenticated

set -e

# Configuration
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="stech-sms-app"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying SMS App to Google Cloud Run"
echo "=========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "Setting GCP project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required GCP APIs..."
gcloud services enable cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com

# Create secrets in Secret Manager
echo "Creating secrets in Secret Manager..."
echo -n "$TWILIO_ACCOUNT_SID" | gcloud secrets create twilio-account-sid --data-file=- --replication-policy=automatic 2>/dev/null || \
    echo -n "$TWILIO_ACCOUNT_SID" | gcloud secrets versions add twilio-account-sid --data-file=-

echo -n "$TWILIO_AUTH_TOKEN" | gcloud secrets create twilio-auth-token --data-file=- --replication-policy=automatic 2>/dev/null || \
    echo -n "$TWILIO_AUTH_TOKEN" | gcloud secrets versions add twilio-auth-token --data-file=-

echo -n "$TWILIO_PHONE_NUMBER" | gcloud secrets create twilio-phone-number --data-file=- --replication-policy=automatic 2>/dev/null || \
    echo -n "$TWILIO_PHONE_NUMBER" | gcloud secrets versions add twilio-phone-number --data-file=-

# Build the container
echo "Building Docker image..."
gcloud builds submit --tag $IMAGE_NAME .

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production \
    --set-secrets "TWILIO_ACCOUNT_SID=twilio-account-sid:latest,TWILIO_AUTH_TOKEN=twilio-auth-token:latest,TWILIO_PHONE_NUMBER=twilio-phone-number:latest"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "=========================================="
echo "Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/health"
echo "Webhook URL: $SERVICE_URL/webhook/sms"
echo ""
echo "Configure this webhook URL in your Twilio console:"
echo "https://console.twilio.com/console/phone-numbers"