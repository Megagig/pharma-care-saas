import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface DashboardChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'pie' | 'line';
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const DashboardChart: React.FC<DashboardChartProps> = ({
  title,
  data,
  type,
  height = 350,
  colors = DEFAULT_COLORS,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Theme-aware colors
  const textColor = isDark ? '#f1f5f9' : '#374151';
  const gridColor = isDark ? '#334155' : '#e5e7eb';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#d1d5db';

  // Debug logging
  console.log(`Rendering ${type} chart "${title}" with data:`, data);
  console.log(`Data length: ${data?.length}, Type: ${type}`);

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height} minWidth={0}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: textColor }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: textColor }}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '4px',
                  color: textColor,
                }}
              />
              <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height} minWidth={0}>
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={Math.min(height * 0.25, 120)}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '4px',
                  color: textColor,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height} minWidth={0}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: textColor }}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: textColor }}
                axisLine={{ stroke: gridColor }}
                tickLine={{ stroke: gridColor }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '4px',
                  color: textColor,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={3}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card sx={{ height: '100%', width: '100%' }} className="dashboard-card">
      <CardContent
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        className="dashboard-card-content"
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& .recharts-wrapper': {
              width: '100% !important',
              height: '100% !important',
            },
            '& .recharts-responsive-container': {
              width: '100% !important',
              minWidth: '0 !important',
            },
          }}
          className="dashboard-chart-container"
        >
          {data && data.length > 0 ? (
            renderChart()
          ) : (
            <Typography variant="body2" color="text.secondary">
              No data available
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardChart;
