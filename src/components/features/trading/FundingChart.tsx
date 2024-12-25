import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { useFundingHistory } from '../../../hooks/use-funding-history';

interface FundingChartProps {
  pair: string;
  isActive?: boolean;
}

interface ChartDataPoint {
  timestamp: Date;
  rate: number;
}

export function FundingChart({ pair, isActive = false }: FundingChartProps) {
  const { data, loading, error } = useFundingHistory(pair, isActive);

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

  const formattedData: ChartDataPoint[] = data.map(item => ({
    timestamp: new Date(item.timestamp),
    rate: item.rate,
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
          
          <XAxis 
            dataKey="timestamp"
            tickFormatter={(timestamp: Date) => {
              return timestamp.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
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
            formatter={(value: number) => {
              const color = value >= 0 ? 'rgb(61, 245, 123)' : 'rgb(234, 67, 92)';
              return [<span style={{ color }}>{`${value}%`}</span>, 'Rate'];
            }}
            labelFormatter={(timestamp: Date) => timestamp.toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
          
          {/* Positive values */}
          <Area 
            type="monotone"
            dataKey={(item: ChartDataPoint) => item.rate >= 0 ? item.rate : undefined}
            stroke="rgb(61, 245, 123)"
            fill="url(#positiveGradient)"
            fillOpacity={1}
            strokeWidth={1}
          />
          
          {/* Negative values */}
          <Area 
            type="monotone"
            dataKey={(item: ChartDataPoint) => item.rate < 0 ? item.rate : undefined}
            stroke="rgb(234, 67, 92)"
            fill="url(#negativeGradient)"
            fillOpacity={1}
            strokeWidth={1}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
} 