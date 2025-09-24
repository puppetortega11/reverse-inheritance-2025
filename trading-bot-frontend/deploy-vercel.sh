#!/bin/bash

# Vercel Deployment Script for Trading Bot Frontend
# This script deploys the frontend to Vercel with production configurations

echo "🚀 Starting Vercel deployment for Trading Bot Frontend..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

# Set environment variables
echo "⚙️  Setting up environment variables..."

# Get the Railway backend URL (you'll need to update this after Railway deployment)
read -p "Enter your Railway backend URL (e.g., https://your-app.railway.app): " RAILWAY_URL

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ Railway URL is required. Please run this script after Railway deployment."
    exit 1
fi

# Set Vercel environment variables
vercel env add REACT_APP_API_URL production <<< "$RAILWAY_URL"
vercel env add REACT_APP_ENVIRONMENT production <<< "production"

echo "✅ Environment variables configured"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Get deployment URL
echo "🔗 Getting deployment URL..."
DEPLOYMENT_URL=$(vercel ls | grep "trading-bot-frontend" | head -1 | awk '{print $2}')

echo "✅ Deployment completed!"
echo "🌐 Your frontend is now live at: $DEPLOYMENT_URL"
echo "🔗 Backend API: $RAILWAY_URL"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5  # Wait for deployment to be ready

if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
    echo "✅ Frontend deployment successful!"
else
    echo "❌ Frontend deployment failed. Check the logs:"
    vercel logs
fi

echo "🎉 Vercel deployment completed successfully!"
echo "📝 Next steps:"
echo "   1. Test the frontend interface"
echo "   2. Verify API connectivity"
echo "   3. Test trading bot functionality"
echo "   4. Set up monitoring and alerts"
