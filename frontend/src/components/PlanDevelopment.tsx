import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner, Alert, Tabs } from '@/components/ui/button';

interface PlanDevelopmentProps {
  problems: DrugTherapyProblem[];
  onPlanCreated: (plan: TherapyPlan) => void;
  onPlanUpdated?: (plan: TherapyPlan) => void;
  existingPlan?: TherapyPlan;
}

interface PlanFormData {
  problems: string[];
  recommendations: TherapyRecommendation[];
  monitoringPlan: MonitoringParameter[];
  counselingPoints: string[];
  goals: TherapyGoal[];
  timeline: string;
  pharmacistNotes: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ 
  children,
  value,
  index,
  ...other })
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`plan-tabpanel-${index}`}
      aria-labelledby={`plan-tab-${index}`}
      {...other}
    >
      {value === index && <div className="">{children}</div>}
    </div>
  );
};

const RECOMMENDATION_TYPES = [
  {
    value: 'discontinue',
    label: 'Discontinue Medication',
    description: 'Stop the medication completely',
    icon: <ErrorIcon />,
    color: 'error',
  },
  {
    value: 'adjust_dose',
    label: 'Adjust Dose',
    description: 'Modify the current dosage',
    icon: <EditIcon />,
    color: 'warning',
  },
  {
    value: 'switch_therapy',
    label: 'Switch Therapy',
    description: 'Change to alternative medication',
    icon: <ContentCopyIcon />,
    color: 'info',
  },
  {
    value: 'add_therapy',
    label: 'Add Therapy',
    description: 'Add new medication to regimen',
    icon: <AddIcon />,
    color: 'success',
  },
  {
    value: 'monitor',
    label: 'Monitor',
    description: 'Continue with enhanced monitoring',
    icon: <MonitorHeartIcon />,
    color: 'primary',
  },
];

const PRIORITY_LEVELS = [
  { value: 'high', label: 'High Priority', color: 'error' },
  { value: 'medium', label: 'Medium Priority', color: 'warning' },
  { value: 'low', label: 'Low Priority', color: 'success' },
];

const MONITORING_PARAMETERS = [
  'Blood Pressure',
  'Heart Rate',
  'Blood Glucose',
  'HbA1c',
  'Lipid Panel',
  'Liver Function Tests',
  'Kidney Function (Creatinine)',
  'Electrolytes',
  'Complete Blood Count',
  'INR/PT',
  'Drug Levels',
  'Symptom Assessment',
  'Adherence Check',
  'Side Effects Monitoring',
  'Quality of Life',
];

const MONITORING_FREQUENCIES = [
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'Every 3 months',
  'Every 6 months',
  'Annually',
  'As needed',
  'Before next visit',
];

const COUNSELING_TEMPLATES = [
  'Medication administration instructions',
  'Side effects to watch for',
  'Drug-food interactions',
  'Importance of adherence',
  'Storage instructions',
  'When to contact healthcare provider',
  'Lifestyle modifications',
  'Disease state education',
  'Monitoring requirements',
  'Follow-up schedule',
];

const RECOMMENDATION_TEMPLATES = {
  discontinue: [
    'Discontinue due to lack of indication',
    'Discontinue due to adverse effects',
    'Discontinue due to drug interaction',
    'Discontinue due to contraindication',
  ],
  adjust_dose: [
    'Reduce dose due to side effects',
    'Increase dose for better efficacy',
    'Adjust dose based on kidney function',
    'Adjust dose based on age',
  ],
  switch_therapy: [
    'Switch to more effective alternative',
    'Switch to safer alternative',
    'Switch to more cost-effective option',
    'Switch due to patient preference',
  ],
  add_therapy: [
    'Add therapy for untreated condition',
    'Add therapy for better disease control',
    'Add therapy for drug interaction prevention',
    'Add therapy for side effect management',
  ],
  monitor: [
    'Continue with enhanced monitoring',
    'Monitor for therapeutic response',
    'Monitor for adverse effects',
    'Monitor drug levels',
  ],
};

