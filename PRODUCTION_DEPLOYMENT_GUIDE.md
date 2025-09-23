# Production Deployment Guide

This guide covers deploying your Solana trading bot to production with all the advanced features we've implemented.

## 🚀 Features Implemented

### ✅ Completed Features

1. **Real Solana RPC Integration**
   - Connected to Solana mainnet/devnet
   - Real wallet balance fetching
   - Transaction monitoring
   - Account change subscriptions

2. **Real-time Price Feeds**
   - Jupiter API integration for SOL prices
   - CoinGecko fallback
   - Multiple token price support
   - Real-time price updates

3. **Advanced Risk Management**
   - Position sizing calculations
   - Stop-loss and take-profit management
   - Portfolio risk assessment
   - Drawdown protection
   - Risk-reward ratio calculations

4. **Sophisticated Technical Indicators**
   - RSI (Relative Strength Index)
   - MACD (Moving Average Convergence Divergence)
   - Bollinger Bands
   - Moving Averages (SMA, EMA, WMA)
   - Stochastic Oscillator
   - Volume indicators
   - Support and Resistance levels

5. **Production-Ready Server**
   - Environment variable configuration
   - Enhanced error handling
   - Health monitoring and metrics
   - Security middleware
   - Rate limiting
   - Graceful shutdown handling

## 📋 Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Solana wallet with some SOL for testing
- Railway account (or your preferred hosting platform)

## 🔧 Environment Setup

### 1. Install Dependencies

```bash
cd trading-bot-backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your production values:

```env
# Solana Configuration
SOLANA_NETWORK=devnet  # Use 'mainnet' for production
SOLANA_MAINNET_RPC=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_RPC=https://api.devnet.solana.com

# Server Configuration
PORT=8000
NODE_ENV=production

# Risk Management Configuration
MAX_POSITION_SIZE=0.1
MAX_TOTAL_EXPOSURE=0.5
STOP_LOSS_PERCENTAGE=0.05
TAKE_PROFIT_PERCENTAGE=0.15
MAX_DRAWDOWN=0.2
RISK_PER_TRADE=0.02

# Security Configuration
API_RATE_LIMIT=100
CORS_ORIGIN=https://your-frontend-domain.com
JWT_SECRET=your-super-secure-jwt-secret
```

## 🚀 Deployment Options

### Option 1: Railway Deployment

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Railway project**:
   ```bash
   railway init
   ```

4. **Set environment variables**:
   ```bash
   railway variables set SOLANA_NETWORK=devnet
   railway variables set NODE_ENV=production
   railway variables set MAX_POSITION_SIZE=0.1
   # ... set other variables
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

### Option 2: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8000

CMD ["npm", "run", "start:prod"]
```

Build and run:

```bash
docker build -t trading-bot .
docker run -p 8000:8000 --env-file .env trading-bot
```

### Option 3: VPS Deployment

1. **Set up your VPS** (Ubuntu 20.04+ recommended)
2. **Install Node.js 20+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd trading-bot-backend
   npm install
   cp env.example .env
   # Edit .env with production values
   ```

4. **Use PM2 for process management**:
   ```bash
   npm install -g pm2
   pm2 start production-server.js --name trading-bot
   pm2 startup
   pm2 save
   ```

## 🔍 Monitoring and Health Checks

### Health Check Endpoint

```bash
curl https://your-domain.com/health
```

Response includes:
- Server status
- Solana connection status
- Memory usage
- Bot status
- Uptime

### Metrics Endpoint

```bash
curl https://your-domain.com/metrics
```

Provides detailed metrics:
- Memory usage
- Request counts
- Bot performance
- Uptime statistics

## 📊 API Endpoints

### Core Endpoints

- `GET /health` - Health check
- `GET /metrics` - Performance metrics
- `GET /api/status` - Basic status
- `GET /api/bot/status` - Bot status

### Wallet Endpoints

- `GET /api/wallet/balance/:address` - Get wallet balance
- `GET /api/wallet/transactions/:address` - Get recent transactions

### Price Endpoints

- `GET /api/price/sol` - Current SOL price
- `GET /api/price/tokens?tokens=SOL,USDC` - Multiple token prices

### Trading Endpoints

- `POST /api/bot/start` - Start trading bot
- `POST /api/bot/stop` - Stop trading bot
- `POST /api/bot/simulate` - Simulate trading

### Risk Management Endpoints

- `GET /api/risk/portfolio/:address` - Portfolio summary
- `POST /api/risk/parameters` - Update risk parameters
- `POST /api/risk/check-levels` - Check risk levels

### Technical Analysis Endpoints

- `GET /api/analysis/technical/:address` - Full technical analysis
- `GET /api/analysis/indicators/:indicator` - Specific indicator values

## 🛡️ Security Considerations

### Production Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set strong JWT secrets
- [ ] Enable rate limiting
- [ ] Use HTTPS in production
- [ ] Set up proper logging
- [ ] Monitor for unusual activity
- [ ] Regular security updates

### Environment Variables Security

- Never commit `.env` files
- Use secure random strings for secrets
- Rotate secrets regularly
- Use different secrets for different environments

## 📈 Performance Optimization

### Recommended Settings

1. **Memory Management**:
   - Monitor memory usage via `/metrics`
   - Set appropriate Node.js memory limits
   - Use PM2 cluster mode for multiple instances

2. **Database Optimization** (if using):
   - Use connection pooling
   - Implement proper indexing
   - Regular maintenance

3. **API Optimization**:
   - Implement caching for price data
   - Use compression middleware
   - Optimize database queries

## 🔧 Troubleshooting

### Common Issues

1. **Solana Connection Issues**:
   - Check RPC endpoint availability
   - Verify network configuration
   - Check rate limits

2. **Memory Leaks**:
   - Monitor memory usage
   - Check for unclosed connections
   - Implement proper cleanup

3. **Performance Issues**:
   - Check CPU usage
   - Monitor response times
   - Optimize database queries

### Logging

The production server includes comprehensive logging:

```bash
# View logs in production
pm2 logs trading-bot

# Or with Docker
docker logs <container-id>
```

## 📞 Support

For issues or questions:

1. Check the health endpoint first
2. Review logs for errors
3. Verify environment variables
4. Test with smaller amounts first

## 🎯 Next Steps

After successful deployment:

1. **Monitor Performance**: Set up alerts for health checks
2. **Test Trading**: Start with small amounts on devnet
3. **Scale Gradually**: Increase position sizes as confidence grows
4. **Add Features**: Consider adding more strategies or indicators
5. **Backup Strategy**: Implement data backup and recovery

## 📚 Additional Resources

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Jupiter API Documentation](https://docs.jup.ag/)
- [Railway Documentation](https://docs.railway.app/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**⚠️ Important**: Always test thoroughly on devnet before using mainnet with real funds. Start with small amounts and gradually increase as you gain confidence in the system.
