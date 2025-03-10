import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTradeStream, Trade } from '@/lib/trade-stream-context';
import Image from 'next/image';
import { Pencil, Filter } from 'lucide-react';

interface TradeStreamProps {
  isExpanded: boolean;
}

interface Source {
  id: 'all' | 'hyperliquid' | 'dydx' | 'orderly';
  name: string;
  icon: string;
}

const SOURCES: Source[] = [
  { id: 'all', name: 'All Sources', icon: '' },
  { id: 'hyperliquid', name: 'Hyperliquid', icon: '/static/images/hyperliquid.svg' },
  { id: 'dydx', name: 'dYdX', icon: '/static/images/dydx.svg' },
  { id: 'orderly', name: 'Orderly', icon: '/static/images/orderly.webp' },
];

function SourceFilter({ selectedSources, onSourceChange }: { 
  selectedSources: Source['id'][], 
  onSourceChange: (sources: Source['id'][]) => void 
}) {
  const handleSourceClick = (sourceId: Source['id']) => {
    if (sourceId === 'all') {
      // If "All Sources" is clicked, clear other selections
      onSourceChange(['all']);
    } else {
      // Remove 'all' if it exists and toggle the clicked source
      const newSources = selectedSources.filter(id => id !== 'all');
      const sourceExists = newSources.includes(sourceId);
      
      if (sourceExists) {
        // Remove the source if it exists
        const filtered = newSources.filter(id => id !== sourceId);
        // If no sources left, default to 'all'
        onSourceChange(filtered.length === 0 ? ['all'] : filtered);
      } else {
        // Add the new source
        onSourceChange([...newSources, sourceId]);
      }
    }
  };

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button 
          className="p-0.5 hover:bg-accent rounded"
          onClick={(e) => e.preventDefault()}
        >
          <Filter size={12} className={`
            ${selectedSources.length === 1 && selectedSources[0] === 'all' 
              ? 'text-muted-foreground' 
              : 'text-foreground'
            }
          `} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[140px] bg-popover rounded-md p-1 shadow-md border border-border"
          sideOffset={5}
          forceMount
        >
          {SOURCES.map((source) => (
            <DropdownMenu.CheckboxItem
              key={source.id}
              className={`
                text-xs px-2 py-1.5 outline-none cursor-default
                flex items-center gap-2 rounded-sm
                ${selectedSources.includes(source.id) ? 'bg-accent' : 'hover:bg-accent'}
              `}
              checked={selectedSources.includes(source.id)}
              onSelect={(e) => {
                e.preventDefault();
                handleSourceClick(source.id);
              }}
            >
              {source.icon ? (
                <Image
                  src={source.icon}
                  alt={source.name}
                  width={12}
                  height={12}
                  className="shrink-0"
                />
              ) : null}
              <span>{source.name}</span>
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const getTradeBarWidth = (sizeUSD: number) => {
  const maxSize = 500_000; // 1M USD
  const percentage = Math.min((sizeUSD / maxSize) * 100, 100);
  return `${percentage}%`;
};

export function TradeStream({ isExpanded }: TradeStreamProps) {
  const [minSize, setMinSize] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Source['id'][]>(['all']);
  const { trades } = useTradeStream();

  const filteredTrades = useMemo(() => {
    return trades
      .filter(trade => {
        const meetsMinSize = trade.sizeUSD >= minSize;
        const meetsSource = selectedSources.includes('all') || 
          (selectedSources.includes('hyperliquid') && trade.id.startsWith('hl-')) ||
          (selectedSources.includes('dydx') && trade.id.startsWith('dydx-')) ||
          (selectedSources.includes('orderly') && trade.id.startsWith('orderly-'));
        return meetsMinSize && meetsSource;
      })
      .slice(0, 100); // Only show last 100 trades
  }, [trades, minSize, selectedSources]);

  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }, []);

  const formatFullTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatUSD = (amount: number) => {
    // For amounts less than 10, show 4 decimal places
    // For amounts less than 100, show 2 decimal places
    // For amounts >= 100, show 0 decimal places
    const decimals = amount < 10 ? 4 : amount < 100 ? 2 : 0;
    
    return `$${amount.toLocaleString('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };

  const getSourceIcon = (tradeId: string) => {
    if (tradeId.startsWith('hl-')) {
      return <Image src="/static/images/hyperliquid.svg" alt="Hyperliquid" width={12} height={12} />;
    }
    if (tradeId.startsWith('dydx-')) {
      return <Image src="/static/images/dydx.svg" alt="dYdX" width={12} height={12} />;
    }
    if (tradeId.startsWith('orderly-')) {
      return <Image src="/static/images/orderly.webp" alt="Orderly" width={12} height={12} />;
    }
    return null;
  };

  // Use RAF for smooth animations
  const rafRef = useRef<number>();
  const [visibleTrades, setVisibleTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const updateVisibleTrades = () => {
      setVisibleTrades(filteredTrades);
      rafRef.current = requestAnimationFrame(updateVisibleTrades);
    };

    rafRef.current = requestAnimationFrame(updateVisibleTrades);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [filteredTrades]);

  return (
    <div className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      {isExpanded && (
        <div className="group relative px-2 py-1.5 border-b border-border">
          <div className="relative grid items-center grid-cols-[120px_70px_auto] text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Size</span>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="p-0.5 hover:bg-accent rounded"
              >
                <Pencil size={12} className="text-muted-foreground" />
              </button>
              <SourceFilter 
                selectedSources={selectedSources} 
                onSourceChange={setSelectedSources}
              />
              {isEditing && (
                <input
                  type="number"
                  value={minSize}
                  onChange={(e) => setMinSize(Math.max(0, Number(e.target.value)))}
                  className="w-16 px-1 py-0.5 text-xs bg-background border border-border rounded"
                  placeholder="Min size"
                  onBlur={() => setIsEditing(false)}
                  autoFocus
                />
              )}
              {!isEditing && minSize > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  (≥{formatUSD(minSize)})
                </span>
              )}
            </div>
            <span className="text-right text-muted-foreground mr-10">Price</span>
            <span className="text-right text-muted-foreground mr-4">Time</span>
          </div>
        </div>
      )}
      
      {visibleTrades.map((trade) => (
        <HoverCard.Root key={trade.id} openDelay={0} closeDelay={0}>
          <HoverCard.Trigger asChild>
            <div className="group relative px-2 py-1.5 transition-colors border-b border-border hover:bg-accent/50">
              {isExpanded ? (
                <>
                  <div 
                    className={`
                      absolute top-0 right-0 h-full 
                      ${trade.side === 'LONG' ? 'bg-green-500/10' : 'bg-red-500/10'}
                    `}
                    style={{ 
                      width: getTradeBarWidth(trade.sizeUSD),
                    }}
                  />
                  
                  <div className="relative grid items-center grid-cols-[100px_70px_auto] text-xs">
                    <div className="flex items-center gap-1">
                      {getSourceIcon(trade.id)}
                      <span className="text-muted-foreground group-hover:text-foreground">
                        {formatUSD(trade.sizeUSD)}
                      </span>
                    </div>
                    <span className={`text-right mr-2 ${trade.side === 'LONG' ? 'text-long' : 'text-short'}`}>
                      {formatUSD(trade.price)}
                    </span>
                    <span className="text-right text-muted-foreground group-hover:text-foreground">
                      {formatTime(trade.timestamp)}
                    </span>
                  </div>
                </>
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
              className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[#141414]/80 backdrop-blur-md text-[13px]"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getSourceIcon(trade.id)}
                    <span className={`font-medium ${trade.side === 'LONG' ? 'text-long' : 'text-short'}`}>
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
                    <span>
                      {trade.id.startsWith('hl-') ? 'Hyperliquid' : 
                       trade.id.startsWith('dydx-') ? 'dYdX' : 
                       'Orderly'}
                    </span>
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
              <HoverCard.Arrow className="fill-[#141414]/80" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      ))}
    </div>
  );
}