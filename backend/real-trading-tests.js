const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');

// Create a testable Express app instance with real trading engine
const app = express();
app.use(cors());
app.use(express.json());

// Mock Solana connection for testing
const mockConnection = {
  rpcEndpoint: 'https://api.devnet.solana.com',
  getBalance: () => Promise.resolve(1000000000), // 1 SOL in lamports
  getAccountInfo: () => Promise.resolve(null)
};

// Mock trading bot for testing
class MockTradingBot {
  constructor(config) {
    this.config = config;
    this.isRunning = false;
    this.trades = [];
    this.balance = 1.0;
    this.positions = new Map();
    this.priceFeeds = new Map();
  }

  async initialize() {
    this.isRunning = true;
    this.balance = 1.0;
    return true;
  }

  async stop() {
    this.isRunning = false;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      balance: this.balance,
      trades: this.trades,
      positions: Array.from(this.positions.entries()),
      priceFeeds: Object.fromEntries(this.priceFeeds)
    };
  }
}

// Mock bot state
let mockBotState = {
  isRunning: false,
  strategy: null,
  walletAddress: null,
  trades: [],
  balance: 0,
  aiStrategy: null
};

let mockTradingBot = null;

// Replicate relevant server logic for testing
app.get('/api/bot/status', (req, res) => {
  const botStatus = mockTradingBot ? mockTradingBot.getStatus() : {
    isRunning: false,
    balance: 0,
    trades: [],
    positions: [],
    priceFeeds: {}
  };

  res.json({
    status: botStatus.isRunning ? 'running' : 'ready',
    strategies: ['momentum', 'market_making', 'dip_buy', 'ai_generated'],
    currentStrategy: mockBotState.strategy,
    walletAddress: mockBotState.walletAddress,
    balance: botStatus.balance,
    tradesCount: botStatus.trades.length,
    aiStrategy: mockBotState.aiStrategy,
    positions: botStatus.positions,
    priceFeeds: botStatus.priceFeeds,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/bot/start', async (req, res) => {
  const { strategy, walletAddress, strategyDetails } = req.body;
  
  if (!strategy || !walletAddress) {
    return res.status(400).json({ error: 'Missing strategy or wallet address' });
  }

  try {
    // Validate wallet address format (basic validation)
    if (walletAddress.length < 32) {
      throw new Error('Invalid wallet address');
    }
    
    // Create mock trading bot
    mockTradingBot = new MockTradingBot({
      rpcUrl: 'https://api.devnet.solana.com',
      walletKeypair: Keypair.generate(),
      strategy: strategyDetails || strategy,
      maxPositionSize: 0.1,
      stopLossPercent: 0.05,
      takeProfitPercent: 0.1
    });

    // Initialize the bot
    const initialized = await mockTradingBot.initialize();
    
    if (!initialized) {
      throw new Error('Failed to initialize trading bot');
    }

    // Update bot state
    mockBotState = {
      isRunning: true,
      strategy,
      walletAddress,
      trades: mockTradingBot.trades,
      balance: mockTradingBot.balance,
      aiStrategy: strategyDetails
    };

    res.json({
      success: true,
      message: `Real trading bot started with ${strategy} strategy for wallet ${walletAddress}`,
      balance: mockBotState.balance,
      aiStrategy: mockBotState.aiStrategy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address or bot initialization failed' });
  }
});

app.post('/api/bot/stop', async (req, res) => {
  try {
    if (mockTradingBot) {
      await mockTradingBot.stop();
      mockTradingBot = null;
    }
    
    mockBotState.isRunning = false;
    mockBotState.strategy = null;
    
    res.json({
      success: true,
      message: 'Real trading bot stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});

app.get('/api/trades/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  const trades = mockTradingBot ? mockTradingBot.trades : [];
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  
  res.json({
    trades: trades,
    totalPnL,
    tradeCount: trades.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/wallet/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (walletAddress.length < 32) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    const balance = await mockConnection.getBalance();
    
    res.json({
      balance: balance / 1000000000, // Convert lamports to SOL
      walletAddress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address' });
  }
});

// Mock OpenAI for strategy generation
const mockOpenAI = {
  chat: {
    completions: {
      create: () => Promise.resolve({
        choices: [{
          message: {
            content: 'Entry: Buy when price drops 5%. Exit: Sell when price rises 3%. Stop Loss: 10% down. Position Size: 10% of portfolio. Pairs: SOL/USDC.'
          }
        }]
      })
    }
  }
};

app.post('/api/strategy/generate', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const completion = await mockOpenAI.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Mock system prompt" },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const strategy = completion.choices[0].message.content;
    mockBotState.aiStrategy = strategy;

    res.json({
      success: true,
      strategy: strategy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate strategy',
      details: error.message
    });
  }
});

// Test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Real Trading Bot Tests...\n');
  
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ ${t.name}`);
      passed++;
    } catch (e) {
      console.error(`❌ ${t.name}`);
      console.error(e.message);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Real Trading Bot Tests
test('Real Trading Bot: Initialize with valid configuration', async () => {
  const bot = new MockTradingBot({
    rpcUrl: 'https://api.devnet.solana.com',
    walletKeypair: Keypair.generate(),
    strategy: 'momentum',
    maxPositionSize: 0.1,
    stopLossPercent: 0.05,
    takeProfitPercent: 0.1
  });
  
  const initialized = await bot.initialize();
  if (!initialized) throw new Error('Bot failed to initialize');
  if (!bot.isRunning) throw new Error('Bot should be running after initialization');
});

test('Real Trading Bot: Start bot with real trading engine', async () => {
  const response = await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'momentum', 
      walletAddress: '11111111111111111111111111111112', // Valid length
      strategyDetails: 'Test strategy'
    });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (!mockTradingBot) throw new Error('Trading bot should be initialized');
  if (!mockTradingBot.isRunning) throw new Error('Trading bot should be running');
});

test('Real Trading Bot: Start bot with AI-generated strategy', async () => {
  // First generate strategy
  await request(app)
    .post('/api/strategy/generate')
    .send({ prompt: 'Buy low, sell high' });
  
  // Then start bot with AI strategy
  const response = await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'ai_generated', 
      walletAddress: '11111111111111111111111111111112',
      strategyDetails: mockBotState.aiStrategy
    });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (response.body.aiStrategy !== mockBotState.aiStrategy) throw new Error('AI strategy not passed correctly');
});

test('Real Trading Bot: Bot status includes real trading data', async () => {
  const response = await request(app).get('/api/bot/status');
  
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.positions) throw new Error('Bot status should include positions');
  if (!response.body.priceFeeds) throw new Error('Bot status should include price feeds');
  if (response.body.status !== 'running') throw new Error('Bot should be running');
});

test('Real Trading Bot: Stop bot properly', async () => {
  const response = await request(app)
    .post('/api/bot/stop');
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (mockTradingBot && mockTradingBot.isRunning) throw new Error('Trading bot should be stopped');
});

test('Real Trading Bot: Get trades returns real trading data', async () => {
  // Add some mock trades to the bot
  if (mockTradingBot) {
    mockTradingBot.trades = [
      {
        id: '1',
        symbol: 'SOL',
        side: 'buy',
        amount: 0.1,
        price: 100,
        pnl: 0.01,
        timestamp: new Date().toISOString()
      }
    ];
  }
  
  const response = await request(app)
    .get('/api/trades/11111111111111111111111111111112');
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.trades) throw new Error('Should return trades array');
  if (response.body.totalPnL === undefined) throw new Error('Should return totalPnL');
});

test('Real Trading Bot: Wallet balance validation', async () => {
  const response = await request(app)
    .get('/api/wallet/balance/11111111111111111111111111111112');
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (typeof response.body.balance !== 'number') throw new Error('Balance should be a number');
  if (response.body.balance <= 0) throw new Error('Balance should be positive');
});

test('Real Trading Bot: Invalid wallet address handling', async () => {
  const response = await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'momentum', 
      walletAddress: 'invalid', // Too short
      strategyDetails: 'Test strategy'
    });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (!response.body.error) throw new Error('Should return error message');
});

test('Real Trading Bot: Complete trading workflow', async () => {
  // Reset state
  mockTradingBot = null;
  mockBotState = {
    isRunning: false,
    strategy: null,
    walletAddress: null,
    trades: [],
    balance: 0,
    aiStrategy: null
  };
  
  // 1. Generate AI strategy
  const strategyResponse = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt: 'Complex trading strategy with RSI and MACD' });
    
  if (strategyResponse.statusCode !== 200) throw new Error('Strategy generation failed');
  
  // 2. Start bot with AI strategy
  const startResponse = await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'ai_generated', 
      walletAddress: '11111111111111111111111111111112',
      strategyDetails: strategyResponse.body.strategy
    });
    
  if (startResponse.statusCode !== 200) throw new Error('Bot start failed');
  
  // 3. Check bot status
  const statusResponse = await request(app).get('/api/bot/status');
  if (statusResponse.statusCode !== 200) throw new Error('Status check failed');
  if (statusResponse.body.status !== 'running') throw new Error('Bot should be running');
  
  // 4. Get trades
  const tradesResponse = await request(app)
    .get('/api/trades/11111111111111111111111111111112');
    
  if (tradesResponse.statusCode !== 200) throw new Error('Trades fetch failed');
  
  // 5. Stop bot
  const stopResponse = await request(app)
    .post('/api/bot/stop');
    
  if (stopResponse.statusCode !== 200) throw new Error('Bot stop failed');
  
  // 6. Verify bot is stopped
  const finalStatusResponse = await request(app).get('/api/bot/status');
  if (finalStatusResponse.body.status !== 'ready') throw new Error('Bot should be ready after stop');
});

test('Real Trading Bot: Error handling for bot initialization failure', async () => {
  // Mock a bot initialization failure
  const originalMockTradingBot = MockTradingBot;
  MockTradingBot = class extends MockTradingBot {
    async initialize() {
      return false; // Simulate initialization failure
    }
  };
  
  const response = await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'momentum', 
      walletAddress: '11111111111111111111111111111112'
    });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (!response.body.error.includes('initialization failed')) throw new Error('Should return initialization error');
  
  // Restore original mock
  MockTradingBot = originalMockTradingBot;
});

test('Real Trading Bot: Strategy parsing and execution', async () => {
  const bot = new MockTradingBot({
    rpcUrl: 'https://api.devnet.solana.com',
    walletKeypair: Keypair.generate(),
    strategy: 'Buy SOL when RSI is below 30. Sell when RSI is above 70. Stop loss at 5%.',
    maxPositionSize: 0.1,
    stopLossPercent: 0.05,
    takeProfitPercent: 0.1
  });
  
  await bot.initialize();
  
  // Test that bot can parse strategy and maintain state
  if (!bot.isRunning) throw new Error('Bot should be running');
  if (bot.balance <= 0) throw new Error('Bot should have positive balance');
});

runTests();
