import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef, useCallback } from 'react';
// Import the new config
import { orderbookConfig } from '../config/orderbookConfig'; 

export interface Trade {
  id: string;
  pair: string;
  side: 'LONG' | 'SHORT';
  price: number;
  sizeUSD: number;
  timestamp: number;
  isPnL?: boolean;
  pnlPercentage?: number;
  isLiquidated?: boolean;
  txHash?: string;
  collateral?: number;
  user?: string;
}

interface RawTrade {
  coin: string;
  side: 'B' | 'S';
  px: string;
  sz: string;
  time: number;
  tid: number;
  hash: string;
  users: string[];
}

// Add dYdX specific interfaces
interface DydxTrade {
  id: string;
  size: string;
  price: string;
  side: string;
  createdAt: string;
  type: string;
}

interface DydxTradeMessage {
  type: 'trades';
  market: string;
  trades: DydxTrade[];
}

// Add Orderly interface after the DydxTradeMessage interface
interface OrderlyTrade {
  symbol: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
}

interface OrderlyTradeMessage {
  topic: string;
  ts: number;
  data: OrderlyTrade;
}

// Add new interfaces
interface WsLevel {
  px: string;
  sz: string;
  n: number;
}

interface WsBook {
  coin: string;
  levels: [WsLevel[], WsLevel[]];
  time: number;
}

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
  numOrders: number;
}

interface OrderbookData {
  asks: OrderbookLevel[];
  bids: OrderbookLevel[];
  lastUpdateTime: number;
}

// Update the context type
interface TradeStreamContextType {
  trades: Trade[];
  orderbook: OrderbookData | null;
  updateHyperliquidSubscription: (grouping: string, baseCurrency: string) => void;
}

// Update the context default value
const TradeStreamContext = createContext<TradeStreamContextType>({ 
  trades: [],
  orderbook: null,
  updateHyperliquidSubscription: () => {}
});

const MAX_TRADES_PER_SOURCE = 100;
const BATCH_INTERVAL = 100; // 100ms batching window
const MAX_VISIBLE_TRADES = 100; // Limit total visible trades

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper function to get nSigFigs from the config
const getNSigFigsForGrouping = (groupingStr: string, baseCurrency: string): number | null => {
  console.log(`[Context] Getting nSigFigs for ${baseCurrency} with grouping ${groupingStr}`);
  
  // Find the config for the current currency, or use default
  const pairConfig = orderbookConfig[baseCurrency] ?? orderbookConfig.default;
  
  // Check if the specific grouping value exists in the mapping for this config
  if (pairConfig.sigFigMapping.hasOwnProperty(groupingStr)) {
    const nSigFigs = pairConfig.sigFigMapping[groupingStr];
    console.log(`[Context] Found mapping in config: ${groupingStr} -> ${nSigFigs}`);
    return nSigFigs;
  } else {
    // If the exact grouping isn't mapped (e.g., an intermediate value not in config options)
    // Default to null (full precision) as a safe fallback
    console.warn(`[Context] Grouping value "${groupingStr}" not found in sigFigMapping for ${baseCurrency} or default config. Defaulting to null.`);
    return null; 
  }
};

