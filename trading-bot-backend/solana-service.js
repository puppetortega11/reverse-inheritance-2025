/**
 * Solana Service Module
 * 
 * This module handles all Solana blockchain interactions including:
 * - RPC connections to Solana mainnet/devnet
 * - Wallet balance fetching
 * - Transaction monitoring
 * - Real-time price data from Jupiter API
 */

const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');

class SolanaService {
  constructor() {
    // Use environment variables for RPC endpoints
    this.mainnetRpc = process.env.SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com';
    this.devnetRpc = process.env.SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com';
    this.jupiterApiUrl = 'https://price.jup.ag/v4/price';
    
    // Default to devnet for safety during development
    this.network = process.env.SOLANA_NETWORK || 'devnet';
    this.connection = new Connection(
      this.network === 'mainnet' ? this.mainnetRpc : this.devnetRpc,
      'confirmed'
    );
    
    this.isConnected = false;
    this.lastHealthCheck = null;
  }

  /**
   * Initialize connection and verify it's working
   */
  async initialize() {
    try {
      console.log(`Connecting to Solana ${this.network}...`);
      
      // Test connection
      const version = await this.connection.getVersion();
      console.log(`Connected to Solana ${this.network}:`, version);
      
      // Get recent blockhash to verify connection
      const { blockhash } = await this.connection.getRecentBlockhash();
      console.log('Recent blockhash:', blockhash);
      
      this.isConnected = true;
      this.lastHealthCheck = new Date();
      
      return { success: true, network: this.network, version };
    } catch (error) {
      console.error('Failed to connect to Solana:', error.message);
      this.isConnected = false;
      throw new Error(`Solana connection failed: ${error.message}`);
    }
  }

  /**
   * Get wallet balance in SOL
   */
  async getWalletBalance(walletAddress) {
    try {
      if (!this.isConnected) {
        await this.initialize();
      }

      // Validate wallet address
      if (!this.isValidAddress(walletAddress)) {
        throw new Error('Invalid Solana wallet address');
      }

      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      
      // Convert lamports to SOL
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      return {
        walletAddress,
        balance: solBalance,
        lamports: balance,
        network: this.network,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching wallet balance:', error.message);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  /**
   * Get current SOL price from Jupiter API
   */
  async getSolPrice() {
    try {
      const response = await axios.get(`${this.jupiterApiUrl}?ids=SOL`);
      
      if (response.data && response.data.data && response.data.data.SOL) {
        const priceData = response.data.data.SOL;
        return {
          symbol: 'SOL',
          price: priceData.price,
          timestamp: new Date().toISOString(),
          source: 'jupiter'
        };
      }
      
      throw new Error('No price data received from Jupiter API');
    } catch (error) {
      console.error('Error fetching SOL price:', error.message);
      
      // Fallback to CoinGecko if Jupiter fails
      try {
        const fallbackResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        if (fallbackResponse.data && fallbackResponse.data.solana) {
          return {
            symbol: 'SOL',
            price: fallbackResponse.data.solana.usd,
            timestamp: new Date().toISOString(),
            source: 'coingecko'
          };
        }
      } catch (fallbackError) {
        console.error('Fallback price fetch also failed:', fallbackError.message);
      }
      
      throw new Error(`Failed to get SOL price: ${error.message}`);
    }
  }

  /**
   * Get multiple token prices
   */
  async getTokenPrices(tokens = ['SOL']) {
    try {
      const response = await axios.get(`${this.jupiterApiUrl}?ids=${tokens.join(',')}`);
      
      if (response.data && response.data.data) {
        const prices = {};
        for (const [token, data] of Object.entries(response.data.data)) {
          prices[token] = {
            symbol: token,
            price: data.price,
            timestamp: new Date().toISOString(),
            source: 'jupiter'
          };
        }
        return prices;
      }
      
      throw new Error('No price data received');
    } catch (error) {
      console.error('Error fetching token prices:', error.message);
      throw new Error(`Failed to get token prices: ${error.message}`);
    }
  }

  /**
   * Monitor account for changes (useful for real-time trading)
   */
  async subscribeToAccountChanges(walletAddress, callback) {
    try {
      if (!this.isValidAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      const publicKey = new PublicKey(walletAddress);
      
      // Subscribe to account changes
      const subscriptionId = this.connection.onAccountChange(
        publicKey,
        (accountInfo, context) => {
          const balance = accountInfo.lamports / LAMPORTS_PER_SOL;
          callback({
            walletAddress,
            balance,
            lamports: accountInfo.lamports,
            slot: context.slot,
            timestamp: new Date().toISOString()
          });
        },
        'confirmed'
      );

      console.log(`Subscribed to account changes for ${walletAddress}, subscription ID: ${subscriptionId}`);
      return subscriptionId;
    } catch (error) {
      console.error('Error subscribing to account changes:', error.message);
      throw new Error(`Failed to subscribe: ${error.message}`);
    }
  }

  /**
   * Unsubscribe from account changes
   */
  async unsubscribeFromAccountChanges(subscriptionId) {
    try {
      await this.connection.removeAccountChangeListener(subscriptionId);
      console.log(`Unsubscribed from account changes, subscription ID: ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error.message);
      return false;
    }
  }

  /**
   * Get recent transactions for a wallet
   */
  async getRecentTransactions(walletAddress, limit = 10) {
    try {
      if (!this.isValidAddress(walletAddress)) {
        throw new Error('Invalid wallet address');
      }

      const publicKey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit });
      
      const transactions = [];
      for (const sig of signatures) {
        try {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (tx) {
            transactions.push({
              signature: sig.signature,
              slot: sig.slot,
              blockTime: sig.blockTime,
              confirmationStatus: sig.confirmationStatus,
              fee: tx.meta?.fee,
              timestamp: new Date(sig.blockTime * 1000).toISOString()
            });
          }
        } catch (txError) {
          console.warn(`Failed to get transaction ${sig.signature}:`, txError.message);
        }
      }

      return {
        walletAddress,
        transactions,
        count: transactions.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * Validate Solana wallet address
   */
  isValidAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const version = await this.connection.getVersion();
      const responseTime = Date.now() - startTime;
      
      this.lastHealthCheck = new Date();
      
      return {
        status: 'healthy',
        network: this.network,
        version,
        responseTime: `${responseTime}ms`,
        lastCheck: this.lastHealthCheck.toISOString(),
        rpcEndpoint: this.network === 'mainnet' ? this.mainnetRpc : this.devnetRpc
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        network: this.network,
        lastCheck: this.lastHealthCheck?.toISOString() || null
      };
    }
  }

  /**
   * Switch network (mainnet/devnet)
   */
  switchNetwork(network) {
    if (network !== 'mainnet' && network !== 'devnet') {
      throw new Error('Network must be either "mainnet" or "devnet"');
    }

    this.network = network;
    this.connection = new Connection(
      network === 'mainnet' ? this.mainnetRpc : this.devnetRpc,
      'confirmed'
    );
    this.isConnected = false;
    
    console.log(`Switched to Solana ${network}`);
    return this.initialize();
  }
}

// Create singleton instance
const solanaService = new SolanaService();

module.exports = {
  SolanaService,
  solanaService
};
