/**
 * Production Server Configuration
 * 
 * This is a production-ready version of the trading bot server with:
 * - Environment variable configuration
 * - Enhanced error handling and logging
 * - Health monitoring and metrics
 * - Security middleware
 * - Graceful shutdown handling
 */

// Load environment variables with fallbacks
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { StrategyFactory } = require('./trading-strategies');
const { solanaService } = require('./solana-service');

const app = express();
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Production middleware
if (NODE_ENV === 'production') {
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);
  
  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map();
const RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT) || 100;
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

app.use((req, res, next) => {
  const clientId = req.ip;
  const now = Date.now();
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }
  
  const clientData = rateLimitMap.get(clientId);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_WINDOW;
    return next();
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit: RATE_LIMIT,
      resetTime: new Date(clientData.resetTime).toISOString()
    });
  }
  
  clientData.count++;
  next();
});

// Trading bot state
let botState = {
  isRunning: false,
  currentStrategy: null,
  strategy: null,
  walletAddress: null,
  balance: 0,
  trades: [],
  lastUpdate: new Date().toISOString(),
  startTime: null,
  metrics: {
    totalRequests: 0,
    successfulTrades: 0,
    failedTrades: 0,
    uptime: 0
  }
};

// Initialize Solana service with error handling
async function initializeServices() {
  try {
    console.log('Initializing Solana service...');
    await solanaService.initialize();
    console.log('Solana service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Solana service:', error.message);
    console.log('Continuing without Solana service - some features may be limited');
    // Don't exit, but log the error and continue
  }
}

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
  try {
    const solanaHealth = await solanaService.healthCheck();
    const uptime = process.uptime();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      nodeVersion: process.version,
      environment: NODE_ENV,
      uptime: Math.floor(uptime),
      memory: process.memoryUsage(),
      solana: solanaHealth,
      bot: {
        isRunning: botState.isRunning,
        strategy: botState.currentStrategy,
        uptime: botState.startTime ? Date.now() - botState.startTime : 0
      }
    };
    
    // Check if any critical services are down
    if (solanaHealth.status === 'unhealthy') {
      healthStatus.status = 'degraded';
    }
    
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      nodeVersion: process.version,
      environment: NODE_ENV,
      error: error.message
    });
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  res.json({
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memory.external / 1024 / 1024) + ' MB'
    },
    bot: {
      isRunning: botState.isRunning,
      strategy: botState.currentStrategy,
      totalTrades: botState.trades.length,
      startTime: botState.startTime,
      uptime: botState.startTime ? Date.now() - botState.startTime : 0
    },
    requests: botState.metrics
  });
});

// Basic status endpoint
app.get('/api/status', (req, res) => {
  botState.metrics.totalRequests++;
  res.json({
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '2.0.0'
  });
});

// Bot status endpoint
app.get('/api/bot/status', (req, res) => {
  botState.metrics.totalRequests++;
  
  const status = {
    status: botState.isRunning ? 'running' : 'ready',
    strategies: StrategyFactory.getAvailableStrategies(),
    currentStrategy: botState.currentStrategy,
    walletAddress: botState.walletAddress,
    balance: botState.balance,
    tradesCount: botState.trades.length,
    uptime: botState.startTime ? Date.now() - botState.startTime : 0,
    timestamp: new Date().toISOString()
  };

  if (botState.strategy) {
    status.strategyStatus = botState.strategy.getStatus();
  }

  res.json(status);
});

// Get wallet balance with enhanced error handling
app.get('/api/wallet/balance/:walletAddress', async (req, res) => {
  botState.metrics.totalRequests++;
  const { walletAddress } = req.params;
  
  if (!walletAddress || walletAddress.length < 32) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const balanceData = await solanaService.getWalletBalance(walletAddress);
    res.json(balanceData);
  } catch (error) {
    console.error('Error fetching wallet balance:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch wallet balance',
      details: error.message,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }
});

// Get current SOL price with fallback
app.get('/api/price/sol', async (req, res) => {
  botState.metrics.totalRequests++;
  
  try {
    const priceData = await solanaService.getSolPrice();
    res.json(priceData);
  } catch (error) {
    console.error('Error fetching SOL price:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch SOL price',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start bot with enhanced configuration
app.post('/api/bot/start', (req, res) => {
  botState.metrics.totalRequests++;
  const { strategy, walletAddress, options = {} } = req.body;
  
  if (!strategy || !walletAddress) {
    return res.status(400).json({ error: 'Missing strategy or wallet address' });
  }

  if (!StrategyFactory.getAvailableStrategies().includes(strategy)) {
    return res.status(400).json({ 
      error: 'Invalid strategy', 
      availableStrategies: StrategyFactory.getAvailableStrategies() 
    });
  }

  try {
    // Create strategy instance with environment-based options
    const strategyOptions = {
      maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE) || 0.1,
      stopLossPercentage: parseFloat(process.env.STOP_LOSS_PERCENTAGE) || 0.05,
      takeProfitPercentage: parseFloat(process.env.TAKE_PROFIT_PERCENTAGE) || 0.15,
      riskPerTrade: parseFloat(process.env.RISK_PER_TRADE) || 0.02,
      ...options
    };
    
    const strategyInstance = StrategyFactory.createStrategy(strategy, strategyOptions);
    
    // Update bot state
    botState = {
      ...botState,
      isRunning: true,
      currentStrategy: strategy,
      strategy: strategyInstance,
      walletAddress,
      balance: 0, // Will be fetched from blockchain
      trades: [],
      lastUpdate: new Date().toISOString(),
      startTime: Date.now()
    };

    res.json({
      success: true,
      message: `Bot started with ${strategy} strategy for wallet ${walletAddress}`,
      strategy: strategy,
      options: strategyOptions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting bot:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Stop bot
app.post('/api/bot/stop', (req, res) => {
  botState.metrics.totalRequests++;
  
  botState.isRunning = false;
  botState.currentStrategy = null;
  botState.strategy = null;
  botState.lastUpdate = new Date().toISOString();

  res.json({
    success: true,
    message: 'Bot stopped successfully',
    timestamp: new Date().toISOString()
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Log error details
  const errorDetails = {
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    ip: req.ip
  };
  
  console.error('Error details:', errorDetails);
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`🚀 Production server running on port ${PORT}`);
      console.log(`📊 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = { app };