export function TradeStreamProvider({ children, pair }: { children: ReactNode, pair: string }) {
  const [tradesBySource, setTradesBySource] = useState<{
    hyperliquid: Trade[];
    dydx: Trade[];
    orderly: Trade[];
  }>({
    hyperliquid: [],
    dydx: [],
    orderly: []
  });

  // Add orderbook state
  const [orderbook, setOrderbook] = useState<OrderbookData | null>(null);

  // Use useRef for batching trades
  const tradesBatchRef = useRef<{
    hyperliquid: Trade[];
    dydx: Trade[];
    orderly: Trade[];
  }>({
    hyperliquid: [],
    dydx: [],
    orderly: []
  });

  // Add batch update timeout ref
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for WebSocket management
  const hyperliquidWsRef = useRef<WebSocket | null>(null);
  const currentCoinRef = useRef<string | null>(null);
  const currentNSigFigsRef = useRef<number | null>(null); // Initially null for full precision

  // Add function to flush batched trades
  const flushBatchedTrades = useCallback(() => {
    setTradesBySource(current => {
      const newTrades = {
        hyperliquid: [...tradesBatchRef.current.hyperliquid, ...current.hyperliquid].slice(0, MAX_TRADES_PER_SOURCE),
        dydx: [...tradesBatchRef.current.dydx, ...current.dydx].slice(0, MAX_TRADES_PER_SOURCE),
        orderly: [...tradesBatchRef.current.orderly, ...current.orderly].slice(0, MAX_TRADES_PER_SOURCE)
      };
      
      // Clear the batch
      tradesBatchRef.current = {
        hyperliquid: [],
        dydx: [],
        orderly: []
      };
      
      return newTrades;
    });
  }, []);

  // Function to update Hyperliquid subscription
  const updateHyperliquidSubscription = useCallback((grouping: string, baseCurrency: string) => {
    console.log(`[Context] updateHyperliquidSubscription called with grouping: ${grouping}, currency: ${baseCurrency}`);

    if (!hyperliquidWsRef.current || hyperliquidWsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("[Context] Hyperliquid WS not open, cannot update subscription.");
      return;
    }

    const coin = baseCurrency;

    const newNSigFigs = getNSigFigsForGrouping(grouping, coin);
    const oldNSigFigs = currentNSigFigsRef.current;

    console.log(`[Context] Comparing nSigFigs for ${coin}: Old=${oldNSigFigs}, New=${newNSigFigs}`);

    if (newNSigFigs !== oldNSigFigs) {
      console.log(`[Context] Updating HL subscription for ${coin}: nSigFigs ${oldNSigFigs} -> ${newNSigFigs}`);

      if (oldNSigFigs !== null) {
         console.log(`[Context] Sending unsubscribe for nSigFigs: ${oldNSigFigs}`);
        hyperliquidWsRef.current.send(JSON.stringify({
          method: "unsubscribe",
          subscription: { type: "l2Book", coin, nSigFigs: oldNSigFigs }
        }));
      } else {
         console.log("[Context] Skipping unsubscribe for initial null nSigFigs.");
      }

      console.log(`[Context] Sending subscribe for nSigFigs: ${newNSigFigs}`);
      hyperliquidWsRef.current.send(JSON.stringify({
        method: "subscribe",
        subscription: { type: "l2Book", coin, nSigFigs: newNSigFigs }
      }));

      currentNSigFigsRef.current = newNSigFigs;
      console.log("[Context] Clearing orderbook state during subscription change.");
      setOrderbook(null); 
    } else {
       console.log("[Context] nSigFigs unchanged, skipping subscription update.");
    }
  }, []);

  useEffect(() => {
    // Clear existing trades and orderbook when pair changes
    setTradesBySource({
      hyperliquid: [],
      dydx: [],
      orderly: []
    });
    setOrderbook(null);

    const newCoin = pair.split('/')[0];

    // --- WebSocket Setup ---
    // Close existing connections if they exist
    if (hyperliquidWsRef.current) hyperliquidWsRef.current.close();
    // ... potentially close dydx and orderly refs if you store them ...

    // Reset current subscription refs
    currentCoinRef.current = newCoin;
    currentNSigFigsRef.current = null; // Start with null, Orderbook will call update soon

    const connections = {
      hyperliquid: new WebSocket('wss://api.hyperliquid.xyz/ws'),
      dydx: new WebSocket('wss://dydx-ws-wrapper-production.up.railway.app'),
      orderly: new WebSocket('wss://ws-evm.orderly.org/ws/stream/0xfad2932d33abbebcd9d10a5997693cece568f6bd35466ffce1dbe3ef5833f5dd')
    };

    // Store the Hyperliquid connection
    hyperliquidWsRef.current = connections.hyperliquid;

    // Heartbeat for Hyperliquid
    const heartbeatInterval = setInterval(() => {
      if (connections.hyperliquid.readyState === WebSocket.OPEN) {
        connections.hyperliquid.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);

    // Add Orderly heartbeat
    const orderlyHeartbeat = setInterval(() => {
      if (connections.orderly.readyState === WebSocket.OPEN) {
        connections.orderly.send(JSON.stringify({ op: 'ping' }));
      }
    }, 10000);

    // Subscribe to both streams
    const subscribeToStreams = () => {
      if (connections.hyperliquid.readyState === WebSocket.OPEN) {
        const coin = currentCoinRef.current;
        if (coin) {
          // Subscribe to trades
          connections.hyperliquid.send(JSON.stringify({
            method: 'subscribe',
            subscription: { type: 'trades', coin }
          }));
          // Initial subscribe to orderbook with null - Orderbook's useEffect will update it
          connections.hyperliquid.send(JSON.stringify({
            method: 'subscribe',
            subscription: { 
              type: 'l2Book', 
              coin,
              nSigFigs: null // Start with null
            }
          }));
           console.log(`Initial HL subscription for ${coin}: nSigFigs null (will be updated by Orderbook component)`);
        }
      }

      // dYdX subscription
      if (connections.dydx.readyState === WebSocket.OPEN) {
        const dydxMarket = `${pair.split('/')[0]}-${pair.split('/')[1]}`;
        connections.dydx.send(JSON.stringify({
          type: 'subscribe',
          market: dydxMarket
        }));
      }

      // Orderly subscription
      if (connections.orderly.readyState === WebSocket.OPEN) {
        const orderlySymbol = `PERP_${pair.replace('/', '_')}C`;
        connections.orderly.send(JSON.stringify({
          id: `orderly-${Date.now()}`,
          topic: `${orderlySymbol}@trade`,
          event: 'subscribe'
        }));
      }
    };

    // Set up connection handlers
    connections.hyperliquid.onopen = () => {
      console.log('Connected to Hyperliquid WebSocket');
      subscribeToStreams();
    };

    connections.dydx.onopen = () => {
      console.log('Connected to dYdX WebSocket');
      subscribeToStreams();
    };

    // Add Orderly connection handler
    connections.orderly.onopen = () => {
      console.log('Connected to Orderly WebSocket');
      subscribeToStreams();
    };

    connections.orderly.onerror = (error) => {
      console.error('Orderly WebSocket error:', error);
    };

    connections.orderly.onclose = () => {
      console.log('Orderly WebSocket closed');
    };

    // Handle messages from both sources
    connections.hyperliquid.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.channel === 'trades' && Array.isArray(message.data)) {
        const newTrades: Trade[] = message.data.map((trade: RawTrade) => ({
          id: `hl-${trade.tid}`,
          pair,
          side: trade.side === 'B' ? 'LONG' : 'SHORT',
          price: parseFloat(trade.px),
          sizeUSD: parseFloat(trade.sz) * parseFloat(trade.px),
          timestamp: trade.time,
          txHash: trade.hash === '0x0000000000000000000000000000000000000000000000000000000000000000' ? undefined : trade.hash,
          isPnL: false,
          isLiquidated: false,
          user: trade.users[0] ? shortenAddress(trade.users[0]) : undefined
        }));

        tradesBatchRef.current.hyperliquid.push(...newTrades);
        
        // Schedule a batch update
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }
        batchTimeoutRef.current = setTimeout(flushBatchedTrades, BATCH_INTERVAL);
      }
      
      if (message.channel === 'l2Book' && message.data) {
        const bookData = message.data as WsBook;
        
        // Log raw counts (keep this for debugging)
        console.log(`Received l2Book for ${bookData.coin} (nSigFigs: ${currentNSigFigsRef.current}): ${bookData.levels[1]?.length ?? 0} asks, ${bookData.levels[0]?.length ?? 0} bids`);
        
        const processLevels = (levels: WsLevel[]): OrderbookLevel[] => {
           // Ensure levels is an array before mapping
           if (!Array.isArray(levels)) return []; 
            let total = 0;
            return levels.map(level => {
              const size = parseFloat(level.sz);
              total += size;
              return {
                price: parseFloat(level.px),
                size,
                total,
                numOrders: level.n
              };
            });
        };

        const [rawBids, rawAsks] = bookData.levels;
        
        const processedOrderbook = {
          asks: processLevels(rawAsks?.sort((a, b) => parseFloat(a.px) - parseFloat(b.px)) || []),
          bids: processLevels(rawBids?.sort((a, b) => parseFloat(b.px) - parseFloat(a.px)) || []),
          lastUpdateTime: bookData.time
        };
        
        setOrderbook(prev => {
          // Use >= to handle potential race conditions if updates are very fast
          if (!prev || processedOrderbook.lastUpdateTime >= prev.lastUpdateTime) {
             // Basic check to prevent setting empty data if bookData was malformed
             if (processedOrderbook.asks.length > 0 || processedOrderbook.bids.length > 0) {
                 return processedOrderbook;
             }
          }
          return prev;
        });
      }
    };

    connections.dydx.onmessage = (event) => {
      const message: DydxTradeMessage = JSON.parse(event.data);
      
      if (message.type === 'trades') {
        const newTrades: Trade[] = message.trades.map(trade => ({
          id: `dydx-${trade.id}`,
          pair,
          side: trade.side === 'BUY' ? 'LONG' : 'SHORT',
          price: parseFloat(trade.price),
          sizeUSD: parseFloat(trade.size) * parseFloat(trade.price),
          timestamp: new Date(trade.createdAt).getTime(),
          isPnL: false,
          isLiquidated: trade.type === 'LIQUIDATED',
        }));

        tradesBatchRef.current.dydx.push(...newTrades);
        
        // Schedule a batch update
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }
        batchTimeoutRef.current = setTimeout(flushBatchedTrades, BATCH_INTERVAL);
      }
    };

    // Add Orderly message handler after the dYdX handler
    connections.orderly.onmessage = (event) => {
      const message: OrderlyTradeMessage = JSON.parse(event.data);
      
      if (message.topic?.endsWith('@trade') && message.data) {
        const trade = message.data;
        const sizeUSD = Number((trade.size * trade.price).toFixed(4));
        const tradeId = `orderly-${message.ts}`;
        const newTrade: Trade = {
          id: tradeId,
          pair,
          side: trade.side === 'BUY' ? 'LONG' : 'SHORT',
          price: trade.price,
          sizeUSD,
          // Add a small random offset to prevent timestamp collisions
          timestamp: message.ts + Math.floor(Math.random() * 100),
          isPnL: false,
          isLiquidated: false,
        };

        tradesBatchRef.current.orderly.push(newTrade);
        
        // Schedule a batch update
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }
        batchTimeoutRef.current = setTimeout(flushBatchedTrades, BATCH_INTERVAL);
      }
    };

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(orderlyHeartbeat);
      Object.values(connections).forEach(connection => connection.close());
      // Close WS connections
       if (hyperliquidWsRef.current) {
          console.log("Closing Hyperliquid WS connection.");
          hyperliquidWsRef.current.close();
          hyperliquidWsRef.current = null;
        }
        // ... close other connections if refs exist ...
      // Clear the batch timeout just in case
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
    };
  }, [pair, flushBatchedTrades]); // updateHyperliquidSubscription is stable due to useCallback([])

  // Combine and sort all trades for the context value
  const allTrades = useMemo(() => {
    const combined = [
      ...tradesBySource.hyperliquid,
      ...tradesBySource.dydx,
      ...tradesBySource.orderly
    ];
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }, [tradesBySource]);

  // Create a memoized context value
  const contextValue = useMemo(() => ({
    trades: allTrades,
    orderbook,
    updateHyperliquidSubscription
  }), [allTrades, orderbook, updateHyperliquidSubscription]);

  return (
    <TradeStreamContext.Provider value={contextValue}>
      {children}
    </TradeStreamContext.Provider>
  );
}

export const useTradeStream = () => useContext(TradeStreamContext);