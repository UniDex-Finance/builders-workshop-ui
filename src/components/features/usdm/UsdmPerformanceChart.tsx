import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { useEffect, useState } from 'react';

interface PriceDataPoint {
  timestamp: Date;
  price: number;
}

interface ApiResponse {
  history: Array<{
    timestamp: string;
    usdm_price: string;
  }>;
}

export function UsdmPerformanceChart() {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('https://unidexv4-market-data.up.railway.app/api/market/1/history/duration/2w?granularity=24h');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const json: ApiResponse = await response.json();
        const formattedData = json.history.map(item => ({
          timestamp: new Date(parseInt(item.timestamp)),
          price: parseFloat(parseFloat(item.usdm_price).toFixed(4))
        }));

        setData(formattedData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading price data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] text-destructive">
        Failed to load price data: {error.message}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No price data available
      </div>
    );
  }

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const yAxisDomain = [
    minPrice - (priceRange * 0.1), // Add 10% padding to the bottom
    maxPrice + (priceRange * 0.1)  // Add 10% padding to the top
  ];

  return (
    <div className="w-full h-[400px] p-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--main-accent)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--main-accent)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="timestamp"
            tickFormatter={(timestamp: Date) => {
              return timestamp.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
              });
            }}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={60}
            axisLine={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
            tickLine={{ stroke: 'var(--muted-foreground)' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
            domain={yAxisDomain}
            axisLine={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
            tickLine={{ stroke: 'var(--muted-foreground)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
            labelFormatter={(timestamp: Date) => timestamp.toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          
          <Area 
            type="monotone"
            dataKey="price"
            stroke="var(--main-accent)"
            strokeWidth={2}
            fill="url(#priceGradient)"
            fillOpacity={1}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
} 