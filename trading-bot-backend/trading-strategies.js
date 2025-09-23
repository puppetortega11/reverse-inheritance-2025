/**
 * Trading Strategies Implementation
 * 
 * This module implements the three trading strategies:
 * - Momentum Strategy
 * - Market Making Strategy  
 * - Dip Buy Strategy
 */

const { RiskManager } = require('./risk-management');
const { TechnicalIndicators } = require('./technical-indicators');

class MomentumStrategy {
  constructor(lookbackPeriod = 10, momentumThreshold = 0.02, volumeThreshold = 1.5, riskOptions = {}) {
    this.lookbackPeriod = lookbackPeriod;
    this.momentumThreshold = momentumThreshold;
    this.volumeThreshold = volumeThreshold;
    this.prices = [];
    this.volumes = [];
    this.trades = [];
    this.balance = 10000; // Starting balance
    this.position = 0;
    
    // Initialize risk manager
    this.riskManager = new RiskManager({
      initialBalance: this.balance,
      maxPositionSize: riskOptions.maxPositionSize || 0.1,
      stopLossPercentage: riskOptions.stopLossPercentage || 0.05,
      takeProfitPercentage: riskOptions.takeProfitPercentage || 0.15,
      riskPerTrade: riskOptions.riskPerTrade || 0.02,
      ...riskOptions
    });
    
    // Initialize technical indicators
    this.indicators = new TechnicalIndicators();
  }

  addData(price, volume = 1000) {
    this.prices.push(price);
    this.volumes.push(volume);
    if (this.prices.length > this.lookbackPeriod) {
      this.prices.shift();
      this.volumes.shift();
    }
    
    // Add data to technical indicators
    this.indicators.addData(price, volume);
  }

  calculateMomentum() {
    if (this.prices.length < this.lookbackPeriod) {
      return 0;
    }
    return (this.prices[this.prices.length - 1] - this.prices[0]) / this.prices[0];
  }

  calculateVolumeRatio() {
    if (this.volumes.length < 2) {
      return 1;
    }
    const currentVolume = this.volumes[this.volumes.length - 1];
    const avgVolume = this.volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (this.volumes.length - 1);
    return currentVolume / avgVolume;
  }

  shouldBuy() {
    const momentum = this.calculateMomentum();
    const volumeRatio = this.calculateVolumeRatio();
    
    // Get technical analysis
    const technicalAnalysis = this.indicators.getTechnicalAnalysis();
    
    // Basic momentum check
    const basicMomentum = momentum > this.momentumThreshold && volumeRatio > this.volumeThreshold;
    
    // Technical indicator confirmation
    let technicalConfirmation = false;
    if (technicalAnalysis.signals) {
      const signals = technicalAnalysis.signals;
      technicalConfirmation = signals.overallSignal === 'buy' && signals.confidence > 0.3;
    }
    
    return basicMomentum && technicalConfirmation;
  }

  shouldSell() {
    const momentum = this.calculateMomentum();
    
    // Get technical analysis
    const technicalAnalysis = this.indicators.getTechnicalAnalysis();
    
    // Basic momentum check
    const basicMomentum = momentum < -this.momentumThreshold;
    
    // Technical indicator confirmation
    let technicalConfirmation = false;
    if (technicalAnalysis.signals) {
      const signals = technicalAnalysis.signals;
      technicalConfirmation = signals.overallSignal === 'sell' && signals.confidence > 0.3;
    }
    
    return basicMomentum || technicalConfirmation;
  }

  executeBuy(price) {
    try {
      // Calculate stop loss price (5% below entry)
      const stopLossPrice = price * (1 - this.riskManager.stopLossPercentage);
      
      // Use risk manager to calculate position size
      const positionCalc = this.riskManager.calculatePositionSize(price, stopLossPrice, this.balance);
      
      // Check if we can open the position
      const canOpen = this.riskManager.canOpenPosition(positionCalc.positionValue, price);
      
      if (!canOpen.canOpen) {
        console.log(`Cannot open position: ${canOpen.reason}`);
        return { success: false, reason: canOpen.reason };
      }
      
      // Open position through risk manager
      const openResult = this.riskManager.openPosition('SOL', price, stopLossPrice, null, 'momentum');
      
      if (openResult.success) {
        const position = openResult.position;
        this.balance -= position.value;
        this.position += position.size;
        
        this.trades.push({
          type: 'buy',
          price: price,
          amount: position.size,
          positionId: position.id,
          stopLoss: stopLossPrice,
          timestamp: new Date().toISOString(),
          strategy: 'momentum'
        });
        
        return { 
          success: true, 
          position: position,
          positionCalc: positionCalc
        };
      } else {
        return { success: false, reason: openResult.error };
      }
    } catch (error) {
      console.error('Error executing buy:', error.message);
      return { success: false, reason: error.message };
    }
  }

