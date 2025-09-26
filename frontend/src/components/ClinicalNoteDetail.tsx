import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Home as HomeIcon,
  FileText as NoteIcon,
  ArrowLeft,
  Edit,
  Delete,
  Download,
  Paperclip as AttachFileIcon,
  History,
  ChevronDown as ExpandMoreIcon,
  ChevronUp as ExpandLessIcon,
  User as PersonIcon,
  FileText as AssignmentIcon,
  Stethoscope as MedicalInformationIcon,
  Eye as VisibilityIcon,
  ClipboardList as AssessmentIcon,
  FileCheck as PlanIcon,
  Calendar as CalendarIcon,
  Clock as ScheduleIcon,
  Shield as SecurityIcon,
  ChevronLeft
} from 'lucide-react';

import ClinicalNoteForm from './ClinicalNoteForm';
import LoadingSpinner from './LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useClinicalNote, useEnhancedClinicalNoteStore } from '@/hooks/useClinicalNotes';
import { useTheme } from '@/hooks/useTheme';

// Types
interface ClinicalNote {
  _id: string;
  title: string;
  type: string;
  priority: string;
  isConfidential: boolean;
  followUpRequired: boolean;
  followUpDate?: string;
  content: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  vitalSigns?: VitalSigns;
  laborResults?: LabResult[];
  recommendations?: string[];
  attachments?: Attachment[];
  patient: {
    firstName: string;
    lastName: string;
    mrn: string;
  };
  pharmacist: {
    firstName: string;
    lastName: string;
    role: string;
    _id: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  tags?: string[];
}

interface VitalSigns {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
}

interface LabResult {
  test: string;
  result: string;
  normalRange: string;
  date: string;
  status: 'normal' | 'abnormal' | 'critical';
}

interface Attachment {
  _id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Constants
const NOTE_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'discharge', label: 'Discharge' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'admission', label: 'Admission' },
  { value: 'other', label: 'Other' },
];

const NOTE_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface ClinicalNoteDetailProps {
  noteId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  readonly?: boolean;
  embedded?: boolean;
}

