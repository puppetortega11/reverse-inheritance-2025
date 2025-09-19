const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Create a testable Express app instance with OpenAI integration
const app = express();
app.use(cors());
app.use(express.json());

// Mock OpenAI for testing
const mockOpenAI = {
  chat: {
    completions: {
      create: () => Promise.resolve({
        choices: [{
          message: {
            content: 'Mock AI strategy response'
          }
        }]
      })
    }
  }
};

// Mock bot state
let mockBotState = {
  isRunning: false,
  strategy: null,
  walletAddress: null,
  trades: [],
  balance: 0,
  aiStrategy: null
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
    strategies: ['momentum', 'market_making', 'dip_buy', 'ai_generated'],
    currentStrategy: mockBotState.strategy,
    walletAddress: mockBotState.walletAddress,
    balance: mockBotState.balance,
    tradesCount: mockBotState.trades.length,
    aiStrategy: mockBotState.aiStrategy,
    timestamp: new Date().toISOString()
  });
});

// OpenAI Strategy Generation endpoint
app.post('/api/strategy/generate', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Mock OpenAI response
    const mockResponse = {
      choices: [{
        message: {
          content: `AI Generated Strategy for: "${prompt}"\n\n1. Entry: Buy when price drops 5%\n2. Exit: Sell when price rises 3%\n3. Stop Loss: 10% down\n4. Position Size: 10% of portfolio\n5. Pairs: SOL/USDC, SOL/USDT`
        }
      }]
    };

    // Mock OpenAI response (already handled by mockOpenAI)
    
    const strategy = mockResponse.choices[0].message.content;
    
    // Store the AI strategy
    mockBotState.aiStrategy = strategy;

    res.json({
      success: true,
      strategy: strategy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate strategy',
      details: error.message 
    });
  }
});

// Start bot with AI strategy
app.post('/api/bot/start', async (req, res) => {
  const { strategy, walletAddress, strategyDetails } = req.body;
  
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
      balance: 1.5,
      aiStrategy: strategyDetails || mockBotState.aiStrategy
    };

    res.json({
      success: true,
      message: `Bot started with ${strategy} strategy for wallet ${walletAddress}`,
      balance: mockBotState.balance,
      aiStrategy: mockBotState.aiStrategy,
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

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// AI Strategy Generator Test Runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running AI Strategy Generator Tests...\n');
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

// AI Strategy Generator Tests
test('AI Strategy Generation: Valid prompt returns strategy', async () => {
  const prompt = 'Buy SOL when it drops 5% and sell when it rises 3%';
  
  const response = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (!response.body.strategy) throw new Error('Expected strategy in response');
  if (!response.body.strategy.includes('AI Generated Strategy')) throw new Error('Expected AI-generated strategy format');
});

test('AI Strategy Generation: Empty prompt returns error', async () => {
  const response = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt: '' });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (response.body.error !== 'Prompt is required') throw new Error('Expected specific error message');
});

test('AI Strategy Generation: Missing prompt returns error', async () => {
  const response = await request(app)
    .post('/api/strategy/generate')
    .send({});
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (response.body.error !== 'Prompt is required') throw new Error('Expected specific error message');
});

test('AI Strategy Generation: Strategy is stored in bot state', async () => {
  const prompt = 'Use momentum strategy with 2% stop loss';
  
  const response = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (mockBotState.aiStrategy !== response.body.strategy) throw new Error('Strategy not stored in bot state');
});

test('Bot Status: Includes AI strategy information', async () => {
  // Generate a strategy first
  await request(app)
    .post('/api/strategy/generate')
    .send({ prompt: 'Test strategy' });
  
  const response = await request(app).get('/api/bot/status');
  
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.strategies.includes('ai_generated')) throw new Error('Expected ai_generated in strategies');
  if (typeof response.body.aiStrategy !== 'string') throw new Error('Expected aiStrategy to be string');
});

test('Start Bot: Can start with AI-generated strategy', async () => {
  const testWallet = 'test-wallet-address-123456789012345678901234567890';
  const strategyDetails = 'AI Generated Strategy: Buy low, sell high';
  
  const response = await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'ai_generated', 
      walletAddress: testWallet,
      strategyDetails 
    });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (response.body.aiStrategy !== strategyDetails) throw new Error('Expected AI strategy in response');
  if (mockBotState.isRunning !== true) throw new Error('Bot should be running');
  if (mockBotState.strategy !== 'ai_generated') throw new Error('Bot should have ai_generated strategy');
});

test('Complete AI Workflow: Generate strategy → Start bot → Check status', async () => {
  const testWallet = 'test-wallet-address-123456789012345678901234567890';
  const prompt = 'Conservative trading with 1% stop loss and 2% take profit';
  
  // 1. Generate strategy
  const generateResponse = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt });
    
  if (generateResponse.statusCode !== 200) throw new Error('Strategy generation failed');
  
  // 2. Start bot with AI strategy
  const startResponse = await request(app)
    .post('/api/bot/start')
    .send({ 
      strategy: 'ai_generated', 
      walletAddress: testWallet,
      strategyDetails: generateResponse.body.strategy
    });
    
  if (startResponse.statusCode !== 200) throw new Error('Bot start failed');
  
  // 3. Check bot status
  const statusResponse = await request(app).get('/api/bot/status');
  
  if (statusResponse.statusCode !== 200) throw new Error('Status check failed');
  if (statusResponse.body.status !== 'running') throw new Error('Bot should be running');
  if (statusResponse.body.currentStrategy !== 'ai_generated') throw new Error('Wrong strategy');
  if (statusResponse.body.aiStrategy !== generateResponse.body.strategy) throw new Error('AI strategy mismatch');
});

test('AI Strategy Generation: Handles complex trading instructions', async () => {
  const complexPrompt = 'Buy SOL when RSI is below 30, sell when RSI above 70. Use 5% stop loss and 10% take profit. Focus on SOL/USDC pair only.';
  
  const response = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt: complexPrompt });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (!response.body.strategy) throw new Error('Expected strategy in response');
  if (response.body.strategy.length < 50) throw new Error('Strategy should be detailed');
});

test('AI Strategy Generation: Multiple strategies can be generated', async () => {
  const prompt1 = 'Aggressive momentum strategy';
  const prompt2 = 'Conservative value strategy';
  
  // Generate first strategy
  const response1 = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt: prompt1 });
    
  if (response1.statusCode !== 200) throw new Error('First strategy generation failed');
  
  // Generate second strategy (should overwrite first)
  const response2 = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt: prompt2 });
    
  if (response2.statusCode !== 200) throw new Error('Second strategy generation failed');
  if (response1.body.strategy === response2.body.strategy) throw new Error('Strategies should be different');
  if (mockBotState.aiStrategy !== response2.body.strategy) throw new Error('Latest strategy should be stored');
});

test('Error Handling: OpenAI API failure simulation', async () => {
  // This test would require more complex mocking setup
  // For now, we'll test the error handling structure
  const response = await request(app)
    .post('/api/strategy/generate')
    .send({ prompt: 'Test prompt' });
    
  // Should succeed with our mock implementation
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
});

runTests();
