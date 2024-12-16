import { useMemo } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import { useTradeStream } from '@/lib/trade-stream-context';
import Image from 'next/image';

interface TradeStreamProps {
  isExpanded: boolean;
}

export function TradeStream({ isExpanded }: TradeStreamProps) {
  const { trades } = useTradeStream();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const formatFullTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatUSD = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const getSourceIcon = (tradeId: string) => {
    if (tradeId.startsWith('hl-')) {
      return <Image src="/static/images/hyperliquid.svg" alt="Hyperliquid" width={12} height={12} />;
    }
    if (tradeId.startsWith('dydx-')) {
      return <Image src="/static/images/dydx.svg" alt="dYdX" width={12} height={12} />;
    }
    return null;
  };

  return (
    <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      {trades.map((trade) => (
        <HoverCard.Root key={trade.id} openDelay={0} closeDelay={0}>
          <HoverCard.Trigger asChild>
            <div className="group px-2 py-1.5 transition-colors border-b border-border hover:bg-accent/50">
              {isExpanded ? (
                <div className="grid items-center grid-cols-[1fr_70px_50px] gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    {getSourceIcon(trade.id)}
                    <span className="text-muted-foreground group-hover:text-foreground">
                      {formatUSD(trade.sizeUSD)}
                    </span>
                  </div>
                  <span className={`text-right ${trade.side === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                    {formatUSD(trade.price)}
                  </span>
                  <span className="text-right text-muted-foreground group-hover:text-foreground">
                    {formatTime(trade.timestamp)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-center">
                  {getSourceIcon(trade.id)}
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
                  <div className="flex items-center gap-1.5">
                    {getSourceIcon(trade.id)}
                    <span className={`font-medium ${trade.side === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.side}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatFullTime(trade.timestamp)}
                  </span>
                </div>
                
                <div className="space-y-0.5 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span>{trade.id.startsWith('hl-') ? 'Hyperliquid' : 'dYdX'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <div className="flex items-center gap-1">
                      <span>{formatUSD(trade.sizeUSD)} USDC</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span>{formatUSD(trade.price)}</span>
                  </div>
                </div>

                {trade.user && (
                  <div className="pt-1.5 mt-1.5 text-[11px] border-t text-muted-foreground border-border/40">
                    <span className="font-mono">{trade.user}</span>
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