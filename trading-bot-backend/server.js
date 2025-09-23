const express = require('express');
const cors = require('cors');
const { StrategyFactory } = require('./trading-strategies');
const { solanaService } = require('./solana-service');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Trading bot state
let botState = {
  isRunning: false,
  currentStrategy: null,
  strategy: null,
  walletAddress: null,
  balance: 0,
  trades: [],
  lastUpdate: new Date().toISOString()
};

// Mock wallet balance (replace with real Solana integration)
const mockWalletBalances = {
  '11111111111111111111111111111112': 1.5,
  'test-wallet-address-123456789012345678901234567890': 1.5
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const solanaHealth = await solanaService.healthCheck();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      nodeVersion: process.version,
      solana: solanaHealth
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      nodeVersion: process.version,
      error: error.message
    });
  }
});

// Basic status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Bot status endpoint
app.get('/api/bot/status', (req, res) => {
  const status = {
    status: botState.isRunning ? 'running' : 'ready',
    strategies: StrategyFactory.getAvailableStrategies(),
    currentStrategy: botState.currentStrategy,
    walletAddress: botState.walletAddress,
    balance: botState.balance,
    tradesCount: botState.trades.length,
    timestamp: new Date().toISOString()
  };

  if (botState.strategy) {
    status.strategyStatus = botState.strategy.getStatus();
  }

  res.json(status);
});

