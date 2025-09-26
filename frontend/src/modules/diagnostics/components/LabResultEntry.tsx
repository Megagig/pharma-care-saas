import { Button, Input, Label, Card, CardContent, Select, Alert, Separator } from '@/components/ui/button';
const INTERPRETATION_OPTIONS = [
  {
    value: 'normal',
    label: 'Normal',
    color: 'success' as const,
    icon: CheckCircleIcon,
    description: 'Within normal reference range',
  },
  {
    value: 'low',
    label: 'Low',
    color: 'warning' as const,
    icon: WarningIcon,
    description: 'Below normal reference range',
  },
  {
    value: 'high',
    label: 'High',
    color: 'warning' as const,
    icon: WarningIcon,
    description: 'Above normal reference range',
  },
  {
    value: 'critical',
    label: 'Critical',
    color: 'error' as const,
    icon: ErrorIcon,
    description: 'Critically abnormal - requires immediate attention',
  },
  {
    value: 'abnormal',
    label: 'Abnormal',
    color: 'warning' as const,
    icon: WarningIcon,
    description: 'Abnormal but not critical',
  },
];
const COMMON_FLAGS = [
  'H', // High
  'L', // Low
  'HH', // Critical High
  'LL', // Critical Low
  'A', // Abnormal
  'AA', // Critical Abnormal
  'R', // Repeat
  'D', // Delta check
  'I', // Interference
  'N', // Normal
];
const COMMON_UNITS = [
  'mg/dL',
  'g/dL',
  'mmol/L',
  'mEq/L',
  'U/L',
  'IU/L',
  'ng/mL',
  'pg/mL',
  'μg/dL',
  'μg/mL',
  'cells/μL',
  'x10³/μL',
  'x10⁶/μL',
  '%',
  'ratio',
  'index',
  'seconds',
  'minutes',
  'hours',
  'days',
];
interface LabResultFormData {
  patientId: string;
  orderId?: string;
  testCode: string;
  testName: string;
  value: string;
  unit?: string;
  referenceRange: {
    low?: number;
    high?: number;
    text?: string;
  };
  interpretation?: 'low' | 'normal' | 'high' | 'critical' | 'abnormal';
  flags?: string[];
  performedAt: string;
  loincCode?: string;
  comments?: string;
}
const LabResultEntry: React.FC<LabResultEntryProps> = ({ 
  orderId,
  patientId,
  onSubmit,
  loading = false,
  error
}) => {
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [customFlag, setCustomFlag] = useState('');
  const { orders, getOrdersByPatient } = useLabStore();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<LabResultFormData>({ 
    defaultValues: {
      patientId,
      orderId: orderId || '',
      testCode: '',
      testName: '',
      value: '',
      unit: '',
      referenceRange: {
        low: undefined,
        high: undefined,
        text: ''}
      },
      interpretation: undefined,
      flags: [],
      performedAt: new Date().toISOString().split('T')[0],
      loincCode: '',
      comments: '',
    },
    mode: 'onChange'}
  const watchedValues = watch();
  const patientOrders = getOrdersByPatient(patientId);
  // Auto-interpret result based on reference range
  const autoInterpretResult = useCallback(
    (value: string, referenceRange: any) => {
      if (!value || !referenceRange) return undefined;
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) return undefined;
      const { low, high } = referenceRange;
      if (low !== undefined && high !== undefined) {
        if (numericValue < low) {
          return numericValue < low * 0.5 ? 'critical' : 'low';
        }
        if (numericValue > high) {
          return numericValue > high * 2 ? 'critical' : 'high';
        }
        return 'normal';
      }
      return undefined;
    },
    []
  );
  // Update interpretation when value or reference range changes
    const interpretation = autoInterpretResult(
      watchedValues.value,
      watchedValues.referenceRange
    );
    if (interpretation && !watchedValues.interpretation) {
      setValue('interpretation', interpretation);
    }
  }, [
    watchedValues.value,
    watchedValues.referenceRange,
    autoInterpretResult,
    setValue,
    watchedValues.interpretation,
  ]);
  // Update flags when interpretation changes
    const newFlags: string[] = [];
    switch (watchedValues.interpretation) {
      case 'low':
        newFlags.push('L');
        break;
      case 'high':
        newFlags.push('H');
        break;
      case 'critical':
        if (
          watchedValues.referenceRange.low &&
          parseFloat(watchedValues.value) < watchedValues.referenceRange.low
        ) {
          newFlags.push('LL');
        } else if (
          watchedValues.referenceRange.high &&
          parseFloat(watchedValues.value) > watchedValues.referenceRange.high
        ) {
          newFlags.push('HH');
        } else {
          newFlags.push('AA');
        }
        break;
      case 'abnormal':
        newFlags.push('A');
        break;
      case 'normal':
        newFlags.push('N');
        break;
    }
    if (
      newFlags.length > 0 &&
      JSON.stringify(newFlags) !== JSON.stringify(selectedFlags)
    ) {
      setSelectedFlags(newFlags);
      setValue('flags', newFlags);
    }
  }, [
    watchedValues.interpretation,
    watchedValues.value,
    watchedValues.referenceRange,
    selectedFlags,
    setValue,
  ]);
  const handleAddFlag = useCallback(
    (flag: string) => {
      if (!selectedFlags.includes(flag)) {
        const newFlags = [...selectedFlags, flag];
        setSelectedFlags(newFlags);
        setValue('flags', newFlags);
      }
    },
    [selectedFlags, setValue]
  );
  const handleRemoveFlag = useCallback(
    (flag: string) => {
      const newFlags = selectedFlags.filter((f) => f !== flag);
      setSelectedFlags(newFlags);
      setValue('flags', newFlags);
    },
    [selectedFlags, setValue]
  );
  const handleAddCustomFlag = useCallback(() => {
    if (customFlag.trim() && !selectedFlags.includes(customFlag.trim())) {
      handleAddFlag(customFlag.trim().toUpperCase());
      setCustomFlag('');
    }
  }, [customFlag, selectedFlags, handleAddFlag]);
  const validateNumericValue = (value: string): string | true => {
    if (!value) return 'Result value is required';
    // Allow numeric values, ranges, and qualitative results
    const numericRegex = /^[0-9]*\.?[0-9]+$/;
    const rangeRegex = /^[0-9]*\.?[0-9]+\s*-\s*[0-9]*\.?[0-9]+$/;
    const qualitativeRegex =
      /^(positive|negative|detected|not detected|present|absent|reactive|non-reactive)$/i;
    if (
      numericRegex.test(value) ||
      rangeRegex.test(value) ||
      qualitativeRegex.test(value)
    ) {
      return true;
    }
    return 'Enter a valid numeric value, range, or qualitative result';
  };
  const validateReferenceRange = (range: any): string | true => {
    if (range.low !== undefined && range.high !== undefined) {
      if (range.low >= range.high) {
        return 'Low value must be less than high value';
      }
    }
    return true;
  };
  const getInterpretationIcon = (interpretation: string) => {
    const option = INTERPRETATION_OPTIONS.find(
      (opt) => opt.value === interpretation
    );
    return option?.icon || InfoIcon;
  };
  const getInterpretationColor = (interpretation: string) => {
    const option = INTERPRETATION_OPTIONS.find(
      (opt) => opt.value === interpretation
    );
    return option?.color || 'default';
  };
  const onFormSubmit = (data: LabResultFormData) => {
    const formattedData = {
      ...data,
      flags: selectedFlags,
      referenceRange: {
        low: data.referenceRange.low || undefined,
        high: data.referenceRange.high || undefined,
        text: data.referenceRange.text || undefined,
      },
    };
    onSubmit(formattedData);
  };
  return (
    <Card>
      <CardContent>
        <div className="">
          <div
            
            className=""
          >
            <ScienceIcon className="" />
            Lab Result Entry
          </div>
          <div  color="text.secondary">
            Enter laboratory test results with reference ranges and
            interpretation
          </div>
        </div>
        {error && (
          <Alert severity="error" className="">
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div spacing={4}>
            {/* Order Selection */}
            {patientOrders.length > 0 && (
              <div>
                <Controller
                  name="orderId"
                  control={control}
                  render={({  field  }) => (
                    <div fullWidth>
                      <Label>Associated Lab Order (Optional)</Label>
                      <Select
                        {...field}
                        label="Associated Lab Order (Optional)"
                        disabled={loading}
                      >
                        <MenuItem value="">
                          <em>No associated order</em>
                        </MenuItem>
                        {patientOrders.map((order) => (
                          <MenuItem key={order._id} value={order._id}>
                            <div>
                              <div >
                                Order #{order._id.slice(-6)} -{' '}
                                {new Date(order.orderDate).toLocaleDateString()}
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                {order.tests.map((t) => t.name).join(', ')}
                              </div>
                            </div>
                          </MenuItem>
                        ))}
                      </Select>
                    </div>
                  )}
                />
              </div>
            )}
            {/* Test Information */}
            <div>
              <div  className="">
                Test Information
              </div>
              <div container spacing={3}>
                <div item xs={12} md={6}>
                  <Controller
                    name="testCode"
                    control={control}
                    
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        label="Test Code"
                        placeholder="e.g., CBC, CMP, TSH"
                        error={!!errors.testCode}
                        helperText={errors.testCode?.message}
                        disabled={loading}
                      />
                    )}
                  />
                </div>
                <div item xs={12} md={6}>
                  <Controller
                    name="testName"
                    control={control}
                    
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        label="Test Name"
                        placeholder="e.g., Complete Blood Count"
                        error={!!errors.testName}
                        helperText={errors.testName?.message}
                        disabled={loading}
                      />
                    )}
                  />
                </div>
                <div item xs={12} md={6}>
                  <Controller
                    name="loincCode"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        label="LOINC Code (Optional)"
                        placeholder="e.g., 58410-2"
                        helperText="Logical Observation Identifiers Names and Codes"
                        disabled={loading}
                      />
                    )}
                  />
                </div>
                <div item xs={12} md={6}>
                  <Controller
                    name="performedAt"
                    control={control}
                    
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        type="date"
                        label="Date Performed"
                        error={!!errors.performedAt}
                        helperText={errors.performedAt?.message}
                        disabled={loading}
                        slotProps={{}
                          inputLabel: { shrink: true },
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            <Separator />
            {/* Result Value and Unit */}
            <div>
              <div  className="">
                Result Value
              </div>
              <div container spacing={3}>
                <div item xs={12} md={6}>
                  <Controller
                    name="value"
                    control={control}
                    
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        label="Result Value"
                        placeholder="e.g., 12.5, positive, 10-15"
                        error={!!errors.value}
                        helperText={
                          errors.value?.message ||
                          'Enter numeric value, range, or qualitative result'}
                        }
                        disabled={loading}
                      />
                    )}
                  />
                </div>
                <div item xs={12} md={6}>
                  <Controller
                    name="unit"
                    control={control}
                    render={({  field  }) => (
                      <Autocomplete
                        {...field}
                        options={COMMON_UNITS}
                        freeSolo
                        disabled={loading}
                        onChange={(_, value) => field.onChange(value || '')}
                        renderInput={(params) => (
                          <Input}
                            {...params}
                            label="Unit"
                            placeholder="e.g., mg/dL, g/dL"
                            helperText="Select or enter custom unit"
                          />
                        )}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            {/* Reference Range */}
            <div>
              <div  className="">
                Reference Range
              </div>
              <div container spacing={3}>
                <div item xs={12} md={4}>
                  <Controller
                    name="referenceRange.low"
                    control={control}
                    
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        type="number"
                        label="Low Value"
                        placeholder="e.g., 4.5"
                        error={!!errors.referenceRange?.low}
                        disabled={loading}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )}
                        }
                      />
                    )}
                  />
                </div>
                <div item xs={12} md={4}>
                  <Controller
                    name="referenceRange.high"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        type="number"
                        label="High Value"
                        placeholder="e.g., 11.0"
                        disabled={loading}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )}
                        }
                      />
                    )}
                  />
                </div>
                <div item xs={12} md={4}>
                  <Controller
                    name="referenceRange.text"
                    control={control}
                    render={({  field  }) => (
                      <Input
                        {...field}
                        fullWidth
                        label="Text Range"
                        placeholder="e.g., Normal, Negative"
                        helperText="For qualitative results"
                        disabled={loading}
                      />
                    )}
                  />
                </div>
              </div>
              {errors.referenceRange && (
                <p error className="">
                  {errors.referenceRange.message}
                </p>
              )}
            </div>
            {/* Interpretation */}
            <div>
              <div  className="">
                Interpretation
              </div>
              <Controller
                name="interpretation"
                control={control}
                render={({  field  }) => (
                  <div fullWidth>
                    <Label>Result Interpretation</Label>
                    <Select
                      {...field}
                      label="Result Interpretation"
                      disabled={loading}
                    >
                      {INTERPRETATION_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <MenuItem key={option.value} value={option.value}>
                            <div className="">
                              <Icon
                                className="".main`,
                              />
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
                            </div>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </div>
                )}
              />
              {watchedValues.interpretation && (
                <div className="">
                  <Chip
                    icon={React.createElement(
                      getInterpretationIcon(watchedValues.interpretation),}
                      { sx: { fontSize: 16 } }
                    )}
                    label={
                      INTERPRETATION_OPTIONS.find(
                        (opt) => opt.value === watchedValues.interpretation
                      )?.label}
                    }
                    color={getInterpretationColor(watchedValues.interpretation)}
                    
                  />
                </div>
              )}
            </div>
            {/* Flags */}
            <div>
              <div  className="">
                Result Flags
              </div>
              {/* Current flags */}
              {selectedFlags.length > 0 && (
                <div className="">
                  <div
                    direction="row"
                    spacing={1}
                    className=""
                  >
                    {selectedFlags.map((flag) => (
                      <Chip
                        key={flag}
                        label={flag}
                        onDelete={() => handleRemoveFlag(flag)}
                        size="small"
                        color="primary"
                        
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Common flags */}
              <div className="">
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  Common flags:
                </div>
                <div
                  direction="row"
                  spacing={0.5}
                  className=""
                >
                  {COMMON_FLAGS.map((flag) => (
                    <Chip
                      key={flag}
                      label={flag}
                      size="small"
                      onClick={() => handleAddFlag(flag)}
                      disabled={loading || selectedFlags.includes(flag)}
                      className=""
                      
                    />
                  ))}
                </div>
              </div>
              {/* Custom flag input */}
              <div className="">
                <Input
                  size="small"
                  placeholder="Custom flag..."
                  value={customFlag}
                  onChange={(e) => setCustomFlag(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomFlag();}
                    }
                />
                <Button
                  
                  size="small"
                  onClick={handleAddCustomFlag}
                  disabled={loading || !customFlag.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
            {/* Comments */}
            <div>
              <Controller
                name="comments"
                control={control}
                render={({  field  }) => (
                  <Input
                    {...field}
                    fullWidth
                    label="Comments (Optional)"
                    placeholder="Additional notes or comments about the result..."
                    multiline
                    rows={3}
                    disabled={loading}
                  />
                )}
              />
            </div>
            {/* Critical Value Warning */}
            {watchedValues.interpretation === 'critical' && (
              <Alert severity="error">
                <div >
                  <strong>Critical Value Alert:</strong> This result is
                  critically abnormal and may require immediate clinical
                  attention.
                </div>
              </Alert>
            )}
            {/* Submit Button */}
            <div className="">
              <Button
                type="submit"
                
                disabled={loading || !isValid}
                className=""
              >
                {loading ? 'Saving Result...' : 'Save Result'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
export default LabResultEntry;
