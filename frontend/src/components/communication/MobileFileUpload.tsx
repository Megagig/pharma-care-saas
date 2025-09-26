import { Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Progress, Alert } from '@/components/ui/button';

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
}
interface MobileFileUploadProps {
  conversationId: string;
  onFilesUploaded: (files: File[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  disabled?: boolean;
  compact?: boolean;
}
const MobileFileUpload: React.FC<MobileFileUploadProps> = ({ 
  conversationId,
  onFilesUploaded,
  onUploadProgress,
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  acceptedFileTypes = [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/*',
  ],
  disabled = false,
  compact = false
}) => {
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileUploadItem | null>(null);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isTouchDevice = useIsTouchDevice();
  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc; })
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize: maxFileSize,
    disabled: disabled || isUploading,
    onDrop: handleFileDrop,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach((rejection) => {
        console.error('File rejected:', rejection.file.name, rejection.errors);
      });
    }
  // Handle file drop
  function handleFileDrop(acceptedFiles: File[]) {
    const newItems: FileUploadItem[] = acceptedFiles.map((file) => ({ 
      file}
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'pending',
      preview: file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined}
    setUploadItems((prev) => [...prev, ...newItems]);
    uploadFiles(newItems);
  }
  // Upload files
  const uploadFiles = async (items: FileUploadItem[]) => {
    setIsUploading(true);
    try {
      for (const item of items) {
        await uploadSingleFile(item);
      }
      // Notify parent component
      const completedFiles = items.map((item) => item.file);
      onFilesUploaded(completedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };
  // Upload single file
  const uploadSingleFile = async (item: FileUploadItem) => {
    return new Promise<void>((resolve, reject) => {
      // Update status to uploading
      setUploadItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
      );
      // Simulate upload progress (replace with actual upload logic)
      const simulateUpload = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            // Update to completed
            setUploadItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? { ...i, progress: 100, status: 'completed' }
                  : i
              )
            );
            onUploadProgress?.(item.id, 100);
            resolve();
          } else {
            // Update progress
            setUploadItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress } : i))
            );
            onUploadProgress?.(item.id, progress);
          }
        }, 100);
      };
      // Start simulated upload
      simulateUpload();
      // TODO: Replace with actual upload implementation
      // const formData = new FormData();
      // formData.append('file', item.file);
      // formData.append('conversationId', conversationId);
      // fetch('/api/communication/files/upload', {
      //   method: 'POST',
      //   body: formData,
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //   },
      // })
      // .then(response => response.json())
      // .then(result => {
      //   setUploadItems(prev =>
      //     prev.map(i =>
      //       i.id === item.id
      //         ? { ...i, progress: 100, status: 'completed' }
      //         : i
      //     )
      //   );
      //   resolve();
      // })
      // .catch(error => {
      //   setUploadItems(prev =>
      //     prev.map(i =>
      //       i.id === item.id
      //         ? { ...i, status: 'error', error: error.message }
      //         : i
      //     )
      //   );
      //   reject(error);
      // });
    });
  };
  // Remove file
  const removeFile = (itemId: string) => {
    setUploadItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };
  // Handle camera capture
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({  })
        video: { facingMode: 'environment' }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setShowCameraDialog(true);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
    }
  };
  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `photo-${Date.now()}.jpg`, {
                type: 'image/jpeg'}
              handleFileDrop([file]);
            }
          },
          'image/jpeg',
          0.8
        );
      }
      // Stop camera stream
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      setShowCameraDialog(false);
    }
  };
  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <PhotoLibrary />;
    if (file.type.startsWith('video/')) return <CameraAlt />;
    return <Description />;
  };
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  if (compact) {
    return (
      <div className="">
        {/* Compact upload button */}
        <Button
          
          startIcon={<Add />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          size="small"
          fullWidth
        >
          Add Files
        </Button>
        {/* File list */}
        {uploadItems.length > 0 && (
          <div className="">
            {uploadItems.map((item) => (
              <div
                key={item.id}
                className=""
              >
                {getFileIcon(item.file)}
                <div className="">
                  <div  noWrap>
                    {item.file.name}
                  </div>
                  {item.status === 'uploading' && (
                    <Progress
                      
                      size="small"
                    />
                  )}
                </div>
                <IconButton size="small" onClick={() => removeFile(item.id)}>
                  <Close />
                </IconButton>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handleFileDrop(files);}
            }
            e.target.value = '';
        />
      </div>
    );
  }
  return (
    <div className="">
      {/* Upload area */}
      <div
        {...getRootProps()}
        className=""
      >
        <input {...getInputProps()} />
        <CloudUpload
          className=""
        />
        <div  gutterBottom>
          {isDragActive ? 'Drop files here' : 'Upload Files'}
        </div>
        <div  color="text.secondary" className="">
          Drag and drop files here, or click to select files
        </div>
        {/* Action buttons */}
        <div
          className=""
        >
          <Button
            
            startIcon={<PhotoLibrary />}
            
            size="small"
          >
            Gallery
          </Button>
          {isTouchDevice && (
            <Button
              
              startIcon={<CameraAlt />}
              
              size="small"
            >
              Camera
            </Button>
          )}
        </div>
      </div>
      {/* Upload progress */}
      {isUploading && (
        <Alert severity="info" className="">
          <div >
            Uploading{' '}
            {uploadItems.filter((i) => i.status === 'uploading').length}{' '}
            file(s)...
          </div>
        </Alert>
      )}
      {/* File grid */}
      {uploadItems.length > 0 && (
        <div container spacing={2} className="">
          {uploadItems.map((item) => (
            <div item xs={6} sm={4} md={3} key={item.id}>
              <Card>
                {item.preview ? (
                  <CardMedia
                    component="img"
                    height="120"
                    image={item.preview}
                    alt={item.file.name}
                    className=""
                    
                  />
                ) : (
                  <div
                    className=""
                  >
                    {getFileIcon(item.file)}
                  </div>
                )}
                <CardContent className="">
                  <div  noWrap>
                    {item.file.name}
                  </div>
                  <div
                    
                    color="text.secondary"
                    display="block"
                  >
                    {formatFileSize(item.file.size)}
                  </div>
                  {/* Status indicator */}
                  <div
                    className=""
                  >
                    {item.status === 'uploading' && (
                      <>
                        <Progress
                          
                          className=""
                        />
                        <div >
                          {Math.round(item.progress)}%
                        </div>
                      </>
                    )}
                    {item.status === 'completed' && (
                      <Chip
                        icon={<CheckCircle />}
                        label="Uploaded"
                        size="small"
                        color="success"
                        
                      />
                    )}
                    {item.status === 'error' && (
                      <Chip
                        icon={<ErrorIcon />}
                        label="Failed"
                        size="small"
                        color="error"
                        
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => removeFile(item.id)}
                      className=""
                    >
                      <Delete />
                    </IconButton>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
      {/* Camera dialog */}
      <Dialog
        open={showCameraDialog}
        onClose={() => setShowCameraDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Take Photo</DialogTitle>
        <DialogContent>
          <video
            ref={videoRef}
            
            autoPlay
            playsInline
          />
          <canvas ref={canvasRef}  />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCameraDialog(false)}>Cancel</Button>
          <Button onClick={capturePhoto} >
            Capture
          </Button>
        </DialogActions>
      </Dialog>
      {/* Preview dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {previewFile?.file.name}
          <IconButton
            onClick={() => setShowPreview(false)}
            className=""
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewFile?.preview && (
            <img
              src={previewFile.preview}
              alt={previewFile.file.name}
              
            />
          )}
        </DialogContent>
      </Dialog>
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes.join(',')}
        
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            handleFileDrop(files);}
          }
          e.target.value = '';
      />
    </div>
  );
};
export default MobileFileUpload;