const PlanDevelopment: React.FC<PlanDevelopmentProps> = ({ 
  problems,
  onPlanCreated,
  onPlanUpdated,
  existingPlan
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] =
    useState(false);
  const [isMonitoringDialogOpen, setIsMonitoringDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<TherapyRecommendation | null>(null);
  const [selectedMonitoring, setSelectedMonitoring] =
    useState<MonitoringParameter | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<TherapyGoal | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { createPlan, updatePlan, loading } = useMTRStore();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { isDirty },
  } = useForm<PlanFormData>({ 
    defaultValues: {
      problems: existingPlan?.problems || [],
      recommendations: existingPlan?.recommendations || [],
      monitoringPlan: existingPlan?.monitoringPlan || [],
      counselingPoints: existingPlan?.counselingPoints || [],
      goals: existingPlan?.goals || [],
      timeline: existingPlan?.timeline || '',
      pharmacistNotes: existingPlan?.pharmacistNotes || ''}
    }

  const {
    fields: recommendationFields,
    append: appendRecommendation,
    remove: removeRecommendation,
    update: updateRecommendationField,
  } = useFieldArray({ 
    control,
    name: 'recommendations'}
  });

  const {
    fields: monitoringFields,
    append: appendMonitoring,
    remove: removeMonitoring,
    update: updateMonitoringField,
  } = useFieldArray({ 
    control,
    name: 'monitoringPlan'}
  });

  const {
    fields: goalFields,
    append: appendGoal,
    remove: removeGoal,
    update: updateGoalField,
  } = useFieldArray({ 
    control,
    name: 'goals'}
  });

  const watchedProblems = watch('problems');
  const watchedRecommendations = watch('recommendations');
  const watchedMonitoring = watch('monitoringPlan');
  const watchedGoals = watch('goals');

  // Filter problems by severity for better organization
  const problemsBySeverity = useMemo(() => {
    const grouped = {
      critical: problems.filter((p) => p.severity === 'critical'),
      major: problems.filter((p) => p.severity === 'major'),
      moderate: problems.filter((p) => p.severity === 'moderate'),
      minor: problems.filter((p) => p.severity === 'minor'),
    };
    return grouped;
  }, [problems]);

  // Calculate plan completeness
  const planCompleteness = useMemo(() => {
    const totalSections = 6; // problems, recommendations, monitoring, counseling, goals, notes
    let completedSections = 0;

    if (watchedProblems.length > 0) completedSections++;
    if (watchedRecommendations.length > 0) completedSections++;
    if (watchedMonitoring.length > 0) completedSections++;
    if (getValues('counselingPoints').length > 0) completedSections++;
    if (watchedGoals.length > 0) completedSections++;
    if (getValues('pharmacistNotes').trim()) completedSections++;

    return (completedSections / totalSections) * 100;
  }, [
    watchedProblems,
    watchedRecommendations,
    watchedMonitoring,
    watchedGoals,
    getValues,
  ]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSavePlan = async (formData: PlanFormData) => {
    try {
      const planData: TherapyPlan = {
        ...formData,
      };

      setSaveError(null);
      if (existingPlan) {
        await updatePlan(planData);
        onPlanUpdated?.(planData);
      } else {
        await createPlan(planData);
        onPlanCreated(planData);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save plan'
      );
    }
  };

  const handleAddRecommendation = (recommendation?: TherapyRecommendation) => {
    setSelectedRecommendation(recommendation || null);
    setIsRecommendationDialogOpen(true);
  };

  const handleSaveRecommendation = (recommendation: TherapyRecommendation) => {
    if (selectedRecommendation) {
      const index = recommendationFields.findIndex(
        (r) =>
          r.id ===
          selectedRecommendation.type + selectedRecommendation.medication
      );
      if (index >= 0) {
        updateRecommendationField(index, recommendation);
      }
    } else {
      appendRecommendation(recommendation);
    }
    setIsRecommendationDialogOpen(false);
    setSelectedRecommendation(null);
  };

  const handleAddMonitoring = (monitoring?: MonitoringParameter) => {
    setSelectedMonitoring(monitoring || null);
    setIsMonitoringDialogOpen(true);
  };

  const handleSaveMonitoring = (monitoring: MonitoringParameter) => {
    if (selectedMonitoring) {
      const index = monitoringFields.findIndex(
        (m) => m.parameter === selectedMonitoring.parameter
      );
      if (index >= 0) {
        updateMonitoringField(index, monitoring);
      }
    } else {
      appendMonitoring(monitoring);
    }
    setIsMonitoringDialogOpen(false);
    setSelectedMonitoring(null);
  };

  const handleAddGoal = (goal?: TherapyGoal) => {
    setSelectedGoal(goal || null);
    setIsGoalDialogOpen(true);
  };

  const handleSaveGoal = (goal: TherapyGoal) => {
    if (selectedGoal) {
      const index = goalFields.findIndex(
        (g) => g.description === selectedGoal.description
      );
      if (index >= 0) {
        updateGoalField(index, goal);
      }
    } else {
      appendGoal(goal);
    }
    setIsGoalDialogOpen(false);
    setSelectedGoal(null);
  };

  const addCounselingPoint = (point: string) => {
    const currentPoints = getValues('counselingPoints');
    if (!currentPoints.includes(point)) {
      setValue('counselingPoints', [...currentPoints, point], {
        shouldDirty: true}
    }
  };

  const removeCounselingPoint = (index: number) => {
    const currentPoints = getValues('counselingPoints');
    setValue(
      'counselingPoints',
      currentPoints.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon />;
      case 'major':
        return <WarningIcon />;
      case 'moderate':
        return <InfoIcon />;
      case 'minor':
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  if (problems.length === 0) {
    return (
      <Card>
        <CardContent className="">
          <AssignmentIcon
            className=""
          />
          <div  color="text.secondary" className="">
            No Problems Identified
          </div>
          <div  color="text.secondary">
            Please complete the therapy assessment step to identify problems
            before developing a plan
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        {/* Header */}
        <div
          className=""
        >
          <div className="">
            <AssignmentIcon className="" />
            <div  className="">
              Plan Development
            </div>
            <Chip
              label={`${problems.length} problems`}
              size="small"
              color="primary"
              
              className=""
            />
          </div>
          <div direction="row" spacing={2}>
            <div  color="text.secondary">
              Plan Completeness: {Math.round(planCompleteness)}%
            </div>
            <Button
              
              startIcon={}
                loading.savePlan ? <Spinner size={16} /> : <SaveIcon />
              }
              onClick={handleSubmit(handleSavePlan)}
              disabled={loading.savePlan || !isDirty}
            >
              {existingPlan ? 'Update Plan' : 'Save Plan'}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {saveError && (
          <Alert severity="error" className="">
            {saveError}
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <div className="">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="plan development tabs"
            >
              <Tab label="Problems & Recommendations" />
              <Tab label="Monitoring Plan" />
              <Tab label="Goals & Counseling" />
              <Tab label="Summary & Notes" />
            </Tabs>
          </div>

          {/* Tab 1: Problems & Recommendations */}
          <TabPanel value={activeTab} index={0}>
            <FixedGrid container spacing={3}>
              {/* Problems Selection */}
              <FixedGrid item xs={12} md={6}>
                <div
                  
                  className=""
                >
                  <FlagIcon className="" />
                  Identified Problems
                </div>

                <Controller
                  name="problems"
                  control={control}
                  render={({  field  }) => (
                    <div spacing={2}>
                      {Object.entries(problemsBySeverity).map(
                        ([severity, severityProblems]) =>
                          severityProblems.length > 0 && (
                            <div key={severity}>
                              <div
                                
                                className=""
                              >
                                {severity} Problems ({severityProblems.length})
                              </div>
                              {severityProblems.map((problem) => (
                                <FormControlLabel
                                  key={problem._id}
                                  control={
                                    <Checkbox
                                      checked={field.value.includes(
                                        problem._id}
                                      )}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          field.onChange([
                                            ...field.value,
                                            problem._id,
                                          ]);}
                                        } else {
                                          field.onChange(
                                            field.value.filter(
                                              (id) => id !== problem._id
                                            )
                                          );
                                        }
                                    />
                                  }
                                  label={
                                    <div
                                      className=""
                                    >}
                                      {getSeverityIcon(problem.severity)}
                                      <div className="">
                                        <div
                                          
                                          className=""
                                        >
                                          {problem.description}
                                        </div>
                                        <div
                                          
                                          color="text.secondary"
                                        >
                                          {problem.clinicalSignificance}
                                        </div>
                                      </div>
                                    </div>
                                  }
                                />
                              ))}
                            </div>
                          )
                      )}
                    </div>
                  )}
                />
              </FixedGrid>

              {/* Recommendations */}
              <FixedGrid item xs={12} md={6}>
                <div
                  className=""
                >
                  <div
                    
                    className=""
                  >
                    <LightbulbIcon className="" />
                    Recommendations
                  </div>
                  <Button
                    
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddRecommendation()}
                  >
                    Add Recommendation
                  </Button>
                </div>

                <div spacing={2}>
                  {recommendationFields.map((recommendation, index) => (
                    <Card key={recommendation.id} >
                      <CardContent className="">
                        <div
                          className=""
                        >
                          <div className="">
                            {
                              RECOMMENDATION_TYPES.find(
                                (t) => t.value === recommendation.type
                              )?.icon
                            }
                            <div
                              
                              className=""
                            >
                              {
                                RECOMMENDATION_TYPES.find(
                                  (t) => t.value === recommendation.type
                                )?.label
                              }
                            </div>
                            <Chip
                              label={recommendation.priority}
                              size="small"
                              color={
                                (PRIORITY_LEVELS.find(
                                  (p) => p.value === recommendation.priority
                                )?.color as
                                  | 'primary'
                                  | 'secondary'
                                  | 'success'
                                  | 'info'
                                  | 'default'
                                  | 'error'
                                  | 'warning') || 'default'}
                              }
                              className=""
                            />
                          </div>
                          <div direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleAddRecommendation(recommendation)}
                              }
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeRecommendation(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </div>
                        </div>
                        {recommendation.medication && (
                          <div
                            
                            color="primary"
                            className=""
                          >
                            Medication: {recommendation.medication}
                          </div>
                        )}
                        <div  className="">
                          {recommendation.rationale}
                        </div>
                        <div  color="text.secondary">
                          Expected Outcome: {recommendation.expectedOutcome}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {recommendationFields.length === 0 && (
                    <div
                      className=""
                    >
                      <div  color="text.secondary">
                        No recommendations added yet. Click "Add Recommendation"
                        to get started.
                      </div>
                    </div>
                  )}
                </div>
              </FixedGrid>
            </FixedGrid>
          </TabPanel>

          {/* Tab 2: Monitoring Plan */}
          <TabPanel value={activeTab} index={1}>
            <div
              className=""
            >
              <div
                
                className=""
              >
                <MonitorHeartIcon className="" />
                Monitoring Parameters
              </div>
              <Button
                
                startIcon={<AddIcon />}
                onClick={() => handleAddMonitoring()}
              >
                Add Parameter
              </Button>
            </div>

            <FixedGrid container spacing={2}>
              {monitoringFields.map((monitoring, index) => (
                <FixedGrid item xs={12} md={6} key={monitoring.id}>
                  <Card >
                    <CardContent>
                      <div
                        className=""
                      >
                        <div
                          
                          className=""
                        >
                          {monitoring.parameter}
                        </div>
                        <div direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleAddMonitoring(monitoring)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => removeMonitoring(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      </div>
                      <div
                        
                        color="text.secondary"
                        className=""
                      >
                        Frequency: {monitoring.frequency}
                      </div>
                      {monitoring.targetValue && (
                        <div
                          
                          color="text.secondary"
                          className=""
                        >
                          Target: {monitoring.targetValue}
                        </div>
                      )}
                      {monitoring.notes && (
                        <div >
                          {monitoring.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </FixedGrid>
              ))}

              {monitoringFields.length === 0 && (
                <FixedGrid item xs={12}>
                  <div className="">
                    <div  color="text.secondary">
                      No monitoring parameters defined. Add parameters to track
                      therapy effectiveness and safety.
                    </div>
                  </div>
                </FixedGrid>
              )}
            </FixedGrid>
          </TabPanel>

          {/* Tab 3: Goals & Counseling */}
          <TabPanel value={activeTab} index={2}>
            <FixedGrid container spacing={3}>
              {/* Therapy Goals */}
              <FixedGrid item xs={12} md={6}>
                <div
                  className=""
                >
                  <div
                    
                    className=""
                  >
                    <FlagIcon className="" />
                    Therapy Goals
                  </div>
                  <Button
                    
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddGoal()}
                  >
                    Add Goal
                  </Button>
                </div>

                <div spacing={2}>
                  {goalFields.map((goal, index) => (
                    <Card key={goal.id} >
                      <CardContent className="">
                        <div
                          className=""
                        >
                          <div
                            
                            className=""
                          >
                            {goal.description}
                          </div>
                          <div direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleAddGoal(goal)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeGoal(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </div>
                        </div>
                        {goal.targetDate && (
                          <div
                            
                            color="text.secondary"
                            className=""
                          >
                            Target Date:{' '}
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </div>
                        )}
                        <Chip
                          label={goal.achieved ? 'Achieved' : 'In Progress'}
                          size="small"
                          color={goal.achieved ? 'success' : 'default'}
                          variant={goal.achieved ? 'filled' : 'outlined'}
                        />
                      </CardContent>
                    </Card>
                  ))}

                  {goalFields.length === 0 && (
                    <div
                      className=""
                    >
                      <div  color="text.secondary">
                        No therapy goals set. Define measurable goals to track
                        treatment success.
                      </div>
                    </div>
                  )}
                </div>
              </FixedGrid>

              {/* Counseling Points */}
              <FixedGrid item xs={12} md={6}>
                <div
                  
                  className=""
                >
                  <PsychologyIcon className="" />
                  Patient Counseling Points
                </div>

                <div className="">
                  <div  className="">
                    Quick Add Templates:
                  </div>
                  <div className="">
                    {COUNSELING_TEMPLATES.map((template) => (
                      <Chip
                        key={template}
                        label={template}
                        size="small"
                        
                        onClick={() => addCounselingPoint(template)}
                        className=""
                      />
                    ))}
                  </div>
                </div>

                <Controller
                  name="counselingPoints"
                  control={control}
                  render={({  field  }) => (
                    <div spacing={1}>
                      {field.value.map((point, index) => (
                        <div
                          key={index}
                          className=""
                        >
                          <div  className="">
                            {point}
                          </div>
                          <IconButton
                            size="small"
                            onClick={() => removeCounselingPoint(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      ))}

                      <Input
                        placeholder="Add custom counseling point..."
                        size="small"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            if (target.value.trim()) {
                              addCounselingPoint(target.value.trim());
                              target.value = '';}
                            }
                          }
                      />
                    </div>
                  )}
                />
              </FixedGrid>
            </FixedGrid>
          </TabPanel>

          {/* Tab 4: Summary & Notes */}
          <TabPanel value={activeTab} index={3}>
            <FixedGrid container spacing={3}>
              <FixedGrid item xs={12} md={8}>
                <div  className="">
                  Pharmacist Notes
                </div>
                <Controller
                  name="pharmacistNotes"
                  control={control}
                  render={({  field  }) => (
                    <Input
                      {...field}
                      multiline
                      rows={8}
                      fullWidth
                      placeholder="Enter detailed pharmacist notes, clinical reasoning, and additional considerations..."
                      
                    />
                  )}
                />

                <div className="">
                  <div  className="">
                    Implementation Timeline
                  </div>
                  <Controller
                    name="timeline"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Describe the timeline for implementing recommendations..."
                        
                      />
                    )}
                  />
                </div>
              </FixedGrid>

              <FixedGrid item xs={12} md={4}>
                <div  className="">
                  Plan Summary
                </div>

                <div spacing={2}>
                  <Card >
                    <CardContent>
                      <div  className="">
                        Problems Addressed
                      </div>
                      <div  color="primary">
                        {watchedProblems.length}
                      </div>
                      <div  color="text.secondary">
                        of {problems.length} identified
                      </div>
                    </CardContent>
                  </Card>

                  <Card >
                    <CardContent>
                      <div  className="">
                        Recommendations
                      </div>
                      <div  color="primary">
                        {watchedRecommendations.length}
                      </div>
                      <div  color="text.secondary">
                        therapeutic interventions
                      </div>
                    </CardContent>
                  </Card>

                  <Card >
                    <CardContent>
                      <div  className="">
                        Monitoring Parameters
                      </div>
                      <div  color="primary">
                        {watchedMonitoring.length}
                      </div>
                      <div  color="text.secondary">
                        safety & efficacy checks
                      </div>
                    </CardContent>
                  </Card>

                  <Card >
                    <CardContent>
                      <div  className="">
                        Therapy Goals
                      </div>
                      <div  color="primary">
                        {watchedGoals.length}
                      </div>
                      <div  color="text.secondary">
                        measurable outcomes
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </FixedGrid>
            </FixedGrid>
          </TabPanel>
        </Card>

        {/* Recommendation Dialog */}
        <RecommendationDialog
          open={isRecommendationDialogOpen}
          onClose={() => setIsRecommendationDialogOpen(false)}
          onSave={handleSaveRecommendation}
          recommendation={selectedRecommendation}
        />

        {/* Monitoring Dialog */}
        <MonitoringDialog
          open={isMonitoringDialogOpen}
          onClose={() => setIsMonitoringDialogOpen(false)}
          onSave={handleSaveMonitoring}
          monitoring={selectedMonitoring}
        />

        {/* Goal Dialog */}
        <GoalDialog
          open={isGoalDialogOpen}
          onClose={() => setIsGoalDialogOpen(false)}
          onSave={handleSaveGoal}
          goal={selectedGoal}
        />
      </div>
    </LocalizationProvider>
  );
};

// Recommendation Dialog Component
interface RecommendationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (recommendation: TherapyRecommendation) => void;
  recommendation?: TherapyRecommendation | null;
}

const RecommendationDialog: React.FC<RecommendationDialogProps> = ({ 
  open,
  onClose,
  onSave,
  recommendation
}) => {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TherapyRecommendation>({ 
    defaultValues: recommendation || {
      type: 'monitor',
      priority: 'medium',
      medication: '',
      rationale: '',
      expectedOutcome: ''}
    }

  const watchedType = watch('type');

  useEffect(() => {
    if (recommendation) {
      reset(recommendation);
    } else {
      reset({ 
        type: 'monitor',
        priority: 'medium',
        medication: '',
        rationale: '',
        expectedOutcome: ''}
      });
    }
  }, [recommendation, reset]);

  const handleSave = (data: TherapyRecommendation) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {recommendation ? 'Edit Recommendation' : 'Add Recommendation'}
      </DialogTitle>
      <DialogContent>
        <FixedGrid container spacing={2} className="">
          <FixedGrid item xs={12} md={6}>
            <Controller
              name="type"
              control={control}
              
              render={({  field  }) => (
                <div fullWidth error={!!errors.type}>
                  <Label>Recommendation Type</Label>
                  <Select {...field} label="Recommendation Type">
                    {RECOMMENDATION_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <div className="">
                          {type.icon}
                          <div className="">
                            <div >
                              {type.label}
                            </div>
                            <div
                              
                              color="text.secondary"
                            >
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12} md={6}>
            <Controller
              name="priority"
              control={control}
              
              render={({  field  }) => (
                <div fullWidth error={!!errors.priority}>
                  <Label>Priority</Label>
                  <Select {...field} label="Priority">
                    {PRIORITY_LEVELS.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Chip
                          label={priority.label}
                          size="small"
                          color={
                            priority.color as
                              | 'primary'
                              | 'secondary'
                              | 'success'
                              | 'info'
                              | 'default'
                              | 'error'
                              | 'warning'}
                          }
                          className=""
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12}>
            <Controller
              name="medication"
              control={control}
              render={({  field  }) => (
                <Input
                  {...field}
                  fullWidth
                  label="Medication (if applicable)"
                  placeholder="Enter medication name..."
                />
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12}>
            <Controller
              name="rationale"
              control={control}
              
              render={({  field  }) => (
                <Input
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Rationale"
                  placeholder="Explain the clinical reasoning for this recommendation..."
                  error={!!errors.rationale}
                  helperText={errors.rationale?.message}
                />
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12}>
            <div  className="">
              Quick Templates:
            </div>
            <div className="">
              {RECOMMENDATION_TEMPLATES[
                watchedType as keyof typeof RECOMMENDATION_TEMPLATES
              ]?.map((template) => (
                <Chip
                  key={template}
                  label={template}
                  size="small"
                  
                  onClick={() => {
                    const currentRationale = watch('rationale');
                    if (!currentRationale.includes(template)) {
                      reset({ 
                        ...watch()}
                        rationale: currentRationale}
                          ? `${currentRationale}. ${template}`
                          : template}
                    }
                  className=""
                />
              ))}
            </div>
          </FixedGrid>

          <FixedGrid item xs={12}>
            <Controller
              name="expectedOutcome"
              control={control}
              
              render={({  field  }) => (
                <Input
                  {...field}
                  fullWidth
                  multiline
                  rows={2}
                  label="Expected Outcome"
                  placeholder="Describe the expected clinical outcome..."
                  error={!!errors.expectedOutcome}
                  helperText={errors.expectedOutcome?.message}
                />
              )}
            />
          </FixedGrid>
        </FixedGrid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button  onClick={handleSubmit(handleSave)}>
          Save Recommendation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Monitoring Dialog Component
interface MonitoringDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (monitoring: MonitoringParameter) => void;
  monitoring?: MonitoringParameter | null;
}

const MonitoringDialog: React.FC<MonitoringDialogProps> = ({ 
  open,
  onClose,
  onSave,
  monitoring
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MonitoringParameter>({ 
    defaultValues: monitoring || {
      parameter: '',
      frequency: '',
      targetValue: '',
      notes: ''}
    }

  useEffect(() => {
    if (monitoring) {
      reset(monitoring);
    } else {
      reset({ 
        parameter: '',
        frequency: '',
        targetValue: '',
        notes: ''}
      });
    }
  }, [monitoring, reset]);

  const handleSave = (data: MonitoringParameter) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {monitoring ? 'Edit Monitoring Parameter' : 'Add Monitoring Parameter'}
      </DialogTitle>
      <DialogContent>
        <FixedGrid container spacing={2} className="">
          <FixedGrid item xs={12}>
            <Controller
              name="parameter"
              control={control}
              
              render={({  field  }) => (
                <Autocomplete
                  {...field}
                  options={MONITORING_PARAMETERS}
                  freeSolo
                  renderInput={(params) => (
                    <Input}
                      {...params}
                      label="Monitoring Parameter"
                      error={!!errors.parameter}
                      helperText={errors.parameter?.message}
                    />
                  )}
                  onChange={(_, value) => field.onChange(value || '')}
                />
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12}>
            <Controller
              name="frequency"
              control={control}
              
              render={({  field  }) => (
                <Autocomplete
                  {...field}
                  options={MONITORING_FREQUENCIES}
                  freeSolo
                  renderInput={(params) => (
                    <Input}
                      {...params}
                      label="Monitoring Frequency"
                      error={!!errors.frequency}
                      helperText={errors.frequency?.message}
                    />
                  )}
                  onChange={(_, value) => field.onChange(value || '')}
                />
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12}>
            <Controller
              name="targetValue"
              control={control}
              render={({  field  }) => (
                <Input
                  {...field}
                  fullWidth
                  label="Target Value (optional)"
                  placeholder="e.g., <140/90 mmHg, 7-9 mg/dL"
                />
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({  field  }) => (
                <Input
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes (optional)"
                  placeholder="Additional monitoring instructions or considerations..."
                />
              )}
            />
          </FixedGrid>
        </FixedGrid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button  onClick={handleSubmit(handleSave)}>
          Save Parameter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Goal Dialog Component
interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (goal: TherapyGoal) => void;
  goal?: TherapyGoal | null;
}

const GoalDialog: React.FC<GoalDialogProps> = ({ 
  open,
  onClose,
  onSave,
  goal
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TherapyGoal>({ 
    defaultValues: goal || {
      description: '',
      targetDate: undefined,
      achieved: false,
      achievedDate: undefined}
    }

  useEffect(() => {
    if (goal) {
      reset({ 
        ...goal,
        targetDate: goal.targetDate ? goal.targetDate.toString() : undefined,
        achievedDate: goal.achievedDate
          ? goal.achievedDate.toString()
          : undefined}
      });
    } else {
      reset({ 
        description: '',
        targetDate: undefined,
        achieved: false,
        achievedDate: undefined}
      });
    }
  }, [goal, reset]);

  const handleSave = (data: TherapyGoal) => {
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {goal ? 'Edit Therapy Goal' : 'Add Therapy Goal'}
      </DialogTitle>
      <DialogContent>
        <FixedGrid container spacing={2} className="">
          <FixedGrid item xs={12}>
            <Controller
              name="description"
              control={control}
              
              render={({  field  }) => (
                <Input
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Goal Description"
                  placeholder="Describe the specific, measurable therapy goal..."
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12} md={6}>
            <Controller
              name="targetDate"
              control={control}
              render={({  field  }) => (
                <DatePicker
                  label="Target Date (optional)"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) =>
                    field.onChange(date?.toISOString().split('T')[0])}
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,}
                    },
                />
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12} md={6}>
            <Controller
              name="achieved"
              control={control}
              render={({  field  }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Goal Achieved"
                />
              )}
            />
          </FixedGrid>

          <FixedGrid item xs={12}>
            <Controller
              name="achievedDate"
              control={control}
              render={({  field  }) => (
                <DatePicker
                  label="Achievement Date (if achieved)"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) =>
                    field.onChange(date?.toISOString().split('T')[0])}
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,}
                    },
                />
              )}
            />
          </FixedGrid>
        </FixedGrid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button  onClick={handleSubmit(handleSave)}>
          Save Goal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanDevelopment;
