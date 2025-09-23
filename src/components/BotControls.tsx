'use client';

import { useState } from 'react';

interface BotControlsProps {
  onStart: (strategy: string, walletAddress: string) => void;
  onStop: () => void;
  loading: boolean;
  strategies: string[];
}

export function BotControls({ onStart, onStop, loading, strategies }: BotControlsProps) {
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const handleStart = () => {
    if (!selectedStrategy || !walletAddress) {
      alert('Please select a strategy and enter wallet address');
      return;
    }
    onStart(selectedStrategy, walletAddress);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Strategy</label>
        <select 
          className="input"
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value)}
        >
          <option value="">Select a strategy</option>
          {strategies.map(strategy => (
            <option key={strategy} value={strategy}>
              {strategy.charAt(0).toUpperCase() + strategy.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Wallet Address</label>
        <input
          type="text"
          className="input"
          placeholder="Enter wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <button
          className="btn btn-success"
          onClick={handleStart}
          disabled={loading || !selectedStrategy || !walletAddress}
        >
          {loading ? 'Starting...' : 'Start Bot'}
        </button>
        
        <button
          className="btn btn-danger"
          onClick={onStop}
          disabled={loading}
        >
          {loading ? 'Stopping...' : 'Stop Bot'}
        </button>
      </div>
    </div>
  );
}
