'use client';

import { useState, useEffect } from 'react';
import { WalletProvider } from '@/components/WalletProvider';
import { WalletButton } from '@/components/WalletButton';
import { BotControls } from '@/components/BotControls';
import { TradeHistory } from '@/components/TradeHistory';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function Home() {
  const [botStatus, setBotStatus] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategyPrompt, setStrategyPrompt] = useState<string>('');
  const [generatedStrategy, setGeneratedStrategy] = useState<string | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [botWalletAddress, setBotWalletAddress] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

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

  const generateStrategy = async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setIsGeneratingStrategy(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/strategy/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedStrategy(data.strategy);
      } else {
        setError(data.error || 'Failed to generate strategy');
      }
    } catch (err) {
      setError('Failed to generate strategy');
      console.error(err);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // Function to use hard-coded meme strategy
  const useMemeStrategy = () => {
    const memeStrategy = `meme_scalp_momo_v2_autotuned - Advanced meme token scalping strategy with:
- Capital base: 20 SOL
- Max positions: 3
- Risk per trade: 0.4%
- Position size: 0.20-1.00 SOL
- Daily max drawdown: 2.5%
- Take profit ladder: 0.5%, 1%, 1.8%, 4%
- Stop loss: 1% ATR-based
- Min liquidity: $40k, Min volume: $75k
- Reentry cooldown: 20 minutes`;

    setGeneratedStrategy(memeStrategy);
    setStrategyPrompt('meme_scalp_momo_v2_autotuned');
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
  }, []);

  return (
    <WalletProvider>
      <div className="container">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold">Reverse Inheritance Trading Bot</h1>
          <p className="text-sm">Simple Solana Trading Interface</p>
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
          <h2 className="font-bold mb-4">AI Strategy Generator</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your trading strategy in natural language:
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="e.g., 'Buy SOL when it drops 5% and sell when it rises 3%. Use stop loss at 10% down.'"
                value={strategyPrompt}
                onChange={(e) => setStrategyPrompt(e.target.value)}
                disabled={isGeneratingStrategy}
              />
            </div>
            
            <button
              onClick={() => generateStrategy(strategyPrompt)}
              disabled={!strategyPrompt.trim() || isGeneratingStrategy}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGeneratingStrategy ? 'Generating Strategy...' : 'Generate Strategy'}
            </button>
            
            {generatedStrategy && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Generated Strategy:</h3>
                <p className="text-green-700 whitespace-pre-wrap">{generatedStrategy}</p>
                <button
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    
                    fetch(`${BACKEND_URL}/api/bot/start`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        strategy: 'ai_generated', 
                        walletAddress: 'user-wallet-address',
                        strategyDetails: generatedStrategy
                      })
                    })
                    .then(res => res.json())
                    .then(data => {
                      if (data.success) {
                        fetchBotStatus();
                        alert('Bot started with AI-generated strategy!');
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
                  }}
                  disabled={loading}
                  className="mt-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Starting Bot...' : 'Start Bot with This Strategy'}
                </button>
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
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold mb-4">Trade History</h2>
          <TradeHistory trades={trades} />
        </div>
      </div>
    </WalletProvider>
  );
}
