import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTradeStream, OrderbookLevel } from "../../../../lib/trade-stream-context";
import { useAssetMetadata } from "../../../../lib/hooks/useAssetMetadata";
import * as HoverCard from '@radix-ui/react-hover-card';
import { orderbookConfig } from "../../../../config/orderbookConfig";

type Order = {
  price: number;
  size: number;
  total: number;
}

type OrderbookProps = {
  pair: string;
  height: number;
}

export function Orderbook({ pair, height }: OrderbookProps) {
  const { orderbook, updateHyperliquidSubscription } = useTradeStream();
  const { getAssetMetadata, loading: metadataLoading } = useAssetMetadata();
  const [selectedDepth, setSelectedDepth] = useState("10");
  const [denomination, setDenomination] = useState<"currency" | "usd">("currency");
  const orderbookContainerRef = useRef<HTMLDivElement>(null);
  
  // Add ref to track initial setup
  const initializedRef = useRef<Record<string, boolean>>({});
  
  // Store current midPrice for initialization
  const midPriceRef = useRef<Record<string, number>>({});
  
  // Store initialized grouping options
  const initialGroupingOptionsRef = useRef<Record<string, any[]>>({});
  
  // Extract the base currency from the pair (e.g., "BTC" from "BTC/USD")
  const baseCurrency = useMemo(() => pair.split('/')[0], [pair]);
  
  // Get asset metadata for the current pair
  const assetMetadata = useMemo(() => getAssetMetadata(baseCurrency), [baseCurrency, getAssetMetadata]);

  // Calculate and store midPrice when orderbook updates, but don't use it for rendering
  useEffect(() => {
    if (orderbook && orderbook.asks.length > 0 && orderbook.bids.length > 0) {
      // Calculate midPrice
      const midPrice = (orderbook.asks[0]?.price + orderbook.bids[0]?.price) / 2;
      if (midPrice > 0) {
        midPriceRef.current[pair] = midPrice;
      }
    }
  }, [orderbook, pair]);

  // Get initial grouping options FOR THE PAIR from the config
  const groupingOptions = useMemo(() => {
    console.log(`[Orderbook ${pair}] Determining grouping options from config for ${baseCurrency}`);

    // Find the config for the current currency, or use default
    const config = orderbookConfig[baseCurrency] ?? orderbookConfig.default;
    
    // Use the options defined in the config
    const finalOptions = config.groupingOptions;

    // Still useful to store the determined options for potential future checks
    initialGroupingOptionsRef.current[pair] = finalOptions; 
    
    console.log(`[Orderbook ${pair}] Using grouping options from config:`, finalOptions);
    
    return finalOptions;
    // Dependency is just baseCurrency now, as config is static
  }, [baseCurrency, pair]); 

  // Once we have a valid orderbook and haven't initialized yet, mark as initialized
  useEffect(() => {
    // Only run when we have an orderbook with data
    if (orderbook && orderbook.asks.length > 0 && orderbook.bids.length > 0 && !initializedRef.current[pair]) {
      // Mark this pair as initialized, which will prevent recalculations
      initializedRef.current[pair] = true;
    }
  }, [orderbook, pair]);
  
  // Set default grouping only when pair changes
  const [grouping, setGrouping] = useState("1.0"); // Keep a safe initial default

  // Update initial grouping value AND notify context when pair or options change
  useEffect(() => {
    // Ensure groupingOptions are derived from the config before proceeding
    if (groupingOptions && groupingOptions.length > 0) {
      // Default to the first option in the config for this pair
      const smallestGrouping = groupingOptions[0].value; 
      console.log(`[Orderbook ${pair}] Setting initial grouping from config's first option: ${smallestGrouping}`);
      setGrouping(smallestGrouping); 
      console.log(`[Orderbook ${pair}] Calling updateHyperliquidSubscription with initial grouping: ${smallestGrouping} and currency: ${baseCurrency}`);
      updateHyperliquidSubscription(smallestGrouping, baseCurrency); 
    } else {
      console.warn(`[Orderbook ${pair}] No grouping options found in config for ${baseCurrency}.`);
      // Handle cases where config might be missing options? Maybe set a fallback grouping.
      const fallbackGrouping = "1.0"; // Or read from default config
      setGrouping(fallbackGrouping);
      updateHyperliquidSubscription(fallbackGrouping, baseCurrency);
    }
  // Dependencies: update when pair/baseCurrency changes, or the derived groupingOptions change
  }, [pair, baseCurrency, groupingOptions, updateHyperliquidSubscription]); 

  // Group orders by price level with special handling for 0.01
  const groupOrders = useCallback((orders: OrderbookLevel[], groupSize: number) => {
    const grouped = new Map<string, OrderbookLevel>();
    
    orders.forEach(order => {
      // Use a consistent approach for all grouping sizes
      const roundFactor = 1 / groupSize;
      const groupedPrice = Math.floor(order.price * roundFactor) / roundFactor;
      
      // Use string key to avoid floating point key issues
      const priceKey = groupedPrice.toString();
      
      if (!grouped.has(priceKey)) {
        grouped.set(priceKey, {
          price: groupedPrice,
          size: 0,
          total: 0,
          numOrders: 0
        });
      }
      
      const existing = grouped.get(priceKey)!;
      existing.size += order.size;
      existing.numOrders += order.numOrders;
    });
    
    return Array.from(grouped.values());
  }, []);

  // Memoize grouped orders
  const { groupedAsks, groupedBids } = useMemo(() => {
    const groupSize = parseFloat(grouping);
    // Sort asks ascending (lowest to highest)
    const rawAsks = [...(orderbook?.asks ?? [])].sort((a, b) => a.price - b.price);
    // Sort bids descending (highest to lowest)
    const rawBids = [...(orderbook?.bids ?? [])].sort((a, b) => b.price - a.price);
    

    
    const grouped = {
      groupedAsks: groupOrders(rawAsks, groupSize),
      groupedBids: groupOrders(rawBids, groupSize)
    };


    return grouped;
  }, [orderbook, grouping]);

  // Memoize processed orders
  const { asks, bids, maxTotal } = useMemo(() => {
    // For asks, accumulate total from bottom to top
    const processedAsks = [...groupedAsks].reverse().map((order, index) => ({
      ...order,
      total: groupedAsks.slice(0, groupedAsks.length - index).reduce((sum, o) => sum + o.size, 0)
    }));

    // For bids, accumulate total from top to bottom
    const processedBids = groupedBids.map((order, index) => ({
      ...order,
      total: groupedBids.slice(0, index + 1).reduce((sum, o) => sum + o.size, 0)
    }));


    const maxTotal = Math.max(
      processedAsks[0]?.total ?? 0,
      processedBids[processedBids.length - 1]?.total ?? 0
    );

    return { asks: processedAsks, bids: processedBids, maxTotal };
  }, [groupedAsks, groupedBids]);

  // Map grouping values to decimal places
  const getDecimalPlaces = () => {
    if (!grouping) return 1;
    
    // Count decimal places in the grouping value
    const match = grouping.match(/\.(\d+)/);
    if (match && match[1]) {
      return match[1].length;
    }
    return 0;
  };

  // Format number based on denomination and grouping
  const formatNumber = (num: number, decimals: number | null = null, isPriceDisplay = false) => {
    // Use explicit decimals or derive from grouping
    const decimalPlaces = decimals !== null ? decimals : getDecimalPlaces();
    
    // Special case for USD values >= 1, but NOT for price display
    if (decimalPlaces === 2 && num >= 1 && !isPriceDisplay) {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    }
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  };

  // Update formatSize and formatTotal to use formatNumber and szDecimals
  const formatSize = (size: number, price: number) => {
    if (denomination === "usd") {
      const value = size * price;
      // Keep USD formatting: 2 decimals for < 1, 0 for >= 1
      return formatNumber(value, value < 1 ? 2 : 0); 
    }
    // Use szDecimals for currency formatting, fallback to 3 if metadata not loaded
    return formatNumber(size, assetMetadata?.szDecimals ?? 3);
  };

  const formatTotal = (total: number, price: number) => {
    if (denomination === "usd") {
      const value = total * price;
      // Keep USD formatting: 2 decimals for < 1, 0 for >= 1
      return formatNumber(value, value < 1 ? 2 : 0);
    }
    // Use szDecimals for currency formatting, fallback to 3 if metadata not loaded
    return formatNumber(total, assetMetadata?.szDecimals ?? 3);
  };

  // Add function to calculate price impact
  const calculatePriceImpact = (price: number, midPrice: number) => {
    return ((Math.abs(price - midPrice) / midPrice) * 100).toFixed(2);
  };

  // Add this helper function near the other calculation functions
  const calculateAveragePrice = (orders: Order[], currentIndex: number, type: "asks" | "bids") => {
    const relevantOrders = type === "asks" 
      ? orders.slice(orders.length - currentIndex - 1) // For asks, take from bottom to current
      : orders.slice(0, currentIndex + 1); // For bids, take from top to current
      
    const totalSize = relevantOrders.reduce((sum, o) => sum + o.size, 0);
    const weightedSum = relevantOrders.reduce((sum, o) => sum + (o.price * o.size), 0);
    
    return totalSize > 0 ? weightedSum / totalSize : 0;
  };

  // Memoize render function
  const renderOrders = useCallback((orders: Order[], type: "asks" | "bids") => {
    const midPrice = (asks[asks.length - 1]?.price + bids[0]?.price) / 2;

    return orders.map((order, i) => {
      const dataAttr = `data-${type}-row`;
      
      return (
        <div key={`${type}-${order.price}`}>
          <HoverCard.Root>
            <HoverCard.Trigger asChild>
              <div
                className="relative h-6 group hover:bg-accent/5"
                data-price={order.price}
                data-index={i}
                {...{ [dataAttr]: true }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  const rows = document.querySelectorAll(`[${dataAttr}]`);
                  const currentIndex = Array.from(rows).indexOf(e.currentTarget);
                  
                  rows.forEach((row, idx) => {
                    if (type === 'asks' ? idx >= currentIndex : idx <= currentIndex) {
                      const distance = Math.abs(idx - currentIndex);
                      const opacity = Math.max(0.1, 0.4 - (distance * 0.03));
                      row.classList.add('bg-accent/5');
                      
                      // Update the size visualization bar opacity
                      const bar = row.querySelector('[data-viz-bar]');
                      if (bar instanceof HTMLElement) {
                        bar.style.opacity = opacity.toString();
                      }
                    }
                  });
                }}
                onMouseLeave={() => {
                  document.querySelectorAll(`[${dataAttr}]`).forEach(row => {
                    row.classList.remove('bg-accent/5');
                    const bar = row.querySelector('[data-viz-bar]');
                    if (bar instanceof HTMLElement) {
                      bar.style.opacity = '0.1'; // Reset to default opacity
                    }
                  });
                }}
              >
                {/* Size visualization bar */}
                <div
                  data-viz-bar
                  className={`absolute top-0 bottom-0 ${
                    type === "asks" ? "bg-red-500" : "bg-green-500"
                  } transition-all duration-200`}
                  style={{
                    width: `${(order.total / maxTotal) * 100}%`,
                    left: 0,
                    opacity: 0.1
                  }}
                />

                {/* Content */}
                <div className="relative h-full grid grid-cols-3 text-right items-center">
                  <span className={`font-mono text-xs ${
                    type === "asks" ? "text-red-400" : "text-green-400"
                  } pr-4 group-hover:text-foreground transition-colors`}>
                    {formatNumber(order.price, null, true)}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs px-2 group-hover:text-foreground transition-colors">
                    {formatSize(order.size, order.price)}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs px-3 group-hover:text-foreground transition-colors">
                    {formatTotal(order.total, order.price)}
                  </span>
                </div>
              </div>
            </HoverCard.Trigger>

            <HoverCard.Portal>
              <HoverCard.Content
                side="left"
                align="center"
                sideOffset={5}
                className="z-30 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[#141414]/80 backdrop-blur-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      type === "asks" ? "text-red-400" : "text-green-400"
                    }`}>
                      {type === "asks" ? "Ask Order" : "Bid Order"}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Price</span>
                      <span className="font-medium">
                        {formatNumber(calculateAveragePrice(orders, i, type))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cumulative Size</span>
                      <span>{formatTotal(order.total, order.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Impact</span>
                      <span className={type === "asks" ? "text-red-400" : "text-green-400"}>
                        {formatNumber(parseFloat(calculatePriceImpact(order.price, midPrice)), 2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <HoverCard.Arrow className="fill-[#141414]/80" />
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
        </div>
      );
    });
  }, [asks, bids, denomination, maxTotal, formatSize, formatTotal, assetMetadata, grouping, getDecimalPlaces]);

  // Update spread display
  const spread = formatNumber(Math.abs((asks[asks.length - 1]?.price || 0) - (bids[0]?.price || 0)));
  const spreadPercentage = formatNumber(
    Math.abs((((asks[asks.length - 1]?.price || 0) - (bids[0]?.price || 0)) / (asks[asks.length - 1]?.price || 1)) * 100),
    2
  );

  // Add ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMidPriceRef = useRef<number | null>(null);

  // Replace the existing useEffect with this updated version
  useEffect(() => {
    if (!scrollContainerRef.current || !asks.length || !bids.length) {
      return;
    }

    const midPrice = (asks[asks.length - 1]?.price + bids[0]?.price) / 2;
    const container = scrollContainerRef.current;
    const rowHeight = 24; // height of each order row

    // Calculate the position where mid price should be
    const asksHeight = asks.length * rowHeight;
    const midPoint = asksHeight - (container.clientHeight / 2);
    
    // If this is the first render or price changed significantly
    if (prevMidPriceRef.current === null || 
        Math.abs(midPrice - prevMidPriceRef.current) > parseFloat(grouping)) {
      // Center immediately
      container.scrollTop = midPoint;
    } else {
      // Smooth scroll to maintain relative position
      const priceDiff = midPrice - prevMidPriceRef.current;
      const scrollDiff = (priceDiff / parseFloat(grouping)) * rowHeight;
      container.scrollTop = container.scrollTop + scrollDiff;
    }

    prevMidPriceRef.current = midPrice;
  }, [asks, bids, grouping]);

  // Add useEffect to handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdowns = document.querySelectorAll('.orderbook-dropdown');
      dropdowns.forEach(dropdown => {
        if (dropdown instanceof HTMLElement && !dropdown.contains(event.target as Node)) {
          dropdown.classList.add('hidden');
        }
      });
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={orderbookContainerRef}
      className="relative bg-card text-foreground w-[300px] border-t border-b border-r border-l border-border"
      style={{
        height: `${height}px`,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between border-b border-border px-2 py-1.5 h-8">
        {/* Grouping Dropdown */}
        <div className="relative">
          <button
            className="flex items-center space-x-1 px-2 py-0.5 text-xs bg-accent/30 hover:bg-accent/50 rounded"
            onClick={(e) => {
              const dropdown = e.currentTarget.nextElementSibling;
              if (dropdown) {
                dropdown.classList.toggle('hidden');
              }
            }}
          >
            <span>Grouping: {grouping}</span>
            <ChevronDown size={12} />
          </button>
          <div className="absolute top-full left-0 mt-1 bg-card shadow-lg border border-border rounded hidden z-10 orderbook-dropdown">
            <div className="flex flex-col p-1">
              {groupingOptions.map(option => (
                <button
                  key={option.value}
                  className={`text-xs px-3 py-1 text-left rounded ${
                    grouping === option.value ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                  onClick={(e) => {
                    const newGrouping = option.value;
                    console.log(`[Orderbook ${pair}] User selected new grouping: ${newGrouping}`);
                    setGrouping(newGrouping);
                    console.log(`[Orderbook ${pair}] Calling updateHyperliquidSubscription with new grouping: ${newGrouping} and currency: ${baseCurrency}`);
                    updateHyperliquidSubscription(newGrouping, baseCurrency); 
                    e.currentTarget.closest('div.absolute')?.classList.add('hidden');
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Denomination Toggle */}
        <div className="flex items-center space-x-2">
          <button
            className={`text-xs px-2 py-0.5 rounded ${
              denomination === "currency" ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => setDenomination("currency")}
          >
            {pair.split('/')[0]}
          </button>
          <button
            className={`text-xs px-2 py-0.5 rounded ${
              denomination === "usd" ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => setDenomination("usd")}
          >
            USD
          </button>
        </div>
      </div>

      {/* Column Headers - positioned below header */}
      <div className="absolute top-8 left-0 right-0 grid grid-cols-3 text-right text-xs text-muted-foreground border-b border-border h-6">
        <span className="pl-4 pr-2 flex items-center justify-end">Price</span>
        <span className="px-2 flex items-center justify-end">Size</span>
        <span className="px-4 flex items-center justify-end">Total</span>
      </div>

      {/* Content area - positioned below column headers with plenty of space to bottom */}
      <div 
        ref={scrollContainerRef}
        className="absolute top-14 left-0 right-0 bottom-0 overflow-y-auto scrollbar-custom"
      >
        {/* Asks (Sells) */}
        <div className="overflow-hidden border-b border-border/5">
          {orderbook === null ? (
             <div className="text-center text-xs text-muted-foreground py-4">Loading orderbook...</div>
           ) : asks.length > 0 ? (
            renderOrders(asks, "asks")
           ) : (
             <div className="text-center text-xs text-muted-foreground py-4">No ask data available.</div>
           )}
        </div>

        {/* Spread - Grouping Removed */}
        <div className="text-center py-1.5 text-xs text-muted-foreground bg-accent/5 flex items-center justify-center gap-3 h-8">
          <span className="font-mono text-xs">
            Spread: {spread} ({spreadPercentage}%)
          </span>
        </div>

        {/* Bids (Buys) */}
        <div className="overflow-hidden border-t border-border/5 mb-2">
          {orderbook === null ? (
             <div className="text-center text-xs text-muted-foreground py-4"></div> // No text needed here maybe
           ) : bids.length > 0 ? (
             renderOrders(bids, "bids")
           ) : (
             <div className="text-center text-xs text-muted-foreground py-4">No bid data available.</div>
           )}
        </div>
      </div>
    </div>
  );
} 