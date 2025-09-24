'use client'

import { useState, useEffect } from 'react'

interface Strategy {
  name: string
  description: string
  riskLevel: 'Low' | 'Medium' | 'High'
  expectedReturn: string
  maxPositionSize: number
  stopLoss: number
  takeProfit: number
  tokens: string[]
  indicators: string[]
}

export function TradingStrategy() {
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [loading, setLoading] = useState(true)
  const [customizing, setCustomizing] = useState(false)

  useEffect(() => {
    fetchStrategy()
  }, [])

  const fetchStrategy = async () => {
    try {
      const response = await fetch('/api/bot/strategy')
      const data = await response.json()
      setStrategy(data.strategy)
    } catch (error) {
      console.error('Failed to fetch strategy:', error)
      // Set default strategy if API fails
      setStrategy({
        name: 'Aggressive Meme Token Strategy',
        description: 'High-frequency trading strategy focused on Solana meme tokens with advanced technical analysis',
        riskLevel: 'High',
        expectedReturn: '15-25% daily',
        maxPositionSize: 10,
        stopLoss: 5,
        takeProfit: 15,
        tokens: ['All Solana Meme Tokens'],
        indicators: ['RSI', 'MACD', 'Volume Analysis', 'Price Action']
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStrategy = async (newStrategy: Partial<Strategy>) => {
    try {
      const response = await fetch('/api/bot/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStrategy)
      })
      
      if (response.ok) {
        fetchStrategy()
        setCustomizing(false)
      }
    } catch (error) {
      console.error('Failed to update strategy:', error)
    }
  }

  if (loading) {
    return (
      <div className="card mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">📊 Trading Strategy</h2>
        <button
          onClick={() => setCustomizing(!customizing)}
          className="btn-primary text-sm px-4 py-2"
        >
          {customizing ? 'Save Changes' : 'Customize'}
        </button>
      </div>
      
      {strategy ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{strategy.name}</h3>
              <p className="text-gray-300 text-sm">{strategy.description}</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={`font-semibold ${
                    strategy.riskLevel === 'Low' ? 'text-green-400' :
                    strategy.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {strategy.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Return:</span>
                  <span className="text-green-400 font-semibold">{strategy.expectedReturn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Position:</span>
                  <span className="text-blue-400 font-semibold">{strategy.maxPositionSize}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="text-red-400 font-semibold">{strategy.stopLoss}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Take Profit:</span>
                  <span className="text-green-400 font-semibold">{strategy.takeProfit}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">🎯 Strategy Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-sm mb-1">Target Tokens:</h5>
                <ul className="text-sm text-gray-300 space-y-1">
                  {strategy.tokens.map((token, index) => (
                    <li key={index}>• {token}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-sm mb-1">Technical Indicators:</h5>
                <ul className="text-sm text-gray-300 space-y-1">
                  {strategy.indicators.map((indicator, index) => (
                    <li key={index}>• {indicator}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-green-300 mb-2">🚀 Key Features</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Monitors all Solana meme tokens via Jupiter API</li>
              <li>• Uses RSI, MACD, and volume analysis for entry signals</li>
              <li>• Implements dynamic position sizing based on volatility</li>
              <li>• Automatic stop-loss and take-profit execution</li>
              <li>• Real-time risk management and portfolio rebalancing</li>
              <li>• 24/7 automated trading with no manual intervention</li>
            </ul>
          </div>

          {customizing && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/20">
              <h4 className="font-semibold mb-3">Customize Strategy</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Max Position Size (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={strategy.maxPositionSize}
                    onChange={(e) => setStrategy({...strategy, maxPositionSize: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Stop Loss (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={strategy.stopLoss}
                    onChange={(e) => setStrategy({...strategy, stopLoss: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Take Profit (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={strategy.takeProfit}
                    onChange={(e) => setStrategy({...strategy, takeProfit: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Risk Level
                  </label>
                  <select
                    value={strategy.riskLevel}
                    onChange={(e) => setStrategy({...strategy, riskLevel: e.target.value as 'Low' | 'Medium' | 'High'})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => updateStrategy(strategy)}
                  className="btn-success"
                >
                  Save Strategy
                </button>
                <button
                  onClick={() => setCustomizing(false)}
                  className="btn-danger"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">Failed to load trading strategy</p>
          <button 
            onClick={fetchStrategy}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}