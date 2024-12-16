import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Trade {
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

interface TradeStreamContextType {
  trades: Trade[];
}

const TradeStreamContext = createContext<TradeStreamContextType>({ trades: [] });

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TradeStreamProvider({ children, pair }: { children: ReactNode, pair: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const MAX_TRADES = 40;

  useEffect(() => {
    // Clear existing trades when pair changes
    setTrades([]);

    const connections = {
      hyperliquid: new WebSocket('wss://api.hyperliquid.xyz/ws'),
      dydx: new WebSocket('wss://dydx-ws-wrapper-production.up.railway.app')
    };

    // Heartbeat for Hyperliquid
    const heartbeatInterval = setInterval(() => {
      if (connections.hyperliquid.readyState === WebSocket.OPEN) {
        connections.hyperliquid.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);

    // Subscribe to both streams
    const subscribeToStreams = () => {
      // Hyperliquid subscription
      if (connections.hyperliquid.readyState === WebSocket.OPEN) {
        const coin = pair.split('/')[0];
        connections.hyperliquid.send(JSON.stringify({
          method: 'subscribe',
          subscription: { type: 'trades', coin }
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

        setTrades(current => [...newTrades, ...current].slice(0, MAX_TRADES));
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

        setTrades(current => [...newTrades, ...current].slice(0, MAX_TRADES));
      }
    };

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      connections.hyperliquid.close();
      connections.dydx.close();
    };
  }, [pair]);

  return (
    <TradeStreamContext.Provider value={{ trades }}>
      {children}
    </TradeStreamContext.Provider>
  );
}

export const useTradeStream = () => useContext(TradeStreamContext);