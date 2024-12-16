import { useMemo } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';

interface TradeStreamProps {
  isExpanded: boolean;
}

interface DetailedTradeInfo {
  pair: string;
  side: 'LONG' | 'SHORT';
  size: number;
  collateral: number;
  closedPrice: number;
  pnlPercentage?: number;
  txHash?: string;
  timestamp: number;
}

// Updated mock data with PnL for closing trades
const mockTrades = [
  {
    id: 1,
    pair: 'BTC/USD',
    side: 'LONG',
    price: 106045.26,
    sizeUSD: 3872.11,
    collateral: 77.44,
    timestamp: new Date().getTime(),
    isPnL: true,
    pnlPercentage: 132.43,
    isLiquidated: false,
    txHash: '0x75...0f98',
  },
  {
    id: 2,
    pair: 'BTC/USD',
    side: 'SHORT',
    price: 42123.45,
    sizeUSD: 21061.72,
    timestamp: new Date().getTime() - 1000,
    isPnL: false,
    isLiquidated: false,
  },
  // Example of a liquidated trade
  {
    id: 3,
    pair: 'ETH/USD',
    side: 'LONG',
    price: 2345.67,
    sizeUSD: 5000.00,
    collateral: 100,
    timestamp: new Date().getTime() - 2000,
    isPnL: true,
    pnlPercentage: -100,
    isLiquidated: true,
    txHash: '0x82...1a23',
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
        <HoverCard.Root key={trade.id} openDelay={0} closeDelay={0}>
          <HoverCard.Trigger asChild>
            <div className="group px-2 py-1.5 transition-colors border-b border-border hover:bg-accent/50">
              {isExpanded ? (
                <div className="grid items-center grid-cols-[50px_70px_1fr_70px] gap-1 text-xs">
                  <span className="text-muted-foreground group-hover:text-foreground">
                    {formatTime(trade.timestamp)}
                  </span>
                  <span className={trade.side === 'LONG' ? 'text-green-500' : 'text-red-500'}>
                    {trade.pair}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground group-hover:text-foreground">
                      {formatUSD(trade.sizeUSD)}
                    </span>
                    {trade.isPnL && (
                      <>
                        {trade.pnlPercentage !== undefined && (
                          <span className={`${
                            trade.pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            |
                          </span>
                        )}
                        {trade.isLiquidated && <span title="Liquidated">🔥</span>}
                      </>
                    )}
                  </div>
                  <span className="text-right text-muted-foreground group-hover:text-foreground">
                    {formatUSD(trade.price)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-center">
                  <span className={trade.side === 'LONG' ? 'text-green-500' : 'text-red-500'}>
                    •
                  </span>
                </div>
              )}
            </div>
          </HoverCard.Trigger>
          
          <HoverCard.Portal>
            <HoverCard.Content
              side="left"
              align="center"
              sideOffset={5}
              className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md text-[13px]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${trade.side === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pair} {trade.side}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatTime(trade.timestamp)}
                  </span>
                </div>
                
                <div className="space-y-0.5 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span>{formatUSD(trade.sizeUSD)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collateral</span>
                    <span>${trade.collateral}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closed Price</span>
                    <span>{formatUSD(trade.price)}</span>
                  </div>
                  {trade.isPnL && trade.pnlPercentage !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PNL %</span>
                      <span className={trade.pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {trade.pnlPercentage > 0 ? '+' : ''}{trade.pnlPercentage}%
                      </span>
                    </div>
                  )}
                </div>

                {trade.txHash && (
                  <div className="pt-1.5 mt-1.5 text-[11px] border-t text-muted-foreground border-border/40">
                    <span className="font-mono">{trade.txHash}</span>
                  </div>
                )}
              </div>
              <HoverCard.Arrow className="fill-[#17161d]/80" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      ))}
    </div>
  );
}