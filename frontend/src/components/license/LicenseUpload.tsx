import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUpload';
import CheckIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewIcon from '@mui/icons-material/Visibility';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores';
import LoadingSpinner from '../LoadingSpinner';

interface LicenseInfo {
  licenseNumber?: string;
  status: string;
  hasDocument: boolean;
  documentInfo?: {
    fileName: string;
    uploadedAt: string;
    fileSize: number;
  };
  verifiedAt?: string;
  rejectionReason?: string;
  requiresLicense: boolean;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const LicenseUpload: React.FC = () => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [validatingNumber, setValidatingNumber] = useState(false);
  const [numberValid, setNumberValid] = useState<boolean | null>(null);

  const { user } = useAuth();
  const addNotification = useUIStore((state) => state.addNotification);

  const loadLicenseStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/license/status', {
        withCredentials: true,
      });

      if (response.status === 200) {
        const data = response.data;
        setLicenseInfo(data.data);

        if (data.data.licenseNumber) {
          setLicenseNumber(data.data.licenseNumber);
        }

        // Set active step based on current status
        if (data.data.status === 'pending') {
          setActiveStep(2);
        } else if (data.data.status === 'approved') {
          setActiveStep(3);
        } else if (data.data.hasDocument) {
          setActiveStep(1);
        }
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load license status',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification, setLicenseNumber, setLicenseInfo, setActiveStep]);

  const validateLicenseNumber = useCallback(async () => {
    setValidatingNumber(true);
    try {
      const response = await axios.post(
        '/api/license/validate-number',
        {
          licenseNumber,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const data = response.data;
        setNumberValid(data.data.isAvailable);

        if (!data.data.isAvailable) {
          addNotification({
            type: 'warning',
            title: 'License Already Registered',
            message: data.data.message,
            duration: 5000,
          });
        }
      }
    } catch {
      setNumberValid(false);
    } finally {
      setValidatingNumber(false);
    }
  }, [licenseNumber, addNotification]);

  // Set up effect hooks to run functions on mount and when dependencies change
  useEffect(() => {
    loadLicenseStatus();
  }, [loadLicenseStatus]);

  useEffect(() => {
    if (licenseNumber.length >= 6) {
      validateLicenseNumber();
    } else {
      setNumberValid(null);
    }
  }, [licenseNumber, validateLicenseNumber]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        addNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please upload a JPEG, PNG, WebP, or PDF file',
          duration: 5000,
        });
        return;
      }

      if (file.size > maxSize) {
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 5MB',
          duration: 5000,
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !licenseNumber || numberValid === false) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide a valid license number and select a file',
        duration: 5000,
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('licenseDocument', selectedFile);
      formData.append('licenseNumber', licenseNumber);

      const response = await axios.post('/api/license/upload', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        addNotification({
          type: 'success',
          title: 'Upload Successful',
          message: 'Your license has been submitted for review',
          duration: 5000,
        });

        setActiveStep(2);
        loadLicenseStatus();
        setSelectedFile(null);
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message:
          (error as Error).message || 'Failed to upload license document',
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async () => {
    try {
      const response = await axios.delete('/api/license/document', {
        withCredentials: true,
      });

      if (response.status === 200) {
        addNotification({
          type: 'success',
          title: 'Document Deleted',
          message: 'License document has been removed',
          duration: 5000,
        });

        loadLicenseStatus();
        setActiveStep(0);
        setLicenseNumber('');
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete license document',
        duration: 5000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status) {
      case 'approved':
        return <CheckIcon />;
      case 'pending':
        return <WarningIcon />;
      case 'rejected':
        return <ErrorIcon />;
      default:
        return undefined;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading license information..." />;
  }

  if (!licenseInfo?.requiresLicense) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            License verification is not required for your current role.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        License Verification
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        As a {user?.role?.replace('_', ' ')}, you need to verify your pharmacist
        license to access all features.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: License Number */}
            <Step>
              <StepLabel>Enter License Number</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Pharmacist License Number"
                    value={licenseNumber}
                    onChange={(e) =>
                      setLicenseNumber(e.target.value.toUpperCase())
                    }
                    placeholder="e.g., PCN123456"
                    disabled={licenseInfo?.status === 'approved'}
                    error={numberValid === false}
                    helperText={
                      validatingNumber
                        ? 'Validating...'
                        : numberValid === false
                        ? 'This license number is already registered'
                        : numberValid === true
                        ? 'License number is available'
                        : 'Enter your pharmacist license number'
                    }
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  disabled={
                    !licenseNumber || numberValid === false || validatingNumber
                  }
                >
                  Continue
                </Button>
              </StepContent>
            </Step>

            {/* Step 2: Upload Document */}
            <Step>
              <StepLabel>Upload License Document</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Upload a clear photo or PDF of your pharmacist license.
                    Accepted formats: JPEG, PNG, WebP, PDF (max 5MB)
                  </Alert>

                  {selectedFile ? (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography variant="body2">
                            {selectedFile.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                        <IconButton onClick={() => setSelectedFile(null)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  ) : (
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Select License Document
                      <VisuallyHiddenInput
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                      />
                    </Button>
                  )}

                  {uploading && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Uploading...
                      </Typography>
                      <LinearProgress />
                    </Box>
                  )}
                </Box>

                <Box display="flex" gap={1}>
                  <Button onClick={() => setActiveStep(0)}>Back</Button>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                  >
                    Upload Document
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Under Review */}
            <Step>
              <StepLabel>Under Review</StepLabel>
              <StepContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Your license is currently being reviewed by our team. This
                  usually takes 1-2 business days.
                </Alert>

                {licenseInfo?.hasDocument && (
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography variant="body2">
                          License Number: {licenseInfo.licenseNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Uploaded:{' '}
                          {licenseInfo.documentInfo &&
                            new Date(
                              licenseInfo.documentInfo.uploadedAt
                            ).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <IconButton
                          onClick={() => setPreviewOpen(true)}
                          title="View Document"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          onClick={handleDeleteDocument}
                          title="Delete Document"
                          disabled={licenseInfo.status === 'approved'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                )}

                {licenseInfo?.status === 'rejected' && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      License Rejected
                    </Typography>
                    <Typography variant="body2">
                      Reason: {licenseInfo.rejectionReason}
                    </Typography>
                  </Alert>
                )}
              </StepContent>
            </Step>

            {/* Step 4: Verification Complete */}
            <Step>
              <StepLabel>Verification Complete</StepLabel>
              <StepContent>
                <Alert severity="success">
                  <Typography variant="subtitle2" gutterBottom>
                    License Verified Successfully!
                  </Typography>
                  <Typography variant="body2">
                    Your pharmacist license has been approved. You now have
                    access to all features.
                  </Typography>
                </Alert>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Current Status Card */}
      {licenseInfo && (
        <Card>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="between"
              mb={2}
            >
              <Typography variant="h6">Current Status</Typography>
              <Chip
                {...(getStatusIcon(licenseInfo.status) && {
                  icon: getStatusIcon(licenseInfo.status),
                })}
                label={licenseInfo.status.toUpperCase()}
                color={
                  getStatusColor(licenseInfo.status) as
                    | 'default'
                    | 'primary'
                    | 'secondary'
                    | 'error'
                    | 'info'
                    | 'success'
                    | 'warning'
                }
              />
            </Box>

            {licenseInfo.licenseNumber && (
              <Typography variant="body2" color="text.secondary">
                License Number: {licenseInfo.licenseNumber}
              </Typography>
            )}

            {licenseInfo.verifiedAt && (
              <Typography variant="body2" color="text.secondary">
                Verified:{' '}
                {new Date(licenseInfo.verifiedAt).toLocaleDateString()}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>License Document</DialogTitle>
        <DialogContent>
          <iframe
            src={`/api/license/document/${user?.id}`}
            width="100%"
            height="400px"
            style={{ border: 'none' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LicenseUpload;
