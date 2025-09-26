import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErrorHandler } from './useErrorHandler';
import { CaseFormData } from './useDiagnosticApi';

// Define form schema with Zod
const caseSchema = z.object({
    patientId: z.string().min(1, 'Patient selection is required'),
    patientName: z.string().optional(),
    symptoms: z.object({
        subjective: z.string().min(1, 'Subjective symptoms are required'),
        duration: z.string().min(1, 'Duration is required'),
        severity: z.enum(['mild', 'moderate', 'severe']),
        onset: z.enum(['sudden', 'gradual', 'intermittent']),
        aggravatingFactors: z.string().optional(),
        relievingFactors: z.string().optional(),
    }),
    currentMedications: z.array(
        z.object({
            name: z.string().optional(),
            dosage: z.string().optional(),
            frequency: z.string().optional(),
        })
    ),
    allergies: z.array(z.string()),
    medicalConditions: z.object({
        chronicIllnesses: z.string().optional(),
        pastSurgeries: z.string().optional(),
        familyHistory: z.string().optional(),
        lifestyleFactors: z.string().optional(),
    }),
});

// Define steps
export const STEPS = [
    'Patient Selection',
    'Symptom Assessment',
    'Medical History',
    'Review & Submit',
];

interface UseDiagnosticFormProps {
    onSubmit: (data: CaseFormData) => void;
    patients: any[];
    urlPatientId?: string;
}

export const useDiagnosticForm = ({ onSubmit, patients, urlPatientId }: UseDiagnosticFormProps) => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [patientName, setPatientName] = useState('');
    const { handleFormError } = useErrorHandler();

    // Initialize form
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isValid, isDirty },
    } = useForm<CaseFormData>({
        resolver: zodResolver(caseSchema),
        defaultValues: {
            patientId: '',
            patientName: '',
            symptoms: {
                subjective: '',
                duration: '',
                severity: 'moderate',
                onset: 'gradual',
                aggravatingFactors: '',
                relievingFactors: '',
            },
            currentMedications: [],
            allergies: [],
            medicalConditions: {
                chronicIllnesses: '',
                pastSurgeries: '',
                familyHistory: '',
                lifestyleFactors: '',
            },
        },
        mode: 'onChange',
    });

    // Medication field array
    const {
        fields: medicationFields,
        append: appendMedication,
        remove: removeMedication,
    } = useFieldArray({
        control,
        name: 'currentMedications',
    });

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
    }, [watch('patientId'), patients, setValue]);

    // Handle patient creation
    const handlePatientCreated = (patient: any) => {
        setValue('patientId', patient._id);
        setValue('patientName', `${patient.firstName} ${patient.lastName}`);
        setSelectedPatient(patient);
        setPatientName(`${patient.firstName} ${patient.lastName}`);
    };

    // Navigation handlers
    const handleNext = () => {
        // Validate current step before proceeding
        let isValid = true;
        let errorMessage = '';

        switch (activeStep) {
            case 0:
                if (!watch('patientId')) {
                    isValid = false;
                    errorMessage = 'Please select a patient';
                }
                break;
            case 1:
                if (!watch('symptoms.subjective')) {
                    isValid = false;
                    errorMessage = 'Please provide subjective symptoms';
                }
                if (!watch('symptoms.duration')) {
                    isValid = false;
                    errorMessage = 'Please provide symptom duration';
                }
                break;
            default:
                break;
        }

        if (!isValid) {
            handleFormError({ general: errorMessage });
            return;
        }

        if (activeStep < STEPS.length - 1) {
            setActiveStep(activeStep + 1);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    // Check if current step is valid
    const isStepValid = () => {
        switch (activeStep) {
            case 0:
                return !!watch('patientId');
            case 1:
                return (
                    !!watch('symptoms.subjective') &&
                    !!watch('symptoms.duration') &&
                    !!watch('symptoms.severity') &&
                    !!watch('symptoms.onset')
                );
            default:
                return true;
        }
    };

    // Handle form submission
    const handleSubmitForm = (data: CaseFormData) => {
        onSubmit(data);
    };

    // Medication management
    const addMedication = () => {
        appendMedication({ name: '', dosage: '', frequency: '' });
    };

    // Allergy management
    const addAllergy = (allergy: string, allergies: string[]) => {
        if (allergy.trim()) {
            setValue('allergies', [...allergies, allergy.trim()]);
        }
    };

    const removeAllergy = (index: number, allergies: string[]) => {
        const newAllergies = [...allergies];
        newAllergies.splice(index, 1);
        setValue('allergies', newAllergies);
    };

    return {
        // Form state
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isValid, isDirty },

        // Step state
        activeStep,
        setActiveStep,

        // Patient state
        selectedPatient,
        patientName,

        // Medication state
        medicationFields,
        appendMedication,
        removeMedication,

        // Actions
        handleNext,
        handleBack,
        isStepValid,
        handleSubmitForm,
        handlePatientCreated,
        addMedication,
        addAllergy,
        removeAllergy,
    };
};