import { Button, Input, Label, Card, CardContent, Select, Tooltip } from '@/components/ui/button';

interface ExportHistoryProps {
  maxHeight?: number;
}
export const ExportHistory: React.FC<ExportHistoryProps> = ({ 
  maxHeight = 600
}) => {
  const { exportJobs, exportResults, removeExportJob, removeExportResult } =
    useExportsStore();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  // Combine jobs and results for display
  const allExports = useMemo(() => {
    return Object.values(exportJobs)
      .map((job) => ({ 
        ...job,
        result: exportResults[job.id]}
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [exportJobs, exportResults]);
  // Filter exports based on search and filters
  const filteredExports = useMemo(() => {
    return allExports.filter((exportItem) => {
      const matchesSearch =
        searchTerm === '' ||
        exportItem.reportType
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        exportItem.config.format
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || exportItem.status === statusFilter;
      const matchesFormat =
        formatFilter === 'all' || exportItem.config.format === formatFilter;
      return matchesSearch && matchesStatus && matchesFormat;
    });
  }, [allExports, searchTerm, statusFilter, formatFilter]);
  // Paginated exports
  const paginatedExports = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredExports.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredExports, page, rowsPerPage]);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    jobId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedJobId(jobId);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedJobId(null);
  };
  const handleDownload = (result: ExportResult) => {
    if (result.downloadUrl) {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    handleMenuClose();
  };
  const handleDelete = (jobId: string) => {
    removeExportJob(jobId);
    const result = Object.values(exportResults).find((r) => r.id === jobId);
    if (result) {
      removeExportResult(jobId);
    }
    handleMenuClose();
  };
  const handleRetry = (jobId: string) => {
    // TODO: Implement retry logic
    console.log('Retry export:', jobId);
    handleMenuClose();
  };
  const getStatusColor = (
    status: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
      case 'cancelled':
        return 'error';
      case 'processing':
        return 'primary';
      case 'queued':
        return 'info';
      default:
        return 'default';
    }
  };
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const formatDuration = (startTime: Date, endTime?: Date): string => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };
  const uniqueFormats = Array.from(
    new Set(allExports.map((e) => e.config.format))
  );
  const uniqueStatuses = Array.from(new Set(allExports.map((e) => e.status)));
  return (
    <Card>
      <CardContent>
        <div display="flex" alignItems="center" justifyContent="between" mb={2}>
          <div  component="div">
            Export History
          </div>
          <Button
            startIcon={<RefreshIcon />}
            
            size="small"
          >
            Refresh
          </Button>
        </div>
        {/* Filters */}
        <div display="flex" gap={2} mb={2} flexWrap="wrap">
          <Input
            size="small"
            placeholder="Search exports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            
            className=""
          />
          <div size="small" className="">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              {uniqueStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </div>
          <div size="small" className="">
            <Label>Format</Label>
            <Select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              label="Format"
            >
              <MenuItem value="all">All Formats</MenuItem>
              {uniqueFormats.map((format) => (
                <MenuItem key={format} value={format}>
                  {format.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </div>
        </div>
        {/* Export Table */}
        <TableContainer className="">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Report Type</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedExports.map((exportItem) => (
                <TableRow key={exportItem.id} hover>
                  <TableCell>
                    <div >
                      {exportItem.reportType
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    {exportItem.error && (
                      <Tooltip title={exportItem.error}>
                        <div
                          
                          color="error"
                          display="block"
                        >
                          Error: {exportItem.error.substring(0, 50)}...
                        </div>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={exportItem.config.format.toUpperCase()}
                      size="small"
                      
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        exportItem.status.charAt(0).toUpperCase() +
                        exportItem.status.slice(1)}
                      }
                      size="small"
                      color={getStatusColor(exportItem.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <div >
                      {formatFileSize(exportItem.result?.fileSize)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div >
                      {formatDuration(
                        exportItem.createdAt,
                        exportItem.completedAt
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div >
                      {exportItem.createdAt.toLocaleDateString()}
                    </div>
                    <div  color="text.secondary">
                      {exportItem.createdAt.toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, exportItem.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredExports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuList>
            {selectedJobId &&
              exportJobs[selectedJobId]?.status === 'completed' &&
              exportResults[selectedJobId]?.downloadUrl && (
                <MenuItemComponent
                  onClick={() => handleDownload(exportResults[selectedJobId])}
                >
                  <div>
                    <DownloadIcon fontSize="small" />
                  </div>
                  <div>Download</ListItemText>
                </MenuItemComponent>
              )}
            {selectedJobId &&
              exportJobs[selectedJobId]?.status === 'failed' && (
                <MenuItemComponent onClick={() => handleRetry(selectedJobId)}>
                  <div>
                    <RefreshIcon fontSize="small" />
                  </div>
                  <div>Retry</ListItemText>
                </MenuItemComponent>
              )}
            <MenuItemComponent
              onClick={() => selectedJobId && handleDelete(selectedJobId)}
            >
              <div>
                <DeleteIcon fontSize="small" />
              </div>
              <div>Delete</ListItemText>
            </MenuItemComponent>
          </MenuList>
        </Menu>
      </CardContent>
    </Card>
  );
};
