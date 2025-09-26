import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ReviewSubmitStepProps {
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({ onSubmit, isSubmitting }) => {
    const { watch, formState: { errors } } = useFormContext();

    const formData = watch();

    // Check if form has errors
    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>

            {hasErrors && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <div className="flex items-center text-red-700">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Please correct the errors before submitting</span>
                    </div>
                </div>
            )}

            {/* Patient Information */}
            <Card className="mb-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                    {formData.patientId ? (
                        <div>
                            <p className="font-medium">{formData.patientName}</p>
                            <p className="text-sm text-gray-600">ID: {formData.patientId}</p>
                        </div>
                    ) : (
                        <p className="text-red-500">No patient selected</p>
                    )}
                </CardContent>
            </Card>

            {/* Symptoms */}
            <Card className="mb-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Symptoms</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600">Subjective Symptoms</p>
                        <p>{formData.symptoms.subjective || 'Not provided'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Duration</p>
                            <p>{formData.symptoms.duration || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Severity</p>
                            <Badge variant={formData.symptoms.severity === 'severe' ? 'destructive' : 'secondary'}>
                                {formData.symptoms.severity || 'Not provided'}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Onset</p>
                            <p>{formData.symptoms.onset || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Aggravating Factors</p>
                            <p>{formData.symptoms.aggravatingFactors || 'Not provided'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Medical History */}
            <Card className="mb-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Current Medications */}
                    <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600 mb-1">Current Medications</p>
                        {formData.currentMedications && formData.currentMedications.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {formData.currentMedications.map((med: any, index: number) => (
                                    <li key={index}>
                                        {med.name} - {med.dosage} ({med.frequency})
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">No medications recorded</p>
                        )}
                    </div>

                    {/* Allergies */}
                    <div className="mb-3">
                        <p className="text-sm font-medium text-gray-600 mb-1">Known Allergies</p>
                        {formData.allergies && formData.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {formData.allergies.map((allergy: string, index: number) => (
                                    <Badge key={index} variant="outline">{allergy}</Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No allergies recorded</p>
                        )}
                    </div>

                    {/* Medical Conditions */}
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Medical Conditions</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-gray-500">Chronic Illnesses</p>
                                <p className="text-sm">{formData.medicalConditions.chronicIllnesses || 'None'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Past Surgeries</p>
                                <p className="text-sm">{formData.medicalConditions.pastSurgeries || 'None'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Family History</p>
                                <p className="text-sm">{formData.medicalConditions.familyHistory || 'None'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Lifestyle Factors</p>
                                <p className="text-sm">{formData.medicalConditions.lifestyleFactors || 'None'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
                <Button
                    type="submit"
                    onClick={onSubmit}
                    disabled={isSubmitting || hasErrors}
                    className="flex items-center"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Submit for Analysis
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default ReviewSubmitStep;