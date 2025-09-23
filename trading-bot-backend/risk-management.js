/**
 * Risk Management Module
 * 
 * This module provides comprehensive risk management features including:
 * - Position sizing calculations
 * - Stop-loss and take-profit management
 * - Portfolio risk assessment
 * - Drawdown protection
 * - Risk-reward ratio calculations
 */

class RiskManager {
  constructor(options = {}) {
    // Risk parameters
    this.maxPositionSize = options.maxPositionSize || 0.1; // 10% of portfolio per position
    this.maxTotalExposure = options.maxTotalExposure || 0.5; // 50% total portfolio exposure
    this.stopLossPercentage = options.stopLossPercentage || 0.05; // 5% stop loss
    this.takeProfitPercentage = options.takeProfitPercentage || 0.15; // 15% take profit
    this.maxDrawdown = options.maxDrawdown || 0.2; // 20% maximum drawdown
    this.riskPerTrade = options.riskPerTrade || 0.02; // 2% risk per trade
    
    // Portfolio tracking
    this.initialBalance = options.initialBalance || 10000;
    this.currentBalance = this.initialBalance;
    this.positions = new Map(); // Track active positions
    this.trades = [];
    this.peakBalance = this.initialBalance;
    this.maxDrawdownReached = 0;
    
    // Risk metrics
    this.dailyPnL = 0;
    this.weeklyPnL = 0;
    this.monthlyPnL = 0;
    this.winRate = 0;
    this.averageWin = 0;
    this.averageLoss = 0;
    this.profitFactor = 0;
  }

  /**
   * Calculate position size based on risk parameters
   */
  calculatePositionSize(entryPrice, stopLossPrice, portfolioValue = null) {
    const currentPortfolio = portfolioValue || this.currentBalance;
    
    // Calculate risk amount in dollars
    const riskAmount = currentPortfolio * this.riskPerTrade;
    
    // Calculate price difference for stop loss
    const priceDifference = Math.abs(entryPrice - stopLossPrice);
    
    if (priceDifference === 0) {
      throw new Error('Stop loss price cannot be equal to entry price');
    }
    
    // Calculate position size based on risk
    const positionSize = riskAmount / priceDifference;
    
    // Apply maximum position size limit
    const maxPositionValue = currentPortfolio * this.maxPositionSize;
    const maxPositionSize = maxPositionValue / entryPrice;
    
    const finalPositionSize = Math.min(positionSize, maxPositionSize);
    
    return {
      positionSize: finalPositionSize,
      positionValue: finalPositionSize * entryPrice,
      riskAmount,
      riskPercentage: (riskAmount / currentPortfolio) * 100,
      maxPositionSize,
      isLimited: finalPositionSize === maxPositionSize
    };
  }

  /**
   * Check if a new position can be opened
   */
  canOpenPosition(positionValue, currentPrice) {
    const currentExposure = this.getTotalExposure();
    const newTotalExposure = currentExposure + positionValue;
    
    // Check maximum total exposure
    if (newTotalExposure > this.currentBalance * this.maxTotalExposure) {
      return {
        canOpen: false,
        reason: 'Maximum total exposure exceeded',
        currentExposure: currentExposure,
        newExposure: newTotalExposure,
        maxAllowed: this.currentBalance * this.maxTotalExposure
      };
    }
    
    // Check maximum drawdown
    if (this.getCurrentDrawdown() >= this.maxDrawdown) {
      return {
        canOpen: false,
        reason: 'Maximum drawdown reached',
        currentDrawdown: this.getCurrentDrawdown(),
        maxDrawdown: this.maxDrawdown
      };
    }
    
    return {
      canOpen: true,
      currentExposure: currentExposure,
      newExposure: newTotalExposure,
      maxAllowed: this.currentBalance * this.maxTotalExposure
    };
  }

