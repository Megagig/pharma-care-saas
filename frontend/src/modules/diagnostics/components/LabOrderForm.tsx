import { Button, Input, Label, Card, CardContent, Select, Alert, Separator } from '@/components/ui/button';
// Common lab tests for quick selection
const COMMON_LAB_TESTS = [
  {
    code: 'CBC',
    name: 'Complete Blood Count',
    loincCode: '58410-2',
    category: 'Hematology',
    description: 'Complete blood count with differential',
  },
  {
    code: 'CMP',
    name: 'Comprehensive Metabolic Panel',
    loincCode: '24323-8',
    category: 'Chemistry',
    description: 'Basic metabolic panel plus liver function tests',
  },
  {
    code: 'LIPID',
    name: 'Lipid Panel',
    loincCode: '57698-3',
    category: 'Chemistry',
    description: 'Total cholesterol, HDL, LDL, triglycerides',
  },
  {
    code: 'TSH',
    name: 'Thyroid Stimulating Hormone',
    loincCode: '3016-3',
    category: 'Endocrinology',
    description: 'Thyroid function screening',
  },
  {
    code: 'HBA1C',
    name: 'Hemoglobin A1c',
    loincCode: '4548-4',
    category: 'Chemistry',
    description: 'Diabetes monitoring',
  },
  {
    code: 'PT_INR',
    name: 'Prothrombin Time/INR',
    loincCode: '6301-6',
    category: 'Coagulation',
    description: 'Anticoagulation monitoring',
  },
  {
    code: 'URINALYSIS',
    name: 'Urinalysis',
    loincCode: '5804-0',
    category: 'Urinalysis',
    description: 'Complete urinalysis with microscopy',
  },
  {
    code: 'CRP',
    name: 'C-Reactive Protein',
    loincCode: '1988-5',
    category: 'Immunology',
    description: 'Inflammation marker',
  },
];
const PRIORITY_OPTIONS = [
  {
    value: 'stat',
    label: 'STAT (Immediate)',
    color: 'error' as const,
    description: 'Results needed immediately',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    color: 'warning' as const,
    description: 'Results needed within 2-4 hours',
  },
  {
    value: 'routine',
    label: 'Routine',
    color: 'success' as const,
    description: 'Standard processing time',
  },
];
interface LabTest {
  code: string;
  name: string;
  loincCode?: string;
  indication: string;
  priority: 'stat' | 'urgent' | 'routine';
}
interface LabOrderFormData {
  patientId: string;
  tests: LabTest[];
  expectedDate?: string;
  clinicalIndication: string;
}
const LabOrderForm: React.FC<LabOrderFormProps> = ({ 
  patientId,
  onSubmit,
  loading = false,
  error
}) => {
  const [showTestCatalog, setShowTestCatalog] = useState(false);
  const [testSearch, setTestSearch] = useState('');
  const {
    testCatalog,
    fetchTestCatalog,
    searchTestCatalog,
    loading: storeLoading,
  } = useLabStore();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<LabOrderFormData>({ 
    defaultValues: {
      patientId,
      tests: [],
      expectedDate: '',
      clinicalIndication: ''}
    },
    mode: 'onChange'}
  const { fields, append, remove } = useFieldArray({ 
    control,
    name: 'tests'}
  });
  const watchedTests = watch('tests');
  // Load test catalog on mount
    if (testCatalog.length === 0) {
      fetchTestCatalog();
    }
  }, [testCatalog.length, fetchTestCatalog]);
  const handleAddTest = useCallback(
    (test: LabTestCatalogItem | (typeof COMMON_LAB_TESTS)[0]) => {
      const newTest: LabTest = {
        code: test.code,
        name: test.name,
        loincCode: test.loincCode,
        indication: '',
        priority: 'routine',
      };
      // Check if test already exists
      const exists = watchedTests.some((t) => t.code === test.code);
      if (!exists) {
        append(newTest);
      }
    },
    [watchedTests, append]
  );
  const handleQuickAddTest = useCallback(
    (test: (typeof COMMON_LAB_TESTS)[0]) => {
      handleAddTest(test);
    },
    [handleAddTest]
  );
  const handleSearchTests = useCallback(
    (searchTerm: string) => {
      setTestSearch(searchTerm);
      if (searchTerm.length > 2) {
        fetchTestCatalog(searchTerm);
      }
    },
    [fetchTestCatalog]
  );
  const getFilteredCatalog = useCallback(() => {
    return searchTestCatalog(testSearch);
  }, [testSearch, searchTestCatalog]);
  const getPriorityColor = (priority: string) => {
    const option = PRIORITY_OPTIONS.find((opt) => opt.value === priority);
    return option?.color || 'default';
  };
  const onFormSubmit = (data: LabOrderFormData) => {
    const formattedData = {
      patientId: data.patientId,
      tests: data.tests.map((test) => ({ 
        ...test,
        indication: test.indication || data.clinicalIndication}
      })),
      expectedDate: data.expectedDate || undefined,
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
            <LocalHospitalIcon className="" />
            Lab Order Form
          </div>
          <div  color="text.secondary">
            Create a new laboratory test order for the patient
          </div>
        </div>
        {error && (
          <Alert severity="error" className="">
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div spacing={4}>
            {/* Clinical Indication */}
            <div>
              <Controller
                name="clinicalIndication"
                control={control}
                rules={{
                  required: 'Clinical indication is required',
                  minLength: {
                    value: 10,
                    message: 'Please provide a detailed clinical indication',}
                  },
                render={({  field  }) => (
                  <Input
                    {...field}
                    fullWidth
                    label="Clinical Indication"
                    placeholder="Describe the clinical reason for ordering these tests..."
                    multiline
                    rows={3}
                    error={!!errors.clinicalIndication}
                    helperText={
                      errors.clinicalIndication?.message ||
                      'Provide the clinical reason for ordering these tests'}
                    }
                    disabled={loading}
                  />
                )}
              />
            </div>
            <Separator />
            {/* Test Selection */}
            <div>
              <div  className="">
                Select Laboratory Tests
              </div>
              {/* Current Tests */}
              {fields.length > 0 && (
                <div className="">
                  <div
                    
                    className=""
                  >
                    Selected Tests ({fields.length})
                  </div>
                  <div spacing={2}>
                    {fields.map((field, index) => (
                      <div key={field.id} className="">
                        <div container spacing={2} alignItems="center">
                          <div item xs={12} md={4}>
                            <div>
                              <div
                                
                                className=""
                              >
                                {field.name}
                              </div>
                              <div
                                
                                color="text.secondary"
                              >
                                Code: {field.code}
                                {field.loincCode &&
                                  ` • LOINC: ${field.loincCode}`}
                              </div>
                            </div>
                          </div>
                          <div item xs={12} md={3}>
                            <Controller
                              name={`tests.${index}.priority`}
                              control={control}
                              render={({  field: priorityField  }) => (
                                <div fullWidth size="small">
                                  <Label>Priority</Label>
                                  <Select
                                    {...priorityField}
                                    label="Priority"
                                    disabled={loading}
                                  >
                                    {PRIORITY_OPTIONS.map((option) => (
                                      <MenuItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        <div
                                          className=""
                                        >
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
                          <div item xs={12} md={4}>
                            <Controller
                              name={`tests.${index}.indication`}
                              control={control}
                              render={({  field: indicationField  }) => (
                                <Input
                                  {...indicationField}
                                  fullWidth
                                  size="small"
                                  label="Specific Indication"
                                  placeholder="Optional specific indication..."
                                  disabled={loading}
                                />
                              )}
                            />
                          </div>
                          <div item xs={12} md={1}>
                            <IconButton
                              onClick={() => remove(index)}
                              color="error"
                              disabled={loading}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Quick Add Common Tests */}
              <div className="">
                <div  className="">
                  Common Tests
                </div>
                <div
                  direction="row"
                  spacing={1}
                  className=""
                >
                  {COMMON_LAB_TESTS.map((test) => (
                    <Chip
                      key={test.code}
                      label={test.name}
                      onClick={() => handleQuickAddTest(test)}
                      disabled={
                        loading ||
                        watchedTests.some((t) => t.code === test.code)}
                      }
                      className=""
                      
                      color="primary"
                    />
                  ))}
                </div>
              </div>
              {/* Test Catalog Search */}
              <div>
                <div className="">
                  <Button
                    
                    onClick={() => setShowTestCatalog(!showTestCatalog)}
                    disabled={loading}
                    startIcon={<SearchIcon />}
                  >
                    {showTestCatalog ? 'Hide' : 'Search'} Test Catalog
                  </Button>
                </div>
                {showTestCatalog && (
                  <div className="">
                    <Input
                      fullWidth
                      size="small"
                      placeholder="Search for lab tests..."
                      value={testSearch}
                      onChange={(e) => handleSearchTests(e.target.value)}
                      disabled={loading || storeLoading.fetchCatalog}
                      className=""
                      slotProps={{
                        input: {
                          startAdornment: (
                            <SearchIcon
                              className=""
                            />),}
                        },
                    />
                    {testSearch.length > 2 && (
                      <div className="">
                        {getFilteredCatalog().map((test) => (
                          <div
                            key={test.code}
                            className=""
                              opacity: watchedTests.some(
                                (t) => t.code === test.code
                              )
                                ? 0.5
                                : 1,
                            onClick={() => handleAddTest(test)}
                          >
                            <div
                              className=""
                            >
                              <div className="">
                                <div
                                  
                                  className=""
                                >
                                  {test.name}
                                </div>
                                <div
                                  
                                  color="text.secondary"
                                >
                                  {test.code} • {test.category}
                                  {test.loincCode &&
                                    ` • LOINC: ${test.loincCode}`}
                                </div>
                                {test.description && (
                                  <div
                                    
                                    className=""
                                  >
                                    {test.description}
                                  </div>
                                )}
                              </div>
                              {watchedTests.some(
                                (t) => t.code === test.code
                              ) && (
                                <Chip
                                  label="Added"
                                  size="small"
                                  color="success"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Expected Date */}
            <div>
              <Controller
                name="expectedDate"
                control={control}
                render={({  field  }) => (
                  <Input
                    {...field}
                    type="date"
                    label="Expected Results Date"
                    slotProps={{}
                      inputLabel: { shrink: true },
                    helperText="Optional: When do you expect the results?"
                    disabled={loading}
                    className=""
                  />
                )}
              />
            </div>
            {/* Validation Summary */}
            {fields.length === 0 && (
              <Alert severity="warning">
                <div >
                  Please select at least one laboratory test to create an order.
                </div>
              </Alert>
            )}
            {/* Order Summary */}
            {fields.length > 0 && (
              <Alert severity="info">
                <div  className="">
                  Order Summary:
                </div>
                <div >
                  {fields.length} test(s) selected
                  {fields.some((t) => t.priority === 'stat') &&
                    ' • Contains STAT orders'}
                  {fields.some((t) => t.priority === 'urgent') &&
                    ' • Contains urgent orders'}
                </div>
                <div className="">
                  {PRIORITY_OPTIONS.map((priority) => {
                    const count = fields.filter(
                      (t) => t.priority === priority.value
                    ).length;
                    return count > 0 ? (
                      <Chip
                        key={priority.value}
                        label={`${count} ${priority.label}`}
                        size="small"
                        color={priority.color}
                        
                        className=""
                      />
                    ) : null;
                  })}
                </div>
              </Alert>
            )}
            {/* Submit Button */}
            <div className="">
              <Button
                type="submit"
                
                disabled={loading || !isValid || fields.length === 0}
                className=""
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
export default LabOrderForm;
