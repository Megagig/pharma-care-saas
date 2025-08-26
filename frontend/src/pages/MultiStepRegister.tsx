import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Stack,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Paper,
  Chip,
  Divider,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

// Nigerian states for dropdown
const nigerianStates = [
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

// Workplace types
const workplaceTypes = [
  {
    value: 'Community',
    label: 'Community Pharmacy',
    icon: <WorkOutlineIcon />,
  },
  {
    value: 'Hospital',
    label: 'Hospital/Clinic',
    icon: <BusinessOutlinedIcon />,
  },
  {
    value: 'Academia',
    label: 'Academic Institution',
    icon: <SchoolOutlinedIcon />,
  },
  {
    value: 'Industry',
    label: 'Pharmaceutical Industry',
    icon: <BusinessOutlinedIcon />,
  },
  {
    value: 'Regulatory Body',
    label: 'Regulatory Body',
    icon: <BusinessOutlinedIcon />,
  },
  { value: 'Other', label: 'Other', icon: <WorkOutlineIcon /> },
];

// Workplace roles
const workplaceRoles = [
  'Staff',
  'Pharmacist',
  'Cashier',
  'Technician',
  'Assistant',
];

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  licenseNumber: string;
  role: string;
}

interface WorkplaceFormData {
  name: string;
  type: string;
  licenseNumber: string;
  email: string;
  address: string;
  state: string;
  lga: string;
}

interface JoinWorkplaceData {
  inviteCode: string;
  workplaceRole: string;
}

interface Workplace {
  _id: string;
  name: string;
  type: string;
  email: string;
  licenseNumber: string;
  address: string;
  state: string;
  lga: string;
  inviteCode: string;
  ownerId: string;
  teamMembers: string[];
  teamSize: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RegistrationPayload extends UserFormData {
  workplaceFlow: WorkplaceFlow;
  workplace?: WorkplaceFormData;
  inviteCode?: string;
  workplaceRole?: string;
}

type WorkplaceFlow = 'create' | 'join' | 'skip';

const steps = ['Personal Info', 'Workplace Setup', 'Confirmation'];

const MultiStepRegister = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [workplaceFlow, setWorkplaceFlow] = useState<WorkplaceFlow>('create');
  const [foundWorkplace, setFoundWorkplace] = useState<Workplace | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Form data states
  const [userForm, setUserForm] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    licenseNumber: '',
    role: 'pharmacist',
  });

  const [workplaceForm, setWorkplaceForm] = useState<WorkplaceFormData>({
    name: '',
    type: 'Community',
    licenseNumber: '',
    email: '',
    address: '',
    state: '',
    lga: '',
  });

  const [joinForm, setJoinForm] = useState<JoinWorkplaceData>({
    inviteCode: '',
    workplaceRole: 'Staff',
  });

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Handle form field changes
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkplaceFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setWorkplaceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleJoinFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJoinForm((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  // Find workplace by invite code
  const handleFindWorkplace = async () => {
    if (!joinForm.inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.findWorkplaceByInviteCode(
        joinForm.inviteCode
      );
      setFoundWorkplace(response.data);
      toast.success(`Found workplace: ${response.data.name}`);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        apiError.response?.data?.message || 'Invalid invite code';
      setError(errorMessage);
      setFoundWorkplace(null);
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateStep1 = (): boolean => {
    if (!userForm.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!userForm.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!userForm.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!userForm.password) {
      setError('Password is required');
      return false;
    }
    if (userForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (userForm.password !== userForm.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (workplaceFlow === 'create') {
      if (!workplaceForm.name.trim()) {
        setError('Workplace name is required');
        return false;
      }
      if (!workplaceForm.licenseNumber.trim()) {
        setError('License number is required');
        return false;
      }
      if (!workplaceForm.email.trim()) {
        setError('Workplace email is required');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workplaceForm.email)) {
        setError('Please enter a valid workplace email');
        return false;
      }
    } else if (workplaceFlow === 'join') {
      if (!joinForm.inviteCode.trim()) {
        setError('Invite code is required');
        return false;
      }
      if (!foundWorkplace) {
        setError('Please verify the invite code first');
        return false;
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }
    return true;
  };

  // Navigation functions
  const handleNext = () => {
    setError('');

    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1 && !validateStep2()) return;

    // Skip step 2 if user chooses to skip workplace setup
    if (activeStep === 1 && workplaceFlow === 'skip') {
      setActiveStep(2);
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  // Final submission
  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setError('');
    setLoading(true);

    try {
      const payload: RegistrationPayload = {
        ...userForm,
        workplaceFlow,
      };

      if (workplaceFlow === 'create') {
        payload.workplace = workplaceForm;
      } else if (workplaceFlow === 'join') {
        payload.inviteCode = joinForm.inviteCode;
        payload.workplaceRole = joinForm.workplaceRole;
      }

      console.log('Registration payload:', payload);

      await authService.registerWithWorkplace(payload);

      toast.success(
        'Registration successful! Please check your email to verify your account.'
      );

      // Navigate to verification page with context
      navigate('/verify-email', {
        state: {
          email: userForm.email,
          workplaceFlow,
          workplaceName:
            workplaceFlow === 'create'
              ? workplaceForm.name
              : foundWorkplace?.name,
        },
      });
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const apiError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        apiError.response?.data?.message ||
        apiError.message ||
        'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <Step1Content />;
      case 1:
        return <Step2Content />;
      case 2:
        return <Step3Content />;
      default:
        return null;
    }
  };

  // Step 1: Personal Information
  const Step1Content = () => (
    <Stack spacing={3}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <PersonOutlineIcon
          sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
        />
        <Typography variant="h5" gutterBottom>
          Personal Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Let's start with your basic information
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
          label="First Name"
          name="firstName"
          value={userForm.firstName}
          onChange={handleUserFormChange}
          required
        />
        <TextField
          fullWidth
          label="Last Name"
          name="lastName"
          value={userForm.lastName}
          onChange={handleUserFormChange}
          required
        />
      </Stack>

      <TextField
        fullWidth
        label="Email Address"
        name="email"
        type="email"
        value={userForm.email}
        onChange={handleUserFormChange}
        required
      />

      <TextField
        fullWidth
        label="Phone Number (Optional)"
        name="phone"
        value={userForm.phone}
        onChange={handleUserFormChange}
      />

      <TextField
        fullWidth
        label="License Number (Optional - no validation at signup)"
        name="licenseNumber"
        value={userForm.licenseNumber}
        onChange={handleUserFormChange}
        helperText="You can add or verify your license later in your profile"
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={userForm.password}
          onChange={handleUserFormChange}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="Confirm Password"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={userForm.confirmPassword}
          onChange={handleUserFormChange}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={handleToggleConfirmPasswordVisibility}
                  edge="end"
                >
                  {showConfirmPassword ? (
                    <VisibilityOffIcon />
                  ) : (
                    <VisibilityIcon />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Stack>
  );

  // Step 2: Workplace Setup
  const Step2Content = () => (
    <Stack spacing={3}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <BusinessOutlinedIcon
          sx={{ fontSize: 48, color: 'primary.main', mb: 1 }}
        />
        <Typography variant="h5" gutterBottom>
          Workplace Setup
        </Typography>
        <Typography variant="body2" color="text.secondary">
          How would you like to set up your workplace?
        </Typography>
      </Box>

      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ mb: 2 }}>
          Choose your setup option:
        </FormLabel>
        <RadioGroup
          value={workplaceFlow}
          onChange={(e) => setWorkplaceFlow(e.target.value as WorkplaceFlow)}
        >
          <Paper
            sx={{
              p: 2,
              mb: 2,
              border: workplaceFlow === 'create' ? 2 : 1,
              borderColor:
                workplaceFlow === 'create' ? 'primary.main' : 'divider',
            }}
          >
            <FormControlLabel
              value="create"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Create a new workplace
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Set up your pharmacy, hospital, clinic, or organization
                  </Typography>
                </Box>
              }
            />
          </Paper>

          <Paper
            sx={{
              p: 2,
              mb: 2,
              border: workplaceFlow === 'join' ? 2 : 1,
              borderColor:
                workplaceFlow === 'join' ? 'primary.main' : 'divider',
            }}
          >
            <FormControlLabel
              value="join"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Join an existing workplace
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use an invite code from your workplace owner
                  </Typography>
                </Box>
              }
            />
          </Paper>

          <Paper
            sx={{
              p: 2,
              border: workplaceFlow === 'skip' ? 2 : 1,
              borderColor:
                workplaceFlow === 'skip' ? 'primary.main' : 'divider',
            }}
          >
            <FormControlLabel
              value="skip"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    Skip for now
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Access general features only (Knowledge Hub, CPD, Forum)
                  </Typography>
                </Box>
              }
            />
          </Paper>
        </RadioGroup>
      </FormControl>

      {workplaceFlow === 'create' && <CreateWorkplaceForm />}
      {workplaceFlow === 'join' && <JoinWorkplaceForm />}
      {workplaceFlow === 'skip' && <SkipWorkplaceInfo />}
    </Stack>
  );

  const CreateWorkplaceForm = () => (
    <Stack spacing={3} sx={{ mt: 3 }}>
      <Divider>
        <Chip label="Workplace Details" />
      </Divider>

      <TextField
        fullWidth
        label="Workplace Name"
        name="name"
        value={workplaceForm.name}
        onChange={handleWorkplaceFormChange}
        required
        placeholder="e.g., Central Pharmacy, City Hospital"
      />

      <FormControl fullWidth>
        <InputLabel>Workplace Type</InputLabel>
        <Select
          value={workplaceForm.type}
          onChange={(e) =>
            setWorkplaceForm((prev) => ({ ...prev, type: e.target.value }))
          }
          label="Workplace Type"
        >
          {workplaceTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {type.icon}
                {type.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
          label="License Number"
          name="licenseNumber"
          value={workplaceForm.licenseNumber}
          onChange={handleWorkplaceFormChange}
          required
          placeholder="PCN/PHARMACYLIC/2024/001"
        />
        <TextField
          fullWidth
          label="Workplace Email"
          name="email"
          type="email"
          value={workplaceForm.email}
          onChange={handleWorkplaceFormChange}
          required
        />
      </Stack>

      <TextField
        fullWidth
        label="Address (Optional)"
        name="address"
        value={workplaceForm.address}
        onChange={handleWorkplaceFormChange}
        multiline
        rows={2}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl fullWidth>
          <InputLabel>State (Optional)</InputLabel>
          <Select
            value={workplaceForm.state}
            onChange={(e) =>
              setWorkplaceForm((prev) => ({ ...prev, state: e.target.value }))
            }
            label="State (Optional)"
          >
            {nigerianStates.map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="LGA (Optional)"
          name="lga"
          value={workplaceForm.lga}
          onChange={handleWorkplaceFormChange}
        />
      </Stack>
    </Stack>
  );

  const JoinWorkplaceForm = () => (
    <Stack spacing={3} sx={{ mt: 3 }}>
      <Divider>
        <Chip label="Join Workplace" />
      </Divider>

      <Box>
        <Stack direction="row" spacing={2} alignItems="flex-end">
          <TextField
            fullWidth
            label="Invite Code"
            name="inviteCode"
            value={joinForm.inviteCode}
            onChange={handleJoinFormChange}
            placeholder="ABC123"
            helperText="Enter the 6-character invite code from your workplace"
          />
          <Button
            variant="outlined"
            onClick={handleFindWorkplace}
            disabled={loading || !joinForm.inviteCode.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Find'}
          </Button>
        </Stack>
      </Box>

      {foundWorkplace && (
        <Paper
          sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText' }}
        >
          <Typography variant="h6" gutterBottom>
            ✅ Workplace Found!
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>{foundWorkplace.name}</strong>
          </Typography>
          <Typography variant="body2">
            Type: {foundWorkplace.type} | Location: {foundWorkplace.state}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Team Size: {foundWorkplace.teamSize} members
          </Typography>
        </Paper>
      )}

      {foundWorkplace && (
        <FormControl fullWidth>
          <InputLabel>Your Role</InputLabel>
          <Select
            value={joinForm.workplaceRole}
            onChange={(e) =>
              setJoinForm((prev) => ({
                ...prev,
                workplaceRole: e.target.value,
              }))
            }
            label="Your Role"
          >
            {workplaceRoles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );

  const SkipWorkplaceInfo = () => (
    <Paper sx={{ p: 3, mt: 3, bgcolor: 'warning.light' }}>
      <Typography variant="h6" gutterBottom color="warning.dark">
        Limited Access Mode
      </Typography>
      <Typography variant="body2" color="warning.dark" paragraph>
        By skipping workplace setup, you'll have access to:
      </Typography>
      <Stack component="ul" spacing={1} sx={{ pl: 2, color: 'warning.dark' }}>
        <Typography component="li" variant="body2">
          ✅ Knowledge Hub & Resources
        </Typography>
        <Typography component="li" variant="body2">
          ✅ CPD Tracking
        </Typography>
        <Typography component="li" variant="body2">
          ✅ Professional Forum
        </Typography>
        <Typography component="li" variant="body2">
          ❌ Patient Management (requires workplace)
        </Typography>
        <Typography component="li" variant="body2">
          ❌ Medication Management (requires workplace)
        </Typography>
        <Typography component="li" variant="body2">
          ❌ Billing & Reports (requires workplace)
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        color="warning.dark"
        sx={{ mt: 2, fontStyle: 'italic' }}
      >
        You can create or join a workplace anytime from your dashboard.
      </Typography>
    </Paper>
  );

  // Step 3: Confirmation
  const Step3Content = () => (
    <Stack spacing={3}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <CheckCircleOutlineIcon
          sx={{ fontSize: 48, color: 'success.main', mb: 1 }}
        />
        <Typography variant="h5" gutterBottom>
          Almost Done!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review your information and complete registration
        </Typography>
      </Box>

      {/* Summary */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Registration Summary
        </Typography>

        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Name:
            </Typography>
            <Typography variant="body1">
              {userForm.firstName} {userForm.lastName}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Email:
            </Typography>
            <Typography variant="body1">{userForm.email}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Workplace Setup:
            </Typography>
            {workplaceFlow === 'create' && (
              <Typography variant="body1">
                Creating new workplace: <strong>{workplaceForm.name}</strong> (
                {workplaceForm.type})
              </Typography>
            )}
            {workplaceFlow === 'join' && (
              <Typography variant="body1">
                Joining: <strong>{foundWorkplace?.name}</strong> as{' '}
                {joinForm.workplaceRole}
              </Typography>
            )}
            {workplaceFlow === 'skip' && (
              <Typography variant="body1">
                Independent account (no workplace)
              </Typography>
            )}
          </Box>

          {workplaceFlow === 'create' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              🎉 You'll get a 14-day free trial to explore all features!
            </Alert>
          )}

          {workplaceFlow === 'join' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              🤝 You'll inherit your workplace's subscription plan!
            </Alert>
          )}
        </Stack>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
          />
        }
        label={
          <Typography variant="body2">
            I agree to the{' '}
            <Link to="/terms" target="_blank" style={{ color: 'inherit' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" style={{ color: 'inherit' }}>
              Privacy Policy
            </Link>
          </Typography>
        }
      />
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Back to Homepage Link */}
            <Box sx={{ mb: 3 }}>
              <Button
                component={Link}
                to="/"
                variant="text"
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'transparent',
                  },
                }}
              >
                ← Back to Homepage
              </Button>
            </Box>

            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{ fontWeight: 'bold', mb: 1 }}
              >
                Join PharmaCareSaaS
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create your account and set up your workplace
              </Typography>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Step Content */}
            <Box sx={{ mb: 4 }}>{renderStepContent()}</Box>

            {/* Navigation Buttons */}
            <Stack direction="row" spacing={2} justifyContent="space-between">
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || loading}
                variant="outlined"
              >
                Back
              </Button>

              <Box sx={{ flex: 1 }} />

              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  variant="contained"
                  size="large"
                >
                  {workplaceFlow === 'skip' && activeStep === 1
                    ? 'Skip to Confirmation'
                    : 'Continue'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !agreeToTerms}
                  variant="contained"
                  size="large"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CheckCircleOutlineIcon />
                    )
                  }
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              )}
            </Stack>

            {/* Sign In Link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default MultiStepRegister;
