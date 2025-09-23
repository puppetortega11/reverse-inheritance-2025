const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');

// Create a testable Express app instance
const app = express();
app.use(cors());
app.use(express.json());

// Mock Solana connection for testing
const mockConnection = {
  rpcEndpoint: 'https://api.devnet.solana.com',
  getBalance: () => Promise.resolve(1000000000) // 1 SOL in lamports
};

// Mock bot state
let mockBotState = {
  isRunning: false,
  strategy: null,
  walletAddress: null,
  trades: [],
  balance: 0
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    solanaConnection: mockConnection.rpcEndpoint
  });
});

// Bot status
app.get('/api/bot/status', (req, res) => {
  res.json({
    status: mockBotState.isRunning ? 'running' : 'ready',
    strategies: ['momentum', 'market_making', 'dip_buy'],
    currentStrategy: mockBotState.strategy,
    walletAddress: mockBotState.walletAddress,
    balance: mockBotState.balance,
    tradesCount: mockBotState.trades.length,
    timestamp: new Date().toISOString()
  });
});

// Get wallet balance
app.get('/api/wallet/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    // Mock validation
    if (walletAddress.length < 32) {
      throw new Error('Invalid address');
    }
    
    res.json({
      walletAddress,
      balance: 1.0,
      balanceLamports: 1000000000,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address' });
  }
});

// Start bot
app.post('/api/bot/start', async (req, res) => {
  const { strategy, walletAddress } = req.body;
  if (!strategy || !walletAddress) {
    return res.status(400).json({ error: 'Missing strategy or wallet address' });
  }

  try {
    // Mock validation
    if (walletAddress.length < 32) {
      throw new Error('Invalid address');
    }
    
    mockBotState = {
      isRunning: true,
      strategy,
      walletAddress,
      trades: mockBotState.trades,
      balance: 1.0
    };

    res.json({
      success: true,
      message: `Bot started with ${strategy} strategy for wallet ${walletAddress}`,
      balance: mockBotState.balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address' });
  }
});

// Stop bot
app.post('/api/bot/stop', (req, res) => {
  mockBotState.isRunning = false;
  mockBotState.strategy = null;
  res.json({
    success: true,
    message: 'Bot stopped',
    timestamp: new Date().toISOString()
  });
});

// Get trades
app.get('/api/trades/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  const mockTrades = [
    {
      id: '1',
      pair: 'SOL/USDC',
      side: 'buy',
      amount: 0.1,
      price: 100.0,
      pnl: 0.05,
      walletAddress,
      strategy: 'momentum',
      timestamp: new Date().toISOString()
    }
  ];
  
  res.json({
    trades: mockTrades,
    totalPnL: 0.05,
    tradeCount: 1,
    timestamp: new Date().toISOString()
  });
});

// Send SOL endpoint
app.post('/api/wallet/send', async (req, res) => {
  const { fromWallet, toWallet, amount } = req.body;
  
  if (!fromWallet || !toWallet || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const mockTransaction = {
    signature: 'mock-signature-' + Date.now(),
    fromWallet,
    toWallet,
    amount: parseFloat(amount),
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    transaction: mockTransaction,
    message: `Sent ${amount} SOL from ${fromWallet} to ${toWallet}`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Simple test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Enhanced Backend Tests...\n');
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ ${t.name}`);
      passed++;
    } catch (e) {
      console.error(`❌ ${t.name}`);
      console.error(e);
      failed++;
    }
  }
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

// Define tests using supertest
test('Health check returns enhanced data', async () => {
  const response = await request(app).get('/health');
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (response.body.status !== 'healthy') throw new Error('Expected status: healthy');
  if (response.body.version !== '2.0.0') throw new Error('Expected version: 2.0.0');
  if (!response.body.solanaConnection) throw new Error('Expected Solana connection info');
});

test('Bot status returns enhanced data', async () => {
  const response = await request(app).get('/api/bot/status');
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (response.body.status !== 'ready') throw new Error('Expected status: ready');
  if (!Array.isArray(response.body.strategies)) throw new Error('Expected strategies array');
  if (typeof response.body.balance !== 'number') throw new Error('Expected balance number');
});

test('Wallet balance endpoint works', async () => {
  const response = await request(app).get('/api/wallet/balance/test-wallet-address-123456789012345678901234567890');
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (typeof response.body.balance !== 'number') throw new Error('Expected balance number');
  if (!response.body.walletAddress) throw new Error('Expected wallet address');
});

test('Start bot with enhanced response', async () => {
  const response = await request(app)
    .post('/api/bot/start')
    .send({ strategy: 'momentum', walletAddress: 'test-wallet-address-123456789012345678901234567890' });
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (typeof response.body.balance !== 'number') throw new Error('Expected balance in response');
});

test('Get trades returns enhanced data', async () => {
  const response = await request(app).get('/api/trades/some-wallet-address');
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!Array.isArray(response.body.trades)) throw new Error('Expected trades array');
  if (typeof response.body.totalPnL !== 'number') throw new Error('Expected totalPnL number');
  if (typeof response.body.tradeCount !== 'number') throw new Error('Expected tradeCount number');
});

test('Send SOL endpoint works', async () => {
  const response = await request(app)
    .post('/api/wallet/send')
    .send({ 
      fromWallet: 'from-wallet-123', 
      toWallet: 'to-wallet-456', 
      amount: '0.1' 
    });
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (!response.body.transaction) throw new Error('Expected transaction data');
});

test('Invalid wallet address returns 400', async () => {
  const response = await request(app).get('/api/wallet/balance/invalid');
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
});

runTests();
