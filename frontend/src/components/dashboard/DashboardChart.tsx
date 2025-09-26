import { Card, CardContent, Tooltip, Skeleton } from '@/components/ui/button';

interface ChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}
interface DashboardChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'pie' | 'line' | 'area';
  height?: number;
  colors?: string[];
  loading?: boolean;
  subtitle?: string;
  showLegend?: boolean;
  interactive?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
}
const DashboardChart: React.FC<DashboardChartProps> = ({ 
  title,
  data,
  type,
  height = 350,
  colors,
  loading = false,
  subtitle,
  showLegend = false,
  interactive = true,
  onRefresh,
  onExport,
  onFullscreen
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hoveredData, setHoveredData] = useState<any>(null);
  // Default colors based on theme
  const defaultColors = colors || [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className=""
        >
          <div  className="">
            {label}
          </div>
          {payload.map((entry: unknown, index: number) => (
            <div key={index}  className="">
              {entry.name}: {entry.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  const renderChart = () => {
    if (loading) {
      return (
        <Skeleton  width="100%" height={height - 100} />
      );
    }
    if (!data || data.length === 0) {
      return (
        <div
          display="flex"
          alignItems="center"
          justifyContent="center"
          height={height - 100}
          flexDirection="column"
        >
          <div  color="text.secondary" align="center">
            No data available
          </div>
          {onRefresh && (
            <IconButton onClick={onRefresh} className="">
              <RefreshIcon />
            </IconButton>
          )}
        </div>
      );
    }
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height - 100}>
            <BarChart {...commonProps}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={alpha(theme.palette.text.secondary, 0.2)}
              />
              <XAxis
                dataKey="name"
                
                
                
              />
              <YAxis
                
                
                
              />
              <RechartsTooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Bar
                dataKey="value"
                fill={defaultColors[0]}
                radius={[4, 4, 0, 0]}
                onMouseEnter={(data) => setHoveredData(data)}
                onMouseLeave={() => setHoveredData(null)}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height - 100}>
            <LineChart {...commonProps}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={alpha(theme.palette.text.secondary, 0.2)}
              />
              <XAxis
                dataKey="name"
                
                
              />
              <YAxis
                
                
              />
              <RechartsTooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={defaultColors[0]}
                strokeWidth={3}
                
                
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height - 100}>
            <AreaChart {...commonProps}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={alpha(theme.palette.text.secondary, 0.2)}
              />
              <XAxis
                dataKey="name"
                
              />
              <YAxis
                
              />
              <RechartsTooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={defaultColors[0]}
                fill={alpha(defaultColors[0], 0.3)}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height - 100}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={Math.min((height - 100) * 0.3, 100)}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={(data) => setHoveredData(data)}
                onMouseLeave={() => setHoveredData(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.color || defaultColors[index % defaultColors.length]}
                    }
                  />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };
  return (
    <motion.div
      
      >
      <Card
        className="">
        <CardContent
          className=""
        >
          {/* Header */}
          <div
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <div>
              <div  className="">
                {title}
              </div>
              {subtitle && (
                <div  color="text.secondary">
                  {subtitle}
                </div>
              )}
            </div>
            {/* Actions */}
            {interactive && (
              <div
                className=""
              >
                <Tooltip title="More options">
                  <IconButton size="small" onClick={handleMenuClick}>
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              </div>
            )}
          </div>
          {/* Chart Container */}
          <div
            className=""
          >
            {renderChart()}
          </div>
          {/* Hovered Data Display */}
          {hoveredData && (
            <div
              className=""
            >
              <div >
                {hoveredData.name}: {hoveredData.value}
              </div>
            </div>
          )}
        </CardContent>
        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {onRefresh && (
            <MenuItem
              >
              <RefreshIcon className="" fontSize="small" />
              Refresh
            </MenuItem>
          )}
          {onExport && (
            <MenuItem
              >
              <DownloadIcon className="" fontSize="small" />
              Export
            </MenuItem>
          )}
          {onFullscreen && (
            <MenuItem
              >
              <FullscreenIcon className="" fontSize="small" />
              Fullscreen
            </MenuItem>
          )}
        </Menu>
      </Card>
    </motion.div>
  );
};
export default DashboardChart;
