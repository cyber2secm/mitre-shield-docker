#!/bin/bash

# MITRE Shield - GCP Cloud Run Deployment Script
# Usage: ./deploy-to-gcp.sh YOUR_PROJECT_ID

set -e

# Check if project ID is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GCP Project ID"
    echo "Usage: ./deploy-to-gcp.sh YOUR_PROJECT_ID"
    exit 1
fi

PROJECT_ID=$1
SERVICE_NAME="mitre-shield"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "🚀 Starting MITRE Shield deployment to GCP..."
echo "📝 Project ID: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🏷️  Image: $IMAGE_NAME"

# Build the container
echo "📦 Building Docker image..."
docker build -f Dockerfile.simple -t $IMAGE_NAME .

# Push to Google Container Registry
echo "🚢 Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --project $PROJECT_ID \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars="NODE_ENV=production,PORT=3000"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format 'value(status.url)')

echo ""
echo "🎉 Deployment successful!"
echo "🌐 Your MITRE Shield is now live at: $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "   1. Visit your application: $SERVICE_URL"
echo "   2. Set up Cloud SQL for production database"
echo "   3. Configure custom domain (optional)"
echo ""
echo "💡 Note: This deployment uses in-memory/local storage."
echo "   For production, please set up Cloud SQL following the guide in GCP_DEPLOYMENT_GUIDE.md" 