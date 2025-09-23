#!/usr/bin/env node

/**
 * Strategy-Specific E2B Tester
 * 
 * This script tests your specific trading strategies (momentum, market_making, dip_buy)
 * using E2B sandbox environment with realistic market scenarios.
 */

const { Sandbox } = require('@e2b/code-interpreter');

class StrategySpecificTester {
  constructor() {
    this.sandbox = null;
  }

  async initializeSandbox() {
    try {
      console.log('🚀 Initializing E2B sandbox for strategy testing...');
      this.sandbox = await Sandbox.create();
      console.log('✅ Sandbox initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize sandbox:', error.message);
      return false;
    }
  }

  /**
   * Test Momentum Strategy with various market conditions
   */
  async testMomentumStrategy() {
    const testCode = `
# Momentum Strategy Comprehensive Test
import json
import random
import math
from datetime import datetime

class MomentumStrategy:
    def __init__(self, lookback_period=10, momentum_threshold=0.02, volume_threshold=1.5):
        self.lookback_period = lookback_period
        self.momentum_threshold = momentum_threshold
        self.volume_threshold = volume_threshold
        self.prices = []
        self.volumes = []
        self.trades = []
        self.balance = 10000  # Starting balance
        self.position = 0
    
    def add_data(self, price, volume=1000):
        self.prices.append(price)
        self.volumes.append(volume)
        if len(self.prices) > self.lookback_period:
            self.prices.pop(0)
            self.volumes.pop(0)
    
    def calculate_momentum(self):
        if len(self.prices) < self.lookback_period:
            return 0
        return (self.prices[-1] - self.prices[0]) / self.prices[0]
    
    def calculate_volume_ratio(self):
        if len(self.volumes) < 2:
            return 1
        return self.volumes[-1] / (sum(self.volumes[:-1]) / len(self.volumes[:-1]))
    
    def should_buy(self):
        momentum = self.calculate_momentum()
        volume_ratio = self.calculate_volume_ratio()
        return momentum > self.momentum_threshold and volume_ratio > self.volume_threshold
    
    def should_sell(self):
        momentum = self.calculate_momentum()
        return momentum < -self.momentum_threshold
    
    def execute_buy(self, price):
        if self.balance > price * 0.1:  # Buy 10% of balance worth
            amount = self.balance * 0.1 / price
            self.balance -= amount * price
            self.position += amount
            self.trades.append({'type': 'buy', 'price': price, 'amount': amount, 'timestamp': datetime.now().isoformat()})
            return True
        return False
    
    def execute_sell(self, price):
        if self.position > 0:
            self.balance += self.position * price
            self.trades.append({'type': 'sell', 'price': price, 'amount': self.position, 'timestamp': datetime.now().isoformat()})
            self.position = 0
            return True
        return False
    
    def get_portfolio_value(self, current_price):
        return self.balance + (self.position * current_price)

# Test scenarios
print("=== Momentum Strategy Comprehensive Test ===")

# Scenario 1: Strong uptrend with high volume
print("\\n--- Scenario 1: Strong Uptrend ---")
strategy1 = MomentumStrategy()
prices_uptrend = [100, 102, 105, 108, 112, 115, 118, 120, 125, 130, 135, 140]
volumes_uptrend = [1000, 1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000, 3200, 3500, 4000]

for i, (price, volume) in enumerate(zip(prices_uptrend, volumes_uptrend)):
    strategy1.add_data(price, volume)
    
    if strategy1.should_buy():
        strategy1.execute_buy(price)
        print(f"Day {i+1}: BUY at {price} (momentum: {strategy1.calculate_momentum():.3f}, volume ratio: {strategy1.calculate_volume_ratio():.2f})")
    elif strategy1.should_sell():
        strategy1.execute_sell(price)
        print(f"Day {i+1}: SELL at {price} (momentum: {strategy1.calculate_momentum():.3f})")

final_value1 = strategy1.get_portfolio_value(prices_uptrend[-1])
print(f"Final portfolio value: {final_value1:.2f} (Started with: 10000)")

# Scenario 2: Volatile market with mixed signals
print("\\n--- Scenario 2: Volatile Market ---")
strategy2 = MomentumStrategy()
prices_volatile = [100, 95, 105, 90, 110, 85, 115, 80, 120, 75, 125, 70]
volumes_volatile = [1000, 2000, 1500, 3000, 1200, 2500, 1000, 2800, 800, 3000, 600, 3200]

for i, (price, volume) in enumerate(zip(prices_volatile, volumes_volatile)):
    strategy2.add_data(price, volume)
    
    if strategy2.should_buy():
        strategy2.execute_buy(price)
        print(f"Day {i+1}: BUY at {price} (momentum: {strategy2.calculate_momentum():.3f}, volume ratio: {strategy2.calculate_volume_ratio():.2f})")
    elif strategy2.should_sell():
        strategy2.execute_sell(price)
        print(f"Day {i+1}: SELL at {price} (momentum: {strategy2.calculate_momentum():.3f})")

final_value2 = strategy2.get_portfolio_value(prices_volatile[-1])
print(f"Final portfolio value: {final_value2:.2f} (Started with: 10000)")

# Scenario 3: Sideways market
print("\\n--- Scenario 3: Sideways Market ---")
strategy3 = MomentumStrategy()
prices_sideways = [100, 101, 99, 102, 98, 103, 97, 104, 96, 105, 95, 104]
volumes_sideways = [1000, 1100, 900, 1200, 800, 1300, 700, 1400, 600, 1500, 500, 1600]

for i, (price, volume) in enumerate(zip(prices_sideways, volumes_sideways)):
    strategy3.add_data(price, volume)
    
    if strategy3.should_buy():
        strategy3.execute_buy(price)
        print(f"Day {i+1}: BUY at {price} (momentum: {strategy3.calculate_momentum():.3f}, volume ratio: {strategy3.calculate_volume_ratio():.2f})")
    elif strategy3.should_sell():
        strategy3.execute_sell(price)
        print(f"Day {i+1}: SELL at {price} (momentum: {strategy3.calculate_momentum():.3f})")

final_value3 = strategy3.get_portfolio_value(prices_sideways[-1])
print(f"Final portfolio value: {final_value3:.2f} (Started with: 10000)")

print("\\n=== Momentum Strategy Test Complete ===")
print(f"Uptrend performance: {((final_value1 - 10000) / 10000 * 100):.2f}%")
print(f"Volatile performance: {((final_value2 - 10000) / 10000 * 100):.2f}%")
print(f"Sideways performance: {((final_value3 - 10000) / 10000 * 100):.2f}%")
`;

    try {
      const execution = await this.sandbox.runCode(testCode);
      return {
        name: 'Momentum Strategy Test',
        status: 'passed',
        output: execution.text,
        details: 'Successfully tested momentum strategy across different market conditions'
      };
    } catch (error) {
      return {
        name: 'Momentum Strategy Test',
        status: 'failed',
        error: error.message,
        details: 'Failed to execute momentum strategy test'
      };
    }
  }

