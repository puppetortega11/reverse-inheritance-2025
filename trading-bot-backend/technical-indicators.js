/**
 * Technical Indicators Module
 * 
 * This module provides comprehensive technical analysis indicators including:
 * - Moving Averages (SMA, EMA, WMA)
 * - RSI (Relative Strength Index)
 * - MACD (Moving Average Convergence Divergence)
 * - Bollinger Bands
 * - Stochastic Oscillator
 * - Volume indicators
 * - Support and Resistance levels
 */

class TechnicalIndicators {
  constructor() {
    this.priceData = [];
    this.volumeData = [];
  }

  /**
   * Add new price and volume data point
   */
  addData(price, volume = 0, timestamp = null) {
    this.priceData.push({
      price,
      volume,
      timestamp: timestamp || new Date().toISOString()
    });
  }

  /**
   * Get the last N data points
   */
  getLastNData(n) {
    return this.priceData.slice(-n);
  }

  /**
   * Simple Moving Average (SMA)
   */
  calculateSMA(period = 20) {
    if (this.priceData.length < period) {
      return null;
    }

    const recentData = this.getLastNData(period);
    const sum = recentData.reduce((acc, data) => acc + data.price, 0);
    return sum / period;
  }

  /**
   * Exponential Moving Average (EMA)
   */
  calculateEMA(period = 20) {
    if (this.priceData.length < period) {
      return null;
    }

    const multiplier = 2 / (period + 1);
    let ema = this.priceData[0].price;

    for (let i = 1; i < this.priceData.length; i++) {
      ema = (this.priceData[i].price * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Weighted Moving Average (WMA)
   */
  calculateWMA(period = 20) {
    if (this.priceData.length < period) {
      return null;
    }

    const recentData = this.getLastNData(period);
    let weightedSum = 0;
    let weightSum = 0;

    for (let i = 0; i < recentData.length; i++) {
      const weight = period - i;
      weightedSum += recentData[i].price * weight;
      weightSum += weight;
    }

    return weightedSum / weightSum;
  }

  /**
   * Relative Strength Index (RSI)
   */
  calculateRSI(period = 14) {
    if (this.priceData.length < period + 1) {
      return null;
    }

    const recentData = this.getLastNData(period + 1);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < recentData.length; i++) {
      const change = recentData[i].price - recentData[i - 1].price;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (this.priceData.length < slowPeriod) {
      return null;
    }

    // Calculate EMAs
    const fastEMA = this.calculateEMA(fastPeriod);
    const slowEMA = this.calculateEMA(slowPeriod);

    if (!fastEMA || !slowEMA) {
      return null;
    }

    const macdLine = fastEMA - slowEMA;

    // For signal line, we would need to calculate EMA of MACD values
    // This is a simplified version
    const signalLine = macdLine * 0.9; // Approximation
    const histogram = macdLine - signalLine;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  /**
   * Bollinger Bands
   */
  calculateBollingerBands(period = 20, standardDeviations = 2) {
    if (this.priceData.length < period) {
      return null;
    }

    const sma = this.calculateSMA(period);
    if (!sma) return null;

    const recentData = this.getLastNData(period);
    
    // Calculate standard deviation
    const variance = recentData.reduce((acc, data) => {
      return acc + Math.pow(data.price - sma, 2);
    }, 0) / period;

    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * standardDeviations),
      middle: sma,
      lower: sma - (standardDeviation * standardDeviations),
      bandwidth: (standardDeviation * standardDeviations * 2) / sma * 100
    };
  }

  /**
   * Stochastic Oscillator
   */
  calculateStochastic(kPeriod = 14, dPeriod = 3) {
    if (this.priceData.length < kPeriod) {
      return null;
    }

    const recentData = this.getLastNData(kPeriod);
    const currentPrice = recentData[recentData.length - 1].price;
    const highestHigh = Math.max(...recentData.map(d => d.price));
    const lowestLow = Math.min(...recentData.map(d => d.price));

    const kPercent = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;

    // For %D, we would need to calculate SMA of %K values
    // This is a simplified version
    const dPercent = kPercent * 0.95; // Approximation

    return {
      k: kPercent,
      d: dPercent
    };
  }

  /**
   * Volume indicators
   */
  calculateVolumeIndicators(period = 20) {
    if (this.priceData.length < period) {
      return null;
    }

    const recentData = this.getLastNData(period);
    const currentVolume = recentData[recentData.length - 1].volume;
    const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / period;

    return {
      currentVolume,
      averageVolume: avgVolume,
      volumeRatio: currentVolume / avgVolume,
      volumeTrend: this.calculateVolumeTrend(period)
    };
  }

  /**
   * Calculate volume trend
   */
  calculateVolumeTrend(period = 10) {
    if (this.priceData.length < period) {
      return null;
    }

    const recentData = this.getLastNData(period);
    const firstHalf = recentData.slice(0, Math.floor(period / 2));
    const secondHalf = recentData.slice(Math.floor(period / 2));

    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.volume, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.volume, 0) / secondHalf.length;

    return (secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100;
  }

  /**
   * Support and Resistance levels
   */
  calculateSupportResistance(lookbackPeriod = 50) {
    if (this.priceData.length < lookbackPeriod) {
      return null;
    }

    const recentData = this.getLastNData(lookbackPeriod);
    const prices = recentData.map(d => d.price);

    // Find local highs and lows
    const highs = [];
    const lows = [];

    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
        highs.push(prices[i]);
      }
      if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
        lows.push(prices[i]);
      }
    }

