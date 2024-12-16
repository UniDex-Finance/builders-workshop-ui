// src/components/features/trading/SideBar/TradeStream.tsx
import { useMemo } from 'react';

interface TradeStreamProps {
  isExpanded: boolean;
}

// Updated mock data with PnL for closing trades
const mockTrades = [
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  
  {
    id: 1,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 3521.50,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 2.5,
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
  },
  // Add more mock trades as needed
];

export function TradeStream({ isExpanded }: TradeStreamProps) {
  const MAX_TRADES = 40;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const formatUSD = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const visibleTrades = mockTrades.slice(-MAX_TRADES);

  return (
    <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      {visibleTrades.map((trade) => (
        <div
          key={trade.id}
          className="px-2 py-1.5 transition-colors border-b border-border hover:bg-accent/50"
        >
          {isExpanded ? (
            <div className="grid items-center grid-cols-[50px_70px_1fr_70px] gap-1 text-xs">
              <span className="text-muted-foreground">
                {formatTime(trade.timestamp)}
              </span>
              <span className={trade.side === 'LONG' ? 'text-green-500' : 'text-red-500'}>
                {trade.pair}
              </span>
              <div className="flex items-center gap-1">
                <span>{formatUSD(trade.sizeUSD)}</span>
                {trade.isPnL && trade.pnlPercentage !== undefined && (
                  <span className={trade.pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                    ({trade.pnlPercentage > 0 ? '+' : ''}{trade.pnlPercentage}%)
                  </span>
                )}
              </div>
              <span className="text-right">{formatUSD(trade.price)}</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className={trade.side === 'LONG' ? 'text-green-500' : 'text-red-500'}>
                •
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}