const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// In-memory storage for demo (in production, use a database)
let botState = {
  isRunning: false,
  strategy: null,
  walletAddress: null,
  trades: [],
  balance: 0,
  aiStrategy: null
};

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    solanaConnection: connection.rpcEndpoint
  });
});

// Bot status endpoint
app.get('/api/bot/status', (req, res) => {
  res.json({
    status: botState.isRunning ? 'running' : 'ready',
    strategies: ['momentum', 'market_making', 'dip_buy', 'ai_generated'],
    currentStrategy: botState.strategy,
    walletAddress: botState.walletAddress,
    balance: botState.balance,
    tradesCount: botState.trades.length,
    aiStrategy: botState.aiStrategy,
    timestamp: new Date().toISOString()
  });
});

// Get wallet balance
app.get('/api/wallet/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    
    res.json({
      walletAddress,
      balance: balance / LAMPORTS_PER_SOL,
      balanceLamports: balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address' });
  }
});

// Start bot endpoint with enhanced trading logic
app.post('/api/bot/start', async (req, res) => {
  const { strategy, walletAddress } = req.body;
  
  if (!strategy || !walletAddress) {
    return res.status(400).json({ error: 'Missing strategy or wallet address' });
  }

  try {
    // Validate wallet address
    new PublicKey(walletAddress);
    
    // Get current balance
    const balance = await connection.getBalance(new PublicKey(walletAddress));
    
    // Update bot state
    botState = {
      isRunning: true,
      strategy,
      walletAddress,
      trades: botState.trades,
      balance: balance / LAMPORTS_PER_SOL
    };

    console.log(`Bot started with ${strategy} strategy for wallet ${walletAddress}`);
    
    // Start trading simulation (in production, this would be real trading logic)
    startTradingSimulation(strategy, walletAddress);
    
    res.json({
      success: true,
      message: `Bot started with ${strategy} strategy for wallet ${walletAddress}`,
      balance: botState.balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid wallet address' });
  }
});

// Stop bot endpoint
app.post('/api/bot/stop', (req, res) => {
  botState.isRunning = false;
  botState.strategy = null;
  console.log('Bot stopped');
  
  res.json({
    success: true,
    message: 'Bot stopped',
    timestamp: new Date().toISOString()
  });
});

// Get trades endpoint with enhanced data
app.get('/api/trades/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  const walletTrades = botState.trades.filter(trade => trade.walletAddress === walletAddress);
  const totalPnL = walletTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  
  res.json({
    trades: walletTrades,
    totalPnL,
    tradeCount: walletTrades.length,
    timestamp: new Date().toISOString()
  });
});

// Send SOL endpoint (for testing)
app.post('/api/wallet/send', async (req, res) => {
  const { fromWallet, toWallet, amount } = req.body;
  
  if (!fromWallet || !toWallet || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // This is a mock implementation - in production, you'd need proper wallet signing
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
  } catch (error) {
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// OpenAI Strategy Generation endpoint
app.post('/api/strategy/generate', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Solana trading bot strategy generator. Convert natural language trading instructions into a structured trading strategy. 

Respond with a clear, actionable trading strategy that includes:
1. Entry conditions (when to buy)
2. Exit conditions (when to sell) 
3. Risk management (stop loss, take profit)
4. Position sizing
5. Trading pairs to focus on

Keep it concise and practical for automated trading on Solana.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const strategy = completion.choices[0].message.content;
    
    // Store the AI strategy
    botState.aiStrategy = strategy;

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

// Trading simulation function
function startTradingSimulation(strategy, walletAddress) {
  if (!botState.isRunning) return;

  const simulateTrade = () => {
    if (!botState.isRunning) return;

    // Generate mock trade data
    const pairs = ['SOL/USDC', 'SOL/USDT', 'RAY/SOL'];
    const sides = ['buy', 'sell'];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const side = sides[Math.floor(Math.random() * sides.length)];
    const amount = Math.random() * 0.1 + 0.01; // 0.01 to 0.11 SOL
    const price = 100 + Math.random() * 50; // $100-$150
    const pnl = (Math.random() - 0.5) * 0.02; // -0.01 to +0.01 SOL

    const trade = {
      id: Date.now().toString(),
      pair,
      side,
      amount: parseFloat(amount.toFixed(4)),
      price: parseFloat(price.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(4)),
      walletAddress,
      strategy,
      timestamp: new Date().toISOString()
    };

    botState.trades.push(trade);
    
    // Update balance
    botState.balance += pnl;

    console.log(`Trade executed: ${side} ${amount} ${pair} at $${price} (P&L: ${pnl})`);

    // Schedule next trade
    const nextTradeDelay = strategy === 'momentum' ? 5000 : 
                          strategy === 'market_making' ? 3000 : 8000;
    
    setTimeout(simulateTrade, nextTradeDelay);
  };

  // Start first trade after a short delay
  setTimeout(simulateTrade, 2000);
}

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
  console.log(`Enhanced server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Solana RPC: ${connection.rpcEndpoint}`);
});
