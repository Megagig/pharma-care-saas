import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Stack,
  Divider,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Breadcrumbs,
  Link,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  AttachFile as AttachFileIcon,
  Person as PersonIcon,
  LocalPharmacy as PharmacyIcon,
  CalendarToday as CalendarIcon,
  Priority as PriorityIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MedicalServices as MedicalIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  PlaylistAddCheck as PlanIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useClinicalNote } from '../queries/clinicalNoteQueries';
import { useEnhancedClinicalNoteStore } from '../stores/enhancedClinicalNoteStore';
import { useAuth } from '../hooks/useAuth';
import {
  ClinicalNote,
  NOTE_TYPES,
  NOTE_PRIORITIES,
  Attachment,
  LabResult,
  VitalSigns,
} from '../types/clinicalNote';
import ClinicalNoteForm from './ClinicalNoteForm';
import LoadingSpinner from './LoadingSpinner';

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
  embedded = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
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
        setSnackbar({
          open: true,
          message: 'Note deleted successfully',
          severity: 'success',
        });

        if (onDelete) {
          onDelete();
        } else if (!embedded) {
          navigate('/notes');
        }
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete note',
        severity: 'error',
      });
    }
    setIsDeleteDialogOpen(false);
  };

  // Handle attachment download
  const handleDownloadAttachment = async (attachment: Attachment) => {
    if (!note) return;

    try {
      await downloadAttachment(note._id, attachment._id);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to download attachment',
        severity: 'error',
      });
    }
  };

  // Handle attachment delete
  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!note) return;

    try {
      const success = await deleteAttachment(note._id, attachment._id);
      if (success) {
        setSnackbar({
          open: true,
          message: 'Attachment deleted successfully',
          severity: 'success',
        });
        refetch(); // Refresh note data
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete attachment',
        severity: 'error',
      });
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  // Error state
  if (error || !note) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            {error ? 'Failed to load clinical note' : 'Clinical note not found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {error
              ? 'Please try again later'
              : 'The requested note may have been deleted or you may not have permission to view it'}
          </Typography>
          {!embedded && (
            <Button variant="contained" onClick={handleBack}>
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
    <Box
      sx={{
        maxWidth: embedded ? '100%' : 1200,
        mx: 'auto',
        p: embedded ? 0 : 2,
      }}
    >
      {/* Header */}
      {!embedded && (
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={handleBack}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              Clinical Notes
            </Link>
            <Typography variant="body2" color="text.primary">
              {note.title}
            </Typography>
          </Breadcrumbs>

          <Stack
            direction={isMobile ? 'column' : 'row'}
            justifyContent="space-between"
            alignItems={isMobile ? 'stretch' : 'center'}
            spacing={2}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                {note.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={typeInfo?.label || note.type}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={priorityInfo?.label || note.priority}
                  size="small"
                  sx={{
                    backgroundColor: priorityInfo?.color || '#757575',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
                {note.isConfidential && (
                  <Chip
                    icon={<SecurityIcon />}
                    label="Confidential"
                    size="small"
                    color="warning"
                  />
                )}
                {note.followUpRequired && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label="Follow-up Required"
                    size="small"
                    color="info"
                  />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              {!embedded && (
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>
              )}
              {canEdit && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  variant="contained"
                  color="primary"
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="outlined"
                  color="error"
                >
                  Delete
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Patient and Clinician Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
              >
                <PersonIcon sx={{ mr: 1 }} />
                Patient & Clinician Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      sx={{ mb: 1 }}
                    >
                      Patient
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {formatPatientName(note.patient)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      MRN: {note.patient.mrn}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      sx={{ mb: 1 }}
                    >
                      Pharmacist
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {formatPharmacistName(note.pharmacist)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Role: {note.pharmacist.role}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* SOAP Note Content */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <AssignmentIcon sx={{ mr: 1 }} />
                  SOAP Note Content
                </Typography>
                <IconButton
                  onClick={() => toggleSection('content')}
                  size="small"
                >
                  {expandedSections.content ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              </Box>

              <Collapse in={expandedSections.content}>
                <Stack spacing={3}>
                  {note.content.subjective && (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}
                      >
                        <MedicalIcon sx={{ mr: 1, fontSize: 20 }} />
                        Subjective
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: 'pre-wrap' }}
                        >
                          {note.content.subjective}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {note.content.objective && (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}
                      >
                        <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
                        Objective
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: 'pre-wrap' }}
                        >
                          {note.content.objective}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {note.content.assessment && (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}
                      >
                        <AssessmentIcon sx={{ mr: 1, fontSize: 20 }} />
                        Assessment
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: 'pre-wrap' }}
                        >
                          {note.content.assessment}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {note.content.plan && (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}
                      >
                        <PlanIcon sx={{ mr: 1, fontSize: 20 }} />
                        Plan
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: 'pre-wrap' }}
                        >
                          {note.content.plan}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </Collapse>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          {note.vitalSigns && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Vital Signs</Typography>
                  <IconButton
                    onClick={() => toggleSection('vitals')}
                    size="small"
                  >
                    {expandedSections.vitals ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                </Box>

                <Collapse in={expandedSections.vitals}>
                  <VitalSignsDisplay vitalSigns={note.vitalSigns} />
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Lab Results */}
          {note.laborResults && note.laborResults.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Laboratory Results</Typography>
                  <IconButton
                    onClick={() => toggleSection('labs')}
                    size="small"
                  >
                    {expandedSections.labs ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                </Box>

                <Collapse in={expandedSections.labs}>
                  <LabResultsDisplay labResults={note.laborResults} />
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {note.recommendations && note.recommendations.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Recommendations</Typography>
                  <IconButton
                    onClick={() => toggleSection('recommendations')}
                    size="small"
                  >
                    {expandedSections.recommendations ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                </Box>

                <Collapse in={expandedSections.recommendations}>
                  <List>
                    {note.recommendations.map((recommendation, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={recommendation}
                          primaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Note Metadata */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Note Information
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(note.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                {note.updatedAt !== note.createdAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(note.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {note.followUpRequired && note.followUpDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Follow-up Date
                      </Typography>
                      <Typography variant="body1" color="warning.main">
                        {formatDate(note.followUpDate)}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {note.tags && note.tags.length > 0 && (
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Tags
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {note.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Attachments */}
          {note.attachments && note.attachments.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <AttachFileIcon sx={{ mr: 1 }} />
                    Attachments ({note.attachments.length})
                  </Typography>
                  <IconButton
                    onClick={() => toggleSection('attachments')}
                    size="small"
                  >
                    {expandedSections.attachments ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                </Box>

                <Collapse in={expandedSections.attachments}>
                  <AttachmentsDisplay
                    attachments={note.attachments}
                    onDownload={handleDownloadAttachment}
                    onDelete={canEdit ? handleDeleteAttachment : undefined}
                  />
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Audit Trail */}
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <HistoryIcon sx={{ mr: 1 }} />
                  Audit Trail
                </Typography>
                <IconButton
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                  size="small"
                >
                  {showAuditTrail ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={showAuditTrail}>
                <AuditTrailDisplay note={note} />
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Edit Clinical Note</DialogTitle>
        <DialogContent>
          <ClinicalNoteForm
            noteId={note._id}
            onSave={() => {
              setIsEditModalOpen(false);
              refetch();
              setSnackbar({
                open: true,
                message: 'Note updated successfully',
                severity: 'success',
              });
            }}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Clinical Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this clinical note? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading.deleteNote}
          >
            {loading.deleteNote ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Helper Components

interface VitalSignsDisplayProps {
  vitalSigns: VitalSigns;
}

const VitalSignsDisplay: React.FC<VitalSignsDisplayProps> = ({
  vitalSigns,
}) => {
  return (
    <Grid container spacing={2}>
      {vitalSigns.bloodPressure && (
        <Grid item xs={6} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Blood Pressure
            </Typography>
            <Typography variant="h6">
              {vitalSigns.bloodPressure.systolic}/
              {vitalSigns.bloodPressure.diastolic}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              mmHg
            </Typography>
          </Paper>
        </Grid>
      )}

      {vitalSigns.heartRate && (
        <Grid item xs={6} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Heart Rate
            </Typography>
            <Typography variant="h6">{vitalSigns.heartRate}</Typography>
            <Typography variant="caption" color="text.secondary">
              bpm
            </Typography>
          </Paper>
        </Grid>
      )}

      {vitalSigns.temperature && (
        <Grid item xs={6} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Temperature
            </Typography>
            <Typography variant="h6">{vitalSigns.temperature}°C</Typography>
          </Paper>
        </Grid>
      )}

      {vitalSigns.weight && (
        <Grid item xs={6} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Weight
            </Typography>
            <Typography variant="h6">{vitalSigns.weight} kg</Typography>
          </Paper>
        </Grid>
      )}

      {vitalSigns.height && (
        <Grid item xs={6} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Height
            </Typography>
            <Typography variant="h6">{vitalSigns.height} cm</Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

interface LabResultsDisplayProps {
  labResults: LabResult[];
}

const LabResultsDisplay: React.FC<LabResultsDisplayProps> = ({
  labResults,
}) => {
  const getStatusColor = (status: LabResult['status']) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'abnormal':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <List>
      {labResults.map((result, index) => (
        <ListItem key={index} divider={index < labResults.length - 1}>
          <ListItemText
            primary={
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body1" fontWeight={500}>
                  {result.test}
                </Typography>
                <Chip
                  label={result.status}
                  size="small"
                  color={getStatusColor(result.status) as any}
                />
              </Box>
            }
            secondary={
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Result: <strong>{result.result}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Normal Range: {result.normalRange}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Date: {format(parseISO(result.date), 'MMM dd, yyyy')}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
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
  onDelete,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <List>
      {attachments.map((attachment, index) => (
        <ListItem
          key={attachment._id}
          divider={index < attachments.length - 1}
          secondaryAction={
            <Stack direction="row" spacing={1}>
              <Tooltip title="Download">
                <IconButton
                  edge="end"
                  onClick={() => onDownload(attachment)}
                  size="small"
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton
                    edge="end"
                    onClick={() => onDelete(attachment)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          }
        >
          <ListItemIcon>
            <AttachFileIcon />
          </ListItemIcon>
          <ListItemText
            primary={attachment.originalName}
            secondary={
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(attachment.size)} • {attachment.mimeType}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Uploaded:{' '}
                  {format(
                    parseISO(attachment.uploadedAt),
                    'MMM dd, yyyy HH:mm'
                  )}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
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
    <List>
      {auditEvents.map((event, index) => (
        <ListItem key={index} divider={index < auditEvents.length - 1}>
          <ListItemIcon>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <HistoryIcon fontSize="small" />
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" fontWeight={500}>
                {event.action}
              </Typography>
            }
            secondary={
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {format(parseISO(event.timestamp), 'MMM dd, yyyy HH:mm')}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  {event.details}
                </Typography>
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default ClinicalNoteDetail;
