import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { useFundingHistory } from '../../../hooks/use-funding-history';

interface FundingChartProps {
  pair: string;
}

export function FundingChart({ pair }: FundingChartProps) {
  const { data, loading, error } = useFundingHistory(pair);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading funding rate data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Failed to load funding data: {error.message}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No funding rate data available
      </div>
    );
  }

  const formattedData = data.map(item => {
    const date = new Date(item.timestamp);
    return {
      timestamp: date,
      displayTime: date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      rate: item.rate,
      positiveRate: item.rate > 0 ? item.rate : 0,
      negativeRate: item.rate < 0 ? item.rate : 0,
    };
  });

  return (
    <div className="w-full h-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formattedData}>
          <defs>
            <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgb(61, 245, 123)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="rgb(61, 245, 123)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="negativeGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor="rgb(234, 67, 92)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="rgb(234, 67, 92)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <XAxis 
            dataKey="timestamp"
            tickFormatter={(timestamp: Date) => {
              // Only show hour and minute for timestamps at the start of each hour
              if (timestamp.getMinutes() === 0) {
                const hour = timestamp.getHours();
                // For midnight, show the date
                if (hour === 0) {
                  return timestamp.toLocaleString(undefined, {
                    day: 'numeric',
                  });
                }
                // For noon and midnight, show '12 PM' and '12 AM'
                if (hour === 12) {
                  return '12 PM';
                }
                // For other hours, show in 12-hour format
                return `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`;
              }
              return '';
            }}
            tick={{ fontSize: 12 }}
            interval={0}
            angle={0}
            axisLine={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
            tickLine={{ stroke: 'var(--muted-foreground)' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={['auto', 'auto']}
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
            formatter={(value: number) => [`${value}%`, 'Rate']}
            labelFormatter={(timestamp: Date) => timestamp.toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
          
          {/* Positive area */}
          <Area 
            type="monotone"
            dataKey="positiveRate"
            stroke="rgb(61, 245, 123)"
            fillOpacity={1}
            fill="url(#positiveGradient)"
            strokeWidth={1}
          />
          
          {/* Negative area */}
          <Area 
            type="monotone"
            dataKey="negativeRate"
            stroke="rgb(234, 67, 92)"
            fillOpacity={1}
            fill="url(#negativeGradient)"
            strokeWidth={1}
          />
          
          {/* Main line */}
          <Line 
            type="monotone"
            dataKey="rate"
            stroke="var(--primary)"
            dot={false}
            strokeWidth={1}
            animationDuration={500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
} 