// Get wallet balance
app.get('/api/wallet/balance/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  
  if (!walletAddress || walletAddress.length < 32) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    // Get real balance from Solana blockchain
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

// Get current SOL price
app.get('/api/price/sol', async (req, res) => {
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

// Get multiple token prices
app.get('/api/price/tokens', async (req, res) => {
  try {
    const { tokens } = req.query;
    const tokenList = tokens ? tokens.split(',') : ['SOL'];
    
    const prices = await solanaService.getTokenPrices(tokenList);
    res.json({
      prices,
      count: Object.keys(prices).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching token prices:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch token prices',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get recent transactions for a wallet
app.get('/api/wallet/transactions/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  const { limit = 10 } = req.query;
  
  if (!walletAddress || walletAddress.length < 32) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const transactions = await solanaService.getRecentTransactions(walletAddress, parseInt(limit));
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }
});

// Start bot
app.post('/api/bot/start', (req, res) => {
  const { strategy, walletAddress } = req.body;
  
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
    // Create strategy instance
    const strategyInstance = StrategyFactory.createStrategy(strategy);
    
    // Update bot state
    botState = {
      isRunning: true,
      currentStrategy: strategy,
      strategy: strategyInstance,
      walletAddress,
      balance: mockWalletBalances[walletAddress] || 0.0,
      trades: [],
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      message: `Bot started with ${strategy} strategy for wallet ${walletAddress}`,
      balance: botState.balance,
      strategy: strategy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stop bot
app.post('/api/bot/stop', (req, res) => {
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

// Get trades
app.get('/api/trades/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  // Return mock trades for testing
  const mockTrades = [
    {
      id: 'trade_1',
      type: 'buy',
      symbol: 'SOL',
      amount: 0.1,
      price: 100.0,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      strategy: botState.currentStrategy || 'momentum'
    },
    {
      id: 'trade_2',
      type: 'sell',
      symbol: 'SOL',
      amount: 0.05,
      price: 105.0,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      strategy: botState.currentStrategy || 'momentum'
    }
  ];

  res.json({
    walletAddress,
    trades: botState.isRunning ? botState.trades : mockTrades,
    count: botState.isRunning ? botState.trades.length : mockTrades.length,
    timestamp: new Date().toISOString()
  });
});

// Simulate trading (for testing)
app.post('/api/bot/simulate', (req, res) => {
  const { price, volume } = req.body;
  
  if (!botState.isRunning || !botState.strategy) {
    return res.status(400).json({ error: 'Bot is not running' });
  }

  try {
    const strategy = botState.strategy;
    let action = null;

    // Add data to strategy
    if (strategy.addData) {
      strategy.addData(price, volume);
    } else if (strategy.addPrice) {
      strategy.addPrice(price);
    } else if (strategy.updatePrice) {
      strategy.updatePrice(price);
    }

    // Check for trading signals
    if (strategy.shouldBuy && strategy.shouldBuy()) {
      if (strategy.executeBuy) {
        action = strategy.executeBuy(price);
      }
    } else if (strategy.shouldSell && strategy.shouldSell()) {
      if (strategy.executeSell) {
        action = strategy.executeSell(price);
      }
    } else if (strategy.shouldBuyDip && strategy.shouldBuyDip()) {
      if (strategy.buyDip) {
        action = strategy.buyDip(price);
      }
    } else if (strategy.shouldSellRecovery && strategy.shouldSellRecovery()) {
      if (strategy.sellRecovery) {
        action = strategy.sellRecovery(price);
      }
    }

    // Update bot state
    botState.balance = strategy.getPortfolioValue ? strategy.getPortfolioValue(price) : botState.balance;
    botState.trades = strategy.trades || [];
    botState.lastUpdate = new Date().toISOString();

    res.json({
      success: true,
      action: action,
      strategy: botState.currentStrategy,
      price: price,
      volume: volume,
      status: strategy.getStatus(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Risk management endpoints
app.get('/api/risk/portfolio/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  if (!botState.isRunning || !botState.strategy || !botState.strategy.riskManager) {
    return res.status(400).json({ error: 'Bot is not running or risk manager not available' });
  }

  try {
    const portfolioSummary = botState.strategy.riskManager.getPortfolioSummary();
    const activePositions = botState.strategy.riskManager.getActivePositions();
    
    res.json({
      walletAddress,
      portfolio: portfolioSummary,
      activePositions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get portfolio summary',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update risk parameters
app.post('/api/risk/parameters', (req, res) => {
  const { parameters } = req.body;
  
  if (!botState.isRunning || !botState.strategy || !botState.strategy.riskManager) {
    return res.status(400).json({ error: 'Bot is not running or risk manager not available' });
  }

  try {
    botState.strategy.riskManager.updateRiskParameters(parameters);
    
    res.json({
      success: true,
      message: 'Risk parameters updated successfully',
      parameters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update risk parameters',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Check risk levels for current positions
app.post('/api/risk/check-levels', (req, res) => {
  const { currentPrice } = req.body;
  
  if (!botState.isRunning || !botState.strategy || !botState.strategy.riskManager) {
    return res.status(400).json({ error: 'Bot is not running or risk manager not available' });
  }

  if (!currentPrice || currentPrice <= 0) {
    return res.status(400).json({ error: 'Valid current price is required' });
  }

  try {
    const triggeredPositions = botState.strategy.riskManager.checkRiskLevels(currentPrice);
    
    res.json({
      success: true,
      currentPrice,
      triggeredPositions,
      count: triggeredPositions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check risk levels',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Technical analysis endpoints
app.get('/api/analysis/technical/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  if (!botState.isRunning || !botState.strategy || !botState.strategy.indicators) {
    return res.status(400).json({ error: 'Bot is not running or technical indicators not available' });
  }

  try {
    const technicalAnalysis = botState.strategy.indicators.getTechnicalAnalysis();
    const dataSummary = botState.strategy.indicators.getDataSummary();
    
    res.json({
      walletAddress,
      analysis: technicalAnalysis,
      dataSummary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get technical analysis',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific indicator values
app.get('/api/analysis/indicators/:indicator', (req, res) => {
  const { indicator } = req.params;
  const { period = 20 } = req.query;
  
  if (!botState.isRunning || !botState.strategy || !botState.strategy.indicators) {
    return res.status(400).json({ error: 'Bot is not running or technical indicators not available' });
  }

  try {
    let value = null;
    const indicators = botState.strategy.indicators;
    
    switch (indicator.toLowerCase()) {
      case 'sma':
        value = indicators.calculateSMA(parseInt(period));
        break;
      case 'ema':
        value = indicators.calculateEMA(parseInt(period));
        break;
      case 'rsi':
        value = indicators.calculateRSI(parseInt(period));
        break;
      case 'macd':
        value = indicators.calculateMACD(12, 26, 9);
        break;
      case 'bollinger':
        value = indicators.calculateBollingerBands(parseInt(period), 2);
        break;
      case 'stochastic':
        value = indicators.calculateStochastic(parseInt(period), 3);
        break;
      case 'volume':
        value = indicators.calculateVolumeIndicators(parseInt(period));
        break;
      case 'support-resistance':
        value = indicators.calculateSupportResistance(parseInt(period));
        break;
      default:
        return res.status(400).json({ 
          error: 'Unknown indicator',
          availableIndicators: ['sma', 'ema', 'rsi', 'macd', 'bollinger', 'stochastic', 'volume', 'support-resistance']
        });
    }
    
    res.json({
      indicator,
      period: parseInt(period),
      value,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to calculate indicator',
      details: error.message,
      indicator,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Node.js version: ${process.version}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});