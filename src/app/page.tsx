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
                fetchTrades(walletAddress);
              }
            }}
          />
        </div>

        {botStatus && (
          <div className="card">
            <h2 className="font-bold mb-4">Bot Status</h2>
            <div className="grid grid-3">
              <div>
                <div className="text-sm">Status</div>
                <div className={`status ${botStatus.status === 'ready' ? 'status-success' : 'status-warning'}`}>
                  {botStatus.status}
                </div>
              </div>
              <div>
                <div className="text-sm">Available Strategies</div>
                <div className="text-sm">{botStatus.strategies?.join(', ')}</div>
              </div>
              <div>
                <div className="text-sm">Last Updated</div>
                <div className="text-sm">{new Date(botStatus.timestamp).toLocaleTimeString()}</div>
              </div>
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
