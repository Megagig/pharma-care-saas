import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner, Progress, Alert, Separator } from '@/components/ui/button';
// Mock test catalog data - in real implementation, this would come from API
const MOCK_TEST_CATALOG: TestCatalogItem[] = [
  {
    _id: '1',
    name: 'Complete Blood Count',
    code: 'CBC',
    loincCode: '58410-2',
    specimenType: 'Blood',
    unit: 'cells/μL',
    refRange: '4.5-11.0 x10³',
    category: 'Hematology',
    description: 'Full blood count with differential',
    isActive: true,
  },
  {
    _id: '2',
    name: 'Basic Metabolic Panel',
    code: 'BMP',
    loincCode: '51990-0',
    specimenType: 'Blood',
    unit: 'mmol/L',
    refRange: 'Various',
    category: 'Chemistry',
    description: 'Glucose, electrolytes, kidney function',
    isActive: true,
  },
  {
    _id: '3',
    name: 'Lipid Panel',
    code: 'LIPID',
    loincCode: '57698-3',
    specimenType: 'Blood',
    unit: 'mg/dL',
    refRange: 'Various',
    category: 'Chemistry',
    description: 'Cholesterol, triglycerides, HDL, LDL',
    isActive: true,
  },
  {
    _id: '4',
    name: 'Urinalysis',
    code: 'UA',
    loincCode: '24357-6',
    specimenType: 'Urine',
    unit: 'Various',
    refRange: 'Various',
    category: 'Chemistry',
    description: 'Complete urine analysis',
    isActive: true,
  },
  {
    _id: '5',
    name: 'Thyroid Function Tests',
    code: 'TFT',
    loincCode: '24348-5',
    specimenType: 'Blood',
    unit: 'mIU/L',
    refRange: '0.4-4.0',
    category: 'Chemistry',
    description: 'TSH, T3, T4',
    isActive: true,
  },
];
interface LabOrderFormData {
  patient: string;
  tests: TestDefinition[];
  indication: string;
  priority: LabOrderPriority;
  notes: string;
  consentObtained: boolean;
}
interface LabOrderBuilderProps {
  patientId?: string;
  onOrderCreated?: (order: any) => void;
  onCancel?: () => void;
}
const steps = ['Patient & Tests', 'Order Details', 'Review & Submit'];
const LabOrderBuilder: React.FC<LabOrderBuilderProps> = ({ 
  patientId,
  onOrderCreated,
  onCancel
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  // Debounced search queries
  const debouncedTestSearch = useDebounce(testSearchQuery, 300);
  const debouncedPatientSearch = useDebounce(patientSearchQuery, 300);
  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
    reset,
  } = useForm<LabOrderFormData>({ 
    defaultValues: {
      patient: patientId || '',
      tests: [],
      indication: '',
      priority: 'routine',
      notes: '',
      consentObtained: false}
    },
    mode: 'onChange'}
  // Field arrays
  const {
    fields: testFields,
    append: appendTest,
    remove: removeTest,
  } = useFieldArray({ 
    control,
    name: 'tests'}
  });
  // Watch form values
  const watchedPatient = watch('patient');
  const watchedTests = watch('tests');
  const watchedConsent = watch('consentObtained');
  // Patient search query
  const { data: patientSearchResults, isLoading: patientsLoading } =
    useSearchPatients(debouncedPatientSearch);
  // Filter test catalog based on search and category
  const filteredTests = useMemo(() => {
    let filtered = MOCK_TEST_CATALOG.filter((test) => test.isActive);
    if (debouncedTestSearch) {
      const query = debouncedTestSearch.toLowerCase();
      filtered = filtered.filter(
        (test) =>
          test.name.toLowerCase().includes(query) ||
          test.code.toLowerCase().includes(query) ||
          test.category.toLowerCase().includes(query)
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((test) => test.category === selectedCategory);
    }
    return filtered;
  }, [debouncedTestSearch, selectedCategory]);
  // Get patients for autocomplete
  const patients = useMemo(() => {
    return patientSearchResults?.data?.results || [];
  }, [patientSearchResults]);
  // Validation functions
  const canProceedToNext = (): boolean => {
    switch (activeStep) {
      case 0: // Patient & Tests
        return !!(watchedPatient && watchedTests.length > 0);
      case 1: // Order Details
        return !!watch('indication').trim();
      case 2: // Review & Submit
        return watchedConsent;
      default:
        return true;
    }
  };
  // Navigation handlers
  const handleNext = () => {
    if (activeStep === 1 && !watchedConsent) {
      setShowConsentDialog(true);
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };
  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };
  // Test management
  const handleAddTest = (test: TestCatalogItem) => {
    const testDefinition: TestDefinition = {
      name: test.name,
      code: test.code,
      loincCode: test.loincCode,
      specimenType: test.specimenType,
      unit: test.unit,
      refRange: test.refRange,
      category: test.category,
    };
    // Check if test already added
    const existingTest = watchedTests.find((t) => t.code === test.code);
    if (!existingTest) {
      appendTest(testDefinition);
    }
  };
  const handleRemoveTest = (index: number) => {
    removeTest(index);
  };
  // Form submission
  const onSubmit = async (data: LabOrderFormData) => {
    if (!data.consentObtained) {
      setShowConsentDialog(true);
      return;
    }
    setIsSubmitting(true);
    setPdfGenerating(true);
    try {
      const orderData: CreateLabOrderData = {
        patientId: data.patient,
        tests: data.tests,
        indication: data.indication,
        priority: data.priority,
        notes: data.notes || undefined,
        consentObtained: data.consentObtained,
      };
      // Mock API call - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Mock response
      const mockOrder = {
        _id: 'order_123',
        orderId: 'LAB-2024-0001',
        ...orderData,
        status: 'requested',
        createdAt: new Date().toISOString(),
      };
      const mockPdfUrl = '/api/manual-lab-orders/LAB-2024-0001/pdf';
      setPdfUrl(mockPdfUrl);
      setPdfGenerating(false);
      if (onOrderCreated) {
        onOrderCreated(mockOrder);
      } else {
        // Default navigation
        navigate('/lab-orders');
      }
    } catch (error) {
      console.error('Failed to create lab order:', error);
      setPdfGenerating(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Handle consent confirmation
  const handleConsentConfirm = () => {
    setValue('consentObtained', true);
    setShowConsentDialog(false);
    if (activeStep === 1) {
      handleNext();
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
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="">
        {/* Header */}
        <div className="">
          <div  className="">
            Create Lab Order
          </div>
          <div  color="text.secondary">
            Create a manual lab requisition with printable PDF
          </div>
        </div>
        {/* Progress Stepper */}
        <Card className="">
          <CardContent>
            <Stepper
              activeStep={activeStep}
              alternativeLabel={!isMobile}
              orientation={isMobile ? 'vertical' : 'horizontal'}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    error={index === 0 && activeStep > 0 && !canProceedToNext()}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 0: Patient & Tests */}
          {activeStep === 0 && (
            <div container spacing={3}>
              {/* Patient Selection */}
              <div item xs={12}>
                <Card>
                  <CardContent>
                    <div  className="">
                      Patient Selection
                    </div>
                    <Controller
                      name="patient"
                      control={control}
                      
                      render={({  field  }) => (
                        <Autocomplete
                          {...field}
                          options={patients}
                          getOptionLabel={(option: Patient) =>}
                            `${option.firstName} ${option.lastName} (${option.mrn})`
                          }
                          value={
                            patients.find((p) => p._id === field.value) || null}
                          }
                          onChange={(_, value) => {
                            field.onChange(value?._id || '');
                            if (value) {
                              setPatientSearchQuery('');}
                            }
                          onInputChange={(_, value, reason) => {
                            if (reason === 'input') {
                              setPatientSearchQuery(value);}
                            }
                          loading={patientsLoading}
                          disabled={!!patientId}
                          renderInput={(params) => (
                            <Input}
                              {...params}
                              label="Search Patient *"
                              error={!!errors.patient}
                              helperText={
                                errors.patient?.message ||
                                'Search by name or MRN'}
                              }
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>{patientsLoading ? (
                                      <Spinner
                                        color="inherit"}
                                        size={20}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                            />
                          )}
                        />
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
              {/* Test Selection */}
              <div item xs={12}>
                <Card>
                  <CardContent>
                    <div  className="">
                      Test Selection
                    </div>
                    {/* Test Search and Filters */}
                    <div container spacing={2} className="">
                      <div item xs={12} md={6}>
                        <Input
                          fullWidth
                          label="Search Tests"
                          value={testSearchQuery}
                          onChange={(e) => setTestSearchQuery(e.target.value)}
                          
                          placeholder="Search by test name or code"
                        />
                      </div>
                      <div item xs={12} md={6}>
                        <div fullWidth>
                          <Label>Category</Label>
                          <Select
                            value={selectedCategory}
                            onChange={(e) =>
                              setSelectedCategory(e.target.value)}
                            }
                            label="Category"
                          >
                            <MenuItem value="">All Categories</MenuItem>
                            {TEST_CATEGORIES.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>
                    {/* Available Tests */}
                    <div  className="">
                      Available Tests ({filteredTests.length})
                    </div>
                    <div
                      
                      className=""
                    >
                      <List>
                        {filteredTests.map((test, index) => (
                          <React.Fragment key={test._id}>
                            <div>
                              <div
                                primary={
                                  <div
                                    className=""
                                  >
                                    <div >}
                                      {test.name}
                                    </div>
                                    <Chip
                                      label={test.code}
                                      size="small"
                                      
                                    />
                                    <Chip
                                      label={test.category}
                                      size="small"
                                      color="primary"
                                    />
                                  </div>
                                }
                                secondary={
                                  <div className="">
                                    <div >}
                                      {test.description}
                                    </div>
                                    <div
                                      
                                      color="text.secondary"
                                    >
                                      Specimen: {test.specimenType} | Range:{' '}
                                      {test.refRange}
                                    </div>
                                  </div>
                                }
                              />
                              <divSecondaryAction>
                                <Button
                                  
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => handleAddTest(test)}
                                  disabled={watchedTests.some(
                                    (t) => t.code === test.code}
                                  )}
                                >
                                  {watchedTests.some(
                                    (t) => t.code === test.code
                                  )
                                    ? 'Added'
                                    : 'Add'}
                                </Button>
                              </ListItemSecondaryAction>
                            </div>
                            {index < filteredTests.length - 1 && <Separator />}
                          </React.Fragment>
                        ))}
                      </List>
                    </div>
                    {/* Selected Tests */}
                    <div  className="">
                      Selected Tests ({watchedTests.length})
                    </div>
                    {watchedTests.length === 0 ? (
                      <Alert severity="info">
                        No tests selected. Please add tests from the catalog
                        above.
                      </Alert>
                    ) : (
                      <div >
                        <List>
                          {testFields.map((test, index) => (
                            <React.Fragment key={test.id}>
                              <div>
                                <div
                                  primary={
                                    <div
                                      className=""
                                    >
                                      <div >}
                                        {test.name}
                                      </div>
                                      <Chip
                                        label={test.code}
                                        size="small"
                                        
                                      />
                                    </div>
                                  }
                                  secondary={`${test.specimenType} | ${test.refRange}`}
                                />
                                <divSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleRemoveTest(index)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </div>
                              {index < testFields.length - 1 && <Separator />}
                            </React.Fragment>
                          ))}
                        </List>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* Step 1: Order Details */}
          {activeStep === 1 && (
            <div container spacing={3}>
              <div item xs={12}>
                <Card>
                  <CardContent>
                    <div  className="">
                      Order Details
                    </div>
                    <div container spacing={3}>
                      {/* Clinical Indication */}
                      <div item xs={12}>
                        <Controller
                          name="indication"
                          control={control}
                          rules={{
                            required: 'Clinical indication is required',
                            minLength: {
                              value: 10,
                              message:
                                'Please provide a detailed clinical indication',}
                            },
                          render={({  field  }) => (
                            <Input
                              {...field}
                              label="Clinical Indication *"
                              multiline
                              rows={4}
                              fullWidth
                              error={!!errors.indication}
                              helperText={
                                errors.indication?.message ||
                                'Provide the clinical reason for ordering these tests'}
                              }
                              placeholder="e.g., Routine health screening, Follow-up for diabetes management, Investigation of chest pain..."
                            />
                          )}
                        />
                      </div>
                      {/* Priority */}
                      <div item xs={12} md={6}>
                        <Controller
                          name="priority"
                          control={control}
                          render={({  field  }) => (
                            <div fullWidth>
                              <Label>Priority</Label>
                              <Select {...field} label="Priority">
                                {LAB_ORDER_PRIORITIES.map((priority) => (
                                  <MenuItem
                                    key={priority.value}
                                    value={priority.value}
                                  >
                                    <div
                                      className=""
                                    >
                                      <div
                                        className=""
                                      />
                                      {priority.label}
                                    </div>
                                  </MenuItem>
                                ))}
                              </Select>
                            </div>
                          )}
                        />
                      </div>
                      {/* Additional Notes */}
                      <div item xs={12}>
                        <Controller
                          name="notes"
                          control={control}
                          render={({  field  }) => (
                            <Input
                              {...field}
                              label="Additional Notes"
                              multiline
                              rows={3}
                              fullWidth
                              helperText="Any additional instructions or notes for the laboratory"
                              placeholder="Special handling instructions, patient preparation notes, etc."
                            />
                          )}
                        />
                      </div>
                      {/* Consent Checkbox */}
                      <div item xs={12}>
                        <Controller
                          name="consentObtained"
                          control={control}
                          render={({  field  }) => (
                            <FormControlLabel
                              control={
                                <Checkbox}
                                  {...field}
                                  checked={field.value}
                                  color="primary"
                                />
                              }
                              label={
                                <div >
                                  I confirm that patient consent has been
                                  obtained for these laboratory tests
                                </div>}
                              }
                            />
                          )}
                        />
                        {!watchedConsent && (
                          <Alert severity="warning" className="">
                            <div className="">
                              <WarningIcon className="" />
                              Patient consent is required before proceeding
                            </div>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* Step 2: Review & Submit */}
          {activeStep === 2 && (
            <div container spacing={3}>
              <div item xs={12}>
                <Card>
                  <CardContent>
                    <div  className="">
                      Review Order
                    </div>
                    {/* Order Summary */}
                    <div container spacing={3}>
                      <div item xs={12} md={6}>
                        <div  className="">
                          Patient Information
                        </div>
                        {watchedPatient && (
                          <div className="">
                            {(() => {
                              const patient = patients.find(
                                (p) => p._id === watchedPatient
                              );
                              return patient ? (
                                <div>
                                  <div >
                                    {patient.firstName} {patient.lastName}
                                  </div>
                                  <div
                                    
                                    color="text.secondary"
                                  >
                                    MRN: {patient.mrn}
                                  </div>
                                  <div
                                    
                                    color="text.secondary"
                                  >
                                    Age: {patient.age || 'Not specified'}
                                  </div>
                                </div>
                              ) : (
                                <div color="error">
                                  Patient not found
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        <div  className="">
                          Order Details
                        </div>
                        <div className="">
                          <div >
                            <strong>Priority:</strong>{' '}
                            {
                              LAB_ORDER_PRIORITIES.find(
                                (p) => p.value === watch('priority')
                              )?.label
                            }
                          </div>
                          <div  className="">
                            <strong>Clinical Indication:</strong>
                          </div>
                          <div
                            
                            color="text.secondary"
                            className=""
                          >
                            {watch('indication')}
                          </div>
                          {watch('notes') && (
                            <>
                              <div  className="">
                                <strong>Additional Notes:</strong>
                              </div>
                              <div
                                
                                color="text.secondary"
                                className=""
                              >
                                {watch('notes')}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div item xs={12} md={6}>
                        <div  className="">
                          Selected Tests ({watchedTests.length})
                        </div>
                        <div  className="">
                          {watchedTests.map((test, index) => (
                            <div
                              key={index}
                              className=""
                            >
                              <div
                                
                                className=""
                              >
                                {test.name} ({test.code})
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {test.specimenType} | {test.refRange}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Consent Confirmation */}
                    <div
                      className=""
                    >
                      <div className="">
                        <CheckCircleIcon color="success" className="" />
                        <div >
                          Patient consent has been obtained and confirmed
                        </div>
                      </div>
                    </div>
                    {/* PDF Generation Status */}
                    {pdfGenerating && (
                      <div className="">
                        <div  className="">
                          Generating PDF requisition...
                        </div>
                        <Progress />
                      </div>
                    )}
                    {pdfUrl && (
                      <div className="">
                        <Alert severity="success">
                          <div
                            className=""
                          >
                            <div >
                              PDF requisition generated successfully
                            </div>
                            <Button
                              
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => window.open(pdfUrl, '_blank')}
                            >
                              Download
                            </Button>
                          </div>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {/* Form Actions */}
          <div
            className=""
          >
            <Button
              
              onClick={handleCancel}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <div className="">
              {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
              {activeStep < steps.length - 1 ? (
                <Button
                  
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  
                  startIcon={<SaveIcon />}
                  disabled={!isValid || isSubmitting || !watchedConsent}
                >
                  {isSubmitting ? 'Creating Order...' : 'Create Order'}
                </Button>
              )}
            </div>
          </div>
        </form>
        {/* Consent Dialog */}
        <Dialog
          open={showConsentDialog}
          onClose={() => setShowConsentDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <div className="">
              <InfoIcon color="primary" className="" />
              Patient Consent Required
            </div>
          </DialogTitle>
          <DialogContent>
            <div  className="">
              Before proceeding with the lab order, please confirm that you have
              obtained proper consent from the patient for the following tests:
            </div>
            <div  className="">
              {watchedTests.map((test, index) => (
                <div key={index}  className="">
                  • {test.name} ({test.code})
                </div>
              ))}
            </div>
            <div  color="text.secondary">
              This consent confirmation will be logged with your user ID and
              timestamp for audit purposes.
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConsentDialog(false)}>Cancel</Button>
            <Button
              
              onClick={handleConsentConfirm}
              startIcon={<CheckCircleIcon />}
            >
              Confirm Consent Obtained
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
};
export default LabOrderBuilder;
