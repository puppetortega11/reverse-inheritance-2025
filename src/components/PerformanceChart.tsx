'use client';

import { useEffect, useRef } from 'react';

interface PerformanceChartProps {
  trades: Array<{
    id: string;
    pnl?: number;
    timestamp: string;
  }>;
}

export function PerformanceChart({ trades }: PerformanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || trades.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate cumulative P&L over time
    let cumulativePnL = 0;
    const dataPoints = trades.map(trade => {
      cumulativePnL += trade.pnl || 0;
      return {
        x: new Date(trade.timestamp).getTime(),
        y: cumulativePnL
      };
    });

    if (dataPoints.length === 0) return;

    // Find min/max values
    const minX = Math.min(...dataPoints.map(p => p.x));
    const maxX = Math.max(...dataPoints.map(p => p.x));
    const minY = Math.min(0, ...dataPoints.map(p => p.y));
    const maxY = Math.max(0, ...dataPoints.map(p => p.y));

    // Add padding
    const padding = 20;
    const chartWidth = canvas.offsetWidth - padding * 2;
    const chartHeight = canvas.offsetHeight - padding * 2;

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // X-axis (time)
    ctx.beginPath();
    ctx.moveTo(padding, canvas.offsetHeight - padding);
    ctx.lineTo(canvas.offsetWidth - padding, canvas.offsetHeight - padding);
    ctx.stroke();

    // Y-axis (P&L)
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.offsetHeight - padding);
    ctx.stroke();

    // Zero line
    if (minY < 0 && maxY > 0) {
      const zeroY = padding + (chartHeight * (maxY - 0) / (maxY - minY));
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, zeroY);
      ctx.lineTo(canvas.offsetWidth - padding, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw line chart
    if (dataPoints.length > 1) {
      ctx.strokeStyle = cumulativePnL >= 0 ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();

      dataPoints.forEach((point, index) => {
        const x = padding + (chartWidth * (point.x - minX) / (maxX - minX));
        const y = padding + (chartHeight * (maxY - point.y) / (maxY - minY));

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw data points
    ctx.fillStyle = cumulativePnL >= 0 ? '#10b981' : '#ef4444';
    dataPoints.forEach(point => {
      const x = padding + (chartWidth * (point.x - minX) / (maxX - minX));
      const y = padding + (chartHeight * (maxY - point.y) / (maxY - minY));
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    // Y-axis labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = minY + (maxY - minY) * (i / ySteps);
      const y = padding + (chartHeight * (maxY - value) / (maxY - minY));
      
      ctx.fillText((value || 0).toFixed(2), padding - 10, y + 4);
    }

    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Cumulative P&L (SOL)', canvas.offsetWidth / 2, 15);

  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <div className="text-lg mb-2">📈</div>
        <div>No trading data yet</div>
        <div className="text-sm">Start the bot to see performance chart</div>
      </div>
    );
  }

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Performance Chart</h3>
        <div className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Total: {totalPnL.toFixed(4)} SOL
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-white">
        <canvas 
          ref={canvasRef}
          className="w-full h-64"
          style={{ maxHeight: '256px' }}
        />
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Shows cumulative profit/loss over time
      </div>
    </div>
  );
}
