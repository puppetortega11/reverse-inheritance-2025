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

  useEffect(() => {
    fetchBotStatus();
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
          <h2 className="font-bold mb-4">Bot Controls</h2>
          <BotControls 
            onStart={(strategy, walletAddress) => {
              setLoading(true);
              setError(null);
              
              fetch(`${BACKEND_URL}/api/bot/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy, walletAddress })
              })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  fetchBotStatus();
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
            onStop={() => {
              setLoading(true);
              setError(null);
              
              fetch(`${BACKEND_URL}/api/bot/stop`, {
                method: 'POST'
              })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  fetchBotStatus();
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
            loading={loading}
            strategies={botStatus?.strategies || []}
          />
        </div>

        <div className="card">
          <h2 className="font-bold mb-4">Trade History</h2>
          <TradeHistory trades={trades} />
        </div>
      </div>
    </WalletProvider>
  );
}
