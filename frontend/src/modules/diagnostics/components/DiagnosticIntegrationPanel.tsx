import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner, Alert, Switch, Accordion, Separator } from '@/components/ui/button';
useIntegrationRecommendations,
  useBatchIntegration,

interface DiagnosticIntegrationPanelProps {
  diagnosticRequestId: string;
  diagnosticResultId?: string;
  patientId: string;
  onIntegrationComplete?: () => void;
}
interface IntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (operations: IntegrationOperations) => void;
  recommendations: any;
  isLoading: boolean;
}
interface IntegrationOperations {
  createClinicalNote: boolean;
  createMTR: boolean;
  enrichMTRId?: string;
  noteData?: CreateClinicalNoteFromDiagnosticData['noteData'];
  mtrData?: CreateMTRFromDiagnosticData['mtrData'];
}
const IntegrationDialog: React.FC<IntegrationDialogProps> = ({ 
  open,
  onClose,
  onConfirm,
  recommendations,
  isLoading
}) => {
  const [operations, setOperations] = useState<IntegrationOperations>({ 
    createClinicalNote: recommendations?.shouldCreateClinicalNote || false,
    createMTR: recommendations?.shouldCreateMTR || false,
    enrichMTRId: undefined,
    noteData: {
      type: 'consultation',
      priority: 'medium',
      followUpRequired: false,
      tags: ['diagnostic', 'ai-assisted']}
    },
    mtrData: {
      priority: 'routine',
    }
  const handleOperationChange = (
    field: keyof IntegrationOperations,
    value: any
  ) => {
    setOperations((prev) => ({ 
      ...prev,
      [field]: value}
    }));
  };
  const handleNoteDataChange = (field: string, value: any) => {
    setOperations((prev) => ({ 
      ...prev,
      noteData: {
        ...prev.noteData,
        [field]: value}
      }
  };
  const handleMTRDataChange = (field: string, value: any) => {
    setOperations((prev) => ({ 
      ...prev,
      mtrData: {
        ...prev.mtrData,
        [field]: value}
      }
  };
  const handleConfirm = () => {
    onConfirm(operations);
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div display="flex" alignItems="center" gap={1}>
          <IntegrationInstructions />
          Configure Integration Options
        </div>
      </DialogTitle>
      <DialogContent>
        <div display="flex" flexDirection="column" gap={3} mt={2}>
          {/* Clinical Note Options */}
          <Accordion expanded={operations.createClinicalNote}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <FormControlLabel
                control={
                  <Switch}
                    checked={operations.createClinicalNote}
                    onChange={(e) =>
                      handleOperationChange(
                        'createClinicalNote',
                        e.target.checked
                      )}
                    }
                  />
                }
                label="Create Clinical Note"
                onClick={(e) => e.stopPropagation()}
              />
            </AccordionSummary>
            <AccordionDetails>
              <div display="flex" flexDirection="column" gap={2}>
                <Input
                  label="Note Title"
                  value={operations.noteData?.title || ''}
                  onChange={(e) =>
                    handleNoteDataChange('title', e.target.value)}
                  }
                  fullWidth
                />
                <div fullWidth>
                  <Label>Note Type</Label>
                  <Select
                    value={operations.noteData?.type || 'consultation'}
                    onChange={(e) =>
                      handleNoteDataChange('type', e.target.value)}
                    }
                  >
                    <MenuItem value="consultation">Consultation</MenuItem>
                    <MenuItem value="medication_review">
                      Medication Review
                    </MenuItem>
                    <MenuItem value="follow_up">Follow-up</MenuItem>
                    <MenuItem value="adverse_event">Adverse Event</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </div>
                <div fullWidth>
                  <Label>Priority</Label>
                  <Select
                    value={operations.noteData?.priority || 'medium'}
                    onChange={(e) =>
                      handleNoteDataChange('priority', e.target.value)}
                    }
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </div>
                <FormControlLabel
                  control={
                    <Switch}
                      checked={operations.noteData?.followUpRequired || false}
                      onChange={(e) =>
                        handleNoteDataChange(
                          'followUpRequired',
                          e.target.checked
                        )}
                      }
                    />
                  }
                  label="Follow-up Required"
                />
              </div>
            </AccordionDetails>
          </Accordion>
          {/* MTR Options */}
          <Accordion expanded={operations.createMTR}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <FormControlLabel
                control={
                  <Switch}
                    checked={operations.createMTR}
                    onChange={(e) =>
                      handleOperationChange('createMTR', e.target.checked)}
                    }
                  />
                }
                label="Create New MTR"
                onClick={(e) => e.stopPropagation()}
              />
            </AccordionSummary>
            <AccordionDetails>
              <div display="flex" flexDirection="column" gap={2}>
                <div fullWidth>
                  <Label>Priority</Label>
                  <Select
                    value={operations.mtrData?.priority || 'routine'}
                    onChange={(e) =>
                      handleMTRDataChange('priority', e.target.value)}
                    }
                  >
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="high_risk">High Risk</MenuItem>
                  </Select>
                </div>
                <Input
                  label="Review Reason"
                  value={operations.mtrData?.reviewReason || ''}
                  onChange={(e) =>
                    handleMTRDataChange('reviewReason', e.target.value)}
                  }
                  multiline
                  rows={3}
                  fullWidth
                />
              </div>
            </AccordionDetails>
          </Accordion>
          {/* Existing MTR Enrichment */}
          {recommendations?.existingMTRs?.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <div >Enrich Existing MTR</div>
              </AccordionSummary>
              <AccordionDetails>
                <div fullWidth>
                  <Label>Select MTR to Enrich</Label>
                  <Select
                    value={operations.enrichMTRId || ''}
                    onChange={(e) => {
                      handleOperationChange('enrichMTRId', e.target.value);
                      if (e.target.value) {
                        handleOperationChange('createMTR', false);}
                      }>
                    <MenuItem value="">None</MenuItem>
                    {recommendations.existingMTRs
                      .filter((mtr: any) => mtr.canEnrich)
                      .map((mtr: any) => (
                        <MenuItem key={mtr.id} value={mtr.id}>
                          {mtr.reviewNumber} - {mtr.status} ({mtr.priority})
                        </MenuItem>
                      ))}
                  </Select>
                </div>
              </AccordionDetails>
            </Accordion>
          )}
          {/* Correlations Display */}
          {recommendations?.correlations?.length > 0 && (
            <div>
              <div  gutterBottom>
                Found Correlations
              </div>
              <List dense>
                {recommendations.correlations.map(
                  (correlation: any, index: number) => (
                    <div key={index}>
                      <div>
                        <LinkIcon color="primary" />
                      </div>
                      <div
                        primary={correlation.correlation}
                        secondary={`${correlation.type} - Confidence: ${Math.round(correlation.confidence * 100)}%`}
                      />
                    </div>
                  )
                )}
              </List>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          
          disabled={
            isLoading ||
            (!operations.createClinicalNote &&
              !operations.createMTR &&
              !operations.enrichMTRId)}
          }
          startIcon={}
            isLoading ? <Spinner size={20} /> : <CheckCircle />
          }
        >
          {isLoading ? 'Processing...' : 'Execute Integration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export const DiagnosticIntegrationPanel: React.FC = ({ 
  diagnosticRequestId,
  diagnosticResultId,
  patientId,
  onIntegrationComplete
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    recommendations,
    isLoading: recommendationsLoading,
    crossReference,
    integrationOptions,
  } = useIntegrationRecommendations(diagnosticRequestId, patientId);
  const { executeBatchIntegration, isLoading: integrationLoading } =
    useBatchIntegration();
  const handleIntegrationClick = () => {
    setDialogOpen(true);
  };
  const handleIntegrationConfirm = async (
    operations: IntegrationOperations
  ) => {
    try {
      await executeBatchIntegration(
        diagnosticRequestId,
        diagnosticResultId,
        patientId,
        operations
      );
      setDialogOpen(false);
      onIntegrationComplete?.();
    } catch (error) {
      console.error('Integration failed:', error);
    }
  };
  if (recommendationsLoading) {
    return (
      <Card>
        <CardContent>
          <div display="flex" alignItems="center" justifyContent="center" p={3}>
            <Spinner />
            <div  ml={2}>
              Analyzing integration options...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      <Card>
        <CardContent>
          <div display="flex" alignItems="center" gap={1} mb={2}>
            <IntegrationInstructions color="primary" />
            <div >Integration Options</div>
          </div>
          {/* Recommendations */}
          <div mb={3}>
            <div  gutterBottom>
              Recommendations
            </div>
            <div display="flex" flexWrap="wrap" gap={1} mb={2}>
              {recommendations?.shouldCreateClinicalNote && (
                <Chip
                  icon={<NoteAdd />}
                  label="Create Clinical Note"
                  color="primary"
                  
                />
              )}
              {recommendations?.shouldCreateMTR && (
                <Chip
                  icon={<Assignment />}
                  label="Create MTR"
                  color="secondary"
                  
                />
              )}
              {recommendations?.shouldEnrichExistingMTR && (
                <Chip
                  icon={<Timeline />}
                  label="Enrich Existing MTR"
                  color="info"
                  
                />
              )}
            </div>
            {integrationOptions?.recommendations && (
              <List dense>
                {integrationOptions.recommendations.map(
                  (rec: string, index: number) => (
                    <div key={index}>
                      <div>
                        <Info color="primary" />
                      </div>
                      <div primary={rec} />
                    </div>
                  )
                )}
              </List>
            )}
          </div>
          <Separator />
          {/* Existing Records */}
          {(crossReference?.relatedClinicalNotes?.length > 0 ||
            crossReference?.relatedMTRs?.length > 0) && (
            <div mt={3} mb={3}>
              <div  gutterBottom>
                Related Records
              </div>
              {crossReference.relatedMTRs?.length > 0 && (
                <div mb={2}>
                  <div
                    
                    color="textSecondary"
                    gutterBottom
                  >
                    Recent MTRs ({crossReference.relatedMTRs.length})
                  </div>
                  <div display="flex" flexWrap="wrap" gap={1}>
                    {crossReference.relatedMTRs.slice(0, 3).map((mtr: any) => (
                      <Chip
                        key={mtr._id}
                        label={`${mtr.reviewNumber} (${mtr.status})`}
                        size="small"
                        color={
                          mtr.status === 'in_progress' ? 'primary' : 'default'}
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
              {crossReference.relatedClinicalNotes?.length > 0 && (
                <div mb={2}>
                  <div
                    
                    color="textSecondary"
                    gutterBottom
                  >
                    Recent Clinical Notes (
                    {crossReference.relatedClinicalNotes.length})
                  </div>
                  <div display="flex" flexWrap="wrap" gap={1}>
                    {crossReference.relatedClinicalNotes
                      .slice(0, 3)
                      .map((note: any) => (
                        <Chip
                          key={note._id}
                          label={note.title}
                          size="small"
                          color="default"
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Correlations */}
          {recommendations?.correlations?.length > 0 && (
            <div mb={3}>
              <Alert severity="info" className="">
                <div >
                  Found {recommendations.correlations.length} correlation(s)
                  with existing records
                </div>
              </Alert>
            </div>
          )}
          <Separator />
          {/* Action Button */}
          <div mt={3} display="flex" justifyContent="center">
            <Button
              
              size="large"
              onClick={handleIntegrationClick}
              startIcon={<IntegrationInstructions />}
              disabled={integrationLoading}
            >
              Configure Integration
            </Button>
          </div>
        </CardContent>
      </Card>
      <IntegrationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleIntegrationConfirm}
        recommendations={recommendations}
        isLoading={integrationLoading}
      />
    </>
  );
};
