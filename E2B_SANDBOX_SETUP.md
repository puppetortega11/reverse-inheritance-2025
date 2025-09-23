# E2B Sandbox Testing Setup for Crypto Trading Bot

## Overview

This setup uses [E2B](https://github.com/e2b-dev/E2B) to create secure, isolated sandbox environments for testing your crypto trading bot without risking real money or affecting live systems.

## Prerequisites

1. **E2B Account**: Sign up at [e2b.dev](https://e2b.dev)
2. **API Key**: Get your API key from the E2B dashboard
3. **Node.js**: Version 20+ (already configured in your project)

## Installation

```bash
# Install E2B SDK
npm install @e2b/code-interpreter

# Set up environment variable
export E2B_API_KEY=your_e2b_api_key_here
```

## Environment Setup

Create a `.env` file in your backend directory:

```bash
# E2B Configuration
E2B_API_KEY=e2b_your_api_key_here

# Trading Bot Configuration
NODE_ENV=development
PORT=8000
```

## Usage

### Basic Testing

```bash
# Run E2B sandbox tests
npm run test:sandbox

# Or run directly
node e2b-test-runner.js
```

### What Gets Tested

1. **Basic Trading Bot Functionality**
   - Order placement (buy/sell)
   - Balance management
   - Position tracking
   - Trade history

2. **Trading Strategy Logic**
   - Moving average calculations
   - Signal generation
   - Strategy performance metrics

3. **Risk Management**
   - Position sizing limits
   - Stop loss calculations
   - Daily loss limits
   - Portfolio protection

4. **API Integration Simulation**
   - Mock exchange API
   - Order status checking
   - Balance retrieval
   - Price data simulation

5. **Error Handling**
   - Input validation
   - Edge case handling
   - Exception management
   - Graceful degradation

## Advanced Testing Scenarios

### Custom Test Scenarios

You can create custom test scenarios by extending the `TradingBotSandboxTester` class:

```javascript
const TradingBotSandboxTester = require('./e2b-test-runner');

class CustomTradingTester extends TradingBotSandboxTester {
  async testCustomStrategy() {
    const testCode = `
# Your custom trading strategy test
class MyCustomStrategy:
    def __init__(self):
        self.positions = {}
        self.balance = 10000
    
    def execute_strategy(self, market_data):
        # Your strategy logic here
        pass

# Test your strategy
strategy = MyCustomStrategy()
result = strategy.execute_strategy(mock_data)
print(f"Strategy result: {result}")
`;

    try {
      const execution = await this.sandbox.runCode(testCode);
      return {
        name: 'Custom Strategy Test',
        status: 'passed',
        output: execution.text
      };
    } catch (error) {
      return {
        name: 'Custom Strategy Test',
        status: 'failed',
        error: error.message
      };
    }
  }
}
```

### Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
name: E2B Sandbox Tests
on: [push, pull_request]

jobs:
  sandbox-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:sandbox
        env:
          E2B_API_KEY: ${{ secrets.E2B_API_KEY }}
```

## Benefits of E2B for Trading Bot Testing

### 1. **Complete Isolation**
- Each test runs in a fresh, isolated environment
- No interference between test runs
- Safe testing of potentially dangerous code

### 2. **Real-world Environment**
- Access to actual Python libraries and tools
- Real file system operations
- Network simulation capabilities

### 3. **Scalability**
- Run multiple tests in parallel
- Easy integration with CI/CD pipelines
- Cost-effective testing infrastructure

### 4. **Security**
- No risk of executing real trades
- Sandboxed execution environment
- Controlled resource usage

## Best Practices

### 1. **Test Data Management**
```javascript
// Use realistic test data
const mockMarketData = {
  'BTCUSD': {
    price: 50000,
    volume: 1000,
    timestamp: new Date().toISOString()
  }
};
```

### 2. **Error Simulation**
```javascript
// Test various error conditions
const errorScenarios = [
  'network_timeout',
  'insufficient_balance',
  'invalid_order_params',
  'exchange_maintenance'
];
```

### 3. **Performance Testing**
```javascript
// Test with high-frequency data
const highFrequencyData = generateMockData(1000); // 1000 data points
```

### 4. **Edge Case Testing**
```javascript
// Test extreme market conditions
const extremeScenarios = [
  'market_crash',
  'flash_crash',
  'high_volatility',
  'low_liquidity'
];
```

## Monitoring and Logging

### Test Results Structure
```javascript
{
  name: 'Test Name',
  status: 'passed' | 'failed',
  output: 'Test output text',
  details: 'Human-readable description',
  error: 'Error message (if failed)',
  timestamp: '2024-01-01T00:00:00Z',
  duration: 1500 // milliseconds
}
```

### Logging Configuration
```javascript
// Add to your test runner
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};
```

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   ```
   Error: E2B_API_KEY environment variable not found
   Solution: Set E2B_API_KEY in your environment
   ```

2. **Sandbox Initialization Failed**
   ```
   Error: Failed to initialize sandbox
   Solution: Check your internet connection and API key validity
   ```

3. **Test Timeout**
   ```
   Error: Test execution timeout
   Solution: Increase timeout or optimize test code
   ```

### Debug Mode

Enable debug logging:
```bash
DEBUG=e2b:* npm run test:sandbox
```

## Next Steps

1. **Set up your E2B account** and get your API key
2. **Run the initial tests** to verify everything works
3. **Customize the test scenarios** for your specific trading strategies
4. **Integrate with your CI/CD pipeline** for automated testing
5. **Monitor test results** and iterate on your trading bot

## Resources

- [E2B Documentation](https://e2b.dev/docs)
- [E2B GitHub Repository](https://github.com/e2b-dev/E2B)
- [E2B Cookbook](https://cookbook.e2b.dev) - Examples and recipes
- [Trading Bot Best Practices](https://e2b.dev/docs/trading-bot-testing)

---

**Remember**: E2B provides a safe environment for testing, but always validate your strategies with paper trading before going live!
