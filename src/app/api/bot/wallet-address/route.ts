import { NextRequest, NextResponse } from 'next/server'
import { BOT_WALLET_ADDRESS } from '@/config/bot-wallet'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      address: BOT_WALLET_ADDRESS
    })
  } catch (error) {
    console.error('Error fetching bot wallet address:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bot wallet address',
      address: BOT_WALLET_ADDRESS
    })
  }
}
