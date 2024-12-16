// src/components/features/trading/SideBar/TradeStream.tsx
import { useMemo } from 'react';

interface TradeStreamProps {
  isExpanded: boolean;
}

// Mock data
const mockTrades = [
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'BUY',
    price: 2345.67,
    size: 1.5,
    timestamp: new Date().getTime(),
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SELL',
    price: 42123.45,
    size: 0.5,
    timestamp: new Date().getTime() - 1000,
  },
  // Add more mock trades as needed
];

export function TradeStream({ isExpanded }: TradeStreamProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
      {mockTrades.map((trade) => (
        <div
          key={trade.id}
          className="px-3 py-2 transition-colors border-b border-border hover:bg-accent/50"
        >
          {isExpanded ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{trade.pair}</span>
                <span className={trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                  {trade.side}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>${trade.price.toFixed(2)}</span>
                <span>{trade.size} units</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(trade.timestamp)}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className={trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                •
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}