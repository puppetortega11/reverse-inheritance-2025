import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock trades data - in production this would come from Railway backend
    const trades = [
      {
        id: '1',
        token: 'BONK',
        action: 'buy',
        amount: 1000000,
        price: 0.00001234,
        timestamp: new Date().toISOString(),
        profit: 0
      }
    ]

    return NextResponse.json({
      success: true,
      trades: trades
    })
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trades'
    })
  }
}
