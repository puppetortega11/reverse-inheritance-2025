'use client'

import { useState, useEffect } from 'react'

interface Trade {
  id: string
  timestamp: string
  token: string
  tokenSymbol: string
  action: 'BUY' | 'SELL'
  amount: number
  price: number
  value: number
  profit: number
  status: 'OPEN' | 'CLOSED' | 'PENDING'
  slippage?: number
  gasUsed?: number
  txHash?: string
}

export function TradingLedger() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')
  const [sortBy, setSortBy] = useState<'time' | 'profit' | 'value'>('time')
  const [searchToken, setSearchToken] = useState('')

  useEffect(() => {
    fetchTrades()
    const interval = setInterval(fetchTrades, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trades')
      const data = await response.json()
      setTrades(data.trades || [])
    } catch (error) {
      console.error('Failed to fetch trades:', error)
      // Set mock data for demonstration
      setTrades([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          tokenSymbol: 'USDC',
          action: 'BUY',
          amount: 1000,
          price: 0.0001,
          value: 0.1,
          profit: 0.05,
          status: 'OPEN',
          slippage: 0.5,
          gasUsed: 5000,
          txHash: '5J7X8K9L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          token: 'So11111111111111111111111111111111111111112',
          tokenSymbol: 'SOL',
          action: 'SELL',
          amount: 50,
          price: 0.02,
          value: 1.0,
          profit: 0.15,
          status: 'CLOSED',
          slippage: 0.3,
          gasUsed: 4500,
          txHash: '4I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredTrades = trades
    .filter(trade => 
      filter === 'ALL' || trade.status === filter
    )
    .filter(trade =>
      searchToken === '' || trade.tokenSymbol.toLowerCase().includes(searchToken.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'profit':
          return b.profit - a.profit
        case 'value':
          return b.value - a.value
        default:
          return 0
      }
    })

  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0)
  const openTrades = trades.filter(trade => trade.status === 'OPEN').length
  const closedTrades = trades.filter(trade => trade.status === 'CLOSED').length

  if (loading) {
    return (
      <div className="card mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">📋 Trading Ledger</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search token..."
            value={searchToken}
            onChange={(e) => setSearchToken(e.target.value)}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 text-sm"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-400">Total Profit</p>
          <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(4)} SOL
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-400">Open Trades</p>
          <p className="text-lg font-bold text-blue-400">{openTrades}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-400">Closed Trades</p>
          <p className="text-lg font-bold text-purple-400">{closedTrades}</p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-2">
          {(['ALL', 'OPEN', 'CLOSED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded text-sm ${
                filter === status ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <span className="text-sm text-gray-400 self-center">Sort by:</span>
          {(['time', 'profit', 'value'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-3 py-1 rounded text-sm capitalize ${
                sortBy === sort ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
              }`}
            >
              {sort}
            </button>
          ))}
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No trades found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((trade) => (
            <div
              key={trade.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      trade.action === 'BUY' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {trade.action}
                    </span>
                    <span className="font-semibold">{trade.tokenSymbol}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.status === 'OPEN' 
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : trade.status === 'CLOSED'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Amount</p>
                      <p className="font-semibold">{trade.amount.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Price</p>
                      <p className="font-semibold">{trade.price.toFixed(8)} SOL</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Value</p>
                      <p className="font-semibold">{trade.value.toFixed(4)} SOL</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Profit/Loss</p>
                      <p className={`font-semibold ${
                        trade.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(4)} SOL
                      </p>
                    </div>
                  </div>

                  {/* Additional details */}
                  {(trade.slippage || trade.gasUsed || trade.txHash) && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400">
                        {trade.slippage && (
                          <div>
                            <span className="text-gray-500">Slippage:</span> {trade.slippage}%
                          </div>
                        )}
                        {trade.gasUsed && (
                          <div>
                            <span className="text-gray-500">Gas:</span> {trade.gasUsed.toLocaleString()}
                          </div>
                        )}
                        {trade.txHash && (
                          <div className="font-mono">
                            <span className="text-gray-500">TX:</span> {trade.txHash.slice(0, 8)}...{trade.txHash.slice(-8)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-right text-sm text-gray-400">
                  <p>{new Date(trade.timestamp).toLocaleString()}</p>
                  <p className="font-mono text-xs">{trade.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}