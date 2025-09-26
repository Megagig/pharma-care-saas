import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  User as PersonOutline,
  Building as BusinessOutline,
  GraduationCap as SchoolOutline,
  Briefcase as WorkOutline,
  CheckCircle as CheckCircleOutline,
  Eye as Visibility,
  EyeOff as VisibilityOff,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

import ThemeToggle from '../components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { authService } from '@/services/authService';

// Nigerian states for dropdown
const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

// Workplace types
const workplaceTypes = [
  { value: 'Community', label: 'Community Pharmacy', icon: <WorkOutline className="h-5 w-5" /> },
  { value: 'Hospital', label: 'Hospital/Clinic', icon: <BusinessOutline className="h-5 w-5" /> },
  { value: 'Academia', label: 'Academic Institution', icon: <SchoolOutline className="h-5 w-5" /> },
  { value: 'Industry', label: 'Pharmaceutical Industry', icon: <BusinessOutline className="h-5 w-5" /> },
  { value: 'Regulatory Body', label: 'Regulatory Body', icon: <BusinessOutline className="h-5 w-5" /> },
  { value: 'Other', label: 'Other', icon: <WorkOutline className="h-5 w-5" /> },
];

// Workplace roles
const workplaceRoles = [
  'Staff', 'Pharmacist', 'Cashier', 'Technician', 'Assistant',
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
  const [agreeToTerms, setAgreeToTerms] = useState(false);

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
      const response = await authService.findWorkplaceByInviteCode(joinForm.inviteCode);
      setFoundWorkplace(response.data);
      toast.success(`Found workplace: ${response.data.name}`);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      const errorMessage = apiError.response?.data?.message || 'Invalid invite code';
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
          workplaceName: workplaceFlow === 'create'
            ? workplaceForm.name
            : foundWorkplace?.name,
        },
      });
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const apiError = error as {
        response?: { data?: { message?: string } };
        message?: string
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
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <PersonOutline className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Personal Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Let's start with your basic information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={userForm.firstName}
                  onChange={handleUserFormChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={userForm.lastName}
                  onChange={handleUserFormChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleUserFormChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={userForm.phone}
                onChange={handleUserFormChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Professional License Number
              </Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                value={userForm.licenseNumber}
                onChange={handleUserFormChange}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You can add or verify your license later in your profile
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password}
                    onChange={handleUserFormChange}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    onClick={handleTogglePasswordVisibility}
                  >
                    {showPassword ? (
                      <VisibilityOff className="h-5 w-5" />
                    ) : (
                      <Visibility className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={userForm.confirmPassword}
                    onChange={handleUserFormChange}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    onClick={handleToggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <VisibilityOff className="h-5 w-5" />
                    ) : (
                      <Visibility className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <BusinessOutline className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Workplace Setup
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                How would you like to set up your workplace?
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium text-gray-900 dark:text-white">
                Choose your setup option:
              </Label>

              <div className="space-y-3">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${workplaceFlow === 'create' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}
                  onClick={() => setWorkplaceFlow('create')}
                >
                  <div className="flex items-start">
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border mr-3 mt-0.5 ${workplaceFlow === 'create' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {workplaceFlow === 'create' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Create a new workplace</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Set up your pharmacy, hospital, clinic, or organization
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${workplaceFlow === 'join' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}
                  onClick={() => setWorkplaceFlow('join')}
                >
                  <div className="flex items-start">
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border mr-3 mt-0.5 ${workplaceFlow === 'join' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {workplaceFlow === 'join' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Join an existing workplace</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Use an invite code from your workplace owner
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${workplaceFlow === 'skip' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}`}
                  onClick={() => setWorkplaceFlow('skip')}
                >
                  <div className="flex items-start">
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border mr-3 mt-0.5 ${workplaceFlow === 'skip' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                      {workplaceFlow === 'skip' && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Skip for now</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Access general features only (Knowledge Hub, CPD, Forum)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {workplaceFlow === 'create' && (
              <div className="space-y-6 pt-4">
                <Separator>
                  <Badge variant="secondary">Workplace Details</Badge>
                </Separator>

                <div>
                  <Label htmlFor="workplaceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Workplace Name
                  </Label>
                  <Input
                    id="workplaceName"
                    name="name"
                    value={workplaceForm.name}
                    onChange={handleWorkplaceFormChange}
                    required
                    placeholder="e.g., Central Pharmacy, City Hospital"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Workplace Type
                  </Label>
                  <Select
                    value={workplaceForm.type}
                    onValueChange={(value) => setWorkplaceForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workplace type" />
                    </SelectTrigger>
                    <SelectContent>
                      {workplaceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            {type.icon}
                            <span className="ml-2">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workplaceLicense" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      License Number
                    </Label>
                    <Input
                      id="workplaceLicense"
                      name="licenseNumber"
                      value={workplaceForm.licenseNumber}
                      onChange={handleWorkplaceFormChange}
                      required
                      placeholder="PCN/PHARMACYLIC/2024/001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="workplaceEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Workplace Email
                    </Label>
                    <Input
                      id="workplaceEmail"
                      name="email"
                      type="email"
                      value={workplaceForm.email}
                      onChange={handleWorkplaceFormChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="workplaceAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address (Optional)
                  </Label>
                  <textarea
                    id="workplaceAddress"
                    name="address"
                    value={workplaceForm.address}
                    onChange={handleWorkplaceFormChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State (Optional)
                    </Label>
                    <Select
                      value={workplaceForm.state}
                      onValueChange={(value) => setWorkplaceForm(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {nigerianStates.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="workplaceLga" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      LGA (Optional)
                    </Label>
                    <Input
                      id="workplaceLga"
                      name="lga"
                      value={workplaceForm.lga}
                      onChange={handleWorkplaceFormChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {workplaceFlow === 'join' && (
              <div className="space-y-6 pt-4">
                <Separator>
                  <Badge variant="secondary">Join Workplace</Badge>
                </Separator>

                <div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Invite Code
                      </Label>
                      <Input
                        id="inviteCode"
                        name="inviteCode"
                        value={joinForm.inviteCode}
                        onChange={handleJoinFormChange}
                        placeholder="ABC123"
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Enter the 6-character invite code from your workplace
                      </p>
                    </div>
                    <div className="self-end">
                      <Button
                        onClick={handleFindWorkplace}
                        disabled={loading || !joinForm.inviteCode.trim()}
                        className="h-10"
                      >
                        {loading ? 'Finding...' : 'Find'}
                      </Button>
                    </div>
                  </div>
                </div>

                {foundWorkplace && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      ✅ Workplace Found!
                    </h3>
                    <p className="font-semibold text-green-800 dark:text-green-200 mb-1">
                      {foundWorkplace.name}
                    </p>
                    <p className="text-green-700 dark:text-green-300 mb-1">
                      Type: {foundWorkplace.type} | Location: {foundWorkplace.state}
                    </p>
                    <p className="text-green-700 dark:text-green-300">
                      Team Size: {foundWorkplace.teamSize} members
                    </p>
                  </div>
                )}

                {foundWorkplace && (
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Role
                    </Label>
                    <Select
                      value={joinForm.workplaceRole}
                      onValueChange={(value) => setJoinForm(prev => ({ ...prev, workplaceRole: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {workplaceRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {workplaceFlow === 'skip' && (
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Limited Access Mode
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300 mb-3">
                    By skipping workplace setup, you'll have access to:
                  </p>

                  <ul className="space-y-1 text-amber-700 dark:text-amber-300">
                    <li className="flex items-center">
                      <span className="mr-2">✅</span> Knowledge Hub & Resources
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✅</span> CPD Tracking
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">✅</span> Professional Forum
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">❌</span> Patient Management (requires workplace)
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">❌</span> Medication Management (requires workplace)
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">❌</span> Billing & Reports (requires workplace)
                    </li>
                  </ul>

                  <p className="text-amber-700 dark:text-amber-300 mt-3">
                    You can create or join a workplace anytime from your dashboard.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <CheckCircleOutline className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Almost Done!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review your information and complete registration
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Registration Summary
              </h3>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name:</p>
                  <p className="font-medium">{userForm.firstName} {userForm.lastName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email:</p>
                  <p className="font-medium">{userForm.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Workplace Setup:</p>
                  {workplaceFlow === 'create' && (
                    <p className="font-medium">
                      Creating new workplace: <span className="text-blue-600 dark:text-blue-400">{workplaceForm.name}</span> ({workplaceForm.type})
                    </p>
                  )}
                  {workplaceFlow === 'join' && (
                    <p className="font-medium">
                      Joining: <span className="text-blue-600 dark:text-blue-400">{foundWorkplace?.name}</span> as {joinForm.workplaceRole}
                    </p>
                  )}
                  {workplaceFlow === 'skip' && (
                    <p className="font-medium">
                      Independent account (no workplace)
                    </p>
                  )}
                </div>

                {workplaceFlow === 'create' && (
                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CheckCircleOutline className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      🎉 You'll get a 14-day free trial to explore all features!
                    </AlertDescription>
                  </Alert>
                )}

                {workplaceFlow === 'join' && (
                  <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CheckCircleOutline className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      🤝 You'll inherit your workplace's subscription plan!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <label htmlFor="terms" className="cursor-pointer">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Floating Theme Toggle */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle size="sm" />
      </div>

      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {/* Back to Homepage Link */}
            <div className="mb-6">
              <Button variant="ghost" asChild className="pl-0">
                <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Homepage
                </Link>
              </Button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Join PharmaCareSaaS
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create your account and set up your workplace
              </p>
            </div>

            {/* Stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((label, index) => (
                  <div key={label} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${index <= activeStep ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                      {index < activeStep ? (
                        <CheckCircleOutline className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className={`ml-2 text-sm font-medium ${index <= activeStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {label}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`mx-4 h-0.5 w-16 ${index < activeStep ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Step Content */}
            <div className="mb-8">{renderStepContent()}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={activeStep === 0 || loading}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex items-center"
                >
                  {workplaceFlow === 'skip' && activeStep === 1
                    ? 'Skip to Confirmation'
                    : 'Continue'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !agreeToTerms}
                  className="flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircleOutline className="h-4 w-4 mr-2" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Sign In Link */}
            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MultiStepRegister;
