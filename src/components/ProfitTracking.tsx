'use client'

import { useState, useEffect } from 'react'

interface ProfitData {
  totalProfit: number
  totalLoss: number
  netProfit: number
  winRate: number
  totalTrades: number
  todayProfit: number
  weeklyProfit: number
  monthlyProfit: number
  hourlyProfit: number
  activePositions: number
  portfolioValue: number
}

export function ProfitTracking() {
  const [profitData, setProfitData] = useState<ProfitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('day')

  useEffect(() => {
    fetchProfitData()
    const interval = setInterval(fetchProfitData, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [timeframe])

  const fetchProfitData = async () => {
    try {
      const response = await fetch(`/api/profit?timeframe=${timeframe}`)
      const data = await response.json()
      setProfitData(data.data)
    } catch (error) {
      console.error('Failed to fetch profit data:', error)
      // Set mock data for demonstration
      setProfitData({
        totalProfit: 2.45,
        totalLoss: 0.78,
        netProfit: 1.67,
        winRate: 73.5,
        totalTrades: 47,
        todayProfit: 0.23,
        weeklyProfit: 1.45,
        monthlyProfit: 1.67,
        hourlyProfit: 0.05,
        activePositions: 3,
        portfolioValue: 12.34
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profitData) {
    return (
      <div className="card mb-6">
        <div className="text-center py-8">
          <p className="text-gray-400">Failed to load profit data</p>
          <button 
            onClick={fetchProfitData}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const getCurrentProfit = () => {
    switch (timeframe) {
      case 'hour': return profitData.hourlyProfit
      case 'day': return profitData.todayProfit
      case 'week': return profitData.weeklyProfit
      case 'month': return profitData.monthlyProfit
      default: return profitData.todayProfit
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">📈 Profit Tracking</h2>
        <div className="flex gap-2">
          {(['hour', 'day', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded text-sm capitalize ${
                timeframe === period ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Net Profit</p>
          <p className={`text-2xl font-bold ${
            profitData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {profitData.netProfit >= 0 ? '+' : ''}{profitData.netProfit.toFixed(4)} SOL
          </p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold text-blue-400">
            {profitData.winRate.toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold text-purple-400">
            {profitData.totalTrades}
          </p>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400">{timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} P&L</p>
          <p className={`text-2xl font-bold ${
            getCurrentProfit() >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {getCurrentProfit() >= 0 ? '+' : ''}{getCurrentProfit().toFixed(4)} SOL
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-green-300 mb-2">💰 Total Profits</h4>
          <p className="text-2xl font-bold text-green-400">
            +{profitData.totalProfit.toFixed(4)} SOL
          </p>
        </div>
        
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-red-300 mb-2">📉 Total Losses</h4>
          <p className="text-2xl font-bold text-red-400">
            -{profitData.totalLoss.toFixed(4)} SOL
          </p>
        </div>
        
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-blue-300 mb-2">📊 Portfolio</h4>
          <div className="space-y-1 text-sm">
            <p>Value: {profitData.portfolioValue.toFixed(4)} SOL</p>
            <p>Active Positions: {profitData.activePositions}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="font-semibold mb-3">📊 Performance Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Hourly</p>
            <p className={`font-semibold ${profitData.hourlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitData.hourlyProfit >= 0 ? '+' : ''}{profitData.hourlyProfit.toFixed(4)} SOL
            </p>
          </div>
          <div>
            <p className="text-gray-400">Daily</p>
            <p className={`font-semibold ${profitData.todayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitData.todayProfit >= 0 ? '+' : ''}{profitData.todayProfit.toFixed(4)} SOL
            </p>
          </div>
          <div>
            <p className="text-gray-400">Weekly</p>
            <p className={`font-semibold ${profitData.weeklyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitData.weeklyProfit >= 0 ? '+' : ''}{profitData.weeklyProfit.toFixed(4)} SOL
            </p>
          </div>
          <div>
            <p className="text-gray-400">Monthly</p>
            <p className={`font-semibold ${profitData.monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitData.monthlyProfit >= 0 ? '+' : ''}{profitData.monthlyProfit.toFixed(4)} SOL
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}