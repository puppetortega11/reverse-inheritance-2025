import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock strategy data - in production this would come from Railway backend
    const strategy = {
      name: 'Aggressive Meme Token Strategy',
      description: 'High-frequency trading strategy focused on Solana meme tokens with advanced technical analysis',
      riskLevel: 'High',
      expectedReturn: '15-25% daily',
      maxPosition: '10%',
      stopLoss: '5%',
      takeProfit: '15%',
      enabled: true
    }

    return NextResponse.json({
      success: true,
      strategy: strategy
    })
  } catch (error) {
    console.error('Error fetching strategy:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch strategy'
    })
  }
}

export async function POST(request: Request) {
  try {
    const strategyData = await request.json()
    
    // In production, this would update the strategy on Railway backend
    return NextResponse.json({
      success: true,
      message: 'Strategy updated successfully',
      strategy: strategyData
    })
  } catch (error) {
    console.error('Error updating strategy:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update strategy'
    })
  }
}
