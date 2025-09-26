import { Button, Input, Label, Card, CardContent, Select, Spinner, Alert, Switch } from '@/components/ui/button';
// Validation functions
const validateForm = (data: ClinicalNoteFormData) => {
  const errors: any = {};
  if (!data.patient) {
    errors.patient = { message: 'Patient is required' };
  }
  if (!data.title || data.title.trim().length < 3) {
    errors.title = {
      message: 'Title is required and must be at least 3 characters',
    };
  }
  if (!data.type) {
    errors.type = { message: 'Note type is required' };
  }
  // Check if at least one content section is filled
  const hasContent =
    data.content &&
    (data.content.subjective?.trim() ||
      data.content.objective?.trim() ||
      data.content.assessment?.trim() ||
      data.content.plan?.trim());
  if (!hasContent) {
    errors.content = { message: 'At least one content section is required' };
  }
  return errors;
};
interface SimpleClinicalNoteFormProps {
  noteId?: string;
  patientId?: string;
  onSave?: (note: any) => void;
  onCancel?: () => void;
  readonly?: boolean;
}
const SimpleClinicalNoteForm: React.FC<SimpleClinicalNoteFormProps> = ({ 
  noteId,
  patientId,
  onSave,
  onCancel,
  readonly = false
}) => {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isDirty },
    setError,
    clearErrors,
  } = useForm<ClinicalNoteFormData>({ 
    defaultValues: {
      patient: patientId || '',
      type: 'consultation',
      title: '',
      content: {
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''}
      },
      priority: 'medium',
      isConfidential: false,
      followUpRequired: false,
    },
    mode: 'onChange'}
  // Custom validation
  const [isValid, setIsValid] = useState(false);
  const watchedValues = watch();
  const followUpRequired = watch('followUpRequired');
  // Validate form on change
  useEffect(() => {
    const formData = getValues();
    const validationErrors = validateForm(formData);
    const hasErrors = Object.keys(validationErrors).length > 0;
    setIsValid(!hasErrors);
    // Clear existing errors
    clearErrors();
    // Set new errors
    Object.entries(validationErrors).forEach(
      ([field, error]: [string, any]) => {
        setError(field as any, error);
      }
    );
  }, [watchedValues, getValues, setError, clearErrors]);
  // Handle form submission
  const onSubmit = async (data: ClinicalNoteFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Form submitted:', data);
      onSave?.(data);
    } catch (error) {
      setSubmitError('Failed to save note. Please try again.');
      console.error('Failed to save note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div component="form" onSubmit={handleSubmit(onSubmit)}>
      {/* Header */}
      <div
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <div  component="h1">
          {noteId ? 'Edit Clinical Note' : 'Create Clinical Note'}
        </div>
        <div display="flex" alignItems="center" gap={2}>
          <Button
            
            onClick={onCancel}
            startIcon={<CancelIcon />}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {!readonly && (
            <Button
              type="submit"
              
              startIcon={<SaveIcon />}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner size={16} className="" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          )}
        </div>
      </div>
      {/* Error Display */}
      {submitError && (
        <Alert severity="error" className="">
          {submitError}
        </Alert>
      )}
      <div container spacing={3}>
        {/* Basic Information Section */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                Basic Information
              </div>
              <div container spacing={2}>
                {/* Patient ID (simplified) */}
                <div item xs={12} md={6}>
                  <Controller
                    name="patient"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        label="Patient ID *"
                        fullWidth
                        error={!!errors.patient}
                        helperText={errors.patient?.message}
                        disabled={readonly}
                        placeholder="Enter patient ID"
                      />
                    )}
                  />
                </div>
                {/* Note Title */}
                <div item xs={12} md={6}>
                  <Controller
                    name="title"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        label="Note Title *"
                        fullWidth
                        error={!!errors.title}
                        helperText={errors.title?.message}
                        disabled={readonly}
                      />
                    )}
                  />
                </div>
                {/* Note Type */}
                <div item xs={12} md={4}>
                  <Controller
                    name="type"
                    control={control}
                    render={({  field  }) => (
                      <div fullWidth error={!!errors.type}>
                        <Label>Note Type *</Label>
                        <Select
                          {...field}
                          label="Note Type *"
                          disabled={readonly}
                        >
                          {NOTE_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.type && (
                          <p>{errors.type.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                {/* Priority */}
                <div item xs={12} md={4}>
                  <Controller
                    name="priority"
                    control={control}
                    render={({  field  }) => (
                      <div fullWidth>
                        <Label>Priority</Label>
                        <Select {...field} label="Priority" disabled={readonly}>
                          {NOTE_PRIORITIES.map((priority) => (
                            <MenuItem
                              key={priority.value}
                              value={priority.value}
                            >
                              <div display="flex" alignItems="center" gap={1}>
                                <div
                                  width={12}
                                  height={12}
                                  borderRadius="50%"
                                  bgcolor={priority.color}
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
                {/* Confidential */}
                <div item xs={12} md={4}>
                  <Controller
                    name="isConfidential"
                    control={control}
                    render={({  field  }) => (
                      <FormControlLabel
                        control={
                          <Switch}
                            {...field}
                            checked={field.value}
                            disabled={readonly}
                          />
                        }
                        label="Confidential Note"
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* SOAP Content Section */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div  gutterBottom>
                SOAP Note Content
              </div>
              {errors.content && (
                <Alert severity="error" className="">
                  {errors.content.message}
                </Alert>
              )}
              <div container spacing={3}>
                {/* Subjective */}
                <div item xs={12} md={6}>
                  <div  gutterBottom>
                    Subjective
                  </div>
                  <Controller
                    name="content.subjective"
                    control={control}
                    render={({  field  }) => (
                      <TextareaAutosize
                        {...field}
                        minRows={4}
                        maxRows={8}
                        placeholder="Patient's subjective complaints, symptoms, and history..."
                        
                        disabled={readonly}
                      />
                    )}
                  />
                </div>
                {/* Objective */}
                <div item xs={12} md={6}>
                  <div  gutterBottom>
                    Objective
                  </div>
                  <Controller
                    name="content.objective"
                    control={control}
                    render={({  field  }) => (
                      <TextareaAutosize
                        {...field}
                        minRows={4}
                        maxRows={8}
                        placeholder="Observable findings, vital signs, physical examination..."
                        
                        disabled={readonly}
                      />
                    )}
                  />
                </div>
                {/* Assessment */}
                <div item xs={12} md={6}>
                  <div  gutterBottom>
                    Assessment
                  </div>
                  <Controller
                    name="content.assessment"
                    control={control}
                    render={({  field  }) => (
                      <TextareaAutosize
                        {...field}
                        minRows={4}
                        maxRows={8}
                        placeholder="Clinical assessment, diagnosis, and professional judgment..."
                        
                        disabled={readonly}
                      />
                    )}
                  />
                </div>
                {/* Plan */}
                <div item xs={12} md={6}>
                  <div  gutterBottom>
                    Plan
                  </div>
                  <Controller
                    name="content.plan"
                    control={control}
                    render={({  field  }) => (
                      <TextareaAutosize
                        {...field}
                        minRows={4}
                        maxRows={8}
                        placeholder="Treatment plan, interventions, and follow-up instructions..."
                        
                        disabled={readonly}
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Follow-up Section */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div container spacing={2} alignItems="center">
                <div item xs={12}>
                  <Controller
                    name="followUpRequired"
                    control={control}
                    render={({  field  }) => (
                      <FormControlLabel
                        control={
                          <Switch}
                            {...field}
                            checked={field.value}
                            disabled={readonly}
                          />
                        }
                        label="Follow-up Required"
                      />
                    )}
                  />
                </div>
                {followUpRequired && (
                  <div item xs={12}>
                    <Alert severity="info">
                      Follow-up scheduling will be available after saving the
                      note.
                    </Alert>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default SimpleClinicalNoteForm;
