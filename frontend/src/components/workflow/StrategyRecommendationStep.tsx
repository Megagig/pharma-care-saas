import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner } from '@/components/ui/button';
// ===============================
// TYPES AND INTERFACES
// ===============================
interface StrategyFormData {
  type: InterventionStrategy['type'];
  description: string;
  rationale: string;
  expectedOutcome: string;
  priority: InterventionStrategy['priority'];
}
interface StrategyRecommendationData {
  strategies: StrategyFormData[];
}
interface StrategyRecommendationStepProps {
  onNext: (data: StrategyRecommendationData) => void;
  onBack?: () => void;
  onCancel?: () => void;
  initialData?: {
    category: ClinicalIntervention['category'];
    strategies?: StrategyFormData[];
  };
  isLoading?: boolean;
}
// ===============================
// CONSTANTS
// ===============================
const STRATEGY_TYPES = {
  medication_review: {
    label: 'Medication Review',
    description: 'Comprehensive review of patient medications',
    icon: '📋',
    color: '#2196f3',
    defaultRationale:
      'Systematic evaluation of all medications to identify potential issues',
    defaultOutcome:
      'Optimized medication regimen with improved safety and efficacy',
  },
  dose_adjustment: {
    label: 'Dose Adjustment',
    description: 'Modify medication dosage or frequency',
    icon: '⚖️',
    color: '#4caf50',
    defaultRationale:
      'Current dosing may not be optimal for patient condition or response',
    defaultOutcome:
      'Improved therapeutic response with reduced adverse effects',
  },
  alternative_therapy: {
    label: 'Alternative Therapy',
    description: 'Switch to different medication or treatment',
    icon: '🔄',
    color: '#ff9800',
    defaultRationale:
      'Current therapy is not suitable or effective for this patient',
    defaultOutcome: 'Better tolerated and more effective treatment option',
  },
  discontinuation: {
    label: 'Discontinuation',
    description: 'Stop problematic medication',
    icon: '🛑',
    color: '#f44336',
    defaultRationale: 'Medication is causing harm or no longer indicated',
    defaultOutcome:
      'Elimination of adverse effects and improved patient safety',
  },
  additional_monitoring: {
    label: 'Additional Monitoring',
    description: 'Increase monitoring frequency or parameters',
    icon: '📊',
    color: '#9c27b0',
    defaultRationale:
      'Enhanced monitoring needed to ensure safety and efficacy',
    defaultOutcome: 'Early detection and prevention of potential complications',
  },
  patient_counseling: {
    label: 'Patient Counseling',
    description: 'Educate patient about medication use',
    icon: '👥',
    color: '#00bcd4',
    defaultRationale:
      'Patient education needed to improve understanding and adherence',
    defaultOutcome: 'Improved medication adherence and patient outcomes',
  },
  physician_consultation: {
    label: 'Physician Consultation',
    description: 'Consult with prescribing physician',
    icon: '🩺',
    color: '#795548',
    defaultRationale: 'Physician input needed for optimal patient management',
    defaultOutcome:
      'Collaborative care approach with improved clinical decisions',
  },
  custom: {
    label: 'Custom Strategy',
    description: 'Custom intervention approach',
    icon: '✏️',
    color: '#607d8b',
    defaultRationale: 'Unique intervention approach tailored to patient needs',
    defaultOutcome:
      'Customized solution addressing specific patient requirements',
  },
} as const;
const CATEGORY_STRATEGY_MAPPING = {
  drug_therapy_problem: [
    'medication_review',
    'dose_adjustment',
    'alternative_therapy',
    'discontinuation',
    'additional_monitoring',
  ],
  adverse_drug_reaction: [
    'discontinuation',
    'dose_adjustment',
    'alternative_therapy',
    'additional_monitoring',
    'patient_counseling',
  ],
  medication_nonadherence: [
    'patient_counseling',
    'medication_review',
    'alternative_therapy',
    'additional_monitoring',
  ],
  drug_interaction: [
    'medication_review',
    'dose_adjustment',
    'alternative_therapy',
    'discontinuation',
    'additional_monitoring',
  ],
  dosing_issue: [
    'dose_adjustment',
    'medication_review',
    'additional_monitoring',
    'patient_counseling',
  ],
  contraindication: [
    'discontinuation',
    'alternative_therapy',
    'physician_consultation',
    'additional_monitoring',
  ],
  other: [
    'custom',
    'medication_review',
    'patient_counseling',
    'physician_consultation',
  ],
};
// ===============================
// MAIN COMPONENT
// ===============================
const StrategyRecommendationStep: React.FC<StrategyRecommendationStepProps> = ({ 
  onNext,
  onBack,
  onCancel,
  initialData,
  isLoading = false
}) => {
  // State
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [selectedRecommendations, setSelectedRecommendations] = useState<
    string[]
  >([]);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);
  // Queries
  const { data: recommendationsData, isLoading: loadingRecommendations } =
    useStrategyRecommendations(initialData?.category || '');
  // Get recommended strategies for the category
  const recommendedStrategies = useMemo(() => {
    if (!initialData?.category) return [];
    return CATEGORY_STRATEGY_MAPPING[initialData.category] || [];
  }, [initialData?.category]);
  // Form setup
  const defaultValues: StrategyRecommendationData = useMemo(
    () => ({ 
      strategies: initialData?.strategies || [
        {
          type: 'medication_review',
          description: '',
          rationale: '',
          expectedOutcome: '',
          priority: 'primary'}
        },
      ], },
    [initialData?.strategies]
  );
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<StrategyRecommendationData>({ 
    defaultValues,
    mode: 'onChange'}
  });
  const { fields, append, remove, move } = useFieldArray({ 
    control,
    name: 'strategies'}
  });
  const watchedStrategies = watch('strategies');
  // ===============================
  // HANDLERS
  // ===============================
  const handleAddRecommendedStrategy = (strategyType: string) => {
    const strategyConfig =
      STRATEGY_TYPES[strategyType as keyof typeof STRATEGY_TYPES];
    if (!strategyConfig) return;
    append({ 
      type: strategyType as InterventionStrategy['type'],
      description: '',
      rationale: strategyConfig.defaultRationale,
      expectedOutcome: strategyConfig.defaultOutcome,
      priority: 'primary'}
    });
    setSelectedRecommendations((prev) => [...prev, strategyType]);
  };
  const handleAddCustomStrategy = () => {
    append({ 
      type: 'custom',
      description: '',
      rationale: '',
      expectedOutcome: '',
      priority: 'secondary'}
    });
  };
  const handleRemoveStrategy = (index: number) => {
    const strategy = watchedStrategies[index];
    if (strategy) {
      setSelectedRecommendations((prev) =>
        prev.filter((type) => type !== strategy.type)
      );
    }
    remove(index);
  };
  const handleStrategyTypeChange = (index: number, newType: string) => {
    const strategyConfig =
      STRATEGY_TYPES[newType as keyof typeof STRATEGY_TYPES];
    if (!strategyConfig) return;
    setValue(
      `strategies.${index}.type`,
      newType as InterventionStrategy['type']
    );
    setValue(`strategies.${index}.rationale`, strategyConfig.defaultRationale);
    setValue(
      `strategies.${index}.expectedOutcome`,
      strategyConfig.defaultOutcome
    );
  };
  const handleMoveStrategy = (fromIndex: number, toIndex: number) => {
    move(fromIndex, toIndex);
  };
  const onSubmit = (data: StrategyRecommendationData) => {
    onNext(data);
  };
  // ===============================
  // RENDER HELPERS
  // ===============================
  const renderRecommendations = () => {
    if (!showRecommendations) return null;
    return (
      <Card className="">
        <CardContent>
          <div
            className=""
          >
            <div
              
              className=""
            >
              <LightbulbIcon color="primary" />
              Recommended Strategies
            </div>
            <Button size="small" onClick={() => setShowRecommendations(false)}>
              Hide Recommendations
            </Button>
          </div>
          <div  color="text.secondary" className="">
            Based on the selected category, these strategies are commonly
            effective:
          </div>
          {loadingRecommendations ? (
            <div className="">
              <Spinner size={24} />
            </div>
          ) : (
            <div container spacing={2}>
              {recommendedStrategies.map((strategyType) => {
                const config =
                  STRATEGY_TYPES[strategyType as keyof typeof STRATEGY_TYPES];
                const isSelected =
                  selectedRecommendations.includes(strategyType);
                return (
                  <div item xs={12} sm={6} md={4} key={strategyType}>
                    <div
                      className=""10`
                          : 'background.paper',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: config.color,
                          bgcolor: `${config.color}05`,
                        },
                      onClick={() =>
                        !isSelected &&
                        handleAddRecommendedStrategy(strategyType)}
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
                      <div
                        className=""
                      >
                        <Chip
                          size="small"
                          label={isSelected ? 'Added' : 'Add'}
                          color={isSelected ? 'success' : 'primary'}
                          variant={isSelected ? 'filled' : 'outlined'}
                          icon={isSelected ? <CheckCircleIcon /> : <AddIcon />}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="">
            <Button
              
              startIcon={<AddIcon />}
              onClick={handleAddCustomStrategy}
            >
              Add Custom Strategy
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderStrategyForm = (index: number) => {
    const strategy = watchedStrategies[index];
    if (!strategy) return null;
    const strategyConfig = STRATEGY_TYPES[strategy.type];
    const isExpanded = expandedStrategy === index;
    return (
      <Card
        key={index}
        className=""
      >
        <CardContent>
          <div
            className=""
          >
            <div className="">
              <IconButton size="small" className="">
                <DragIcon />
              </IconButton>
              <div  component="span">
                {strategyConfig?.icon}
              </div>
              <div  fontWeight="medium">
                Strategy {index + 1}
              </div>
              <Chip
                size="small"
                label={strategy.priority}
                color={strategy.priority === 'primary' ? 'primary' : 'default'}
              />
            </div>
            <div>
              <IconButton
                size="small"
                onClick={() => setExpandedStrategy(isExpanded ? null : index)}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleRemoveStrategy(index)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </div>
          </div>
          <div container spacing={2}>
            <div item xs={12} md={6}>
              <Controller
                name={`strategies.${index}.type`}
                control={control}
                
                render={({  field  }) => (
                  <div
                    fullWidth
                    error={!!errors.strategies?.[index]?.type}
                  >
                    <Label>Strategy Type</Label>
                    <Select
                      {...field}
                      label="Strategy Type"
                      >
                      {Object.entries(STRATEGY_TYPES).map(([value, config]) => (
                        <MenuItem key={value} value={value}>
                          <div
                            className=""
                          >
                            <div >
                              {config.icon}
                            </div>
                            <div>
                              <div >
                                {config.label}
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.strategies?.[index]?.type && (
                      <p>
                        {errors.strategies[index]?.type?.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
            <div item xs={12} md={6}>
              <Controller
                name={`strategies.${index}.priority`}
                control={control}
                render={({  field  }) => (
                  <div fullWidth>
                    <Label>Priority</Label>
                    <Select {...field} label="Priority">
                      <MenuItem value="primary">Primary Strategy</MenuItem>
                      <MenuItem value="secondary">Secondary Strategy</MenuItem>
                    </Select>
                  </div>
                )}
              />
            </div>
            <div item xs={12}>
              <Controller
                name={`strategies.${index}.description`}
                control={control}
                rules={{
                  required: 'Strategy description is required',
                  minLength: {
                    value: 10,
                    message: 'Description must be at least 10 characters',}
                  },
                render={({  field  }) => (
                  <Input
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label="Strategy Description"
                    placeholder="Describe the specific intervention strategy in detail..."
                    error={!!errors.strategies?.[index]?.description}
                    helperText={
                      errors.strategies?.[index]?.description?.message}
                    }
                  />
                )}
              />
            </div>
            <Collapse in={isExpanded} className="">
              <div container spacing={2} className="">
                <div item xs={12} md={6}>
                  <Controller
                    name={`strategies.${index}.rationale`}
                    control={control}
                    rules={{
                      required: 'Rationale is required',
                      maxLength: {
                        value: 500,
                        message: 'Rationale must not exceed 500 characters',}
                      },
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        multiline
                        rows={3}
                        label="Clinical Rationale"
                        placeholder="Why is this strategy appropriate for this patient?"
                        error={!!errors.strategies?.[index]?.rationale}
                        helperText={
                          errors.strategies?.[index]?.rationale?.message ||}
                          `${field.value?.length || 0}/500 characters`
                        }
                      />
                    )}
                  />
                </div>
                <div item xs={12} md={6}>
                  <Controller
                    name={`strategies.${index}.expectedOutcome`}
                    control={control}
                    rules={{
                      required: 'Expected outcome is required',
                      minLength: {
                        value: 20,
                        message:
                          'Expected outcome must be at least 20 characters',}
                      },
                      maxLength: {
                        value: 500,
                        message:
                          'Expected outcome must not exceed 500 characters',
                      },
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        multiline
                        rows={3}
                        label="Expected Outcome"
                        placeholder="What outcome do you expect from this strategy?"
                        error={!!errors.strategies?.[index]?.expectedOutcome}
                        helperText={
                          errors.strategies?.[index]?.expectedOutcome
                            ?.message ||}
                          `${field.value?.length || 0}/500 characters`
                        }
                      />
                    )}
                  />
                </div>
              </div>
            </Collapse>
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderStrategiesList = () => (
    <Card className="">
      <CardContent>
        <div
          className=""
        >
          <div >Intervention Strategies</div>
          <div>
            <Button
              size="small"
              startIcon={<PreviewIcon />}
              onClick={() => setShowPreview(true)}
              className=""
            >
              Preview
            </Button>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddCustomStrategy}
              
            >
              Add Strategy
            </Button>
          </div>
        </div>
        {fields.length === 0 ? (
          <div className="">
            <InfoIcon color="disabled" className="" />
            <div  color="text.secondary">
              No strategies added yet
            </div>
            <div  color="text.secondary">
              Add strategies from recommendations or create custom ones
            </div>
          </div>
        ) : (
          <div>{fields.map((field, index) => renderStrategyForm(index))}</div>
        )}
      </CardContent>
    </Card>
  );
  const renderPreviewDialog = () => (
    <Dialog
      open={showPreview}
      onClose={() => setShowPreview(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Strategy Preview</DialogTitle>
      <DialogContent>
        <div  color="text.secondary" className="">
          Review your intervention strategies before proceeding
        </div>
        {watchedStrategies.map((strategy, index) => {
          const config = STRATEGY_TYPES[strategy.type];
          return (
            <Card key={index} className="">
              <CardContent>
                <div
                  className=""
                >
                  <div  component="span">
                    {config.icon}
                  </div>
                  <div  fontWeight="medium">
                    {config.label}
                  </div>
                  <Chip
                    size="small"
                    label={strategy.priority}
                    color={
                      strategy.priority === 'primary' ? 'primary' : 'default'}
                    }
                  />
                </div>
                <div  className="">
                  <strong>Description:</strong>{' '}
                  {strategy.description || 'Not specified'}
                </div>
                <div  className="">
                  <strong>Rationale:</strong>{' '}
                  {strategy.rationale || 'Not specified'}
                </div>
                <div >
                  <strong>Expected Outcome:</strong>{' '}
                  {strategy.expectedOutcome || 'Not specified'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowPreview(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
  return (
    <div>
      <div  gutterBottom>
        Step 2: Strategy Recommendation
      </div>
      <div  color="text.secondary" className="">
        Select and customize intervention strategies based on the clinical issue
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {renderRecommendations()}
        {renderStrategiesList()}
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
          <Button
            type="submit"
            
            disabled={!isValid || fields.length === 0 || isLoading}
            startIcon={isLoading ? <Spinner size={20} /> : null}
          >
            {isLoading ? 'Processing...' : 'Next: Team Collaboration'}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default StrategyRecommendationStep;
