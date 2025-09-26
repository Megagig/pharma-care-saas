import { Button, Input, Label, Card, CardContent, Dialog, DialogContent, DialogTitle, Select, Spinner, Alert, Avatar, Separator } from '@/components/ui/button';
// Custom debounce implementation to avoid lodash dependency
const debounce = (
  func: (query: string) => void,
  wait: number
): ((query: string) => void) => {
  let timeout: NodeJS.Timeout;
  return (query: string) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(query), wait);
  };
};

// Constants
const NIGERIAN_STATES: NigerianState[] = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];
const BLOOD_GROUPS: BloodGroup[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];
const GENOTYPES: Genotype[] = ['AA', 'AS', 'SS', 'AC', 'SC', 'CC'];
const GENDERS: Gender[] = ['male', 'female', 'other'];
const MARITAL_STATUSES: MaritalStatus[] = [
  'single',
  'married',
  'divorced',
  'widowed',
];
// Interfaces
interface PatientSelectionProps {
  onPatientSelect: (patient: Patient) => void;
  selectedPatient?: Patient | null;
  onNext?: () => void;
}
// interface PatientSearchFilters {
//   search: string;
//   hasActiveMTR?: boolean;
//   lastReviewDate?: Date;
//   medicationCount?: number;
// }
interface NewPatientFormData {
  firstName: string;
  lastName: string;
  otherNames?: string;
  dob?: Date;
  age?: number;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  phone?: string;
  email?: string;
  address?: string;
  state?: NigerianState;
  lga?: string;
  bloodGroup?: BloodGroup;
  genotype?: Genotype;
  weightKg?: number;
}
const PatientSelection: React.FC<PatientSelectionProps> = ({ 
  onPatientSelect,
  selectedPatient,
  onNext
}) => {
  // Responsive hooks
  const { isMobile, shouldUseCardLayout, getSpacing, getDialogMaxWidth } =
    useResponsive();
  // State
  const [searchQuery, setSearchQuery] = useState('');
  // const [filters, setFilters] = useState({ 
  //   search: ''}
  // });
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [showRecentPatients, setShowRecentPatients] = useState(true);
  // Store
  const { loading, errors, setLoading, setError, currentReview, createReview } =
    useMTRStore();
  // Queries
  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useSearchPatients(searchQuery);
  const createPatientMutation = useCreatePatient();
  // Form for new patient
  const {
    control: newPatientControl,
    handleSubmit: handleNewPatientFormSubmit,
    watch: watchNewPatient,
    setValue: setNewPatientValue,
    formState: { errors: newPatientErrors },
    reset: resetNewPatientForm,
  } = useForm<NewPatientFormData>({ 
    defaultValues: {
      firstName: '',
      lastName: '',
      otherNames: '',
      gender: undefined,
      maritalStatus: undefined,
      phone: '',
      email: '',
      address: '',
      state: undefined,
      lga: '',
      bloodGroup: undefined,
      genotype: undefined,
      weightKg: undefined}
    }
  const watchedDob = watchNewPatient('dob');
  const watchedAge = watchNewPatient('age');
  // Debounced search
  const debouncedSearchFn = useMemo(
    () =>
      debounce((query: string) => {
        // setFilters((prev) => ({ ...prev, search: query }));
        // Filters functionality can be implemented later
        console.log('Search query:', query);
      }, 300),
    []
  );
  const debouncedSearch = useCallback(
    (query: string) => {
      debouncedSearchFn(query);
    },
    [debouncedSearchFn]
  );
  // Effects
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);
  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (watchedDob && !watchedAge) {
      const today = new Date();
      const birthDate = new Date(watchedDob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      if (age >= 0 && age <= 150) {
        setNewPatientValue('age', age);
      }
    }
  }, [watchedDob, watchedAge, setNewPatientValue]);
  // Load recent patients on mount
  useEffect(() => {
    // Note: Recent patients functionality disabled as we've moved away from localStorage
    // In a production environment, this could be implemented server-side or using IndexedDB
    const loadRecentPatients = () => {
      try {
        // localStorage removed for security - no client-side persistence
        // Recent patients list will be empty on page reload
        setRecentPatients([]);
      } catch (error) {
        console.error('Failed to load recent patients:', error);
      }
    };
    loadRecentPatients();
  }, []);
  // Validation functions
  const validateNigerianPhone = (phone: string): boolean => {
    const phoneRegex = /^\+234[789]\d{9}$/;
    return phoneRegex.test(phone);
  };
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  // Handlers
  const handlePatientSelect = async (patient: Patient) => {
    try {
      setLoading('selectPatient', true);
      setError('selectPatient', null);
      // Add to recent patients
      const updatedRecent = [
        patient,
        ...recentPatients.filter((p) => p._id !== patient._id),
      ].slice(0, 5);
      setRecentPatients(updatedRecent);
      // Note: localStorage removed for security - recent patients will not persist between sessions
      // In production, this could be implemented server-side for better security
      // First, select the patient
      onPatientSelect(patient);
      // Create MTR session if none exists
      if (!currentReview) {
        console.log('Creating MTR review for patient:', patient._id);
        await createReview(patient._id);
        // Add a small delay to ensure the review is properly set in the store
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Verify the review was created successfully
        const { currentReview: newReview } = useMTRStore.getState();
        if (!newReview?._id) {
          console.error(
            'MTR review creation failed - no ID found after creation'
          );
          throw new Error('Failed to create MTR review - please try again');
        }
        console.log('MTR review created successfully with ID:', newReview._id);
      }
    } catch (error) {
      console.error('Error in handlePatientSelect:', error);
      setError(
        'selectPatient',
        error instanceof Error ? error.message : 'Failed to select patient'
      );
    } finally {
      setLoading('selectPatient', false);
    }
  };
  const handleNewPatientSubmit = async (data: NewPatientFormData) => {
    try {
      setLoading('createNewPatient', true);
      setError('createNewPatient', null);
      const patientData: CreatePatientData = {
        firstName: data.firstName,
        lastName: data.lastName,
        otherNames: data.otherNames || undefined,
        dob: data.dob?.toISOString(),
        age: data.age,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        state: data.state,
        lga: data.lga || undefined,
        bloodGroup: data.bloodGroup,
        genotype: data.genotype,
        weightKg: data.weightKg,
      };
      const result = await createPatientMutation.mutateAsync(patientData);
      const newPatient = result?.data?.patient;
      if (newPatient) {
        await handlePatientSelect(newPatient);
        setShowNewPatientModal(false);
        resetNewPatientForm();
      }
    } catch (error) {
      setError(
        'createNewPatient',
        error instanceof Error ? error.message : 'Failed to create patient'
      );
    } finally {
      setLoading('createNewPatient', false);
    }
  };
  const handleRefreshSearch = () => {
    setSearchQuery('');
    // setFilters({ search: '' });
  };
  // Enhanced debug logging
    if (searchQuery.length >= 2) {
      console.log('Search Query Debug:', {
        query: searchQuery,
        isLoading: searchLoading,
        error: searchError,
        rawResults: searchResults}
    }
  }, [searchQuery, searchLoading, searchError, searchResults]);
  // Get search results with better error handling
  const patients = useMemo(() => {
    // Debug the search results structure
    if (searchResults) {
      console.log('Processing search results:', {
        hasData: !!searchResults.data,
        hasResults: !!searchResults?.data?.results,
        resultsLength: searchResults?.data?.results?.length || 0,
        searchResultsKeys: Object.keys(searchResults || {})}
    }
    return searchResults?.data?.results || [];
  }, [searchResults]);
  const hasSearchResults = searchQuery.length >= 2 && patients.length > 0;
  const showNoResults =
    searchQuery.length >= 2 && patients.length === 0 && !searchLoading;
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="">
        {/* Header */}
        <div className="">
          <div
            variant={isMobile ? 'h6' : 'h5'}
            className=""
          >
            Patient Selection
          </div>
          <div  color="text.secondary">
            Search for an existing patient or create a new patient record to
            begin the MTR process
          </div>
        </div>
        {/* Error Display */}
        {(errors.selectPatient || errors.createNewPatient || searchError) && (
          <Alert severity="error" className="">
            {errors.selectPatient ||
              errors.createNewPatient ||
              'Search failed. Please try again.'}
          </Alert>
        )}
        {/* Selected Patient Display */}
        {selectedPatient && (
          <Zoom in={true}>
            <Card
              className=""
            >
              <CardContent className="">
                <div
                  className=""
                >
                  <CheckCircleIcon
                    color="success"
                    className=""
                  />
                  <div className="">
                    <div
                      variant={isMobile ? 'subtitle1' : 'h6'}
                      color="success.main"
                    >
                      Selected Patient
                    </div>
                    <div
                      variant={isMobile ? 'body2' : 'body1'}
                      className=""
                    >
                      {selectedPatient.firstName} {selectedPatient.lastName}
                      {selectedPatient.otherNames &&
                        ` ${selectedPatient.otherNames}`}
                    </div>
                    <div  color="text.secondary">
                      MRN: {selectedPatient.mrn} • Age:{' '}
                      {selectedPatient.age || 'N/A'}
                      {selectedPatient.phone && ` • ${selectedPatient.phone}`}
                    </div>
                  </div>
                  {onNext && (
                    <Button
                      
                      color="success"
                      onClick={async () => {
                        // Ensure patient is selected in store before proceeding
                        if (selectedPatient) {
                          onPatientSelect(selectedPatient);
                          // Add a small delay to ensure the store is updated
                          await new Promise((resolve) =>
                            setTimeout(resolve, 100)
                          );}
                        }
                        onNext();
                      className=""
                      size={isMobile ? 'large' : 'medium'}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </Zoom>
        )}
        {/* Search Section */}
        <Card
          className=""
        >
          <CardContent className="">
            <div
              variant={isMobile ? 'subtitle1' : 'h6'}
              className=""
            >
              Search Patients
            </div>
            <div
              className=""
            >
              <Input
                fullWidth
                placeholder="Search by name, MRN, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size={isMobile ? 'medium' : 'medium'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position=""><IconButton
                        size="small"}
                        onClick={handleRefreshSearch}
                        edge="end"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                className="" />
              <Button
                
                startIcon={<PersonAddIcon />}
                onClick={() => setShowNewPatientModal(true)}
                className=""
                size={isMobile ? 'large' : 'medium'}
              >
                New Patient
              </Button>
            </div>
            {/* Search Results */}
            {searchLoading && (
              <div className="">
                <Spinner size={24} />
              </div>
            )}
            {hasSearchResults && (
              <div
                
                className=""
              >
                {shouldUseCardLayout ? (
                  // Mobile card layout
                  <div className="">
                    {patients.map((patient: Patient) => (
                      <Card
                        key={patient._id}
                        className=""
                          borderRadius: 2,
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <CardContent className="">
                          <div
                            className=""
                          >
                            <Avatar className="">
                              <PersonIcon />
                            </Avatar>
                            <div className="">
                              <div
                                className=""
                              >
                                <div
                                  
                                  className=""
                                >
                                  {patient.firstName} {patient.lastName}
                                  {patient.otherNames &&
                                    ` ${patient.otherNames}`}
                                </div>
                                {patient.hasActiveDTP && (
                                  <Chip
                                    label="Active DTP"
                                    size="small"
                                    color="warning"
                                    icon={<WarningIcon />}
                                  />
                                )}
                              </div>
                              <div
                                
                                color="text.secondary"
                                className=""
                              >
                                MRN: {patient.mrn} • Age: {patient.age || 'N/A'}
                                {patient.gender &&
                                  ` • ${
                                    patient.gender.charAt(0).toUpperCase() +
                                    patient.gender.slice(1)
                                  }`}
                              </div>
                              {patient.phone && (
                                <div
                                  className=""
                                >
                                  <PhoneIcon
                                    className=""
                                  />
                                  <div
                                    
                                    color="text.secondary"
                                  >
                                    {patient.phone}
                                  </div>
                                </div>
                              )}
                              {patient.email && (
                                <div
                                  className=""
                                >
                                  <EmailIcon
                                    className=""
                                  />
                                  <div
                                    
                                    color="text.secondary"
                                  >
                                    {patient.email}
                                  </div>
                                </div>
                              )}
                              {patient.address && (
                                <div
                                  className=""
                                >
                                  <LocationIcon
                                    className=""
                                  />
                                  <div
                                    
                                    color="text.secondary"
                                  >
                                    {patient.address}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Desktop list layout
                  <List>
                    {patients.map((patient: Patient, index: number) => (
                      <React.Fragment key={patient._id}>
                        <Button
                          onClick={() => handlePatientSelect(patient)}
                          disabled={loading.selectPatient}
                        >
                          <divAvatar>
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <div
                            primary={
                              <div
                                className=""
                              >
                                <div
                                  
                                  className=""
                                >}
                                  {patient.firstName} {patient.lastName}
                                  {patient.otherNames &&
                                    ` ${patient.otherNames}`}
                                </div>
                                {patient.hasActiveDTP && (
                                  <Chip
                                    label="Active DTP"
                                    size="small"
                                    color="warning"
                                    icon={<WarningIcon />}
                                  />
                                )}
                              </div>
                            }
                            secondary={
                              <div className="">
                                <div
                                  
                                  color="text.secondary"
                                >}
                                  MRN: {patient.mrn} • Age:{' '}
                                  {patient.age || 'N/A'}
                                  {patient.gender &&
                                    ` • ${
                                      patient.gender.charAt(0).toUpperCase() +
                                      patient.gender.slice(1)
                                    }`}
                                </div>
                                {patient.phone && (
                                  <div
                                    className=""
                                  >
                                    <PhoneIcon className="" />
                                    <div >
                                      {patient.phone}
                                    </div>
                                  </div>
                                )}
                                {patient.email && (
                                  <div
                                    className=""
                                  >
                                    <EmailIcon className="" />
                                    <div >
                                      {patient.email}
                                    </div>
                                  </div>
                                )}
                                {patient.address && (
                                  <div
                                    className=""
                                  >
                                    <LocationIcon className="" />
                                    <div >
                                      {patient.address}
                                    </div>
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </ListItemButton>
                        {index < patients.length - 1 && <Separator />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </div>
            )}
            {showNoResults && (
              <Alert severity="info" className="">
                No patients found matching "{searchQuery}". Try a different
                search term or create a new patient.
              </Alert>
            )}
          </CardContent>
        </Card>
        {/* Recent Patients */}
        {recentPatients.length > 0 && !selectedPatient && (
          <Card className="">
            <CardContent className="">
              <div
                className=""
              >
                <div variant={isMobile ? 'subtitle1' : 'h6'}>
                  Recent Patients
                </div>
                {isMobile && (
                  <IconButton
                    size="small"
                    onClick={() => setShowRecentPatients(!showRecentPatients)}
                  >
                    {showRecentPatients ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                )}
              </div>
              <Collapse in={!isMobile || showRecentPatients}>
                <div className="">
                  {recentPatients.map((patient) => (
                    <div className="" key={patient._id}>
                      <div
                        
                        className=""
                          transition: 'all 0.2s',
                          borderRadius: isMobile ? 2 : 1,
                          '&:active': isMobile
                            ? {
                                transform: 'scale(0.98)',
                                bgcolor: 'action.selected',
                              }
                            : {},
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div
                          className=""
                        >
                          <Avatar className="">
                            <PersonIcon />
                          </Avatar>
                          <div
                            
                            className=""
                          >
                            {patient.firstName} {patient.lastName}
                          </div>
                        </div>
                        <div  color="text.secondary">
                          MRN: {patient.mrn}
                        </div>
                        {patient.phone && (
                          <div
                            
                            color="text.secondary"
                            className=""
                          >
                            {patient.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Collapse>
            </CardContent>
          </Card>
        )}
        {/* New Patient Modal */}
        <Dialog
          open={showNewPatientModal}
          onClose={() => setShowNewPatientModal(false)}
          maxWidth={getDialogMaxWidth('xs', 'sm', 'md')}
          fullWidth
          fullScreen={isMobile}
          TransitionComponent={isMobile ? Slide : undefined}
          slotProps={{}
            transition: isMobile ? { direction: 'up' } : undefined,>
          <DialogTitle>
            <div
              className=""
            >
              <div >Create New Patient</div>
              <IconButton onClick={() => setShowNewPatientModal(false)}>
                <CloseIcon />
              </IconButton>
            </div>
          </DialogTitle>
          <form onSubmit={handleNewPatientFormSubmit(handleNewPatientSubmit)}>
            <DialogContent>
              <div>
                {/* Basic Information */}
                <div  className="">
                  Basic Information
                </div>
                <div className="">
                  <div className="">
                    <Controller
                      name="firstName"
                      control={newPatientControl}
                      
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="First Name"
                          error={!!newPatientErrors.firstName}
                          helperText={newPatientErrors.firstName?.message}
                          required
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="lastName"
                      control={newPatientControl}
                      
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="Last Name"
                          error={!!newPatientErrors.lastName}
                          helperText={newPatientErrors.lastName?.message}
                          required
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="otherNames"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="Other Names"
                          helperText="Middle names or other names (optional)"
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="dob"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <DatePicker
                          {...field}
                          label="Date of Birth"
                          maxDate={new Date()}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!newPatientErrors.dob,
                              helperText: newPatientErrors.dob?.message,}
                            },
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="age"
                      control={newPatientControl}
                      rules={{}
                        min: { value: 0, message: 'Age must be positive' },
                        max: { value: 150, message: 'Age must be realistic' },
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          type="number"
                          label="Age (years)"
                          error={!!newPatientErrors.age}
                          helperText={
                            newPatientErrors.age?.message ||
                            'Auto-calculated from DOB'}
                          }
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="gender"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <div
                          fullWidth
                          error={!!newPatientErrors.gender}
                        >
                          <Label>Gender</Label>
                          <Select
                            {...field}
                            label="Gender"
                            value={field.value || ''}
                          >
                            {GENDERS.map((gender) => (
                              <MenuItem key={gender} value={gender}>
                                {gender.charAt(0).toUpperCase() +
                                  gender.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                          {newPatientErrors.gender && (
                            <p>
                              {newPatientErrors.gender.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="maritalStatus"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <div
                          fullWidth
                          error={!!newPatientErrors.maritalStatus}
                        >
                          <Label>Marital Status</Label>
                          <Select
                            {...field}
                            label="Marital Status"
                            value={field.value || ''}
                          >
                            {MARITAL_STATUSES.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                          {newPatientErrors.maritalStatus && (
                            <p>
                              {newPatientErrors.maritalStatus.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
                {/* Contact Information */}
                <div  className="">
                  Contact Information
                </div>
                <div className="">
                  <div className="">
                    <Controller
                      name="phone"
                      control={newPatientControl}
                      
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="Phone Number"
                          placeholder="+234812345678"
                          error={!!newPatientErrors.phone}
                          helperText={
                            newPatientErrors.phone?.message ||
                            'Nigerian format: +234XXXXXXXXX'}
                          }
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="email"
                      control={newPatientControl}
                      
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          type="email"
                          label="Email Address"
                          error={!!newPatientErrors.email}
                          helperText={newPatientErrors.email?.message}
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="address"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="Address"
                          multiline
                          rows={2}
                          helperText="Street address or residential area"
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="state"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <Autocomplete
                          {...field}
                          options={NIGERIAN_STATES}
                          value={field.value || null}
                          onChange={(_, value) => field.onChange(value)}
                          renderInput={(params) => (
                            <Input}
                              {...params}
                              label="State"
                              error={!!newPatientErrors.state}
                              helperText={newPatientErrors.state?.message}
                            />
                          )}
                        />
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="lga"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          label="Local Government Area"
                          helperText="LGA within the selected state"
                        />
                      )}
                    />
                  </div>
                </div>
                {/* Medical Information */}
                <div  className="">
                  Medical Information
                </div>
                <div className="">
                  <div className="">
                    <Controller
                      name="bloodGroup"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <div
                          fullWidth
                          error={!!newPatientErrors.bloodGroup}
                        >
                          <Label>Blood Group</Label>
                          <Select
                            {...field}
                            label="Blood Group"
                            value={field.value || ''}
                          >
                            {BLOOD_GROUPS.map((group) => (
                              <MenuItem key={group} value={group}>
                                {group}
                              </MenuItem>
                            ))}
                          </Select>
                          {newPatientErrors.bloodGroup && (
                            <p>
                              {newPatientErrors.bloodGroup.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="genotype"
                      control={newPatientControl}
                      render={({  field  }) => (
                        <div
                          fullWidth
                          error={!!newPatientErrors.genotype}
                        >
                          <Label>Genotype</Label>
                          <Select
                            {...field}
                            label="Genotype"
                            value={field.value || ''}
                          >
                            {GENOTYPES.map((genotype) => (
                              <MenuItem key={genotype} value={genotype}>
                                <div
                                  className=""
                                >
                                  {genotype}
                                  {genotype.includes('S') && (
                                    <Chip
                                      label="Sickle Cell"
                                      size="small"
                                      color="warning"
                                      className=""
                                    />
                                  )}
                                </div>
                              </MenuItem>
                            ))}
                          </Select>
                          {newPatientErrors.genotype && (
                            <p>
                              {newPatientErrors.genotype.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <div className="">
                    <Controller
                      name="weightKg"
                      control={newPatientControl}
                      rules={{}
                        min: { value: 0.5, message: 'Weight must be positive' },
                        max: {
                          value: 500,
                          message: 'Weight must be realistic',
                        },
                      render={({  field  }) => (
                        <Input
                          {...field}
                          fullWidth
                          type="number"
                          label="Weight (kg)"
                          error={!!newPatientErrors.weightKg}
                          helperText={newPatientErrors.weightKg?.message}
                          
                        />
                      )}
                    />
                  </div>
                </div>
                {/* Medical Information Note */}
                <Alert severity="info">
                  <div >
                    <strong>Medical Information:</strong> Blood group and
                    genotype are important for emergency situations and
                    medication compatibility. Weight is used for dosage
                    calculations.
                  </div>
                </Alert>
              </div>
            </DialogContent>
            <DialogActions className="">
              <Button onClick={() => setShowNewPatientModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                
                disabled={loading.createNewPatient}
                startIcon={
                  loading.createNewPatient ? (}
                    <Spinner size={16} />
                  ) : (
                    <PersonAddIcon />
                  )
                }
              >
                {loading.createNewPatient ? 'Creating...' : 'Create Patient'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
};
export default PatientSelection;
