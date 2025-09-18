# Reverse Inheritance Trading Bot

A complete Solana trading bot system with frontend and backend components.

## 🏗️ **Architecture**

This project consists of two separate applications:

### **Frontend** (This Repository)
- **Framework**: Next.js with React
- **Deployment**: Vercel
- **Features**: Wallet connection, bot controls, trade history
- **Branch**: `main`

### **Backend** (Separate Repository)
- **Framework**: Express.js with Solana Web3.js
- **Deployment**: Railway
- **Features**: Trading API, wallet balance, bot management
- **Repository**: `reverse-inheritance-backend`

## 🚀 **Deployment Instructions**

### **1. Deploy Frontend to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. New Project → Import from GitHub
4. Select: `reverse-inheritance-2025` (this repository)
5. Deploy!

### **2. Deploy Backend to Railway**
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. New Project → Deploy from GitHub repo
4. Select: `reverse-inheritance-backend` repository
5. Deploy!

### **3. Connect Frontend to Backend**
1. Copy your Railway backend URL
2. In Vercel project settings, add environment variable:
   - **Name**: `NEXT_PUBLIC_BACKEND_URL`
   - **Value**: `https://your-backend-name.up.railway.app`
3. Redeploy frontend

## 📁 **Repository Structure**

```
reverse-inheritance-2025/          # Frontend (Vercel)
├── src/app/page.tsx              # Main interface
├── src/components/                # React components
├── src/__tests__/                # Frontend tests
├── vercel.json                   # Vercel config
└── package.json                  # Next.js dependencies

reverse-inheritance-backend/       # Backend (Railway)
├── server.js                     # Express server
├── test-runner.js                # Backend tests
├── e2e-test.js                   # End-to-end tests
├── railway.toml                  # Railway config
└── package.json                  # Express + Solana deps
```

## 🎯 **Features**

- **Wallet Integration**: Phantom & Solflare support
- **Real-time Trading**: Mock trading with P&L tracking
- **Bot Controls**: Start/stop with strategy selection
- **Trade History**: Real-time trade display
- **Responsive Design**: Clean, modern UI

## 🧪 **Testing**

- **Frontend Tests**: `npm test` (3/3 passing)
- **Backend Tests**: `npm test` (7/7 passing)
- **End-to-End Tests**: `node e2e-test.js` (5/5 passing)

## 📞 **Support**

If you encounter any issues:
1. Check the deployment logs in Vercel/Railway
2. Ensure environment variables are set correctly
3. Verify both services are running and accessible