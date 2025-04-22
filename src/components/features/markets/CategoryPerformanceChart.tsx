import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { HEATMAP_CATEGORIES, HeatmapCategory } from '../../../lib/heatmap-categories';
import { useCategoryPerformanceHistory, CategoryPerformancePoint } from '../../../hooks/use-category-performance-history';
import { cn } from '../../../lib/utils';

// Define a color palette for categories (expand as needed)
export const categoryColors: { [key in HeatmapCategory]?: string } = {
  "Layer 1": "#8884d8",
  "Layer 2": "#82ca9d",
  "Meme Coins": "#ffc658",
  "DeFi & Utility": "#ff7300",
  "Infrastructure": "#00C49F",
  "Interoperability": "#0088FE",
  "NFT & Gaming": "#FFBB28",
  "Indices & FX": "#FF8042",
  "Payment": "#A4DE6C",
  // Add more colors if categories expand
};
export const defaultColor = "#cccccc"; // Fallback color

// Define padding for the Y-axis domain
const Y_AXIS_PADDING = 0.5;

// --- Component Props ---
interface CategoryPerformanceChartProps {
    activeCategories: HeatmapCategory[]; // Categories controlled by parent
    onCategoriesDetermined: (categories: HeatmapCategory[]) => void; // Callback to parent
}