    // Calculate support and resistance levels
    const resistance = highs.length > 0 ? Math.max(...highs) : null;
    const support = lows.length > 0 ? Math.min(...lows) : null;

    return {
      resistance,
      support,
      resistanceStrength: highs.length,
      supportStrength: lows.length
    };
  }

  /**
   * Get comprehensive technical analysis
   */
  getTechnicalAnalysis() {
    const currentPrice = this.priceData.length > 0 ? this.priceData[this.priceData.length - 1].price : null;
    
    if (!currentPrice) {
      return { error: 'No price data available' };
    }

    const analysis = {
      currentPrice,
      timestamp: new Date().toISOString(),
      movingAverages: {
        sma20: this.calculateSMA(20),
        sma50: this.calculateSMA(50),
        ema12: this.calculateEMA(12),
        ema26: this.calculateEMA(26)
      },
      momentum: {
        rsi: this.calculateRSI(14),
        macd: this.calculateMACD(12, 26, 9),
        stochastic: this.calculateStochastic(14, 3)
      },
      volatility: {
        bollingerBands: this.calculateBollingerBands(20, 2)
      },
      volume: this.calculateVolumeIndicators(20),
      supportResistance: this.calculateSupportResistance(50)
    };

    // Add trading signals
    analysis.signals = this.generateTradingSignals(analysis);

    return analysis;
  }

  /**
   * Generate trading signals based on technical analysis
   */
  generateTradingSignals(analysis) {
    const signals = {
      buy: [],
      sell: [],
      neutral: []
    };

    // RSI signals
    if (analysis.momentum.rsi) {
      if (analysis.momentum.rsi < 30) {
        signals.buy.push('RSI oversold');
      } else if (analysis.momentum.rsi > 70) {
        signals.sell.push('RSI overbought');
      }
    }

    // MACD signals
    if (analysis.momentum.macd) {
      if (analysis.momentum.macd.macd > analysis.momentum.macd.signal) {
        signals.buy.push('MACD bullish crossover');
      } else if (analysis.momentum.macd.macd < analysis.momentum.macd.signal) {
        signals.sell.push('MACD bearish crossover');
      }
    }

    // Bollinger Bands signals
    if (analysis.volatility.bollingerBands) {
      const bb = analysis.volatility.bollingerBands;
      if (analysis.currentPrice <= bb.lower) {
        signals.buy.push('Price at lower Bollinger Band');
      } else if (analysis.currentPrice >= bb.upper) {
        signals.sell.push('Price at upper Bollinger Band');
      }
    }

    // Moving average signals
    if (analysis.movingAverages.sma20 && analysis.movingAverages.sma50) {
      if (analysis.movingAverages.sma20 > analysis.movingAverages.sma50) {
        signals.buy.push('SMA 20 above SMA 50 (bullish trend)');
      } else {
        signals.sell.push('SMA 20 below SMA 50 (bearish trend)');
      }
    }

    // Volume signals
    if (analysis.volume && analysis.volume.volumeRatio > 1.5) {
      signals.buy.push('High volume confirmation');
    }

    // Support/Resistance signals
    if (analysis.supportResistance) {
      const sr = analysis.supportResistance;
      if (sr.support && analysis.currentPrice <= sr.support * 1.02) {
        signals.buy.push('Price near support level');
      }
      if (sr.resistance && analysis.currentPrice >= sr.resistance * 0.98) {
        signals.sell.push('Price near resistance level');
      }
    }

    // Calculate overall signal strength
    const buyStrength = signals.buy.length;
    const sellStrength = signals.sell.length;
    
    let overallSignal = 'neutral';
    if (buyStrength > sellStrength && buyStrength > 0) {
      overallSignal = 'buy';
    } else if (sellStrength > buyStrength && sellStrength > 0) {
      overallSignal = 'sell';
    }

    return {
      ...signals,
      overallSignal,
      buyStrength,
      sellStrength,
      confidence: Math.abs(buyStrength - sellStrength) / Math.max(buyStrength + sellStrength, 1)
    };
  }

  /**
   * Clear all data
   */
  clearData() {
    this.priceData = [];
    this.volumeData = [];
  }

  /**
   * Get data summary
   */
  getDataSummary() {
    return {
      dataPoints: this.priceData.length,
      dateRange: this.priceData.length > 0 ? {
        start: this.priceData[0].timestamp,
        end: this.priceData[this.priceData.length - 1].timestamp
      } : null,
      priceRange: this.priceData.length > 0 ? {
        min: Math.min(...this.priceData.map(d => d.price)),
        max: Math.max(...this.priceData.map(d => d.price))
      } : null
    };
  }
}

module.exports = {
  TechnicalIndicators
};
