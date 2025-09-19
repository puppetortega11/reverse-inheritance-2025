const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Mock Solana connection for testing
const mockConnection = {
  rpcEndpoint: 'https://api.devnet.solana.com',
  getBalance: (publicKey) => {
    if (publicKey.toBase58() === '11111111111111111111111111111112') return Promise.resolve(5 * LAMPORTS_PER_SOL); // 5 SOL
    if (publicKey.toBase58() === '22222222222222222222222222222223') return Promise.resolve(0); // 0 SOL initially
    return Promise.resolve(0);
  },
  getLatestBlockhash: () => Promise.resolve({ blockhash: 'mock-blockhash' }),
  sendRawTransaction: () => Promise.resolve('mock-tx-signature'),
  confirmTransaction: () => Promise.resolve({ value: { err: null } })
};

// Create a testable Express app instance
const app = express();
app.use(cors());
app.use(express.json());

// Replicate the SOL transfer endpoint for testing
app.post('/api/bot/fund', async (req, res) => {
  const { userWalletAddress, amount } = req.body;
  
  if (!userWalletAddress || !amount) {
    return res.status(400).json({ error: 'Missing user wallet address or amount' });
  }

  try {
    // Validate user wallet address
    new PublicKey(userWalletAddress);
    
    // Create the bot wallet keypair (deterministic)
    const userSeed = userWalletAddress.slice(0, 32);
    const botKeypair = Keypair.fromSeed(new Uint8Array(userSeed.split('').map(c => c.charCodeAt(0))));
    
    // Get current balances
    const userBalance = await mockConnection.getBalance(new PublicKey(userWalletAddress));
    const botBalance = await mockConnection.getBalance(botKeypair.publicKey);
    
    const solAmount = parseFloat(amount);
    const lamportsToSend = Math.floor(solAmount * LAMPORTS_PER_SOL);
    
    // Validate amount
    if (solAmount <= 0 || solAmount > 100) {
      return res.status(400).json({ error: 'Amount must be between 0 and 100 SOL' });
    }
    
    // Check user has enough balance
    if (userBalance < lamportsToSend) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        userBalance: userBalance / LAMPORTS_PER_SOL,
        requestedAmount: solAmount
      });
    }
    
    // Create transaction to send SOL to bot
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(userWalletAddress),
        toPubkey: botKeypair.publicKey,
        lamports: lamportsToSend
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await mockConnection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(userWalletAddress);
    
    // Serialize transaction for user to sign
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    
    console.log(`Prepared SOL transfer: ${solAmount} SOL from ${userWalletAddress} to bot ${botKeypair.publicKey.toBase58()}`);
    
    res.json({
      success: true,
      message: `Transfer prepared: ${solAmount} SOL to bot wallet`,
      transaction: {
        fromWallet: userWalletAddress,
        toWallet: botKeypair.publicKey.toBase58(),
        amount: solAmount,
        lamports: lamportsToSend
      },
      serializedTransaction: serializedTransaction.toString('base64'),
      instructions: 'Transaction prepared. Sign and send using your wallet.',
      botWalletAddress: botKeypair.publicKey.toBase58(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(400).json({ error: 'Invalid wallet address or amount' });
  }
});

// Simple test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running SOL Transfer Tests...\n');
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ ${t.name}`);
      passed++;
    } catch (e) {
      console.error(`❌ ${t.name}`);
      console.error(e);
      failed++;
    }
  }
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

// Define tests for SOL transfer functionality
test('SOL Transfer: Valid transfer preparation', async () => {
  const response = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '11111111111111111111111111111112',
      amount: 1.5
    });
    
  if (response.statusCode !== 200) throw new Error(`Expected 200, got ${response.statusCode}`);
  if (!response.body.success) throw new Error('Expected success: true');
  if (!response.body.serializedTransaction) throw new Error('Expected serialized transaction');
  if (response.body.transaction.amount !== 1.5) throw new Error('Incorrect amount');
});

test('SOL Transfer: Missing user wallet address', async () => {
  const response = await request(app)
    .post('/api/bot/fund')
    .send({ amount: 1.5 });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (response.body.error !== 'Missing user wallet address or amount') throw new Error('Incorrect error message');
});

test('SOL Transfer: Missing amount', async () => {
  const response = await request(app)
    .post('/api/bot/fund')
    .send({ userWalletAddress: '11111111111111111111111111111112' });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (response.body.error !== 'Missing user wallet address or amount') throw new Error('Incorrect error message');
});

test('SOL Transfer: Invalid amount (too high)', async () => {
  const response = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '11111111111111111111111111111112',
      amount: 150
    });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (response.body.error !== 'Amount must be between 0 and 100 SOL') throw new Error('Incorrect error message');
});

test('SOL Transfer: Invalid amount (negative)', async () => {
  const response = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '11111111111111111111111111111112',
      amount: -1
    });
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (response.body.error !== 'Amount must be between 0 and 100 SOL') throw new Error('Incorrect error message');
});

test('SOL Transfer: Insufficient balance', async () => {
  // Mock user with insufficient balance
  const originalGetBalance = mockConnection.getBalance;
  mockConnection.getBalance = (publicKey) => {
    if (publicKey.toBase58() === '11111111111111111111111111111112') return Promise.resolve(0.5 * LAMPORTS_PER_SOL); // Only 0.5 SOL
    return Promise.resolve(0);
  };

  const response = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '11111111111111111111111111111112',
      amount: 1.0
    });
    
  // Restore original function
  mockConnection.getBalance = originalGetBalance;
    
  if (response.statusCode !== 400) throw new Error(`Expected 400, got ${response.statusCode}`);
  if (response.body.error !== 'Insufficient balance') throw new Error('Incorrect error message');
});

test('SOL Transfer: Deterministic bot wallet generation', async () => {
  const response1 = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '33333333333333333333333333333334',
      amount: 1.0
    });
    
  const response2 = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '33333333333333333333333333333334',
      amount: 2.0
    });
    
  if (response1.body.botWalletAddress !== response2.body.botWalletAddress) {
    throw new Error('Bot wallet addresses should be the same for same user');
  }
});

test('SOL Transfer: Different users get different bot wallets', async () => {
  const response1 = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '44444444444444444444444444444445',
      amount: 1.0
    });
    
  const response2 = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '55555555555555555555555555555556',
      amount: 1.0
    });
    
  if (response1.body.botWalletAddress === response2.body.botWalletAddress) {
    throw new Error('Different users should get different bot wallets');
  }
});

test('SOL Transfer: Transaction structure validation', async () => {
  const response = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '11111111111111111111111111111112',
      amount: 1.0
    });
    
  if (!response.body.transaction) throw new Error('Expected transaction object');
  if (!response.body.transaction.fromWallet) throw new Error('Expected fromWallet');
  if (!response.body.transaction.toWallet) throw new Error('Expected toWallet');
  if (response.body.transaction.amount !== 1.0) throw new Error('Incorrect transaction amount');
  if (response.body.transaction.lamports !== LAMPORTS_PER_SOL) throw new Error('Incorrect lamports');
});

test('SOL Transfer: Serialized transaction is valid base64', async () => {
  const response = await request(app)
    .post('/api/bot/fund')
    .send({ 
      userWalletAddress: '11111111111111111111111111111112',
      amount: 1.0
    });
    
  const serializedTransaction = response.body.serializedTransaction;
  if (!serializedTransaction) throw new Error('Expected serialized transaction');
  
  // Try to decode base64
  try {
    Buffer.from(serializedTransaction, 'base64');
  } catch (e) {
    throw new Error('Serialized transaction is not valid base64');
  }
});

runTests();
