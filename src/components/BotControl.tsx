'use client'

import { useState, useEffect } from 'react'

interface BotStatus {
  isRunning: boolean
  isConnected: boolean
  lastUpdate: string
  totalTrades: number
  activePositions: number
}

export function BotControl() {
  const [status, setStatus] = useState<BotStatus>({
    isRunning: false,
    isConnected: false,
    lastUpdate: '',
    totalTrades: 0,
    activePositions: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/bot/status')
      const data = await response.json()
      setStatus(data.bot)
    } catch (error) {
      console.error('Failed to fetch bot status:', error)
    }
  }

  const startBot = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      if (data.success) {
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to start bot:', error)
    } finally {
      setLoading(false)
    }
  }

  const stopBot = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bot/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      if (data.success) {
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to stop bot:', error)
    } finally {
      setLoading(false)
    }
  }

  const withdrawFunds = async () => {
    if (!confirm('Are you sure you want to withdraw all funds and stop the bot?')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/bot/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      if (data.success) {
        alert('Funds withdrawn successfully!')
        fetchStatus()
      } else {
        alert(`Withdrawal failed: ${data.error}`)
      }
    } catch (error) {
      alert(`Withdrawal failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6">
      <h2 className="text-2xl font-bold mb-4">🤖 Bot Control</h2>
      
      <div className="space-y-4">
        {/* Status Display */}
        <div className={`p-4 rounded-lg border ${
          status.isRunning ? 'status-running' : 'status-stopped'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">
                {status.isRunning ? '🟢 Bot Running' : '🔴 Bot Stopped'}
              </h3>
              <p className="text-sm opacity-75">
                Last Update: {status.lastUpdate || 'Never'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm">Total Trades: {status.totalTrades}</p>
              <p className="text-sm">Active Positions: {status.activePositions}</p>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={startBot}
            disabled={status.isRunning || loading}
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting...' : '🚀 Start Bot'}
          </button>
          
          <button
            onClick={stopBot}
            disabled={!status.isRunning || loading}
            className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Stopping...' : '🛑 Stop Bot'}
          </button>
          
          <button
            onClick={withdrawFunds}
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Withdrawing...' : '💰 Withdraw Funds'}
          </button>
        </div>

        {/* Connection Status */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Backend Connection:</span>
            <span className={`text-sm font-semibold ${
              status.isConnected ? 'text-green-400' : 'text-red-400'
            }`}>
              {status.isConnected ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
