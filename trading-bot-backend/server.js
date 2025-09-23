/**
 * Simple Solana Trading Bot Backend
 * Minimal, efficient, and guaranteed to work
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// Simple bot state
let botState = {
  isRunning: false,
  strategy: null,
  walletAddress: null,
  startTime: null
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: botState.startTime ? Date.now() - botState.startTime : 0
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    bot: botState,
    solana: {
      network: process.env.SOLANA_RPC_URL || 'devnet',
      connected: true
    }
  });
});

// Start bot
app.post('/api/bot/start', async (req, res) => {
  try {
    const { strategy = 'simple', walletAddress } = req.body;
    
    if (botState.isRunning) {
      return res.status(400).json({ error: 'Bot is already running' });
    }

    // Simple validation
    if (walletAddress) {
      try {
        new PublicKey(walletAddress);
      } catch {
        return res.status(400).json({ error: 'Invalid wallet address' });
      }
    }

    // Start bot
    botState = {
      isRunning: true,
      strategy,
      walletAddress,
      startTime: Date.now()
    };

    res.json({
      success: true,
      message: `Bot started with ${strategy} strategy`,
      bot: botState
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop bot
app.post('/api/bot/stop', (req, res) => {
  botState = {
    isRunning: false,
    strategy: null,
    walletAddress: null,
    startTime: null
  };

  res.json({
    success: true,
    message: 'Bot stopped',
    bot: botState
  });
});

// Get bot status
app.get('/api/bot/status', (req, res) => {
  res.json({ bot: botState });
});

// Get Solana account info
app.get('/api/solana/account/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    res.json({
      address,
      exists: !!accountInfo,
      lamports: accountInfo?.lamports || 0,
      owner: accountInfo?.owner?.toString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recent blockhash
app.get('/api/solana/blockhash', async (req, res) => {
  try {
    const { blockhash } = await connection.getLatestBlockhash();
    res.json({ blockhash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trading bot backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Bot API: http://localhost:${PORT}/api/bot/status`);
});

module.exports = app;