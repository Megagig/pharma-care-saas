import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import DiagnosticFeatureGuard from '../middlewares/diagnosticFeatureGuard';
import { usePatientStore } from '../../../../stores/patientStore';
import { aiDiagnosticService } from '@/services/aiDiagnosticService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus as AddIcon, ArrowLeft as ArrowBackIcon } from 'lucide-react';

const caseIntakeSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  symptoms: z.object({
    subjective: z.string().min(1, 'Subjective symptoms are required'),
    objective: z.string().optional(),
    duration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    onset: z.enum(['acute', 'chronic', 'subacute']).optional(),
  }),
  vitals: z
    .object({
      bloodPressure: z.string().optional(),
      heartRate: z.number().optional(),
      temperature: z.number().optional(),
      bloodGlucose: z.number().optional(),
      respiratoryRate: z.number().optional(),
    })
    .optional(),
  currentMedications: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
      })
    )
    .optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().min(1, 'Medical history is required'),
  labResults: z.array(z.string()).optional(),
  consent: z.boolean().refine((val) => val === true, 'Consent is required'),
});

type CaseIntakeFormData = z.infer<typeof caseIntakeSchema>;

const STEPS = [
  {
    label: 'Patient Selection',
    description: 'Select the patient for this diagnostic case',
  },
  {
    label: 'Symptom Assessment',
    description: 'Document patient symptoms and clinical findings',
  },
  {
    label: 'Vital Signs & History',
    description: 'Record vital signs, medications, and medical history',
  },
  {
    label: 'Review & Consent',
    description: 'Review information and obtain AI analysis consent',
  },
];

const CaseIntakePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [createPatientOpen, setCreatePatientOpen] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    email: '',
  });

  const patients = usePatientStore((state) => state.patients);
  const loading = usePatientStore(
    (state) => state.loading.fetchPatients || false
  );
  const createLoading = usePatientStore(
    (state) => state.loading.createPatient || false
  );
  const fetchPatients = usePatientStore((state) => state.fetchPatients);
  const createPatient = usePatientStore((state) => state.createPatient);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        await fetchPatients();
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }
    };
    loadPatients();
  }, [fetchPatients]);

  const methods = useForm<CaseIntakeFormData>({
    resolver: zodResolver(caseIntakeSchema),
    defaultValues: {
      patientId: '',
      symptoms: {
        subjective: '',
        objective: '',
        duration: '',
        severity: 'mild',
        onset: 'acute',
      },
      vitals: {},
      currentMedications: [],
      allergies: '',
      medicalHistory: '',
      labResults: [],
      consent: false,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    setValue,
  } = methods;

  useEffect(() => {
    const selectedPatientId = searchParams.get('selectedPatient');
    if (selectedPatientId && patients.length > 0) {
      const patientExists = patients.some((p) => p._id === selectedPatientId);
      if (patientExists) {
        setValue('patientId', selectedPatientId, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        setTimeout(() => {
          trigger('patientId');
        }, 100);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('selectedPatient');
        setSearchParams(newSearchParams);
      }
    }
  }, [searchParams, setValue, patients, trigger, setSearchParams]);

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isValid = await trigger(fieldsToValidate);
    if (isValid && activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleCancel = () => {
    navigate('/diagnostics');
  };

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: CaseIntakeFormData) => {
    try {
      setSubmitting(true);
      toast.loading(
        'Submitting case for AI analysis... This may take up to 3 minutes.',
        {
          id: 'ai-analysis-loading',
        }
      );

      const caseData = {
        patientId: data.patientId,
        symptoms: {
          subjective:
            data.symptoms?.subjective
              ?.split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0) || [],
          objective:
            data.symptoms?.objective
              ?.split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0) || [],
          duration: data.symptoms?.duration || undefined,
          severity: data.symptoms?.severity || undefined,
          onset: data.symptoms?.onset || undefined,
        },
        vitalSigns: {
          bloodPressure: data.vitals?.bloodPressure || undefined,
          heartRate: data.vitals?.heartRate
            ? Number(data.vitals.heartRate)
            : undefined,
          temperature: data.vitals?.temperature
            ? Number(data.vitals.temperature)
            : undefined,
          respiratoryRate: data.vitals?.respiratoryRate
            ? Number(data.vitals.respiratoryRate)
            : undefined,
          bloodGlucose: data.vitals?.bloodGlucose
            ? Number(data.vitals.bloodGlucose)
            : undefined,
        },
        currentMedications: data.currentMedications || [],
        labResults: data.labResults || [],
        patientConsent: {
          provided: true,
          method: 'electronic',
        },
      };

      if (!caseData.patientId) {
        toast.error('Patient selection is required');
        return;
      }
      if (
        !caseData.symptoms.subjective ||
        caseData.symptoms.subjective.length === 0
      ) {
        toast.error('At least one subjective symptom is required');
        return;
      }

      const diagnosticCase = await aiDiagnosticService.submitCase(caseData);
      toast.dismiss('ai-analysis-loading');
      toast.success('AI analysis completed successfully!');
      navigate(`/pharmacy/diagnostics/case/${diagnosticCase.id}/results`);
    } catch (error: unknown) {
      console.error('Failed to submit case:', error);
      toast.dismiss('ai-analysis-loading');
      let errorMessage = 'Failed to submit case. Please try again.';
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'errors' in error.response.data &&
        Array.isArray(error.response.data.errors)
      ) {
        const validationErrors = error.response.data.errors
          .map((err: any) => `${err.path || err.param}: ${err.msg || err.message}`)
          .join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (
        error &&
        typeof error === 'object' &&
        'message' in error
      ) {
        errorMessage = (error as { message: string }).message;
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePatient = async () => {
    if (
      !newPatientData.firstName ||
      !newPatientData.lastName ||
      !newPatientData.phone ||
      !newPatientData.dateOfBirth
    ) {
      return;
    }
    const createdPatient = await createPatient(newPatientData);
    if (createdPatient) {
      setValue('patientId', createdPatient._id);
      setCreatePatientOpen(false);
      setNewPatientData({
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        email: '',
      });
    }
  };

  const handleCloseCreatePatient = () => {
    setCreatePatientOpen(false);
    setNewPatientData({
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      email: '',
    });
  };

  const getFieldsForStep = (step: number): (keyof CaseIntakeFormData)[] => {
    switch (step) {
      case 0:
        return ['patientId'];
      case 1:
        return ['symptoms'];
      case 2:
        return ['medicalHistory'];
      case 3:
        return ['consent'];
      default:
        return [];
    }
  };

  const getSortedPatients = () => {
    const selectedPatientId = watch('patientId');
    if (!selectedPatientId) {
      return patients;
    }
    const selectedPatient = patients.find((p) => p._id === selectedPatientId);
    const otherPatients = patients.filter((p) => p._id !== selectedPatientId);
    return selectedPatient ? [selectedPatient, ...otherPatients] : patients;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Patient Selection</h3>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchPatients()}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/patients?for=diagnostics')}
                >
                  Select from Patients
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCreatePatientOpen(true)}
                >
                  <AddIcon className="mr-2 h-4 w-4" /> New Patient
                </Button>
              </div>
            </div>
            {watch('patientId') && (
              <Alert variant="default">
                <AlertTitle>Selected Patient</AlertTitle>
                <AlertDescription>
                  {(() => {
                    const selectedPatient = patients.find(
                      (p) => p._id === watch('patientId')
                    );
                    return selectedPatient
                      ? `${selectedPatient.firstName} ${selectedPatient.lastName} - DOB: ${selectedPatient.dateOfBirth}`
                      : 'Loading patient details...';
                  })()}
                </AlertDescription>
              </Alert>
            )}
            <Controller
              name="patientId"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Select Patient</Label>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Patients</SelectLabel>
                        {loading ? (
                          <SelectItem value="loading" disabled>
                            Loading patients...
                          </SelectItem>
                        ) : patients.length === 0 ? (
                          <SelectItem value="no-patients" disabled>
                            No patients found. Please add patients first.
                          </SelectItem>
                        ) : (
                          getSortedPatients().map((patient) => (
                            <SelectItem key={patient._id} value={patient._id}>
                              {patient.firstName} {patient.lastName} - DOB:{' '}
                              {patient.dateOfBirth}
                            </SelectItem>
                          ))
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.patientId && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.patientId.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Symptom Assessment</h3>
            <div className="grid grid-cols-1 gap-4">
              <Controller
                name="symptoms.subjective"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Subjective Symptoms</Label>
                    <Input
                      {...field}
                      placeholder="Describe the patient's reported symptoms in detail..."
                    />
                    {errors.symptoms?.subjective && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.symptoms.subjective.message}
                      </p>
                    )}
                  </div>
                )}
              />
              <Controller
                name="symptoms.objective"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Objective Symptoms (Optional)</Label>
                    <Input
                      {...field}
                      placeholder="Document observable signs and clinical findings..."
                    />
                  </div>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Controller
                  name="symptoms.duration"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input {...field} placeholder="e.g., 3 days, 2 weeks" />
                    </div>
                  )}
                />
                <Controller
                  name="symptoms.severity"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="severe">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <Controller
                  name="symptoms.onset"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Onset</Label>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select onset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acute">Acute</SelectItem>
                          <SelectItem value="chronic">Chronic</SelectItem>
                          <SelectItem value="subacute">Subacute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Vital Signs & Medical History</h3>
            <div className="grid grid-cols-1 gap-4">
              <Controller
                name="medicalHistory"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Medical History</Label>
                    <Input
                      {...field}
                      placeholder="Document patient's medical history, past illnesses, surgeries, family history, etc..."
                    />
                    {errors.medicalHistory && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.medicalHistory.message}
                      </p>
                    )}
                  </div>
                )}
              />
              <Controller
                name="allergies"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>Allergies (Optional)</Label>
                    <Input {...field} placeholder="List any known allergies..." />
                  </div>
                )}
              />
              <div>
                <h4 className="font-medium">Vital Signs (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Controller
                    name="vitals.bloodPressure"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Blood Pressure</Label>
                        <Input {...field} placeholder="e.g., 120/80" />
                      </div>
                    )}
                  />
                  <Controller
                    name="vitals.heartRate"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Heart Rate (bpm)</Label>
                        <Input
                          {...field}
                          type="number"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="vitals.temperature"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Temperature (°C)</Label>
                        <Input
                          {...field}
                          type="number"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="vitals.bloodGlucose"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Blood Glucose (mg/dL)</Label>
                        <Input
                          {...field}
                          type="number"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name="vitals.respiratoryRate"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Respiratory Rate (breaths/min)</Label>
                        <Input
                          {...field}
                          type="number"
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Review & Submit</h3>
            <Alert>
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>
                Please review the information below and provide consent for AI
                analysis.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Selected Patient:</span>{' '}
                <span className="text-muted-foreground">
                  {watch('patientId')
                    ? (() => {
                        const selectedPatient = patients.find(
                          (p) => p._id === watch('patientId')
                        );
                        return selectedPatient
                          ? `${selectedPatient.firstName} ${selectedPatient.lastName} - DOB: ${selectedPatient.dateOfBirth}`
                          : 'Patient not found';
                      })()
                    : 'None selected'}
                </span>
              </div>
              <div>
                <span className="font-medium">Subjective Symptoms:</span>{' '}
                <span className="text-muted-foreground">
                  {watch('symptoms.subjective') || 'None specified'}
                </span>
              </div>
              {watch('symptoms.objective') && (
                <div>
                  <span className="font-medium">Objective Symptoms:</span>{' '}
                  <span className="text-muted-foreground">
                    {watch('symptoms.objective')}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium">Medical History:</span>{' '}
                <span className="text-muted-foreground">
                  {watch('medicalHistory') || 'None specified'}
                </span>
              </div>
            </div>
            <Controller
              name="consent"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consent"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="consent">
                    I consent to AI-powered diagnostic analysis of this case
                  </Label>
                </div>
              )}
            />
            {errors.consent && (
              <p className="text-sm font-medium text-destructive">
                {errors.consent.message}
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowBackIcon className="h-4 w-4" />
          </Button>
          <div className="ml-4">
            <h2 className="text-xl font-semibold">New Diagnostic Case</h2>
            <p className="text-sm text-muted-foreground">
              Complete the form to create a new diagnostic case
            </p>
          </div>
        </div>
        <Progress value={(activeStep / (STEPS.length - 1)) * 100} className="mb-4" />
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {STEPS.map((step, index) => (
                      <button
                        key={step.label}
                        type="button"
                        className={`w-full text-left p-2 rounded-md ${
                          activeStep === index
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setActiveStep(index)}
                      >
                        <p className="font-medium">{step.label}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-4">
                  {renderStepContent()}
                </CardContent>
                <div className="p-4 border-t flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={activeStep === 0}
                  >
                    Back
                  </Button>
                  {activeStep === STEPS.length - 1 ? (
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-muted-foreground">
                        AI analysis may take up to 60 seconds to complete
                      </p>
                      <Button
                        type="submit"
                        disabled={!watch('consent') || submitting}
                      >
                        {submitting
                          ? 'Submitting for AI Analysis...'
                          : 'Submit for AI Analysis'}
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" onClick={handleNext}>
                      Next
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
      <Dialog open={createPatientOpen} onOpenChange={setCreatePatientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Patient</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={newPatientData.firstName}
                onChange={(e) =>
                  setNewPatientData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={newPatientData.lastName}
                onChange={(e) =>
                  setNewPatientData((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={newPatientData.phone}
                onChange={(e) =>
                  setNewPatientData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={newPatientData.dateOfBirth}
                onChange={(e) =>
                  setNewPatientData((prev) => ({
                    ...prev,
                    dateOfBirth: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={newPatientData.email}
                onChange={(e) =>
                  setNewPatientData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreatePatient}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePatient}
              disabled={
                createLoading ||
                !newPatientData.firstName ||
                !newPatientData.lastName ||
                !newPatientData.phone ||
                !newPatientData.dateOfBirth
              }
            >
              {createLoading ? 'Creating...' : 'Create Patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
};

const CaseIntakePageWithGuard: React.FC = () => (
  <DiagnosticFeatureGuard>
    <CaseIntakePage />
  </DiagnosticFeatureGuard>
);

export default CaseIntakePageWithGuard;