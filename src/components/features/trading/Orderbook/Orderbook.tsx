import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTradeStream, OrderbookLevel } from "../../../../lib/trade-stream-context";
import * as HoverCard from '@radix-ui/react-hover-card';

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
  const { orderbook } = useTradeStream();
  const [selectedDepth, setSelectedDepth] = useState("10");
  const [grouping, setGrouping] = useState("0.1");
  const [denomination, setDenomination] = useState<"currency" | "usd">("currency");

  // Group orders by price level
  const groupOrders = (orders: OrderbookLevel[], groupSize: number) => {
    const grouped = new Map<number, OrderbookLevel>();
    
    orders.forEach(order => {
      // Round price to nearest group
      const groupedPrice = Math.floor(order.price / groupSize) * groupSize;
      
      if (!grouped.has(groupedPrice)) {
        grouped.set(groupedPrice, {
          price: groupedPrice,
          size: 0,
          total: 0,
          numOrders: 0
        });
      }
      
      const existing = grouped.get(groupedPrice)!;
      existing.size += order.size;
      existing.numOrders += order.numOrders;
    });
    
    return Array.from(grouped.values());
  };

  // Memoize grouped orders
  const { groupedAsks, groupedBids } = useMemo(() => {
    const groupSize = parseFloat(grouping);
    // Sort asks ascending (lowest to highest)
    const rawAsks = [...(orderbook?.asks ?? [])].sort((a, b) => a.price - b.price);
    // Sort bids descending (highest to lowest)
    const rawBids = [...(orderbook?.bids ?? [])].sort((a, b) => b.price - a.price);
    
    console.log('Raw Orderbook Data:', {
      groupSize,
      rawAsks: rawAsks.slice(0, 5).map(a => a.price), // First 5 ask prices
      rawBids: rawBids.slice(0, 5).map(b => b.price)  // First 5 bid prices
    });
    
    const grouped = {
      groupedAsks: groupOrders(rawAsks, groupSize),
      groupedBids: groupOrders(rawBids, groupSize)
    };

    console.log('Grouped Orderbook Data:', {
      groupedAsks: grouped.groupedAsks.slice(0, 5).map(a => a.price), // First 5 grouped ask prices
      groupedBids: grouped.groupedBids.slice(0, 5).map(b => b.price)  // First 5 grouped bid prices
    });

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

    console.log('Final Processed Orders:', {
      asks: processedAsks.slice(0, 5).map(a => a.price), // First 5 processed ask prices
      bids: processedBids.slice(0, 5).map(b => b.price)  // First 5 processed bid prices
    });

    const maxTotal = Math.max(
      processedAsks[0]?.total ?? 0,
      processedBids[processedBids.length - 1]?.total ?? 0
    );

    return { asks: processedAsks, bids: processedBids, maxTotal };
  }, [groupedAsks, groupedBids]);

  // Format number based on denomination
  const formatSize = (size: number, price: number) => {
    if (denomination === "usd") {
      return (size * price).toFixed(2);
    }
    return size.toFixed(3);
  };

  const formatTotal = (total: number, price: number) => {
    if (denomination === "usd") {
      return (total * price).toFixed(2);
    }
    return total.toFixed(3);
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
                    {order.price.toFixed(1)}
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
                className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-popover/80 backdrop-blur-md"
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
                        {calculateAveragePrice(orders, i, type).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cumulative Size</span>
                      <span>{formatTotal(order.total, order.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price Impact</span>
                      <span className={type === "asks" ? "text-red-400" : "text-green-400"}>
                        {calculatePriceImpact(order.price, midPrice)}%
                      </span>
                    </div>
                  </div>
                </div>
                <HoverCard.Arrow className="fill-popover/80" />
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
        </div>
      );
    });
  }, [asks, bids, denomination, maxTotal, formatSize, formatTotal]);

  // Calculate spread using the closest ask and bid
  const spread = Math.abs((asks[asks.length - 1]?.price || 0) - (bids[0]?.price || 0)).toFixed(1);
  const spreadPercentage = Math.abs((((asks[asks.length - 1]?.price || 0) - (bids[0]?.price || 0)) / (asks[asks.length - 1]?.price || 1)) * 100).toFixed(2);

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

  return (
    <div 
      className="bg-card text-foreground w-[300px] rounded-lg overflow-hidden border border-border mr-2"
      style={{ height: `${height}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <div className="flex items-center space-x-1">
          <button
            className={`text-xs px-2 py-0.5 rounded ${
              grouping === "0.1" ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => setGrouping("0.1")}
          >
            0.1
          </button>
          <button
            className={`text-xs px-2 py-0.5 rounded ${
              grouping === "1" ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => setGrouping("1")}
          >
            1.0
          </button>
          <button
            className={`text-xs px-2 py-0.5 rounded ${
              grouping === "10" ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => setGrouping("10")}
          >
            10.0
          </button>
        </div>
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

      <div className="flex flex-col h-[calc(100%-48px)]">
        {/* Column Headers */}
        <div className="grid grid-cols-3 text-right text-xs text-muted-foreground border-b border-border">
          <span className="pl-4 pr-2">Price</span>
          <span className="px-2">Size</span>
          <span className="px-4">Total</span>
        </div>

        {/* Update the scrollable content div to use the ref */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scrollbar-custom"
        >
          {/* Asks (Sells) */}
          <div className="overflow-hidden border-b border-border/5">
            {renderOrders(asks, "asks")}
          </div>

          {/* Spread */}
          <div className="text-center py-1.5 text-xs text-muted-foreground bg-accent/5">
            <span className="font-mono text-xs">
              Spread: {spread} ({spreadPercentage}%)
            </span>
          </div>

          {/* Bids (Buys) */}
          <div className="overflow-hidden border-t border-border/5">
            {renderOrders(bids, "bids")}
          </div>
        </div>
      </div>
    </div>
  );
} 