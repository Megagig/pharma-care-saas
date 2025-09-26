import { Button, Progress, Alert } from '@/components/ui/button';

interface FileUploadProps {
  conversationId: string;
  onFileUploaded?: (file: UploadedFile) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  disabled?: boolean;
}
interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}
interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon />;
  if (mimeType === 'application/pdf') return <PdfIcon />;
  if (mimeType.includes('document') || mimeType.includes('word'))
    return <DocIcon />;
  return <FileIcon />;
};
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
export const FileUpload: React.FC<FileUploadProps> = ({ 
  conversationId,
  onFileUploaded,
  maxFiles = MAX_FILES,
  maxSize = MAX_FILE_SIZE,
  allowedTypes = ALLOWED_FILE_TYPES,
  disabled = false
}) => {
  const [uploadQueue, setUploadQueue] = useState<FileUploadProgress[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useCommunicationStore();
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File size exceeds maximum limit of ${formatFileSize(maxSize)}`;
      }
      if (!allowedTypes.includes(file.type)) {
        return `File type ${file.type} is not allowed`;
      }
      // Check for dangerous file extensions
      const dangerousExtensions = [
        '.exe',
        '.bat',
        '.cmd',
        '.com',
        '.pif',
        '.scr',
        '.vbs',
        '.js',
        '.jar',
      ];
      const fileName = file.name.toLowerCase();
      if (dangerousExtensions.some((ext) => fileName.endsWith(ext))) {
        return `File extension is not allowed for security reasons`;
      }
      // Check for invalid characters in filename
      if (
        file.name.includes('..') ||
        file.name.includes('/') ||
        file.name.includes('\\')
      ) {
        return 'Invalid characters in filename';
      }
      return null;
    },
    [maxSize, allowedTypes]
  );
  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);
      const response = await fetch('/api/communication/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      const data = await response.json();
      return data.file;
    },
    [conversationId]
  );
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      setError(null);
      // Validate total file count
      if (uploadQueue.length + uploadedFiles.length + files.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }
      // Validate each file
      const validFiles: File[] = [];
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        validFiles.push(file);
      }
      // Add files to upload queue
      const newUploads: FileUploadProgress[] = validFiles.map((file) => ({ 
        file,
        progress: 0,
        status: 'uploading' as const}
      }));
      setUploadQueue((prev) => [...prev, ...newUploads]);
      // Upload files
      for (let i = 0; i < newUploads.length; i++) {
        const uploadItem = newUploads[i];
        try {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.file === uploadItem.file && item.progress < 90
                  ? { ...item, progress: item.progress + 10 }
                  : item
              )
            );
          }, 200);
          const uploadedFile = await uploadFile(uploadItem.file);
          clearInterval(progressInterval);
          // Update upload queue with completed status
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === uploadItem.file
                ? { ...item, progress: 100, status: 'completed', uploadedFile }
                : item
            )
          );
          // Add to uploaded files
          setUploadedFiles((prev) => [...prev, uploadedFile]);
          // Notify parent component
          onFileUploaded?.(uploadedFile);
          // Send message with file attachment
          await sendMessage({ 
            conversationId,
            content: {
              type: 'file'}
              text: `Shared file: ${uploadedFile.originalName}`,
              attachments: [uploadedFile],
            }
        } catch (error: unknown) {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === uploadItem.file
                ? { ...item, status: 'error', error: error.message }
                : item
            )
          );
        }
      }
      // Clear completed uploads after a delay
      setTimeout(() => {
        setUploadQueue((prev) =>
          prev.filter((item) => item.status !== 'completed')
        );
      }, 3000);
    },
    [
      uploadQueue.length,
      uploadedFiles.length,
      maxFiles,
      validateFile,
      uploadFile,
      onFileUploaded,
      sendMessage,
      conversationId,
    ]
  );
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleFileUpload(acceptedFiles);
    },
    [handleFileUpload]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    disabled,
    multiple: true,
    maxFiles,
    maxSize,
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc; })
    }, {} as Record<string, string[]>)}
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };
  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };
  const removeFromQueue = (file: File) => {
    setUploadQueue((prev) => prev.filter((item) => item.file !== file));
  };
  return (
    <div>
      {/* Drag and Drop Area */}
      <div
        {...getRootProps()}
        className="">
        <input {...getInputProps()} />
        <div display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CloudUploadIcon className="" />
          <div  color="text.secondary">
            {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
          </div>
          <div  color="text.secondary">
            or
          </div>
          <Button
            
            startIcon={<AttachFileIcon />}
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileInputChange}
            
          />
        </div>
      </div>
      {/* File Type and Size Info */}
      <div mt={2}>
        <div  color="text.secondary">
          Allowed types: Images, PDF, Word, Excel, Text files
        </div>
        <br />
        <div  color="text.secondary">
          Maximum file size: {formatFileSize(maxSize)} | Maximum files:{' '}
          {maxFiles}
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <Alert severity="error" className="" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Upload Progress */}
      {uploadQueue.length > 0 && (
        <div mt={2}>
          <div  gutterBottom>
            Uploading Files
          </div>
          <List dense>
            {uploadQueue.map((item, index) => (
              <div key={index}>
                <div className="">
                  <div display="flex" alignItems="center" gap={1} mb={1}>
                    {getFileIcon(item.file.type)}
                    <div  noWrap className="">
                      {item.file.name}
                    </div>
                    <div  color="text.secondary">
                      {formatFileSize(item.file.size)}
                    </div>
                    {item.status === 'uploading' && (
                      <IconButton
                        size="small"
                        onClick={() => removeFromQueue(item.file)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
                  {item.status === 'uploading' && (
                    <Progress
                      
                      className=""
                    />
                  )}
                  {item.status === 'error' && (
                    <Alert severity="error" className="">
                      {item.error}
                    </Alert>
                  )}
                  {item.status === 'completed' && (
                    <Alert severity="success" className="">
                      Upload completed successfully
                    </Alert>
                  )}
                </div>
              </div>
            ))}
          </List>
        </div>
      )}
      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div mt={2}>
          <div  gutterBottom>
            Uploaded Files
          </div>
          <div display="flex" flexWrap="wrap" gap={1}>
            {uploadedFiles.map((file) => (
              <Chip
                key={file.id}
                icon={getFileIcon(file.mimeType)}
                label={`${file.originalName} (${formatFileSize(file.size)})`}
                onDelete={() => removeUploadedFile(file.id)}
                
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default FileUpload;
