import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockInput = ({ ...props }: any) => (
  <input {...props} className={`w-full px-3 py-2 border border-gray-300 rounded-md ${props.className || ''}`} />
);

const MockLabel = ({ children, ...props }: any) => (
  <label {...props} className={`block text-sm font-medium text-gray-700 ${props.className || ''}`}>
    {children}
  </label>
);

const MockCard = ({ children, ...props }: any) => (
  <div {...props} className={`bg-white rounded-lg shadow ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardContent = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardHeader = ({ children, ...props }: any) => (
  <div {...props} className={`border-b px-6 py-4 ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardTitle = ({ children, ...props }: any) => (
  <h3 {...props} className={`text-lg font-semibold ${props.className || ''}`}>
    {children}
  </h3>
);

const MockSelect = ({ children, value, onValueChange, ...props }: any) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md ${props.className || ''}`}
    >
      {children}
    </select>
  </div>
);

const MockSelectTrigger = ({ children, ...props }: any) => (
  <div {...props} className={`w-full px-3 py-2 border border-gray-300 rounded-md ${props.className || ''}`}>
    {children}
  </div>
);

const MockSelectValue = ({ placeholder, ...props }: any) => (
  <div {...props} className="text-gray-500">
    {placeholder}
  </div>
);

const MockSelectContent = ({ children, ...props }: any) => (
  <div {...props}>
    {children}
  </div>
);

const MockSelectItem = ({ children, value, ...props }: any) => (
  <option {...props} value={value}>
    {children}
  </option>
);

const MockAlert = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 rounded-md ${props.className || ''}`}>
    {children}
  </div>
);

const MockTabs = ({ children, value, onValueChange, ...props }: any) => (
  <div {...props}>
    {children}
  </div>
);

const MockTabsList = ({ children, ...props }: any) => (
  <div {...props} className={`flex border-b ${props.className || ''}`}>
    {children}
  </div>
);

const MockTabsTrigger = ({ children, value, ...props }: any) => (
  <button {...props} className={`px-4 py-2 text-sm font-medium ${props.className || ''}`}>
    {children}
  </button>
);

const MockTabsContent = ({ children, value, ...props }: any) => (
  <div {...props} className={`p-4 ${props.className || ''}`}>
    {children}
  </div>
);

