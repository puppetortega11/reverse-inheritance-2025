#!/bin/bash

# 🚀 Trading Bot Deployment Script
# This script helps deploy your trading bot to Railway and Netlify

echo "🤖 Trading Bot Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI is not installed. You'll need to deploy manually via web interface."
    fi
    
    print_success "Dependencies check complete"
}

# Deploy backend to Railway
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    if command -v railway &> /dev/null; then
        cd "trading-bot-backend"
        print_status "Logging into Railway..."
        railway login
        
        print_status "Deploying to Railway..."
        railway up
        
        print_success "Backend deployed to Railway!"
        print_status "Get your Railway URL from the Railway dashboard"
    else
        print_warning "Railway CLI not available. Please deploy manually:"
        echo "1. Go to https://railway.app"
        echo "2. Sign in with GitHub"
        echo "3. New Project → Deploy from GitHub repo"
        echo "4. Select: puppetortega11/trading-bot-backend"
        echo "5. Deploy!"
    fi
    
    cd ..
}

# Deploy frontend to Netlify
deploy_frontend() {
    print_status "Deploying frontend to Netlify..."
    
    print_warning "Please deploy manually to Netlify:"
    echo "1. Go to https://netlify.com"
    echo "2. Sign in with GitHub"
    echo "3. New site from Git → GitHub"
    echo "4. Select: puppetortega11/trading-bot-frontend"
    echo "5. Deploy site!"
    echo ""
    echo "After deployment, set environment variable:"
    echo "NEXT_PUBLIC_BACKEND_URL = your-railway-url"
}

# Main deployment function
main() {
    echo ""
    print_status "Starting deployment process..."
    
    check_dependencies
    
    echo ""
    print_status "GitHub repositories are ready:"
    echo "Backend: https://github.com/puppetortega11/trading-bot-backend"
    echo "Frontend: https://github.com/puppetortega11/trading-bot-frontend"
    
    echo ""
    read -p "Do you want to deploy the backend to Railway? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_backend
    fi
    
    echo ""
    read -p "Do you want to deploy the frontend to Netlify? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_frontend
    fi
    
    echo ""
    print_success "Deployment process complete!"
    echo ""
    print_status "Next steps:"
    echo "1. Get your Railway backend URL"
    echo "2. Set NEXT_PUBLIC_BACKEND_URL in Netlify"
    echo "3. Test both deployments"
    echo "4. Start trading! 🚀"
    echo ""
    print_status "See DEPLOYMENT_INSTRUCTIONS.md for detailed steps"
}

# Run main function
main