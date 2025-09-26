import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Progress, Alert, Switch } from '@/components/ui/button';
getDefaultExportOptions,
  validateExportConfig,
  estimateExportSize,
  generateExportFilename,
  getMimeType,

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  reportType: string;
  reportData: any;
  filters: Record<string, any>;
}
const steps = ['Format Selection', 'Configuration', 'Preview & Export'];
export const ExportDialog: React.FC<ExportDialogProps> = ({ 
  open,
  onClose,
  reportType,
  reportData,
  filters
}) => {
  const { selectedExportFormat, setSelectedExportFormat, addExportJob } =
    useExportsStore();
  const [activeStep, setActiveStep] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(() =>
    getDefaultExportOptions(selectedExportFormat)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Update options when format changes
  useEffect(() => {
    setExportOptions(getDefaultExportOptions(selectedExportFormat));
    setValidationErrors([]);
  }, [selectedExportFormat]);
  // Validate configuration
  useEffect(() => {
    const config: ExportConfig = {
      format: selectedExportFormat,
      options: exportOptions,
      metadata: {
        title: `${reportType} Report`,
        author: 'Current User', // TODO: Get from auth context
        organization: 'Pharmacy Care Platform',
        generatedAt: new Date(),
        reportType,
        filters,
        dataRange: {
          startDate: filters.dateRange?.startDate || new Date(),
          endDate: filters.dateRange?.endDate || new Date(),
        },
        version: '1.0',
      },
    };
    const validation = validateExportConfig(config);
    setValidationErrors(validation.errors);
  }, [selectedExportFormat, exportOptions, reportType, filters]);
  const handleFormatChange = (format: ExportFormat) => {
    setSelectedExportFormat(format);
  };
  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions((prev) => ({ 
      ...prev,
      [key]: value}
    }));
  };
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };
  const handleExport = async () => {
    if (validationErrors.length > 0) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const config: ExportConfig = {
        format: selectedExportFormat,
        options: exportOptions,
        metadata: {
          title: `${reportType} Report`,
          author: 'Current User',
          organization: 'Pharmacy Care Platform',
          generatedAt: new Date(),
          reportType,
          filters,
          dataRange: {
            startDate: filters.dateRange?.startDate || new Date(),
            endDate: filters.dateRange?.endDate || new Date(),
          },
          version: '1.0',
        },
      };
      // Create export job
      const jobId = `export_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const exportJob = {
        id: jobId,
        reportType,
        filters,
        config,
        status: 'queued' as const,
        priority: 'normal' as const,
        progress: 0,
        createdBy: 'current-user', // TODO: Get from auth context
        createdAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
      };
      addExportJob(exportJob);
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsExporting(false);
            onClose();
            return 100;
          }
          return prev + 10;
        });
      }, 500);
      // TODO: Implement actual export API call
      console.log('Starting export with config:', config);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };
  const renderFormatSelection = () => {
    const formats: {
      value: ExportFormat;
      label: string;
      description: string;
      icon: string;
    }[] = [
      {
        value: 'pdf',
        label: 'PDF Document',
        description: 'High-quality document with charts and formatting',
        icon: '📄',
      },
      {
        value: 'excel',
        label: 'Excel Workbook',
        description: 'Spreadsheet with multiple sheets and embedded charts',
        icon: '📊',
      },
      {
        value: 'csv',
        label: 'CSV File',
        description: 'Comma-separated values for data analysis',
        icon: '📋',
      },
      {
        value: 'png',
        label: 'PNG Image',
        description: 'High-resolution image of charts',
        icon: '🖼️',
      },
      {
        value: 'svg',
        label: 'SVG Vector',
        description: 'Scalable vector graphics',
        icon: '🎨',
      },
      {
        value: 'json',
        label: 'JSON Data',
        description: 'Raw data in JSON format',
        icon: '💾',
      },
    ];
    return (
      <div container spacing={2}>
        {formats.map((format) => (
          <div item xs={12} sm={6} key={format.value}>
            <Card
              variant={
                selectedExportFormat === format.value ? 'outlined' : 'elevation'}
              }
              className="" onClick={() => handleFormatChange(format.value)}
            >
              <CardContent>
                <div display="flex" alignItems="center" mb={1}>
                  <div  component="span" mr={1}>
                    {format.icon}
                  </div>
                  <div  component="div">
                    {format.label}
                  </div>
                </div>
                <div  color="text.secondary">
                  {format.description}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  };
  const renderConfiguration = () => {
    return (
      <div>
        {/* PDF Options */}
        {selectedExportFormat === 'pdf' && (
          <div mb={3}>
            <div  gutterBottom>
              PDF Options
            </div>
            <div container spacing={2}>
              <div item xs={6}>
                <div fullWidth>
                  <Label>Page Size</Label>
                  <Select
                    value={exportOptions.pageSize || 'A4'}
                    onChange={(e) =>
                      handleOptionChange('pageSize', e.target.value)}
                    }
                  >
                    <MenuItem value="A4">A4</MenuItem>
                    <MenuItem value="A3">A3</MenuItem>
                    <MenuItem value="Letter">Letter</MenuItem>
                    <MenuItem value="Legal">Legal</MenuItem>
                  </Select>
                </div>
              </div>
              <div item xs={6}>
                <div fullWidth>
                  <Label>Orientation</Label>
                  <Select
                    value={exportOptions.orientation || 'portrait'}
                    onChange={(e) =>
                      handleOptionChange('orientation', e.target.value)}
                    }
                  >
                    <MenuItem value="portrait">Portrait</MenuItem>
                    <MenuItem value="landscape">Landscape</MenuItem>
                  </Select>
                </div>
              </div>
              <div item xs={12}>
                <FormControlLabel
                  control={
                    <Switch}
                      checked={exportOptions.includeCharts !== false}
                      onChange={(e) =>
                        handleOptionChange('includeCharts', e.target.checked)}
                      }
                    />
                  }
                  label="Include Charts"
                />
              </div>
            </div>
          </div>
        )}
        {/* CSV Options */}
        {selectedExportFormat === 'csv' && (
          <div mb={3}>
            <div  gutterBottom>
              CSV Options
            </div>
            <div container spacing={2}>
              <div item xs={6}>
                <Input
                  fullWidth
                  label="Delimiter"
                  value={exportOptions.delimiter || ','}
                  onChange={(e) =>
                    handleOptionChange('delimiter', e.target.value)}
                  }
                  
                />
              </div>
              <div item xs={6}>
                <div fullWidth>
                  <Label>Encoding</Label>
                  <Select
                    value={exportOptions.encoding || 'utf-8'}
                    onChange={(e) =>
                      handleOptionChange('encoding', e.target.value)}
                    }
                  >
                    <MenuItem value="utf-8">UTF-8</MenuItem>
                    <MenuItem value="utf-16">UTF-16</MenuItem>
                    <MenuItem value="ascii">ASCII</MenuItem>
                  </Select>
                </div>
              </div>
              <div item xs={12}>
                <FormControlLabel
                  control={
                    <Switch}
                      checked={exportOptions.includeHeaders !== false}
                      onChange={(e) =>
                        handleOptionChange('includeHeaders', e.target.checked)}
                      }
                    />
                  }
                  label="Include Headers"
                />
              </div>
            </div>
          </div>
        )}
        {/* Image Options */}
        {(['png', 'svg'] as ExportFormat[]).includes(selectedExportFormat) && (
          <div mb={3}>
            <div  gutterBottom>
              Image Options
            </div>
            <div container spacing={2}>
              <div item xs={6}>
                <Input
                  fullWidth
                  label="Width (px)"
                  type="number"
                  value={exportOptions.width || 1200}
                  onChange={(e) =>
                    handleOptionChange('width', parseInt(e.target.value))}
                  }
                  
                />
              </div>
              <div item xs={6}>
                <Input
                  fullWidth
                  label="Height (px)"
                  type="number"
                  value={exportOptions.height || 800}
                  onChange={(e) =>
                    handleOptionChange('height', parseInt(e.target.value))}
                  }
                  
                />
              </div>
              {selectedExportFormat === 'png' && (
                <div item xs={6}>
                  <Input
                    fullWidth
                    label="DPI"
                    type="number"
                    value={exportOptions.dpi || 150}
                    onChange={(e) =>
                      handleOptionChange('dpi', parseInt(e.target.value))}
                    }
                    
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {/* General Options */}
        <div>
          <div  gutterBottom>
            General Options
          </div>
          <FormControlLabel
            control={
              <Switch}
                checked={exportOptions.includeMetadata !== false}
                onChange={(e) =>
                  handleOptionChange('includeMetadata', e.target.checked)}
                }
              />
            }
            label="Include Metadata"
          />
          <FormControlLabel
            control={
              <Switch}
                checked={exportOptions.includeFilters !== false}
                onChange={(e) =>
                  handleOptionChange('includeFilters', e.target.checked)}
                }
              />
            }
            label="Include Applied Filters"
          />
          <FormControlLabel
            control={
              <Switch}
                checked={exportOptions.includeTimestamp !== false}
                onChange={(e) =>
                  handleOptionChange('includeTimestamp', e.target.checked)}
                }
              />
            }
            label="Include Timestamp"
          />
        </div>
      </div>
    );
  };
  const renderPreview = () => {
    const dataPoints = reportData?.summary?.totalRecords || 0;
    const chartCount = reportData?.charts?.length || 0;
    const sizeEstimate = estimateExportSize(
      selectedExportFormat,
      dataPoints,
      chartCount
    );
    const filename = generateExportFilename(reportType, selectedExportFormat);
    return (
      <div>
        <div  gutterBottom>
          Export Preview
        </div>
        <Card  className="">
          <CardContent>
            <div container spacing={2}>
              <div item xs={12} sm={6}>
                <div  color="text.secondary">
                  Format
                </div>
                <div >
                  {selectedExportFormat.toUpperCase()}
                </div>
              </div>
              <div item xs={12} sm={6}>
                <div  color="text.secondary">
                  Estimated Size
                </div>
                <div >
                  {sizeEstimate.formatted}
                </div>
              </div>
              <div item xs={12}>
                <div  color="text.secondary">
                  Filename
                </div>
                <div  className="">
                  {filename}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {validationErrors.length > 0 && (
          <Alert severity="error" className="">
            <div  gutterBottom>
              Configuration Errors:
            </div>
            <ul >
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
        <div display="flex" flexWrap="wrap" gap={1}>
          {exportOptions.includeCharts && (
            <Chip label="Charts Included" color="primary" size="small" />
          )}
          {exportOptions.includeMetadata && (
            <Chip label="Metadata Included" color="primary" size="small" />
          )}
          {exportOptions.includeFilters && (
            <Chip label="Filters Included" color="primary" size="small" />
          )}
          {exportOptions.includeTimestamp && (
            <Chip label="Timestamp Included" color="primary" size="small" />
          )}
        </div>
      </div>
    );
  };
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderFormatSelection();
      case 1:
        return renderConfiguration();
      case 2:
        return renderPreview();
      default:
        return null;
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '600px' } >
      <DialogTitle>
        <div display="flex" alignItems="center" justifyContent="space-between">
          <div display="flex" alignItems="center">
            <DownloadIcon className="" />
            Export Report
          </div>
          <Button
            onClick={onClose}
            size="small"
            className=""
          >
            <CloseIcon />
          </Button>
        </div>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} className="">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {isExporting && (
          <div mb={3}>
            <div  gutterBottom>
              Exporting report...
            </div>
            <Progress
              
              className=""
            />
            <div  color="text.secondary">
              {exportProgress}% complete
            </div>
          </div>
        )}
        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isExporting}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            
            disabled={isExporting}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleExport}
            
            disabled={isExporting || validationErrors.length > 0}
            startIcon={<DownloadIcon />}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
