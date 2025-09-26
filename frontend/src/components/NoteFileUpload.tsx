import clinicalNoteService from '../services/clinicalNoteService';
import { useState, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Placeholder icons - replace with actual imports
const ImageIcon = () => <div>🖼️</div>;
const PdfIcon = () => <div>📄</div>;
const DocIcon = () => <div>📝</div>;
const FileIcon = () => <div>📁</div>;
const UploadIcon = ({ className }: { className?: string }) => <div className={className}>⬆️</div>;
const ViewIcon = () => <div>👁️</div>;
const DownloadIcon = ({ className }: { className?: string }) => <div className={className}>⬇️</div>;
const DeleteIcon = () => <div>🗑️</div>;
const IconButton = ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className="p-1 rounded hover:bg-gray-100">
    {children}
  </button>
);
const Chip = ({ label, color }: { label: string; color?: string }) => (
  <span className={`px-2 py-1 text-xs rounded-full ${color === 'success' ? 'bg-green-100 text-green-800' : color === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
    {label}
  </span>
);
const CardMedia = ({ component, height, image, alt, className, onClick }: { component: string; height: number; image: string; alt: string; className?: string; onClick?: () => void }) => (
  <img src={image} alt={alt} height={height} className={className} onClick={onClick} />
);
const CardActions = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

interface Attachment {
  _id: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File; // For local files before upload
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface NoteFileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onAttachmentDeleted?: (attachmentId: string) => void;
  existingAttachments?: Attachment[];
  noteId?: string; // For existing notes
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  disabled?: boolean;
  showPreview?: boolean;
}

const NoteFileUpload: React.FC<NoteFileUploadProps> = ({
  onFilesUploaded,
  onAttachmentDeleted,
  existingAttachments = [],
  noteId,
  maxFiles = 5,
  acceptedTypes = [
    'image/*',
    'application/pdf',
    '.doc',
    '.docx',
    '.txt',
    '.csv',
  ],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  showPreview = true
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<UploadedFile | Attachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <PdfIcon />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <DocIcon />;
    return <FileIcon />;
  };

  const isImageFile = (mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  };

  const isPdfFile = (mimeType: string): boolean => {
    return mimeType === 'application/pdf';
  };

  const canPreview = (mimeType: string): boolean => {
    return isImageFile(mimeType) || isPdfFile(mimeType) || mimeType === 'text/plain';
  };

  const showSnackbar = (message: string) => {
    toast.success(message);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)}`;
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    const isValidType = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });

    if (!isValidType) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList) => {
      setError(null);

      const totalFiles = files.length + existingAttachments.length + selectedFiles.length;
      if (totalFiles > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(selectedFiles).forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }

      if (validFiles.length === 0) return;

      setUploading(true);
      setUploadProgress(0);

      try {
        if (noteId) {
          // Upload to existing note
          const response = await clinicalNoteService.uploadAttachment(noteId, validFiles);

          // Convert API response to UploadedFile format
          const uploadedFiles: UploadedFile[] = response.attachments.map((att) => ({
            id: att._id,
            name: att.originalName,
            size: att.size,
            type: att.mimeType,
            url: att.url,
            uploadStatus: 'completed' as const
          }));

          const newFiles = [...files, ...uploadedFiles];
          setFiles(newFiles);
          onFilesUploaded(newFiles);
          showSnackbar(`Successfully uploaded ${validFiles.length} file(s)`);
        } else {
          // For new notes, store files locally until note is created
          const localFiles: UploadedFile[] = validFiles.map((file, i) => ({
            id: `local-${Date.now()}-${i}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            file,
            uploadStatus: 'pending' as const
          }));

          const newFiles = [...files, ...localFiles];
          setFiles(newFiles);
          onFilesUploaded(newFiles);
          showSnackbar(`Added ${validFiles.length} file(s) for upload`);
        }
      } catch (error: any) {
        setError(error.message || 'Failed to upload files. Please try again.');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [files, existingAttachments, maxFiles, maxFileSize, acceptedTypes, onFilesUploaded, noteId]
  );

  const handleFileRemove = (fileId: string) => {
    const updatedFiles = files.filter((file) => file.id !== fileId);
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    if (!noteId) return;

    try {
      await clinicalNoteService.deleteAttachment(noteId, attachmentId);
      onAttachmentDeleted?.(attachmentId);
      showSnackbar('Attachment deleted successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to delete attachment');
    }
  };

  const handleAttachmentDownload = async (attachment: Attachment) => {
    if (!noteId) return;

    try {
      const blob = await clinicalNoteService.downloadAttachment(noteId, attachment._id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSnackbar('Download started');
    } catch (error: any) {
      setError(error.message || 'Failed to download attachment');
    }
  };

  const handlePreviewFile = (file: UploadedFile | Attachment) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleDeleteConfirm = (fileId: string, isAttachment: boolean = false) => {
    setFileToDelete(fileId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      // Check if it's an existing attachment or local file
      const isExistingAttachment = existingAttachments.some((att) => att._id === fileToDelete);

      if (isExistingAttachment) {
        await handleAttachmentDelete(fileToDelete);
      } else {
        handleFileRemove(fileToDelete);
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to delete file');
    } finally {
      setDeleteConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || uploading) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFileSelect(droppedFiles);
      }
    },
    [disabled, uploading, handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const totalFiles = files.length + existingAttachments.length;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload-input"
          disabled={disabled || uploading}
        />

        <label htmlFor="file-upload-input" className="cursor-pointer">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium mb-2">
            {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </div>
          <div className="text-sm text-gray-500 mb-1">
            Maximum {maxFiles} files, up to {formatFileSize(maxFileSize)} each
          </div>
          <div className="text-sm text-gray-500">
            Supported: {acceptedTypes.join(', ')}
          </div>
        </label>

        {uploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
            <div className="text-sm text-gray-600 mt-1">
              {Math.round(uploadProgress)}% uploaded
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div>
          <div className="text-lg font-medium mb-4">
            Existing Attachments ({existingAttachments.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingAttachments.map((attachment) => (
              <Card key={attachment._id} className="overflow-hidden">
                {isImageFile(attachment.mimeType) && showPreview && (
                  <CardMedia
                    component="img"
                    height={120}
                    image={attachment.url}
                    alt={attachment.originalName}
                    className="w-full h-32 object-cover cursor-pointer"
                    onClick={() => handlePreviewFile(attachment)}
                  />
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getFileIcon(attachment.mimeType)}
                    <div className="font-medium truncate" title={attachment.originalName}>
                      {attachment.originalName}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {formatFileSize(attachment.size)}
                  </div>
                  <Chip label={attachment.mimeType} />
                </CardContent>
                <CardActions className="p-4 pt-0 flex justify-between">
                  <div className="flex gap-2">
                    {canPreview(attachment.mimeType) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              onClick={() => handlePreviewFile(attachment)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconButton
                            onClick={() => handleAttachmentDownload(attachment)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          onClick={() => handleDeleteConfirm(attachment._id, true)}
                          disabled={disabled}
                          className="text-red-600 hover:text-red-700"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardActions>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* New Files */}
      {files.length > 0 && (
        <div>
          <div className="text-lg font-medium mb-4">
            New Files ({files.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="overflow-hidden">
                {isImageFile(file.type) && showPreview && file.url && (
                  <CardMedia
                    component="img"
                    height={120}
                    image={file.url}
                    alt={file.name}
                    className="w-full h-32 object-cover cursor-pointer"
                    onClick={() => handlePreviewFile(file)}
                  />
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getFileIcon(file.type)}
                    <div className="font-medium truncate" title={file.name}>
                      {file.name}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {formatFileSize(file.size)}
                  </div>
                  <Chip label={file.type} />
                  {file.uploadStatus && (
                    <div className="flex items-center gap-2 mt-2">
                      {file.uploadStatus === 'uploading' && (
                        <div className="animate-spin">⏳</div>
                      )}
                      <Chip
                        label={file.uploadStatus}
                        color={
                          file.uploadStatus === 'completed'
                            ? 'success'
                            : file.uploadStatus === 'error'
                              ? 'error'
                              : undefined
                        }
                      />
                    </div>
                  )}
                </CardContent>
                <CardActions className="p-4 pt-0 flex justify-between">
                  <div className="flex gap-2">
                    {canPreview(file.type) && file.url && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              onClick={() => handlePreviewFile(file)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          onClick={() => handleDeleteConfirm(file.id)}
                          disabled={disabled || uploading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent>Remove</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardActions>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!uploading && totalFiles < maxFiles && (
        <Button
          disabled={disabled}
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="w-4 h-4 mr-2" />
          Add More Files
        </Button>
      )}

      {/* File Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {'originalName' in (previewFile || {})
                ? (previewFile as Attachment).originalName
                : (previewFile as UploadedFile)?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {previewFile && (
              <div className="text-center">
                {isImageFile(
                  'mimeType' in previewFile
                    ? previewFile.mimeType
                    : previewFile.type
                ) ? (
                  <img
                    src={'url' in previewFile ? previewFile.url : previewFile.url}
                    alt={
                      'originalName' in previewFile
                        ? previewFile.originalName
                        : previewFile.name
                    }
                    className="max-w-full max-h-[60vh] mx-auto"
                  />
                ) : isPdfFile(
                  'mimeType' in previewFile
                    ? previewFile.mimeType
                    : previewFile.type
                ) ? (
                  <iframe
                    src={'url' in previewFile ? previewFile.url : previewFile.url}
                    width="100%"
                    height="500px"
                    title="PDF Preview"
                    className="border rounded"
                  />
                ) : (
                  <div className="text-gray-500">
                    Preview not available for this file type
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {'_id' in (previewFile || {}) && (
              <Button
                onClick={() => handleAttachmentDownload(previewFile as Attachment)}
                variant="outline"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p>
              Are you sure you want to delete this file? This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeleteConfirmOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoteFileUpload;
