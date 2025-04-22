import { useState, useEffect } from 'react';

// Define the structure of a single data point for the chart
interface PriceDataPoint {
  time: number; // Unix timestamp
  price: number;
}

// Define the hook's return type
interface Use24hChartDataReturn {
  data: PriceDataPoint[];
  loading: boolean;
  error: string | null;
}

// Interface for the expected API response format
interface TradingViewResponse {
  t: number[]; // Timestamps (seconds)
  c: number[]; // Closing prices
  // Add other fields (o, h, l, v) if needed
}

// Updated API function
async function fetchHistoricalData(pair: string): Promise<PriceDataPoint[]> {
  // Use only the base part of the pair for the symbol, converted to lowercase
  const symbol = pair.split('/')[0].toLowerCase(); // e.g., btc from BTC/USD
  const resolution = '60'; // 1-hour candles
  const nowSeconds = Math.floor(Date.now() / 1000);
  const twentyFourHoursAgoSeconds = nowSeconds - (24 * 60 * 60);

  const apiUrl = `https://charting.molten.exchange/tradingview?symbol=${symbol}&resolution=${resolution}&from=${twentyFourHoursAgoSeconds}&to=${nowSeconds}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      // Attempt to read error message from response if available
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
          const errorData = await response.json();
          errorMsg = errorData.message || JSON.stringify(errorData) || errorMsg;
      } catch (e) {
          // Ignore if response body is not JSON or empty
      }
      throw new Error(`Failed to fetch historical data for ${pair}: ${errorMsg}`);
    }

    const data: TradingViewResponse = await response.json();

    // Validate response format (basic check)
    if (!data || !Array.isArray(data.t) || !Array.isArray(data.c) || data.t.length !== data.c.length) {
        console.error('Invalid data format received from API:', data);
        throw new Error(`Invalid data format received for ${pair}`);
    }

    // Transform API response to PriceDataPoint array
    // Multiply timestamp by 1000 for milliseconds
    const formattedData: PriceDataPoint[] = data.t.map((timestamp, index) => ({
      time: timestamp * 1000,
      price: data.c[index],
    }));

    return formattedData;

  } catch (error) {
    console.error(`Error fetching historical data for ${pair}:`, error);
    // Re-throw the error to be caught by the hook's catch block
    throw error;
  }
}

export function use24hChartData(pair: string): Use24hChartDataReturn {
  const [chartData, setChartData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pair) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchHistoricalData(pair)
      .then(data => {
        if (isMounted) {
          setChartData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("Error fetching 24h chart data:", err);
          setError(err.message || 'Failed to load chart data');
          setLoading(false);
          setChartData([]); // Clear data on error
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pair]); // Re-fetch when the pair changes

  return { data: chartData, loading, error };
} 