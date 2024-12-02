import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

interface PriceData {
  [key: string]: {
    price: number;
  };
}

interface PriceContextType {
  prices: PriceData;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

const THROTTLE_INTERVAL = 600;

export const usePrices = () => {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error("usePrices must be used within a PriceProvider");
  }
  return context;
};

export const PriceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [prices, setPrices] = useState<PriceData>({});
  const priceBuffer = useRef<PriceData>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushPriceUpdates = useCallback(() => {
    if (Object.keys(priceBuffer.current).length > 0) {
      setPrices((prevPrices) => ({
        ...prevPrices,
        ...priceBuffer.current,
      }));
      priceBuffer.current = {};
    }
    timeoutRef.current = null;
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (timeoutRef.current === null) {
      timeoutRef.current = setTimeout(flushPriceUpdates, THROTTLE_INTERVAL);
    }
  }, [flushPriceUpdates]);

  useEffect(() => {
    const ws = new WebSocket("wss://pricefeed-production.up.railway.app/");

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Update the buffer instead of state directly
      priceBuffer.current = {
        ...priceBuffer.current,
        ...data,
      };

      // Schedule a throttled update
      scheduleUpdate();
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      ws.close();
    };
  }, [scheduleUpdate]);

  return (
    <PriceContext.Provider value={{ prices }}>{children}</PriceContext.Provider>
  );
};
