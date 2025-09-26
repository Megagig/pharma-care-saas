import { Button, Input, Card, CardContent, Dialog, DialogContent, DialogTitle, Spinner, Alert, Accordion } from '@/components/ui/button';
// Types based on the DiagnosticCase model
interface DiagnosticResult {
  caseId: string;
  patientId: string;
  aiAnalysis: {
    differentialDiagnoses: Array<{
      condition: string;
      probability: number;
      reasoning: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendedTests: Array<{
      testName: string;
      priority: 'urgent' | 'routine' | 'optional';
      reasoning: string;
    }>;
    therapeuticOptions: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      reasoning: string;
      safetyNotes: string[];
    }>;
    redFlags: Array<{
      flag: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      action: string;
    }>;
    referralRecommendation?: {
      recommended: boolean;
      urgency: 'immediate' | 'within_24h' | 'routine';
      specialty: string;
      reason: string;
    };
    disclaimer: string;
    confidenceScore: number;
    processingTime: number;
  };
  drugInteractions?: Array<{
    drug1: string;
    drug2: string;
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    description: string;
    clinicalEffect: string;
    management: string;
  }>;
  status: 'draft' | 'completed' | 'referred' | 'cancelled';
  createdAt: string;
}
interface InterpretationPanelProps {
  diagnosticResult: DiagnosticResult;
  patientName?: string;
  orderId?: string;
  onActionTaken: (action: string, data?: any) => void;
  onCreatePrescription?: (medication: any) => void;
  onScheduleReferral?: (referral: any) => void;
  onCreateCarePlan?: (plan: any) => void;
  onPrintReport?: () => void;
  onShareResults?: () => void;
  loading?: boolean;
}
const InterpretationPanel: React.FC<InterpretationPanelProps> = ({ 
  diagnosticResult,
  patientName,
  orderId,
  onActionTaken,
  onCreatePrescription,
  onScheduleReferral,
  onCreateCarePlan,
  onPrintReport,
  onShareResults,
  loading = false
}) => {
  // State management
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ 
    redFlags: true, // Red flags expanded by default
    diagnoses: true,
    recommendations: false,
    therapeutics: false,
    interactions: false}
  });
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'prescription' | 'referral' | 'carePlan' | null;
    data?: any;
  }>({ open: false, type: null });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });
  // Helper functions
  const getSeverityColor = (
    severity: string
  ): 'error' | 'warning' | 'info' | 'success' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
      case 'major':
        return 'error';
      case 'medium':
      case 'moderate':
        return 'warning';
      case 'low':
      case 'minor':
        return 'info';
      default:
        return 'info';
    }
  };
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
      case 'major':
        return <WarningIcon color="error" />;
      case 'medium':
      case 'moderate':
        return <WarningIcon color="warning" />;
      case 'low':
      case 'minor':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };
  const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'routine':
        return 'warning';
      case 'optional':
        return 'info';
      default:
        return 'info';
    }
  };
  const handleSectionToggle = (section: string) => {
    setExpandedSections((prev) => ({ 
      ...prev,
      [section]: !prev[section]}
    }));
  };
  const handleActionClick = useCallback(
    (actionType: string, data?: any) => {
      switch (actionType) {
        case 'prescription':
          setActionDialog({ open: true, type: 'prescription', data });
          break;
        case 'referral':
          setActionDialog({ open: true, type: 'referral', data });
          break;
        case 'carePlan':
          setActionDialog({ open: true, type: 'carePlan', data });
          break;
        case 'print':
          onPrintReport?.();
          onActionTaken('print_report');
          break;
        case 'share':
          onShareResults?.();
          onActionTaken('share_results');
          break;
        default:
          onActionTaken(actionType, data);
      }
    },
    [onActionTaken, onPrintReport, onShareResults]
  );
  const handleDialogClose = () => {
    setActionDialog({ open: false, type: null });
  };
  const handleDialogSubmit = (formData: any) => {
    const { type, data } = actionDialog;
    switch (type) {
      case 'prescription':
        onCreatePrescription?.(formData);
        onActionTaken('create_prescription', formData);
        break;
      case 'referral':
        onScheduleReferral?.(formData);
        onActionTaken('schedule_referral', formData);
        break;
      case 'carePlan':
        onCreateCarePlan?.(formData);
        onActionTaken('create_care_plan', formData);
        break;
    }
    setSnackbar({ 
      open: true}
      message: `${type} created successfully`,
      severity: 'success'}
    handleDialogClose();
  };
  if (loading) {
    return (
      <div display="flex" justifyContent="center" alignItems="center" p={4}>
        <Spinner />
        <div  className="">
          Processing AI interpretation...
        </div>
      </div>
    );
  }
  const { aiAnalysis, drugInteractions } = diagnosticResult;
  const criticalRedFlags = aiAnalysis.redFlags.filter(
    (flag) => flag.severity === 'critical'
  );
  const hasUrgentReferral =
    aiAnalysis.referralRecommendation?.urgency === 'immediate';
  return (
    <div className="">
      {/* Header with confidence score and actions */}
      <div className="">
        <div
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <div>
            <div  component="h2" gutterBottom>
              AI Diagnostic Interpretation
            </div>
            <div display="flex" alignItems="center" gap={2} flexWrap="wrap">
              {patientName && (
                <div  color="text.secondary">
                  Patient: {patientName}
                </div>
              )}
              {orderId && (
                <div  color="text.secondary">
                  Order: {orderId}
                </div>
              )}
              <Chip
                label={`Confidence: ${aiAnalysis.confidenceScore}%`}
                color={
                  aiAnalysis.confidenceScore >= 80
                    ? 'success'
                    : aiAnalysis.confidenceScore >= 60
                      ? 'warning'
                      : 'error'}
                }
                size="small"
              />
              <div  color="text.secondary">
                Processed in {aiAnalysis.processingTime}ms
              </div>
            </div>
          </div>
          <div display="flex" gap={1} flexWrap="wrap">
            <Button
              
              startIcon={<PrintIcon />}
              onClick={() => handleActionClick('print')}
              size="small"
            >
              Print
            </Button>
            <Button
              
              startIcon={<ShareIcon />}
              onClick={() => handleActionClick('share')}
              size="small"
            >
              Share
            </Button>
          </div>
        </div>
      </div>
      {/* Critical Alerts Banner */}
      {(criticalRedFlags.length > 0 || hasUrgentReferral) && (
        <Alert
          severity="error"
          className=""
          action={
            hasUrgentReferral && (
              <Button
                color="inherit"
                size="small"
                onClick={() =>
                  handleActionClick(
                    'referral',
                    aiAnalysis.referralRecommendation
                  )}
                }
              >
                Schedule Referral
              </Button>
            )
          }
        >
          <div  component="div">
            🚨 Critical Alert - Immediate Attention Required
          </div>
          {criticalRedFlags.map((flag, index) => (
            <div key={index} >
              • {flag.flag}: {flag.action}
            </div>
          ))}
          {hasUrgentReferral && (
            <div >
              • Immediate referral to{' '}
              {aiAnalysis.referralRecommendation?.specialty} required:{' '}
              {aiAnalysis.referralRecommendation?.reason}
            </div>
          )}
        </Alert>
      )}
      {/* Red Flags Section */}
      {aiAnalysis.redFlags.length > 0 && (
        <Card className="">
          <Accordion
            expanded={expandedSections.redFlags}
            onChange={() => handleSectionToggle('redFlags')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div display="flex" alignItems="center" gap={1}>
                <WarningIcon color="error" />
                <div >
                  Red Flags ({aiAnalysis.redFlags.length})
                </div>
                {criticalRedFlags.length > 0 && (
                  <Chip
                    label={`${criticalRedFlags.length} Critical`}
                    color="error"
                    size="small"
                  />
                )}
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {aiAnalysis.redFlags.map((flag, index) => (
                  <div
                    key={index}
                    divider={index < aiAnalysis.redFlags.length - 1}
                  >
                    <div>
                      {getSeverityIcon(flag.severity)}
                    </div>
                    <div
                      primary={}
                        <div display="flex" alignItems="center" gap={1}>
                          <div  component="span">
                            {flag.flag}
                          </div>
                          <Chip
                            label={flag.severity.toUpperCase()}
                            color={getSeverityColor(flag.severity)}
                            size="small"
                          />
                        </div>
                      }
                      secondary={
                        <div  color="text.secondary">}
                          <strong>Action:</strong> {flag.action}
                        </div>
                      }
                    />
                  </div>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Card>
      )}
      {/* Differential Diagnoses */}
      <Card className="">
        <Accordion
          expanded={expandedSections.diagnoses}
          onChange={() => handleSectionToggle('diagnoses')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div display="flex" alignItems="center" gap={1}>
              <HospitalIcon color="primary" />
              <div >
                Differential Diagnoses (
                {aiAnalysis.differentialDiagnoses.length})
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {aiAnalysis.differentialDiagnoses.map((diagnosis, index) => (
                <div
                  key={index}
                  divider={index < aiAnalysis.differentialDiagnoses.length - 1}
                >
                  <div
                    primary={
                      <div
                        display="flex"
                        alignItems="center"}
                        gap={1}
                        flexWrap="wrap"
                      >
                        <div  component="span">
                          {diagnosis.condition}
                        </div>
                        <Chip
                          label={`${diagnosis.probability}%`}
                          color={
                            diagnosis.probability > 70
                              ? 'error'
                              : diagnosis.probability > 40
                                ? 'warning'
                                : 'success'}
                          }
                          size="small"
                        />
                        <Chip
                          label={diagnosis.severity}
                          color={getSeverityColor(diagnosis.severity)}
                          size="small"
                        />
                      </div>
                    }
                    secondary={
                      <div  color="text.secondary">}
                        {diagnosis.reasoning}
                      </div>
                    }
                  />
                </div>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </Card>
      {/* Recommended Tests */}
      {aiAnalysis.recommendedTests.length > 0 && (
        <Card className="">
          <Accordion
            expanded={expandedSections.recommendations}
            onChange={() => handleSectionToggle('recommendations')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div display="flex" alignItems="center" gap={1}>
                <ScienceIcon color="info" />
                <div >
                  Recommended Tests ({aiAnalysis.recommendedTests.length})
                </div>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {aiAnalysis.recommendedTests.map((test, index) => (
                  <div
                    key={index}
                    divider={index < aiAnalysis.recommendedTests.length - 1}
                  >
                    <div
                      primary={
                        <div
                          display="flex"
                          alignItems="center"}
                          gap={1}
                          flexWrap="wrap"
                        >
                          <div  component="span">
                            {test.testName}
                          </div>
                          <Chip
                            label={test.priority}
                            color={getPriorityColor(test.priority)}
                            size="small"
                          />
                        </div>
                      }
                      secondary={
                        <div  color="text.secondary">}
                          {test.reasoning}
                        </div>
                      }
                    />
                  </div>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Card>
      )}
      {/* Therapeutic Options */}
      {aiAnalysis.therapeuticOptions.length > 0 && (
        <Card className="">
          <Accordion
            expanded={expandedSections.therapeutics}
            onChange={() => handleSectionToggle('therapeutics')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div display="flex" alignItems="center" gap={1}>
                <MedicationIcon color="success" />
                <div >
                  Therapeutic Options ({aiAnalysis.therapeuticOptions.length})
                </div>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {aiAnalysis.therapeuticOptions.map((option, index) => (
                  <div
                    key={index}
                    divider={index < aiAnalysis.therapeuticOptions.length - 1}
                  >
                    <div
                      primary={
                        <div
                          display="flex"
                          alignItems="center"}
                          gap={1}
                          flexWrap="wrap"
                        >
                          <div  component="span">
                            {option.medication}
                          </div>
                          <div  color="text.secondary">
                            {option.dosage}, {option.frequency} for{' '}
                            {option.duration}
                          </div>
                          <Button
                            size="small"
                            
                            onClick={() =>
                              handleActionClick('prescription', option)}
                            }
                          >
                            Create Prescription
                          </Button>
                        </div>
                      }
                      secondary={
                        <div>
                          <div
                            
                            color="text.secondary"
                            paragraph
                          >}
                            <strong>Reasoning:</strong> {option.reasoning}
                          </div>
                          {option.safetyNotes.length > 0 && (
                            <div>
                              <div
                                
                                color="error"
                                display="block"
                              >
                                Safety Notes:
                              </div>
                              {option.safetyNotes.map((note, noteIndex) => (
                                <div
                                  key={noteIndex}
                                  
                                  color="error"
                                  display="block"
                                >
                                  • {note}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </div>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Card>
      )}
      {/* Drug Interactions */}
      {drugInteractions && drugInteractions.length > 0 && (
        <Card className="">
          <Accordion
            expanded={expandedSections.interactions}
            onChange={() => handleSectionToggle('interactions')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div display="flex" alignItems="center" gap={1}>
                <WarningIcon color="warning" />
                <div >
                  Drug Interactions ({drugInteractions.length})
                </div>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {drugInteractions.map((interaction, index) => (
                  <div
                    key={index}
                    divider={index < drugInteractions.length - 1}
                  >
                    <div
                      primary={
                        <div
                          display="flex"
                          alignItems="center"}
                          gap={1}
                          flexWrap="wrap"
                        >
                          <div  component="span">
                            {interaction.drug1} ↔ {interaction.drug2}
                          </div>
                          <Chip
                            label={interaction.severity}
                            color={getSeverityColor(interaction.severity)}
                            size="small"
                          />
                        </div>
                      }
                      secondary={
                        <div>
                          <div
                            
                            color="text.secondary"
                            paragraph
                          >}
                            <strong>Description:</strong>{' '}
                            {interaction.description}
                          </div>
                          <div
                            
                            color="text.secondary"
                            paragraph
                          >
                            <strong>Clinical Effect:</strong>{' '}
                            {interaction.clinicalEffect}
                          </div>
                          <div  color="text.secondary">
                            <strong>Management:</strong>{' '}
                            {interaction.management}
                          </div>
                        </div>
                      }
                    />
                  </div>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Card>
      )}
      {/* Referral Recommendation */}
      {aiAnalysis.referralRecommendation?.recommended && (
        <Card className="">
          <CardContent>
            <div display="flex" alignItems="center" gap={1} mb={2}>
              <PersonAddIcon color="info" />
              <div >Referral Recommendation</div>
              <Chip
                label={aiAnalysis.referralRecommendation.urgency
                  .replace('_', ' ')}
                  .toUpperCase()}
                color={
                  aiAnalysis.referralRecommendation.urgency === 'immediate'
                    ? 'error'
                    : 'warning'}
                }
                size="small"
              />
            </div>
            <div  paragraph>
              <strong>Specialty:</strong>{' '}
              {aiAnalysis.referralRecommendation.specialty}
            </div>
            <div  color="text.secondary" paragraph>
              {aiAnalysis.referralRecommendation.reason}
            </div>
            <Button
              
              startIcon={<ScheduleIcon />}
              onClick={() =>
                handleActionClick('referral', aiAnalysis.referralRecommendation)}
              }
              color={
                aiAnalysis.referralRecommendation.urgency === 'immediate'
                  ? 'error'
                  : 'primary'}
              }
            >
              Schedule Referral
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Action Buttons */}
      <div className="">
        <div  gutterBottom>
          Quick Actions
        </div>
        <div container spacing={2}>
          <div item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              
              startIcon={<AssignmentIcon />}
              onClick={() => handleActionClick('carePlan')}
            >
              Create Care Plan
            </Button>
          </div>
          <div item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              
              startIcon={<ScheduleIcon />}
              onClick={() => handleActionClick('followUp')}
            >
              Schedule Follow-up
            </Button>
          </div>
          <div item xs={12} sm={6} md={4}>
            <Button
              fullWidth
              
              startIcon={<CheckCircleIcon />}
              onClick={() => handleActionClick('markComplete')}
            >
              Mark Complete
            </Button>
          </div>
        </div>
      </div>
      {/* Disclaimer */}
      <Alert severity="warning" className="">
        <div >
          <strong>Disclaimer:</strong> {aiAnalysis.disclaimer}
        </div>
      </Alert>
      {/* Action Dialogs */}
      <ActionDialog
        open={actionDialog.open}
        type={actionDialog.type}
        data={actionDialog.data}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
      />
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};
// Action Dialog Component
interface ActionDialogProps {
  open: boolean;
  type: 'prescription' | 'referral' | 'carePlan' | null;
  data?: any;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}
const ActionDialog: React.FC<ActionDialogProps> = ({ 
  open,
  type,
  data,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<any>({});
  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({});
  };
  const getDialogTitle = () => {
    switch (type) {
      case 'prescription':
        return 'Create Prescription';
      case 'referral':
        return 'Schedule Referral';
      case 'carePlan':
        return 'Create Care Plan';
      default:
        return 'Action';
    }
  };
  const renderDialogContent = () => {
    switch (type) {
      case 'prescription':
        return (
          <div>
            <Input
              fullWidth
              label="Medication"
              value={formData.medication || data?.medication || ''}
              onChange={(e) =>}
                setFormData((prev) => ({ ...prev, medication: e.target.value }))
              }
              margin="normal"
            />
            <Input
              fullWidth
              label="Dosage"
              value={formData.dosage || data?.dosage || ''}
              onChange={(e) =>}
                setFormData((prev) => ({ ...prev, dosage: e.target.value }))
              }
              margin="normal"
            />
            <Input
              fullWidth
              label="Frequency"
              value={formData.frequency || data?.frequency || ''}
              onChange={(e) =>}
                setFormData((prev) => ({ ...prev, frequency: e.target.value }))
              }
              margin="normal"
            />
            <Input
              fullWidth
              label="Duration"
              value={formData.duration || data?.duration || ''}
              onChange={(e) =>}
                setFormData((prev) => ({ ...prev, duration: e.target.value }))
              }
              margin="normal"
            />
            <Input
              fullWidth
              multiline
              rows={3}
              label="Instructions"
              value={formData.instructions || ''}
              onChange={(e) =>
                setFormData((prev) => ({ 
                  ...prev}
                  instructions: e.target.value,}
                }))
              }
              margin="normal"
            />
          </div>
        );
      case 'referral':
        return (
          <div>
            <Input
              fullWidth
              label="Specialty"
              value={formData.specialty || data?.specialty || ''}
              onChange={(e) =>}
                setFormData((prev) => ({ ...prev, specialty: e.target.value }))
              }
              margin="normal"
            />
            <Input
              fullWidth
              label="Urgency"
              value={formData.urgency || data?.urgency || ''}
              onChange={(e) =>}
                setFormData((prev) => ({ ...prev, urgency: e.target.value }))
              }
              margin="normal"
            />
            <Input
              fullWidth
              multiline
              rows={3}
              label="Reason"
              value={formData.reason || data?.reason || ''}
              onChange={(e) =>}
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
              margin="normal"
            />
          </div>
        );
      case 'carePlan':
        return (
          <div>
            <Input
              fullWidth
              label="Plan Title"
              value={formData.title || ''}
              onChange={(e) =>}
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              margin="normal"
            />
            <Input
              fullWidth
              multiline
              rows={4}
              label="Plan Description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({ 
                  ...prev}
                  description: e.target.value,}
                }))
              }
              margin="normal"
            />
            <FormControlLabel
              control={
                <Checkbox}
                  checked={formData.followUpRequired || false}
                  onChange={(e) =>
                    setFormData((prev) => ({ 
                      ...prev}
                      followUpRequired: e.target.checked,}
                    }))
                  }
                />
              }
              label="Follow-up required"
            />
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div display="flex" justifyContent="space-between" alignItems="center">
          {getDialogTitle()}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>{renderDialogContent()}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default InterpretationPanel;
