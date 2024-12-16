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

interface TradeStreamContextType {
  trades: Trade[];
}

const TradeStreamContext = createContext<TradeStreamContextType>({ trades: [] });

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TradeStreamProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const MAX_TRADES = 40;

  useEffect(() => {
    const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');

    // Heartbeat setup
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000); // Send heartbeat every 30 seconds

    ws.onopen = () => {
      console.log('Connected to Hyperliquid WebSocket');
      ws.send(JSON.stringify({
        method: 'subscribe',
        subscription: { type: 'trades', coin: 'BTC' }
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Raw WS message:', message);

      if (message.channel === 'trades' && Array.isArray(message.data)) {
        const newTrades: Trade[] = message.data.flatMap((trade: RawTrade) => {
          console.log('Trade users:', trade.users); // Debug users array
          
          return trade.users.map(user => {
            const shortenedAddress = shortenAddress(user);
            console.log('Original:', user, 'Shortened:', shortenedAddress); // Debug shortening
            
            return {
              id: `${trade.tid}-${user}`,
              pair: 'BTC/USD',
              side: trade.side === 'B' ? 'LONG' as const : 'SHORT' as const,
              price: parseFloat(trade.px),
              sizeUSD: parseFloat(trade.sz) * parseFloat(trade.px),
              timestamp: trade.time,
              txHash: trade.hash === '0x0000000000000000000000000000000000000000000000000000000000000000' ? undefined : trade.hash,
              isPnL: false,
              isLiquidated: false,
              user: shortenedAddress
            };
          });
        });

        setTrades(current => [...newTrades, ...current].slice(0, MAX_TRADES));
      }
    };

    return () => {
      clearInterval(heartbeatInterval);
      ws.close();
    };
  }, []);

  return (
    <TradeStreamContext.Provider value={{ trades }}>
      {children}
    </TradeStreamContext.Provider>
  );
}

export const useTradeStream = () => useContext(TradeStreamContext);