const ClinicalNoteDetail: React.FC<ClinicalNoteDetailProps> = ({
  noteId: propNoteId,
  onEdit,
  onDelete,
  readonly = false,
  embedded = false
}) => {
  const { id: paramNoteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use prop noteId or param noteId
  const noteId = propNoteId || paramNoteId;

  // Local state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    content: true,
    vitals: false,
    labs: false,
    attachments: false,
    recommendations: false,
  });

  // Store actions
  const { deleteNote, downloadAttachment, deleteAttachment, loading, errors } =
    useEnhancedClinicalNoteStore();

  // Fetch note data
  const { data, isLoading, error, refetch } = useClinicalNote(noteId || '');
  const note = data?.note;

  // Handle navigation
  const handleBack = () => {
    if (embedded) return;
    navigate('/notes');
  };

  // Handle edit
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setIsEditModalOpen(true);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!note) return;
    try {
      const success = await deleteNote(note._id);
      if (success) {
        toast.success('Note deleted successfully');
        if (onDelete) {
          onDelete();
        } else if (!embedded) {
          navigate('/notes');
        }
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
    setIsDeleteDialogOpen(false);
  };

  // Handle attachment download
  const handleDownloadAttachment = async (attachment: Attachment) => {
    if (!note) return;
    try {
      await downloadAttachment(note._id, attachment._id);
    } catch (error) {
      toast.error('Failed to download attachment');
    }
  };

  // Handle attachment delete
  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!note) return;
    try {
      const success = await deleteAttachment(note._id, attachment._id);
      if (success) {
        toast.success('Attachment deleted successfully');
        refetch(); // Refresh note data
      }
    } catch (error) {
      toast.error('Failed to delete attachment');
    }
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Format functions
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatPatientName = (patient: ClinicalNote['patient']) => {
    return `${patient.firstName} ${patient.lastName}`;
  };

  const formatPharmacistName = (pharmacist: ClinicalNote['pharmacist']) => {
    return `${pharmacist.firstName} ${pharmacist.lastName}`;
  };

  // Get type and priority info
  const getTypeInfo = (type: ClinicalNote['type']) => {
    return NOTE_TYPES.find((t) => t.value === type);
  };

  const getPriorityInfo = (priority: ClinicalNote['priority']) => {
    return NOTE_PRIORITIES.find((p) => p.value === priority);
  };

  // Check permissions
  const canEdit =
    !readonly &&
    note &&
    user &&
    (note.pharmacist._id === user.id ||
      user.role === 'admin' ||
      user.role === 'super_admin');

  const canDelete =
    !readonly &&
    note &&
    user &&
    (note.pharmacist._id === user.id ||
      user.role === 'admin' ||
      user.role === 'super_admin');

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error || !note) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error ? 'Failed to load clinical note' : 'Clinical note not found'}
            </AlertDescription>
          </Alert>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error
              ? 'Please try again later'
              : 'The requested note may have been deleted or you may not have permission to view it'}
          </p>
          {!embedded && (
            <Button onClick={handleBack}>
              Back to Notes
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const typeInfo = getTypeInfo(note.type);
  const priorityInfo = getPriorityInfo(note.priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      {!embedded && (
        <div className="mb-6">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                  <Link
                    to="/notes"
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Clinical Notes
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                  <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {note.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {note.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {typeInfo?.label || note.type}
                </Badge>
                <Badge variant={note.priority === 'urgent' ? 'destructive' :
                  note.priority === 'high' ? 'destructive' :
                    note.priority === 'medium' ? 'default' : 'secondary'}>
                  {priorityInfo?.label || note.priority}
                </Badge>
                {note.isConfidential && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    <SecurityIcon className="h-3 w-3 mr-1" />
                    Confidential
                  </Badge>
                )}
                {note.followUpRequired && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <ScheduleIcon className="h-3 w-3 mr-1" />
                    Follow-up Required
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!embedded && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              {canEdit && (
                <Button
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Delete className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient and Clinician Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PersonIcon className="h-5 w-5" />
                Patient & Clinician Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Patient
                  </h3>
                  <p className="font-medium">{formatPatientName(note.patient)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    MRN: {note.patient.mrn}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Pharmacist
                  </h3>
                  <p className="font-medium">{formatPharmacistName(note.pharmacist)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Role: {note.pharmacist.role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SOAP Note Content */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <AssignmentIcon className="h-5 w-5" />
                  SOAP Note Content
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('content')}
                  className="p-1 h-8 w-8"
                >
                  {expandedSections.content ? (
                    <ExpandLessIcon className="h-4 w-4" />
                  ) : (
                    <ExpandMoreIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {expandedSections.content && (
                <div className="space-y-4">
                  {note.content.subjective && (
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <MedicalInformationIcon className="h-4 w-4" />
                        Subjective
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {note.content.subjective}
                        </p>
                      </div>
                    </div>
                  )}

                  {note.content.objective && (
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <VisibilityIcon className="h-4 w-4" />
                        Objective
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {note.content.objective}
                        </p>
                      </div>
                    </div>
                  )}

                  {note.content.assessment && (
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <AssessmentIcon className="h-4 w-4" />
                        Assessment
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {note.content.assessment}
                        </p>
                      </div>
                    </div>
                  )}

                  {note.content.plan && (
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <PlanIcon className="h-4 w-4" />
                        Plan
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {note.content.plan}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vital Signs */}
          {note.vitalSigns && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Vital Signs</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('vitals')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.vitals ? (
                      <ExpandLessIcon className="h-4 w-4" />
                    ) : (
                      <ExpandMoreIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expandedSections.vitals && (
                  <VitalSignsDisplay vitalSigns={note.vitalSigns} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Lab Results */}
          {note.laborResults && note.laborResults.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Laboratory Results</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('labs')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.labs ? (
                      <ExpandLessIcon className="h-4 w-4" />
                    ) : (
                      <ExpandMoreIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expandedSections.labs && (
                  <LabResultsDisplay labResults={note.laborResults} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {note.recommendations && note.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recommendations</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('recommendations')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.recommendations ? (
                      <ExpandLessIcon className="h-4 w-4" />
                    ) : (
                      <ExpandMoreIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expandedSections.recommendations && (
                  <ul className="space-y-2">
                    {note.recommendations.map((recommendation: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2 mr-2"></span>
                        <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Note Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Note Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p className="font-medium">{formatDate(note.createdAt)}</p>
                </div>
              </div>

              {note.updatedAt !== note.createdAt && (
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="font-medium">{formatDate(note.updatedAt)}</p>
                  </div>
                </div>
              )}

              {note.followUpRequired && note.followUpDate && (
                <div className="flex items-start gap-3">
                  <ScheduleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Follow-up Date</p>
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      {formatDate(note.followUpDate)}
                    </p>
                  </div>
                </div>
              )}

              {note.tags && note.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {note.attachments && note.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <AttachFileIcon className="h-5 w-5" />
                    Attachments ({note.attachments.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('attachments')}
                    className="p-1 h-8 w-8"
                  >
                    {expandedSections.attachments ? (
                      <ExpandLessIcon className="h-4 w-4" />
                    ) : (
                      <ExpandMoreIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expandedSections.attachments && (
                  <AttachmentsDisplay
                    attachments={note.attachments}
                    onDownload={handleDownloadAttachment}
                    onDelete={canEdit ? handleDeleteAttachment : undefined}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Audit Trail
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                  className="p-1 h-8 w-8"
                >
                  {showAuditTrail ? <ExpandLessIcon className="h-4 w-4" /> : <ExpandMoreIcon className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAuditTrail && <AuditTrailDisplay note={note} />}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Clinical Note</DialogTitle>
          </DialogHeader>
          <ClinicalNoteForm
            noteId={note._id}
            onSuccess={() => setIsEditModalOpen(false)}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Clinical Note</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this clinical note? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading.deleteNote}
            >
              {loading.deleteNote ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper Components
interface VitalSignsDisplayProps {
  vitalSigns: VitalSigns;
}

const VitalSignsDisplay: React.FC<VitalSignsDisplayProps> = ({ vitalSigns }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {vitalSigns.bloodPressure && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Blood Pressure</p>
          <p className="font-medium">
            {vitalSigns.bloodPressure.systolic}/{vitalSigns.bloodPressure.diastolic}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">mmHg</p>
        </div>
      )}

      {vitalSigns.heartRate && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Heart Rate</p>
          <p className="font-medium">{vitalSigns.heartRate}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">bpm</p>
        </div>
      )}

      {vitalSigns.temperature && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Temperature</p>
          <p className="font-medium">{vitalSigns.temperature}°C</p>
        </div>
      )}

      {vitalSigns.weight && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
          <p className="font-medium">{vitalSigns.weight} kg</p>
        </div>
      )}

      {vitalSigns.height && (
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
          <p className="font-medium">{vitalSigns.height} cm</p>
        </div>
      )}
    </div>
  );
};

interface LabResultsDisplayProps {
  labResults: LabResult[];
}

const LabResultsDisplay: React.FC<LabResultsDisplayProps> = ({ labResults }) => {
  const getStatusColor = (status: LabResult['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'abnormal':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-3">
      {labResults.map((result, index) => (
        <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-medium">{result.test}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(result.status)}`}>
              {result.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Result: <span className="font-medium">{result.result}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Normal Range: {result.normalRange}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Date: {format(parseISO(result.date), 'MMM dd, yyyy')}
          </p>
        </div>
      ))}
    </div>
  );
};

interface AttachmentsDisplayProps {
  attachments: Attachment[];
  onDownload: (attachment: Attachment) => void;
  onDelete?: (attachment: Attachment) => void;
}

const AttachmentsDisplay: React.FC<AttachmentsDisplayProps> = ({
  attachments,
  onDownload,
  onDelete
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => (
        <div key={attachment._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="flex items-center gap-3">
            <AttachFileIcon className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium text-sm">{attachment.originalName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(attachment.size)} • {attachment.mimeType}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Uploaded: {format(parseISO(attachment.uploadedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(attachment)}
              className="p-1 h-8 w-8"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(attachment)}
                className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete"
              >
                <Delete className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface AuditTrailDisplayProps {
  note: ClinicalNote;
}

const AuditTrailDisplay: React.FC<AuditTrailDisplayProps> = ({ note }) => {
  const auditEvents = [
    {
      action: 'Created',
      timestamp: note.createdAt,
      user: note.createdBy,
      details: 'Clinical note created',
    },
  ];

  if (note.updatedAt !== note.createdAt) {
    auditEvents.push({
      action: 'Modified',
      timestamp: note.updatedAt,
      user: note.lastModifiedBy,
      details: 'Clinical note updated',
    });
  }

  if (note.deletedAt) {
    auditEvents.push({
      action: 'Deleted',
      timestamp: note.deletedAt,
      user: note.deletedBy || 'Unknown',
      details: 'Clinical note deleted',
    });
  }

  return (
    <div className="space-y-3">
      {auditEvents.map((event, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium">{event.action}</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(parseISO(event.timestamp), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{event.details}</p>
            {event.user && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                By: {event.user}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClinicalNoteDetail;
