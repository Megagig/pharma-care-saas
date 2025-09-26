import { Controller, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus as PlusIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PatientSelectionStepProps {
    onCreatePatientClick: () => void;
    onViewPatientsClick: () => void;
    onRefreshPatients: () => void;
    loading: boolean;
    patients: any[];
}

const PatientSelectionStep: React.FC<PatientSelectionStepProps> = ({
    onCreatePatientClick,
    onViewPatientsClick,
    onRefreshPatients,
    loading,
    patients,
}) => {
    const { control, watch } = useFormContext();
    const navigate = useNavigate();

    // Helper function to sort patients with selected patient first
    const getSortedPatients = () => {
        const selectedPatientId = watch('patientId');
        if (!selectedPatientId) {
            return patients;
        }
        const selectedPatient = patients.find((p) => p._id === selectedPatientId);
        const otherPatients = patients.filter((p) => p._id !== selectedPatientId);
        return selectedPatient ? [selectedPatient, ...otherPatients] : patients;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Patient Selection</h3>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={onRefreshPatients}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                    <Button
                        size="sm"
                        onClick={onViewPatientsClick}
                    >
                        Select from Patients
                    </Button>
                    <Button
                        size="sm"
                        onClick={onCreatePatientClick}
                    >
                        <PlusIcon className="mr-1 h-4 w-4" />
                        New Patient
                    </Button>
                </div>
            </div>

            {watch('patientId') && (
                <div className="mb-2 p-2 bg-green-100 rounded-md">
                    <p className="font-bold text-green-800">
                        Selected Patient:
                    </p>
                    <p>
                        {(() => {
                            const selectedPatient = patients.find(
                                (p) => p._id === watch('patientId')
                            );
                            return selectedPatient
                                ? `${selectedPatient.firstName} ${selectedPatient.lastName} - DOB: ${selectedPatient.dateOfBirth}`
                                : 'Loading patient details...';
                        })()}
                    </p>
                </div>
            )}

            <Controller
                name="patientId"
                control={control}
                render={({ field, fieldState: { error } }) => (
                    <div className="w-full">
                        <label htmlFor="patient-select">Select Patient</label>
                        <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a patient" />
                            </SelectTrigger>
                            <SelectContent>
                                {loading ? (
                                    <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                                ) : patients.length === 0 ? (
                                    <SelectItem value="none" disabled>No patients found. Please add patients first.</SelectItem>
                                ) : (
                                    getSortedPatients().map((patient, index) => (
                                        <SelectItem key={patient._id} value={patient._id}>
                                            {index === 0 &&
                                                watch('patientId') === patient._id && (
                                                    <span className="mr-1">✓</span>
                                                )}
                                            {patient.firstName} {patient.lastName} - DOB:{' '}
                                            {patient.dateOfBirth}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {error && (
                            <p className="text-red-500 text-sm">
                                {error.message}
                            </p>
                        )}
                        {!loading && patients.length === 0 && (
                            <div className="mt-2 p-2 border border-gray-300 rounded-md">
                                <p className="text-gray-600 text-sm">
                                    No patients found. You can:
                                </p>
                                <div className="flex gap-1 mt-1">
                                    <Button
                                        size="sm"
                                        onClick={() => navigate('/patients?for=diagnostics')}
                                    >
                                        Select from Patients
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={onCreatePatientClick}
                                    >
                                        <PlusIcon className="mr-1 h-4 w-4" />
                                        Create New Patient
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            />
        </div>
    );
};

export default PatientSelectionStep;