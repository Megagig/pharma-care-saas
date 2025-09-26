// Report Chart Component - Real data visualization

import { Tooltip } from '@/components/ui/button';

interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: Array<{
    label: string;
    value: number;
    date?: string;
    category?: string;
  }>;
}
interface ReportChartProps {
  chart: ChartData;
  height?: number;
}
const ReportChart: React.FC<ReportChartProps> = ({ chart, height = 300 }) => {
  const theme = useTheme();
  // Color palette for charts
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
  ];
  // Transform data for different chart types
  const transformedData = chart.data.map((item, index) => ({ 
    name: item.label,
    value: item.value,
    date: item.date,
    category: item.category,
    fill: colors[index % colors.length]}
  }));
  const renderChart = () => {
    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis  />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,}
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                
                
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis  />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,}
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
              />
              <Legend />
              <Bar
                dataKey="value"
                fill={theme.palette.primary.main}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={transformedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {transformedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,}
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
              />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis  />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,}
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke={theme.palette.primary.main}
                fill={theme.palette.primary.light}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div
            className=""
          >
            <div  color="text.secondary">
              Unsupported chart type: {chart.type}
            </div>
          </div>
        );
    }
  };
  return (
    <div>
      <div  gutterBottom className="">
        {chart.title}
      </div>
      {chart.data.length === 0 ? (
        <div
          className="">
          <div  color="text.secondary">
            No data available for this chart
          </div>
        </div>
      ) : (
        renderChart()
      )}
    </div>
  );
};
export default ReportChart;
