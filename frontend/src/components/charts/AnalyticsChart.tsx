
import { Tooltip, Spinner } from '@/components/ui/button';
// Type definitions
export type ChartType = 'line' | 'bar' | 'pie' | 'area';

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartSeriesConfig {
  dataKey: string;
  name: string;
  color?: string;
  unit?: string;
}

interface AnalyticsChartProps {
  type: ChartType;
  data: ChartDataPoint[];
  series: ChartSeriesConfig[];
  xAxisDataKey: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
  emptyMessage?: string;
  title?: string;
  colors?: string[];
  currencySymbol?: string;
}

// Default colors
const DEFAULT_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  type,
  data,
  series,
  xAxisDataKey,
  height = 300,
  loading = false,
  error = false,
  emptyMessage = 'No data available',
  title,
  colors = DEFAULT_COLORS,
  currencySymbol = '₦'
}) => {
  // Handle loading state
  if (loading) {
    return (
      <div
        className=""
      >
        <Spinner size={40} />
        <div className=""  color="text.secondary">
          Loading chart data...
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div
        className=""
      >
        <div  color="error" className="">
          Error loading chart data
        </div>
      </div>
    );
  }

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div
        className=""
      >
        <div  color="text.secondary" className="">
          {emptyMessage}
        </div>
      </div>
    );
  }

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      color: string;
      dataKey: string;
      payload: Record<string, unknown>;
    }>;
    label?: string;
  }

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div
          className=""
        >
          <div  color="text.secondary">
            {label}
          </div>
          {payload.map((entry) => (
            <div
              key={`item-${entry.dataKey}`}
              className=""
            >
              <div
                className=""
              />
              <div >
                {entry.name}:{' '}
                {entry.dataKey.includes('cost') ||
                entry.name.toLowerCase().includes('cost')
                  ? `${currencySymbol}${entry.value.toLocaleString()}`
                  : entry.value}
                {((entry.payload as Record<string, unknown>)?.unit as string) ||
                  ''}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render different chart types
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {series.map((s, index) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color || colors[index % colors.length]}
                
                unit={s.unit || ''}
              />
            ))}
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {series.map((s, index) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color || colors[index % colors.length]}
                unit={s.unit || ''}
              />
            ))}
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {series.map((s) => (
              <Pie
                key={s.dataKey}
                data={data}
                dataKey={s.dataKey}
                nameKey={xAxisDataKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props) => {}
                  const { name } = props;
                  return name;>
                {data.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={colors[idx % colors.length]}
                  />
                ))}
              </Pie>
            ))}
          </PieChart>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="">
      {title && (
        <div  component="h3" gutterBottom className="">
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={title ? height - 40 : height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
