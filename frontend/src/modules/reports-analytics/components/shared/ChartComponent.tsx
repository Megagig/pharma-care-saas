// Reusable Chart Component with Beautiful Styling

// Removed MUI styles import - using Tailwind CSS
import ChartErrorBoundary from './ChartErrorBoundary';

import { Card, CardContent, Tooltip, Spinner, Alert, Skeleton } from '@/components/ui/button';

interface ChartComponentProps {
  data: ChartData;
  height?: number;
  loading?: boolean;
  error?: string;
  onDataPointClick?: (data: DataPoint) => void;
  onHover?: (data: DataPoint | null) => void;
  className?: string;
}
const ChartComponent: React.FC<ChartComponentProps> = ({ 
  data,
  height = 400,
  loading = false,
  error,
  onDataPointClick,
  onHover,
  className
}) => {
  const muiTheme = useTheme();
  const chartTheme = useCurrentTheme();
  const animationsEnabled = useAnimationsEnabled();
  // Memoize chart configuration
  const chartConfig = useMemo(() => data.config, [data.config]);
  // Enhanced custom tooltip component with rich formatting
  const CustomTooltip = useCallback(
    ({ active, payload, label }: any) => {
      if (!active || !payload || !payload.length) return null;
      return (
        <div
          className="">
          {label && (
            <div
              
              color="text.primary"
              gutterBottom
              className="">
              {label}
            </div>
          )}
          {payload.map((entry: any, index: number) => {
            const [formattedValue, name] = formatTooltipValue(
              entry.value,
              entry.dataKey,
              entry.payload
            );
            return (
              <div
                key={`tooltip-${index}`}
                className=""
              >
                <div className="">
                  <div
                    className=""20`,
                  />
                  <div  color="text.secondary">
                    {name}
                  </div>
                </div>
                <div
                  
                  className=""
                >
                  {formattedValue}
                </div>
              </div>
            );
          })}
          {/* Add trend indicator if available */}
          {payload[0]?.payload?.trend && (
            <div
              className="">
              <div className="">
                {payload[0].payload.trend > 0 ? (
                  <TrendingUp
                    className=""
                  />
                ) : payload[0].payload.trend < 0 ? (
                  <TrendingDown
                    className=""
                  />
                ) : (
                  <TrendingFlat
                    className=""
                  />
                )}
                <div  color="text.secondary">
                  {Math.abs(payload[0].payload.trend)}% vs previous
                </div>
              </div>
            </div>
          )}
        </div>
      );
    },
    [chartTheme, muiTheme, animationsEnabled]
  );
  // Handle data point clicks
  const handleDataPointClick = useCallback(
    (data: any) => {
      if (onDataPointClick) {
        onDataPointClick(data);
      }
    },
    [onDataPointClick]
  );
  // Handle hover events with enhanced interactions
  const handleMouseEnter = useCallback(
    (data: any, event?: React.MouseEvent) => {
      if (onHover) {
        onHover(data);
      }
      // Add hover effects for interactive charts
      if (event?.currentTarget) {
        const element = event.currentTarget as SVGElement;
        element.style.filter = 'brightness(1.1)';
        element.style.transform = 'scale(1.02)';
        element.style.transition = 'all 0.2s ease-in-out';
      }
    },
    [onHover]
  );
  const handleMouseLeave = useCallback(
    (event?: React.MouseEvent) => {
      if (onHover) {
        onHover(null);
      }
      // Remove hover effects
      if (event?.currentTarget) {
        const element = event.currentTarget as SVGElement;
        element.style.filter = 'none';
        element.style.transform = 'scale(1)';
      }
    },
    [onHover]
  );
  // Enhanced click handler with drill-down support
  const handleEnhancedClick = useCallback(
    (data: any, event?: React.MouseEvent) => {
      handleDataPointClick(data);
      // Add click animation
      if (event?.currentTarget) {
        const element = event.currentTarget as SVGElement;
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 150);
      }
    },
    [handleDataPointClick]
  );
  // Render KPI Card
  const renderKPICard = () => {
    const kpiData = data.data[0] as any as KPICardData;
    if (!kpiData) return null;
    const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
      switch (direction) {
        case 'up':
          return <TrendingUp className="" />;
        case 'down':
          return <TrendingDown className="" />;
        default:
          return (
            <TrendingFlat className="" />
          );
      }
    };
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'success':
          return 'success';
        case 'warning':
          return 'warning';
        case 'error':
          return 'error';
        default:
          return 'info';
      }
    };
    return (
      <Card
        className="">
        <CardContent
          className=""
        >
          <div
            className=""
          >
            <div
              
              color="text.secondary"
              className=""
            >
              {kpiData.title}
            </div>
            <Chip
              label={kpiData.status}
              color={getStatusColor(kpiData.status) as any}
              size="small"
              
            />
          </div>
          <div
            className=""
          >
            <div
              
              className=""
            >
              {typeof kpiData.value === 'number'
                ? kpiData.value.toLocaleString()
                : kpiData.value}
              {kpiData.unit && (
                <div
                  component="span"
                  
                  color="text.secondary"
                  className=""
                >
                  {kpiData.unit}
                </div>
              )}
            </div>
            {kpiData.trend && (
              <div className="">
                {getTrendIcon(kpiData.trend.direction)}
                <div
                  
                  className=""
                >
                  {kpiData.trend.value}% {kpiData.trend.period}
                </div>
              </div>
            )}
            {kpiData.target && (
              <div className="">
                <Target className="" />
                <div  color="text.secondary">
                  Target: {kpiData.target.value} {kpiData.target.label}
                </div>
              </div>
            )}
          </div>
          {kpiData.sparkline && kpiData.sparkline.length > 0 && (
            <div className="">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiData.sparkline}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartTheme.colorPalette[0]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={animationsEnabled}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  // Render Progress Ring
  const renderProgressRing = () => {
    const progressData = data.data[0] as any as ProgressRingData;
    if (!progressData) return null;
    const percentage = (progressData.value / progressData.max) * 100;
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDasharray = `${
      (percentage / 100) * circumference
    } ${circumference}`;
    return (
      <Card className="">
        <CardContent
          className=""
        >
          <div
            
            color="text.secondary"
            className=""
          >
            {progressData.title}
          </div>
          <div className="">
            <svg
              width="120"
              height="120"
              >
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                stroke={muiTheme.palette.divider}
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                stroke={chartTheme.colorPalette[0]}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                
              />
            </svg>
            <div
              className=""
            >
              <div
                
                className=""
              >
                {progressData.centerText?.primary ||
                  `${Math.round(percentage)}%`}
              </div>
              {progressData.centerText?.secondary && (
                <div  color="text.secondary">
                  {progressData.centerText.secondary}
                </div>
              )}
            </div>
          </div>
          <div  className="">
            {progressData.value.toLocaleString()} /{' '}
            {progressData.max.toLocaleString()}
            {progressData.unit && ` ${progressData.unit}`}
          </div>
          {progressData.segments && (
            <div className="">
              {progressData.segments.map((segment, index) => (
                <div
                  key={index}
                  className=""
                >
                  <div
                    className=""
                  />
                  <div  className="">
                    {segment.label}
                  </div>
                  <div  color="text.secondary">
                    {segment.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  // Render Gauge Chart
  const renderGaugeChart = () => {
    const gaugeData = data.data[0] as unknown as GaugeData;
    if (!gaugeData) return null;
    const percentage =
      ((gaugeData.value - gaugeData.min) / (gaugeData.max - gaugeData.min)) *
      100;
    const angle = (percentage / 100) * 180; // Half circle
    return (
      <Card className="">
        <CardContent
          className=""
        >
          <div
            
            color="text.secondary"
            className=""
          >
            {gaugeData.title}
          </div>
          <div className="">
            <svg width="200" height="120" viewBox="0 0 200 120">
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                stroke={muiTheme.palette.divider}
                strokeWidth="12"
                fill="transparent"
                strokeLinecap="round"
              />
              {/* Range segments */}
              {gaugeData.ranges.map((range, index) => {
                const startAngle =
                  ((range.min - gaugeData.min) /
                    (gaugeData.max - gaugeData.min)) *
                  180;
                const endAngle =
                  ((range.max - gaugeData.min) /
                    (gaugeData.max - gaugeData.min)) *
                  180;
                const startX =
                  100 + 80 * Math.cos((Math.PI * (180 - startAngle)) / 180);
                const startY =
                  100 - 80 * Math.sin((Math.PI * (180 - startAngle)) / 180);
                const endX =
                  100 + 80 * Math.cos((Math.PI * (180 - endAngle)) / 180);
                const endY =
                  100 - 80 * Math.sin((Math.PI * (180 - endAngle)) / 180);
                return (
                  <path
                    key={index}
                    d={`M ${startX} ${startY} A 80 80 0 0 1 ${endX} ${endY}`}
                    stroke={range.color}
                    strokeWidth="12"
                    fill="transparent"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Needle */}
              <g transform={`rotate(${angle - 90} 100 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="30"
                  stroke={muiTheme.palette.text.primary}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="6"
                  fill={muiTheme.palette.text.primary}
                />
              </g>
            </svg>
            <div
              className=""
            >
              <div
                
                className=""
              >
                {gaugeData.value.toLocaleString()}
              </div>
              {gaugeData.unit && (
                <div  color="text.secondary">
                  {gaugeData.unit}
                </div>
              )}
            </div>
          </div>
          <div
            className=""
          >
            <div  color="text.secondary">
              {gaugeData.min}
            </div>
            <div  color="text.secondary">
              {gaugeData.max}
            </div>
          </div>
          {gaugeData.target && (
            <div className="">
              <div  color="text.secondary">
                Target: {gaugeData.target}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: data.data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };
    const animationProps = animationsEnabled
      ? {
          animationBegin: 0,
          animationDuration: chartConfig.animations?.duration || 300,
          animationEasing: chartConfig.animations?.easing || 'ease-in-out',
        }
      : { isAnimationActive: false };
    switch (data.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={muiTheme.palette.divider}
              opacity={0.5}
            />
            <XAxis
              dataKey={chartConfig.axes?.x?.label || 'name'}
              stroke={muiTheme.palette.text.secondary}
              fontSize={chartTheme.typography.fontSize.small}
            />
            <YAxis
              stroke={muiTheme.palette.text.secondary}
              fontSize={chartTheme.typography.fontSize.small}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.legend?.enabled && <Legend />}
            {chartConfig.series.map((series, index) => (
              <Line
                key={series.dataKey}
                type="monotone"
                dataKey={series.dataKey}
                name={series.name}
                stroke={
                  series.style.color ||
                  chartTheme.colorPalette[
                    index % chartTheme.colorPalette.length
                  ]}
                }
                strokeWidth={series.style.strokeWidth || 2}
                
                
                onClick={handleEnhancedClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...animationProps}
              />
            ))}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={muiTheme.palette.divider}
              opacity={0.5}
            />
            <XAxis
              dataKey={chartConfig.axes?.x?.label || 'name'}
              stroke={muiTheme.palette.text.secondary}
              fontSize={chartTheme.typography.fontSize.small}
            />
            <YAxis
              stroke={muiTheme.palette.text.secondary}
              fontSize={chartTheme.typography.fontSize.small}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.legend?.enabled && <Legend />}
            {chartConfig.series.map((series, index) => (
              <Area
                key={series.dataKey}
                type="monotone"
                dataKey={series.dataKey}
                name={series.name}
                stroke={
                  series.style.color ||
                  chartTheme.colorPalette[
                    index % chartTheme.colorPalette.length
                  ]}
                }
                fill={
                  series.style.color ||
                  chartTheme.colorPalette[
                    index % chartTheme.colorPalette.length
                  ]}
                }
                fillOpacity={series.style.fillOpacity || 0.3}
                strokeWidth={series.style.strokeWidth || 2}
                
                
                onClick={handleEnhancedClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...animationProps}
              />
            ))}
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={muiTheme.palette.divider}
              opacity={0.5}
            />
            <XAxis
              dataKey={chartConfig.axes?.x?.label || 'name'}
              stroke={muiTheme.palette.text.secondary}
              fontSize={chartTheme.typography.fontSize.small}
            />
            <YAxis
              stroke={muiTheme.palette.text.secondary}
              fontSize={chartTheme.typography.fontSize.small}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.legend?.enabled && <Legend />}
            {chartConfig.series.map((series, index) => (
              <Bar
                key={series.dataKey}
                dataKey={series.dataKey}
                name={series.name}
                fill={
                  series.style.color ||
                  chartTheme.colorPalette[
                    index % chartTheme.colorPalette.length
                  ]}
                }
                radius={[4, 4, 0, 0]}
                onClick={handleEnhancedClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...animationProps}
              />
            ))}
          </BarChart>
        );
      case 'pie':
      case 'donut':
        return (
          <PieChart {...commonProps}>
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.legend?.enabled && <Legend />}
            <Pie
              data={data.data}
              dataKey={chartConfig.series[0]?.dataKey || 'value'}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height * 0.3, 120)}
              innerRadius={
                data.type === 'donut' ? Math.min(height * 0.15, 60) : 0}
              }
              paddingAngle={2}
              onClick={handleEnhancedClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              {...animationProps}
            >
              {data.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    chartTheme.colorPalette[
                      index % chartTheme.colorPalette.length
                    ]}
                  }
                />
              ))}
            </Pie>
          </PieChart>
        );
      case 'scatter':
      case 'bubble':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={muiTheme.palette.divider}
              opacity={0.5}
            />
            <XAxis
              dataKey={chartConfig.axes?.x?.label || 'x'}
              type="number"
              stroke={muiTheme.palette.text.secondary}
              fontSize={chartTheme.typography.fontSize.small}
            />
            <YAxis
              dataKey={chartConfig.axes?.y?.label || 'y'}
              type="number"
              stroke={muiTheme.palette.text.secondary}
              fontSize={chartTheme.typography.fontSize.small}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartConfig.legend?.enabled && <Legend />}
            {chartConfig.series.map((series, index) => (
              <Scatter
                key={series.dataKey}
                name={series.name}
                data={data.data}
                fill={
                  series.style.color ||
                  chartTheme.colorPalette[
                    index % chartTheme.colorPalette.length
                  ]}
                }
                onClick={handleEnhancedClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...animationProps}
              />
            ))}
          </ScatterChart>
        );
      case 'gauge':
        return renderGaugeChart();
      case 'progress-ring':
        return renderProgressRing();
      case 'kpi-card':
        return renderKPICard();
      case 'treemap':
        return (
          <Treemap
            {...commonProps}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke={muiTheme.palette.divider}
            fill={chartTheme.colorPalette[0]}
            onClick={handleEnhancedClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...animationProps}
          >
            {data.data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  chartTheme.colorPalette[
                    index % chartTheme.colorPalette.length
                  ]}
                }
              />
            ))}
          </Treemap>
        );
      default:
        return (
          <div
            className=""
          >
            <div color="text.secondary">
              Chart type "{data.type}" not yet implemented
            </div>
          </div>
        );
    }
  };
  // Enhanced loading state with beautiful skeleton screens
  if (loading) {
    return (
      <div
        className=""
        className={className}
      >
        {/* Title skeleton */}
        <div className="">
          <Skeleton
            
            width="60%"
            height={28}
            animation="wave"
            className=""
          />
          <Skeleton
            
            width="40%"
            height={20}
            animation="wave"
            className=""
          />
        </div>
        {/* Chart skeleton based on type */}
        <div className="">
          {data.type === 'pie' || data.type === 'donut' ? (
            // Circular chart skeleton
            <div
              className=""
            >
              <Skeleton
                
                width={Math.min(height * 0.6, 200)}
                height={Math.min(height * 0.6, 200)}
                animation="wave"
              />
            </div>
          ) : data.type === 'kpi-card' ? (
            // KPI card skeleton
            <div className="">
              <Skeleton
                
                width="100%"
                height={60}
                animation="wave"
                className=""
              />
              <Skeleton
                
                width="80%"
                height={40}
                animation="wave"
                className=""
              />
              <Skeleton
                
                width="60%"
                height={24}
                animation="wave"
                className=""
              />
            </div>
          ) : data.type === 'progress-ring' || data.type === 'gauge' ? (
            // Gauge/progress skeleton
            <div
              className=""
            >
              <Skeleton
                
                width={120}
                height={120}
                animation="wave"
                className=""
              />
              <Skeleton
                
                width="40%"
                height={24}
                animation="wave"
                className=""
              />
            </div>
          ) : (
            // Bar/line chart skeleton
            <div
              className=""
            >
              {/* Chart area skeleton */}
              <div
                className=""
              >
                {[...Array(8)].map((_, index) => (
                  <Skeleton
                    key={index}
                    
                    width="100%"
                    height={`${Math.random() * 60 + 20}%`}
                    animation="wave"
                    className=""s`,
                  />
                ))}
              </div>
              {/* X-axis labels skeleton */}
              <div
                className=""
              >
                {[...Array(4)].map((_, index) => (
                  <Skeleton
                    key={index}
                    
                    width={40}
                    height={16}
                    animation="wave"
                    className=""
                  />
                ))}
              </div>
            </div>
          )}
          {/* Loading overlay with progress */}
          <div
            className="">
            <Spinner
              size={32}
              className=""
            />
            <div
              
              color="text.secondary"
              className=""
            >
              Loading chart...
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Enhanced error state with graceful fallbacks and retry mechanisms
  if (error) {
    const handleRetry = () => {
      // Trigger a retry by calling the parent component's refresh function
      window.location.reload(); // Fallback - in real implementation, this would be a prop
    };
    return (
      <div
        className=""08, ${muiTheme.palette.error.main}05)`,
          border: `1px solid ${muiTheme.palette.error.light}30`,
        className={className}
      >
        <Alert
          severity="error"
          className="" action={
            <div className="">
              <div
                component="button"
                }
                onClick={handleRetry}
                className="">
                Retry
              </div>
            </div>
          }
        >
          <div
            
            gutterBottom
            className=""
          >
            Unable to Load Chart
          </div>
          <div  color="text.secondary" className="">
            {error}
          </div>
          {/* Error details for debugging */}
          <div
            className="">
            <div  color="text.secondary">
              <strong>Chart Type:</strong> {data.type}
              <br />
              <strong>Data Points:</strong> {data.data?.length || 0}
              <br />
              <strong>Timestamp:</strong> {new Date().toLocaleTimeString()}
            </div>
          </div>
          {/* Accessibility message */}
          <div
            
            color="text.secondary"
            className=""
            role="status"
            aria-live="polite"
          >
            Chart data could not be displayed. Please try refreshing or contact
            support if the issue persists.
          </div>
        </Alert>
      </div>
    );
  }
  // Enhanced empty data state
  if (!data.data || data.data.length === 0) {
    return (
      <div
        className=""08, ${chartTheme.colorPalette[1]}05)`,
          border: `1px dashed ${muiTheme.palette.divider}`,
        className={className}
      >
        {/* Empty state illustration */}
        <div
          className="">
          <div
            className="">
            <div
              className=""
            >
              📊
            </div>
          </div>
        </div>
        <div
          
          color="text.primary"
          gutterBottom
          className=""
        >
          No Data Available
        </div>
        <div
          
          color="text.secondary"
          className=""
        >
          There is no data to display for this chart. Try adjusting your filters
          or check back later when data becomes available.
        </div>
        {/* Helpful suggestions */}
        <div className="">
          <div  color="text.secondary">
            <strong>Suggestions:</strong>
          </div>
          <div className="">
            <div
              
              color="text.secondary"
              display="block"
            >
              • Check your date range and filters
            </div>
            <div
              
              color="text.secondary"
              display="block"
            >
              • Ensure data sources are connected
            </div>
            <div
              
              color="text.secondary"
              display="block"
            >
              • Contact support if this persists
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Main chart render with error boundary
  return (
    <ChartErrorBoundary
      >
      <div
        className=""
        className={className}
        {...generateAccessibilityAttributes(data.title, data.type, data.data)}
      >
        {/* Chart Title */}
        {data.title && (
          <div className="">
            <div
              
              component="h3"
              className=""
            >
              {data.title}
            </div>
            {data.subtitle && (
              <div
                
                color="text.secondary"
                className=""
              >
                {data.subtitle}
              </div>
            )}
          </div>
        )}
        {/* Chart Container */}
        <div
          className=""
          role="img"
          aria-label={`${data.title} - ${data.type} chart with ${data.data.length} data points`}
          tabIndex={0}
          onKeyDown={(e) => {
            // Add keyboard navigation support
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // Focus on first interactive element or provide data summary
              console.log('Chart data summary:', data.data);}
            }>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
          {/* Screen reader data summary */}
          <div
            className=""
            aria-live="polite"
            role="status"
          >
            Chart showing {data.data.length} data points.
            {data.data.length > 0 && (
              <>
                First value:{' '}
                {data.data[0][chartConfig.series[0]?.dataKey || 'value']}. Last
                value:{' '}
                {
                  data.data[data.data.length - 1][
                    chartConfig.series[0]?.dataKey || 'value'
                  ]
                }
                .
              </>
            )}
          </div>
        </div>
      </div>
    </ChartErrorBoundary>
  );
};
export default ChartComponent;
