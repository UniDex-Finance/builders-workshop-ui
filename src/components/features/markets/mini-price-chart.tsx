import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { use24hChartData } from '../../../hooks/use-24h-chart-data'; // Adjust path as needed
import { cn } from '../../../lib/utils';

interface MiniPriceChartProps {
  pair: string;
  className?: string;
}

// Define the structure of a single data point for the chart
interface PriceDataPoint {
    time: number; // Unix timestamp
    price: number;
}

export function MiniPriceChart({ pair, className }: MiniPriceChartProps) {
  const { data, loading, error } = use24hChartData(pair);

  if (loading) {
    return <div className={cn("h-10 w-24 flex items-center justify-center text-xs text-muted-foreground", className)}>Loading...</div>;
  }

  if (error || data.length < 2) {
    // Need at least 2 points to draw a line
    return <div className={cn("h-10 w-24 flex items-center justify-center text-xs text-destructive", className)}>N/A</div>;
  }

  // Determine chart color based on the trend (first vs last price)
  const startPrice = data[0]?.price ?? 0;
  const endPrice = data[data.length - 1]?.price ?? 0;
  const strokeColor = endPrice >= startPrice ? '#22c55e' : '#ef4444'; // Green for up/flat, Red for down

  // Find min/max price for YAxis domain to prevent clipping
  const prices = data.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return (
    <div className={cn("h-10 w-24", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          {/* Add YAxis to set domain, but hide it visually */}
           <YAxis hide domain={[minPrice, maxPrice]} />
          <Line
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false} // Hide dots on the line for a cleaner look
            isAnimationActive={false} // Optional: disable animation for performance
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 