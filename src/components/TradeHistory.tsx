'use client';

interface Trade {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: string;
  pnl?: number;
}

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No trades yet. Start the bot to see trading activity.
      </div>
    );
  }

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  return (
    <div>
      <div className="mb-4 p-4 border rounded">
        <div className="grid grid-2">
          <div>
            <div className="text-sm">Total Trades</div>
            <div className="font-bold">{trades.length}</div>
          </div>
          <div>
            <div className="text-sm">Total P&L</div>
            <div className={`font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL.toFixed(4)} SOL
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Pair</th>
              <th className="text-left p-2">Side</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">P&L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b">
                <td className="p-2 text-sm">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </td>
                <td className="p-2 font-mono">{trade.pair}</td>
                <td className={`p-2 font-bold ${trade.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                  {trade.side.toUpperCase()}
                </td>
                <td className="p-2 font-mono">{trade.amount}</td>
                <td className="p-2 font-mono">{trade.price}</td>
                <td className={`p-2 font-mono ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trade.pnl ? trade.pnl.toFixed(4) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
