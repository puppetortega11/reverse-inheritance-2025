import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BOT_WALLET_ADDRESS } from '@/config/bot-wallet'

// Try multiple RPC endpoints for reliability with timeout
const rpcEndpoints = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-api.projectserum.com'
]

const RPC_TIMEOUT = 5000 // 5 seconds timeout

export async function GET() {
  try {
    // Try multiple RPC endpoints for reliability
    let connection
    let balance = 0
    
    for (const endpoint of rpcEndpoints) {
      try {
        connection = new Connection(endpoint, {
          commitment: 'confirmed',
          httpHeaders: {
            'User-Agent': 'TradingBot/1.0'
          }
        })
        
        const publicKey = new PublicKey(BOT_WALLET_ADDRESS)
        
        // Add timeout to prevent hanging
        const balancePromise = connection.getBalance(publicKey)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), RPC_TIMEOUT)
        )
        
        const balanceLamports = await Promise.race([balancePromise, timeoutPromise]) as number
        balance = balanceLamports / LAMPORTS_PER_SOL
        break // If successful, exit the loop
      } catch (error) {
        console.log(`Failed to connect to ${endpoint}:`, error)
        continue // Try next endpoint
      }
    }

    return NextResponse.json({
      success: true,
      balance: balance,
      address: BOT_WALLET_ADDRESS
    })
  } catch (error) {
    console.error('Error fetching bot balance:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bot balance',
      balance: 0,
      address: BOT_WALLET_ADDRESS
    })
  }
}
