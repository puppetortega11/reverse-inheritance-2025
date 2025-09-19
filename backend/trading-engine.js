const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createTransferInstruction, getAccount } = require('@solana/spl-token');
const cron = require('node-cron');
const WebSocket = require('ws');
const axios = require('axios');

class SolanaTradingBot {
  constructor(config) {
    this.connection = new Connection(config.rpcUrl || 'https://api.devnet.solana.com');
    this.walletKeypair = config.walletKeypair;
    this.strategy = config.strategy;
    this.isRunning = false;
    this.trades = [];
    this.balance = 0;
    this.priceFeeds = new Map();
    this.positions = new Map();
    
    // Trading parameters
    this.maxPositionSize = config.maxPositionSize || 0.1; // 10% of wallet
    this.stopLossPercent = config.stopLossPercent || 0.05; // 5%
    this.takeProfitPercent = config.takeProfitPercent || 0.1; // 10%
    
    // Dynamic meme token discovery - will scan for any tokens meeting criteria
    this.memeTokens = new Map();
    this.discoveredTokens = new Set();
    
    // Popular meme token addresses for initial discovery
    this.initialTokens = {
      'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      'PEPE': '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
      'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
      'POPCAT': '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
      'MYRO': '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'
    };
  }

  async initialize() {
    try {
      // Get initial balance
      this.balance = await this.getWalletBalance();
      console.log(`Bot initialized with balance: ${this.balance} SOL`);
      
      // Initialize with popular meme tokens
      for (const [symbol, address] of Object.entries(this.initialTokens)) {
        this.memeTokens.set(symbol, {
          address,
          symbol,
          name: symbol,
          discoveredAt: Date.now()
        });
        this.discoveredTokens.add(address);
      }
      
      // Start price monitoring
      this.startPriceMonitoring();
      
      // Start trading loop
      this.startTradingLoop();
      
      // Start token discovery (every 5 minutes)
      cron.schedule('*/5 * * * *', async () => {
        await this.discoverMemeTokens();
      });
      
      this.isRunning = true;
      console.log(`Bot initialized with ${this.memeTokens.size} meme tokens`);
      return true;
    } catch (error) {
      console.error('Failed to initialize bot:', error);
      return false;
    }
  }

