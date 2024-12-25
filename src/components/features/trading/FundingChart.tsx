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

  const formattedData = data.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    rate: item.rate,
    positiveRate: item.rate > 0 ? item.rate : 0,
    negativeRate: item.rate < 0 ? item.rate : 0,
  }));

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
          
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}%`, 'Rate']}
            labelFormatter={(label) => `Time: ${label}`}
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