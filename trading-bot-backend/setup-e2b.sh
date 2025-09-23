#!/bin/bash

# E2B Trading Bot Setup Script
# This script helps you set up E2B sandbox testing for your crypto trading bot

echo "🚀 Setting up E2B Sandbox Testing for Trading Bot"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to version 20+."
    exit 1
fi

echo "✅ Node.js version $(node -v) is compatible"

# Install E2B SDK
echo "📦 Installing E2B SDK..."
npm install @e2b/code-interpreter

if [ $? -eq 0 ]; then
    echo "✅ E2B SDK installed successfully"
else
    echo "❌ Failed to install E2B SDK"
    exit 1
fi

# Check if E2B_API_KEY is set
if [ -z "$E2B_API_KEY" ]; then
    echo ""
    echo "⚠️  E2B_API_KEY environment variable not set!"
    echo ""
    echo "To get your API key:"
    echo "1. Visit https://e2b.dev"
    echo "2. Sign up for a free account"
    echo "3. Get your API key from the dashboard"
    echo "4. Set the environment variable:"
    echo "   export E2B_API_KEY=your_api_key_here"
    echo ""
    echo "Or create a .env file with:"
    echo "E2B_API_KEY=your_api_key_here"
    echo ""
else
    echo "✅ E2B_API_KEY is set"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# E2B Configuration
E2B_API_KEY=your_e2b_api_key_here

# Trading Bot Configuration
NODE_ENV=development
PORT=8000
EOF
    echo "✅ .env file created"
    echo "⚠️  Please update .env with your actual E2B API key"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set your E2B_API_KEY in the .env file"
echo "2. Run the test example: node e2b-example.js"
echo "3. Run sandbox tests: npm run test:sandbox"
echo ""
echo "For more information, see E2B_SANDBOX_SETUP.md"
