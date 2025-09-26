import React, { useState, useEffect, useCallback } from 'react';

import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Simple Timeline components
const Timeline = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-8">{children}</div>
);

const TimelineItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-4">{children}</div>
);

const TimelineSeparator = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center">{children}</div>
);

const TimelineDot = ({
  children,
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-300 text-gray-600';
    }
  };

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getVariantClasses()}`}>
      {children}
    </div>
  );
};

const TimelineConnector = () => (
  <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
);

const TimelineContent = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-1 pb-8">{children}</div>
);

import { useUIStore } from '@/stores';
import useAuth from '@/hooks/useAuth';

import { CheckIcon, AlertTriangle, X, Upload, Eye, Trash2 } from 'lucide-react';

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

const VisuallyHiddenInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="absolute bottom-0 left-0 h-px w-px overflow-hidden"
    style={{
      clip: 'rect(0 0 0 0)',
      clipPath: 'inset(50%)',
    }}
  />
);

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
  const addNotification = useUIStore((state: any) => state.addNotification);

  const loadLicenseStatus = useCallback(async () => {
    try {
      const response = await axios.get('/api/license/status', {
        withCredentials: true
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
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

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
            duration: 5000
          });
        }
      }
    } catch (error) {
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
          duration: 5000
        });
        return;
      }
      if (file.size > maxSize) {
        addNotification({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 5MB',
          duration: 5000
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
        duration: 5000
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
          duration: 5000
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
        duration: 5000
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
          duration: 5000
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
        duration: 5000
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
        return <CheckIcon className="h-4 w-4" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
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
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              License verification is not required for your current role.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">License Verification</h1>
        <p className="text-muted-foreground">
          As a {user?.role?.replace('_', ' ')}, you need to verify your pharmacist
          license to access all features.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Timeline>
            {/* Step 1: License Number */}
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot variant={activeStep >= 0 ? 'primary' : 'default'}>
                  {activeStep >= 0 && <span className="text-xs">1</span>}
                </TimelineDot>
                {activeStep < 3 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Enter License Number</h3>
                  <div className="space-y-2">
                    <Input
                      value={licenseNumber}
                      onChange={(e) =>
                        setLicenseNumber(e.target.value.toUpperCase())
                      }
                      placeholder="e.g., PCN123456"
                      disabled={licenseInfo?.status === 'approved'}
                    />
                    <div className="text-sm text-muted-foreground">
                      {validatingNumber
                        ? 'Validating...'
                        : numberValid === false
                          ? 'This license number is already registered'
                          : numberValid === true
                            ? 'License number is available'
                            : 'Enter your pharmacist license number'}
                    </div>
                  </div>
                  <Button
                    onClick={() => setActiveStep(1)}
                    disabled={
                      !licenseNumber || numberValid === false || validatingNumber
                    }
                  >
                    Continue
                  </Button>
                </div>
              </TimelineContent>
            </TimelineItem>

            {/* Step 2: Upload Document */}
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot variant={activeStep >= 1 ? 'primary' : 'default'}>
                  {activeStep >= 1 && <span className="text-xs">2</span>}
                </TimelineDot>
                {activeStep < 3 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Upload License Document</h3>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>
                      Upload a clear photo or PDF of your pharmacist license.
                      Accepted formats: JPEG, PNG, WebP, PDF (max 5MB)
                    </AlertDescription>
                  </Alert>

                  {selectedFile ? (
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('license-file-input')?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Select License Document
                      </Button>
                      <VisuallyHiddenInput
                        id="license-file-input"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                      />
                    </div>
                  )}

                  {uploading && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Uploading...</div>
                      <Progress value={75} />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveStep(0)}>
                      Back
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                    >
                      Upload Document
                    </Button>
                  </div>
                </div>
              </TimelineContent>
            </TimelineItem>

            {/* Step 3: Under Review */}
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot variant={activeStep >= 2 ? 'primary' : 'default'}>
                  {activeStep >= 2 && <span className="text-xs">3</span>}
                </TimelineDot>
                {activeStep < 3 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Under Review</h3>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Review in Progress</AlertTitle>
                    <AlertDescription>
                      Your license is currently being reviewed by our team. This
                      usually takes 1-2 business days.
                    </AlertDescription>
                  </Alert>

                  {licenseInfo?.hasDocument && (
                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div>
                        <div className="font-medium">
                          License Number: {licenseInfo.licenseNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Uploaded:{' '}
                          {licenseInfo.documentInfo &&
                            new Date(
                              licenseInfo.documentInfo.uploadedAt
                            ).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewOpen(true)}
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleDeleteDocument}
                          title="Delete Document"
                          disabled={licenseInfo.status === 'approved'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {licenseInfo?.status === 'rejected' && (
                    <Alert variant="destructive">
                      <X className="h-4 w-4" />
                      <AlertTitle>License Rejected</AlertTitle>
                      <AlertDescription>
                        Reason: {licenseInfo.rejectionReason}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TimelineContent>
            </TimelineItem>

            {/* Step 4: Verification Complete */}
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot variant={activeStep >= 3 ? 'success' : 'default'}>
                  {activeStep >= 3 && <CheckIcon className="h-4 w-4" />}
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Verification Complete</h3>
                  <Alert>
                    <CheckIcon className="h-4 w-4" />
                    <AlertTitle>License Verified Successfully!</AlertTitle>
                    <AlertDescription>
                      Your pharmacist license has been approved. You now have
                      access to all features.
                    </AlertDescription>
                  </Alert>
                </div>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </CardContent>
      </Card>

      {/* Current Status Card */}
      {licenseInfo && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Current Status</div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(licenseInfo.status) === 'success' ? 'bg-green-100 text-green-800' :
                getStatusColor(licenseInfo.status) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  getStatusColor(licenseInfo.status) === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                {getStatusIcon(licenseInfo.status)}
                <span className="ml-1">{licenseInfo.status.toUpperCase()}</span>
              </div>
            </div>
            {licenseInfo.licenseNumber && (
              <div className="text-sm text-muted-foreground">
                License Number: {licenseInfo.licenseNumber}
              </div>
            )}
            {licenseInfo.verifiedAt && (
              <div className="text-sm text-muted-foreground">
                Verified:{' '}
                {new Date(licenseInfo.verifiedAt).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>License Document</DialogTitle>
          <div className="mt-4">
            <iframe
              src={`/api/license/document/${user?.id}`}
              width="100%"
              height="400px"
              className="border rounded-md"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicenseUpload;
