import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

interface MedicalHistoryStepProps {
    // Add any props if needed
}

const MedicalHistoryStep: React.FC<MedicalHistoryStepProps> = () => {
    const { control, watch, setValue } = useFormContext();

    // Medication management
    const medications = watch('currentMedications') || [];

    const addMedication = () => {
        setValue('currentMedications', [
            ...medications,
            { name: '', dosage: '', frequency: '' }
        ]);
    };

    const removeMedication = (index: number) => {
        const newMedications = [...medications];
        newMedications.splice(index, 1);
        setValue('currentMedications', newMedications);
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const newMedications = [...medications];
        newMedications[index] = { ...newMedications[index], [field]: value };
        setValue('currentMedications', newMedications);
    };

    // Allergy management
    const allergies = watch('allergies') || [];
    const [newAllergy, setNewAllergy] = React.useState('');

    const addAllergy = () => {
        if (newAllergy.trim()) {
            setValue('allergies', [...allergies, newAllergy.trim()]);
            setNewAllergy('');
        }
    };

    const removeAllergy = (index: number) => {
        const newAllergies = [...allergies];
        newAllergies.splice(index, 1);
        setValue('allergies', newAllergies);
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Medical History</h3>

            {/* Current Medications */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Current Medications</h4>
                        <Button
                            type="button"
                            size="sm"
                            onClick={addMedication}
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Medication
                        </Button>
                    </div>

                    {medications.length === 0 ? (
                        <p className="text-gray-500 text-sm">No medications added</p>
                    ) : (
                        <div className="space-y-3">
                            {medications.map((med: any, index: number) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-5">
                                        <Input
                                            value={med.name}
                                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                            placeholder="Medication name"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            value={med.dosage}
                                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                            placeholder="Dosage"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Input
                                            value={med.frequency}
                                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                            placeholder="Frequency"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeMedication(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Allergies */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Known Allergies</h4>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <Input
                            value={newAllergy}
                            onChange={(e) => setNewAllergy(e.target.value)}
                            placeholder="Add an allergy"
                            onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                        />
                        <Button
                            type="button"
                            onClick={addAllergy}
                            disabled={!newAllergy.trim()}
                        >
                            Add
                        </Button>
                    </div>

                    {allergies.length === 0 ? (
                        <p className="text-gray-500 text-sm">No allergies recorded</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {allergies.map((allergy: string, index: number) => (
                                <div key={index} className="bg-gray-100 rounded-full px-3 py-1 flex items-center">
                                    <span>{allergy}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 ml-1"
                                        onClick={() => removeAllergy(index)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Medical Conditions */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <h4 className="font-medium mb-4">Medical Conditions</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Controller
                                name="medicalConditions.chronicIllnesses"
                                control={control}
                                render={({ field, fieldState: { error } }) => (
                                    <div>
                                        <Label htmlFor="chronic-illnesses">Chronic Illnesses</Label>
                                        <textarea
                                            {...field}
                                            id="chronic-illnesses"
                                            className="w-full p-2 border rounded-md"
                                            rows={3}
                                            placeholder="List any chronic conditions..."
                                        />
                                        {error && (
                                            <p className="text-red-500 text-sm">{error.message}</p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        <div>
                            <Controller
                                name="medicalConditions.pastSurgeries"
                                control={control}
                                render={({ field, fieldState: { error } }) => (
                                    <div>
                                        <Label htmlFor="past-surgeries">Past Surgeries</Label>
                                        <textarea
                                            {...field}
                                            id="past-surgeries"
                                            className="w-full p-2 border rounded-md"
                                            rows={3}
                                            placeholder="List any past surgeries..."
                                        />
                                        {error && (
                                            <p className="text-red-500 text-sm">{error.message}</p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        <div>
                            <Controller
                                name="medicalConditions.familyHistory"
                                control={control}
                                render={({ field, fieldState: { error } }) => (
                                    <div>
                                        <Label htmlFor="family-history">Family History</Label>
                                        <textarea
                                            {...field}
                                            id="family-history"
                                            className="w-full p-2 border rounded-md"
                                            rows={3}
                                            placeholder="Relevant family medical history..."
                                        />
                                        {error && (
                                            <p className="text-red-500 text-sm">{error.message}</p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        <div>
                            <Controller
                                name="medicalConditions.lifestyleFactors"
                                control={control}
                                render={({ field, fieldState: { error } }) => (
                                    <div>
                                        <Label htmlFor="lifestyle-factors">Lifestyle Factors</Label>
                                        <textarea
                                            {...field}
                                            id="lifestyle-factors"
                                            className="w-full p-2 border rounded-md"
                                            rows={3}
                                            placeholder="Smoking, alcohol, exercise, diet..."
                                        />
                                        {error && (
                                            <p className="text-red-500 text-sm">{error.message}</p>
                                        )}
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MedicalHistoryStep;