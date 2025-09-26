import { Label, Card, CardContent, Dialog, DialogContent, Select, Tooltip, Progress, Alert, Skeleton, Switch } from '@/components/ui/button';
// Template Preview Component - Real-time template preview with live updates
// Removed MUI styles import - using Tailwind CSS
  templateRenderingEngine,

interface TemplatePreviewProps {
  template: ReportTemplate;
open: boolean;
  onClose: () => void;
  data?: ReportData;
  filters?: ReportFilters;
  variables?: Record<string, any>;
  onSave?: (template: ReportTemplate) => void;
  onExport?: (format: 'pdf' | 'png' | 'html') => void;
}
type PreviewMode = 'desktop' | 'tablet' | 'mobile' | 'fullscreen';
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const BREAKPOINT_WIDTHS = {
  xs: 360,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
};
const PREVIEW_MODE_BREAKPOINTS: Record<PreviewMode, Breakpoint> = {
  mobile: 'xs',
  tablet: 'sm',
  desktop: 'lg',
  fullscreen: 'xl',
};
export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template,
  open,
  onClose,
  data,
  filters}
  variables = {},
  onSave,
  onExport
}) => {
  const theme = useTheme();
  const { sampleData } = useReportsStore();
  const { currentFilters } = useFiltersStore();
  // Preview state
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  // Rendering state
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  // Auto-refresh timer
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  // Memoized render context
  const renderContext = useMemo<RenderContext>(
    () => ({ 
      template,
      data: data || sampleData,
      filters: filters || currentFilters,
      userPermissions: ['view', 'export'], // TODO: Get from auth context
      userRoles: ['user'], // TODO: Get from auth context
      variables,
      theme: theme.palette.mode,
      responsive: true,
      breakpoint: PREVIEW_MODE_BREAKPOINTS[previewMode]}
    }),
    [
      template,
      data,
      sampleData,
      filters,
      currentFilters,
      variables,
      theme.palette.mode,
      previewMode,
    ]
  );
  // Render template
  const renderTemplate = useCallback(async () => {
    setIsRendering(true);
    setRenderError(null);
    try {
      const result = await templateRenderingEngine.render(renderContext);
      setRenderResult(result);
      if (result.errors.length > 0) {
        setRenderError(
          `Rendering errors: ${result.errors.map((e) => e.message).join(', ')}`
        );
      }
    } catch (error) {
      setRenderError(`Failed to render template: ${error.message}`);
      setRenderResult(null);
    } finally {
      setIsRendering(false);
    }
  }, [renderContext]);
  // Validate template
  const validateTemplate = useCallback(async () => {
    try {
      const result = await templateValidationService.validate({ 
        template}
        availableCharts: Object.keys(renderContext.data.charts || {}),
        availableTables: Object.keys(renderContext.data.tables || {}),
        availableFilters: [],
        userPermissions: renderContext.userPermissions,
        userRoles: renderContext.userRoles}
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [template, renderContext]);
  // Initial render and validation
  useEffect(() => {
    if (open) {
      renderTemplate();
      validateTemplate();
    }
  }, [open, renderTemplate, validateTemplate]);
  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && open) {
      const timer = setInterval(() => {
        renderTemplate();
      }, refreshInterval);
      setRefreshTimer(timer);
      return () => clearInterval(timer);
    } else if (refreshTimer) {
      clearInterval(refreshTimer);
      setRefreshTimer(null);
    }
  }, [autoRefresh, open, refreshInterval, renderTemplate]);
  // Handle preview mode change
  const handlePreviewModeChange = useCallback((mode: PreviewMode) => {
    setPreviewMode(mode);
    if (mode === 'fullscreen') {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, []);
  // Handle zoom change
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(25, Math.min(200, newZoom)));
  }, []);
  // Handle export
  const handleExport = useCallback(
    (format: 'pdf' | 'png' | 'html') => {
      onExport?.(format);
    },
    [onExport]
  );
  // Get preview width based on mode
  const getPreviewWidth = useCallback(() => {
    const baseWidth = BREAKPOINT_WIDTHS[PREVIEW_MODE_BREAKPOINTS[previewMode]];
    return (baseWidth * zoom) / 100;
  }, [previewMode, zoom]);
  // Render section content
  const renderSectionContent = useCallback(
    (section: RenderedSection) => {
      switch (section.type) {
        case 'header':
          return (
            <div className="">
              {section.content.logo && (
                <img
                  src={section.content.logo}
                  alt="Logo"
                  
                />
              )}
              {section.content.title && (
                <div  gutterBottom>
                  {section.content.title}
                </div>
              )}
              {section.content.subtitle && (
                <div  color="text.secondary">
                  {section.content.subtitle}
                </div>
              )}
              {section.content.metadata && (
                <div className="">
                  {Object.entries(section.content.metadata).map(
                    ([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        size="small"
                        className=""
                      />
                    )
                  )}
                </div>
              )}
            </div>
          );
        case 'summary':
          return (
            <div>
              {section.content.kpis && section.content.kpis.length > 0 && (
                <div container spacing={2} className="">
                  {section.content.kpis.map((kpi: RenderedKPI) => (
                    <div item xs={12} sm={6} md={3} key={kpi.id}>
                      <Card>
                        <CardContent>
                          <div  gutterBottom>
                            {kpi.title}
                          </div>
                          <div  color={kpi.color}>
                            {kpi.value} {kpi.unit}
                          </div>
                          {kpi.trend && (
                            <div
                              
                              color={kpi.trend.color}
                              className=""
                            >
                              {kpi.trend.direction === 'up'
                                ? '↑'
                                : kpi.trend.direction === 'down'
                                ? '↓'
                                : '→'}
                              {kpi.trend.value}% {kpi.trend.period}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
              {section.content.metrics &&
                section.content.metrics.length > 0 && (
                  <div container spacing={2}>
                    {section.content.metrics.map((metric: RenderedMetric) => (
                      <div item xs={12} sm={6} md={4} key={metric.id}>
                        <Card >
                          <CardContent>
                            <div  color="text.secondary">
                              {metric.label}
                            </div>
                            <div >
                              {metric.value} {metric.unit}
                            </div>
                            {metric.trend && (
                              <div
                                
                                color={metric.trend.color}
                              >
                                {metric.trend.direction === 'up'
                                  ? '↑'
                                  : metric.trend.direction === 'down'
                                  ? '↓'
                                  : '→'}
                                {metric.trend.value}%
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          );
        case 'charts':
          return (
            <div>
              {section.content.charts && section.content.charts.length > 0 ? (
                <div container spacing={2}>
                  {section.content.charts.map((chart: RenderedChart) => (
                    <div
                      item
                      xs={12}
                      md={section.content.arrangement === 'grid' ? 6 : 12}
                      key={chart.id}
                    >
                      <Card>
                        <CardContent>
                          <div  gutterBottom>
                            {chart.title}
                          </div>
                          {chart.subtitle && (
                            <div
                              
                              color="text.secondary"
                              gutterBottom
                            >
                              {chart.subtitle}
                            </div>
                          )}
                          {chart.loading ? (
                            <Skeleton  height={300} />
                          ) : chart.error ? (
                            <Alert severity="error">{chart.error}</Alert>
                          ) : chart.isEmpty ? (
                            <Alert severity="info">No data available</Alert>
                          ) : (
                            <ChartComponent
                              type={chart.type as any}
                              data={chart.data}
                              config={chart.config}
                              theme={{
                                name: 'default',
                                colorPalette: [
                                  '#1976d2',
                                  '#dc004e',
                                  '#9c27b0',
                                  '#673ab7',
                                  '#3f51b5',
                                ],
                                gradients: [],
                                typography: {
                                  fontFamily: theme.typography.fontFamily,
                                  fontSize: {
                                    small: 12,
                                    medium: 14,
                                    large: 16,
                                    xlarge: 18,}
                                  },
                                  fontWeight: {
                                    light: 300,
                                    normal: 400,
                                    medium: 500,
                                    bold: 700,
                                  },
                                },
                                spacing: {
                                  xs: 4,
                                  sm: 8,
                                  md: 16,
                                  lg: 24,
                                  xl: 32,
                                },
                                borderRadius: 4,
                                shadows: {
                                  small: '0 1px 3px rgba(0,0,0,0.12)',
                                  medium: '0 4px 6px rgba(0,0,0,0.12)',
                                  large: '0 10px 20px rgba(0,0,0,0.12)',
                                },
                                mode: theme.palette.mode,
                              responsive
                            />
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert severity="info">No charts configured</Alert>
              )}
            </div>
          );
        case 'tables':
          return (
            <div>
              {section.content.tables && section.content.tables.length > 0 ? (
                <div spacing={2}>
                  {section.content.tables.map((table: RenderedTable) => (
                    <Card key={table.id}>
                      <CardContent>
                        <div  gutterBottom>
                          {table.title}
                        </div>
                        {table.loading ? (
                          <Skeleton  height={200} />
                        ) : table.error ? (
                          <Alert severity="error">{table.error}</Alert>
                        ) : table.isEmpty ? (
                          <Alert severity="info">No data available</Alert>
                        ) : (
                          <div className="">
                            {/* Simple table rendering - in real implementation, use a proper table component */}
                            <div >
                              Table: {table.data.length} rows,{' '}
                              {table.columns.length} columns
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert severity="info">No tables configured</Alert>
              )}
            </div>
          );
        case 'text':
          return (
            <div>
              {section.content.html ? (
                <div
                  
                />
              ) : (
                <div  className="">
                  {section.content.text || 'No text content'}
                </div>
              )}
            </div>
          );
        case 'spacer':
          return <div className="" />;
        case 'footer':
          return (
            <div
              className=""
            >
              <div  color="text.secondary">
                {section.content.text ||
                  `Generated on ${new Date().toLocaleString()}`}
              </div>
            </div>
          );
        default:
          return (
            <Alert severity="warning">
              Unknown section type: {section.type}
            </Alert>
          );
      }
    },
    [theme]
  );
  if (!open) return null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          width: isFullscreen ? '100%' : '90vw',
          height: isFullscreen ? '100%' : '90vh',
          maxWidth: 'none',
          maxHeight: 'none',}
        },
      >
      {/* Toolbar */}
      <header position="static" color="default" >
        <div>
          <div  className="">
            Preview: {template.name}
          </div>
          {/* Preview mode controls */}
          <div direction="row" spacing={1} className="">
            <Tooltip title="Mobile">
              <IconButton
                onClick={() => handlePreviewModeChange('mobile')}
                color={previewMode === 'mobile' ? 'primary' : 'default'}
              >
                <Phone />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tablet">
              <IconButton
                onClick={() => handlePreviewModeChange('tablet')}
                color={previewMode === 'tablet' ? 'primary' : 'default'}
              >
                <Tablet />
              </IconButton>
            </Tooltip>
            <Tooltip title="Desktop">
              <IconButton
                onClick={() => handlePreviewModeChange('desktop')}
                color={previewMode === 'desktop' ? 'primary' : 'default'}
              >
                <Computer />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fullscreen">
              <IconButton
                onClick={() => handlePreviewModeChange('fullscreen')}
                color={previewMode === 'fullscreen' ? 'primary' : 'default'}
              >
                <Tv />
              </IconButton>
            </Tooltip>
          </div>
          {/* Zoom controls */}
          <div direction="row" spacing={1} alignItems="center" className="">
            <IconButton onClick={() => handleZoomChange(zoom - 25)}>
              <ZoomOut />
            </IconButton>
            <div
              
              className=""
            >
              {zoom}%
            </div>
            <IconButton onClick={() => handleZoomChange(zoom + 25)}>
              <ZoomIn />
            </IconButton>
          </div>
          {/* Action buttons */}
          <div direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={renderTemplate} disabled={isRendering}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Validation">
              <IconButton
                onClick={() => setShowValidation(!showValidation)}
                color={
                  validationResult && !validationResult.isValid
                    ? 'error'
                    : 'default'}
                }
              >
                <BugReport />
              </IconButton>
            </Tooltip>
            <Tooltip title="Performance">
              <IconButton onClick={() => setShowPerformance(!showPerformance)}>
                <Speed />
              </IconButton>
            </Tooltip>
            {onExport && (
              <Tooltip title="Export">
                <IconButton onClick={() => handleExport('pdf')}>
                  <Download />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </div>
        </div>
      </header>
      {/* Content */}
      <DialogContent className="">
        <div className="">
          {/* Main preview area */}
          <div
            className=""
          >
            <div
              className="">
              {isRendering ? (
                <div className="">
                  <Progress className="" />
                  <div
                    
                    color="text.secondary"
                    textAlign="center"
                  >
                    Rendering template...
                  </div>
                </div>
              ) : renderError ? (
                <div className="">
                  <Alert severity="error">{renderError}</Alert>
                </div>
              ) : renderResult ? (
                <div className="">
                  {renderResult.sections.map((section) => (
                    <div
                      key={section.id}
                      className="">
                      {renderSectionContent(section)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="">
                  <Alert severity="info">No preview available</Alert>
                </div>
              )}
            </div>
          </div>
          {/* Side panels */}
          {(showValidation || showPerformance) && (
            <div className="">
              {showValidation && validationResult && (
                <div className="">
                  <div  gutterBottom>
                    Validation Results
                  </div>
                  <div spacing={1}>
                    <Chip
                      label={validationResult.isValid ? 'Valid' : 'Invalid'}
                      color={validationResult.isValid ? 'success' : 'error'}
                      size="small"
                    />
                    {validationResult.errors.length > 0 && (
                      <div>
                        <div  color="error">
                          Errors ({validationResult.errors.length})
                        </div>
                        {validationResult.errors
                          .slice(0, 5)
                          .map((error, index) => (
                            <Alert key={index} severity="error" className="">
                              <div >
                                {error.field}: {error.message}
                              </div>
                            </Alert>
                          ))}
                      </div>
                    )}
                    {validationResult.warnings.length > 0 && (
                      <div>
                        <div  color="warning.main">
                          Warnings ({validationResult.warnings.length})
                        </div>
                        {validationResult.warnings
                          .slice(0, 3)
                          .map((warning, index) => (
                            <Alert
                              key={index}
                              severity="warning"
                              className=""
                            >
                              <div >
                                {warning.field}: {warning.message}
                              </div>
                            </Alert>
                          ))}
                      </div>
                    )}
                    {validationResult.suggestions.length > 0 && (
                      <div>
                        <div  color="info.main">
                          Suggestions ({validationResult.suggestions.length})
                        </div>
                        {validationResult.suggestions
                          .slice(0, 3)
                          .map((suggestion, index) => (
                            <Alert key={index} severity="info" className="">
                              <div >
                                {suggestion.message}
                              </div>
                            </Alert>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {showPerformance && renderResult && (
                <div className="">
                  <div  gutterBottom>
                    Performance Metrics
                  </div>
                  <div spacing={2}>
                    <div>
                      <div  color="text.secondary">
                        Total Render Time
                      </div>
                      <div >
                        {renderResult.performance.totalRenderTime.toFixed(2)}ms
                      </div>
                    </div>
                    <div>
                      <div  color="text.secondary">
                        Sections Rendered
                      </div>
                      <div >
                        {renderResult.metadata.sectionsRendered}
                      </div>
                    </div>
                    <div>
                      <div  color="text.secondary">
                        Charts Rendered
                      </div>
                      <div >
                        {renderResult.metadata.chartsRendered}
                      </div>
                    </div>
                    <div>
                      <div  color="text.secondary">
                        Data Processing Time
                      </div>
                      <div >
                        {renderResult.performance.dataProcessingTime.toFixed(2)}
                        ms
                      </div>
                    </div>
                    <div>
                      <div  color="text.secondary">
                        Validation Time
                      </div>
                      <div >
                        {renderResult.performance.validationTime.toFixed(2)}ms
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
      {/* Settings panel */}
      <div className="">
        <div direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch}
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          {autoRefresh && (
            <div size="small" className="">
              <Label>Interval</Label>
              <Select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                label="Interval"
              >
                <MenuItem value={1000}>1 second</MenuItem>
                <MenuItem value={5000}>5 seconds</MenuItem>
                <MenuItem value={10000}>10 seconds</MenuItem>
                <MenuItem value={30000}>30 seconds</MenuItem>
              </Select>
            </div>
          )}
          <div className="" />
          {renderResult && (
            <div  color="text.secondary">
              Last updated:{' '}
              {renderResult.metadata.renderedAt.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
