import { Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Tooltip, Spinner } from '@/components/ui/button';

interface FileAttachment {
  fileId: string;
  fileName: string;
  originalName?: string;
  fileSize: number;
  mimeType: string;
  secureUrl: string;
  uploadedAt?: string;
}
interface FilePreviewProps {
  file: FileAttachment;
  showPreview?: boolean;
  showDownload?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  onDownload?: (file: FileAttachment) => void;
  onPreview?: (file: FileAttachment) => void;
}
interface FilePreviewDialogProps {
  file: FileAttachment;
  open: boolean;
  onClose: () => void;
  onDownload?: (file: FileAttachment) => void;
}
const getFileIcon = (
  mimeType: string,
  size: 'small' | 'medium' | 'large' = 'medium'
) => {
  const iconProps = { fontSize: size };
  if (mimeType.startsWith('image/')) return <ImageIcon {...iconProps} />;
  if (mimeType === 'application/pdf') return <PdfIcon {...iconProps} />;
  if (mimeType.includes('document') || mimeType.includes('word'))
    return <DocIcon {...iconProps} />;
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <ExcelIcon {...iconProps} />;
  if (mimeType.startsWith('text/')) return <TextIcon {...iconProps} />;
  return <FileIcon {...iconProps} />;
};
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const getFileTypeLabel = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('document') || mimeType.includes('word'))
    return 'Document';
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return 'Spreadsheet';
  if (mimeType.startsWith('text/')) return 'Text';
  return 'File';
};
const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({ 
  file,
  open,
  onClose,
  onDownload
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(file.secureUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      onDownload?.(file);
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setLoading(false);
    }
  };
  const renderPreview = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div
          component="img"
          src={file.secureUrl}
          alt={file.originalName || file.fileName}
          className=""
          onError={() => setError('Failed to load image')}
        />
      );
    }
    if (file.mimeType === 'application/pdf') {
      return (
        <div className="">
          <iframe
            src={`${file.secureUrl}#toolbar=0`}
            width="100%"
            height="100%"
            
            title={file.originalName || file.fileName}
          />
        </div>
      );
    }
    if (file.mimeType.startsWith('text/')) {
      return (
        <div
          className=""
        >
          <div
            
            component="pre"
            className=""
          >
            {/* Text content would be loaded here */}
            Text preview not available. Please download to view the file.
          </div>
        </div>
      );
    }
    return (
      <div
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        className=""
      >
        {getFileIcon(file.mimeType, 'large')}
        <div  className="">
          {getFileTypeLabel(file.mimeType)} Preview
        </div>
        <div  color="text.secondary">
          Preview not available for this file type
        </div>
      </div>
    );
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div display="flex" alignItems="center" justifyContent="space-between">
          <div display="flex" alignItems="center" gap={1}>
            {getFileIcon(file.mimeType)}
            <div  noWrap>
              {file.originalName || file.fileName}
            </div>
          </div>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        {error ? (
          <div
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            className=""
          >
            <div color="error" gutterBottom>
              {error}
            </div>
            <Button onClick={() => setError(null)}>Try Again</Button>
          </div>
        ) : (
          renderPreview()
        )}
        <div mt={2} display="flex" gap={1} flexWrap="wrap">
          <Chip
            label={getFileTypeLabel(file.mimeType)}
            size="small"
            
          />
          <Chip
            label={formatFileSize(file.fileSize)}
            size="small"
            
          />
          {file.uploadedAt && (
            <Chip
              label={`Uploaded ${new Date(
                file.uploadedAt}
              ).toLocaleDateString()}`}
              size="small"
              
            />
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          
          startIcon={}
            loading ? <Spinner size={16} /> : <DownloadIcon />
          }
          onClick={handleDownload}
          disabled={loading}
        >
          {loading ? 'Downloading...' : 'Download'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export const FilePreview: React.FC<FilePreviewProps> = ({ 
  file,
  showPreview = true,
  showDownload = true,
  showDetails = true,
  compact = false,
  onDownload,
  onPreview
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(file.secureUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      onDownload?.(file);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };
  const handlePreview = () => {
    setPreviewOpen(true);
    onPreview?.(file);
  };
  if (compact) {
    return (
      <div display="flex" alignItems="center" gap={1} className="">
        {getFileIcon(file.mimeType, 'small')}
        <div  noWrap className="">
          {file.originalName || file.fileName}
        </div>
        <div  color="text.secondary">
          {formatFileSize(file.fileSize)}
        </div>
        {showPreview && (
          <Tooltip title="Preview">
            <IconButton size="small" onClick={handlePreview}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {showDownload && (
          <Tooltip title="Download">
            <IconButton
              size="small"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Spinner size={16} />
              ) : (
                <DownloadIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
        <FilePreviewDialog
          file={file}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          onDownload={onDownload}
        />
      </div>
    );
  }
  return (
    <Card className="">
      <CardContent>
        <div display="flex" alignItems="center" gap={2} mb={2}>
          {getFileIcon(file.mimeType)}
          <div flex={1} minWidth={0}>
            <div  noWrap>
              {file.originalName || file.fileName}
            </div>
            {showDetails && (
              <div  color="text.secondary">
                {getFileTypeLabel(file.mimeType)} •{' '}
                {formatFileSize(file.fileSize)}
              </div>
            )}
          </div>
        </div>
        {showDetails && file.uploadedAt && (
          <div  color="text.secondary">
            Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
      <CardActions>
        {showPreview && (
          <Button size="small" startIcon={<ViewIcon />} onClick={handlePreview}>
            Preview
          </Button>
        )}
        {showDownload && (
          <Button
            size="small"
            startIcon={}
              downloading ? <Spinner size={16} /> : <DownloadIcon />
            }
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
        )}
      </CardActions>
      <FilePreviewDialog
        file={file}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onDownload={onDownload}
      />
    </Card>
  );
};
export default FilePreview;