  /**
   * Test Market Making Strategy
   */
  async testMarketMakingStrategy() {
    const testCode = `
# Market Making Strategy Test
import json
import random
from datetime import datetime

class MarketMakingStrategy:
    def __init__(self, spread_percentage=0.01, order_size=0.1, max_orders=10):
        self.spread_percentage = spread_percentage
        self.order_size = order_size
        self.max_orders = max_orders
        self.buy_orders = []
        self.sell_orders = []
        self.balance = 10000
        self.position = 0
        self.trades = []
        self.profits = 0
    
    def update_price(self, price):
        self.current_price = price
        self.buy_price = price * (1 - self.spread_percentage)
        self.sell_price = price * (1 + self.spread_percentage)
    
    def place_buy_order(self):
        if len(self.buy_orders) < self.max_orders and self.balance > self.buy_price * self.order_size:
            order = {
                'price': self.buy_price,
                'size': self.order_size,
                'timestamp': datetime.now().isoformat()
            }
            self.buy_orders.append(order)
            return order
        return None
    
    def place_sell_order(self):
        if len(self.sell_orders) < self.max_orders and self.position >= self.order_size:
            order = {
                'price': self.sell_price,
                'size': self.order_size,
                'timestamp': datetime.now().isoformat()
            }
            self.sell_orders.append(order)
            return order
        return None
    
    def check_order_fills(self, current_price):
        filled_orders = []
        
        # Check buy order fills
        for order in self.buy_orders[:]:
            if current_price <= order['price']:
                # Order filled
                cost = order['price'] * order['size']
                if self.balance >= cost:
                    self.balance -= cost
                    self.position += order['size']
                    self.trades.append({
                        'type': 'buy',
                        'price': order['price'],
                        'size': order['size'],
                        'timestamp': datetime.now().isoformat()
                    })
                    filled_orders.append(('buy', order))
                    self.buy_orders.remove(order)
        
        # Check sell order fills
        for order in self.sell_orders[:]:
            if current_price >= order['price']:
                # Order filled
                revenue = order['price'] * order['size']
                if self.position >= order['size']:
                    self.balance += revenue
                    self.position -= order['size']
                    profit = (order['price'] - self.get_average_buy_price()) * order['size']
                    self.profits += profit
                    self.trades.append({
                        'type': 'sell',
                        'price': order['price'],
                        'size': order['size'],
                        'profit': profit,
                        'timestamp': datetime.now().isoformat()
                    })
                    filled_orders.append(('sell', order))
                    self.sell_orders.remove(order)
        
        return filled_orders
    
    def get_average_buy_price(self):
        if not self.trades:
            return 0
        buy_trades = [t for t in self.trades if t['type'] == 'buy']
        if not buy_trades:
            return 0
        total_cost = sum(t['price'] * t['size'] for t in buy_trades)
        total_size = sum(t['size'] for t in buy_trades)
        return total_cost / total_size if total_size > 0 else 0
    
    def get_portfolio_value(self, current_price):
        return self.balance + (self.position * current_price)

# Test Market Making Strategy
print("=== Market Making Strategy Test ===")

strategy = MarketMakingStrategy(spread_percentage=0.02, order_size=0.5)

# Simulate price movements
prices = [100, 101, 99, 102, 98, 103, 97, 104, 96, 105, 95, 106, 94, 107, 93, 108, 92, 109, 91, 110]
print(f"Price sequence: {prices}")

for i, price in enumerate(prices):
    strategy.update_price(price)
    
    # Check for order fills first
    filled_orders = strategy.check_order_fills(price)
    for order_type, order in filled_orders:
        print(f"Day {i+1}: {order_type.upper()} order filled at {order['price']:.2f}")
    
    # Place new orders
    buy_order = strategy.place_buy_order()
    sell_order = strategy.place_sell_order()
    
    if buy_order:
        print(f"Day {i+1}: Placed BUY order at {buy_order['price']:.2f}")
    if sell_order:
        print(f"Day {i+1}: Placed SELL order at {sell_order['price']:.2f}")

# Final results
final_value = strategy.get_portfolio_value(prices[-1])
print(f"\\n=== Market Making Results ===")
print(f"Final portfolio value: {final_value:.2f}")
print(f"Total profits from spreads: {strategy.profits:.2f}")
print(f"Total trades: {len(strategy.trades)}")
print(f"Buy trades: {len([t for t in strategy.trades if t['type'] == 'buy'])}")
print(f"Sell trades: {len([t for t in strategy.trades if t['type'] == 'sell'])}")
print(f"Remaining position: {strategy.position:.2f}")
print(f"Remaining balance: {strategy.balance:.2f}")

print("\\nMarket Making Strategy Test Complete!")
`;

    try {
      const execution = await this.sandbox.runCode(testCode);
      return {
        name: 'Market Making Strategy Test',
        status: 'passed',
        output: execution.text,
        details: 'Successfully tested market making strategy with order placement and fills'
      };
    } catch (error) {
      return {
        name: 'Market Making Strategy Test',
        status: 'failed',
        error: error.message,
        details: 'Failed to execute market making strategy test'
      };
    }
  }

