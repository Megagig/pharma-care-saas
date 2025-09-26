import React, { useState } from 'react';
// Import components

// Import hooks and stores
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
// Import types

import DiagnosticFeatureGuard from '../middlewares/diagnosticFeatureGuard';
import { diagnosticApi } from '../api';
import { useDiagnosticStore } from '../store';
import type {
  DiagnosticRequest,
  DiagnosticResult,
  DiagnosticStore
} from '../types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && <div className="">{children}</div>}
    </div>
  );
};
interface ActionDialogProps {
  open: boolean;
  type: 'approve' | 'modify' | 'reject' | 'export' | 'referral';
  onClose: () => void;
  onConfirm: (data?: any) => void;
  loading?: boolean;
}
const ActionDialog: React.FC<ActionDialogProps> = ({
  open,
  type,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [referralData, setReferralData] = useState({
    specialty: '',
    urgency: 'routine' as 'immediate' | 'within_24h' | 'routine',
    reason: '',
    notes: '',
  });

  const handleConfirm = () => {
    switch (type) {
      case 'modify':
        onConfirm(inputValue);
        break;
      case 'reject':
        onConfirm(inputValue);
        break;
      case 'referral':
        onConfirm(referralData);
        break;
      default:
        onConfirm();
    }
    setInputValue('');
    setReferralData({
      specialty: '',
      urgency: 'routine',
      reason: '',
      notes: '',
    });
  };
  const getDialogContent = () => {
    switch (type) {
      case 'approve':
        return {
          title: 'Approve Diagnostic Result',
          content: (
            <div>
              Are you sure you want to approve this diagnostic result? This will
              mark it as reviewed and approved for clinical use.
            </div>
          ),
          confirmText: 'Approve',
          confirmColor: 'success' as const,
        };
      case 'modify':
        return {
          title: 'Modify Diagnostic Result',
          content: (
            <div>
              <div className="">
                Please provide your modifications to the diagnostic result:
              </div>
              <div className="space-y-2">
                <Label htmlFor="modifications">Modifications</Label>
                <Textarea
                  id="modifications"
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                  placeholder="Describe your modifications to the AI recommendations..."
                  rows={4}
                />
              </div>
            </div>
          ),
          confirmText: 'Save Modifications',
          confirmColor: 'primary' as const,
        };
      case 'reject':
        return {
          title: 'Reject Diagnostic Result',
          content: (
            <div>
              <div className="">
                Please provide a reason for rejecting this diagnostic result:
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                  placeholder="Explain why this result is being rejected..."
                  rows={4}
                  required
                />
              </div>
            </div>
          ),
          confirmText: 'Reject Result',
          confirmColor: 'error' as const,
        };
      case 'export':
        return {
          title: 'Export Diagnostic Report',
          content: (
            <div>
              This will generate a comprehensive diagnostic report including all
              analysis, recommendations, and pharmacist review notes.
            </div>
          ),
          confirmText: 'Export PDF',
          confirmColor: 'primary' as const,
        };
      case 'referral':
        return {
          title: 'Create Referral',
          content: (
            <div>
              <div className="">
                Create a referral based on this diagnostic analysis:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Input
                    id="specialty"
                    value={referralData.specialty}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setReferralData((prev) => ({
                        ...prev,
                        specialty: e.target.value
                      }))
                    }
                    placeholder="e.g., Cardiology, Endocrinology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={referralData.urgency} onValueChange={(value) =>
                    setReferralData((prev) => ({
                      ...prev,
                      urgency: value as 'immediate' | 'within_24h' | 'routine'
                    }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="within_24h">Within 24 Hours</SelectItem>
                      <SelectItem value="immediate">Immediate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Referral</Label>
                <Input
                  id="reason"
                  value={referralData.reason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setReferralData((prev) => ({
                      ...prev,
                      reason: e.target.value
                    }))
                  }
                  placeholder="Primary reason for specialist consultation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={referralData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReferralData((prev) => ({
                      ...prev,
                      notes: e.target.value
                    }))
                  }
                  placeholder="Additional clinical notes for the specialist"
                  rows={3}
                />
              </div>
            </div>
          ),
          confirmText: 'Create Referral',
          confirmColor: 'primary' as const,
        };
      default:
        return {
          title: 'Confirm Action',
          content: <div>Are you sure you want to proceed?</div>,
          confirmText: 'Confirm',
          confirmColor: 'primary' as const,
        };
    }
  };
  const { title, content, confirmText, confirmColor } = getDialogContent();
  const canConfirm = type === 'reject' ? inputValue.trim().length > 0 : true;
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {content}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={confirmColor === 'error' ? 'destructive' : confirmColor === 'success' ? 'default' : 'default'}
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
          >
            {loading && <Spinner className="h-4 w-4 mr-2" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
const ResultsReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'approve' | 'modify' | 'reject' | 'export' | 'referral';
  }>({
    open: false,
    type: 'approve',
  });

  // Use actual hooks from the store
  const {
    selectedRequest: request,
    selectedResult: result,
    loading: {
      fetchRequests: requestLoading,
      fetchResult: resultLoading,
      approveResult: approveLoading,
    },
    errors: {
      fetchRequests: requestError,
      fetchResult: resultError,
      approveResult: approveError,
    },
    fetchResult: refetchResult,
    approveResult: approveResultAction,
    modifyResult: modifyResultAction,
    rejectResult: rejectResultAction,
  } = useDiagnosticStore();

  // Mock patient data - in a real app this would come from a patient store
  const patients: any[] = [];
  const patient = patients.find((p) => p._id === request?.patientId);

  // Create mutation-like objects for consistency
  const approveMutation = {
    mutateAsync: async (id: string) => {
      const success = await approveResultAction(id);
      if (!success) throw new Error('Failed to approve result');
      return success;
    },
    isPending: approveLoading,
  };

  const modifyMutation = {
    mutateAsync: async (data: { resultId: string; modifications: string }) => {
      const success = await modifyResultAction(data.resultId, data.modifications);
      if (!success) throw new Error('Failed to modify result');
      return success;
    },
    isPending: approveLoading, // Using same loading state as approve
  };

  const rejectMutation = {
    mutateAsync: async (data: { resultId: string; rejectionReason: string }) => {
      const success = await rejectResultAction(data.resultId, data.rejectionReason);
      if (!success) throw new Error('Failed to reject result');
      return success;
    },
    isPending: approveLoading, // Using same loading state as approve
  };
  // Handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  const handleActionClick = (type: typeof actionDialog.type) => {
    setActionDialog({ open: true, type });
  };
  const handleActionConfirm = async (data?: any) => {
    if (!result) return;
    try {
      switch (actionDialog.type) {
        case 'approve':
          await approveMutation.mutateAsync(result._id);
          break;
        case 'modify':
          await modifyMutation.mutateAsync({
            resultId: result._id,
            modifications: data,
          });
          break;
        case 'reject':
          await rejectMutation.mutateAsync({
            resultId: result._id,
            rejectionReason: data,
          });
          break;
        case 'export':
          // Handle export logic
          console.log('Exporting report...');
          break;
        case 'referral':
          // Handle referral creation
          console.log('Creating referral...', data);
          break;
      }
      setActionDialog({ open: false, type: 'approve' });
      refetchResult();
    } catch (error) {
      console.error('Action failed:', error);
    }
  };
  const handleBack = () => {
    navigate('/pharmacy/diagnostics');
  };
  const handleCreateIntervention = () => {
    if (result) {
      navigate(
        `/clinical-interventions/create?diagnosticResultId=${result._id}`
      );
    }
  };
  // Loading state
  if (requestLoading || resultLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-12 w-12" />
        </div>
      </div>
    );
  }
  // Error state
  if (requestError || resultError || !request) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load diagnostic data. Please try again.
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }
  // Processing state
  if (request.status === 'processing') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Spinner className="h-16 w-16" />
            <div className="text-xl font-semibold">
              AI Analysis in Progress
            </div>
            <div className="text-muted-foreground text-center">
              Your diagnostic case is being analyzed. This typically takes 10-30
              seconds.
            </div>
            <div className="text-muted-foreground">
              Patient:{' '}
              {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // No result yet
  if (!result) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert>
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>
            Diagnostic analysis is not yet available for this case.
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }
  const isReviewed = result.pharmacistReview?.status !== undefined;
  const reviewStatus = result.pharmacistReview?.status;
  const ArrowBackIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  );

  const PrintIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
    </svg>
  );

  const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

  const ShareIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
  );

  const CancelIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );

  const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );

  const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  const HospitalIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
    </svg>
  );

  const AssignmentIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
    </svg>
  );

  const PersonIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );

  const ScienceIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
    </svg>
  );

  const MedicationIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  );

  const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  const TrendingUpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
    </svg>
  );

  const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

  const ConfidenceIndicator: React.FC<{ score: number }> = ({ score }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full"
        style={{ width: `${score * 100}%` }}
      ></div>
    </div>
  );

  const RedFlagAlerts: React.FC<{ redFlags: any[] }> = ({ redFlags }) => (
    <div className="space-y-2">
      {redFlags.map((flag, index) => (
        <div key={index} className="text-sm">{flag}</div>
      ))}
    </div>
  );

  const DiagnosticResultsPanel = ({ result, onApprove, onModify, onReject, loading }: {
    result: any;
    onApprove: () => void;
    onModify: (modifications: any) => void;
    onReject: (reason: any) => void;
    loading: boolean;
  }) => (
    <div className="p-4 border rounded-lg">Diagnostic Results Panel - {result?._id}</div>
  );

  const InteractionAlerts = ({ medications, allergies }: {
    medications: string[];
    allergies: string[];
  }) => (
    <div className="p-4 border rounded-lg">Interaction Alerts - {medications.length} medications, {allergies.length} allergies</div>
  );

  const PharmacistReviewPanel = ({ result, onApprove, onModify, onReject, loading }: {
    result: any;
    onApprove: () => void;
    onModify: (modifications: any) => void;
    onReject: (reason: any) => void;
    loading: boolean;
  }) => (
    <div className="p-4 border rounded-lg">Pharmacist Review Panel - {result?._id}</div>
  );

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowBackIcon />
              </Button>
              <div>
                <div className="text-2xl font-bold">
                  Diagnostic Results Review
                </div>
                <div className="text-muted-foreground">
                  {patient
                    ? `${patient.firstName} ${patient.lastName}`
                    : 'Unknown Patient'}{' '}
                  - Case ID: {request._id.slice(-8)}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => handleActionClick('export')}>
                    <PrintIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Print Report</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => handleActionClick('export')}>
                    <DownloadIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export PDF</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <ShareIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                Case {request.status}
              </Badge>
              {isReviewed && (
                <Badge variant={
                  reviewStatus === 'approved'
                    ? 'default'
                    : reviewStatus === 'modified'
                      ? 'secondary'
                      : 'destructive'
                }>
                  Review {reviewStatus}
                </Badge>
              )}
              <div className="text-muted-foreground text-sm">
                Analyzed{' '}
                {format(new Date(result.createdAt), 'MMM dd, yyyy HH:mm').toString()}
              </div>
            </div>
            {!isReviewed && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleActionClick('reject')}
                  disabled={rejectMutation.isPending}
                >
                  <CancelIcon className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleActionClick('modify')}
                  disabled={modifyMutation.isPending}
                >
                  <EditIcon className="mr-2 h-4 w-4" />
                  Modify
                </Button>
                <Button
                  onClick={() => handleActionClick('approve')}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircleIcon className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}
            {isReviewed && reviewStatus === 'approved' && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleActionClick('referral')}
                >
                  <HospitalIcon className="mr-2 h-4 w-4" />
                  Create Referral
                </Button>
                <Button
                  onClick={handleCreateIntervention}
                >
                  <AssignmentIcon className="mr-2 h-4 w-4" />
                  Create Intervention
                </Button>
              </div>
            )}
          </div>
          {/* Red Flags Alert */}
          {result.redFlags && result.redFlags.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Critical Red Flags Detected</AlertTitle>
              <AlertDescription>
                <RedFlagAlerts redFlags={result.redFlags} />
              </AlertDescription>
            </Alert>
          )}
          {/* Referral Recommendation */}
          {result.referralRecommendation?.recommended && (
            <Alert variant={result.referralRecommendation.urgency === 'immediate' ? 'destructive' : 'default'}>
              <AlertTitle>
                Referral Recommended -{' '}
                {result.referralRecommendation.urgency.replace('_', ' ')}
              </AlertTitle>
              <AlertDescription>
                {result.referralRecommendation.specialty}:{' '}
                {result.referralRecommendation.reason}
              </AlertDescription>
            </Alert>
          )}
          {/* Tabs */}
          <Card>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(Number(value))}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="0">Analysis Results</TabsTrigger>
                <TabsTrigger value="1">Case Details</TabsTrigger>
                <TabsTrigger value="2">Interactions</TabsTrigger>
                <TabsTrigger value="3">Review History</TabsTrigger>
              </TabsList>
              <TabsContent value="0" className="space-y-4">
                <DiagnosticResultsPanel
                  result={result}
                  onApprove={() => handleActionClick('approve')}
                  onModify={(modifications) => handleActionClick('modify')}
                  onReject={(reason) => handleActionClick('reject')}
                  loading={
                    approveMutation.isPending ||
                    modifyMutation.isPending ||
                    rejectMutation.isPending
                  }
                />
              </TabsContent>
              <TabsContent value="1" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PersonIcon />
                        Patient Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patient && (
                        <div className="space-y-2">
                          <div><strong>Name:</strong> {patient.firstName} {patient.lastName}</div>
                          <div><strong>DOB:</strong> {patient.dateOfBirth}</div>
                          <div><strong>Gender:</strong> {patient.gender}</div>
                          <div><strong>Phone:</strong> {patient.phoneNumber}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {/* Case Input Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ScienceIcon />
                        Case Input Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div><strong>Primary Symptoms:</strong></div>
                        <div>{request.inputSnapshot.symptoms.subjective.join(', ')}</div>
                        <div><strong>Duration:</strong> {request.inputSnapshot.symptoms.duration}</div>
                        <div><strong>Severity:</strong> {request.inputSnapshot.symptoms.severity}</div>
                        <div><strong>Onset:</strong> {request.inputSnapshot.symptoms.onset}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Medications */}
                {request.inputSnapshot.currentMedications &&
                  request.inputSnapshot.currentMedications.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MedicationIcon />
                          Current Medications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {request.inputSnapshot.currentMedications.map(
                            (med: any, index: number) => (
                              <div key={index} className="flex justify-between">
                                <span>{med.name}</span>
                                <span className="text-muted-foreground">{med.dosage} - {med.frequency}</span>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                {/* Allergies */}
                {request.inputSnapshot.allergies &&
                  request.inputSnapshot.allergies.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <WarningIcon />
                          Known Allergies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {request.inputSnapshot.allergies.map(
                            (allergy: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {allergy}
                              </Badge>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>
              <TabsContent value="2" className="space-y-4">
                <InteractionAlerts
                  medications={result.medicationSuggestions.map(
                    (med: any) => med.drugName
                  )}
                  allergies={request.inputSnapshot.allergies || []}
                />
              </TabsContent>
              <TabsContent value="3" className="space-y-4">
                <PharmacistReviewPanel
                  result={result}
                  onApprove={() => handleActionClick('approve')}
                  onModify={(modifications) => handleActionClick('modify')}
                  onReject={(reason) => handleActionClick('reject')}
                  loading={
                    approveMutation.isPending ||
                    modifyMutation.isPending ||
                    rejectMutation.isPending
                  }
                />
              </TabsContent>
            </Tabs>
          </Card>
          {/* AI Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon />
                AI Analysis Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Model:</div>
                  <div className="font-medium">
                    {result.aiMetadata.modelId} v{result.aiMetadata.modelVersion}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Confidence Score:</div>
                  <div className="space-y-1">
                    <ConfidenceIndicator
                      score={result.aiMetadata.confidenceScore}
                    />
                    <div className="text-sm font-medium">
                      {Math.round(result.aiMetadata.confidenceScore * 100)}%
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Processing Time:</div>
                  <div className="font-medium">
                    {result.aiMetadata.processingTime}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tokens Used:</div>
                  <div className="font-medium">
                    {result.aiMetadata.tokenUsage.totalTokens}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Action Dialog */}
          <ActionDialog
            open={actionDialog.open}
            type={actionDialog.type}
            onClose={() => setActionDialog({ open: false, type: 'approve' })}
            onConfirm={handleActionConfirm}
            loading={
              approveMutation.isPending ||
              modifyMutation.isPending ||
              rejectMutation.isPending
            }
          />
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
};
// Wrap with feature guard
const ResultsReviewPageWithGuard: React.FC = () => (
  <DiagnosticFeatureGuard>
    <ResultsReviewPage />
  </DiagnosticFeatureGuard>
);
export default ResultsReviewPageWithGuard;
