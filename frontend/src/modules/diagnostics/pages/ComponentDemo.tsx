
import DiagnosticFeatureGuard from '../middlewares/diagnosticFeatureGuard';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
const ComponentDemo: React.FC = () => {
  const [formData, setFormData] = useState<Partial<DiagnosticRequestForm>>({ 
    symptoms: {
      subjective: [],
      objective: [],
      duration: '',
      severity: 'mild',
      onset: 'acute'
    },
    vitals: undefined,
    currentMedications: [],
    allergies: []
  });
  const handleSymptomsChange = (
    symptoms: DiagnosticRequestForm['symptoms']
  ) => {
    setFormData((prev) => ({ ...prev, symptoms }));
  };
  const handleVitalsChange = (vitals: DiagnosticRequestForm['vitals']) => {
    setFormData((prev) => ({ ...prev, vitals }));
  };
  const handleMedicationsChange = (
    currentMedications: DiagnosticRequestForm['currentMedications']
  ) => {
    setFormData((prev) => ({ ...prev, currentMedications }));
  };
  const handleAllergiesChange = (allergies: string[]) => {
    setFormData((prev) => ({ ...prev, allergies }));
  };
  return (
    <div maxWidth="lg" className="">
      <div className="">
        <div  className="">
          Diagnostic Components Demo
        </div>
        <div  color="text.secondary">
          Interactive demonstration of the symptom input and patient assessment
          components
        </div>
      </div>
      <div container spacing={4}>
        {/* Symptom Input */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div  className="">
                1. Symptom Assessment Component
              </div>
              <SymptomInput
                value={formData.symptoms!}
                onChange={handleSymptomsChange}
              />
            </CardContent>
          </Card>
        </div>
        {/* Vital Signs Input */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div  className="">
                2. Vital Signs Component
              </div>
              <VitalSignsInput
                value={formData.vitals}
                onChange={handleVitalsChange}
              />
            </CardContent>
          </Card>
        </div>
        {/* Medication History Input */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div  className="">
                3. Medication History Component
              </div>
              <MedicationHistoryInput
                value={formData.currentMedications}
                onChange={handleMedicationsChange}
              />
            </CardContent>
          </Card>
        </div>
        {/* Allergy Input */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div  className="">
                4. Allergy Management Component
              </div>
              <AllergyInput
                value={formData.allergies}
                onChange={handleAllergiesChange}
              />
            </CardContent>
          </Card>
        </div>
        {/* Form Data Preview */}
        <div item xs={12}>
          <Card>
            <CardContent>
              <div  className="">
                Current Form Data
              </div>
              <Separator className="" />
              <div
                component="pre"
                className=""
              >
                {JSON.stringify(formData, null, 2)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
// Wrap with feature guard
const ComponentDemoWithGuard: React.FC = () => (
  <DiagnosticFeatureGuard>
    <ComponentDemo />
  </DiagnosticFeatureGuard>
);
export default ComponentDemoWithGuard;
