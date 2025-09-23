#!/bin/bash

# Railway Deployment Script for Trading Bot Backend
# This script deploys the trading bot to Railway with all production configurations

echo "🚀 Starting Railway deployment for Trading Bot Backend..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Set environment variables for production
echo "⚙️  Setting up environment variables..."

# Solana Configuration
railway variables set SOLANA_NETWORK=devnet
railway variables set SOLANA_MAINNET_RPC=https://api.mainnet-beta.solana.com
railway variables set SOLANA_DEVNET_RPC=https://api.devnet.solana.com

# Server Configuration
railway variables set NODE_ENV=production
railway variables set PORT=8000

# Risk Management Configuration
railway variables set MAX_POSITION_SIZE=0.1
railway variables set MAX_TOTAL_EXPOSURE=0.5
railway variables set STOP_LOSS_PERCENTAGE=0.05
railway variables set TAKE_PROFIT_PERCENTAGE=0.15
railway variables set MAX_DRAWDOWN=0.2
railway variables set RISK_PER_TRADE=0.02

# Trading Strategy Configuration
railway variables set MOMENTUM_LOOKBACK_PERIOD=10
railway variables set MOMENTUM_THRESHOLD=0.02
railway variables set VOLUME_THRESHOLD=1.5

# Market Making Configuration
railway variables set SPREAD_PERCENTAGE=0.01
railway variables set ORDER_SIZE=0.1
railway variables set MAX_ORDERS=10

# Dip Buy Configuration
railway variables set DIP_THRESHOLD=0.05
railway variables set DIP_LOOKBACK_PERIOD=20
railway variables set RECOVERY_THRESHOLD=0.8

# Security Configuration
railway variables set API_RATE_LIMIT=100
railway variables set CORS_ORIGIN=*
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Logging Configuration
railway variables set LOG_LEVEL=info

# Monitoring Configuration
railway variables set HEALTH_CHECK_INTERVAL=30000
railway variables set METRICS_ENABLED=true

echo "✅ Environment variables configured"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Get deployment URL
echo "🔗 Getting deployment URL..."
DEPLOYMENT_URL=$(railway domain)

echo "✅ Deployment completed!"
echo "🌐 Your trading bot is now live at: $DEPLOYMENT_URL"
echo "🔍 Health check: $DEPLOYMENT_URL/health"
echo "📊 Metrics: $DEPLOYMENT_URL/metrics"
echo "📋 API Status: $DEPLOYMENT_URL/api/status"

# Test the deployment
echo "🧪 Testing deployment..."
sleep 10  # Wait for deployment to be ready

if curl -f -s "$DEPLOYMENT_URL/health" > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed. Check the logs:"
    railway logs
fi

echo "🎉 Railway deployment completed successfully!"
echo "📝 Next steps:"
echo "   1. Test all API endpoints"
echo "   2. Configure frontend to use this backend URL"
echo "   3. Set up monitoring alerts"
echo "   4. Test with small amounts on devnet first"