const MockBadge = ({ children, ...props }: any) => (
  <span {...props} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${props.className || ''}`}>
    {children}
  </span>
);

// Replace imports with mock components
const Button = MockButton;
const Input = MockInput;
const Label = MockLabel;
const Card = MockCard;
const CardContent = MockCardContent;
const CardHeader = MockCardHeader;
const CardTitle = MockCardTitle;
const Select = MockSelect;
const SelectContent = MockSelectContent;
const SelectItem = MockSelectItem;
const SelectTrigger = MockSelectTrigger;
const SelectValue = MockSelectValue;
const Alert = MockAlert;
const Tabs = MockTabs;
const TabsContent = MockTabsContent;
const TabsList = MockTabsList;
const TabsTrigger = MockTabsTrigger;
const Badge = MockBadge;

// Mock types
type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
type NigerianState = 'Abia' | 'Adamawa' | 'Akwa Ibom' | 'Anambra' | 'Bauchi' | 'Bayelsa' | 'Benue' | 'Borno' | 'Cross River' | 'Delta' | 'Ebonyi' | 'Edo' | 'Ekiti' | 'Enugu' | 'FCT' | 'Gombe' | 'Imo' | 'Jigawa' | 'Kaduna' | 'Kano' | 'Katsina' | 'Kebbi' | 'Kogi' | 'Kwara' | 'Lagos' | 'Nasarawa' | 'Niger' | 'Ogun' | 'Ondo' | 'Osun' | 'Oyo' | 'Plateau' | 'Rivers' | 'Sokoto' | 'Taraba' | 'Yobe' | 'Zamfara';
type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
type Gender = 'male' | 'female' | 'other';
type Genotype = 'AA' | 'AS' | 'SS' | 'AC' | 'SC' | 'CC';

interface UpdatePatientData {
  firstName: string;
  lastName: string;
  otherNames?: string;
  dob?: string;
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

interface CreatePatientData {
  firstName: string;
  lastName: string;
  otherNames?: string;
  dob?: string;
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

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  dob?: string;
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

// Mock hooks
const usePatient = (patientId: string) => {
  return {
    data: {
      patient: {
        _id: '1',
        firstName: 'John',
        lastName: 'Doe',
        otherNames: '',
        dob: '1990-01-01',
        age: 33,
        gender: 'male' as Gender,
        maritalStatus: 'single' as MaritalStatus,
        phone: '+2348123456789',
        email: 'john@example.com',
        address: '123 Main St',
        state: 'Lagos' as NigerianState,
        lga: 'Ikeja',
        bloodGroup: 'O+' as BloodGroup,
        genotype: 'AA' as Genotype,
        weightKg: 70
      }
    },
    isLoading: false
  };
};

const useCreatePatient = () => {
  return {
    mutateAsync: async (data: CreatePatientData) => {
      console.log('Creating patient:', data);
      return Promise.resolve({ data: { patient: { _id: 'new-patient-id' } } });
    }
  };
};

const useUpdatePatient = () => {
  return {
    mutateAsync: async (data: { patientId: string; patientData: UpdatePatientData }) => {
      console.log('Updating patient:', data);
      return Promise.resolve();
    }
  };
};

// Nigerian States
const NIGERIAN_STATES: NigerianState[] = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

// Medical constants
const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENOTYPES: Genotype[] = ['AA', 'AS', 'SS', 'AC', 'SC', 'CC'];
const GENDERS: Gender[] = ['male', 'female', 'other'];
const MARITAL_STATUSES: MaritalStatus[] = ['single', 'married', 'divorced', 'widowed'];

// Form validation schema
interface PatientFormData {
  // Demographics
  firstName: string;
  lastName: string;
  otherNames?: string;
  dob?: Date | null;
  age?: number | string;
  gender?: Gender | string;
  maritalStatus?: MaritalStatus | string;
  // Contact
  phone?: string;
  email?: string;
  address?: string;
  state?: NigerianState | string;
  lga?: string;
  // Medical
  bloodGroup?: BloodGroup | string;
  genotype?: Genotype | string;
  weightKg?: number | string;
}

const PatientForm = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(patientId);
  const [activeStep, setActiveStep] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // React Query hooks
  const { data: patientResponse, isLoading: patientLoading } = usePatient(
    isEditMode ? patientId || '' : ''
  );
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();

  const patient =
    'patient' in (patientResponse || {})
      ? (patientResponse as { patient: Patient }).patient
      : undefined;

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      otherNames: '',
      dob: null,
      age: '',
      gender: '',
      maritalStatus: '',
      phone: '',
      email: '',
      address: '',
      state: '',
      lga: '',
      bloodGroup: '',
      genotype: '',
      weightKg: '',
    }
  });

  const watchedState = watch('state');
  const watchedDob = watch('dob');
  const watchedAge = watch('age');

  // Load patient data for editing
  useEffect(() => {
    if (isEditMode && patient) {
      reset({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        otherNames: patient.otherNames || '',
        dob: patient.dob ? new Date(patient.dob) : null,
        age: patient.age || '',
        gender: patient.gender || '',
        maritalStatus: patient.maritalStatus || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        state: patient.state || '',
        lga: patient.lga || '',
        bloodGroup: patient.bloodGroup || '',
        genotype: patient.genotype || '',
        weightKg: patient.weightKg || ''
      });
    }
  }, [patient, isEditMode, reset]);

  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (watchedDob && (!watchedAge || watchedAge === '')) {
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
        setValue('age', age);
      }
    }
  }, [watchedDob, watchedAge, setValue]);

  // Validation functions
  const validateNigerianPhone = (phone: string): boolean => {
    const phoneRegex = /^\+234[789]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const onSubmit = async (data: PatientFormData) => {
    try {
      setSubmissionError(null);

      // Validate required fields
      if (!data.firstName || !data.firstName.trim()) {
        setSubmissionError('First name is required');
        return;
      }
      if (!data.lastName || !data.lastName.trim()) {
        setSubmissionError('Last name is required');
        return;
      }

      // Validate phone if provided
      if (
        data.phone &&
        data.phone.trim() &&
        !validateNigerianPhone(data.phone)
      ) {
        setSubmissionError(
          'Please enter a valid Nigerian phone number (+234XXXXXXXXX)'
        );
        return;
      }

      // Validate email if provided
      if (data.email && data.email.trim() && !validateEmail(data.email)) {
        setSubmissionError('Please enter a valid email address');
        return;
      }

      // Prepare patient data - convert empty strings to undefined
      const patientData: CreatePatientData | UpdatePatientData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        otherNames:
          data.otherNames && data.otherNames.trim()
            ? data.otherNames.trim()
            : undefined,
        dob: data.dob?.toISOString(),
        age: typeof data.age === 'number' ? data.age : undefined,
        gender:
          data.gender && data.gender !== ''
            ? (data.gender as Gender)
            : undefined,
        maritalStatus:
          data.maritalStatus && data.maritalStatus !== ''
            ? (data.maritalStatus as MaritalStatus)
            : undefined,
        phone:
          data.phone && data.phone.trim() !== ''
            ? data.phone.trim()
            : undefined,
        email:
          data.email && data.email.trim() !== ''
            ? data.email.trim()
            : undefined,
        address:
          data.address && data.address.trim() !== ''
            ? data.address.trim()
            : undefined,
        state:
          data.state && data.state !== ''
            ? (data.state as NigerianState)
            : undefined,
        lga: data.lga && data.lga.trim() !== '' ? data.lga.trim() : undefined,
        bloodGroup:
          data.bloodGroup && data.bloodGroup !== ''
            ? (data.bloodGroup as BloodGroup)
            : undefined,
        genotype:
          data.genotype && data.genotype !== ''
            ? (data.genotype as Genotype)
            : undefined,
        weightKg: typeof data.weightKg === 'number' ? data.weightKg : undefined,
      };

      if (isEditMode && patientId) {
        await updatePatientMutation.mutateAsync({
          patientId,
          patientData: patientData as UpdatePatientData
        });
        navigate(`/patients/${patientId}`);
      } else {
        const result = await createPatientMutation.mutateAsync(
          patientData as CreatePatientData
        );
        const newPatientId = result?.data?.patient?._id;
        navigate(newPatientId ? `/patients/${newPatientId}` : '/patients');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'Failed to save patient. Please try again.'
      );
    }
  };

  const canProceedToNext = (): boolean => {
    switch (activeStep) {
      case 0: // Demographics
        const firstName = watch('firstName');
        const lastName = watch('lastName');
        return !!(firstName && firstName.trim() && lastName && lastName.trim());
      case 1: {
        // Contact
        const phone = watch('phone');
        const email = watch('email');
        return (
          !phone ||
          phone === '' ||
          (validateNigerianPhone(phone) &&
            (!email || email === '' || validateEmail(email)))
        );
      }
      case 2: // Medical
        return true;
      default:
        return true;
    }
  };

  if (isEditMode && patientLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading patient data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Patient' : 'Add New Patient'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? 'Update patient information and medical records'
              : 'Create a comprehensive patient profile with medical information'}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {submissionError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <div className="text-red-800">{submissionError}</div>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStep.toString()} onValueChange={(value: string) => setActiveStep(parseInt(value))}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="0">Demographics</TabsTrigger>
              <TabsTrigger value="1">Contact Info</TabsTrigger>
              <TabsTrigger value="2">Medical Info</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
              {/* Step 0: Demographics */}
              <TabsContent value="0" className="space-y-6">
                <h3 className="text-lg font-semibold">Patient Demographics</h3>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="firstName"
                    control={control}
                    rules={{ required: 'First name is required' }}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          {...field}
                          id="firstName"
                          className={errors.firstName ? 'border-red-500' : ''}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="lastName"
                    control={control}
                    rules={{ required: 'Last name is required' }}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          {...field}
                          id="lastName"
                          className={errors.lastName ? 'border-red-500' : ''}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="otherNames"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label htmlFor="otherNames">Other Names</Label>
                      <Input
                        {...field}
                        id="otherNames"
                        placeholder="Middle names or other names (optional)"
                      />
                    </div>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="age"
                    control={control}
                    rules={{
                      min: { value: 0, message: 'Age must be positive' },
                      max: { value: 150, message: 'Age must be realistic' },
                    }}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="age">Age (years)</Label>
                        <Input
                          {...field}
                          id="age"
                          type="number"
                          value={field.value || ''}
                          className={errors.age ? 'border-red-500' : ''}
                        />
                        {errors.age && (
                          <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
                        )}
                        <p className="text-gray-500 text-sm mt-1">Auto-calculated from DOB</p>
                      </div>
                    )}
                  />
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label>Gender</Label>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENDERS.map((gender) => (
                              <SelectItem key={gender} value={gender}>
                                {gender.charAt(0).toUpperCase() + gender.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.gender && (
                          <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="maritalStatus"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label>Marital Status</Label>
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className={errors.maritalStatus ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select Marital Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {MARITAL_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.maritalStatus && (
                        <p className="text-red-500 text-sm mt-1">{errors.maritalStatus.message}</p>
                      )}
                    </div>
                  )}
                />
              </TabsContent>

              {/* Step 1: Contact Information */}
              <TabsContent value="1" className="space-y-6">
                <h3 className="text-lg font-semibold">Contact Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          {...field}
                          id="phone"
                          placeholder="+234812345678"
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                        )}
                        <p className="text-gray-500 text-sm mt-1">Nigerian format: +234XXXXXXXXX</p>
                      </div>
                    )}
                  />
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        {...field}
                        id="address"
                        placeholder="Street address or residential area"
                      />
                    </div>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label>State</Label>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent>
                            {NIGERIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.state && (
                          <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="lga"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="lga">Local Government Area</Label>
                        <Input
                          {...field}
                          id="lga"
                          placeholder="LGA within the selected state"
                          disabled={!watchedState}
                        />
                      </div>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Step 2: Medical Information */}
              <TabsContent value="2" className="space-y-6">
                <h3 className="text-lg font-semibold">Medical Information</h3>

                <div className="grid grid-cols-3 gap-4">
                  <Controller
                    name="bloodGroup"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label>Blood Group</Label>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={errors.bloodGroup ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select Blood Group" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOOD_GROUPS.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.bloodGroup && (
                          <p className="text-red-500 text-sm mt-1">{errors.bloodGroup.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="genotype"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Label>Genotype</Label>
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={errors.genotype ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select Genotype" />
                          </SelectTrigger>
                          <SelectContent>
                            {GENOTYPES.map((genotype) => (
                              <SelectItem key={genotype} value={genotype}>
                                <div className="flex items-center gap-2">
                                  {genotype}
                                  {genotype.includes('S') && (
                                    <Badge variant="secondary" className="text-xs">
                                      Sickle Cell
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.genotype && (
                          <p className="text-red-500 text-sm mt-1">{errors.genotype.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    name="weightKg"
                    control={control}
                    rules={{
                      min: { value: 0.5, message: 'Weight must be positive' },
                      max: { value: 500, message: 'Weight must be realistic' },
                    }}
                    render={({ field }) => (
                      <div>
                        <Label htmlFor="weightKg">Weight (kg)</Label>
                        <Input
                          {...field}
                          id="weightKg"
                          type="number"
                          step="0.1"
                          value={field.value || ''}
                          className={errors.weightKg ? 'border-red-500' : ''}
                        />
                        {errors.weightKg && (
                          <p className="text-red-500 text-sm mt-1">{errors.weightKg.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Medical Information Note */}
                <Alert className="border-blue-200 bg-blue-50">
                  <div className="text-blue-800">
                    <strong>Medical Information:</strong> Blood group and
                    genotype are important for emergency situations and
                    medication compatibility. Weight is used for dosage
                    calculations.
                    {watch('genotype') &&
                      typeof watch('genotype') === 'string' &&
                      watch('genotype')?.includes('S') && (
                        <div className="mt-2 font-medium">
                          ⚠️ Sickle cell genotype detected - requires special
                          medical attention
                        </div>
                      )}
                  </div>
                </Alert>
              </TabsContent>

              {/* Form Actions */}
              <div className="flex justify-between items-center mt-8">
                <div>
                  {activeStep > 0 && (
                    <Button
                      type="button"
                      onClick={() => setActiveStep(activeStep - 1)}
                    >
                      Back
                    </Button>
                  )}
                </div>
                <div>
                  {activeStep < 2 ? (
                    <Button
                      type="button"
                      onClick={() => setActiveStep(activeStep + 1)}
                      disabled={!canProceedToNext()}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <Save size={16} />
                      {isSubmitting
                        ? 'Saving...'
                        : isEditMode
                          ? 'Update Patient'
                          : 'Create Patient'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientForm;