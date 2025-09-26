import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner, Progress, Alert, Accordion, Separator } from '@/components/ui/button';
// ===============================
// TYPES AND INTERFACES
// ===============================
interface OutcomeTrackingData {
  outcome: InterventionOutcome;
}
interface OutcomeTrackingStepProps {
  onNext: (data: OutcomeTrackingData) => void;
  onBack?: () => void;
  onCancel?: () => void;
  initialData?: {
    outcome?: InterventionOutcome;
  };
  isLoading?: boolean;
}
interface ClinicalParameter {
  parameter: string;
  beforeValue?: string;
  afterValue?: string;
  unit?: string;
  improvementPercentage?: number;
}
// ===============================
// CONSTANTS
// ===============================
const PATIENT_RESPONSE_OPTIONS = {
  improved: {
    label: 'Improved',
    description: 'Patient condition or symptoms have improved',
    icon: <TrendingUpIcon />,
    color: '#4caf50',
  },
  no_change: {
    label: 'No Change',
    description: 'No significant change in patient condition',
    icon: <TrendingFlatIcon />,
    color: '#ff9800',
  },
  worsened: {
    label: 'Worsened',
    description: 'Patient condition has deteriorated',
    icon: <TrendingDownIcon />,
    color: '#f44336',
  },
  unknown: {
    label: 'Unknown',
    description: 'Unable to determine patient response',
    icon: <InfoIcon />,
    color: '#9e9e9e',
  },
} as const;
const SUCCESS_METRICS = [
  {
    key: 'problemResolved',
    label: 'Clinical Problem Resolved',
    description:
      'The identified clinical issue has been successfully addressed',
  },
  {
    key: 'medicationOptimized',
    label: 'Medication Regimen Optimized',
    description: "Patient's medication therapy has been improved",
  },
  {
    key: 'adherenceImproved',
    label: 'Medication Adherence Improved',
    description: 'Patient compliance with medication regimen has increased',
  },
  {
    key: 'qualityOfLifeImproved',
    label: 'Quality of Life Improved',
    description: "Patient's overall quality of life has been enhanced",
  },
] as const;
const COMMON_PARAMETERS = [
  { name: 'Blood Pressure (Systolic)', unit: 'mmHg', type: 'numeric' },
  { name: 'Blood Pressure (Diastolic)', unit: 'mmHg', type: 'numeric' },
  { name: 'Heart Rate', unit: 'bpm', type: 'numeric' },
  { name: 'Blood Glucose', unit: 'mg/dL', type: 'numeric' },
  { name: 'HbA1c', unit: '%', type: 'numeric' },
  { name: 'Total Cholesterol', unit: 'mg/dL', type: 'numeric' },
  { name: 'LDL Cholesterol', unit: 'mg/dL', type: 'numeric' },
  { name: 'HDL Cholesterol', unit: 'mg/dL', type: 'numeric' },
  { name: 'Triglycerides', unit: 'mg/dL', type: 'numeric' },
  { name: 'Creatinine', unit: 'mg/dL', type: 'numeric' },
  { name: 'eGFR', unit: 'mL/min/1.73m²', type: 'numeric' },
  { name: 'Pain Scale', unit: '0-10', type: 'numeric' },
  { name: 'Weight', unit: 'kg', type: 'numeric' },
  { name: 'BMI', unit: 'kg/m²', type: 'numeric' },
  { name: 'Medication Adherence', unit: '%', type: 'numeric' },
] as const;
const SEVERITY_LEVELS = {
  mild: {
    label: 'Mild',
    description: 'Minor discomfort or inconvenience',
    color: '#4caf50',
  },
  moderate: {
    label: 'Moderate',
    description: 'Noticeable impact on daily activities',
    color: '#ff9800',
  },
  severe: {
    label: 'Severe',
    description: 'Significant impact requiring intervention',
    color: '#f44336',
  },
  life_threatening: {
    label: 'Life-threatening',
    description: 'Immediate medical attention required',
    color: '#d32f2f',
  },
} as const;
// ===============================
// MAIN COMPONENT
// ===============================
const OutcomeTrackingStep: React.FC<OutcomeTrackingStepProps> = ({ 
  onNext,
  onBack,
  onCancel,
  initialData,
  isLoading = false
}) => {
  // State
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('response');
  // Form setup
  const defaultValues: OutcomeTrackingData = useMemo(
    () => ({ 
      outcome: {
        patientResponse: initialData?.outcome?.patientResponse || 'unknown',
        clinicalParameters: initialData?.outcome?.clinicalParameters || [],
        adverseEffects: initialData?.outcome?.adverseEffects || '',
        additionalIssues: initialData?.outcome?.additionalIssues || '',
        successMetrics: {
          problemResolved:
            initialData?.outcome?.successMetrics?.problemResolved || false,
          medicationOptimized:
            initialData?.outcome?.successMetrics?.medicationOptimized || false,
          adherenceImproved:
            initialData?.outcome?.successMetrics?.adherenceImproved || false,
          costSavings:
            initialData?.outcome?.successMetrics?.costSavings || undefined,
          qualityOfLifeImproved:
            initialData?.outcome?.successMetrics?.qualityOfLifeImproved ||
            false}
        },
      }, },
    [initialData?.outcome]
  );
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<OutcomeTrackingData>({ 
    defaultValues,
    mode: 'onChange'}
  });
  const {
    fields: parameterFields,
    append: appendParameter,
    remove: removeParameter,
  } = useFieldArray({ 
    control,
    name: 'outcome.clinicalParameters'}
  });
  const watchedOutcome = watch('outcome');
  const watchedResponse = watch('outcome.patientResponse');
  const watchedParameters = watch('outcome.clinicalParameters');
  // Calculate overall improvement percentage
  const overallImprovement = useMemo(() => {
    if (!watchedParameters || watchedParameters.length === 0) return 0;
    const validParameters = watchedParameters.filter(
      (p) =>
        p.improvementPercentage !== undefined &&
        p.improvementPercentage !== null
    );
    if (validParameters.length === 0) return 0;
    const total = validParameters.reduce(
      (sum, p) => sum + (p.improvementPercentage || 0),
      0
    );
    return Math.round(total / validParameters.length);
  }, [watchedParameters]);
  // ===============================
  // HANDLERS
  // ===============================
  const handleAddParameter = (parameterName?: string, unit?: string) => {
    appendParameter({ 
      parameter: parameterName || '',
      beforeValue: '',
      afterValue: '',
      unit: unit || '',
      improvementPercentage: undefined}
    });
  };
  const handleRemoveParameter = (index: number) => {
    removeParameter(index);
  };
  const calculateImprovement = (
    beforeValue: string,
    afterValue: string,
    parameter: string
  ) => {
    const before = parseFloat(beforeValue);
    const after = parseFloat(afterValue);
    if (isNaN(before) || isNaN(after)) return undefined;
    // For parameters where lower is better (e.g., blood pressure, cholesterol, pain)
    const lowerIsBetter = [
      'blood pressure',
      'cholesterol',
      'pain',
      'glucose',
      'hba1c',
      'triglycerides',
      'creatinine',
      'weight',
      'bmi',
    ].some((term) => parameter.toLowerCase().includes(term));
    let improvement;
    if (lowerIsBetter) {
      improvement = ((before - after) / before) * 100;
    } else {
      // For parameters where higher is better (e.g., HDL, eGFR, adherence)
      improvement = ((after - before) / before) * 100;
    }
    return Math.round(improvement);
  };
  const handleParameterChange = (
    index: number,
    field: keyof ClinicalParameter,
    value: string
  ) => {
    setValue(`outcome.clinicalParameters.${index}.${field}`, value);
    // Auto-calculate improvement percentage when both values are present
    if (field === 'beforeValue' || field === 'afterValue') {
      const parameter = watchedParameters[index];
      if (parameter) {
        const beforeValue =
          field === 'beforeValue' ? value : parameter.beforeValue;
        const afterValue =
          field === 'afterValue' ? value : parameter.afterValue;
        if (beforeValue && afterValue) {
          const improvement = calculateImprovement(
            beforeValue,
            afterValue,
            parameter.parameter
          );
          setValue(
            `outcome.clinicalParameters.${index}.improvementPercentage`,
            improvement
          );
        }
      }
    }
  };
  const onSubmit = (data: OutcomeTrackingData) => {
    onNext(data);
  };
  // ===============================
  // RENDER HELPERS
  // ===============================
  const renderPatientResponse = () => (
    <Accordion
      expanded={expandedSection === 'response'}
      onChange={() =>
        setExpandedSection(expandedSection === 'response' ? '' : 'response')}
      }
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <div
          
          className=""
        >
          <AssessmentIcon color="primary" />
          Patient Response Assessment
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div  color="text.secondary" className="">
          Evaluate the overall patient response to the intervention
        </div>
        <Controller
          name="outcome.patientResponse"
          control={control}
          
          render={({  field  }) => (
            <div container spacing={2}>
              {Object.entries(PATIENT_RESPONSE_OPTIONS).map(
                ([value, config]) => (
                  <div item xs={12} sm={6} md={3} key={value}>
                    <div
                      className=""10`
                            : 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        textAlign: 'center',
                        '&:hover': {
                          borderColor: config.color,
                          bgcolor: `${config.color}05`,
                        },
                      onClick={() => field.onChange(value)}
                    >
                      <div className="">
                        {config.icon}
                      </div>
                      <div
                        
                        fontWeight="medium"
                        className=""
                      >
                        {config.label}
                      </div>
                      <div  color="text.secondary">
                        {config.description}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        />
        {errors.outcome?.patientResponse && (
          <div  color="error" className="">
            {errors.outcome.patientResponse.message}
          </div>
        )}
      </AccordionDetails>
    </Accordion>
  );
  const renderClinicalParameters = () => (
    <Accordion
      expanded={expandedSection === 'parameters'}
      onChange={() =>
        setExpandedSection(expandedSection === 'parameters' ? '' : 'parameters')}
      }
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <div
          
          className=""
        >
          <TimelineIcon color="primary" />
          Clinical Parameters
          {watchedParameters.length > 0 && (
            <Chip
              size="small"
              label={`${watchedParameters.length} parameters`}
            />
          )}
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div  color="text.secondary" className="">
          Track measurable clinical parameters before and after intervention
        </div>
        {overallImprovement !== 0 && (
          <Alert
            severity={overallImprovement > 0 ? 'success' : 'warning'}
            className=""
            icon={
              overallImprovement > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            }
          >
            <div  fontWeight="medium">
              Overall Improvement: {overallImprovement > 0 ? '+' : ''}
              {overallImprovement}%
            </div>
          </Alert>
        )}
        {parameterFields.map((field, index) => {
          const parameter = watchedParameters[index];
          const improvement = parameter?.improvementPercentage;
          return (
            <Card
              key={field.id}
              className=""
            >
              <CardContent>
                <div
                  className=""
                >
                  <div  fontWeight="medium">
                    Parameter {index + 1}
                  </div>
                  <div className="">
                    {improvement !== undefined && (
                      <Chip
                        size="small"
                        label={`${improvement > 0 ? '+' : ''}${improvement}%`}
                        color={
                          improvement > 0
                            ? 'success'
                            : improvement < 0
                            ? 'error'
                            : 'default'}
                        }
                        icon={
                          improvement > 0 ? (
                            <TrendingUpIcon />
                          ) : improvement < 0 ? (
                            <TrendingDownIcon />
                          ) : (
                            <TrendingFlatIcon />
                          )}
                        }
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveParameter(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </div>
                </div>
                <div container spacing={2}>
                  <div item xs={12} md={4}>
                    <Controller
                      name={`outcome.clinicalParameters.${index}.parameter`}
                      control={control}
                      
                      render={({  field  }) => (
                        <div fullWidth>
                          <Label>Parameter</Label>
                          <Select
                            {...field}
                            label="Parameter"
                            onChange={(e) => {
                              field.onChange(e);
                              const selected = COMMON_PARAMETERS.find(
                                (p) => p.name === e.target.value
                              );
                              if (selected) {
                                setValue(}
                                  `outcome.clinicalParameters.${index}.unit`,
                                  selected.unit
                                );
                              }>
                            {COMMON_PARAMETERS.map((param) => (
                              <MenuItem key={param.name} value={param.name}>
                                {param.name} ({param.unit})
                              </MenuItem>
                            ))}
                            <MenuItem value="custom">Custom Parameter</MenuItem>
                          </Select>
                        </div>
                      )}
                    />
                  </div>
                  <div item xs={12} md={2}>
                    <Controller
                      name={`outcome.clinicalParameters.${index}.unit`}
                      control={control}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="Unit"
                          placeholder="e.g., mg/dL"
                        />
                      )}
                    />
                  </div>
                  <div item xs={12} md={3}>
                    <Controller
                      name={`outcome.clinicalParameters.${index}.beforeValue`}
                      control={control}
                      
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="Before Value"
                          placeholder="0.0"
                          
                          error={
                            !!errors.outcome?.clinicalParameters?.[index]
                              ?.beforeValue}
                          }
                          helperText={
                            errors.outcome?.clinicalParameters?.[index]
                              ?.beforeValue?.message}
                          }
                        />
                      )}
                    />
                  </div>
                  <div item xs={12} md={3}>
                    <Controller
                      name={`outcome.clinicalParameters.${index}.afterValue`}
                      control={control}
                      
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="After Value"
                          placeholder="0.0"
                          
                          error={
                            !!errors.outcome?.clinicalParameters?.[index]
                              ?.afterValue}
                          }
                          helperText={
                            errors.outcome?.clinicalParameters?.[index]
                              ?.afterValue?.message}
                          }
                        />
                      )}
                    />
                  </div>
                </div>
                {improvement !== undefined && (
                  <div className="">
                    <div
                      
                      color="text.secondary"
                      className=""
                    >
                      Improvement: {improvement}%
                    </div>
                    <Progress
                      
                      color={improvement > 0 ? 'success' : 'error'}
                      className=""
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        <div className="">
          {COMMON_PARAMETERS.slice(0, 5).map((param) => (
            <Button
              key={param.name}
              size="small"
              
              onClick={() => handleAddParameter(param.name, param.unit)}
            >
              Add {param.name}
            </Button>
          ))}
        </div>
        <Button
          
          startIcon={<AddIcon />}
          onClick={() => handleAddParameter()}
          fullWidth
        >
          Add Custom Parameter
        </Button>
      </AccordionDetails>
    </Accordion>
  );
  const renderSuccessMetrics = () => (
    <Accordion
      expanded={expandedSection === 'metrics'}
      onChange={() =>
        setExpandedSection(expandedSection === 'metrics' ? '' : 'metrics')}
      }
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <div
          
          className=""
        >
          <CheckCircleIcon color="primary" />
          Success Metrics
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div  color="text.secondary" className="">
          Evaluate the success of the intervention across different dimensions
        </div>
        <FormGroup>
          {SUCCESS_METRICS.map((metric) => (
            <Controller
              key={metric.key}
              name={`outcome.successMetrics.${metric.key}`}
              control={control}
              render={({  field  }) => (
                <FormControlLabel
                  control={
                    <Checkbox}
                      {...field}
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label={
                    <div>
                      <div  fontWeight="medium">}
                        {metric.label}
                      </div>
                      <div  color="text.secondary">
                        {metric.description}
                      </div>
                    </div>
                  }
                />
              )}
            />
          ))}
        </FormGroup>
        <Separator className="" />
        <Controller
          name="outcome.successMetrics.costSavings"
          control={control}
          render={({  field  }) => (
            <Input
              {...field}
              fullWidth
              type="number"
              label="Estimated Cost Savings (Optional)"
              placeholder="0.00"
              
              helperText="Estimated cost savings from this intervention"
            />
          )}
        />
      </AccordionDetails>
    </Accordion>
  );
  const renderAdverseEffects = () => (
    <Accordion
      expanded={expandedSection === 'adverse'}
      onChange={() =>
        setExpandedSection(expandedSection === 'adverse' ? '' : 'adverse')}
      }
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <div
          
          className=""
        >
          <WarningIcon color="primary" />
          Adverse Effects & Issues
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div container spacing={2}>
          <div item xs={12}>
            <Controller
              name="outcome.adverseEffects"
              control={control}
              render={({  field  }) => (
                <Input
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Adverse Effects (Optional)"
                  placeholder="Document any adverse effects or complications that occurred..."
                  helperText="Include severity, duration, and any corrective actions taken"
                />
              )}
            />
          </div>
          <div item xs={12}>
            <Controller
              name="outcome.additionalIssues"
              control={control}
              render={({  field  }) => (
                <Input
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Issues (Optional)"
                  placeholder="Document any new issues or concerns that emerged..."
                  helperText="Include any new clinical problems or complications"
                />
              )}
            />
          </div>
        </div>
      </AccordionDetails>
    </Accordion>
  );
  const renderOutcomeSummary = () => {
    const successCount = Object.values(watchedOutcome.successMetrics).filter(
      Boolean
    ).length;
    const responseConfig = PATIENT_RESPONSE_OPTIONS[watchedResponse];
    return (
      <Card
        className=""
      >
        <CardContent>
          <div
            
            gutterBottom
            className=""
          >
            <CalculateIcon color="primary" />
            Outcome Summary
          </div>
          <div container spacing={2}>
            <div item xs={12} sm={6} md={3}>
              <div className="">
                <div className="">
                  {responseConfig.icon}
                </div>
                <div >{responseConfig.label}</div>
                <div  color="text.secondary">
                  Patient Response
                </div>
              </div>
            </div>
            <div item xs={12} sm={6} md={3}>
              <div className="">
                <div  color="primary">
                  {watchedParameters.length}
                </div>
                <div  color="text.secondary">
                  Parameters Tracked
                </div>
              </div>
            </div>
            <div item xs={12} sm={6} md={3}>
              <div className="">
                <div  color="success.main">
                  {successCount}/4
                </div>
                <div  color="text.secondary">
                  Success Metrics
                </div>
              </div>
            </div>
            <div item xs={12} sm={6} md={3}>
              <div className="">
                <div
                  
                  color={
                    overallImprovement > 0
                      ? 'success.main'
                      : overallImprovement < 0
                      ? 'error.main'
                      : 'text.secondary'}
                  }
                >
                  {overallImprovement > 0 ? '+' : ''}
                  {overallImprovement}%
                </div>
                <div  color="text.secondary">
                  Overall Improvement
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderPreviewDialog = () => (
    <Dialog
      open={showPreview}
      onClose={() => setShowPreview(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Outcome Preview</DialogTitle>
      <DialogContent>
        <div  color="text.secondary" className="">
          Review the complete outcome assessment before finalizing
        </div>
        {renderOutcomeSummary()}
        <div  gutterBottom>
          Patient Response
        </div>
        <div  className="">
          {PATIENT_RESPONSE_OPTIONS[watchedResponse].label}:{' '}
          {PATIENT_RESPONSE_OPTIONS[watchedResponse].description}
        </div>
        {watchedParameters.length > 0 && (
          <>
            <div  gutterBottom>
              Clinical Parameters
            </div>
            <List dense>
              {watchedParameters.map((param, index) => (
                <div key={index}>
                  <div
                    primary={`${param.parameter}: ${param.beforeValue} → ${param.afterValue} ${param.unit}`}
                    secondary={
                      param.improvementPercentage !== undefined
                        ? `Improvement: ${
                            param.improvementPercentage > 0 ? '+' : ''}
                          }${param.improvementPercentage}%`
                        : 'No improvement calculated'
                    }
                  />
                </div>
              ))}
            </List>
          </>
        )}
        <div  gutterBottom className="">
          Success Metrics
        </div>
        <List dense>
          {SUCCESS_METRICS.map((metric) => (
            <div key={metric.key}>
              <div>
                {watchedOutcome.successMetrics[metric.key] ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <CancelIcon color="disabled" />
                )}
              </div>
              <div primary={metric.label} />
            </div>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowPreview(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
  return (
    <div>
      <div  gutterBottom>
        Step 4: Outcome Tracking
      </div>
      <div  color="text.secondary" className="">
        Document and measure the outcomes of the clinical intervention
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {renderOutcomeSummary()}
        <div className="">
          {renderPatientResponse()}
          {renderClinicalParameters()}
          {renderSuccessMetrics()}
          {renderAdverseEffects()}
        </div>
        {renderPreviewDialog()}
        <div className="">
          <div>
            <Button
              
              onClick={onCancel}
              disabled={isLoading}
              className=""
            >
              Cancel
            </Button>
            <Button  onClick={onBack} disabled={isLoading}>
              Back
            </Button>
          </div>
          <div>
            <Button
              
              startIcon={<PreviewIcon />}
              onClick={() => setShowPreview(true)}
              className=""
            >
              Preview
            </Button>
            <Button
              type="submit"
              
              disabled={!isValid || isLoading}
              startIcon={}
                isLoading ? <Spinner size={20} /> : <SaveIcon />
              }
            >
              {isLoading ? 'Saving...' : 'Complete Intervention'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default OutcomeTrackingStep;
