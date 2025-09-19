const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');

// Create a testable Express app instance with complete bot functionality
const app = express();
app.use(cors());
app.use(express.json());

// Mock Solana connection for testing
const mockConnection = {
  rpcEndpoint: 'https://api.devnet.solana.com',
  getBalance: () => Promise.resolve(1000000000), // 1 SOL in lamports
  getAccountInfo: () => Promise.resolve(null),
  getLatestBlockhash: () => Promise.resolve({ blockhash: 'mock-blockhash' })
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
    this.walletKeypair = Keypair.generate();
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

app.get('/api/bot/wallet-address', (req, res) => {
  if (!mockTradingBot || !mockTradingBot.walletKeypair) {
    return res.status(400).json({ error: 'Bot not initialized' });
  }

  res.json({
    botWalletAddress: mockTradingBot.walletKeypair.publicKey.toBase58(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/bot/balance', async (req, res) => {
  if (!mockTradingBot || !mockTradingBot.walletKeypair) {
    return res.status(400).json({ error: 'Bot not initialized' });
  }

  try {
    const balance = await mockConnection.getBalance();
    const balanceSOL = balance / 1000000000;
    
    res.json({
      botWalletAddress: mockTradingBot.walletKeypair.publicKey.toBase58(),
      balance: balanceSOL,
      balanceLamports: balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bot balance' });
  }
});

app.post('/api/bot/cash-out', async (req, res) => {
  const { userWalletAddress } = req.body;
  
  if (!userWalletAddress) {
    return res.status(400).json({ error: 'User wallet address is required' });
  }

  if (!mockTradingBot || !mockTradingBot.walletKeypair) {
    return res.status(400).json({ error: 'Bot not initialized' });
  }

  try {
    // Validate user wallet address
    if (userWalletAddress.length < 32) {
      throw new Error('Invalid wallet address');
    }
    
    // Get current bot balance
    const botBalance = await mockConnection.getBalance();
    const botBalanceSOL = botBalance / 1000000000;
    
    if (botBalanceSOL < 0.001) {
      return res.status(400).json({ 
        error: 'Insufficient balance for cash out', 
        currentBalance: botBalanceSOL,
        minimumRequired: 0.001 
      });
    }

    // Calculate amount to send (leave small amount for fees)
    const amountToSend = botBalanceSOL - 0.001;
    const lamportsToSend = Math.floor(amountToSend * 1000000000);

    res.json({
      success: true,
      message: `Cash out prepared: ${amountToSend} SOL to user wallet`,
      transaction: {
        fromWallet: mockTradingBot.walletKeypair.publicKey.toBase58(),
        toWallet: userWalletAddress,
        amount: amountToSend,
        lamports: lamportsToSend,
        remainingBalance: 0.001
      },
      instructions: 'Transaction prepared. Sign and send using bot wallet.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address or transaction failed' });
  }
});

app.post('/api/wallet/send-to-bot', async (req, res) => {
  const { fromWallet, amount, botWalletAddress } = req.body;
  
  if (!fromWallet || !amount || !botWalletAddress) {
    return res.status(400).json({ error: 'Missing required fields: fromWallet, amount, botWalletAddress' });
  }

  try {
    // Validate wallet addresses
    if (fromWallet.length < 32 || botWalletAddress.length < 32) {
      throw new Error('Invalid wallet address');
    }
    
    // Validate amount
    const solAmount = parseFloat(amount);
    if (solAmount <= 0 || solAmount > 100) {
      return res.status(400).json({ error: 'Amount must be between 0 and 100 SOL' });
    }

    // Check sender balance
    const senderBalance = await mockConnection.getBalance();
    const senderBalanceSOL = senderBalance / 1000000000;
    
    if (senderBalanceSOL < solAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance', 
        currentBalance: senderBalanceSOL,
        requestedAmount: solAmount 
      });
    }

    res.json({
      success: true,
      message: `Transfer initiated: ${solAmount} SOL to bot wallet`,
      transaction: {
        fromWallet,
        toWallet: botWalletAddress,
        amount: solAmount,
        lamports: Math.floor(solAmount * 1000000000)
      },
      instructions: 'Transaction prepared. Sign and send using your wallet.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet addresses or amount' });
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
      balance: balance / 1000000000,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address' });
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
  console.log('\n🧪 Running Complete Bot Workflow Tests...\n');
  
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

// Complete Bot Workflow Tests
test('Complete Workflow: Start Bot', async () => {
  const response = await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'meme_scalp_momo_v2_autotuned', 
      walletAddress: '11111111111111111111111111111112',
      strategyDetails: 'Test meme strategy'
    });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (!mockTradingBot) throw new Error('Trading bot should be initialized');
  if (!mockTradingBot.isRunning) throw new Error('Trading bot should be running');
});

test('Complete Workflow: Get Bot Wallet Address', async () => {
  const response = await request(app)
    .get('/api/bot/wallet-address');
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.botWalletAddress) throw new Error('Bot wallet address should be returned');
  if (response.body.botWalletAddress.length < 32) throw new Error('Bot wallet address should be valid length');
});

test('Complete Workflow: Get Bot Balance', async () => {
  const response = await request(app)
    .get('/api/bot/balance');
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (typeof response.body.balance !== 'number') throw new Error('Balance should be a number');
  if (response.body.balance <= 0) throw new Error('Balance should be positive');
});

test('Complete Workflow: Send Money to Bot', async () => {
  const botWalletResponse = await request(app).get('/api/bot/wallet-address');
  const botWalletAddress = botWalletResponse.body.botWalletAddress;
  
  const response = await request(app)
    .post('/api/wallet/send-to-bot')
    .send({
      fromWallet: '11111111111111111111111111111112',
      amount: 0.5,
      botWalletAddress: botWalletAddress
    });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (response.body.transaction.amount !== 0.5) throw new Error('Transfer amount should be 0.5 SOL');
});

test('Complete Workflow: Check Bot Status While Running', async () => {
  const response = await request(app).get('/api/bot/status');
  
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (response.body.status !== 'running') throw new Error('Bot should be running');
  if (response.body.currentStrategy !== 'meme_scalp_momo_v2_autotuned') throw new Error('Strategy should be set');
});

test('Complete Workflow: Cash Out Bot Funds', async () => {
  const response = await request(app)
    .post('/api/bot/cash-out')
    .send({
      userWalletAddress: '11111111111111111111111111111112'
    });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (!response.body.transaction) throw new Error('Transaction details should be returned');
  if (response.body.transaction.amount <= 0) throw new Error('Cash out amount should be positive');
});

test('Complete Workflow: Stop Bot', async () => {
  const response = await request(app)
    .post('/api/bot/stop');
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (mockTradingBot && mockTradingBot.isRunning) throw new Error('Trading bot should be stopped');
});

test('Complete Workflow: Verify Bot Stopped', async () => {
  const response = await request(app).get('/api/bot/status');
  
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (response.body.status !== 'ready') throw new Error('Bot should be ready after stop');
});

test('Error Handling: Cash Out Without Bot', async () => {
  // Reset bot state
  mockTradingBot = null;
  mockBotState = {
    isRunning: false,
    strategy: null,
    walletAddress: null,
    trades: [],
    balance: 0,
    aiStrategy: null
  };
  
  const response = await request(app)
    .post('/api/bot/cash-out')
    .send({
      userWalletAddress: '11111111111111111111111111111112'
    });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (!response.body.error.includes('not initialized')) throw new Error('Should return bot not initialized error');
});

test('Error Handling: Cash Out Insufficient Balance', async () => {
  // Create bot with zero balance
  mockTradingBot = new MockTradingBot({
    rpcUrl: 'https://api.devnet.solana.com',
    walletKeypair: Keypair.generate(),
    strategy: 'test',
    maxPositionSize: 0.1,
    stopLossPercent: 0.05,
    takeProfitPercent: 0.1
  });
  
  // Mock zero balance
  mockConnection.getBalance = () => Promise.resolve(100000); // Less than 0.001 SOL
  
  const response = await request(app)
    .post('/api/bot/cash-out')
    .send({
      userWalletAddress: '11111111111111111111111111111112'
    });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (!response.body.error.includes('Insufficient balance')) throw new Error('Should return insufficient balance error');
});

test('Error Handling: Invalid Wallet Addresses', async () => {
  const response = await request(app)
    .post('/api/wallet/send-to-bot')
    .send({
      fromWallet: 'invalid',
      amount: 0.5,
      botWalletAddress: 'invalid'
    });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (!response.body.error.includes('Invalid wallet address')) throw new Error('Should return invalid wallet address error');
});

test('Error Handling: Invalid Transfer Amount', async () => {
  const response = await request(app)
    .post('/api/wallet/send-to-bot')
    .send({
      fromWallet: '11111111111111111111111111111112',
      amount: 150, // Over 100 SOL limit
      botWalletAddress: '11111111111111111111111111111112'
    });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (!response.body.error.includes('Amount must be between 0 and 100 SOL')) throw new Error('Should return amount limit error');
});

test('Complete Workflow: Full Cycle Test', async () => {
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
  
  // Restore normal balance
  mockConnection.getBalance = () => Promise.resolve(1000000000);
  
  // 1. Start bot
  await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'meme_scalp_momo_v2_autotuned', 
      walletAddress: '11111111111111111111111111111112'
    });
  
  // 2. Get bot wallet address
  const walletResponse = await request(app).get('/api/bot/wallet-address');
  const botWalletAddress = walletResponse.body.botWalletAddress;
  
  // 3. Send money to bot
  await request(app)
    .post('/api/wallet/send-to-bot')
    .send({
      fromWallet: '11111111111111111111111111111112',
      amount: 1.0,
      botWalletAddress: botWalletAddress
    });
  
  // 4. Check bot balance
  const balanceResponse = await request(app).get('/api/bot/balance');
  if (balanceResponse.body.balance <= 0) throw new Error('Bot should have positive balance');
  
  // 5. Cash out
  const cashOutResponse = await request(app)
    .post('/api/bot/cash-out')
    .send({
      userWalletAddress: '11111111111111111111111111111112'
    });
  
  if (!cashOutResponse.body.success) throw new Error('Cash out should succeed');
  
  // 6. Stop bot
  await request(app).post('/api/bot/stop');
  
  // 7. Verify bot is stopped
  const finalStatusResponse = await request(app).get('/api/bot/status');
  if (finalStatusResponse.body.status !== 'ready') throw new Error('Bot should be ready after full cycle');
});

runTests();