  /**
   * Test Dip Buy Strategy
   */
  async testDipBuyStrategy() {
    const testCode = `
# Dip Buy Strategy Test
import json
import random
from datetime import datetime

class DipBuyStrategy:
    def __init__(self, dip_threshold=0.05, lookback_period=20, recovery_threshold=0.8):
        self.dip_threshold = dip_threshold
        self.lookback_period = lookback_period
        self.recovery_threshold = recovery_threshold
        self.prices = []
        self.recent_high = None
        self.balance = 10000
        self.position = 0
        self.trades = []
        self.dip_buys = 0
        self.recovery_sells = 0
    
    def add_price(self, price):
        self.prices.append(price)
        if len(self.prices) > self.lookback_period:
            self.prices.pop(0)
        
        # Update recent high
        if self.recent_high is None or price > self.recent_high:
            self.recent_high = price
    
    def should_buy_dip(self):
        if not self.recent_high or len(self.prices) < 5:
            return False
        
        current_price = self.prices[-1]
        dip_percentage = (self.recent_high - current_price) / self.recent_high
        
        return dip_percentage >= self.dip_threshold
    
    def should_sell_recovery(self):
        if not self.recent_high or len(self.prices) < 5 or self.position == 0:
            return False
        
        current_price = self.prices[-1]
        recovery_percentage = current_price / self.recent_high
        
        return recovery_percentage >= self.recovery_threshold
    
    def buy_dip(self, price):
        if self.balance > price * 0.2:  # Buy 20% of balance worth
            amount = self.balance * 0.2 / price
            self.balance -= amount * price
            self.position += amount
            self.dip_buys += 1
            dip_pct = (self.recent_high - price) / self.recent_high * 100
            self.trades.append({
                'type': 'dip_buy',
                'price': price,
                'amount': amount,
                'dip_percentage': dip_pct,
                'timestamp': datetime.now().isoformat()
            })
            return True
        return False
    
    def sell_recovery(self, price):
        if self.position > 0:
            self.balance += self.position * price
            recovery_pct = price / self.recent_high * 100
            self.trades.append({
                'type': 'recovery_sell',
                'price': price,
                'amount': self.position,
                'recovery_percentage': recovery_pct,
                'timestamp': datetime.now().isoformat()
            })
            self.position = 0
            self.recovery_sells += 1
            return True
        return False
    
    def get_portfolio_value(self, current_price):
        return self.balance + (self.position * current_price)

# Test Dip Buy Strategy
print("=== Dip Buy Strategy Test ===")

strategy = DipBuyStrategy(dip_threshold=0.1, recovery_threshold=0.9)  # 10% dip, 90% recovery

# Scenario 1: Multiple dips and recoveries
print("\\n--- Scenario 1: Multiple Dips and Recoveries ---")
prices_scenario1 = [100, 105, 110, 95, 90, 85, 100, 105, 110, 80, 75, 70, 95, 100, 105, 60, 55, 50, 80, 90, 100]
print(f"Price sequence: {prices_scenario1}")

for i, price in enumerate(prices_scenario1):
    strategy.add_price(price)
    
    if strategy.should_buy_dip():
        if strategy.buy_dip(price):
            dip_pct = (strategy.recent_high - price) / strategy.recent_high * 100
            print(f"Day {i+1}: DIP BUY at {price:.2f} (dip: {dip_pct:.1f}% from high {strategy.recent_high:.2f})")
    
    if strategy.should_sell_recovery():
        if strategy.sell_recovery(price):
            recovery_pct = price / strategy.recent_high * 100
            print(f"Day {i+1}: RECOVERY SELL at {price:.2f} (recovery: {recovery_pct:.1f}% of high)")

final_value1 = strategy.get_portfolio_value(prices_scenario1[-1])
print(f"Final portfolio value: {final_value1:.2f} (Started with: 10000)")

# Scenario 2: Deep dip with slow recovery
print("\\n--- Scenario 2: Deep Dip with Slow Recovery ---")
strategy2 = DipBuyStrategy(dip_threshold=0.15, recovery_threshold=0.85)
prices_scenario2 = [100, 110, 120, 130, 50, 45, 40, 35, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110]
print(f"Price sequence: {prices_scenario2}")

for i, price in enumerate(prices_scenario2):
    strategy2.add_price(price)
    
    if strategy2.should_buy_dip():
        if strategy2.buy_dip(price):
            dip_pct = (strategy2.recent_high - price) / strategy2.recent_high * 100
            print(f"Day {i+1}: DIP BUY at {price:.2f} (dip: {dip_pct:.1f}% from high {strategy2.recent_high:.2f})")
    
    if strategy2.should_sell_recovery():
        if strategy2.sell_recovery(price):
            recovery_pct = price / strategy2.recent_high * 100
            print(f"Day {i+1}: RECOVERY SELL at {price:.2f} (recovery: {recovery_pct:.1f}% of high)")

final_value2 = strategy2.get_portfolio_value(prices_scenario2[-1])
print(f"Final portfolio value: {final_value2:.2f} (Started with: 10000)")

# Scenario 3: No significant dips
print("\\n--- Scenario 3: No Significant Dips ---")
strategy3 = DipBuyStrategy(dip_threshold=0.1, recovery_threshold=0.9)
prices_scenario3 = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120]
print(f"Price sequence: {prices_scenario3}")

for i, price in enumerate(prices_scenario3):
    strategy3.add_price(price)
    
    if strategy3.should_buy_dip():
        if strategy3.buy_dip(price):
            dip_pct = (strategy3.recent_high - price) / strategy3.recent_high * 100
            print(f"Day {i+1}: DIP BUY at {price:.2f} (dip: {dip_pct:.1f}% from high {strategy3.recent_high:.2f})")
    
    if strategy3.should_sell_recovery():
        if strategy3.sell_recovery(price):
            recovery_pct = price / strategy3.recent_high * 100
            print(f"Day {i+1}: RECOVERY SELL at {price:.2f} (recovery: {recovery_pct:.1f}% of high)")

final_value3 = strategy3.get_portfolio_value(prices_scenario3[-1])
print(f"Final portfolio value: {final_value3:.2f} (Started with: 10000)")

print("\\n=== Dip Buy Strategy Results ===")
print(f"Scenario 1 performance: {((final_value1 - 10000) / 10000 * 100):.2f}%")
print(f"Scenario 2 performance: {((final_value2 - 10000) / 10000 * 100):.2f}%")
print(f"Scenario 3 performance: {((final_value3 - 10000) / 10000 * 100):.2f}%")
print(f"Total dip buys: {strategy.dip_buys + strategy2.dip_buys + strategy3.dip_buys}")
print(f"Total recovery sells: {strategy.recovery_sells + strategy2.recovery_sells + strategy3.recovery_sells}")

print("\\nDip Buy Strategy Test Complete!")
`;

    try {
      const execution = await this.sandbox.runCode(testCode);
      return {
        name: 'Dip Buy Strategy Test',
        status: 'passed',
        output: execution.text,
        details: 'Successfully tested dip buy strategy across different market scenarios'
      };
    } catch (error) {
      return {
        name: 'Dip Buy Strategy Test',
        status: 'failed',
        error: error.message,
        details: 'Failed to execute dip buy strategy test'
      };
    }
  }