  async getWalletBalance() {
    try {
      const balance = await this.connection.getBalance(this.walletKeypair.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  async getTokenPrice(tokenAddress) {
    try {
      // Using Jupiter API for price data (free tier available)
      const response = await axios.get(`https://price.jup.ag/v4/price?ids=${tokenAddress}`);
      return response.data.data[tokenAddress]?.price || 0;
    } catch (error) {
      console.error(`Error getting price for ${tokenAddress}:`, error);
      return 0;
    }
  }

  // Discover new meme tokens based on strategy criteria
  async discoverMemeTokens() {
    try {
      // Get trending tokens from Jupiter API
      const response = await axios.get('https://api.jup.ag/tokens');
      const allTokens = response.data;
      
      // Filter tokens based on strategy criteria
      const eligibleTokens = allTokens.filter(token => {
        // Basic meme token criteria (you can expand this)
        const isMemeToken = token.symbol && (
          token.symbol.includes('DOGE') ||
          token.symbol.includes('PEPE') ||
          token.symbol.includes('SHIB') ||
          token.symbol.includes('BONK') ||
          token.symbol.includes('WIF') ||
          token.symbol.includes('POPCAT') ||
          token.symbol.includes('MYRO') ||
          token.symbol.length <= 5 || // Short symbols often indicate meme tokens
          token.name?.toLowerCase().includes('meme') ||
          token.name?.toLowerCase().includes('dog') ||
          token.name?.toLowerCase().includes('cat')
        );
        
        return isMemeToken && token.address;
      });
      
      // Add new tokens to our trading list
      eligibleTokens.forEach(token => {
        if (!this.discoveredTokens.has(token.address)) {
          this.memeTokens.set(token.symbol, {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            discoveredAt: Date.now()
          });
          this.discoveredTokens.add(token.address);
          console.log(`Discovered new meme token: ${token.symbol} (${token.address})`);
        }
      });
      
      console.log(`Total meme tokens discovered: ${this.memeTokens.size}`);
    } catch (error) {
      console.error('Error discovering meme tokens:', error);
    }
  }

  // Check if token meets strategy criteria
  async validateTokenForStrategy(tokenAddress, strategyParams) {
    try {
      // For demo purposes, we'll simulate validation
      // In production, you'd check actual liquidity, volume, holder count
      const mockLiquidity = Math.random() * 100000; // Random liquidity
      const mockVolume = Math.random() * 200000; // Random volume
      const mockHolders = Math.floor(Math.random() * 2000) + 100; // Random holder count
      
      if (mockLiquidity < strategyParams.minLiquidity) {
        console.log(`Token ${tokenAddress} rejected: liquidity ${mockLiquidity} < ${strategyParams.minLiquidity}`);
        return false;
      }
      
      if (mockVolume < strategyParams.minVolume) {
        console.log(`Token ${tokenAddress} rejected: volume ${mockVolume} < ${strategyParams.minVolume}`);
        return false;
      }
      
      if (mockHolders < strategyParams.minHolders) {
        console.log(`Token ${tokenAddress} rejected: holders ${mockHolders} < ${strategyParams.minHolders}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error validating token ${tokenAddress}:`, error);
      return false;
    }
  }

  startPriceMonitoring() {
    // Update prices every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      for (const [symbol, tokenData] of this.memeTokens) {
        try {
          const price = await this.getTokenPrice(tokenData.address);
          this.priceFeeds.set(symbol, {
            price,
            timestamp: Date.now(),
            address: tokenData.address,
            symbol: tokenData.symbol,
            name: tokenData.name
          });
          console.log(`${symbol}: $${price}`);
        } catch (error) {
          console.error(`Error updating price for ${symbol}:`, error);
        }
      }
    });
  }

  startTradingLoop() {
    // Execute trading strategy immediately and then every 30 seconds
    console.log('🚀 Starting immediate trading execution...');
    this.executeStrategy(); // Execute immediately
    
    cron.schedule('*/30 * * * * *', async () => {
      if (!this.isRunning) return;
      
      try {
        await this.executeStrategy();
      } catch (error) {
        console.error('Error in trading loop:', error);
      }
    });
  }

  async executeStrategy() {
    if (!this.strategy) return;

    // Parse AI-generated strategy
    const strategyParams = this.parseStrategy(this.strategy);
    
    for (const [symbol, tokenData] of this.priceFeeds) {
      try {
        await this.evaluateToken(symbol, tokenData, strategyParams);
      } catch (error) {
        console.error(`Error evaluating ${symbol}:`, error);
      }
    }
  }

  parseStrategy(strategyText) {
    // Hard-coded meme scalp strategy based on user's specification
    if (strategyText.includes('meme_scalp_momo_v2_autotuned') || strategyText.includes('meme')) {
      return {
        strategyName: 'meme_scalp_momo_v2_autotuned',
        capitalBase: 0.1, // SOL (minimum)
        maxPositions: 3,
        riskPerTrade: 0.004, // 0.4%
        positionSizeMin: 0.01, // SOL (scaled down for smaller capital)
        positionSizeMax: 0.05, // SOL (scaled down for smaller capital)
        dailyMaxDrawdown: 0.025, // 2.5%
        dailyProfitLock: 0.018, // 1.8%
        entryCondition: 'momentum_trigger',
        exitCondition: 'trailing_stop',
        stopLoss: 0.01, // 1% ATR-based
        takeProfit: [
          { trigger: 0.005, size: 0.35 }, // 0.5% profit, sell 35%
          { trigger: 0.01, size: 0.35 },  // 1% profit, sell 35%
          { trigger: 0.018, size: 0.20 }, // 1.8% profit, sell 20%
          { trigger: 0.04, size: 0.10 }   // 4% profit, sell 10% (runner)
        ],
        positionSize: 0.1,
        maxSlippage: 0.006, // 0.6%
        minLiquidity: 40000, // USD
        minVolume: 75000, // USD
        minHolders: 500,
        tokenAgeHours: 8,
        reentryCooldown: 20, // minutes
        maxTradesPerHour: 2
      };
    }

    // Fallback for other strategies
    const params = {
      entryCondition: 'rsi_below_30',
      exitCondition: 'rsi_above_70',
      stopLoss: 0.05,
      takeProfit: 0.1,
      positionSize: 0.1
    };

    // Extract parameters from strategy text
    if (strategyText.includes('RSI') || strategyText.includes('rsi')) {
      if (strategyText.includes('below 30')) params.entryCondition = 'rsi_below_30';
      if (strategyText.includes('above 70')) params.exitCondition = 'rsi_above_70';
    }

    if (strategyText.includes('stop loss')) {
      const stopLossMatch = strategyText.match(/stop loss.*?(\d+)%/);
      if (stopLossMatch) params.stopLoss = parseFloat(stopLossMatch[1]) / 100;
    }

    if (strategyText.includes('take profit')) {
      const takeProfitMatch = strategyText.match(/take profit.*?(\d+)%/);
      if (takeProfitMatch) params.takeProfit = parseFloat(takeProfitMatch[1]) / 100;
    }

    return params;
  }

  async evaluateToken(symbol, tokenData, strategyParams) {
    const currentPrice = tokenData.price;
    const position = this.positions.get(symbol);

    // First validate token meets strategy criteria
    const isValidToken = await this.validateTokenForStrategy(tokenData.address, strategyParams);
    if (!isValidToken) {
      console.log(`Token ${symbol} does not meet strategy criteria, skipping`);
      return;
    }

    if (!position) {
      // No position - check for entry
      if (await this.shouldEnter(symbol, currentPrice, strategyParams)) {
        await this.enterPosition(symbol, currentPrice, strategyParams);
      }
    } else {
      // Have position - check for exit
      if (await this.shouldExit(symbol, currentPrice, position, strategyParams)) {
        await this.exitPosition(symbol, currentPrice, position);
      }
    }
  }

  async shouldEnter(symbol, price, params) {
    // Simple momentum strategy for demo
    // In production, you'd implement RSI, MACD, etc.
    const recentPrices = this.getRecentPrices(symbol);
    if (recentPrices.length < 5) return false;

    const priceChange = (price - recentPrices[0]) / recentPrices[0];
    return priceChange < -0.05; // Enter on 5% drop
  }

  async shouldExit(symbol, currentPrice, position, params) {
    const entryPrice = position.entryPrice;
    const priceChange = (currentPrice - entryPrice) / entryPrice;

    // Stop loss
    if (priceChange <= -params.stopLoss) {
      console.log(`Stop loss triggered for ${symbol}: ${priceChange * 100}%`);
      return true;
    }

    // Take profit
    if (priceChange >= params.takeProfit) {
      console.log(`Take profit triggered for ${symbol}: ${priceChange * 100}%`);
      return true;
    }

    return false;
  }

  async enterPosition(symbol, price, params) {
    try {
      const tokenAddress = this.memeTokens[symbol];
      const amount = this.balance * params.positionSize;

      console.log(`Entering position: ${symbol} at $${price} with ${amount} SOL`);

      // For demo purposes, we'll simulate the trade
      // In production, you'd execute actual Solana transactions
      const trade = {
        id: Date.now().toString(),
        symbol,
        side: 'buy',
        amount,
        price,
        timestamp: new Date().toISOString(),
        status: 'executed'
      };

      this.trades.push(trade);
      this.positions.set(symbol, {
        entryPrice: price,
        amount,
        timestamp: Date.now()
      });

      console.log(`Position entered: ${symbol}`);
      return trade;
    } catch (error) {
      console.error(`Error entering position for ${symbol}:`, error);
      return null;
    }
  }

  async exitPosition(symbol, currentPrice, position) {
    try {
      const pnl = (currentPrice - position.entryPrice) / position.entryPrice;
      const tradeAmount = position.amount * (1 + pnl);

      console.log(`Exiting position: ${symbol} at $${currentPrice} with PnL: ${pnl * 100}%`);

      const trade = {
        id: Date.now().toString(),
        symbol,
        side: 'sell',
        amount: tradeAmount,
        price: currentPrice,
        pnl: pnl * position.amount,
        timestamp: new Date().toISOString(),
        status: 'executed'
      };

      this.trades.push(trade);
      this.positions.delete(symbol);

      // Update balance
      this.balance += trade.pnl;

      console.log(`Position exited: ${symbol}, PnL: ${trade.pnl}`);
      return trade;
    } catch (error) {
      console.error(`Error exiting position for ${symbol}:`, error);
      return null;
    }
  }

  getRecentPrices(symbol) {
    // In production, you'd maintain a price history
    // For demo, return mock recent prices
    const currentPrice = this.priceFeeds.get(symbol)?.price || 0;
    return [currentPrice * 0.98, currentPrice * 0.99, currentPrice * 1.01, currentPrice * 1.02, currentPrice];
  }

  async stop() {
    this.isRunning = false;
    console.log('Trading bot stopped');
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

module.exports = SolanaTradingBot;
