import { Button, Input, Card, CardContent, Spinner, Alert } from '@/components/ui/button';
// ===============================
// TYPES AND INTERFACES
// ===============================
interface IssueIdentificationData {
  patientId: string;
  category: ClinicalIntervention['category'];
  priority: ClinicalIntervention['priority'];
  issueDescription: string;
  estimatedDuration?: number;
}
interface IssueIdentificationStepProps {
  onNext: (data: IssueIdentificationData) => void;
  onCancel?: () => void;
  initialData?: Partial<IssueIdentificationData>;
  isLoading?: boolean;
}
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
}
// ===============================
// CONSTANTS
// ===============================
const INTERVENTION_CATEGORIES = {
  drug_therapy_problem: {
    label: 'Drug Therapy Problem',
    description:
      'Issues with medication effectiveness, safety, or appropriateness',
    examples: [
      'Ineffective medication for condition',
      'Inappropriate medication selection',
      'Suboptimal dosing regimen',
      'Therapeutic duplication',
    ],
    color: '#f44336',
    icon: '💊',
  },
  adverse_drug_reaction: {
    label: 'Adverse Drug Reaction',
    description: 'Unwanted or harmful reactions to medications',
    examples: [
      'Allergic reactions',
      'Side effects affecting quality of life',
      'Drug-induced organ toxicity',
      'Hypersensitivity reactions',
    ],
    color: '#ff9800',
    icon: '⚠️',
  },
  medication_nonadherence: {
    label: 'Medication Non-adherence',
    description: 'Patient not taking medications as prescribed',
    examples: [
      'Missed doses or irregular timing',
      'Cost-related non-adherence',
      'Complex regimen confusion',
      'Side effect avoidance',
    ],
    color: '#2196f3',
    icon: '📅',
  },
  drug_interaction: {
    label: 'Drug Interaction',
    description: 'Interactions between medications or with food/supplements',
    examples: [
      'Drug-drug interactions',
      'Drug-food interactions',
      'Drug-supplement interactions',
      'Pharmacokinetic interactions',
    ],
    color: '#9c27b0',
    icon: '🔄',
  },
  dosing_issue: {
    label: 'Dosing Issue',
    description: 'Problems with medication dosage or frequency',
    examples: [
      'Dose too high or too low',
      'Incorrect frequency',
      'Renal/hepatic dose adjustment needed',
      'Age-related dosing concerns',
    ],
    color: '#4caf50',
    icon: '⚖️',
  },
  contraindication: {
    label: 'Contraindication',
    description: 'Medication is inappropriate for patient condition',
    examples: [
      'Absolute contraindications',
      'Relative contraindications',
      'Pregnancy/lactation concerns',
      'Comorbidity conflicts',
    ],
    color: '#e91e63',
    icon: '🚫',
  },
  other: {
    label: 'Other',
    description: 'Other clinical issues requiring intervention',
    examples: [
      'Medication reconciliation issues',
      'Patient education needs',
      'Monitoring requirements',
      'Administrative concerns',
    ],
    color: '#607d8b',
    icon: '📋',
  },
} as const;
const PRIORITY_LEVELS = {
  low: {
    label: 'Low Priority',
    description: 'Non-urgent, can be addressed in routine care',
    guidance: 'Schedule for next routine appointment or within 1-2 weeks',
    color: '#4caf50',
    icon: '🟢',
  },
  medium: {
    label: 'Medium Priority',
    description: 'Moderate priority, should be addressed soon',
    guidance: 'Address within 2-3 days or next available appointment',
    color: '#ff9800',
    icon: '🟡',
  },
  high: {
    label: 'High Priority',
    description: 'High priority, requires prompt attention',
    guidance: 'Address within 24 hours or same day if possible',
    color: '#f44336',
    icon: '🟠',
  },
  critical: {
    label: 'Critical Priority',
    description: 'Urgent, requires immediate intervention',
    guidance: 'Address immediately - potential patient safety concern',
    color: '#d32f2f',
    icon: '🔴',
  },
} as const;
// ===============================
// MAIN COMPONENT
// ===============================
const IssueIdentificationStep: React.FC<IssueIdentificationStepProps> = ({ 
  onNext,
  onCancel,
  initialData,
  isLoading = false
}) => {
  // State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState<string | null>(
    null
  );
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateInterventions, setDuplicateInterventions] = useState<
    ClinicalIntervention[]
  >([]);
  // Store
  const { selectedPatient: storeSelectedPatient } =
    useClinicalInterventionStore();
  // Queries
  const { data: patientSearchResults, isLoading: searchingPatients } =
    useSearchPatients(patientSearchQuery, {
      enabled: patientSearchQuery.length >= 2}
  // Form setup
  const defaultValues: IssueIdentificationData = useMemo(
    () => ({ 
      patientId: initialData?.patientId || storeSelectedPatient?._id || '',
      category: initialData?.category || 'drug_therapy_problem',
      priority: initialData?.priority || 'medium',
      issueDescription: initialData?.issueDescription || '',
      estimatedDuration: initialData?.estimatedDuration || undefined}
    }),
    [initialData, storeSelectedPatient]
  );
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<IssueIdentificationData>({ 
    defaultValues,
    mode: 'onChange'}
  });
  const watchedCategory = watch('category');
  const watchedPatientId = watch('patientId');
  const watchedIssueDescription = watch('issueDescription');
  // Duplicate check query
  const { data: duplicateCheck } = useDuplicateInterventions(
    watchedPatientId,
    watchedCategory,
    { enabled: !!watchedPatientId && !!watchedCategory }
  );
  // Effects
  useEffect(() => {
    if (storeSelectedPatient && !selectedPatient) {
      setSelectedPatient(storeSelectedPatient);
      setValue('patientId', storeSelectedPatient._id);
    }
  }, [storeSelectedPatient, selectedPatient, setValue]);
  // Check for duplicates when patient and category change
  useEffect(() => {
    if (duplicateCheck?.data && duplicateCheck.data.length > 0) {
      setDuplicateInterventions(duplicateCheck.data);
      setShowDuplicateWarning(true);
    } else {
      setShowDuplicateWarning(false);
      setDuplicateInterventions([]);
    }
  }, [duplicateCheck]);
  // ===============================
  // HANDLERS
  // ===============================
  const handlePatientSelect = (patient: Patient | null) => {
    if (patient) {
      setSelectedPatient(patient);
      setValue('patientId', patient._id);
      setPatientSearchQuery('');
    }
  };
  const handleCategorySelect = (category: string) => {
    setValue('category', category as ClinicalIntervention['category']);
    setShowCategoryDetails(null);
  };
  const onSubmit = (data: IssueIdentificationData) => {
    onNext(data);
  };
  // ===============================
  // RENDER HELPERS
  // ===============================
  const renderPatientSelection = () => (
    <Card className="">
      <CardContent>
        <div
          
          gutterBottom
          className=""
        >
          <PersonIcon color="primary" />
          Patient Selection
        </div>
        {selectedPatient ? (
          <div
            className=""
          >
            <div
              className=""
            >
              <div>
                <div  fontWeight="medium">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </div>
                <div  color="text.secondary">
                  DOB:{' '}
                  {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} |
                  Phone: {selectedPatient.phoneNumber || 'N/A'}
                </div>
              </div>
              <Button
                size="small"
                >
                Change Patient
              </Button>
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
                    placeholder="Type patient name or phone number..."
                    error={!!errors.patientId}
                    helperText={errors.patientId?.message}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <SearchIcon color="action" className="" />
                      ),
                      endAdornment: (
                        <>{searchingPatients && (}
                            <Spinner color="inherit" size={20} />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                  />
                )}
                renderOption={(props, option) => (}
                  <div component="li" {...props}>
                    <div>
                      <div >
                        {option.firstName} {option.lastName}
                      </div>
                      <div  color="text.secondary">
                        DOB: {new Date(option.dateOfBirth).toLocaleDateString()}{' '}
                        | Phone: {option.phoneNumber || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}
                noOptionsText={
                  patientSearchQuery.length < 2
                    ? 'Type at least 2 characters to search'
                    : 'No patients found'}
                }
              />
            )}
          />
        )}
      </CardContent>
    </Card>
  );
  const renderCategorySelection = () => (
    <Card className="">
      <CardContent>
        <div  gutterBottom>
          Clinical Issue Category
        </div>
        <div  color="text.secondary" className="">
          Select the category that best describes the clinical issue
        </div>
        <Controller
          name="category"
          control={control}
          
          render={({  field  }) => (
            <div container spacing={2}>
              {Object.entries(INTERVENTION_CATEGORIES).map(
                ([value, config]) => (
                  <div xs={12} sm={6} md={4} key={value}>
                    <div
                      className=""10`
                            : 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: config.color,
                          bgcolor: `${config.color}05`,
                        },
                      onClick={() => handleCategorySelect(value)}
                    >
                      <div
                        className=""
                      >
                        <div  component="span">
                          {config.icon}
                        </div>
                        <div  fontWeight="medium">
                          {config.label}
                        </div>
                      </div>
                      <div
                        
                        color="text.secondary"
                        className=""
                      >
                        {config.description}
                      </div>
                      <div
                        className=""
                      >
                        <Chip
                          size="small"
                          label={field.value === value ? 'Selected' : 'Select'}
                          color={field.value === value ? 'primary' : 'default'}
                          variant={
                            field.value === value ? 'filled' : 'outlined'}
                          }
                        />
                        <IconButton
                          size="small"
                          >
                          {showCategoryDetails === value ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </div>
                      <Collapse in={showCategoryDetails === value}>
                        <div
                          className=""
                        >
                          <div
                            
                            fontWeight="medium"
                            className=""
                          >
                            Common Examples:
                          </div>
                          {config.examples.map((example, index) => (
                            <div
                              key={index}
                              
                              color="text.secondary"
                              className=""
                            >
                              • {example}
                            </div>
                          ))}
                        </div>
                      </Collapse>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        />
        {errors.category && (
          <div  color="error" className="">
            {errors.category.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
  const renderPrioritySelection = () => (
    <Card className="">
      <CardContent>
        <div  gutterBottom>
          Priority Level
        </div>
        <div  color="text.secondary" className="">
          Select the urgency level based on clinical impact and patient safety
        </div>
        <Controller
          name="priority"
          control={control}
          
          render={({  field  }) => (
            <div container spacing={2}>
              {Object.entries(PRIORITY_LEVELS).map(([value, config]) => (
                <div xs={12} sm={6} key={value}>
                  <div
                    className=""10`
                          : 'background.paper',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: config.color,
                        bgcolor: `${config.color}05`,
                      },
                    onClick={() =>
                      setValue(
                        'priority',
                        value as ClinicalIntervention['priority']
                      )}
                    }
                  >
                    <div
                      className=""
                    >
                      <div  component="span">
                        {config.icon}
                      </div>
                      <div  fontWeight="medium">
                        {config.label}
                      </div>
                    </div>
                    <div
                      
                      color="text.secondary"
                      className=""
                    >
                      {config.description}
                    </div>
                    <div  className="">
                      {config.guidance}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        />
        {errors.priority && (
          <div  color="error" className="">
            {errors.priority.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
  const renderIssueDescription = () => (
    <Card className="">
      <CardContent>
        <div  gutterBottom>
          Issue Description
        </div>
        <div  color="text.secondary" className="">
          Provide a detailed description of the clinical issue or problem
        </div>
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
            <Input
              {...field}
              fullWidth
              multiline
              rows={4}
              label="Clinical Issue Description"
              placeholder="Describe the clinical issue, including relevant patient history, current medications, symptoms, or concerns..."
              error={!!errors.issueDescription}
              helperText={
                errors.issueDescription?.message ||}
                `${watchedIssueDescription?.length || 0}/1000 characters`
              }
            />
          )}
        />
        <div className="">
          <div  fontWeight="medium" className="">
            💡 Tips for effective documentation:
          </div>
          <div  color="text.secondary" className="">
            • Include relevant patient history and current medications
          </div>
          <div  color="text.secondary" className="">
            • Describe symptoms, timing, and severity
          </div>
          <div  color="text.secondary" className="">
            • Note any contributing factors or triggers
          </div>
          <div  color="text.secondary" className="">
            • Reference lab values or clinical parameters if relevant
          </div>
        </div>
      </CardContent>
    </Card>
  );
  const renderDuplicateWarning = () => {
    if (!showDuplicateWarning) return null;
    return (
      <Alert
        severity="warning"
        icon={<WarningIcon />}
        className=""
        action={}
          <Button size="small" onClick={() => setShowDuplicateWarning(false)}>
            Dismiss
          </Button>
        }
      >
        <div  fontWeight="medium">
          Similar interventions found for this patient
        </div>
        <div  className="">
          {duplicateInterventions.length} existing intervention(s) with the same
          category. Please review to avoid duplicates.
        </div>
        <div className="">
          {duplicateInterventions.slice(0, 3).map((intervention) => (
            <Chip
              key={intervention._id}
              label={`${intervention.interventionNumber} - ${intervention.status}`}
              size="small"
              className=""
            />
          ))}
          {duplicateInterventions.length > 3 && (
            <Chip
              label={`+${duplicateInterventions.length - 3} more`}
              size="small"
              
            />
          )}
        </div>
      </Alert>
    );
  };
  const renderEstimatedDuration = () => (
    <Card className="">
      <CardContent>
        <div  gutterBottom>
          Estimated Duration (Optional)
        </div>
        <div  color="text.secondary" className="">
          Estimate how long this intervention might take to complete
        </div>
        <Controller
          name="estimatedDuration"
          control={control}
          render={({  field  }) => (
            <Input
              {...field}
              type="number"
              label="Duration in minutes"
              placeholder="e.g., 30"
              className=""
              InputProps={{}
                inputProps: { min: 1, max: 480 },
              helperText="Leave blank if uncertain"
            />
          )}
        />
      </CardContent>
    </Card>
  );
  return (
    <div>
      <div  gutterBottom>
        Step 1: Issue Identification
      </div>
      <div  color="text.secondary" className="">
        Document the clinical issue or problem that requires intervention
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {renderPatientSelection()}
        {renderDuplicateWarning()}
        {renderCategorySelection()}
        {renderPrioritySelection()}
        {renderIssueDescription()}
        {renderEstimatedDuration()}
        <div className="">
          <Button  onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            
            disabled={!isValid || isLoading}
            startIcon={isLoading ? <Spinner size={20} /> : null}
          >
            {isLoading ? 'Processing...' : 'Next: Strategy Recommendation'}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default IssueIdentificationStep;
