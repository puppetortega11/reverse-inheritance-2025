'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BOT_WALLET_ADDRESS } from '@/config/bot-wallet'

export function FundBot() {
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [botBalance, setBotBalance] = useState<number>(0)
  const [status, setStatus] = useState<string>('')
  const [botWalletAddress, setBotWalletAddress] = useState<string>('')

  // Bot wallet address - real generated wallet
  // const BOT_WALLET_ADDRESS = 'DGPrryYStTsmKkMhkJrTzapbCYKvN3srHJvSHqZCWYP6' // Removed duplicate

  useEffect(() => {
    fetchBotBalance()
    fetchBotWalletAddress()
  }, [])

  const fetchBotBalance = async () => {
    try {
      const response = await fetch('/api/bot/balance')
      const data = await response.json()
      setBotBalance(data.balance || 0)
    } catch (error) {
      console.error('Failed to fetch bot balance:', error)
      // Fallback to showing 0 balance
      setBotBalance(0)
    }
  }

  const fetchBotWalletAddress = async () => {
    try {
      const response = await fetch('/api/bot/wallet-address')
      const data = await response.json()
      setBotWalletAddress(data.address || BOT_WALLET_ADDRESS)
    } catch (error) {
      console.error('Failed to fetch bot wallet address:', error)
      // Fallback to hardcoded address
      setBotWalletAddress(BOT_WALLET_ADDRESS)
    }
  }

  const fundBot = async () => {
    if (!publicKey || !amount) return

    setLoading(true)
    setStatus('Preparing transaction...')

    try {
      // Use multiple RPC endpoints with timeout
      const rpcEndpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://rpc.ankr.com/solana',
        'https://solana-api.projectserum.com'
      ]
      
      let connection
      for (const endpoint of rpcEndpoints) {
        try {
          connection = new Connection(endpoint, {
            commitment: 'confirmed',
            httpHeaders: {
              'User-Agent': 'TradingBot/1.0'
            }
          })
          // Test connection by getting recent blockhash
          await connection.getRecentBlockhash()
          break // If successful, exit the loop
        } catch (error) {
          console.log(`Failed to connect to ${endpoint}:`, error)
          continue // Try next endpoint
        }
      }
      
      if (!connection) {
        throw new Error('Failed to connect to any Solana RPC endpoint')
      }
      const amountLamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)
      
      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(botWalletAddress),
          lamports: amountLamports,
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      setStatus('Please confirm the transaction in your wallet...')

      // Send transaction
      const signature = await sendTransaction(transaction, connection)
      
      setStatus('Transaction sent! Confirming...')

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      setStatus(`✅ Successfully sent ${amount} SOL to bot! Transaction: ${signature.slice(0, 8)}...`)
      setAmount('')
      fetchBotBalance()
    } catch (error: any) {
      setStatus(`❌ Transaction failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const withdrawFunds = async () => {
    if (!publicKey) return

    if (!confirm('Are you sure you want to withdraw all funds from the bot?')) return

    setLoading(true)
    setStatus('Processing withdrawal...')

    try {
      const response = await fetch('/api/bot/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toWallet: publicKey.toString()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setStatus(`✅ Withdrawal successful! ${data.amount} SOL sent to your wallet`)
        fetchBotBalance()
      } else {
        setStatus(`❌ Withdrawal failed: ${data.error}`)
      }
    } catch (error: any) {
      setStatus(`❌ Withdrawal failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6">
      <h2 className="text-2xl font-bold mb-4">💰 Fund Trading Bot</h2>
      
      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bot Wallet Address:</p>
          <p className="font-mono text-sm break-all">{botWalletAddress}</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bot Wallet Balance:</p>
          <p className="text-2xl font-bold text-blue-400">{botBalance.toFixed(4)} SOL</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount to Send (SOL)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount in SOL"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={fundBot}
            disabled={!publicKey || !amount || loading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : `Send ${amount || '0'} SOL to Bot`}
          </button>
          
          <button
            onClick={withdrawFunds}
            disabled={!publicKey || loading || botBalance === 0}
            className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Withdrawing...' : 'Withdraw All'}
          </button>
        </div>

        {status && (
          <div className="p-3 bg-white/10 rounded-lg">
            <p className="text-sm">{status}</p>
          </div>
        )}
      </div>
    </div>
  )
}