# Reverse Inheritance Trading Bot

A clean, simple Solana trading bot with minimal dependencies and comprehensive testing.

## 🏗️ **Architecture**

- **Backend**: Express.js server with Railway deployment
- **Frontend**: Next.js app with Vercel deployment  
- **Testing**: Comprehensive unit tests (Backend: 7/7, Frontend: 3/3)

## 🚀 **Quick Deploy**

### Backend (Railway)
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `reverse-inheritance-2025` (backend branch)
5. Deploy!

### Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select `reverse-inheritance-2025` (frontend branch)
5. Deploy!

## 🧪 **Testing**

### Backend Tests
```bash
cd trading-bot
npm test
# ✅ 7/7 tests passing
```

### Frontend Tests
```bash
cd trading-bot-frontend
npm test
# ✅ 3/3 tests passing
```

## 📁 **Project Structure**

```
trading-bot/                 # Backend (Railway)
├── server.js               # Express server
├── test-runner.js          # Custom test runner
├── railway.toml            # Railway config
└── package.json            # Minimal dependencies

trading-bot-frontend/       # Frontend (Vercel)
├── src/app/page.tsx        # Main interface
├── src/components/          # React components
├── src/__tests__/          # Frontend tests
├── vercel.json             # Vercel config
└── package.json            # Next.js + Solana
```

## 🔧 **Features**

- ✅ **Wallet Connection**: Phantom & Solflare support
- ✅ **Bot Controls**: Start/stop with strategy selection
- ✅ **Trade History**: Real-time trade display
- ✅ **Health Monitoring**: Backend status checks
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Responsive Design**: Clean, modern UI

## 🌐 **API Endpoints**

- `GET /health` - Health check
- `GET /api/bot/status` - Bot status
- `POST /api/bot/start` - Start bot
- `POST /api/bot/stop` - Stop bot
- `GET /api/trades/:wallet` - Get trades

## 🎯 **Next Steps**

1. Deploy backend to Railway
2. Deploy frontend to Vercel
3. Connect frontend to backend URL
4. Add real trading logic
5. End-to-end testing

## 📊 **Status**

- ✅ Backend: Complete with tests
- ✅ Frontend: Complete with tests
- 🔄 Deployment: In progress
- ⏳ Trading Logic: Pending
- ⏳ E2E Testing: Pending
