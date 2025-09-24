import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BOT_WALLET_ADDRESS } from '@/config/bot-wallet'

// Try multiple RPC endpoints for reliability
const rpcEndpoints = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
]

export async function GET() {
  try {
    // Try multiple RPC endpoints for reliability
    let connection
    let balance = 0
    
    for (const endpoint of rpcEndpoints) {
      try {
        connection = new Connection(endpoint)
        const publicKey = new PublicKey(BOT_WALLET_ADDRESS)
        const balanceLamports = await connection.getBalance(publicKey)
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
