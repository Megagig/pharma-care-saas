import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SymptomAssessmentStepProps {
    // Add any props if needed
}

const SymptomAssessmentStep: React.FC<SymptomAssessmentStepProps> = () => {
    const { control } = useFormContext();

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Symptom Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subjective Symptoms - Large text area at top */}
                <div className="md:col-span-2">
                    <Controller
                        name="symptoms.subjective"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <div>
                                <Label htmlFor="subjective-symptoms">Subjective Symptoms</Label>
                                <textarea
                                    {...field}
                                    id="subjective-symptoms"
                                    className="w-full p-2 border rounded-md"
                                    rows={4}
                                    placeholder="Describe the patient's symptoms in detail..."
                                />
                                {error && (
                                    <p className="text-red-500 text-sm">{error.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Duration */}
                <div>
                    <Controller
                        name="symptoms.duration"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <div>
                                <Label htmlFor="symptom-duration">Duration</Label>
                                <Input
                                    {...field}
                                    id="symptom-duration"
                                    placeholder="e.g., 3 days, 2 weeks"
                                />
                                {error && (
                                    <p className="text-red-500 text-sm">{error.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Severity */}
                <div>
                    <Controller
                        name="symptoms.severity"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <div>
                                <Label htmlFor="symptom-severity">Severity</Label>
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
                                {error && (
                                    <p className="text-red-500 text-sm">{error.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Onset */}
                <div>
                    <Controller
                        name="symptoms.onset"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <div>
                                <Label htmlFor="symptom-onset">Onset</Label>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select onset" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sudden">Sudden</SelectItem>
                                        <SelectItem value="gradual">Gradual</SelectItem>
                                        <SelectItem value="intermittent">Intermittent</SelectItem>
                                    </SelectContent>
                                </Select>
                                {error && (
                                    <p className="text-red-500 text-sm">{error.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Aggravating Factors */}
                <div>
                    <Controller
                        name="symptoms.aggravatingFactors"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <div>
                                <Label htmlFor="aggravating-factors">Aggravating Factors</Label>
                                <Input
                                    {...field}
                                    id="aggravating-factors"
                                    placeholder="What makes the symptoms worse?"
                                />
                                {error && (
                                    <p className="text-red-500 text-sm">{error.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>

                {/* Relieving Factors */}
                <div>
                    <Controller
                        name="symptoms.relievingFactors"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <div>
                                <Label htmlFor="relieving-factors">Relieving Factors</Label>
                                <Input
                                    {...field}
                                    id="relieving-factors"
                                    placeholder="What makes the symptoms better?"
                                />
                                {error && (
                                    <p className="text-red-500 text-sm">{error.message}</p>
                                )}
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default SymptomAssessmentStep;