  executeSell(price) {
    if (this.position > 0) {
      // Find the most recent buy trade to get position ID
      const lastBuyTrade = this.trades.filter(t => t.type === 'buy').pop();
      
      if (lastBuyTrade && lastBuyTrade.positionId) {
        // Close position through risk manager
        const closeResult = this.riskManager.closePosition(lastBuyTrade.positionId, price, 'momentum_signal');
        
        if (closeResult.success) {
          this.balance += this.position * price;
          this.trades.push({
            type: 'sell',
            price: price,
            amount: this.position,
            positionId: lastBuyTrade.positionId,
            pnl: closeResult.pnl,
            pnlPercentage: closeResult.pnlPercentage,
            timestamp: new Date().toISOString(),
            strategy: 'momentum'
          });
          
          this.position = 0;
          return { 
            success: true, 
            pnl: closeResult.pnl,
            pnlPercentage: closeResult.pnlPercentage
          };
        }
      }
      
      // Fallback to simple sell if no position ID
      this.balance += this.position * price;
      this.trades.push({
        type: 'sell',
        price: price,
        amount: this.position,
        timestamp: new Date().toISOString(),
        strategy: 'momentum'
      });
      this.position = 0;
      return { success: true };
    }
    return { success: false, reason: 'No position to sell' };
  }

  getPortfolioValue(currentPrice) {
    return this.balance + (this.position * currentPrice);
  }

  getStatus() {
    const portfolioSummary = this.riskManager.getPortfolioSummary();
    const activePositions = this.riskManager.getActivePositions();
    const technicalAnalysis = this.indicators.getTechnicalAnalysis();
    
    return {
      strategy: 'momentum',
      balance: this.balance,
      position: this.position,
      trades: this.trades.length,
      momentum: this.calculateMomentum(),
      volumeRatio: this.calculateVolumeRatio(),
      riskMetrics: {
        totalPnL: portfolioSummary.totalPnL,
        totalPnLPercentage: portfolioSummary.totalPnLPercentage,
        currentDrawdown: portfolioSummary.currentDrawdown,
        winRate: portfolioSummary.winRate,
        profitFactor: portfolioSummary.profitFactor,
        activePositions: activePositions.length
      },
      technicalAnalysis: {
        rsi: technicalAnalysis.momentum?.rsi,
        macd: technicalAnalysis.momentum?.macd,
        bollingerBands: technicalAnalysis.volatility?.bollingerBands,
        signals: technicalAnalysis.signals
      }
    };
  }
}

class MarketMakingStrategy {
  constructor(spreadPercentage = 0.01, orderSize = 0.1, maxOrders = 10) {
    this.spreadPercentage = spreadPercentage;
    this.orderSize = orderSize;
    this.maxOrders = maxOrders;
    this.buyOrders = [];
    this.sellOrders = [];
    this.balance = 10000;
    this.position = 0;
    this.trades = [];
    this.profits = 0;
  }

  updatePrice(price) {
    this.currentPrice = price;
    this.buyPrice = price * (1 - this.spreadPercentage);
    this.sellPrice = price * (1 + this.spreadPercentage);
  }

  placeBuyOrder() {
    if (this.buyOrders.length < this.maxOrders && this.balance > this.buyPrice * this.orderSize) {
      const order = {
        price: this.buyPrice,
        size: this.orderSize,
        timestamp: new Date().toISOString()
      };
      this.buyOrders.push(order);
      return order;
    }
    return null;
  }

  placeSellOrder() {
    if (this.sellOrders.length < this.maxOrders && this.position >= this.orderSize) {
      const order = {
        price: this.sellPrice,
        size: this.orderSize,
        timestamp: new Date().toISOString()
      };
      this.sellOrders.push(order);
      return order;
    }
    return null;
  }

  checkOrderFills(currentPrice) {
    const filledOrders = [];

    // Check buy order fills
    for (let i = this.buyOrders.length - 1; i >= 0; i--) {
      const order = this.buyOrders[i];
      if (currentPrice <= order.price) {
        const cost = order.price * order.size;
        if (this.balance >= cost) {
          this.balance -= cost;
          this.position += order.size;
          this.trades.push({
            type: 'buy',
            price: order.price,
            size: order.size,
            timestamp: new Date().toISOString(),
            strategy: 'market_making'
          });
          filledOrders.push({ type: 'buy', order });
          this.buyOrders.splice(i, 1);
        }
      }
    }

    // Check sell order fills
    for (let i = this.sellOrders.length - 1; i >= 0; i--) {
      const order = this.sellOrders[i];
      if (currentPrice >= order.price) {
        const revenue = order.price * order.size;
        if (this.position >= order.size) {
          this.balance += revenue;
          this.position -= order.size;
          const profit = (order.price - this.getAverageBuyPrice()) * order.size;
          this.profits += profit;
          this.trades.push({
            type: 'sell',
            price: order.price,
            size: order.size,
            profit: profit,
            timestamp: new Date().toISOString(),
            strategy: 'market_making'
          });
          filledOrders.push({ type: 'sell', order });
          this.sellOrders.splice(i, 1);
        }
      }
    }

    return filledOrders;
  }

