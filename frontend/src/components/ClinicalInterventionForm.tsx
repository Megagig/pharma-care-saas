import * as Yup from 'yup';

import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner, Alert, Accordion } from '@/components/ui/button';
useClinicalIntervention,
  useCreateIntervention,
  useUpdateIntervention,
  useStrategyRecommendations,


interface StrategyRecommendation {
  type: string;
  label: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  priority: 'primary' | 'secondary';
}
// Patient search interface for consistent typing
interface PatientSearchResult {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  mrn?: string;
}
const validationSchema = Yup.object({ 
  patientId: Yup.string().required('Patient is required'),
  category: Yup.string().required('Category is required'),
  priority: Yup.string().required('Priority is required'),
  issueDescription: Yup.string()
    .required('Issue description is required')
    .min(10, 'Description must be at least 10 characters'),
  estimatedDuration: Yup.number()
    .min(1, 'Duration must be at least 1 day')
    .max(365, 'Duration cannot exceed 365 days')}
});
const ClinicalInterventionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  // State
  const [strategies, setStrategies] = useState<
    Omit<InterventionStrategy, '_id'>[]
  >([]);
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchResult | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>(
    'drug_therapy_problem'
  );
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>('');
  // API queries
  const { data: interventionResponse, isLoading: loadingIntervention } =
    useClinicalIntervention(id || '');
  const { data: recommendationsResponse } =
    useStrategyRecommendations(currentCategory);
  const { data: patientSearchResults, isLoading: searchingPatients } =
    useSearchPatients(patientSearchQuery);
  const createMutation = useCreateIntervention();
  const updateMutation = useUpdateIntervention();
  const intervention = interventionResponse?.data;
  const recommendations = recommendationsResponse?.data || [];
  // Extract patients from search results with proper error handling
  const patients: PatientSearchResult[] = React.useMemo(() => {
    try {
      const results = patientSearchResults?.data?.results || [];
      return results.map((patient: any) => ({ 
        _id: patient._id,
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        dateOfBirth: patient.dateOfBirth || patient.dob || '',
        mrn: patient.mrn || ''}
      }));
    } catch (error) {
      console.error('Error processing patient search results:', error);
      return [];
    }
  }, [patientSearchResults]);
  // Form handling
  const formik = useFormik<CreateInterventionData>({ 
    initialValues: {
      patientId: '',
      category: 'drug_therapy_problem',
      priority: 'medium',
      issueDescription: '',
      estimatedDuration: 7,
      strategies: [],
      relatedDTPIds: []}
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const formData = {
          ...values,
          strategies: strategies,
        };
        if (isEditing && id) {
          await updateMutation.mutateAsync({ 
            interventionId: id,
            updates: formData as UpdateInterventionData}
          });
        } else {
          await createMutation.mutateAsync(formData);
        }
        navigate('/pharmacy/clinical-interventions/list');
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  // Load intervention data for editing
  useEffect(() => {
    if (isEditing && intervention) {
      formik.setValues({ 
        patientId: intervention.patientId,
        category: intervention.category,
        priority: intervention.priority,
        issueDescription: intervention.issueDescription,
        estimatedDuration: intervention.estimatedDuration || 7,
        strategies: intervention.strategies || [],
        relatedDTPIds: intervention.relatedDTPIds || []}
      });
      setStrategies(intervention.strategies || []);
      setCurrentCategory(intervention.category);
      if (intervention.patient) {
        setSelectedPatient(intervention.patient);
      }
    }
  }, [intervention, isEditing, formik]);
  // Strategy management
  const addStrategy = (strategy: Omit<InterventionStrategy, '_id'>) => {
    setStrategies((prev) => [...prev, strategy]);
    setStrategyDialogOpen(false);
  };
  const removeStrategy = (index: number) => {
    setStrategies((prev) => prev.filter((_, i) => i !== index));
  };
  const addRecommendedStrategy = (recommendation: StrategyRecommendation) => {
    const strategy: Omit<InterventionStrategy, '_id'> = {
      type: recommendation.type as InterventionStrategy['type'],
      description: recommendation.description,
      rationale: recommendation.rationale,
      expectedOutcome: recommendation.expectedOutcome,
      priority: recommendation.priority,
    };
    addStrategy(strategy);
  };
  if (isEditing && loadingIntervention) {
    return (
      <div
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <Spinner />
      </div>
    );
  }
  return (
    <div>
      {/* Header */}
      <div
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <div  component="h2">
          {isEditing
            ? 'Edit Clinical Intervention'
            : 'Create New Clinical Intervention'}
        </div>
        <div display="flex" gap={1}>
          <Button
            
            startIcon={<CancelIcon />}
            onClick={() => navigate('/pharmacy/clinical-interventions/list')}
          >
            Cancel
          </Button>
          <Button
            
            startIcon={<SaveIcon />}
            onClick={() => formik.handleSubmit()}
            disabled={
              formik.isSubmitting ||
              createMutation.isPending ||
              updateMutation.isPending}
            }
          >
            {formik.isSubmitting ||
            createMutation.isPending ||
            updateMutation.isPending
              ? 'Saving...'
              : isEditing
              ? 'Update'
              : 'Create'}
          </Button>
        </div>
      </div>
      <form onSubmit={formik.handleSubmit}>
        <div display="flex" flexDirection="column" gap={3}>
          {/* Basic Information */}
          <div>
            <Card>
              <CardContent>
                <div  gutterBottom>
                  Basic Information
                </div>
                <div display="flex" flexWrap="wrap" gap={2}>
                  {/* Patient Selection */}
                  <div className="">
                    <div>
                      <div  gutterBottom>
                        Patient *
                      </div>
                      {selectedPatient ? (
                        <div
                          display="flex"
                          alignItems="center"
                          gap={1}
                          p={2}
                          border={1}
                          borderColor="divider"
                          borderRadius={1}
                        >
                          <PersonIcon color="action" />
                          <div flex={1}>
                            <div >
                              {selectedPatient.firstName}{' '}
                              {selectedPatient.lastName}
                            </div>
                            <div
                              
                              color="text.secondary"
                            >
                              {selectedPatient.mrn &&
                                `MRN: ${selectedPatient.mrn}`}
                              {selectedPatient.mrn &&
                                selectedPatient.dateOfBirth &&
                                ' • '}
                              {selectedPatient.dateOfBirth &&
                                `DOB: ${selectedPatient.dateOfBirth}`}
                            </div>
                          </div>
                          <Button
                            size="small"
                            >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Autocomplete
                          options={patients}
                          loading={searchingPatients}
                          getOptionLabel={(option) => {
                            const name =}
                              `${option.firstName} ${option.lastName}`.trim();
                            const mrn = option.mrn
                              ? ` (MRN: ${option.mrn})`
                              : '';
                            const dob = option.dateOfBirth
                              ? ` - DOB: ${option.dateOfBirth}`
                              : '';
                            return `${name}${mrn}${dob}`;
                          renderInput={(params) => (
                            <Input}
                              {...params}
                              placeholder="Search patients by name or MRN..."
                              error={
                                formik.touched.patientId &&
                                Boolean(formik.errors.patientId)}
                              }
                              helperText={
                                formik.touched.patientId &&
                                formik.errors.patientId}
                              }
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>{searchingPatients ? (
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
                          renderOption={(props, option) => (}
                            <div component="li" {...props}>
                              <div
                                className=""
                              >
                                <div  fontWeight={500}>
                                  {option.firstName} {option.lastName}
                                </div>
                                <div
                                  
                                  color="text.secondary"
                                >
                                  {option.mrn && `MRN: ${option.mrn}`}
                                  {option.mrn && option.dateOfBirth && ' • '}
                                  {option.dateOfBirth &&
                                    `DOB: ${option.dateOfBirth}`}
                                </div>
                              </div>
                            </div>
                          )}
                          noOptionsText={
                            patientSearchQuery.length < 2
                              ? 'Type at least 2 characters to search patients'
                              : searchingPatients
                              ? 'Searching patients...'
                              : 'No patients found'}
                          }
                          filterOptions={(x) => x} // Disable client-side filtering since we're using server-side search
                        />
                      )}
                    </div>
                  </div>
                  {/* Category */}
                  <div className="">
                    <div
                      fullWidth
                      error={
                        formik.touched.category &&
                        Boolean(formik.errors.category)}
                      }
                    >
                      <Label>Category *</Label>
                      <Select
                        name="category"
                        value={formik.values.category}
                        label="Category *"
                        >
                        <MenuItem value="drug_therapy_problem">
                          Drug Therapy Problem
                        </MenuItem>
                        <MenuItem value="adverse_drug_reaction">
                          Adverse Drug Reaction
                        </MenuItem>
                        <MenuItem value="medication_nonadherence">
                          Medication Non-adherence
                        </MenuItem>
                        <MenuItem value="drug_interaction">
                          Drug Interaction
                        </MenuItem>
                        <MenuItem value="dosing_issue">Dosing Issue</MenuItem>
                        <MenuItem value="contraindication">
                          Contraindication
                        </MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </div>
                  </div>
                  {/* Priority */}
                  <div className="">
                    <div
                      fullWidth
                      error={
                        formik.touched.priority &&
                        Boolean(formik.errors.priority)}
                      }
                    >
                      <Label>Priority *</Label>
                      <Select
                        name="priority"
                        value={formik.values.priority}
                        label="Priority *"
                        onChange={formik.handleChange}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="critical">Critical</MenuItem>
                      </Select>
                    </div>
                  </div>
                  {/* Estimated Duration */}
                  <div className="">
                    <Input
                      fullWidth
                      name="estimatedDuration"
                      label="Estimated Duration (days)"
                      type="number"
                      value={formik.values.estimatedDuration}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.estimatedDuration &&
                        Boolean(formik.errors.estimatedDuration)}
                      }
                      helperText={
                        formik.touched.estimatedDuration &&
                        formik.errors.estimatedDuration}
                      }
                    />
                  </div>
                  {/* Issue Description */}
                  <div>
                    <Input
                      fullWidth
                      multiline
                      rows={4}
                      name="issueDescription"
                      label="Issue Description *"
                      value={formik.values.issueDescription}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.issueDescription &&
                        Boolean(formik.errors.issueDescription)}
                      }
                      helperText={
                        formik.touched.issueDescription &&
                        formik.errors.issueDescription}
                      }
                      placeholder="Describe the clinical issue or problem that requires intervention..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Strategies */}
          <div>
            <Card>
              <CardContent>
                <div
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <div >Intervention Strategies</div>
                  <Button
                    
                    startIcon={<AddIcon />}
                    onClick={() => setStrategyDialogOpen(true)}
                  >
                    Add Strategy
                  </Button>
                </div>
                {/* Recommended Strategies */}
                {recommendations.length > 0 && (
                  <Accordion className="">
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <div >
                        Recommended Strategies ({recommendations.length})
                      </div>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {recommendations.map((rec, index) => (
                          <div key={index} divider>
                            <div
                              primary={rec.label}
                              secondary={rec.description}
                            />
                            <divSecondaryAction>
                              <Button
                                size="small"
                                onClick={() => addRecommendedStrategy(rec)}
                              >
                                Add
                              </Button>
                            </ListItemSecondaryAction>
                          </div>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
                {/* Current Strategies */}
                {strategies.length > 0 ? (
                  <List>
                    {strategies.map((strategy, index) => (
                      <div key={index} divider>
                        <div
                          primary={}
                            <div display="flex" alignItems="center" gap={1}>
                              <div >
                                {strategy.description}
                              </div>
                              <Chip
                                label={strategy.priority}
                                size="small"
                                color={
                                  strategy.priority === 'primary'
                                    ? 'primary'
                                    : 'default'}
                                }
                              />
                            </div>
                          }
                          secondary={
                            <div>
                              <div
                                
                                color="text.secondary"
                              >}
                                <strong>Rationale:</strong> {strategy.rationale}
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                <strong>Expected Outcome:</strong>{' '}
                                {strategy.expectedOutcome}
                              </div>
                            </div>
                          }
                        />
                        <divSecondaryAction>
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => removeStrategy(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </div>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No strategies added yet. Click "Add Strategy" to add
                    intervention strategies.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      {/* Strategy Dialog */}
      <StrategyDialog
        open={strategyDialogOpen}
        onClose={() => setStrategyDialogOpen(false)}
        onAdd={addStrategy}
      />
    </div>
  );
};
// Strategy Dialog Component
interface StrategyDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (strategy: Omit<InterventionStrategy, '_id'>) => void;
}
const StrategyDialog: React.FC<StrategyDialogProps> = ({ 
  open,
  onClose,
  onAdd
}) => {
  const [strategy, setStrategy] = useState<Omit<InterventionStrategy, '_id'>>({ 
    type: 'medication_review',
    description: '',
    rationale: '',
    expectedOutcome: '',
    priority: 'primary'}
  });
  const handleAdd = () => {
    if (
      strategy.description &&
      strategy.rationale &&
      strategy.expectedOutcome
    ) {
      onAdd(strategy);
      setStrategy({ 
        type: 'medication_review',
        description: '',
        rationale: '',
        expectedOutcome: '',
        priority: 'primary'}
      });
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Intervention Strategy</DialogTitle>
      <DialogContent>
        <div display="flex" flexWrap="wrap" gap={2} className="">
          <div className="">
            <div fullWidth>
              <Label>Strategy Type</Label>
              <Select
                value={strategy.type}
                label="Strategy Type"
                onChange={(e) =>
                  setStrategy((prev) => ({ 
                    ...prev}
                    type: e.target.value as InterventionStrategy['type'],}
                  }))
                }
              >
                <MenuItem value="medication_review">Medication Review</MenuItem>
                <MenuItem value="dose_adjustment">Dose Adjustment</MenuItem>
                <MenuItem value="alternative_therapy">
                  Alternative Therapy
                </MenuItem>
                <MenuItem value="discontinuation">Discontinuation</MenuItem>
                <MenuItem value="additional_monitoring">
                  Additional Monitoring
                </MenuItem>
                <MenuItem value="patient_counseling">
                  Patient Counseling
                </MenuItem>
                <MenuItem value="physician_consultation">
                  Physician Consultation
                </MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </div>
          </div>
          <div className="">
            <div fullWidth>
              <Label>Priority</Label>
              <Select
                value={strategy.priority}
                label="Priority"
                onChange={(e) =>
                  setStrategy((prev) => ({ 
                    ...prev,
                    priority: e.target })
                      .value as InterventionStrategy['priority'],}
                  }))
                }
              >
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
              </Select>
            </div>
          </div>
          <div>
            <Input
              fullWidth
              label="Description"
              value={strategy.description}
              onChange={(e) =>
                setStrategy((prev) => ({ 
                  ...prev}
                  description: e.target.value,}
                }))
              }
              placeholder="Describe the intervention strategy..."
            />
          </div>
          <div>
            <Input
              fullWidth
              multiline
              rows={3}
              label="Rationale"
              value={strategy.rationale}
              onChange={(e) =>}
                setStrategy((prev) => ({ ...prev, rationale: e.target.value }))
              }
              placeholder="Explain the reasoning behind this strategy..."
            />
          </div>
          <div>
            <Input
              fullWidth
              multiline
              rows={2}
              label="Expected Outcome"
              value={strategy.expectedOutcome}
              onChange={(e) =>
                setStrategy((prev) => ({ 
                  ...prev}
                  expectedOutcome: e.target.value,}
                }))
              }
              placeholder="Describe the expected outcome of this strategy..."
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAdd}
          
          disabled={
            !strategy.description ||
            !strategy.rationale ||
            !strategy.expectedOutcome}
          }
        >
          Add Strategy
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ClinicalInterventionForm;
