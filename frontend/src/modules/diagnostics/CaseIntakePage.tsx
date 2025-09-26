import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import PatientSelectionStep from './components/PatientSelectionStep';
import SymptomAssessmentStep from './components/SymptomAssessmentStep';
import MedicalHistoryStep from './components/MedicalHistoryStep';
import ReviewSubmitStep from './components/ReviewSubmitStep';
import { useDialogState } from '@/hooks/useDialogState';
import { useMultiStepFormValidation } from '@/hooks/useFormValidation';
import { caseFormSchema, stepSchemas, CaseFormData } from './schemas/diagnostics.schema';

// Define steps
const STEPS = [
    'Patient Selection',
    'Symptom Assessment',
    'Medical History',
    'Review & Submit',
];

const CaseIntakePage: React.FC = () => {
    const navigate = useNavigate();
    const { patientId: urlPatientId } = useParams<{ patientId: string }>();
    const location = useLocation();
    const [activeStep, setActiveStep] = useState(0);
    const [patientCreated, setPatientCreated] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [patientName, setPatientName] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [patientsLoading, setPatientsLoading] = useState(false);

    // Use the dialog state hook for patient creation dialog
    const patientDialog = useDialogState({
        onOpen: () => {
            // Reset form when opening dialog
        },
        onClose: () => {
            // Clean up when closing dialog
        },
    });

    // Use the form validation hook
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isValid, isDirty },
        isStepValid,
    } = useMultiStepFormValidation(caseFormSchema, stepSchemas);

    // Function to refetch patients
    const refetch = async () => {
        setPatientsLoading(true);
        try {
            // Mock API call - replace with actual implementation
            setTimeout(() => {
                setPatientsLoading(false);
            }, 1000);
        } catch (error) {
            setPatientsLoading(false);
            console.error('Error fetching patients:', error);
        }
    };

    // Handle URL patient parameter
    useEffect(() => {
        if (urlPatientId && patients.length > 0) {
            const patient = patients.find((p: any) => p._id === urlPatientId);
            if (patient) {
                setValue('patientId', patient._id);
                setValue('patientName', `${patient.firstName} ${patient.lastName}`);
                setSelectedPatient(patient);
                setPatientName(`${patient.firstName} ${patient.lastName}`);
            }
        }
    }, [urlPatientId, patients, setValue]);

    // Handle patient selection
    useEffect(() => {
        const patientId = watch('patientId');
        if (patientId && patients.length > 0) {
            const patient = patients.find((p: any) => p._id === patientId);
            if (patient) {
                setSelectedPatient(patient);
                setPatientName(`${patient.firstName} ${patient.lastName}`);
                setValue('patientName', `${patient.firstName} ${patient.lastName}`);

                // Pre-populate medications if available
                if (patient.currentMedications && patient.currentMedications.length > 0) {
                    setValue('currentMedications', patient.currentMedications);
                }

                // Pre-populate allergies if available
                if (patient.allergies && patient.allergies.length > 0) {
                    setValue('allergies', patient.allergies);
                }
            }
        }
    }, [watch, patients, setValue]);

    // Handle patient creation
    const handlePatientCreated = (patient: any) => {
        patientDialog.closeDialog();
        setPatientCreated(true);
        setValue('patientId', patient._id);
        setValue('patientName', `${patient.firstName} ${patient.lastName}`);
        setSelectedPatient(patient);
        setPatientName(`${patient.firstName} ${patient.lastName}`);
        toast.success('Patient created successfully');
        refetch();
    };

    // Handle form submission
    const onSubmit = (data: CaseFormData) => {
        // Mock API call - replace with actual implementation
        console.log('Submitting case:', data);
        toast.success('Case submitted successfully');
        navigate('/diagnostics');
    };

    // Navigation handlers
    const handleNext = () => {
        if (activeStep < STEPS.length - 1) {
            setActiveStep(activeStep + 1);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <PatientSelectionStep
                        onCreatePatientClick={patientDialog.openDialog}
                        onViewPatientsClick={() => navigate('/patients?for=diagnostics')}
                        onRefreshPatients={refetch}
                        loading={patientsLoading}
                        patients={patients}
                    />
                );
            case 1:
                return <SymptomAssessmentStep />;
            case 2:
                return <MedicalHistoryStep />;
            case 3:
                return (
                    <ReviewSubmitStep
                        onSubmit={handleSubmit(onSubmit)}
                        isSubmitting={false}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">New Diagnostic Case</h1>
                <p className="text-gray-600">
                    Fill out the form to create a new diagnostic case for AI analysis
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Case Intake Form</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Simple step indicator */}
                    <div className="flex justify-between mb-8">
                        {STEPS.map((label, index) => (
                            <div
                                key={index}
                                className={`flex-1 text-center ${index < activeStep ? 'text-green-600' : index === activeStep ? 'text-blue-600 font-semibold' : 'text-gray-400'
                                    }`}
                            >
                                <div className="flex items-center justify-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${index < activeStep
                                            ? 'bg-green-100 text-green-800'
                                            : index === activeStep
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {index + 1}
                                    </div>
                                    <span>{label}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Form content */}
                    <form>
                        {renderStepContent()}

                        {/* Navigation buttons */}
                        <div className="flex justify-between mt-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={activeStep === 0}
                            >
                                Back
                            </Button>

                            {activeStep < STEPS.length - 1 ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!isStepValid(activeStep)}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={!isValid}
                                >
                                    Submit Case
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Patient creation dialog */}
            <Dialog open={patientDialog.isOpen} onOpenChange={patientDialog.closeDialog}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Create New Patient</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                        <p>Patient form would go here</p>
                        <div className="flex justify-end mt-4">
                            <Button onClick={patientDialog.closeDialog}>Cancel</Button>
                            <Button className="ml-2" onClick={() => handlePatientCreated({ _id: 'new', firstName: 'New', lastName: 'Patient' })}>
                                Create Patient
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CaseIntakePage;