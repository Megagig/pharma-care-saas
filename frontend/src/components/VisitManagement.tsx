import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { Dialog } from '@/components/ui/dialog';

import { DialogContent } from '@/components/ui/dialog';

import { DialogTitle } from '@/components/ui/dialog';

import { Tooltip } from '@/components/ui/tooltip';

import { Spinner } from '@/components/ui/spinner';

import { Alert } from '@/components/ui/alert';

import { Tabs } from '@/components/ui/tabs';
import {
  usePatientVisits,
  useCreateVisit,
  useUpdateVisit,
} from '@/hooks/useVisits';


interface VisitManagementProps {
  patientId: string;
}
interface VisitFormData {
  date: Date;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}
const VisitManagement: React.FC<VisitManagementProps> = ({ patientId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [attachments, setAttachments] = useState<VisitAttachment[]>([]);
  // React Query hooks
  const {
    data: visitsResponse,
    isLoading,
    isError,
    error,
  } = usePatientVisits(patientId);
  const createVisitMutation = useCreateVisit();
  const updateVisitMutation = useUpdateVisit();
  const visits = visitsResponse?.data?.results || [];
  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VisitFormData>({ 
    defaultValues: {
      date: new Date(),
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''}
    }
  const filteredVisits = visits.filter(
    (visit: Visit) =>
      visit.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.values(visit.soap).some(
        (note) => note && note.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );
  const handleOpenDialog = (visit?: Visit) => {
    if (visit) {
      setSelectedVisit(visit);
      reset({ 
        date: new Date(visit.date),
        subjective: visit.soap.subjective || '',
        objective: visit.soap.objective || '',
        assessment: visit.soap.assessment || '',
        plan: visit.soap.plan || ''}
      });
      setAttachments(visit.attachments || []);
    } else {
      setSelectedVisit(null);
      reset({ 
        date: new Date(),
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''}
      });
      setAttachments([]);
    }
    setIsDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedVisit(null);
    setAttachments([]);
    reset();
  };
  const handleSaveVisit = async (formData: VisitFormData) => {
    try {
      const soap: SOAPNotes = {
        subjective: formData.subjective?.trim() || undefined,
        objective: formData.objective?.trim() || undefined,
        assessment: formData.assessment?.trim() || undefined,
        plan: formData.plan?.trim() || undefined,
      };
      const visitData: CreateVisitData | UpdateVisitData = {
        date: formData.date.toISOString(),
        soap,
        attachments,
      };
      if (selectedVisit) {
        await updateVisitMutation.mutateAsync({ 
          visitId: selectedVisit._id,
          visitData: visitData as UpdateVisitData}
        });
      } else {
        await createVisitMutation.mutateAsync({ 
          patientId,
          visitData: visitData as CreateVisitData}
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving visit:', error);
    }
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const fileAttachment: VisitAttachment = {
          kind: getFileKind(file.type),
          url: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, fileAttachment]);
      });
    }
  };
  const getFileKind = (mimeType: string): VisitAttachment['kind'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
  };
  const getFileIcon = (kind: VisitAttachment['kind']) => {
    switch (kind) {
      case 'image':
        return <ImageIcon />;
      case 'audio':
        return <AudioFileIcon />;
      case 'lab':
        return <DescriptionIcon />;
      default:
        return <AttachFileIcon />;
    }
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'}
  };
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };
  if (isLoading) {
    return (
      <div className="">
        <Spinner />
      </div>
    );
  }
  if (isError) {
    return (
      <Alert severity="error" className="">
        <div >Failed to load visits</div>
        <div >
          {error instanceof Error
            ? error.message
            : 'Unable to retrieve visit information.'}
        </div>
      </Alert>
    );
  }
  return (
      <div>
        {/* Header */}
        <div
          className=""
        >
          <div className="">
            <CalendarTodayIcon className="" />
            <div  className="">
              Visit Management
            </div>
            {visits.length > 0 && (
              <Chip
                label={`${visits.length} visit${visits.length > 1 ? 's' : ''}`}
                size="small"
                className=""
              />
            )}
          </div>
          <RBACGuard action="canCreate">
            <Button
              
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              New Visit
            </Button>
          </RBACGuard>
        </div>
        {/* Search */}
        {visits.length > 0 && (
          <Card className="">
            <CardContent>
              <Input
                fullWidth
                size="small"
                placeholder="Search visits by date or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                
              />
            </CardContent>
          </Card>
        )}
        {/* Visits List */}
        {filteredVisits.length === 0 ? (
          <Card>
            <CardContent className="">
              <CalendarTodayIcon
                className=""
              />
              <div  color="text.secondary" className="">
                {searchTerm ? 'No matching visits found' : 'No visits recorded'}
              </div>
              <div  color="text.secondary" className="">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create visit records with SOAP notes to track patient encounters'}
              </div>
              {!searchTerm && (
                <RBACGuard action="canCreate">
                  <Button
                    
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Create First Visit
                  </Button>
                </RBACGuard>
              )}
            </CardContent>
          </Card>
        ) : (
          <div spacing={2}>
            {filteredVisits.map((visit: Visit) => (
              <Card key={visit._id}>
                <CardContent>
                  <div
                    className=""
                  >
                    <div>
                      <div  className="">
                        {formatDate(visit.date)}
                      </div>
                      {visit.attachments && visit.attachments.length > 0 && (
                        <Chip
                          label={`${visit.attachments.length} attachment${
                            visit.attachments.length > 1 ? 's' : ''
                          }`}
                          size="small"
                          icon={<AttachFileIcon />}
                          
                          className=""
                        />
                      )}
                    </div>
                    <div direction="row" spacing={1}>
                      <Tooltip title="View Visit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(visit)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <RBACGuard action="canUpdate">
                        <Tooltip title="Edit Visit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(visit)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </RBACGuard>
                    </div>
                  </div>
                  <div
                    className=""
                  >
                    {visit.soap.subjective && (
                      <div>
                        <div
                          
                          color="primary"
                          className=""
                        >
                          Subjective
                        </div>
                        <div
                          
                          className=""
                        >
                          {visit.soap.subjective}
                        </div>
                      </div>
                    )}
                    {visit.soap.objective && (
                      <div>
                        <div
                          
                          color="primary"
                          className=""
                        >
                          Objective
                        </div>
                        <div
                          
                          className=""
                        >
                          {visit.soap.objective}
                        </div>
                      </div>
                    )}
                    {visit.soap.assessment && (
                      <div>
                        <div
                          
                          color="primary"
                          className=""
                        >
                          Assessment
                        </div>
                        <div
                          
                          className=""
                        >
                          {visit.soap.assessment}
                        </div>
                      </div>
                    )}
                    {visit.soap.plan && (
                      <div>
                        <div
                          
                          color="primary"
                          className=""
                        >
                          Plan
                        </div>
                        <div
                          
                          className=""
                        >
                          {visit.soap.plan}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Add/Edit Visit Dialog */}
        <Dialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <div className="">
              <CalendarTodayIcon className="" />
              {selectedVisit ? 'Edit Visit' : 'New Patient Visit'}
            </div>
            <IconButton
              onClick={handleCloseDialog}
              className=""
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <form onSubmit={handleSubmit(handleSaveVisit)}>
              <div spacing={3}>
                {/* Visit Date */}
                <Controller
                  name="date"
                  control={control}
                  
                  render={({  field  }) => (
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      label="Visit Date & Time"
                      required
                      maxDateTime={new Date()}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                    />
                  )}
                />
                {/* SOAP Notes Tabs */}
                <div className="">
                  <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                  >
                    <Tab label="Subjective" icon={<NoteIcon />} />
                    <Tab label="Objective" icon={<VisibilityIcon />} />
                    <Tab label="Assessment" icon={<DescriptionIcon />} />
                    <Tab label="Plan" icon={<CalendarTodayIcon />} />
                    <Tab label="Attachments" icon={<AttachFileIcon />} />
                  </Tabs>
                </div>
                {/* Subjective Tab */}
                {tabValue === 0 && (
                  <Controller
                    name="subjective"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        label="Subjective"
                        placeholder="Patient's chief complaint, history of present illness, symptoms..."
                        multiline
                        rows={6}
                        fullWidth
                        helperText="What the patient tells you - symptoms, concerns, history"
                      />
                    )}
                  />
                )}
                {/* Objective Tab */}
                {tabValue === 1 && (
                  <Controller
                    name="objective"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        label="Objective"
                        placeholder="Physical examination findings, vital signs, test results..."
                        multiline
                        rows={6}
                        fullWidth
                        helperText="What you observe - physical exam, vital signs, lab results"
                      />
                    )}
                  />
                )}
                {/* Assessment Tab */}
                {tabValue === 2 && (
                  <Controller
                    name="assessment"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        label="Assessment"
                        placeholder="Clinical impression, diagnosis, differential diagnosis..."
                        multiline
                        rows={6}
                        fullWidth
                        helperText="Your clinical judgment - diagnosis, impression, analysis"
                      />
                    )}
                  />
                )}
                {/* Plan Tab */}
                {tabValue === 3 && (
                  <Controller
                    name="plan"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        label="Plan"
                        placeholder="Treatment plan, medications, follow-up instructions..."
                        multiline
                        rows={6}
                        fullWidth
                        helperText="Treatment plan - medications, procedures, follow-up care"
                      />
                    )}
                  />
                )}
                {/* Attachments Tab */}
                {tabValue === 4 && (
                  <div>
                    <div className="">
                      <Button
                        
                        component="label"
                        startIcon={<AttachFileIcon />}
                        fullWidth
                        className=""
                      >
                        Upload Files
                        <input
                          type="file"
                          hidden
                          multiple
                          accept="image/*,audio/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                        />
                      </Button>
                      <div  color="text.secondary">
                        Supported: Images, Audio files, PDF, Word documents
                      </div>
                    </div>
                    {attachments.length > 0 && (
                      <div>
                        <div  className="">
                          Attachments ({attachments.length})
                        </div>
                        <List>
                          {attachments.map((attachment, index) => (
                            <div key={index}>
                              <div>
                                {getFileIcon(attachment.kind)}
                              </div>
                              <div
                                primary={attachment.fileName}
                                secondary={`${
                                  attachment.mimeType}
                                } • ${formatFileSize(
                                  attachment.fileSize || 0
                                )}`}
                              />
                              <IconButton
                                edge="end"
                                onClick={() => removeAttachment(index)}
                                color="error"
                              >
                                <CloseIcon />
                              </IconButton>
                            </div>
                          ))}
                        </List>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </DialogContent>
          <DialogActions className="">
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleSaveVisit)}
              
              disabled={isSubmitting}
              className=""
            >
              {isSubmitting
                ? 'Saving...'
                : selectedVisit
                ? 'Update Visit'
                : 'Save Visit'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
  );
};
export default VisitManagement;