  /**
   * Open a new position with risk management
   */
  openPosition(symbol, entryPrice, stopLossPrice, takeProfitPrice = null, strategy = 'unknown') {
    try {
      // Calculate position size
      const positionCalc = this.calculatePositionSize(entryPrice, stopLossPrice);
      
      // Check if position can be opened
      const canOpen = this.canOpenPosition(positionCalc.positionValue, entryPrice);
      
      if (!canOpen.canOpen) {
        throw new Error(`Cannot open position: ${canOpen.reason}`);
      }
      
      // Create position object
      const position = {
        id: this.generatePositionId(),
        symbol,
        entryPrice,
        stopLossPrice,
        takeProfitPrice: takeProfitPrice || this.calculateTakeProfit(entryPrice),
        size: positionCalc.positionSize,
        value: positionCalc.positionValue,
        strategy,
        timestamp: new Date().toISOString(),
        status: 'open',
        unrealizedPnL: 0,
        riskAmount: positionCalc.riskAmount
      };
      
      // Add to positions
      this.positions.set(position.id, position);
      
      // Update balance (assuming we're using margin/leverage)
      this.currentBalance -= positionCalc.positionValue;
      
      return {
        success: true,
        position,
        positionCalc,
        canOpen
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Close a position
   */
  closePosition(positionId, exitPrice, reason = 'manual') {
    const position = this.positions.get(positionId);
    
    if (!position) {
      return {
        success: false,
        error: 'Position not found'
      };
    }
    
    // Calculate P&L
    const pnl = (exitPrice - position.entryPrice) * position.size;
    const pnlPercentage = (pnl / position.value) * 100;
    
    // Update position
    position.exitPrice = exitPrice;
    position.exitTimestamp = new Date().toISOString();
    position.status = 'closed';
    position.realizedPnL = pnl;
    position.realizedPnLPercentage = pnlPercentage;
    position.exitReason = reason;
    
    // Update balance
    this.currentBalance += position.value + pnl;
    
    // Update peak balance
    if (this.currentBalance > this.peakBalance) {
      this.peakBalance = this.currentBalance;
    }
    
    // Move to trades history
    this.trades.push(position);
    this.positions.delete(positionId);
    
    // Update risk metrics
    this.updateRiskMetrics();
    
    return {
      success: true,
      position,
      pnl,
      pnlPercentage,
      newBalance: this.currentBalance
    };
  }

  /**
   * Check stop loss and take profit levels
   */
  checkRiskLevels(currentPrice) {
    const triggeredPositions = [];
    
    for (const [positionId, position] of this.positions) {
      let shouldClose = false;
      let reason = '';
      
      // Check stop loss
      if (position.stopLossPrice && currentPrice <= position.stopLossPrice) {
        shouldClose = true;
        reason = 'stop_loss';
      }
      
      // Check take profit
      if (position.takeProfitPrice && currentPrice >= position.takeProfitPrice) {
        shouldClose = true;
        reason = 'take_profit';
      }
      
      if (shouldClose) {
        const closeResult = this.closePosition(positionId, currentPrice, reason);
        if (closeResult.success) {
          triggeredPositions.push(closeResult);
        }
      }
    }
    
    return triggeredPositions;
  }

  /**
   * Calculate take profit price
   */
  calculateTakeProfit(entryPrice) {
    return entryPrice * (1 + this.takeProfitPercentage);
  }

  /**
   * Get total portfolio exposure
   */
  getTotalExposure() {
    let totalExposure = 0;
    for (const position of this.positions.values()) {
      totalExposure += position.value;
    }
    return totalExposure;
  }

  /**
   * Get current drawdown percentage
   */
  getCurrentDrawdown() {
    if (this.peakBalance === 0) return 0;
    return (this.peakBalance - this.currentBalance) / this.peakBalance;
  }

  /**
   * Update risk metrics
   */
  updateRiskMetrics() {
    if (this.trades.length === 0) return;
    
    const winningTrades = this.trades.filter(t => t.realizedPnL > 0);
    const losingTrades = this.trades.filter(t => t.realizedPnL < 0);
    
    this.winRate = (winningTrades.length / this.trades.length) * 100;
    
    if (winningTrades.length > 0) {
      this.averageWin = winningTrades.reduce((sum, t) => sum + t.realizedPnL, 0) / winningTrades.length;
    }
    
    if (losingTrades.length > 0) {
      this.averageLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.realizedPnL, 0) / losingTrades.length);
    }
    
    if (this.averageLoss > 0) {
      this.profitFactor = this.averageWin / this.averageLoss;
    }
    
    // Update max drawdown
    const currentDrawdown = this.getCurrentDrawdown();
    if (currentDrawdown > this.maxDrawdownReached) {
      this.maxDrawdownReached = currentDrawdown;
    }
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary() {
    const totalExposure = this.getTotalExposure();
    const currentDrawdown = this.getCurrentDrawdown();
    const totalPnL = this.currentBalance - this.initialBalance;
    const totalPnLPercentage = (totalPnL / this.initialBalance) * 100;
    
    return {
      initialBalance: this.initialBalance,
      currentBalance: this.currentBalance,
      totalPnL: totalPnL,
      totalPnLPercentage: totalPnLPercentage,
      totalExposure: totalExposure,
      exposurePercentage: (totalExposure / this.currentBalance) * 100,
      currentDrawdown: currentDrawdown,
      maxDrawdownReached: this.maxDrawdownReached,
      activePositions: this.positions.size,
      totalTrades: this.trades.length,
      winRate: this.winRate,
      averageWin: this.averageWin,
      averageLoss: this.averageLoss,
      profitFactor: this.profitFactor,
      peakBalance: this.peakBalance,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get active positions
   */
  getActivePositions() {
    const positions = [];
    for (const position of this.positions.values()) {
      positions.push({
        ...position,
        currentValue: position.size * position.entryPrice, // This would be updated with current price
        unrealizedPnL: 0 // This would be calculated with current price
      });
    }
    return positions;
  }

  /**
   * Generate unique position ID
   */
  generatePositionId() {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset risk manager (for testing)
   */
  reset() {
    this.currentBalance = this.initialBalance;
    this.positions.clear();
    this.trades = [];
    this.peakBalance = this.initialBalance;
    this.maxDrawdownReached = 0;
    this.dailyPnL = 0;
    this.weeklyPnL = 0;
    this.monthlyPnL = 0;
    this.winRate = 0;
    this.averageWin = 0;
    this.averageLoss = 0;
    this.profitFactor = 0;
  }

  /**
   * Update risk parameters
   */
  updateRiskParameters(newParams) {
    Object.assign(this, newParams);
    console.log('Risk parameters updated:', newParams);
  }
}

module.exports = {
  RiskManager
};
