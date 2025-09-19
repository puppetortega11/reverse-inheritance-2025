const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');
const SolanaTradingBot = require('./trading-engine');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');

// Initialize trading bot
let tradingBot = null;
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
  const botStatus = tradingBot ? tradingBot.getStatus() : {
    isRunning: false,
    balance: 0,
    trades: [],
    positions: [],
    priceFeeds: {}
  };

  res.json({
    status: botStatus.isRunning ? 'running' : 'ready',
    strategies: ['meme_scalp_momo_v2_autotuned'],
    currentStrategy: botState.strategy,
    walletAddress: botState.walletAddress,
    balance: botStatus.balance,
    tradesCount: botStatus.trades.length,
    positions: botStatus.positions,
    priceFeeds: botStatus.priceFeeds,
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

// Generate unique bot wallet for user
app.post('/api/bot/generate-wallet', async (req, res) => {
  const { userWalletAddress } = req.body;
  
  if (!userWalletAddress) {
    return res.status(400).json({ error: 'Missing user wallet address' });
  }

  try {
    // Validate user wallet address
    new PublicKey(userWalletAddress);
    
    // Create UNIQUE bot wallet keypair based on user's wallet address
    const userSeed = userWalletAddress.slice(0, 32); // Use first 32 chars as seed
    const botKeypair = Keypair.fromSeed(new Uint8Array(userSeed.split('').map(c => c.charCodeAt(0))));
    
    // Get initial bot wallet balance (should be 0)
    const botBalance = await connection.getBalance(botKeypair.publicKey);
    
    console.log(`Generated unique bot wallet for user ${userWalletAddress}: ${botKeypair.publicKey.toBase58()}`);
    
    res.json({
      success: true,
      botWalletAddress: botKeypair.publicKey.toBase58(),
      userWalletAddress: userWalletAddress,
      botBalance: botBalance / LAMPORTS_PER_SOL,
      message: 'Unique bot wallet generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating bot wallet:', error);
    res.status(400).json({ error: 'Invalid user wallet address' });
  }
});

// Start bot endpoint with hard-coded meme strategy
app.post('/api/bot/start', async (req, res) => {
  const { walletAddress } = req.body;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Missing wallet address' });
  }

  try {
    // Validate wallet address
    new PublicKey(walletAddress);
    
    // Create the SAME bot wallet keypair (deterministic)
    const userSeed = walletAddress.slice(0, 32);
    const walletKeypair = Keypair.fromSeed(new Uint8Array(userSeed.split('').map(c => c.charCodeAt(0))));
    
    // Get current bot wallet balance
    const botBalance = await connection.getBalance(walletKeypair.publicKey);
    
    if (botBalance < 0.001 * LAMPORTS_PER_SOL) {
      return res.status(400).json({ 
        error: 'Bot wallet needs at least 0.001 SOL to start trading',
        botWalletAddress: walletKeypair.publicKey.toBase58(),
        currentBalance: botBalance / LAMPORTS_PER_SOL
      });
    }
    
    // Initialize trading bot with hard-coded meme strategy
    tradingBot = new SolanaTradingBot({
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      walletKeypair,
      strategy: 'meme_scalp_momo_v2_autotuned', // Hard-coded strategy
      maxPositionSize: 0.1, // 10% max position
      stopLossPercent: 0.05, // 5% stop loss
      takeProfitPercent: 0.1 // 10% take profit
    });

    // Initialize the bot
    const initialized = await tradingBot.initialize();
    
    if (!initialized) {
      throw new Error('Failed to initialize trading bot');
    }

    // Update bot state
    botState = {
      isRunning: true,
      strategy: 'meme_scalp_momo_v2_autotuned',
      walletAddress,
      trades: tradingBot.trades,
      balance: botBalance / LAMPORTS_PER_SOL,
      aiStrategy: null
    };

    console.log(`Meme trading bot started for user ${walletAddress} with bot wallet ${walletKeypair.publicKey.toBase58()}`);
    
    res.json({
      success: true,
      message: `Meme trading bot started for wallet ${walletAddress}`,
      balance: botState.balance,
      strategy: 'meme_scalp_momo_v2_autotuned',
      botWalletAddress: walletKeypair.publicKey.toBase58(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting trading bot:', error);
    res.status(400).json({ error: 'Invalid wallet address or bot initialization failed' });
  }
});

// Stop bot endpoint
app.post('/api/bot/stop', async (req, res) => {
  try {
    if (tradingBot) {
      await tradingBot.stop();
      tradingBot = null;
    }
    
    botState.isRunning = false;
    botState.strategy = null;
    console.log('Real trading bot stopped');
    
    res.json({
      success: true,
      message: 'Real trading bot stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});

// Get trades endpoint with real trading data
app.get('/api/trades/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  
  const trades = tradingBot ? tradingBot.trades : [];
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  
  res.json({
    trades: trades,
    totalPnL,
    tradeCount: trades.length,
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

// Send SOL to bot wallet endpoint
app.post('/api/wallet/send-to-bot', async (req, res) => {
  const { fromWallet, amount, botWalletAddress } = req.body;
  
  if (!fromWallet || !amount || !botWalletAddress) {
    return res.status(400).json({ error: 'Missing required fields: fromWallet, amount, botWalletAddress' });
  }

  try {
    // Validate wallet addresses
    new PublicKey(fromWallet);
    new PublicKey(botWalletAddress);
    
    // Validate amount
    const solAmount = parseFloat(amount);
    if (solAmount <= 0 || solAmount > 100) {
      return res.status(400).json({ error: 'Amount must be between 0 and 100 SOL' });
    }

    // Check sender balance
    const senderBalance = await connection.getBalance(new PublicKey(fromWallet));
    const senderBalanceSOL = senderBalance / LAMPORTS_PER_SOL;
    
    if (senderBalanceSOL < solAmount) {
      return res.status(400).json({ 
        error: 'Insufficient balance', 
        currentBalance: senderBalanceSOL,
        requestedAmount: solAmount 
      });
    }

    // Create transaction
    const transaction = new Transaction();
    
    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(fromWallet),
        toPubkey: new PublicKey(botWalletAddress),
        lamports: Math.floor(solAmount * LAMPORTS_PER_SOL)
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(fromWallet);

    console.log(`Transfer initiated: ${solAmount} SOL from ${fromWallet} to bot wallet ${botWalletAddress}`);
    
    res.json({
      success: true,
      message: `Transfer initiated: ${solAmount} SOL to bot wallet`,
      transaction: {
        fromWallet,
        toWallet: botWalletAddress,
        amount: solAmount,
        lamports: Math.floor(solAmount * LAMPORTS_PER_SOL)
      },
      // Note: In production, you'd need to sign and send this transaction
      // For now, we're just preparing it
      instructions: 'Transaction prepared. Sign and send using your wallet.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(400).json({ error: 'Invalid wallet addresses or amount' });
  }
});

// Get bot wallet address endpoint
app.get('/api/bot/wallet-address', (req, res) => {
  if (!tradingBot || !tradingBot.walletKeypair) {
    return res.status(400).json({ error: 'Bot not initialized' });
  }

  res.json({
    botWalletAddress: tradingBot.walletKeypair.publicKey.toBase58(),
    timestamp: new Date().toISOString()
  });
});

// Cash out endpoint - send all bot funds back to user wallet
app.post('/api/bot/cash-out', async (req, res) => {
  const { userWalletAddress } = req.body;
  
  if (!userWalletAddress) {
    return res.status(400).json({ error: 'User wallet address is required' });
  }

  if (!tradingBot || !tradingBot.walletKeypair) {
    return res.status(400).json({ error: 'Bot not initialized' });
  }

  try {
    // Validate user wallet address
    new PublicKey(userWalletAddress);
    
    // Get current bot balance
    const botBalance = await connection.getBalance(tradingBot.walletKeypair.publicKey);
    const botBalanceSOL = botBalance / LAMPORTS_PER_SOL;
    
    if (botBalanceSOL < 0.001) { // Minimum 0.001 SOL to cover transaction fees
      return res.status(400).json({ 
        error: 'Insufficient balance for cash out', 
        currentBalance: botBalanceSOL,
        minimumRequired: 0.001 
      });
    }

    // Calculate amount to send (leave small amount for fees)
    const amountToSend = botBalanceSOL - 0.001; // Keep 0.001 SOL for fees
    const lamportsToSend = Math.floor(amountToSend * LAMPORTS_PER_SOL);

    // Create transaction
    const transaction = new Transaction();
    
    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: tradingBot.walletKeypair.publicKey,
        toPubkey: new PublicKey(userWalletAddress),
        lamports: lamportsToSend
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = tradingBot.walletKeypair.publicKey;

    console.log(`Cash out initiated: ${amountToSend} SOL from bot to user wallet ${userWalletAddress}`);
    
    res.json({
      success: true,
      message: `Cash out prepared: ${amountToSend} SOL to user wallet`,
      transaction: {
        fromWallet: tradingBot.walletKeypair.publicKey.toBase58(),
        toWallet: userWalletAddress,
        amount: amountToSend,
        lamports: lamportsToSend,
        remainingBalance: 0.001 // Amount left for fees
      },
      instructions: 'Transaction prepared. Sign and send using bot wallet.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating cash out transaction:', error);
    res.status(400).json({ error: 'Invalid wallet address or transaction failed' });
  }
});

// Get bot balance endpoint
app.get('/api/bot/balance', async (req, res) => {
  if (!tradingBot || !tradingBot.walletKeypair) {
    return res.status(400).json({ error: 'Bot not initialized' });
  }

  try {
    const balance = await connection.getBalance(tradingBot.walletKeypair.publicKey);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    
    res.json({
      botWalletAddress: tradingBot.walletKeypair.publicKey.toBase58(),
      balance: balanceSOL,
      balanceLamports: balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting bot balance:', error);
    res.status(500).json({ error: 'Failed to get bot balance' });
  }
});

// Strategy is now hard-coded in the trading engine
// No AI generation needed - simpler and more reliable

// Real trading bot is now handled by SolanaTradingBot class

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