export function CategoryPerformanceChart({
    activeCategories,
    onCategoriesDetermined
}: CategoryPerformanceChartProps) {
  const { data, loading, error } = useCategoryPerformanceHistory();

  // Calculate categoriesToPlot first, needed for yAxisTicks
  const categoriesToPlot = useMemo(() => {
    // Still check for data readiness inside useMemo
    if (!data || data.length === 0) return [];
    // Check if data[0] exists before accessing properties
    const firstPoint = data[0];
    if (!firstPoint) return [];
    return HEATMAP_CATEGORIES.filter(cat => cat !== "Other" && firstPoint[cat] !== undefined);
  }, [data]);

  // Initialize active categories once categoriesToPlot is determined -> NOW CALL CALLBACK
  useEffect(() => {
    if (onCategoriesDetermined && categoriesToPlot.length > 0) {
        onCategoriesDetermined(categoriesToPlot); // Inform parent about available categories
    }
  }, [categoriesToPlot, onCategoriesDetermined]);

  // Calculate Min/Max Data Values based on *active* categories (passed via prop)
  const { dataMin, dataMax } = useMemo(() => {
    if (!data || data.length === 0 || activeCategories.length === 0) {
      return { dataMin: undefined, dataMax: undefined };
    }

    let minValue: number | undefined = undefined;
    let maxValue: number | undefined = undefined;

    data.forEach(point => {
      activeCategories.forEach(category => {
        const value = point[category];
        if (typeof value === 'number' && !isNaN(value)) {
          minValue = Math.min(minValue ?? value, value);
          maxValue = Math.max(maxValue ?? value, value);
        }
      });
    });

    return { dataMin: minValue, dataMax: maxValue };
  }, [data, activeCategories]);

  // Calculate yAxisTicks (Hook 2 - useMemo) - Uses dataMin/dataMax
  const yAxisTicks = useMemo(() => {
    // Use the calculated min/max values
    if (dataMin === undefined || dataMax === undefined) {
        return undefined; // Let recharts decide if no data or invalid range
    }

    // Ensure bounds are finite numbers before proceeding
    if (!isFinite(dataMin) || !isFinite(dataMax)) {
         return undefined;
    }

    const lowerBound = Math.floor(dataMin);
    const upperBound = Math.ceil(dataMax);

    if (lowerBound === upperBound) {
        // Add padding if min/max are the same
        return [lowerBound - Y_AXIS_PADDING, lowerBound, lowerBound + Y_AXIS_PADDING];
    }
    if (lowerBound > upperBound) {
         // Should not happen if dataMin/dataMax are valid, but handle defensively
         return [0];
    }

    const ticks: number[] = [];
    let startTick = lowerBound;
    // Adjust start tick if adding padding makes it cross an integer boundary weirdly
    // Example: min is 0.1, padded min is -0.4, floor is -1. Start from 0 instead.
    if (Math.floor(dataMin - Y_AXIS_PADDING) < startTick && startTick === 0){
         startTick = Math.floor(dataMin - Y_AXIS_PADDING);
    } else if (Math.floor(dataMin - Y_AXIS_PADDING) < startTick){
         startTick = lowerBound; // default floor
    }


    let endTick = upperBound;
     // Example: max is 2.1, padded max is 2.6, ceil is 3. Keep endTick as 3.
    if (Math.ceil(dataMax + Y_AXIS_PADDING) > endTick) {
        endTick = Math.ceil(dataMax + Y_AXIS_PADDING);
    }


    for (let i = startTick; i <= endTick; i++) {
        // Only add integer ticks for clarity, domain handles the precise range
        if (Number.isInteger(i)) {
            ticks.push(i);
        }
    }
    // Ensure 0 is included if the range crosses it
    if (startTick < 0 && endTick > 0 && !ticks.includes(0)) {
        ticks.push(0);
        ticks.sort((a, b) => a - b);
    }

    // Ensure min/max actual values are implicitly covered by the domain,
    // ticks are just labels. If only one tick is generated, add padding manually.
    if (ticks.length <= 1 && isFinite(dataMin) && isFinite(dataMax)) {
        const mid = ticks.length === 1 ? ticks[0] : (dataMin + dataMax) / 2;
        // Return a few ticks around the data range if only one integer tick was found
        return [mid - Y_AXIS_PADDING, mid, mid + Y_AXIS_PADDING].filter((v, i, a) => a.indexOf(v) === i).sort((a,b)=> a-b);
    }


    // Return ticks only if calculation is meaningful
    return ticks.length > 0 ? ticks : undefined; // Fallback if calculation fails

  }, [dataMin, dataMax]);


  // Calculate Y-Axis Domain with Padding
  const yDomain = useMemo(() => {
      if (dataMin !== undefined && dataMax !== undefined && isFinite(dataMin) && isFinite(dataMax)) {
          // Handle case where min and max are the same
          if (dataMin === dataMax) {
              return [dataMin - Y_AXIS_PADDING, dataMax + Y_AXIS_PADDING];
          }
          // Add padding to min and max
          return [dataMin - Y_AXIS_PADDING, dataMax + Y_AXIS_PADDING];
      }
      // Fallback to auto if min/max are not valid numbers
      return ['auto', 'auto'];
  }, [dataMin, dataMax]);

  // Conditional returns *after* all hooks have been called
  if (loading) {
    return (
        <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
            Loading Chart Data...
            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--main-accent)]"></div>
        </div>
    );
  }

  if (error || data.length < 2) {
    return (
        <div className="h-full w-full flex items-center justify-center text-sm text-destructive">
            {error || "Not enough data available"}
        </div>
    );
  }

  // Format tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length && label) {
          // Format the timestamp (assuming label is a unix timestamp in milliseconds)
          const formattedTime = new Date(label).toLocaleString([], {
            // year: 'numeric', // Optional: Add year if needed
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true // Use AM/PM
          });

          return (
              <div className="bg-background/80 backdrop-blur-sm border border-border p-2 rounded-md shadow-lg text-xs">
                  <p className="label text-muted-foreground mb-1">{formattedTime}</p>
                  {payload.map((entry: any) => (
                      <p key={entry.name} style={{ color: entry.color }}>
                          {`${entry.name}: ${entry.value}%`}
                      </p>
                  ))}
              </div>
          );
      }
      return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: -5,
          bottom: 5,
        }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))" 
        />
        <XAxis dataKey="time" hide />
        <YAxis
            orientation="right"
            axisLine={false}
            tickLine={false}
            fontSize={10}
            stroke="hsl(var(--muted-foreground))"
            domain={yDomain}
            ticks={yAxisTicks}
            interval={0}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
            width={30}
         />
         <Tooltip content={<CustomTooltip />} />
        {activeCategories.map((category) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={categoryColors[category] || defaultColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            name={category}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
} 