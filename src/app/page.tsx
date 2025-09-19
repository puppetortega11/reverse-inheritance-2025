'use client';

import { useState, useEffect } from 'react';
import { WalletProvider } from '@/components/WalletProvider';
import { WalletButton } from '@/components/WalletButton';
import { BotControls } from '@/components/BotControls';
import { TradeHistory } from '@/components/TradeHistory';
import { PerformanceChart } from '@/components/PerformanceChart';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function Home() {
  const [botStatus, setBotStatus] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botWalletAddress, setBotWalletAddress] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [botBalance, setBotBalance] = useState<number | null>(null);
  const [isCashingOut, setIsCashingOut] = useState(false);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bot/status`);
      const data = await response.json();
      setBotStatus(data);
    } catch (err) {
      console.error('Failed to fetch bot status:', err);
    }
  };

  const fetchWalletBalance = async (walletAddress: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/wallet/balance/${walletAddress}`);
      const data = await response.json();
      setWalletBalance(data.balance);
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    }
  };

  const fetchTrades = async (walletAddress: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/trades/${walletAddress}`);
      const data = await response.json();
      setTrades(data.trades || []);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
    }
  };

  // Function to use hard-coded meme strategy
  const useMemeStrategy = () => {
    const memeStrategy = `meme_scalp_momo_v2_autotuned - Advanced meme token scalping strategy with:
- Capital base: 0.1 SOL (minimum)
- Max positions: 3
- Risk per trade: 0.4%
- Position size: 0.01-0.05 SOL
- Daily max drawdown: 2.5%
- Take profit ladder: 0.5%, 1%, 1.8%, 4%
- Stop loss: 1% ATR-based
- Min liquidity: $40k, Min volume: $75k
- Reentry cooldown: 20 minutes`;

    // Start bot directly with meme strategy
    setLoading(true);
    setError(null);

    fetch(`${BACKEND_URL}/api/bot/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: 'user-wallet-address' // Replace with actual connected wallet
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        fetchBotStatus();
        alert('Meme trading bot started successfully!');
      } else {
        setError(data.error || 'Failed to start bot');
      }
    })
    .catch(err => {
      setError('Failed to start bot');
      console.error(err);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  // Function to get bot wallet address
  const fetchBotWalletAddress = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bot/wallet-address`);
      const data = await response.json();
      
      if (data.botWalletAddress) {
        setBotWalletAddress(data.botWalletAddress);
      }
    } catch (err) {
      console.error('Failed to get bot wallet address:', err);
    }
  };

  // Function to get bot balance
  const fetchBotBalance = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/bot/balance`);
      const data = await response.json();
      
      if (data.balance !== undefined) {
        setBotBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to get bot balance:', err);
    }
  };

  // Function to cash out bot funds
  const cashOutBot = async () => {
    if (!botWalletAddress) return;

    setIsCashingOut(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/bot/cash-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWalletAddress: 'user-wallet-address' // Replace with actual connected wallet
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Cash out prepared: ${data.transaction.amount} SOL returned to your wallet`);
        fetchBotBalance(); // Refresh bot balance
        fetchWalletBalance('user-wallet-address'); // Refresh user balance
      } else {
        throw new Error(data.error || 'Failed to cash out');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cash out');
      console.error(err);
    } finally {
      setIsCashingOut(false);
    }
  };

  // Function to transfer money to bot
  const transferToBot = async () => {
    if (!transferAmount || !botWalletAddress) return;

    setIsTransferring(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/wallet/send-to-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWallet: 'user-wallet-address', // Replace with actual connected wallet
          amount: parseFloat(transferAmount),
          botWalletAddress: botWalletAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Transfer prepared: ${transferAmount} SOL to bot wallet`);
        setTransferAmount('');
        fetchWalletBalance('user-wallet-address'); // Refresh balance
      } else {
        throw new Error(data.error || 'Failed to transfer');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to transfer');
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    fetchBotWalletAddress();
    fetchBotBalance();
  }, []);

  return (
    <WalletProvider>
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold">🚀 Reverse Inheritance Trading Bot</h1>
          <p className="text-sm">Simple Solana Trading Interface - Updated</p>
        </div>

        {error && (
          <div className="card">
            <div className="status status-error">{error}</div>
          </div>
        )}

        <div className="card">
          <h2 className="font-bold mb-4">Wallet Connection</h2>
          <WalletButton 
            onWalletChange={(walletAddress) => {
              if (walletAddress) {
                fetchWalletBalance(walletAddress);
                fetchTrades(walletAddress);
              }
            }}
          />
          {walletBalance !== null && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Wallet Balance</div>
              <div className="text-lg font-bold text-blue-600">{walletBalance.toFixed(4)} SOL</div>
            </div>
          )}
        </div>

        {botStatus && (
          <div className="card">
            <h2 className="font-bold mb-4">Bot Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`font-bold ${botStatus.status === 'ready' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {botStatus.status}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Current Strategy</div>
                <div className="text-sm font-medium">{botStatus.currentStrategy || 'None'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Bot Balance</div>
                <div className="text-sm font-medium">{botStatus.balance?.toFixed(4) || '0.0000'} SOL</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Trades Count</div>
                <div className="text-sm font-medium">{botStatus.tradesCount || 0}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">Available Strategies</div>
              <div className="text-sm">{botStatus.strategies?.join(', ')}</div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="font-bold mb-4">Trading Strategy</h2>
          <div className="space-y-4">
            {/* Hard-coded Meme Strategy Button */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">🚀 Meme Scalp Strategy</h3>
              <p className="text-purple-700 text-sm mb-3">
                Advanced meme token scalping with 0.1 SOL minimum capital base, 0.4% risk per trade, and laddered take profits.
              </p>
              <button
                onClick={useMemeStrategy}
                disabled={loading}
                className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Starting Bot...' : 'Start Meme Trading Bot'}
              </button>
            </div>
          </div>
        </div>

        {/* Fund Bot Section */}
        <div className="card">
          <h2 className="font-bold mb-4">💰 Fund Bot Wallet</h2>
          <div className="space-y-4">
            {botWalletAddress && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Bot Wallet Address:</div>
                <div className="font-mono text-sm break-all">{botWalletAddress}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to send (SOL):
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1.5"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                disabled={isTransferring || !connected || !botWalletAddress}
              />
            </div>
            
            <button
              onClick={transferToBot}
              disabled={!transferAmount || parseFloat(transferAmount) <= 0 || isTransferring || !connected || !botWalletAddress}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isTransferring ? 'Sending SOL...' : 'Send SOL to Bot'}
            </button>
            
            {botBalance !== null && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-600 mb-1">Current Bot Balance:</div>
                <div className="text-lg font-bold text-green-700">{botBalance.toFixed(4)} SOL</div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold mb-4">Bot Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                
                fetch(`${BACKEND_URL}/api/bot/stop`, {
                  method: 'POST'
                })
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    fetchBotStatus();
                    alert('Bot stopped successfully!');
                  } else {
                    setError(data.error || 'Failed to stop bot');
                  }
                })
                .catch(err => {
                  setError('Failed to stop bot');
                  console.error(err);
                })
                .finally(() => {
                  setLoading(false);
                });
              }}
              disabled={loading}
              className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {loading ? 'Stopping...' : 'Stop Bot'}
            </button>

            {/* Bot Balance Display */}
            {botBalance !== null && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Bot Balance</h3>
                <p className="text-blue-700 text-lg font-bold">{botBalance.toFixed(4)} SOL</p>
              </div>
            )}

            {/* Cash Out Button */}
            <button
              onClick={cashOutBot}
              disabled={isCashingOut || !botWalletAddress || (botBalance !== null && botBalance < 0.001)}
              className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isCashingOut ? 'Cashing Out...' : 'Cash Out Bot'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold mb-4">Performance Chart</h2>
          <PerformanceChart trades={trades} />
        </div>

        <div className="card">
          <h2 className="font-bold mb-4">Trade History</h2>
          <TradeHistory trades={trades} />
        </div>
      </div>
    </WalletProvider>
  );
}
<!-- Force deployment Thu Sep 18 20:55:36 PDT 2025 -->
