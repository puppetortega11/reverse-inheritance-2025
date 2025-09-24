'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'
import { useState, useEffect } from 'react'

export function WalletConnection() {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    if (connected && publicKey) {
      // Fetch wallet balance
      fetchWalletBalance()
    }
  }, [connected, publicKey])

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(`/api/wallet/balance?address=${publicKey?.toString()}`)
      const data = await response.json()
      setBalance(data.balance || 0)
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }

  return (
    <div className="card mb-6">
      <h2 className="text-2xl font-bold mb-4">🔗 Wallet Connection</h2>
      
      {!connected ? (
        <div className="text-center">
          <p className="mb-4 text-gray-300">Connect your Phantom wallet to start trading</p>
          <WalletMultiButton className="btn-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Connected Wallet:</p>
              <p className="font-mono text-sm">{publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</p>
            </div>
            <WalletDisconnectButton className="btn-danger" />
          </div>
          
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-400">SOL Balance:</p>
            <p className="text-2xl font-bold text-green-400">{balance.toFixed(4)} SOL</p>
          </div>
        </div>
      )}
    </div>
  )
}
