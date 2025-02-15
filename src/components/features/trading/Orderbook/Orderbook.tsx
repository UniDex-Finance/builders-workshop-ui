import { useState, useCallback, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useTradeStream, OrderbookLevel } from "../../../../lib/trade-stream-context";

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

  // Memoize render function
  const renderOrders = useCallback((orders: Order[], type: "asks" | "bids") => {
    return orders.map((order, i) => (
      <div
        key={`${type}-${order.price}`}
        className="relative h-6 hover:bg-accent/5"
      >
        {/* Size visualization bar */}
        <div
          className={`absolute top-0 bottom-0 ${
            type === "asks" ? "bg-red-500/10" : "bg-green-500/10"
          }`}
          style={{
            width: `${(order.total / maxTotal) * 100}%`,
            left: 0
          }}
        />

        {/* Content */}
        <div className="relative h-full grid grid-cols-3 text-right items-center">
          <span className={`font-mono text-xs ${type === "asks" ? "text-red-400" : "text-green-400"} pr-4`}>
            {order.price.toFixed(1)}
          </span>
          <span className="text-muted-foreground font-mono text-xs px-2">
            {formatSize(order.size, order.price)}
          </span>
          <span className="text-muted-foreground font-mono text-xs px-3">
            {formatTotal(order.total, order.price)}
          </span>
        </div>
      </div>
    ));
  }, [denomination, maxTotal]);

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

  // Calculate spread using the closest ask and bid
  const spread = Math.abs((asks[asks.length - 1]?.price || 0) - (bids[0]?.price || 0)).toFixed(1);
  const spreadPercentage = Math.abs((((asks[asks.length - 1]?.price || 0) - (bids[0]?.price || 0)) / (asks[asks.length - 1]?.price || 1)) * 100).toFixed(2);

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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-custom">
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