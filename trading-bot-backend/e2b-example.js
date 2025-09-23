#!/usr/bin/env node

/**
 * E2B Trading Bot Test Example
 * 
 * This script demonstrates how to use E2B sandbox for testing
 * crypto trading bot strategies safely.
 */

const TradingBotSandboxTester = require('./e2b-test-runner');

async function main() {
  console.log('🚀 E2B Trading Bot Sandbox Test Example\n');
  
  // Check if E2B_API_KEY is set
  if (!process.env.E2B_API_KEY) {
    console.log('❌ E2B_API_KEY environment variable not set!');
    console.log('Please set your E2B API key:');
    console.log('export E2B_API_KEY=your_api_key_here');
    console.log('\nGet your API key from: https://e2b.dev');
    process.exit(1);
  }

  // Create tester instance
  const tester = new TradingBotSandboxTester();
  
  try {
    // Run all tests
    const results = await tester.runAllTests();
    
    // Display summary
    console.log('\n📋 Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.failed === 0) {
      console.log('\n🎉 All tests passed! Your trading bot is ready for development.');
      console.log('\nNext steps:');
      console.log('1. Implement your actual trading strategy');
      console.log('2. Add real exchange API integration');
      console.log('3. Test with paper trading');
      console.log('4. Deploy to production');
    } else {
      console.log('\n⚠️  Some tests failed. Review the errors above.');
      console.log('Fix the issues before proceeding to live trading.');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
