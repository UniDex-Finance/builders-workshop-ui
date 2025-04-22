import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts'; // Import necessary components
import { cn } from '../../../lib/utils';

interface IndexHeatmapProps {
  indexPerformance: { [category: string]: number }; // e.g., { "DeFi": 2.5, "Memes": -1.1, ... }
  categoryScaleFactors: { [key: string]: number }; // Add prop for scale factors
}

// Helper function to determine color based on performance percentage
const getPerformanceColor = (percentage: number): string => {
  if (percentage > 2) return '#1a6b4f';    // Strong positive (Tailwind green-700)
  if (percentage > 0.5) return '#15543e'; // Medium positive (Tailwind green-600)
  if (percentage > 0) return '#15302d';   // Slight positive (Tailwind green-500)
  if (percentage === 0) return '#6b7280';   // Neutral (Tailwind gray-500)
  if (percentage > -0.5) return '#7b233b'; // Slight negative (User defined)
  if (percentage > -2) return '#501b2f';   // Medium negative (User defined)
  return '#341727';                        // Strong negative (User defined)
};

// Custom content renderer for Treemap nodes
const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, payload, rank } = props;
  const name = props.name; // Assuming name is directly on props
  const performance = props.performance; // Assuming performance is directly on props

  // Check if performance is a valid number
  const isValidPerformance = typeof performance === 'number' && !isNaN(performance);

  // Determine color with fallback
  const fillColor = isValidPerformance ? getPerformanceColor(performance) : '#6b7280'; // Default to gray

  // Determine text color - Use white for better contrast on all defined backgrounds
  const textColor = 'text-white';

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill: fillColor }} // Apply fill color via inline style
        className="stroke-background stroke-2 transition-all duration-150" // Keep other classes
      />
      {/* Only render text if the box is large enough */}
      {width > 70 && height > 30 && (
        <foreignObject x={x + 4} y={y + 4} width={width - 8} height={height - 8} >
          <div className={`w-full h-full flex flex-col items-center justify-center p-1 overflow-hidden ${textColor}`}>
             <span className="text-[10px] font-medium text-center truncate max-w-full">{name || 'N/A'}</span>
             <span className="text-xs font-semibold mt-0.5">
                {isValidPerformance ? performance.toFixed(2) : '-'}%
             </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access nested payload for custom content props
    return (
      <div className="bg-popover text-popover-foreground border border-border p-2 rounded-md shadow-md text-xs">
        <p className="font-medium">{`${data.name}`}</p>
        <p>{`Performance: ${data.performance.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};


export const IndexHeatmap: React.FC<IndexHeatmapProps> = ({ indexPerformance, categoryScaleFactors }) => {
  // Transform data for Treemap: { name, size, performance }
  const treemapData = Object.entries(indexPerformance)
    .map(([category, performance]) => {
        const scale = categoryScaleFactors[category] || 5; // Get scale factor, default to 5 (like 'Other')
        return {
          name: category,
          size: scale, // Use the category scale factor for size
          performance: performance, // Keep performance for coloring
        };
    })
    .filter(item => item.size > 0); // Filter out items with zero or negative size if necessary

  if (treemapData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
        Calculating index performance...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
      <Treemap
        data={treemapData}
        dataKey="size" // Size of rectangle based on absolute performance
        aspectRatio={4 / 3} // Aspect ratio of rectangles
        stroke="#fff"
        // Pass performance data to custom content renderer via props
        content={<CustomizedContent />}
        isAnimationActive={false} // Disable default animation for custom content update
      >
         <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
}; 