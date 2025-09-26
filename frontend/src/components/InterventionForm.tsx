  useCreateIntervention,
  useUpdateIntervention,
  useStrategyRecommendations,
  useDuplicateInterventions,

import ClinicalInterventionErrorBoundary from './ClinicalInterventionErrorBoundary';

import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Tooltip, Spinner, Alert, Separator } from '@/components/ui/button';
// ===============================
// TYPES AND INTERFACES
// ===============================
interface InterventionFormData {
  patientId: string;
  category: ClinicalIntervention['category'];
  priority: ClinicalIntervention['priority'];
  issueDescription: string;
  strategies: Omit<
    InterventionStrategy,
    '_id' | 'status' | 'implementedAt' | 'implementedBy' | 'notes'
  >[];
  estimatedDuration?: number;
  relatedMTRId?: string;
}
interface InterventionFormProps {
  intervention?: ClinicalIntervention | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (intervention: ClinicalIntervention) => void;
}
// ===============================
// CONSTANTS
// ===============================
const INTERVENTION_CATEGORIES = {
  drug_therapy_problem: {
    label: 'Drug Therapy Problem',
    description:
      'Issues with medication effectiveness, safety, or appropriateness',
    color: '#f44336',
  },
  adverse_drug_reaction: {
    label: 'Adverse Drug Reaction',
    description: 'Unwanted or harmful reactions to medications',
    color: '#ff9800',
  },
  medication_nonadherence: {
    label: 'Medication Non-adherence',
    description: 'Patient not taking medications as prescribed',
    color: '#2196f3',
  },
  drug_interaction: {
    label: 'Drug Interaction',
    description: 'Interactions between medications or with food/supplements',
    color: '#9c27b0',
  },
  dosing_issue: {
    label: 'Dosing Issue',
    description: 'Problems with medication dosage or frequency',
    color: '#4caf50',
  },
  contraindication: {
    label: 'Contraindication',
    description: 'Medication is inappropriate for patient condition',
    color: '#e91e63',
  },
  other: {
    label: 'Other',
    description: 'Other clinical issues requiring intervention',
    color: '#607d8b',
  },
} as const;
const PRIORITY_LEVELS = {
  low: {
    label: 'Low',
    description: 'Non-urgent, can be addressed in routine care',
    color: '#4caf50',
  },
  medium: {
    label: 'Medium',
    description: 'Moderate priority, should be addressed soon',
    color: '#ff9800',
  },
  high: {
    label: 'High',
    description: 'High priority, requires prompt attention',
    color: '#f44336',
  },
  critical: {
    label: 'Critical',
    description: 'Urgent, requires immediate intervention',
    color: '#d32f2f',
  },
} as const;
const STRATEGY_TYPES = {
  medication_review: {
    label: 'Medication Review',
    description: 'Comprehensive review of patient medications',
  },
  dose_adjustment: {
    label: 'Dose Adjustment',
    description: 'Modify medication dosage or frequency',
  },
  alternative_therapy: {
    label: 'Alternative Therapy',
    description: 'Switch to different medication or treatment',
  },
  discontinuation: {
    label: 'Discontinuation',
    description: 'Stop problematic medication',
  },
  additional_monitoring: {
    label: 'Additional Monitoring',
    description: 'Increase monitoring frequency or parameters',
  },
  patient_counseling: {
    label: 'Patient Counseling',
    description: 'Educate patient about medication use',
  },
  physician_consultation: {
    label: 'Physician Consultation',
    description: 'Consult with prescribing physician',
  },
  custom: {
    label: 'Custom Strategy',
    description: 'Custom intervention approach',
  },
} as const;
// ===============================
// MAIN COMPONENT
// ===============================
const InterventionForm: React.FC<InterventionFormProps> = ({ 
  intervention,
  open,
  onClose,
  onSuccess
}) => {
  const isEditMode = Boolean(intervention);
  const theme = useTheme();
  const { isMobile, isSmallMobile, shouldUseCardLayout } = useResponsive();
  const { maxWidth, fullScreen, PaperProps } = useResponsiveDialog();
  // State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInterventions, setDuplicateInterventions] = useState<
    ClinicalIntervention[]
  >([]);
  // Enhanced validation and error handling state
  const [validationErrors, setValidationErrors] = useState<ValidationResult>({ 
    isValid: true,
    errors: [],
    warnings: []}
  });
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  // Mobile-specific state
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({ 
    patient: true,
    details: false,
    strategies: false}
  });
  const [voiceInputField, setVoiceInputField] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  // Voice input hook
  const [voiceState, voiceControls] = useVoiceInput({ 
    onResult: (transcript, confidence) => {
      if (voiceInputField && confidence > 0.7) {
        handleVoiceResult(voiceInputField, transcript); })
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error);
      setVoiceInputField(null);
    },
    onEnd: () => {
      setVoiceInputField(null);
    }
  // Enhanced error handling
  const { handleError, getRecoveryInstructions } = useErrorHandler();
  // Form validation
  const formData = {
    patientId: watchedPatientId,
    category: watchedCategory,
    priority: watch('priority'),
    issueDescription: watchedIssueDescription,
    strategies: watchedStrategies,
    estimatedDuration: watch('estimatedDuration'),
    relatedMTRId: watch('relatedMTRId'),
  };
  const formValidation = useFormValidation(formData);
  // Store
  const { selectedPatient: storeSelectedPatient } =
    useClinicalInterventionStore();
  // Mobile form steps
  const formSteps = [
    {
      label: 'Patient Selection',
      description: 'Select the patient for this intervention',
      key: 'patient',
    },
    {
      label: 'Issue Details',
      description: 'Describe the clinical issue',
      key: 'details',
    },
    {
      label: 'Intervention Strategies',
      description: 'Define intervention approaches',
      key: 'strategies',
    },
  ];
  // Queries and mutations
  const { data: patientSearchResults, isLoading: searchingPatients } =
    useSearchPatients(patientSearchQuery);
  const { data: strategyRecommendations } = useStrategyRecommendations(
    // Only fetch if we have a category selected
    ''
  );
  const { data: duplicateCheck } = useDuplicateInterventions(
    selectedPatient?._id || '',
    '' // Will be set when category is selected
  );
  const createMutation = useCreateIntervention();
  const updateMutation = useUpdateIntervention();
  // Form setup
  const defaultValues: InterventionFormData = useMemo(
    () => ({ 
      patientId: intervention?.patientId || storeSelectedPatient?._id || '',
      category: intervention?.category || 'drug_therapy_problem',
      priority: intervention?.priority || 'medium',
      issueDescription: intervention?.issueDescription || '',
      strategies:
        intervention?.strategies?.map((s) => ({
          type: s.type,
          description: s.description,
          rationale: s.rationale,
          expectedOutcome: s.expectedOutcome,
          priority: s.priority}
        })) || [],
      estimatedDuration: intervention?.estimatedDuration || undefined,
      relatedMTRId: intervention?.relatedMTRId || undefined, },
    [intervention, storeSelectedPatient]
  );
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InterventionFormData>({ 
    defaultValues,
    mode: 'onChange'}
  });
  const watchedCategory = watch('category');
  const watchedPatientId = watch('patientId');
  const watchedIssueDescription = watch('issueDescription');
  const watchedStrategies = watch('strategies');
  // Effects
  useEffect(() => {
    if (open) {
      reset(defaultValues);
      if (storeSelectedPatient) {
        setSelectedPatient(storeSelectedPatient);
      }
      // Load form draft if available
      if (!isEditMode) {
        loadFormDraft();
      }
    }
  }, [open, reset, defaultValues, storeSelectedPatient, isEditMode]);
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  // Real-time form validation
  useEffect(() => {
    if (open && (submitAttempted || Object.keys(formTouched).length > 0)) {
      setValidationErrors(formValidation);
      // Show validation summary if there are errors or warnings
      setShowValidationSummary(
        !formValidation.isValid || formValidation.warnings.length > 0
      );
    }
  }, [formValidation, open, submitAttempted, formTouched]);
  // Auto-save form draft when data changes (mobile only)
  useEffect(() => {
    if (isMobile && !isEditMode && open) {
      const timeoutId = setTimeout(() => {
        saveFormDraft();
      }, 2000); // Save after 2 seconds of inactivity
      return () => clearTimeout(timeoutId);
    }
  }, [
    watchedPatientId,
    watchedCategory,
    watchedIssueDescription,
    watchedStrategies,
    isMobile,
    isEditMode,
    open,
  ]);
  // Check for duplicates when patient and category change
  useEffect(() => {
    if (watchedPatientId && watchedCategory && duplicateCheck?.data) {
      const duplicates = duplicateCheck.data.filter(
        (d) => d._id !== intervention?._id
      );
      if (duplicates.length > 0) {
        setDuplicateInterventions(duplicates);
        setShowDuplicateWarning(true);
      } else {
        setShowDuplicateWarning(false);
        setDuplicateInterventions([]);
      }
    }
  }, [watchedPatientId, watchedCategory, duplicateCheck, intervention?._id]);
  // ===============================
  // MOBILE & VOICE INPUT HANDLERS
  // ===============================
  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };
  const handleNextStep = () => {
    if (activeStep < formSteps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };
  const handlePreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ 
      ...prev,
      [section]: !prev[section]}
    }));
  };
  const startVoiceInput = (fieldName: string) => {
    if (!voiceState.isSupported) {
      alert('Speech recognition is not supported in this browser');
      return;
    }
    setVoiceInputField(fieldName);
    voiceControls.start();
  };
  const handleVoiceResult = (fieldName: string, transcript: string) => {
    // Update the appropriate field based on fieldName
    if (fieldName === 'issueDescription') {
      setValue('issueDescription', transcript);
    } else if (fieldName.startsWith('strategy-')) {
      const [, index, field] = fieldName.split('-');
      const strategyIndex = parseInt(index);
      handleStrategyChange(
        strategyIndex,
        field as keyof InterventionStrategy,
        transcript
      );
    }
  };
  const canProceedToNextStep = () => {
    switch (activeStep) {
      case 0: // Patient selection
        return !!watchedPatientId;
      case 1: // Issue details
        return (
          !!watchedCategory &&
          !!watchedIssueDescription &&
          watchedIssueDescription.length >= 10
        );
      case 2: // Strategies
        return watchedStrategies && watchedStrategies.length > 0;
      default:
        return true;
    }
  };
  // ===============================
  // HANDLERS
  // ===============================
  const handlePatientSelect = (patient: any) => {
    if (patient) {
      setSelectedPatient(patient);
      setValue('patientId', patient._id);
      setPatientSearchQuery('');
    }
  };
  const handleAddStrategy = () => {
    const currentStrategies = watchedStrategies || [];
    setValue('strategies', [
      ...currentStrategies,
      {
        type: 'medication_review',
        description: '',
        rationale: '',
        expectedOutcome: '',
        priority: 'primary',
      },
    ]);
  };
  const handleRemoveStrategy = (index: number) => {
    const currentStrategies = watchedStrategies || [];
    setValue(
      'strategies',
      currentStrategies.filter((_, i) => i !== index)
    );
  };
  const handleStrategyChange = (
    index: number,
    field: keyof InterventionStrategy,
    value: any
  ) => {
    const currentStrategies = [...(watchedStrategies || [])];
    currentStrategies[index] = {
      ...currentStrategies[index],
      [field]: value,
    };
    setValue('strategies', currentStrategies);
  };
  const loadFormDraft = async () => {
    try {
      const draftId = `intervention-form-${Date.now()}`;
      const draft = await offlineStorage.getFormDraft(draftId);
      if (draft) {
        // Restore form data from draft
        Object.keys(draft).forEach((key) => {
          setValue(key as keyof InterventionFormData, draft[key]);
        });
      }
    } catch (error) {
      console.error('Failed to load form draft:', error);
    }
  };
  const saveFormDraft = async () => {
    try {
      const formData = {
        patientId: watchedPatientId,
        category: watchedCategory,
        priority: watch('priority'),
        issueDescription: watchedIssueDescription,
        strategies: watchedStrategies,
        estimatedDuration: watch('estimatedDuration'),
      };
      // Only save if there's meaningful data
      if (formData.patientId || formData.issueDescription) {
        const draftId = `intervention-form-${Date.now()}`;
        await offlineStorage.saveFormDraft(draftId, formData);
      }
    } catch (error) {
      console.error('Failed to save form draft:', error);
    }
  };
  const onSubmit = async (data: InterventionFormData) => {
    setSubmitAttempted(true);
    try {
      // Sanitize form data before submission
      const sanitizedData = sanitizeFormData(data);
      // Final validation check
      const finalValidation = interventionValidator.validateForm(sanitizedData);
      if (!finalValidation.isValid) {
        setValidationErrors(finalValidation);
        setShowValidationSummary(true);
        // Handle validation errors
        handleFormError(
          new Error('Form validation failed'),
          'intervention-form',
          { showToast: true, autoRetry: false }
        );
        return;
      }
      if (isEditMode && intervention) {
        const updateData: UpdateInterventionData = {
          category: sanitizedData.category,
          priority: sanitizedData.priority,
          issueDescription: sanitizedData.issueDescription,
          estimatedDuration: sanitizedData.estimatedDuration,
        };
        if (isOffline) {
          // Store for offline sync
          const authToken = localStorage.getItem('authToken') || '';
          await offlineStorage.storeOfflineIntervention(
            { ...updateData, interventionId: intervention._id },
            authToken,
            'update'
          );
          // Show offline notification
          alert(
            'Intervention saved offline. It will sync when connection is restored.'
          );
          onClose();
          return;
        }
        const result = await updateMutation.mutateAsync({ 
          interventionId: intervention._id,
          updates: updateData}
        });
        if (result?.data) {
          onSuccess?.(result.data);
          onClose();
        }
      } else {
        const createData: CreateInterventionData = {
          patientId: sanitizedData.patientId,
          category: sanitizedData.category,
          priority: sanitizedData.priority,
          issueDescription: sanitizedData.issueDescription,
          strategies: sanitizedData.strategies,
          estimatedDuration: sanitizedData.estimatedDuration,
          relatedMTRId: sanitizedData.relatedMTRId,
        };
        if (isOffline) {
          // Store for offline sync
          const authToken = localStorage.getItem('authToken') || '';
          await offlineStorage.storeOfflineIntervention(
            createData,
            authToken,
            'create'
          );
          // Request background sync
          await offlineUtils.requestBackgroundSync('intervention-sync');
          // Show offline notification
          alert(
            'Intervention saved offline. It will sync when connection is restored.'
          );
          onClose();
          reset();
          // Clear form draft
          const draftId = `intervention-form-${Date.now()}`;
          await offlineStorage.removeFormDraft(draftId);
          return;
        }
        const result = await createMutation.mutateAsync(createData);
        if (result?.data) {
          onSuccess?.(result.data);
          onClose();
          reset();
          // Clear form draft on successful submission
          const draftId = `intervention-form-${Date.now()}`;
          await offlineStorage.removeFormDraft(draftId);
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Enhanced error handling
      const appError = handleFormError(error, 'intervention-form', {
        showToast: true,
        autoRetry: false,
        logError: true}
      // Show recovery instructions
      const instructions = getRecoveryInstructions(appError);
      console.log('Recovery instructions:', instructions);
      // If network error and not already offline, try storing offline
      if (
        !isOffline &&
        (appError.type === 'NETWORK_ERROR' ||
          (error instanceof Error && error.message.includes('network')))
      ) {
        const shouldStoreOffline = confirm(
          'Network error occurred. Would you like to save this intervention offline?'
        );
        if (shouldStoreOffline) {
          try {
            const authToken = localStorage.getItem('authToken') || '';
            await offlineStorage.storeOfflineIntervention(
              data,
              authToken,
              'create'
            );
            await offlineUtils.requestBackgroundSync('intervention-sync');
            alert(
              'Intervention saved offline. It will sync when connection is restored.'
            );
            onClose();
            reset();
          } catch (offlineError) {
            handleError(offlineError, 'offline-storage', {
              showToast: true,
              autoRetry: false}
          }
        }
      }
    }
  };
  const handleCancel = () => {
    reset();
    onClose();
  };
  // Field touch tracking for validation
  const handleFieldTouch = (fieldName: string) => {
    setFormTouched((prev) => ({ 
      ...prev,
      [fieldName]: true}
    }));
  };
  // Enhanced field change handler with validation
  const handleFieldChange = (fieldName: string, value: any) => {
    handleFieldTouch(fieldName);
    // Update form value
    setValue(fieldName as keyof InterventionFormData, value);
    // Trigger real-time validation for this field
    if (formTouched[fieldName] || submitAttempted) {
      const fieldValidation = interventionValidator.validateField(
        fieldName,
        value,
        formData
      );
      // Update validation state for this specific field
      setValidationErrors((prev) => {
        const updatedErrors = prev.errors.filter((e) => e.field !== fieldName);
        const updatedWarnings = prev.warnings.filter(
          (w) => w.field !== fieldName
        );
        return {
          isValid:
            updatedErrors.length === 0 && fieldValidation.errors.length === 0,
          errors: [...updatedErrors, ...fieldValidation.errors],
          warnings: [...updatedWarnings, ...fieldValidation.warnings],
        };
      });
    }
  };
  // ===============================
  // RENDER HELPERS
  // ===============================
  const renderPatientSelection = () => (
    <div item xs={12}>
      {isMobile ? (
        <div className="">
          <div
            className=""
            onClick={() => toggleSection('patient')}
          >
            <div
              
              className=""
            >
              <PersonIcon color="primary" />
              Patient Selection
            </div>
            {expandedSections.patient ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </div>
          <Collapse in={expandedSections.patient}>
            <div className="">{renderPatientSelectionContent()}</div>
          </Collapse>
        </div>
      ) : (
        <div>
          <div
            
            gutterBottom
            className=""
          >
            <PersonIcon color="primary" />
            Patient Selection
          </div>
          {renderPatientSelectionContent()}
        </div>
      )}
    </div>
  );
  const renderPatientSelectionContent = () => (
    <div>
      {selectedPatient ? (
        <div
          className=""
        >
          <div
            className=""
          >
            <div>
              <div
                variant={isMobile ? 'body1' : 'subtitle1'}
                fontWeight="medium"
              >
                {selectedPatient.firstName} {selectedPatient.lastName}
              </div>
              <div
                variant={isMobile ? 'caption' : 'body2'}
                color="text.secondary"
                className=""
              >
                DOB:{' '}
                {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                {isMobile && <br />}
                {!isMobile && ' | '}
                Phone: {selectedPatient.phoneNumber || 'N/A'}
              </div>
            </div>
            {!isEditMode && (
              <Button
                size={isMobile ? 'small' : 'medium'}
                variant={isMobile ? 'outlined' : 'text'}
                
                className=""
              >
                Change
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Controller
          name="patientId"
          control={control}
          
          render={({  field  }) => (
            <Autocomplete
              {...field}
              options={patientSearchResults?.data?.results || []}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option}
                  : `${option.firstName} ${option.lastName} - ${
                      option.phoneNumber || 'No phone'
                    }`
              }
              loading={searchingPatients}
              onInputChange={(_, value) => setPatientSearchQuery(value)}
              
              renderInput={(params) => (
                <Input}
                  {...params}
                  label="Search and select patient"
                  placeholder={
                    isMobile
                      ? 'Patient name...'
                      : 'Type patient name or phone number...'}
                  }
                  error={!!errors.patientId}
                  helperText={errors.patientId?.message}
                  size={isMobile ? 'medium' : 'medium'}
                  InputProps={{
                    ...params.InputProps,
                    sx: {
                      fontSize: isMobile ? '16px' : undefined, // Prevents zoom on iOS}
                    },
                    endAdornment: (
                      <>
                        {searchingPatients && (
                          <Spinner color="inherit" size={20} />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                />
              )}
              renderOption={(props, option) => (}
                <div component="li" {...props}>
                  <div className="">
                    <div variant={isMobile ? 'body2' : 'body1'}>
                      {option.firstName} {option.lastName}
                    </div>
                    <div
                      variant={isMobile ? 'caption' : 'body2'}
                      color="text.secondary"
                      className=""
                    >
                      DOB: {new Date(option.dateOfBirth).toLocaleDateString()}
                      {isMobile && <br />}
                      {!isMobile && ' | '}
                      Phone: {option.phoneNumber || 'N/A'}
                    </div>
                  </div>
                </div>
              )}
              noOptionsText={
                patientSearchQuery.length < 2
                  ? 'Type at least 2 characters to search'
                  : 'No patients found'}
              }
              ListboxProps={{
                sx: {
                  maxHeight: isMobile ? 200 : 300,}
                },
            />
          )}
        />
      )}
    </div>
  );
  const renderCategorySelection = () => (
    <div item xs={12} md={6}>
      <Controller
        name="category"
        control={control}
        
        render={({  field  }) => (
          <div fullWidth error={!!errors.category}>
            <Label>Clinical Issue Category</Label>
            <Select
              {...field}
              label="Clinical Issue Category"
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: isMobile ? 300 : 400,}
                  },
                },
              >
              {Object.entries(INTERVENTION_CATEGORIES).map(
                ([value, config]) => (
                  <MenuItem key={value} value={value}>
                    <div className="">
                      <div
                        variant={isMobile ? 'body2' : 'body1'}
                        className=""
                      >
                        {config.label}
                      </div>
                      <div
                        variant={isMobile ? 'caption' : 'body2'}
                        color="text.secondary"
                        className=""
                      >
                        {config.description}
                      </div>
                    </div>
                  </MenuItem>
                )
              )}
            </Select>
            {errors.category && (
              <p>{errors.category.message}</p>
            )}
          </div>
        )}
      />
    </div>
  );
  const renderPrioritySelection = () => (
    <div item xs={12} md={6}>
      <Controller
        name="priority"
        control={control}
        
        render={({  field  }) => (
          <div fullWidth error={!!errors.priority}>
            <Label>Priority Level</Label>
            <Select
              {...field}
              label="Priority Level"
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: isMobile ? 250 : 300,}
                  },
                },
              >
              {Object.entries(PRIORITY_LEVELS).map(([value, config]) => (
                <MenuItem key={value} value={value}>
                  <div
                    className=""
                  >
                    <div
                      className=""
                    />
                    <div>
                      <div
                        variant={isMobile ? 'body2' : 'body1'}
                        className=""
                      >
                        {config.label}
                      </div>
                      <div
                        variant={isMobile ? 'caption' : 'body2'}
                        color="text.secondary"
                        className=""
                      >
                        {config.description}
                      </div>
                    </div>
                  </div>
                </MenuItem>
              ))}
            </Select>
            {errors.priority && (
              <p>{errors.priority.message}</p>
            )}
          </div>
        )}
      />
    </div>
  );
  const renderIssueDescription = () => (
    <div item xs={12}>
      <Controller
        name="issueDescription"
        control={control}
        rules={{
          required: 'Issue description is required',
          minLength: {
            value: 10,
            message: 'Description must be at least 10 characters',}
          },
          maxLength: {
            value: 1000,
            message: 'Description must not exceed 1000 characters',
          },
        render={({  field  }) => (
          <div className="">
            <Input
              {...field}
              fullWidth
              multiline
              rows={isMobile ? 3 : 4}
              label="Clinical Issue Description"
              placeholder={
                isMobile
                  ? 'Describe the clinical issue...'
                  : 'Describe the clinical issue or problem in detail...'}
              }
              error={!!errors.issueDescription}
              helperText={
                errors.issueDescription?.message ||}
                `${watchedIssueDescription?.length || 0}/1000 characters`
              }
              onBlur={() => handleFieldTouch('issueDescription')}
              
              InputProps={{
                sx: {
                  fontSize: isMobile ? '16px' : undefined, // Prevents zoom on iOS}
                },
                endAdornment: isMobile && (
                  <div
                    className=""
                  >
                    <Tooltip title="Voice Input">
                      <IconButton
                        size="small"
                        onClick={() => startVoiceInput('issueDescription')}
                        disabled={voiceState.isListening}
                        className="">
                        <MicIcon
                          className=""
                        />
                      </IconButton>
                    </Tooltip>
                  </div>
                ),
            />
            {voiceState.isListening &&
              voiceInputField === 'issueDescription' && (
                <div
                  className=""
                >
                  <MicIcon className="" />
                  <div >Listening...</div>
                </div>
              )}
          </div>
        )}
      />
    </div>
  );
  // Mobile drawer component
  const MobileFormDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={handleCancel}
      
      disableSwipeToOpen
      PaperProps={{
        sx: {
          height: '95vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,}
        },
      >
      <header position="sticky" color="default" >
        <div>
          <div  className="">
            {isEditMode ? 'Edit Intervention' : 'New Intervention'}
          </div>
          <IconButton onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </div>
      </header>
      <div className="">
        <Stepper activeStep={activeStep} orientation="vertical" className="">
          {formSteps.map((step, index) => (
            <Step key={step.key}>
              <StepLabel
                onClick={() => handleStepChange(index)}
                className=""
              >
                <div >{step.label}</div>
                <div  color="text.secondary">
                  {step.description}
                </div>
              </StepLabel>
              <StepContent>
                <div className="">{renderMobileStepContent(index)}</div>
                <div className="">
                  {index > 0 && (
                    <Button
                      size="small"
                      onClick={handlePreviousStep}
                      startIcon={<NavigateBeforeIcon />}
                    >
                      Back
                    </Button>
                  )}
                  {index < formSteps.length - 1 ? (
                    <Button
                      size="small"
                      
                      onClick={handleNextStep}
                      disabled={!canProceedToNextStep()}
                      endIcon={<NavigateNextIcon />}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSubmitting || !canProceedToNextStep()}
                      startIcon={
                        isSubmitting ? (}
                          <Spinner size={16} />
                        ) : (
                          <SaveIcon />
                        )
                      }
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </div>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </div>
    </SwipeableDrawer>
  );
  const renderMobileStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <div>
            {renderPatientSelectionContent()}
            {showDuplicateWarning && (
              <Alert
                severity="warning"
                icon={<WarningIcon />}
                className=""
                action={
                  <Button
                    size="small"}
                    onClick={() => setShowDuplicateWarning(false)}
                  >
                    Dismiss
                  </Button>
                }
              >
                <div  fontWeight="medium">
                  Similar interventions found
                </div>
                <div >
                  {duplicateInterventions.length} existing intervention(s) with
                  the same category.
                </div>
              </Alert>
            )}
          </div>
        );
      case 1:
        return (
          <div container spacing={2}>
            <div item xs={12}>
              {renderCategorySelection()}
            </div>
            <div item xs={12}>
              {renderPrioritySelection()}
            </div>
            <div item xs={12}>
              {renderIssueDescription()}
            </div>
          </div>
        );
      case 2:
        return renderStrategiesSection();
      default:
        return null;
    }
  };
  // Desktop dialog component
  const DesktopFormDialog = () => (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={maxWidth}
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        ...PaperProps,
        sx: {
          ...PaperProps?.sx,
          minHeight: '70vh',}
        },
      >
      <DialogTitle>
        <div  component="div">
          {isEditMode
            ? 'Edit Clinical Intervention'
            : 'Create New Clinical Intervention'}
        </div>
        <div  color="text.secondary">
          {isEditMode
            ? 'Update the intervention details below'
            : 'Document a new clinical issue and intervention strategy'}
        </div>
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <div container spacing={3}>
            {/* Patient Selection */}
            {renderPatientSelection()}
            {/* Duplicate Warning */}
            {showDuplicateWarning && (
              <div item xs={12}>
                <Alert
                  severity="warning"
                  icon={<WarningIcon />}
                  action={
                    <Button
                      size="small"}
                      onClick={() => setShowDuplicateWarning(false)}
                    >
                      Dismiss
                    </Button>
                  }
                >
                  <div  fontWeight="medium">
                    Similar interventions found for this patient
                  </div>
                  <div >
                    {duplicateInterventions.length} existing intervention(s)
                    with the same category. Please review to avoid duplicates.
                  </div>
                </Alert>
              </div>
            )}
            {/* Category and Priority */}
            {renderCategorySelection()}
            {renderPrioritySelection()}
            {/* Issue Description */}
            {renderIssueDescription()}
            {/* Estimated Duration */}
            <div item xs={12} md={6}>
              <Controller
                name="estimatedDuration"
                control={control}
                render={({  field  }) => (
                  <Input
                    {...field}
                    fullWidth
                    type="number"
                    label="Estimated Duration (minutes)"
                    placeholder="e.g., 30"
                    InputProps={{}
                      inputProps: { min: 1, max: 480 },
                      sx: {
                        fontSize: isMobile ? '16px' : undefined,
                      },
                    helperText="Optional: Estimated time to complete intervention"
                  />
                )}
              />
            </div>
            {/* Strategies Section */}
            {renderStrategiesSection()}
          </div>
        </DialogContent>
        <DialogActions className="">
          <Button
            onClick={handleCancel}
            disabled={isSubmitting}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            
            disabled={isSubmitting}
            startIcon={}
              isSubmitting ? <Spinner size={20} /> : <SaveIcon />
            }
          >
            {isSubmitting
              ? 'Saving...'
              : isEditMode
              ? 'Update Intervention'
              : 'Create Intervention'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
  const renderStrategiesSection = () => (
    <div item xs={12}>
      <Separator className="" />
      <div
        className=""
      >
        <div variant={isMobile ? 'subtitle1' : 'h6'}>
          Intervention Strategies
        </div>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddStrategy}
          
          size={isMobile ? 'small' : 'medium'}
        >
          {isMobile ? 'Add' : 'Add Strategy'}
        </Button>
      </div>
      {watchedStrategies?.map((strategy, index) => (
        <Card
          key={index}
          className=""
        >
          <CardContent className="">
            <div
              className=""
            >
              <div
                variant={isMobile ? 'body1' : 'subtitle1'}
                fontWeight="medium"
              >
                Strategy {index + 1}
              </div>
              <IconButton
                size="small"
                onClick={() => handleRemoveStrategy(index)}
                color="error"
              >
                <CancelIcon />
              </IconButton>
            </div>
            <div container spacing={isMobile ? 1.5 : 2}>
              <div item xs={12} md={6}>
                <div fullWidth>
                  <Label>Strategy Type</Label>
                  <Select
                    value={strategy.type}
                    label="Strategy Type"
                    onChange={(e) =>
                      handleStrategyChange(index, 'type', e.target.value)}
                    }
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: isMobile ? 300 : 400,}
                        },
                      },>
                    {Object.entries(STRATEGY_TYPES).map(([value, config]) => (
                      <MenuItem key={value} value={value}>
                        <div className="">
                          <div
                            variant={isMobile ? 'body2' : 'body1'}
                            className=""
                          >
                            {config.label}
                          </div>
                          <div
                            variant={isMobile ? 'caption' : 'body2'}
                            color="text.secondary"
                            className=""
                          >
                            {config.description}
                          </div>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
              <div item xs={12} md={6}>
                <div fullWidth>
                  <Label>Priority</Label>
                  <Select
                    value={strategy.priority}
                    label="Priority"
                    onChange={(e) =>
                      handleStrategyChange(index, 'priority', e.target.value)}
                    }
                  >
                    <MenuItem value="primary">Primary</MenuItem>
                    <MenuItem value="secondary">Secondary</MenuItem>
                  </Select>
                </div>
              </div>
              <div item xs={12}>
                <div className="">
                  <Input
                    fullWidth
                    multiline
                    rows={isMobile ? 2 : 2}
                    label="Strategy Description"
                    value={strategy.description}
                    onChange={(e) =>
                      handleStrategyChange(index, 'description', e.target.value)}
                    }
                    placeholder={
                      isMobile
                        ? 'Describe the strategy...'
                        : 'Describe the specific intervention strategy...'}
                    }
                    InputProps={{
                      sx: {
                        fontSize: isMobile ? '16px' : undefined,}
                      },
                      endAdornment: isMobile && (
                        <div
                          className=""
                        >
                          <Tooltip title="Voice Input">
                            <IconButton
                              size="small"
                              onClick={() =>}
                                startVoiceInput(`strategy-${index}-description`)
                              }
                              disabled={voiceState.isListening}
                              className="">
                              <MicIcon className="" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      ),
                  />
                </div>
              </div>
              <div item xs={12} md={6}>
                <div className="">
                  <Input
                    fullWidth
                    multiline
                    rows={isMobile ? 2 : 2}
                    label="Rationale"
                    value={strategy.rationale}
                    onChange={(e) =>
                      handleStrategyChange(index, 'rationale', e.target.value)}
                    }
                    placeholder={
                      isMobile
                        ? 'Why this strategy?'
                        : 'Why is this strategy appropriate?'}
                    }
                    
                    helperText={`${
                      strategy.rationale?.length || 0}
                    }/500 characters`}
                    InputProps={{
                      sx: {
                        fontSize: isMobile ? '16px' : undefined,}
                      },
                      endAdornment: isMobile && (
                        <div
                          className=""
                        >
                          <Tooltip title="Voice Input">
                            <IconButton
                              size="small"
                              onClick={() =>}
                                startVoiceInput(`strategy-${index}-rationale`)
                              }
                              disabled={voiceState.isListening}
                              className="">
                              <MicIcon className="" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      ),
                  />
                </div>
              </div>
              <div item xs={12} md={6}>
                <div className="">
                  <Input
                    fullWidth
                    multiline
                    rows={isMobile ? 2 : 2}
                    label="Expected Outcome"
                    value={strategy.expectedOutcome}
                    onChange={(e) =>
                      handleStrategyChange(
                        index,
                        'expectedOutcome',
                        e.target.value
                      )}
                    }
                    placeholder={
                      isMobile
                        ? 'Expected outcome?'
                        : 'What outcome do you expect from this strategy?'}
                    }
                    
                    helperText={`${
                      strategy.expectedOutcome?.length || 0}
                    }/500 characters`}
                    InputProps={{
                      sx: {
                        fontSize: isMobile ? '16px' : undefined,}
                      },
                      endAdornment: isMobile && (
                        <div
                          className=""
                        >
                          <Tooltip title="Voice Input">
                            <IconButton
                              size="small"
                              onClick={() =>
                                startVoiceInput(}
                                  `strategy-${index}-expectedOutcome`
                                )
                              }
                              disabled={voiceState.isListening}
                              className="">
                              <MicIcon className="" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      ),
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {(!watchedStrategies || watchedStrategies.length === 0) && (
        <div
          className=""
        >
          <InfoIcon
            color="disabled"
            className=""
          />
          <div
            variant={isMobile ? 'body2' : 'body1'}
            color="text.secondary"
          >
            No strategies added yet
          </div>
          <div
            variant={isMobile ? 'caption' : 'body2'}
            color="text.secondary"
          >
            {isMobile
              ? 'Tap "Add" to define approaches'
              : 'Click "Add Strategy" to define intervention approaches'}
          </div>
        </div>
      )}
    </div>
  );
  return (
    <ClinicalInterventionErrorBoundary
      showErrorDetails={process.env.NODE_ENV === 'development'}
      enableErrorReporting={true}
      maxRetries={3}
      resetOnPropsChange={true}
    >
      {isMobile ? <MobileFormDrawer /> : <DesktopFormDialog />}
    </ClinicalInterventionErrorBoundary>
  );
};
export default InterventionForm;
