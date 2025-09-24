import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BOT_WALLET_ADDRESS } from '@/config/bot-wallet'

const connection = new Connection('https://solana-api.projectserum.com')

export async function GET() {
  try {
    // Get bot wallet balance
    const publicKey = new PublicKey(BOT_WALLET_ADDRESS)
    const balance = await connection.getBalance(publicKey)
    const solBalance = balance / LAMPORTS_PER_SOL

    return NextResponse.json({
      success: true,
      balance: solBalance,
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
