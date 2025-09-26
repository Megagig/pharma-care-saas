import ConfidenceIndicator from './ConfidenceIndicator';

import RedFlagAlerts from './RedFlagAlerts';

import InteractionAlerts from './InteractionAlerts';

import { Button, Card, CardContent, Alert, Accordion, Separator } from '@/components/ui/button';
const SEVERITY_CONFIG = {
  low: { color: 'success' as const, icon: CheckCircleIcon, label: 'Low Risk' },
  medium: {
    color: 'warning' as const,
    icon: WarningIcon,
    label: 'Medium Risk',
  },
  high: { color: 'error' as const, icon: ErrorIcon, label: 'High Risk' },
};
const PRIORITY_CONFIG = {
  urgent: { color: 'error' as const, label: 'Urgent', icon: ErrorIcon },
  routine: { color: 'info' as const, label: 'Routine', icon: ScheduleIcon },
  optional: { color: 'default' as const, label: 'Optional', icon: InfoIcon },
};
const URGENCY_CONFIG = {
  immediate: {
    color: 'error' as const,
    label: 'Immediate',
    severity: 'error' as const,
  },
  within_24h: {
    color: 'warning' as const,
    label: 'Within 24h',
    severity: 'warning' as const,
  },
  routine: {
    color: 'info' as const,
    label: 'Routine',
    severity: 'info' as const,
  },
};
const DiagnosticResultsPanel: React.FC<DiagnosticResultsPanelProps> = ({ 
  result,
  onApprove,
  onModify,
  onReject,
  loading = false,
  error
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['diagnoses', 'redFlags'])
  );
  const handleToggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  const getSeverityChip = (severity: string) => {
    const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Chip
        icon={<Icon className="" />}
        label={config.label}
        size="small"
        color={config.color}
        
      />
    );
  };
  const getPriorityChip = (priority: string) => {
    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Chip
        icon={<Icon className="" />}
        label={config.label}
        size="small"
        color={config.color}
        
      />
    );
  };
  const getUrgencyAlert = (urgency: string) => {
    const config = URGENCY_CONFIG[urgency as keyof typeof URGENCY_CONFIG];
    if (!config) return null;
    return (
      <Alert severity={config.severity} className="">
        <div  className="">
          Referral Urgency: {config.label}
        </div>
      </Alert>
    );
  };
  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="">
          <div
            className=""
          >
            <div
              
              className=""
            >
              <PsychologyIcon className="" />
              AI Diagnostic Analysis
            </div>
            <ConfidenceIndicator
              confidence={result.aiMetadata.confidenceScore}
              size="large"
            />
          </div>
          {/* AI Metadata Summary */}
          <div container spacing={2} className="">
            <div item xs={6} md={3}>
              <div className="">
                <div  color="text.secondary">
                  Model
                </div>
                <div  className="">
                  {result.aiMetadata.modelId}
                </div>
              </div>
            </div>
            <div item xs={6} md={3}>
              <div className="">
                <div  color="text.secondary">
                  Processing Time
                </div>
                <div  className="">
                  {(result.aiMetadata.processingTime / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
            <div item xs={6} md={3}>
              <div className="">
                <div  color="text.secondary">
                  Tokens Used
                </div>
                <div  className="">
                  {result.aiMetadata.tokenUsage.totalTokens.toLocaleString()}
                </div>
              </div>
            </div>
            <div item xs={6} md={3}>
              <div className="">
                <div  color="text.secondary">
                  Confidence
                </div>
                <div  className="">
                  {(result.aiMetadata.confidenceScore * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
          {error && (
            <Alert severity="error" className="">
              {error}
            </Alert>
          )}
        </div>
        {/* Red Flag Alerts */}
        {result.redFlags.length > 0 && (
          <div className="">
            <RedFlagAlerts redFlags={result.redFlags} />
          </div>
        )}
        {/* Referral Recommendation */}
        {result.referralRecommendation?.recommended && (
          <div className="">
            {getUrgencyAlert(result.referralRecommendation.urgency)}
            <Alert severity="warning" icon={<LocalHospitalIcon />}>
              <div  className="">
                Referral Recommended: {result.referralRecommendation.specialty}
              </div>
              <div >
                {result.referralRecommendation.reason}
              </div>
            </Alert>
          </div>
        )}
        <div spacing={2}>
          {/* Differential Diagnoses */}
          <Accordion
            expanded={expandedSections.has('diagnoses')}
            onChange={() => handleToggleSection('diagnoses')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div
                className=""
              >
                <PsychologyIcon className="" />
                <div  className="">
                  Differential Diagnoses ({result.diagnoses.length})
                </div>
                <div className="">
                  <Chip
                    label={`Avg Confidence: ${((result.diagnoses.reduce((sum, d) => sum + d.probability, 0) / result.diagnoses.length) * 100).toFixed(1)}%`}
                    size="small"
                    color="primary"
                    
                  />
                </div>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {result.diagnoses.map((diagnosis, index) => (
                  <div
                    key={index}
                    divider={index < result.diagnoses.length - 1}
                  >
                    <div>
                      <div
                        className=""
                      >
                        <ConfidenceIndicator
                          confidence={diagnosis.probability}
                          size="small"
                        />
                      </div>
                    </div>
                    <div
                      primary={
                        <div
                          className=""
                        >
                          <div  className="">}
                            {diagnosis.condition}
                          </div>
                          {getSeverityChip(diagnosis.severity)}
                          {diagnosis.icdCode && (
                            <Chip
                              label={`ICD: ${diagnosis.icdCode}`}
                              size="small"
                              
                            />
                          )}
                          {diagnosis.snomedCode && (
                            <Chip
                              label={`SNOMED: ${diagnosis.snomedCode}`}
                              size="small"
                              
                            />
                          )}
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
          {/* Suggested Tests */}
          {result.suggestedTests.length > 0 && (
            <Accordion
              expanded={expandedSections.has('tests')}
              onChange={() => handleToggleSection('tests')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div className="">
                  <ScienceIcon className="" />
                  <div  className="">
                    Suggested Laboratory Tests ({result.suggestedTests.length})
                  </div>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {result.suggestedTests.map((test, index) => (
                    <div
                      key={index}
                      divider={index < result.suggestedTests.length - 1}
                    >
                      <div>
                        <ScienceIcon color="secondary" />
                      </div>
                      <div
                        primary={
                          <div
                            className=""
                          >
                            <div
                              
                              className=""
                            >}
                              {test.testName}
                            </div>
                            {getPriorityChip(test.priority)}
                            {test.loincCode && (
                              <Chip
                                label={`LOINC: ${test.loincCode}`}
                                size="small"
                                
                              />
                            )}
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
          )}
          {/* Medication Suggestions */}
          {result.medicationSuggestions.length > 0 && (
            <Accordion
              expanded={expandedSections.has('medications')}
              onChange={() => handleToggleSection('medications')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div className="">
                  <MedicationIcon className="" />
                  <div  className="">
                    Medication Suggestions (
                    {result.medicationSuggestions.length})
                  </div>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <div spacing={2}>
                  {result.medicationSuggestions.map((medication, index) => (
                    <div key={index} className="" >
                      <div
                        className=""
                      >
                        <div
                          
                          className=""
                        >
                          {medication.drugName}
                        </div>
                        {medication.rxcui && (
                          <Chip
                            label={`RxCUI: ${medication.rxcui}`}
                            size="small"
                            
                          />
                        )}
                      </div>
                      <div container spacing={2} className="">
                        <div item xs={6} md={3}>
                          <div  color="text.secondary">
                            Dosage
                          </div>
                          <div  className="">
                            {medication.dosage}
                          </div>
                        </div>
                        <div item xs={6} md={3}>
                          <div  color="text.secondary">
                            Frequency
                          </div>
                          <div  className="">
                            {medication.frequency}
                          </div>
                        </div>
                        <div item xs={6} md={3}>
                          <div  color="text.secondary">
                            Duration
                          </div>
                          <div  className="">
                            {medication.duration}
                          </div>
                        </div>
                      </div>
                      <div
                        
                        color="text.secondary"
                        className=""
                      >
                        <strong>Reasoning:</strong> {medication.reasoning}
                      </div>
                      {medication.safetyNotes.length > 0 && (
                        <div>
                          <div
                            
                            color="text.secondary"
                            className=""
                          >
                            Safety Notes:
                          </div>
                          <div spacing={0.5}>
                            {medication.safetyNotes.map((note, noteIndex) => (
                              <Alert
                                key={noteIndex}
                                severity="warning"
                                className=""
                              >
                                <div >{note}</div>
                              </Alert>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Drug Interaction Alerts */}
                  <InteractionAlerts
                    medications={result.medicationSuggestions}
                  />
                </div>
              </AccordionDetails>
            </Accordion>
          )}
        </div>
        <Separator className="" />
        {/* AI Disclaimer */}
        <Alert severity="info" className="">
          <div >
            <strong>AI Disclaimer:</strong> {result.disclaimer}
          </div>
        </Alert>
        {/* Review Status */}
        {result.pharmacistReview && (
          <div className="">
            <div  className="">
              Pharmacist Review Status
            </div>
            <div className="">
              <Chip
                label={result.pharmacistReview.status.toUpperCase()}
                color={
                  result.pharmacistReview.status === 'approved'
                    ? 'success'
                    : result.pharmacistReview.status === 'modified'
                      ? 'warning'
                      : 'error'}
                }
                
              />
              <div  color="text.secondary">
                Reviewed on{' '}
                {new Date(
                  result.pharmacistReview.reviewedAt
                ).toLocaleDateString()}
              </div>
            </div>
            {result.pharmacistReview.modifications && (
              <Alert severity="info" className="">
                <div >
                  <strong>Modifications:</strong>{' '}
                  {result.pharmacistReview.modifications}
                </div>
              </Alert>
            )}
            {result.pharmacistReview.rejectionReason && (
              <Alert severity="error" className="">
                <div >
                  <strong>Rejection Reason:</strong>{' '}
                  {result.pharmacistReview.rejectionReason}
                </div>
              </Alert>
            )}
          </div>
        )}
        {/* Action Buttons */}
        {!result.pharmacistReview && (onApprove || onModify || onReject) && (
          <div className="">
            {onReject && (
              <Button
                
                color="error"
                onClick={onReject}
                disabled={loading}
              >
                Reject
              </Button>
            )}
            {onModify && (
              <Button
                
                color="warning"
                onClick={onModify}
                disabled={loading}
              >
                Modify
              </Button>
            )}
            {onApprove && (
              <Button
                
                color="success"
                onClick={onApprove}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Approve'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default DiagnosticResultsPanel;
