import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { CardHeader } from '@/components/ui/card';

import { Tooltip } from '@/components/ui/tooltip';

import { Spinner } from '@/components/ui/spinner';

import { Alert } from '@/components/ui/alert';

import { Separator } from '@/components/ui/separator';

interface PatientClinicalNotesProps {
  patientId: string;
  maxNotes?: number;
  showCreateButton?: boolean;
  onCreateNote?: () => void;
  onViewNote?: (noteId: string) => void;
  onEditNote?: (noteId: string) => void;
}
const PatientClinicalNotes: React.FC<PatientClinicalNotesProps> = ({ 
  patientId,
  maxNotes = 5,
  showCreateButton = true,
  onCreateNote,
  onViewNote,
  onEditNote
}) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  // Store actions
  const { setCreateModalOpen } = useEnhancedClinicalNoteStore();
  // Fetch patient notes
  const { data, isLoading, error, refetch } = usePatientNotes(patientId, {
    limit: expanded ? 50 : maxNotes,
    sortBy: 'createdAt',
    sortOrder: 'desc'}
  const notes = data?.notes || [];
  const totalNotes = data?.total || 0;
  // Handle note expansion
  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };
  // Format functions
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };
  const formatPharmacistName = (pharmacist: ClinicalNote['pharmacist']) => {
    return `${pharmacist.firstName} ${pharmacist.lastName}`;
  };
  const getTypeInfo = (type: ClinicalNote['type']) => {
    return NOTE_TYPES.find((t) => t.value === type);
  };
  const getPriorityInfo = (priority: ClinicalNote['priority']) => {
    return NOTE_PRIORITIES.find((p) => p.value === priority);
  };
  // Handle actions
  const handleCreateNote = () => {
    if (onCreateNote) {
      onCreateNote();
    } else {
      // Default behavior: open create note form with patient context
      const createUrl = `/notes/new?patientId=${patientId}`;
      window.location.href = createUrl;
    }
  };
  const handleViewNote = (noteId: string) => {
    if (onViewNote) {
      onViewNote(noteId);
    } else {
      // Default behavior: navigate to note detail
      window.location.href = `/notes/${noteId}`;
    }
  };
  const handleEditNote = (noteId: string) => {
    if (onEditNote) {
      onEditNote(noteId);
    } else {
      // Default behavior: navigate to note edit
      window.location.href = `/notes/${noteId}/edit`;
    }
  };
  // Render note summary
  const renderNoteSummary = (note: ClinicalNote) => {
    const isExpanded = expandedNotes.has(note._id);
    const typeInfo = getTypeInfo(note.type);
    const priorityInfo = getPriorityInfo(note.priority);
    return (
      <div
        key={note._id}
        className=""
      >
        {/* Note Header */}
        <div
          className=""
          onClick={() => toggleNoteExpansion(note._id)}
        >
          <div className="">
            <div  fontWeight={600} noWrap>
              {note.title}
            </div>
            <div
              direction="row"
              spacing={1}
              alignItems="center"
              className=""
            >
              <Chip
                label={typeInfo?.label || note.type}
                size="small"
                
                color="primary"
              />
              <Chip
                label={priorityInfo?.label || note.priority}
                size="small"
                className=""
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
                <Tooltip
                  title={`Follow-up: ${
                    note.followUpDate
                      ? formatDate(note.followUpDate)
                      : 'Not scheduled'}
                  }`}
                >
                  <ScheduleIcon color="warning" fontSize="small" />
                </Tooltip>
              )}
              {note.attachments?.length > 0 && (
                <Tooltip title={`${note.attachments.length} attachment(s)`}>
                  <AttachFileIcon color="action" fontSize="small" />
                </Tooltip>
              )}
            </div>
            <div  color="text.secondary">
              {formatDate(note.createdAt)} •{' '}
              {formatPharmacistName(note.pharmacist)}
            </div>
          </div>
          <div className="">
            <IconButton
              size="small"
              >
              <ViewIcon />
            </IconButton>
            <IconButton
              size="small"
              >
              <EditIcon />
            </IconButton>
            <IconButton size="small">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </div>
        </div>
        {/* Note Content (Expandable) */}
        <Collapse in={isExpanded}>
          <div className="">
            {note.content.subjective && (
              <div className="">
                <div  fontWeight={600} color="primary">
                  Subjective:
                </div>
                <div  className="">
                  {note.content.subjective}
                </div>
              </div>
            )}
            {note.content.objective && (
              <div className="">
                <div  fontWeight={600} color="primary">
                  Objective:
                </div>
                <div  className="">
                  {note.content.objective}
                </div>
              </div>
            )}
            {note.content.assessment && (
              <div className="">
                <div  fontWeight={600} color="primary">
                  Assessment:
                </div>
                <div  className="">
                  {note.content.assessment}
                </div>
              </div>
            )}
            {note.content.plan && (
              <div className="">
                <div  fontWeight={600} color="primary">
                  Plan:
                </div>
                <div  className="">
                  {note.content.plan}
                </div>
              </div>
            )}
            {note.recommendations?.length > 0 && (
              <div className="">
                <div  fontWeight={600} color="primary">
                  Recommendations:
                </div>
                <List dense className="">
                  {note.recommendations.map((rec, index) => (
                    <div key={index} className="">
                      <div
                        primary={rec}
                        
                      />
                    </div>
                  ))}
                </List>
              </div>
            )}
            {note.tags?.length > 0 && (
              <div className="">
                <div direction="row" spacing={0.5} flexWrap="wrap">
                  {note.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      
                      color="secondary"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Collapse>
      </div>
    );
  };
  return (
    <Card>
      <CardHeader
        title={
          <div className="">
            <DescriptionIcon className="" />
            <div >Clinical Notes</div>
            {totalNotes > 0 && (
              <Chip}
                label={totalNotes}
                size="small"
                color="primary"
                className=""
              />
            )}
          </div>
        }
        action={
          <div>
            {showCreateButton && (
              <Button}
                startIcon={<AddIcon />}
                onClick={handleCreateNote}
                
                size="small"
              >
                New Note
              </Button>
            )}
          </div>
        }
      />
      <CardContent className="">
        {isLoading ? (
          <div className="">
            <Spinner />
          </div>
        ) : error ? (
          <Alert
            severity="error"
            className=""
            action={}
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            {error.response?.status === 404
              ? 'Patient not found or access denied'
              : error.response?.status === 401
              ? 'Authentication required. Please log in again.'
              : `Failed to load clinical notes: ${error.message}`}
          </Alert>
        ) : notes.length === 0 ? (
          <div className="">
            <DescriptionIcon
              className=""
            />
            <div  color="text.secondary" className="">
              No clinical notes found for this patient
            </div>
            {showCreateButton && (
              <Button
                startIcon={<AddIcon />}
                onClick={handleCreateNote}
                
              >
                Create First Note
              </Button>
            )}
          </div>
        ) : (
          <>
            <List className="">{notes.map(renderNoteSummary)}</List>
            {/* Show More/Less Button */}
            {totalNotes > maxNotes && (
              <>
                <Separator className="" />
                <div className="">
                  <Button
                    onClick={() => setExpanded(!expanded)}
                    startIcon={
                      expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    }
                    
                  >
                    {expanded ? 'Show Less' : `Show All ${totalNotes} Notes`}
                  </Button>
                </div>
              </>
            )}
            {/* View All Notes Link */}
            <div className="">
              <Button
                
                onClick={() =>}
                  window.open(`/notes?patientId=${patientId}`, '_blank')
                }
                fullWidth
              >
                View All Notes in Dashboard
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
export default PatientClinicalNotes;
