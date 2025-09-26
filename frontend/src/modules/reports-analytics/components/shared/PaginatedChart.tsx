// Paginated Chart Component with Progressive Loading
import ChartComponent from './ChartComponent';

import { Button, Tooltip, Progress, Skeleton } from '@/components/ui/button';

interface PaginatedChartProps {
  data: any[];
  chartConfig: ChartConfig;
  pageSize?: number;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  onPageChange?: (page: number, pageData: any[]) => void;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  height?: number;
  showControls?: boolean;
  showProgress?: boolean;
  progressiveLoading?: boolean;
  className?: string;
}
const PaginatedChart: React.FC<PaginatedChartProps> = ({ 
  data,
  chartConfig,
  pageSize = 50,
  title,
  subtitle,
  loading = false,
  error,
  onPageChange,
  onRefresh,
  onFullscreen,
  height = 400,
  showControls = true,
  showProgress = true,
  progressiveLoading = true,
  className
}) => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set([0]));
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  // Calculate pagination info
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);
  // Get current page data
  const currentPageData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);
  // Progressive loading simulation
  const loadPage = useCallback(
    async (pageIndex: number) => {
      if (loadedPages.has(pageIndex) || !progressiveLoading) {
        return;
      }
      setIsLoadingPage(true);
      // Simulate loading delay for progressive loading
      await new Promise((resolve) => setTimeout(resolve, 300));
      setLoadedPages((prev) => new Set([...prev, pageIndex]));
      setIsLoadingPage(false);
    },
    [loadedPages, progressiveLoading]
  );
  // Handle page navigation
  const handlePageChange = useCallback(
    async (newPage: number) => {
      if (newPage < 0 || newPage >= totalPages || newPage === currentPage) {
        return;
      }
      setCurrentPage(newPage);
      // Load page if using progressive loading
      if (progressiveLoading) {
        await loadPage(newPage);
      }
      // Notify parent component
      const newPageData = data.slice(
        newPage * pageSize,
        (newPage + 1) * pageSize
      );
      onPageChange?.(newPage, newPageData);
    },
    [
      currentPage,
      totalPages,
      data,
      pageSize,
      onPageChange,
      loadPage,
      progressiveLoading,
    ]
  );
  // Navigation handlers
  const goToFirstPage = useCallback(
    () => handlePageChange(0),
    [handlePageChange]
  );
  const goToPreviousPage = useCallback(
    () => handlePageChange(currentPage - 1),
    [handlePageChange, currentPage]
  );
  const goToNextPage = useCallback(
    () => handlePageChange(currentPage + 1),
    [handlePageChange, currentPage]
  );
  const goToLastPage = useCallback(
    () => handlePageChange(totalPages - 1),
    [handlePageChange, totalPages]
  );
  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 3));
  }, []);
  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.5));
  }, []);
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);
  // Preload adjacent pages
  useEffect(() => {
    if (progressiveLoading) {
      const preloadPages = [currentPage - 1, currentPage + 1].filter(
        (page) => page >= 0 && page < totalPages && !loadedPages.has(page)
      );
      preloadPages.forEach((page) => {
        setTimeout(() => loadPage(page), 100);
      });
    }
  }, [currentPage, totalPages, loadedPages, loadPage, progressiveLoading]);
  // Create chart data for current page
  const chartData: ChartData = useMemo(
    () => ({ 
      type: chartConfig.type || 'line',
      data: currentPageData,
      config: {
        ...chartConfig,
        animations: {
          ...chartConfig.animations,
          duration: isLoadingPage ? 0 : chartConfig.animations?.duration || 300}
        },
      }, },
    [currentPageData, chartConfig, isLoadingPage]
  );
  // Loading state
  if (loading) {
    return (
      <div className={className} className="">
        <div className="">
          <Skeleton  width="40%" height={32} />
          <Skeleton  width="60%" height={20} />
        </div>
        <Skeleton  width="100%" height={height - 120} />
        <div className="">
          <Skeleton  width={200} height={36} />
        </div>
      </div>
    );
  }
  // Error state
  if (error) {
    return (
      <div
        className={className}
        className=""
      >
        <div  color="error" gutterBottom>
          Failed to Load Chart Data
        </div>
        <div  color="text.secondary" className="">
          {error}
        </div>
        {onRefresh && (
          <Button
            
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }
  return (
    <div
      className={className}
      className="">
      {/* Header */}
      <div
        className="">
        <div
          className=""
        >
          <div>
            {title && (
              <div  gutterBottom>
                {title}
              </div>
            )}
            {subtitle && (
              <div  color="text.secondary">
                {subtitle}
              </div>
            )}
          </div>
          {showControls && (
            <div className="">
              {/* Data info */}
              <Chip
                label={`${startIndex + 1}-${endIndex} of ${data.length}`}
                size="small"
                
                color="primary"
              />
              {/* Zoom controls */}
              <ButtonGroup size="small" >
                <Tooltip title="Zoom Out">
                  <IconButton
                    size="small"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button size="small" onClick={resetZoom} className="">
                  {Math.round(zoomLevel * 100)}%
                </Button>
                <Tooltip title="Zoom In">
                  <IconButton
                    size="small"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ButtonGroup>
              {/* Action buttons */}
              {onRefresh && (
                <Tooltip title="Refresh Data">
                  <IconButton size="small" onClick={onRefresh}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onFullscreen && (
                <Tooltip title="Fullscreen">
                  <IconButton size="small" onClick={onFullscreen}>
                    <FullscreenIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        {/* Progress indicator */}
        {showProgress &&
          (isLoadingPage ||
            (progressiveLoading && !loadedPages.has(currentPage))) && (
            <div className="">
              <Progress
                className="" ${theme.palette.secondary.main})`,
                  },
              />
            </div>
          )}
      </div>
      {/* Chart */}
      <div
        className="">
        {progressiveLoading && !loadedPages.has(currentPage) ? (
          <div
            className=""
          >
            <Skeleton
              
              width="80%"
              height="60%"
              className=""
            />
            <div  color="text.secondary">
              Loading page {currentPage + 1}...
            </div>
          </div>
        ) : (
          <div>
            <div className="">
              <ChartComponent
                data={chartData}
                height={height - 120}
                loading={isLoadingPage}
              />
            </div>
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          className="">
          <div className="">
            <Tooltip title="First Page">
              <span>
                <IconButton
                  size="small"
                  onClick={goToFirstPage}
                  disabled={currentPage === 0}
                >
                  <FirstPageIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Previous Page">
              <span>
                <IconButton
                  size="small"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </span>
            </Tooltip>
            <div className="">
              <div  color="text.secondary">
                Page
              </div>
              <Chip
                label={`${currentPage + 1} of ${totalPages}`}
                size="small"
                color="primary"
                
              />
            </div>
            <Tooltip title="Next Page">
              <span>
                <IconButton
                  size="small"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Last Page">
              <span>
                <IconButton
                  size="small"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages - 1}
                >
                  <LastPageIcon />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};
export default PaginatedChart;
