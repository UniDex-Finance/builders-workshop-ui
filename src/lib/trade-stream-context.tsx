import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef, useCallback } from 'react';

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
}

// Update the context default value
const TradeStreamContext = createContext<TradeStreamContextType>({ 
  trades: [],
  orderbook: null 
});

const MAX_TRADES_PER_SOURCE = 100;
const BATCH_INTERVAL = 100; // 100ms batching window
const MAX_VISIBLE_TRADES = 100; // Limit total visible trades

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

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

  useEffect(() => {
    // Clear existing trades and orderbook when pair changes
    setTradesBySource({
      hyperliquid: [],
      dydx: [],
      orderly: []
    });
    setOrderbook(null);

    const connections = {
      hyperliquid: new WebSocket('wss://api.hyperliquid.xyz/ws'),
      dydx: new WebSocket('wss://dydx-ws-wrapper-production.up.railway.app'),
      orderly: new WebSocket('wss://ws-evm.orderly.org/ws/stream/0xfad2932d33abbebcd9d10a5997693cece568f6bd35466ffce1dbe3ef5833f5dd')
    };

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
        const coin = pair.split('/')[0];
        // Subscribe to trades
        connections.hyperliquid.send(JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'trades', coin }
        }));
        // Subscribe to orderbook with full precision
        connections.hyperliquid.send(JSON.stringify({
          method: 'subscribe',
          subscription: { 
            type: 'l2Book', 
            coin,
            nSigFigs: null  // Request full precision
          }
        }));
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
        
        // Process asks and bids
        const processLevels = (levels: WsLevel[]): OrderbookLevel[] => {
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

        // Fix the interpretation: levels[0] should be bids and levels[1] should be asks
        const [rawBids, rawAsks] = bookData.levels;
        
        const processedOrderbook = {
          asks: processLevels(rawAsks),
          bids: processLevels(rawBids),
          lastUpdateTime: bookData.time
        };
        
        setOrderbook(prev => {
          if (!prev || processedOrderbook.lastUpdateTime > prev.lastUpdateTime) {
            return processedOrderbook;
          }
          return prev;
        });

        // Only update if significant changes
        setOrderbook(prev => {
          if (!prev) return processedOrderbook;
          
          // Check if changes are significant enough
          const significantChange = Math.abs(
            processedOrderbook.bids[0]?.price - prev.bids[0]?.price
          ) > 0.1 || Math.abs(
            processedOrderbook.asks[0]?.price - prev.asks[0]?.price
          ) > 0.1;
          
          return significantChange ? processedOrderbook : prev;
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
    };
  }, [pair]);

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
    orderbook
  }), [allTrades, orderbook]);

  return (
    <TradeStreamContext.Provider value={contextValue}>
      {children}
    </TradeStreamContext.Provider>
  );
}

export const useTradeStream = () => useContext(TradeStreamContext);