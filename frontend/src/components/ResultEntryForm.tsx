import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner, Progress, Alert, Accordion } from '@/components/ui/button';
// Mock reference ranges and normal values
const REFERENCE_RANGES: Record<
  string,
  { min?: number; max?: number; unit: string; qualitative?: string[] }
> = {
    min: 4.5,
    max: 11.0,
    unit: 'x10³/μL',
  },
    unit: 'mmol/L',
    qualitative: ['Normal', 'Abnormal'],
  },
    unit: 'mg/dL',
    qualitative: ['Normal', 'Borderline', 'High'],
  },
    unit: 'Various',
    qualitative: ['Normal', 'Abnormal', 'Trace', 'Positive', 'Negative'],
  },
    min: 0.4,
    max: 4.0,
    unit: 'mIU/L',
  },
};

interface ResultFormData {
  values: LabResultValue[];
  comment: string;
}

interface ResultEntryFormProps {
  order: ManualLabOrder;
  onResultsSubmitted?: (results: any) => void;
  onCancel?: () => void;
  readonly?: boolean;
}

const ResultEntryForm: React.FC<ResultEntryFormProps> = ({ 
  order,
  onResultsSubmitted,
  onCancel,
  readonly = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [interpretations, setInterpretations] = useState<
    LabResultInterpretation[]
  >([]);

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<ResultFormData>({ 
    defaultValues: {
      values: order.tests.map((test) => ({
        testCode: test.code,
        testName: test.name,
        numericValue: undefined,
        unit: test.unit || '',
        stringValue: '',
        comment: '',
        abnormalFlag: false}
      })),
      comment: '',
    },
    mode: 'onChange'}

  // Field arrays
  const { fields: valueFields, update: updateValue } = useFieldArray({ 
    control,
    name: 'values'}
  });

  // Watch form values for real-time validation
  const watchedValues = watch('values');

  // Real-time interpretation calculation
  useEffect(() => {
    const newInterpretations: LabResultInterpretation[] = [];

    watchedValues.forEach((value, index) => {
      if (value.numericValue !== undefined && value.numericValue !== null) {
        const refRange = REFERENCE_RANGES[value.testCode];
        if (
          refRange &&
          refRange.min !== undefined &&
          refRange.max !== undefined
        ) {
          let interpretation: 'low' | 'normal' | 'high' | 'critical' = 'normal';

          if (value.numericValue < refRange.min) {
            interpretation =
              value.numericValue < refRange.min * 0.5 ? 'critical' : 'low';
          } else if (value.numericValue > refRange.max) {
            interpretation =
              value.numericValue > refRange.max * 2 ? 'critical' : 'high';
          }

          newInterpretations.push({ 
            testCode: value.testCode,
            interpretation}
            note: `Reference range: ${refRange.min}-${refRange.max} ${refRange.unit}`}

          // Update abnormal flag
          const updatedValue = {
            ...value,
            abnormalFlag: interpretation !== 'normal',
          };
          updateValue(index, updatedValue);
        }
      }
    });

    setInterpretations(newInterpretations);
  }, [watchedValues, updateValue]);

  // Validation function
  const validateResults = (data: ResultFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    data.values.forEach((value, index) => {
      const hasNumeric =
        value.numericValue !== undefined &&
        value.numericValue !== null &&
        value.numericValue !== '';
      const hasString = value.stringValue && value.stringValue.trim() !== '';

      if (!hasNumeric && !hasString) {
        errors[`values.${index}`] = 'Please enter a result value';
      }

      if (hasNumeric && value.numericValue! < 0) {
        errors[`values.${index}`] = 'Value cannot be negative';
      }

      if (hasNumeric && value.numericValue! > 999999) {
        errors[`values.${index}`] = 'Value seems unreasonably high';
      }
    });

    return errors;
  };

  // Real-time validation
  useEffect(() => {
    const data = getValues();
    const errors = validateResults(data);
    setValidationErrors(errors);
  }, [watchedValues, getValues]);

  // Get interpretation info
  const getInterpretationInfo = (interpretation: string) => {
    switch (interpretation) {
      case 'low':
        return { color: '#2196f3', icon: <TrendingDownIcon />, label: 'Low' };
      case 'high':
        return { color: '#ff9800', icon: <TrendingUpIcon />, label: 'High' };
      case 'critical':
        return { color: '#f44336', icon: <ErrorIcon />, label: 'Critical' };
      case 'normal':
      default:
        return { color: '#4caf50', icon: <CheckCircleIcon />, label: 'Normal' };
    }
  };

  // Handle form submission
  const onSubmit = async (data: ResultFormData) => {
    const errors = validateResults(data);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setShowConfirmDialog(true);
  };

  // Confirm submission
  const handleConfirmSubmission = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setAiProcessing(true);

    try {
      const data = getValues();
      const resultData: AddLabResultData = {
        values: data.values.filter(
          (v) =>
            (v.numericValue !== undefined && v.numericValue !== null) ||
            (v.stringValue && v.stringValue.trim() !== '')
        ),
        comment: data.comment || undefined,
      };

      // Mock API call for result submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock AI processing
      setAiProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock successful response
      const mockResult = {
        _id: 'result_123',
        orderId: order.orderId,
        values: resultData.values,
        interpretation: interpretations,
        aiProcessed: true,
        diagnosticResult: {
          differentialDiagnoses: [
            {
              condition: 'Normal findings',
              probability: 85,
              reasoning: 'All values within normal range',
              severity: 'low',
            },
          ],
          redFlags: [],
          recommendedTests: [],
          therapeuticOptions: [],
          confidenceScore: 90,
        },
      };

      if (onResultsSubmitted) {
        onResultsSubmitted(mockResult);
      } else {
        navigate(`/lab-orders/${order.orderId}/interpretation`);
      }
    } catch (error) {
      console.error('Failed to submit results:', error);
    } finally {
      setIsSubmitting(false);
      setAiProcessing(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  // Get test reference info
  const getTestReferenceInfo = (testCode: string) => {
    return REFERENCE_RANGES[testCode] || { unit: '', qualitative: [] };
  };

  return (
    <div className="">
      {/* Header */}
      <div className="">
        <IconButton onClick={handleCancel} className="">
          <ArrowBackIcon />
        </IconButton>
        <div className="">
          <div  className="">
            Enter Lab Results
          </div>
          <div  color="text.secondary">
            Order: {order.orderId} | Patient: {order.patient?.firstName}{' '}
            {order.patient?.lastName}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {(isSubmitting || aiProcessing) && (
        <Card className="">
          <CardContent>
            <div className="">
              <Spinner size={20} className="" />
              <div >
                {aiProcessing
                  ? 'Processing results with AI interpretation...'
                  : 'Submitting results...'}
              </div>
            </div>
            <Progress />
            {aiProcessing && (
              <div  color="text.secondary" className="">
                This may take a few moments while our AI analyzes the results
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Test Results */}
        <Card className="">
          <CardContent>
            <div  className="">
              Test Results ({order.tests.length} tests)
            </div>

            {valueFields.map((field, index) => {
              const test = order.tests[index];
              const refInfo = getTestReferenceInfo(test.code);
              const interpretation = interpretations.find(
                (i) => i.testCode === test.code
              );
              const interpretationInfo = interpretation
                ? getInterpretationInfo(interpretation.interpretation)
                : null;
              const hasError = validationErrors[`values.${index}`];

              return (
                <Accordion key={field.id} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div
                      className=""
                    >
                      <div>
                        <div
                          
                          className=""
                        >
                          {test.name}
                        </div>
                        <div className="">
                          <Chip
                            label={test.code}
                            size="small"
                            
                          />
                          <Chip
                            label={test.specimenType}
                            size="small"
                            color="primary"
                          />
                        </div>
                      </div>
                      {interpretationInfo && (
                        <Chip
                          icon={interpretationInfo.icon}
                          label={interpretationInfo.label}
                          size="small"
                          className=""
                        />
                      )}
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div container spacing={3}>
                      {/* Numeric Value */}
                      {refInfo.min !== undefined ||
                      refInfo.max !== undefined ? (
                        <div item xs={12} md={6}>
                          <Controller
                            name={`values.${index}.numericValue`}
                            control={control}
                            render={({  field: inputField  }) => (
                              <Input
                                {...inputField}
                                type="number"
                                label="Numeric Value"
                                fullWidth
                                error={!!hasError}
                                helperText={
                                  hasError ||
                                  (refInfo.min !== undefined &&
                                    refInfo.max !== undefined &&}
                                    `Reference: ${refInfo.min}-${refInfo.max}`)
                                }
                                InputProps={{
                                  endAdornment: refInfo.unit && (}
                                    <InputAdornment position="">{refInfo.unit}
                                    </InputAdornment>
                                  ),
                                disabled={readonly}
                              />
                            )}
                          />
                        </div>
                      ) : null}

                      {/* Qualitative Value */}
                      {refInfo.qualitative && refInfo.qualitative.length > 0 ? (
                        <div item xs={12} md={6}>
                          <Controller
                            name={`values.${index}.stringValue`}
                            control={control}
                            render={({  field: inputField  }) => (
                              <div fullWidth error={!!hasError}>
                                <Label>Result</Label>
                                <Select
                                  {...inputField}
                                  label="Result"
                                  disabled={readonly}
                                >
                                  <MenuItem value="">
                                    <em>Select result</em>
                                  </MenuItem>
                                  {refInfo.qualitative!.map((option) => (
                                    <MenuItem key={option} value={option}>
                                      {option}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {hasError && (
                                  <ErrorText>{hasError}</ErrorText>
                                )}
                              </div>
                            )}
                          />
                        </div>
                      ) : (
                        <div item xs={12} md={6}>
                          <Controller
                            name={`values.${index}.stringValue`}
                            control={control}
                            render={({  field: inputField  }) => (
                              <Input
                                {...inputField}
                                label="Text Result"
                                fullWidth
                                error={!!hasError}
                                helperText={
                                  hasError || 'Enter qualitative result'}
                                }
                                disabled={readonly}
                              />
                            )}
                          />
                        </div>
                      )}

                      {/* Unit (if not predefined) */}
                      {!refInfo.unit && (
                        <div item xs={12} md={6}>
                          <Controller
                            name={`values.${index}.unit`}
                            control={control}
                            render={({  field: inputField  }) => (
                              <Input
                                {...inputField}
                                label="Unit"
                                fullWidth
                                helperText="Unit of measurement"
                                disabled={readonly}
                              />
                            )}
                          />
                        </div>
                      )}

                      {/* Comments */}
                      <div item xs={12}>
                        <Controller
                          name={`values.${index}.comment`}
                          control={control}
                          render={({  field: inputField  }) => (
                            <Input
                              {...inputField}
                              label="Comments"
                              multiline
                              rows={2}
                              fullWidth
                              helperText="Additional notes or observations"
                              disabled={readonly}
                            />
                          )}
                        />
                      </div>

                      {/* Reference Information */}
                      <div item xs={12}>
                        <div
                          
                          className=""
                        >
                          <div  className="">
                            Reference Information
                          </div>
                          <div  color="text.secondary">
                            <strong>Specimen:</strong> {test.specimenType}
                          </div>
                          <div  color="text.secondary">
                            <strong>Reference Range:</strong> {test.refRange}
                          </div>
                          {test.loincCode && (
                            <div  color="text.secondary">
                              <strong>LOINC Code:</strong> {test.loincCode}
                            </div>
                          )}
                          {interpretation && (
                            <div
                              className=""
                            >
                              {interpretationInfo?.icon}
                              <div
                                
                                className=""
                              >
                                Interpretation: {interpretationInfo?.label}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </CardContent>
        </Card>

        {/* Overall Comments */}
        <Card className="">
          <CardContent>
            <div  className="">
              Overall Comments
            </div>
            <Controller
              name="comment"
              control={control}
              render={({  field  }) => (
                <Input
                  {...field}
                  label="General Comments"
                  multiline
                  rows={4}
                  fullWidth
                  helperText="Any additional observations or notes about the overall results"
                  disabled={readonly}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Validation Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert severity="error" className="">
            <div  className="">
              Please correct the following errors:
            </div>
            {Object.entries(validationErrors).map(([field, error]) => (
              <div key={field} >
                • {error}
              </div>
            ))}
          </Alert>
        )}

        {/* Critical Values Alert */}
        {interpretations.some((i) => i.interpretation === 'critical') && (
          <Alert severity="warning" className="">
            <div className="">
              <WarningIcon className="" />
              <div >
                <strong>Critical values detected!</strong> These results require
                immediate attention and may trigger urgent notifications.
              </div>
            </div>
          </Alert>
        )}

        {/* AI Processing Info */}
        <Alert severity="info" className="">
          <div className="">
            <PsychologyIcon className="" />
            <div >
              After submitting, these results will be automatically analyzed by
              our AI system to provide diagnostic insights and recommendations.
            </div>
          </div>
        </Alert>

        {/* Form Actions */}
        <div
          className=""
        >
          <Button
            
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            
            startIcon={<SaveIcon />}
            disabled={
              !isValid ||
              isSubmitting ||
              Object.keys(validationErrors).length > 0 ||
              readonly}
            }
            size="large"
          >
            {isSubmitting ? 'Processing...' : 'Submit Results'}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div className="">
            <CheckCircleIcon color="primary" className="" />
            Confirm Result Submission
          </div>
        </DialogTitle>
        <DialogContent>
          <div  className="">
            You are about to submit results for {order.tests.length} tests. This
            action cannot be undone.
          </div>

          {/* Summary of results */}
          <div  className="">
            <div  className="">
              Results Summary:
            </div>
            {watchedValues.map((value, index) => {
              const hasValue =
                (value.numericValue !== undefined &&
                  value.numericValue !== null) ||
                (value.stringValue && value.stringValue.trim() !== '');

              if (!hasValue) return null;

              return (
                <div key={index}  className="">
                  • {value.testName}: {value.numericValue || value.stringValue}{' '}
                  {value.unit}
                </div>
              );
            })}
          </div>

          {interpretations.some((i) => i.interpretation === 'critical') && (
            <Alert severity="warning" className="">
              <div >
                <strong>Warning:</strong> Critical values detected. Urgent
                notifications will be sent to relevant healthcare providers.
              </div>
            </Alert>
          )}

          <div  color="text.secondary">
            The results will be processed by our AI system for diagnostic
            insights and recommendations.
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button
            
            onClick={handleConfirmSubmission}
            startIcon={<SaveIcon />}
          >
            Confirm & Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ResultEntryForm;
