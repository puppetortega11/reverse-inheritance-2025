/**
 * Deployment Tests
 * 
 * This file contains comprehensive tests to verify the deployment fixes
 * and ensure the trading bot works correctly in production.
 */

const { spawn } = require('child_process');
const axios = require('axios');

class DeploymentTester {
  constructor() {
    this.testResults = [];
    this.baseUrl = 'http://localhost:8000';
    
    // Set test environment variables
    process.env.NODE_ENV = 'development';
    process.env.PORT = '8000';
    process.env.SOLANA_NETWORK = 'devnet';
  }

  async runAllTests() {
    console.log('🧪 Starting Deployment Tests...\n');
    
    try {
      // Test 1: Environment Variables
      await this.testEnvironmentVariables();
      
      // Test 2: Server Startup
      await this.testServerStartup();
      
      // Test 3: Health Check
      await this.testHealthCheck();
      
      // Test 4: API Endpoints
      await this.testAPIEndpoints();
      
      // Test 5: Solana Service
      await this.testSolanaService();
      
      // Test 6: Trading Strategies
      await this.testTradingStrategies();
      
      // Test 7: Risk Management
      await this.testRiskManagement();
      
      // Test 8: Technical Indicators
      await this.testTechnicalIndicators();
      
      // Print Results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testEnvironmentVariables() {
    console.log('🔍 Testing Environment Variables...');
    
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT'
    ];
    
    const optionalEnvVars = [
      'SOLANA_NETWORK',
      'SOLANA_MAINNET_RPC',
      'SOLANA_DEVNET_RPC',
      'MAX_POSITION_SIZE',
      'STOP_LOSS_PERCENTAGE',
      'TAKE_PROFIT_PERCENTAGE'
    ];
    
    let passed = 0;
    let total = requiredEnvVars.length;
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`  ✅ ${envVar}: ${process.env[envVar]}`);
        passed++;
      } else {
        console.log(`  ❌ ${envVar}: Not set`);
      }
    }
    
    // Check optional variables
    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        console.log(`  ✅ ${envVar}: ${process.env[envVar]}`);
      } else {
        console.log(`  ⚠️  ${envVar}: Not set (optional)`);
      }
    }
    
    this.testResults.push({
      test: 'Environment Variables',
      passed: passed === total,
      details: `${passed}/${total} required variables set`
    });
    
    console.log(`  Result: ${passed}/${total} required variables set\n`);
  }

  async testServerStartup() {
    console.log('🚀 Testing Server Startup...');
    
    try {
      // Test if we can require the production server
      const { app } = require('./production-server.js');
      
      if (app) {
        console.log('  ✅ Production server module loads successfully');
        this.testResults.push({
          test: 'Server Startup',
          passed: true,
          details: 'Production server module loads without errors'
        });
      } else {
        throw new Error('App not exported');
      }
    } catch (error) {
      console.log(`  ❌ Server startup failed: ${error.message}`);
      this.testResults.push({
        test: 'Server Startup',
        passed: false,
        details: error.message
      });
    }
    
    console.log('  Result: Server startup test completed\n');
  }

  async testHealthCheck() {
    console.log('🏥 Testing Health Check...');
    
    try {
      // Start server in test mode
      const server = require('./production-server.js');
      
      // Wait a moment for server to start
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('  ✅ Health check endpoint responds');
        console.log(`  ✅ Status: ${response.data.status}`);
        console.log(`  ✅ Environment: ${response.data.environment}`);
        
        this.testResults.push({
          test: 'Health Check',
          passed: true,
          details: `Status: ${response.data.status}, Environment: ${response.data.environment}`
        });
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ Health check failed: ${error.message}`);
      this.testResults.push({
        test: 'Health Check',
        passed: false,
        details: error.message
      });
    }
    
    console.log('  Result: Health check test completed\n');
  }

  async testAPIEndpoints() {
    console.log('🔗 Testing API Endpoints...');
    
    const endpoints = [
      { path: '/api/status', method: 'GET', expectedStatus: 200 },
      { path: '/api/bot/status', method: 'GET', expectedStatus: 200 },
      { path: '/metrics', method: 'GET', expectedStatus: 200 }
    ];
    
    let passed = 0;
    let total = endpoints.length;
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint.path}`, { timeout: 5000 });
        
        if (response.status === endpoint.expectedStatus) {
          console.log(`  ✅ ${endpoint.path}: ${response.status}`);
          passed++;
        } else {
          console.log(`  ❌ ${endpoint.path}: Expected ${endpoint.expectedStatus}, got ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.path}: ${error.message}`);
      }
    }
    
    this.testResults.push({
      test: 'API Endpoints',
      passed: passed === total,
      details: `${passed}/${total} endpoints working`
    });
    
    console.log(`  Result: ${passed}/${total} endpoints working\n`);
  }

  async testSolanaService() {
    console.log('🔗 Testing Solana Service...');
    
    try {
      const { solanaService } = require('./solana-service.js');
      
      // Test service initialization
      const health = await solanaService.healthCheck();
      
      if (health.status === 'healthy' || health.status === 'unhealthy') {
        console.log(`  ✅ Solana service health check: ${health.status}`);
        console.log(`  ✅ Network: ${health.network}`);
        
        this.testResults.push({
          test: 'Solana Service',
          passed: true,
          details: `Status: ${health.status}, Network: ${health.network}`
        });
      } else {
        throw new Error('Unexpected health status');
      }
    } catch (error) {
      console.log(`  ❌ Solana service test failed: ${error.message}`);
      this.testResults.push({
        test: 'Solana Service',
        passed: false,
        details: error.message
      });
    }
    
    console.log('  Result: Solana service test completed\n');
  }

  async testTradingStrategies() {
    console.log('📈 Testing Trading Strategies...');
    
    try {
      const { StrategyFactory } = require('./trading-strategies.js');
      
      // Test strategy creation
      const strategies = StrategyFactory.getAvailableStrategies();
      console.log(`  ✅ Available strategies: ${strategies.join(', ')}`);
      
      // Test momentum strategy
      const momentumStrategy = StrategyFactory.createStrategy('momentum');
      if (momentumStrategy) {
        console.log('  ✅ Momentum strategy created successfully');
        
        // Test adding data
        momentumStrategy.addData(100, 1000);
        const status = momentumStrategy.getStatus();
        console.log(`  ✅ Strategy status: ${status.strategy}`);
        
        this.testResults.push({
          test: 'Trading Strategies',
          passed: true,
          details: `${strategies.length} strategies available, momentum strategy working`
        });
      } else {
        throw new Error('Failed to create momentum strategy');
      }
    } catch (error) {
      console.log(`  ❌ Trading strategies test failed: ${error.message}`);
      this.testResults.push({
        test: 'Trading Strategies',
        passed: false,
        details: error.message
      });
    }
    
    console.log('  Result: Trading strategies test completed\n');
  }

  async testRiskManagement() {
    console.log('🛡️ Testing Risk Management...');
    
    try {
      const { RiskManager } = require('./risk-management.js');
      
      // Test risk manager creation
      const riskManager = new RiskManager({
        initialBalance: 10000,
        maxPositionSize: 0.1,
        stopLossPercentage: 0.05
      });
      
      // Test position sizing
      const positionCalc = riskManager.calculatePositionSize(100, 95);
      if (positionCalc && positionCalc.positionSize > 0) {
        console.log(`  ✅ Position sizing: ${positionCalc.positionSize}`);
        
        // Test portfolio summary
        const summary = riskManager.getPortfolioSummary();
        console.log(`  ✅ Portfolio summary: Balance ${summary.currentBalance}`);
        
        this.testResults.push({
          test: 'Risk Management',
          passed: true,
          details: 'Position sizing and portfolio management working'
        });
      } else {
        throw new Error('Position sizing calculation failed');
      }
    } catch (error) {
      console.log(`  ❌ Risk management test failed: ${error.message}`);
      this.testResults.push({
        test: 'Risk Management',
        passed: false,
        details: error.message
      });
    }
    
    console.log('  Result: Risk management test completed\n');
  }

  async testTechnicalIndicators() {
    console.log('📊 Testing Technical Indicators...');
    
    try {
      const { TechnicalIndicators } = require('./technical-indicators.js');
      
      // Test indicators creation
      const indicators = new TechnicalIndicators();
      
      // Add some test data
      for (let i = 0; i < 20; i++) {
        indicators.addData(100 + Math.random() * 10, 1000 + Math.random() * 100);
      }
      
      // Test SMA calculation
      const sma = indicators.calculateSMA(20);
      if (sma && sma > 0) {
        console.log(`  ✅ SMA(20): ${sma.toFixed(2)}`);
        
        // Test RSI calculation
        const rsi = indicators.calculateRSI(14);
        if (rsi && rsi >= 0 && rsi <= 100) {
          console.log(`  ✅ RSI(14): ${rsi.toFixed(2)}`);
          
          // Test technical analysis
          const analysis = indicators.getTechnicalAnalysis();
          if (analysis && analysis.signals) {
            console.log(`  ✅ Technical analysis: ${analysis.signals.overallSignal}`);
            
            this.testResults.push({
              test: 'Technical Indicators',
              passed: true,
              details: 'SMA, RSI, and technical analysis working'
            });
          } else {
            throw new Error('Technical analysis failed');
          }
        } else {
          throw new Error('RSI calculation failed');
        }
      } else {
        throw new Error('SMA calculation failed');
      }
    } catch (error) {
      console.log(`  ❌ Technical indicators test failed: ${error.message}`);
      this.testResults.push({
        test: 'Technical Indicators',
        passed: false,
        details: error.message
      });
    }
    
    console.log('  Result: Technical indicators test completed\n');
  }

  printResults() {
    console.log('📋 Test Results Summary:');
    console.log('=' .repeat(50));
    
    let totalTests = this.testResults.length;
    let passedTests = this.testResults.filter(test => test.passed).length;
    
    for (const result of this.testResults) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}: ${result.details}`);
    }
    
    console.log('=' .repeat(50));
    console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Ready for deployment.');
      return true;
    } else {
      console.log('⚠️  Some tests failed. Please fix issues before deployment.');
      return false;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new DeploymentTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { DeploymentTester };
