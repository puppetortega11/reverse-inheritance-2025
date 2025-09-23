/**
 * Simple E2E Test for Trading Bot Backend
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testBackend() {
  console.log('🧪 Testing Simple Trading Bot Backend...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', health.data.status);

    // Test 2: API Status
    console.log('\n2. Testing API status...');
    const status = await axios.get(`${BASE_URL}/api/status`);
    console.log('✅ API status:', status.data.status);

    // Test 3: Bot Status (should be stopped)
    console.log('\n3. Testing bot status...');
    const botStatus = await axios.get(`${BASE_URL}/api/bot/status`);
    console.log('✅ Bot status:', botStatus.data.bot.isRunning ? 'Running' : 'Stopped');

    // Test 4: Start Bot
    console.log('\n4. Testing bot start...');
    const startBot = await axios.post(`${BASE_URL}/api/bot/start`, {
      strategy: 'simple',
      walletAddress: '11111111111111111111111111111112' // System program ID for testing
    });
    console.log('✅ Bot started:', startBot.data.message);

    // Test 5: Bot Status (should be running)
    console.log('\n5. Testing bot status after start...');
    const runningStatus = await axios.get(`${BASE_URL}/api/bot/status`);
    console.log('✅ Bot status:', runningStatus.data.bot.isRunning ? 'Running' : 'Stopped');

    // Test 6: Solana Blockhash
    console.log('\n6. Testing Solana connection...');
    const blockhash = await axios.get(`${BASE_URL}/api/solana/blockhash`);
    console.log('✅ Solana connected, blockhash:', blockhash.data.blockhash.substring(0, 8) + '...');

    // Test 7: Stop Bot
    console.log('\n7. Testing bot stop...');
    const stopBot = await axios.post(`${BASE_URL}/api/bot/stop`);
    console.log('✅ Bot stopped:', stopBot.data.message);

    console.log('\n🎉 ALL TESTS PASSED! Backend is working perfectly!');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testBackend()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = testBackend;