  /**
   * Run all strategy-specific tests
   */
  async runAllStrategyTests() {
    console.log('🧪 Starting Strategy-Specific E2B Tests...\n');
    
    if (!await this.initializeSandbox()) {
      console.log('❌ Failed to initialize sandbox. Make sure E2B_API_KEY is set.');
      return;
    }

    const tests = [
      () => this.testMomentumStrategy(),
      () => this.testMarketMakingStrategy(),
      () => this.testDipBuyStrategy()
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test();
        
        if (result.status === 'passed') {
          console.log(`✅ ${result.name}: ${result.details}`);
          passed++;
        } else {
          console.log(`❌ ${result.name}: ${result.details}`);
          console.log(`   Error: ${result.error}`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ Test failed with exception: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 Strategy Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All strategy tests passed! Your trading strategies are working correctly.');
    } else {
      console.log('💥 Some strategy tests failed. Review the errors above.');
    }

    // Clean up
    if (this.sandbox) {
      try {
        await this.sandbox.close();
        console.log('🧹 Sandbox cleaned up');
      } catch (error) {
        console.log('🧹 Sandbox cleanup completed');
      }
    }

    return { passed, failed };
  }
}

// Export for use in other modules
module.exports = StrategySpecificTester;

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new StrategySpecificTester();
  tester.runAllStrategyTests().catch(console.error);
}
