const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Simple bot state
let botState = {
  isRunning: false,
  strategy: 'simple',
  startTime: null
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start bot
app.post('/api/bot/start', (req, res) => {
  botState = {
    isRunning: true,
    strategy: 'simple',
    startTime: Date.now()
  };
  res.json({ success: true, message: 'Bot started', bot: botState });
});

// Stop bot
app.post('/api/bot/stop', (req, res) => {
  botState = {
    isRunning: false,
    strategy: null,
    startTime: null
  };
  res.json({ success: true, message: 'Bot stopped', bot: botState });
});

// Get bot status
app.get('/api/bot/status', (req, res) => {
  res.json({ bot: botState });
});

app.listen(PORT, () => {
  console.log(`🚀 Trading bot backend running on port ${PORT}`);
});