  getAverageBuyPrice() {
    if (this.trades.length === 0) return 0;
    const buyTrades = this.trades.filter(t => t.type === 'buy');
    if (buyTrades.length === 0) return 0;
    const totalCost = buyTrades.reduce((sum, t) => sum + (t.price * t.size), 0);
    const totalSize = buyTrades.reduce((sum, t) => sum + t.size, 0);
    return totalCost / totalSize;
  }

  getPortfolioValue(currentPrice) {
    return this.balance + (this.position * currentPrice);
  }

  getStatus() {
    return {
      strategy: 'market_making',
      balance: this.balance,
      position: this.position,
      trades: this.trades.length,
      profits: this.profits,
      buyOrders: this.buyOrders.length,
      sellOrders: this.sellOrders.length,
      spread: this.spreadPercentage
    };
  }
}

class DipBuyStrategy {
  constructor(dipThreshold = 0.05, lookbackPeriod = 20, recoveryThreshold = 0.8) {
    this.dipThreshold = dipThreshold;
    this.lookbackPeriod = lookbackPeriod;
    this.recoveryThreshold = recoveryThreshold;
    this.prices = [];
    this.recentHigh = null;
    this.balance = 10000;
    this.position = 0;
    this.trades = [];
    this.dipBuys = 0;
    this.recoverySells = 0;
  }

  addPrice(price) {
    this.prices.push(price);
    if (this.prices.length > this.lookbackPeriod) {
      this.prices.shift();
    }

    // Update recent high
    if (this.recentHigh === null || price > this.recentHigh) {
      this.recentHigh = price;
    }
  }

  shouldBuyDip() {
    if (!this.recentHigh || this.prices.length < 5) {
      return false;
    }

    const currentPrice = this.prices[this.prices.length - 1];
    const dipPercentage = (this.recentHigh - currentPrice) / this.recentHigh;

    return dipPercentage >= this.dipThreshold;
  }

  shouldSellRecovery() {
    if (!this.recentHigh || this.prices.length < 5 || this.position === 0) {
      return false;
    }

    const currentPrice = this.prices[this.prices.length - 1];
    const recoveryPercentage = currentPrice / this.recentHigh;

    return recoveryPercentage >= this.recoveryThreshold;
  }

  buyDip(price) {
    if (this.balance > price * 0.2) { // Buy 20% of balance worth
      const amount = (this.balance * 0.2) / price;
      this.balance -= amount * price;
      this.position += amount;
      this.dipBuys++;
      const dipPct = ((this.recentHigh - price) / this.recentHigh) * 100;
      this.trades.push({
        type: 'dip_buy',
        price: price,
        amount: amount,
        dipPercentage: dipPct,
        timestamp: new Date().toISOString(),
        strategy: 'dip_buy'
      });
      return true;
    }
    return false;
  }

  sellRecovery(price) {
    if (this.position > 0) {
      this.balance += this.position * price;
      const recoveryPct = (price / this.recentHigh) * 100;
      this.trades.push({
        type: 'recovery_sell',
        price: price,
        amount: this.position,
        recoveryPercentage: recoveryPct,
        timestamp: new Date().toISOString(),
        strategy: 'dip_buy'
      });
      this.position = 0;
      this.recoverySells++;
      return true;
    }
    return false;
  }

  getPortfolioValue(currentPrice) {
    return this.balance + (this.position * currentPrice);
  }

  getStatus() {
    return {
      strategy: 'dip_buy',
      balance: this.balance,
      position: this.position,
      trades: this.trades.length,
      dipBuys: this.dipBuys,
      recoverySells: this.recoverySells,
      recentHigh: this.recentHigh,
      currentDip: this.recentHigh ? ((this.recentHigh - this.prices[this.prices.length - 1]) / this.recentHigh) * 100 : 0
    };
  }
}

// Strategy Factory
class StrategyFactory {
  static createStrategy(strategyType, options = {}) {
    switch (strategyType) {
      case 'momentum':
        return new MomentumStrategy(
          options.lookbackPeriod,
          options.momentumThreshold,
          options.volumeThreshold
        );
      case 'market_making':
        return new MarketMakingStrategy(
          options.spreadPercentage,
          options.orderSize,
          options.maxOrders
        );
      case 'dip_buy':
        return new DipBuyStrategy(
          options.dipThreshold,
          options.lookbackPeriod,
          options.recoveryThreshold
        );
      default:
        throw new Error(`Unknown strategy type: ${strategyType}`);
    }
  }

  static getAvailableStrategies() {
    return ['momentum', 'market_making', 'dip_buy'];
  }
}

module.exports = {
  MomentumStrategy,
  MarketMakingStrategy,
  DipBuyStrategy,
  StrategyFactory
};
