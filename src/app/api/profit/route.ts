import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'day'

    // Mock profit data - in production this would come from Railway backend
    const profitData = {
      timeframe,
      totalProfit: 0.0,
      totalLoss: 0.0,
      netProfit: 0.0,
      winRate: 0,
      trades: 0,
      chartData: [
        { time: '00:00', profit: 0 },
        { time: '06:00', profit: 0 },
        { time: '12:00', profit: 0 },
        { time: '18:00', profit: 0 }
      ]
    }

    return NextResponse.json({
      success: true,
      data: profitData
    })
  } catch (error) {
    console.error('Error fetching profit data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profit data'
    })
  }
}
