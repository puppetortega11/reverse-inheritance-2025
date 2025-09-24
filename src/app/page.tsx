'use client'

import { WalletConnection } from '@/components/WalletConnection'
import { FundBot } from '@/components/FundBot'
import { TradingStrategy } from '@/components/TradingStrategy'
import { BotControl } from '@/components/BotControl'
import { ProfitTracking } from '@/components/ProfitTracking'
import { TradingLedger } from '@/components/TradingLedger'

export default function Home() {
  return (
    <main className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            🤖 Solana Trading Bot
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional meme token trading bot with advanced risk management and real-time profit tracking
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <WalletConnection />
            <FundBot />
            <TradingStrategy />
            <BotControl />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ProfitTracking />
            <TradingLedger />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">⚠️ Important Disclaimer</h3>
            <p className="text-sm text-gray-300">
              Trading cryptocurrencies involves substantial risk of loss and is not suitable for all investors. 
              Past performance is not indicative of future results. Only trade with money you can afford to lose.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
