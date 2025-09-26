import { Button, Input, Label, Card, CardContent, Select, Tooltip, Alert, Separator } from '@/components/ui/button';
// Common symptoms for quick selection
const COMMON_SYMPTOMS = {
  subjective: [
    'Headache',
    'Nausea',
    'Vomiting',
    'Dizziness',
    'Fatigue',
    'Chest pain',
    'Shortness of breath',
    'Abdominal pain',
    'Back pain',
    'Joint pain',
    'Muscle aches',
    'Fever',
    'Chills',
    'Cough',
    'Sore throat',
    'Runny nose',
    'Congestion',
    'Loss of appetite',
    'Weight loss',
    'Weight gain',
    'Sleep problems',
    'Anxiety',
    'Depression',
    'Confusion',
    'Memory problems',
  ],
  objective: [
    'Elevated temperature',
    'High blood pressure',
    'Low blood pressure',
    'Rapid heart rate',
    'Slow heart rate',
    'Irregular heart rate',
    'Rapid breathing',
    'Shallow breathing',
    'Wheezing',
    'Rales/crackles',
    'Decreased breath sounds',
    'Swelling (edema)',
    'Skin rash',
    'Pale skin',
    'Jaundice',
    'Cyanosis',
    'Dehydration',
    'Enlarged lymph nodes',
    'Abdominal distension',
    'Tenderness',
    'Muscle weakness',
    'Tremor',
    'Altered mental status',
    'Decreased mobility',
  ],
};
const DURATION_OPTIONS = [
  'Less than 1 hour',
  '1-6 hours',
  '6-24 hours',
  '1-3 days',
  '3-7 days',
  '1-2 weeks',
  '2-4 weeks',
  '1-3 months',
  '3-6 months',
  'More than 6 months',
];
const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild', color: 'success' as const },
  { value: 'moderate', label: 'Moderate', color: 'warning' as const },
  { value: 'severe', label: 'Severe', color: 'error' as const },
];
const ONSET_OPTIONS = [
  {
    value: 'acute',
    label: 'Acute (sudden)',
    description: 'Symptoms started suddenly',
  },
  {
    value: 'subacute',
    label: 'Subacute (gradual)',
    description: 'Symptoms developed gradually over days',
  },
  {
    value: 'chronic',
    label: 'Chronic (long-term)',
    description: 'Long-standing symptoms',
  },
];
interface SymptomFormData {
  subjective: string[];
  objective: string[];
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset: 'acute' | 'chronic' | 'subacute';
  newSubjective: string;
  newObjective: string;
}
const SymptomInput: React.FC<SymptomInputProps> = ({ 
  value,
  onChange,
  error,
  disabled = false
}) => {
  const [showCommonSymptoms, setShowCommonSymptoms] = useState(false);
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SymptomFormData>({ 
    defaultValues: {
      subjective: value?.subjective || [],
      objective: value?.objective || [],
      duration: value?.duration || '',
      severity: value?.severity || 'mild',
      onset: value?.onset || 'acute',
      newSubjective: '',
      newObjective: ''}
    }
  const watchedValues = watch();
  // Update parent component when form values change
    const { newSubjective, newObjective, ...symptomData } = watchedValues;
    onChange(symptomData);
  }, [watchedValues, onChange]);
  const handleAddSubjective = useCallback(() => {
    const newSymptom = watchedValues.newSubjective.trim();
    if (newSymptom && !watchedValues.subjective.includes(newSymptom)) {
      const updated = [...watchedValues.subjective, newSymptom];
      setValue('subjective', updated);
      setValue('newSubjective', '');
    }
  }, [watchedValues.newSubjective, watchedValues.subjective, setValue]);
  const handleAddObjective = useCallback(() => {
    const newSymptom = watchedValues.newObjective.trim();
    if (newSymptom && !watchedValues.objective.includes(newSymptom)) {
      const updated = [...watchedValues.objective, newSymptom];
      setValue('objective', updated);
      setValue('newObjective', '');
    }
  }, [watchedValues.newObjective, watchedValues.objective, setValue]);
  const handleRemoveSubjective = useCallback(
    (symptom: string) => {
      const updated = watchedValues.subjective.filter((s) => s !== symptom);
      setValue('subjective', updated);
    },
    [watchedValues.subjective, setValue]
  );
  const handleRemoveObjective = useCallback(
    (symptom: string) => {
      const updated = watchedValues.objective.filter((s) => s !== symptom);
      setValue('objective', updated);
    },
    [watchedValues.objective, setValue]
  );
  const handleQuickAddSymptom = useCallback(
    (symptom: string, type: 'subjective' | 'objective') => {
      const currentSymptoms = watchedValues[type];
      if (!currentSymptoms.includes(symptom)) {
        const updated = [...currentSymptoms, symptom];
        setValue(type, updated);
      }
    },
    [watchedValues, setValue]
  );
  const getSeverityColor = (severity: string) => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.color || 'default';
  };
  return (
    <Card>
      <CardContent>
        <div className="">
          <div  className="">
            Symptom Assessment
          </div>
          <div  color="text.secondary">
            Document patient-reported symptoms and clinical observations
          </div>
        </div>
        {error && (
          <Alert severity="error" className="">
            {error}
          </Alert>
        )}
        <div spacing={4}>
          {/* Subjective Symptoms */}
          <div>
            <div className="">
              <div  className="">
                Subjective Symptoms
              </div>
              <Tooltip title="Symptoms reported by the patient">
                <InfoIcon
                  className=""
                />
              </Tooltip>
            </div>
            {/* Current subjective symptoms */}
            {watchedValues.subjective.length > 0 && (
              <div className="">
                <div
                  direction="row"
                  spacing={1}
                  className=""
                >
                  {watchedValues.subjective.map((symptom) => (
                    <Chip
                      key={symptom}
                      label={symptom}
                      onDelete={
                        disabled
                          ? undefined
                          : () => handleRemoveSubjective(symptom)}
                      }
                      color="primary"
                      
                      size="small"
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Add new subjective symptom */}
            <div className="">
              <Controller
                name="newSubjective"
                control={control}
                render={({  field  }) => (
                  <Input
                    {...field}
                    size="small"
                    placeholder="Add subjective symptom..."
                    disabled={disabled}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubjective();}
                      }
                    className=""
                  />
                )}
              />
              <Button
                
                size="small"
                onClick={handleAddSubjective}
                disabled={disabled || !watchedValues.newSubjective.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </div>
            {/* Common subjective symptoms */}
            <div>
              <Button
                
                size="small"
                onClick={() => setShowCommonSymptoms(!showCommonSymptoms)}
                disabled={disabled}
              >
                {showCommonSymptoms ? 'Hide' : 'Show'} Common Symptoms
              </Button>
              {showCommonSymptoms && (
                <div className="">
                  <div
                    
                    color="text.secondary"
                    className=""
                  >
                    Click to add common subjective symptoms:
                  </div>
                  <div
                    direction="row"
                    spacing={0.5}
                    className=""
                  >
                    {COMMON_SYMPTOMS.subjective.map((symptom) => (
                      <Chip
                        key={symptom}
                        label={symptom}
                        size="small"
                        onClick={() =>
                          handleQuickAddSymptom(symptom, 'subjective')}
                        }
                        disabled={
                          disabled || watchedValues.subjective.includes(symptom)}
                        }
                        className=""
                        
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Separator />
          {/* Objective Findings */}
          <div>
            <div className="">
              <div  className="">
                Objective Findings
              </div>
              <Tooltip title="Clinical observations and examination findings">
                <InfoIcon
                  className=""
                />
              </Tooltip>
            </div>
            {/* Current objective findings */}
            {watchedValues.objective.length > 0 && (
              <div className="">
                <div
                  direction="row"
                  spacing={1}
                  className=""
                >
                  {watchedValues.objective.map((finding) => (
                    <Chip
                      key={finding}
                      label={finding}
                      onDelete={
                        disabled
                          ? undefined
                          : () => handleRemoveObjective(finding)}
                      }
                      color="secondary"
                      
                      size="small"
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Add new objective finding */}
            <div className="">
              <Controller
                name="newObjective"
                control={control}
                render={({  field  }) => (
                  <Input
                    {...field}
                    size="small"
                    placeholder="Add objective finding..."
                    disabled={disabled}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddObjective();}
                      }
                    className=""
                  />
                )}
              />
              <Button
                
                size="small"
                onClick={handleAddObjective}
                disabled={disabled || !watchedValues.newObjective.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </div>
            {/* Common objective findings */}
            <div className="">
              <div
                
                color="text.secondary"
                className=""
              >
                Click to add common objective findings:
              </div>
              <div
                direction="row"
                spacing={0.5}
                className=""
              >
                {COMMON_SYMPTOMS.objective.map((finding) => (
                  <Chip
                    key={finding}
                    label={finding}
                    size="small"
                    onClick={() => handleQuickAddSymptom(finding, 'objective')}
                    disabled={
                      disabled || watchedValues.objective.includes(finding)}
                    }
                    className=""
                    
                  />
                ))}
              </div>
            </div>
          </div>
          <Separator />
          {/* Symptom Characteristics */}
          <div>
            <div  className="">
              Symptom Characteristics
            </div>
            <div
              className="">
              {/* Duration */}
              <div>
                <Controller
                  name="duration"
                  control={control}
                  
                  render={({  field  }) => (
                    <div fullWidth error={!!errors.duration}>
                      <Label>Duration</Label>
                      <Select {...field} label="Duration" disabled={disabled}>
                        {DURATION_OPTIONS.map((duration) => (
                          <MenuItem key={duration} value={duration}>
                            {duration}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.duration && (
                        <p>
                          {errors.duration.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
              {/* Severity */}
              <div>
                <Controller
                  name="severity"
                  control={control}
                  render={({  field  }) => (
                    <div fullWidth>
                      <Label>Severity</Label>
                      <Select {...field} label="Severity" disabled={disabled}>
                        {SEVERITY_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <div className="">
                              <Chip
                                label={option.label}
                                size="small"
                                color={option.color}
                                
                                className=""
                              />
                            </div>
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                  )}
                />
              </div>
              {/* Onset */}
              <div>
                <Controller
                  name="onset"
                  control={control}
                  render={({  field  }) => (
                    <div fullWidth>
                      <Label>Onset</Label>
                      <Select {...field} label="Onset" disabled={disabled}>
                        {ONSET_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <div>
                              <div >
                                {option.label}
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {option.description}
                              </div>
                            </div>
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
          {/* Validation Summary */}
          {watchedValues.subjective.length === 0 &&
            watchedValues.objective.length === 0 && (
              <Alert severity="warning" icon={<WarningIcon />}>
                <div >
                  Please add at least one subjective symptom or objective
                  finding to proceed with the assessment.
                </div>
              </Alert>
            )}
          {/* Summary */}
          {(watchedValues.subjective.length > 0 ||
            watchedValues.objective.length > 0) && (
            <Alert severity="info">
              <div  className="">
                Assessment Summary:
              </div>
              <div >
                {watchedValues.subjective.length} subjective symptom(s),{' '}
                {watchedValues.objective.length} objective finding(s)
                {watchedValues.duration &&
                  ` • Duration: ${watchedValues.duration}`}
                {watchedValues.severity && (
                  <>
                    {' • Severity: '}
                    <Chip
                      label={
                        SEVERITY_OPTIONS.find(
                          (opt) => opt.value === watchedValues.severity
                        )?.label}
                      }
                      size="small"
                      color={getSeverityColor(watchedValues.severity)}
                      
                      className=""
                    />
                  </>
                )}
                {watchedValues.onset &&
                  ` • Onset: ${ONSET_OPTIONS.find((opt) => opt.value === watchedValues.onset)?.label}`}
              </div>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export default SymptomInput;
