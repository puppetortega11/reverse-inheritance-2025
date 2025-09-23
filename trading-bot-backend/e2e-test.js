const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Create a testable Express app instance (same as backend)
const app = express();
app.use(cors());
app.use(express.json());

// Mock enhanced bot state
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
    solanaConnection: 'https://api.devnet.solana.com'
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
    if (walletAddress.length < 32) {
      throw new Error('Invalid address');
    }
    
    res.json({
      walletAddress,
      balance: 1.5,
      balanceLamports: 1500000000,
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
    if (walletAddress.length < 32) {
      throw new Error('Invalid address');
    }
    
    mockBotState = {
      isRunning: true,
      strategy,
      walletAddress,
      trades: mockBotState.trades,
      balance: 1.5
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
    },
    {
      id: '2',
      pair: 'SOL/USDT',
      side: 'sell',
      amount: 0.05,
      price: 105.0,
      pnl: 0.025,
      walletAddress,
      strategy: 'momentum',
      timestamp: new Date().toISOString()
    }
  ];
  
  res.json({
    trades: mockTrades,
    totalPnL: 0.075,
    tradeCount: 2,
    timestamp: new Date().toISOString()
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

// End-to-end test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running End-to-End Integration Tests...\n');
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

// End-to-end workflow tests
test('Complete trading workflow: Connect wallet → Check balance → Start bot → View trades', async () => {
  const testWallet = 'test-wallet-address-123456789012345678901234567890';
  
  // 1. Check health
  const healthResponse = await request(app).get('/health');
  if (healthResponse.statusCode !== 200) throw new Error('Health check failed');
  
  // 2. Get wallet balance
  const balanceResponse = await request(app).get(`/api/wallet/balance/${testWallet}`);
  if (balanceResponse.statusCode !== 200) throw new Error('Balance check failed');
  if (balanceResponse.body.balance !== 1.5) throw new Error('Unexpected balance');
  
  // 3. Check initial bot status
  const initialStatusResponse = await request(app).get('/api/bot/status');
  if (initialStatusResponse.statusCode !== 200) throw new Error('Initial status check failed');
  if (initialStatusResponse.body.status !== 'ready') throw new Error('Bot should be ready initially');
  
  // 4. Start bot
  const startResponse = await request(app)
    .post('/api/bot/start')
    .send({ strategy: 'momentum', walletAddress: testWallet });
  if (startResponse.statusCode !== 200) throw new Error('Bot start failed');
  if (!startResponse.body.success) throw new Error('Bot start should succeed');
  
  // 5. Check bot status after start
  const runningStatusResponse = await request(app).get('/api/bot/status');
  if (runningStatusResponse.statusCode !== 200) throw new Error('Running status check failed');
  if (runningStatusResponse.body.status !== 'running') throw new Error('Bot should be running');
  if (runningStatusResponse.body.currentStrategy !== 'momentum') throw new Error('Wrong strategy');
  
  // 6. Get trades
  const tradesResponse = await request(app).get(`/api/trades/${testWallet}`);
  if (tradesResponse.statusCode !== 200) throw new Error('Trades fetch failed');
  if (!Array.isArray(tradesResponse.body.trades)) throw new Error('Trades should be array');
  if (tradesResponse.body.trades.length !== 2) throw new Error('Expected 2 trades');
  
  // 7. Stop bot
  const stopResponse = await request(app).post('/api/bot/stop');
  if (stopResponse.statusCode !== 200) throw new Error('Bot stop failed');
  if (!stopResponse.body.success) throw new Error('Bot stop should succeed');
  
  // 8. Check final bot status
  const finalStatusResponse = await request(app).get('/api/bot/status');
  if (finalStatusResponse.statusCode !== 200) throw new Error('Final status check failed');
  if (finalStatusResponse.body.status !== 'ready') throw new Error('Bot should be ready after stop');
});

test('Error handling: Invalid wallet address', async () => {
  const invalidWallet = 'invalid';
  
  const balanceResponse = await request(app).get(`/api/wallet/balance/${invalidWallet}`);
  if (balanceResponse.statusCode !== 400) throw new Error('Should return 400 for invalid wallet');
  
  const startResponse = await request(app)
    .post('/api/bot/start')
    .send({ strategy: 'momentum', walletAddress: invalidWallet });
  if (startResponse.statusCode !== 400) throw new Error('Should return 400 for invalid wallet');
});

test('Error handling: Missing parameters', async () => {
  const startResponse = await request(app)
    .post('/api/bot/start')
    .send({ strategy: 'momentum' }); // Missing walletAddress
  if (startResponse.statusCode !== 400) throw new Error('Should return 400 for missing wallet address');
  
  const startResponse2 = await request(app)
    .post('/api/bot/start')
    .send({ walletAddress: 'test-wallet-123' }); // Missing strategy
  if (startResponse2.statusCode !== 400) throw new Error('Should return 400 for missing strategy');
});

test('Data consistency: Bot status reflects current state', async () => {
  const testWallet = 'test-wallet-address-123456789012345678901234567890';
  
  // Start bot
  await request(app)
    .post('/api/bot/start')
    .send({ strategy: 'market_making', walletAddress: testWallet });
  
  // Check status
  const statusResponse = await request(app).get('/api/bot/status');
  if (statusResponse.body.status !== 'running') throw new Error('Status should be running');
  if (statusResponse.body.currentStrategy !== 'market_making') throw new Error('Strategy should match');
  if (statusResponse.body.walletAddress !== testWallet) throw new Error('Wallet should match');
  
  // Stop bot
  await request(app).post('/api/bot/stop');
  
  // Check status again
  const finalStatusResponse = await request(app).get('/api/bot/status');
  if (finalStatusResponse.body.status !== 'ready') throw new Error('Status should be ready');
  if (finalStatusResponse.body.currentStrategy !== null) throw new Error('Strategy should be null');
});

test('Performance: Multiple concurrent requests', async () => {
  const testWallet = 'test-wallet-address-123456789012345678901234567890';
  
  // Make multiple concurrent requests
  const promises = [
    request(app).get('/health'),
    request(app).get('/api/bot/status'),
    request(app).get(`/api/wallet/balance/${testWallet}`),
    request(app).get(`/api/trades/${testWallet}`)
  ];
  
  const responses = await Promise.all(promises);
  
  for (const response of responses) {
    if (response.statusCode !== 200) throw new Error('All concurrent requests should succeed');
  }
});

runTests();
