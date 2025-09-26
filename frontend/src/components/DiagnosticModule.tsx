import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Accordion } from '@/components/ui/accordion';
import { Tabs } from '@/components/ui/tabs';

interface Symptom {
  type: 'subjective' | 'objective';
  description: string;
}
interface LabResult {
  testName: string;
  value: string;
  referenceRange: string;
  abnormal: boolean;
}
interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
}
interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}
interface DiagnosticAnalysis {
  caseId: string;
  analysis: {
    differentialDiagnoses: Array<{
      condition: string;
      probability: number;
      reasoning: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendedTests: Array<{
      testName: string;
      priority: 'urgent' | 'routine' | 'optional';
      reasoning: string;
    }>;
    therapeuticOptions: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      reasoning: string;
      safetyNotes: string[];
    }>;
    redFlags: Array<{
      flag: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      action: string;
    }>;
    referralRecommendation?: {
      recommended: boolean;
      urgency: 'immediate' | 'within_24h' | 'routine';
      specialty: string;
      reason: string;
    };
    disclaimer: string;
    confidenceScore: number;
  };
  drugInteractions: unknown[];
  processingTime: number;
}
const DiagnosticModule: React.FC = () => {
  const { user } = useAuth();
  const { hasFeature } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DiagnosticAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentDialog, setConsentDialog] = useState(false);
  const [patientConsent, setPatientConsent] = useState(false);
  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientObject, setSelectedPatientObject] =
    useState<Patient | null>(null);
  // Load patients for dropdown and search
  const { data: patientsData, isLoading: patientsLoading } = usePatients({
    limit: 100
  });
  const { data: searchData, isLoading: searchLoading } =
    useSearchPatients(patientSearchQuery);
  const patients = patientsData?.data?.results || [];
  const searchResults = searchData?.data?.results || [];
  // Combine regular patients with search results
  const availablePatients =
    patientSearchQuery.length >= 2 ? searchResults : patients;
  // Form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [symptoms, setSymptoms] = useState<Symptom[]>([
    { type: 'subjective', description: '' },
  ]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>(
    'mild'
  );
  const [onset, setOnset] = useState<'acute' | 'chronic' | 'subacute'>('acute');
  // Check feature access - super_admin bypasses feature flag checks
  const isSuperAdmin = user?.role === 'super_admin';
  const hasAccess = isSuperAdmin || hasFeature('clinical_decision_support');
  if (!hasAccess) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Clinical Decision Support feature is not available in your current
            plan. Please upgrade to access AI-powered diagnostic assistance.
          </Alert>
        </CardContent>
      </Card>
    );
  }
  const addSymptom = (type: 'subjective' | 'objective') => {
    setSymptoms([...symptoms, { type, description: '' }]);
  };
  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };
  const updateSymptom = (index: number, description: string) => {
    const updated = [...symptoms];
    updated[index].description = description;
    setSymptoms(updated);
  };
  const addLabResult = () => {
    setLabResults([
      ...labResults,
      { testName: '', value: '', referenceRange: '', abnormal: false },
    ]);
  };
  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', frequency: '', startDate: '' },
    ]);
  };
  const handleAnalysis = async () => {
    if (!patientConsent) {
      setConsentDialog(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiHelpers.post('/diagnostics/ai', {
        patientId: selectedPatient,
        symptoms: {
          subjective: symptoms
            .filter((s) => s.type === 'subjective')
            .map((s) => s.description)
            .filter(Boolean),
          objective: symptoms
            .filter((s) => s.type === 'objective')
            .map((s) => s.description)
            .filter(Boolean),
          duration,
          severity,
          onset,
        },
        labResults: labResults.filter((lr) => lr.testName && lr.value),
        currentMedications: medications.filter((m) => m.name && m.dosage),
        vitalSigns,
        patientConsent: {
          provided: true,
          method: 'electronic'
        }
      };
      setAnalysis(response.data.data);
      setActiveTab(1); // Switch to results tab
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  const renderInputForm = () => (
    <div container spacing={3}>
      {/* Patient Selection with Search */}
      <div item xs={12}>
        <Autocomplete
          fullWidth
          options={availablePatients}
          getOptionLabel={(patient: Patient) =>
            `${patient.displayName || `${patient.firstName} ${patient.lastName}`} - ${patient.mrn}${patient.age ? ` (${patient.age} years)` : ''}`
          }
          value={selectedPatientObject}

          inputValue={patientSearchQuery}

          loading={patientsLoading || searchLoading}
          filterOptions={(x) => x} // Disable client-side filtering since we're using server-side search
          renderInput={(params) => (
            <Input}
          {...params}
          label="Search and Select Patient"
          placeholder="Type patient name, MRN, or phone number..."
          required
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>{patientsLoading || searchLoading ? (}
                <Spinner color="inherit" size={20} />
                    ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
            />
          )}
        renderOption={(props, patient: Patient) => (}
        <div component="li" {...props}>
          <div>
            <div >
              {patient.displayName ||
                `${patient.firstName} ${patient.lastName}`}
            </div>
            <div color="text.secondary">
              MRN: {patient.mrn} {patient.age && `• Age: ${patient.age}`}{' '}
              {patient.phone && `• ${patient.phone}`}
            </div>
          </div>
        </div>
          )}
        noOptionsText={
          patientSearchQuery.length < 2
            ? 'Type at least 2 characters to search patients'
            : 'No patients found'}
          }
        />
        {availablePatients.length === 0 &&
          !patientsLoading &&
          !searchLoading &&
          patientSearchQuery.length < 2 && (
            <div

              color="text.secondary"
              className=""
            >
              No patients found. Please add patients to the system first.
            </div>
          )}
      </div>
      {/* Symptoms */}
      <div item xs={12}>
        <div gutterBottom>
          Symptoms
        </div>
        {symptoms.map((symptom, index) => (
          <div
            key={index}
            className=""
          >
            <Chip
              label={symptom.type === 'subjective' ? 'Subjective' : 'Objective'}
              color={symptom.type === 'subjective' ? 'primary' : 'secondary'}
              size="small"
            />
            <Input
              fullWidth
              placeholder={`Enter ${symptom.type} symptom`}
              value={symptom.description}
              onChange={(e) => updateSymptom(index, e.target.value)}
            />
            <IconButton onClick={() => removeSymptom(index)} size="small">
              <RemoveIcon />
            </IconButton>
          </div>
        ))}
        <div className="">
          <Button
            startIcon={<AddIcon />}
            onClick={() => addSymptom('subjective')}
            size="small"
          >
            Add Subjective
          </Button>
          <Button
            startIcon={<AddIcon />}
            onClick={() => addSymptom('objective')}
            size="small"
          >
            Add Objective
          </Button>
        </div>
      </div>
      {/* Clinical Details */}
      <div item xs={12} md={4}>
        <Input
          fullWidth
          label="Duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="e.g., 3 days, 2 weeks"
        />
      </div>
      <div item xs={12} md={4}>
        <div fullWidth>
          <Label>Severity</Label>
          <Select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as 'mild' | 'moderate' | 'severe')}
          >
            <MenuItem value="mild">Mild</MenuItem>
            <MenuItem value="moderate">Moderate</MenuItem>
            <MenuItem value="severe">Severe</MenuItem>
          </Select>
        </div>
      </div>
      <div item xs={12} md={4}>
        <div fullWidth>
          <Label>Onset</Label>
          <Select
            value={onset}
            onChange={(e) => setOnset(e.target.value as 'acute' | 'chronic' | 'subacute')}
          >
            <MenuItem value="acute">Acute</MenuItem>
            <MenuItem value="chronic">Chronic</MenuItem>
            <MenuItem value="subacute">Subacute</MenuItem>
          </Select>
        </div>
      </div>
      {/* Vital Signs */}
      <div item xs={12}>
        <div gutterBottom>
          Vital Signs
        </div>
        <div container spacing={2}>
          <div item xs={6} md={3}>
            <Input
              fullWidth
              label="Blood Pressure"
              value={vitalSigns.bloodPressure || ''}
              onChange={(e) =>}
              setVitalSigns({...vitalSigns, bloodPressure: e.target.value })
              }
            placeholder="120/80"
            />
          </div>
          <div item xs={6} md={3}>
            <Input
              fullWidth
              label="Heart Rate"
              type="number"
              value={vitalSigns.heartRate || ''}
              onChange={(e) =>
                setVitalSigns({
                  ...vitalSigns
                }
                  heartRate: Number(e.target.value),}
                })
              }
            placeholder="BPM"
            />
          </div>
          <div item xs={6} md={3}>
            <Input
              fullWidth
              label="Temperature"
              type="number"
              value={vitalSigns.temperature || ''}
              onChange={(e) =>
                setVitalSigns({
                  ...vitalSigns
                }
                  temperature: Number(e.target.value),}
                })
              }
            placeholder="°C"
            />
          </div>
          <div item xs={6} md={3}>
            <Input
              fullWidth
              label="O2 Saturation"
              type="number"
              value={vitalSigns.oxygenSaturation || ''}
              onChange={(e) =>
                setVitalSigns({
                  ...vitalSigns
                }
                  oxygenSaturation: Number(e.target.value),}
                })
              }
            placeholder="%"
            />
          </div>
        </div>
      </div>
      {/* Generate Analysis Button */}
      <div item xs={12}>
        <div className="">
          <Button

            size="large"
            startIcon={ }
            loading ? <Spinner size={20} /> : <PsychologyIcon />
            }
          onClick={handleAnalysis}
          disabled={
            loading ||
            !selectedPatient ||
            symptoms.filter((s) => s.description).length === 0}
            }
          >
          {loading ? 'Generating Analysis...' : 'Generate AI Analysis'}
        </Button>
      </div>
    </div>
    </div >
  );
const renderAnalysisResults = () => {
  if (!analysis) return null;
  return (
    <div>
      <Alert severity="info" className="">
        Analysis completed in {analysis.processingTime}ms with confidence
        score: {analysis.analysis.confidenceScore}%
      </Alert>
      {/* Differential Diagnoses */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div className="">
            <HospitalIcon />
            <div >Differential Diagnoses</div>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {analysis.analysis.differentialDiagnoses.map(
              (diagnosis, index) => (
                <div key={index}>
                  <div
                    primary={
                      <div
                        className=""
                      >
                        <div >}
                          {diagnosis.condition}
                        </div>
                        <Chip
                          label={`${diagnosis.probability}%`}
                          color={
                            diagnosis.probability > 70
                              ? 'error'
                              : diagnosis.probability > 40
                                ? 'warning'
                                : 'success'}
                            }
                        size="small"
                          />
                        <Chip
                          label={diagnosis.severity}
                          color={
                            diagnosis.severity === 'high'
                              ? 'error'
                              : diagnosis.severity === 'medium'
                                ? 'warning'
                                : 'info'}
                            }
                        size="small"
                          />
                      </div>
                    }
                    secondary={diagnosis.reasoning}
                  />
                </div>
              )
            )}
          </List>
        </AccordionDetails>
      </Accordion>
      {/* Red Flags */}
      {analysis.analysis.redFlags.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div className="">
              <WarningIcon color="error" />
              <div >Red Flags</div>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {analysis.analysis.redFlags.map((flag, index) => (
                <div key={index}>
                  <div
                    primary={
                      <div
                        className=""
                      >
                        <div >}
                          {flag.flag}
                        </div>
                        <Chip
                          label={flag.severity}
                          color={
                            flag.severity === 'critical'
                              ? 'error'
                              : flag.severity === 'high'
                                ? 'warning'
                                : 'info'}
                            }
                        size="small"
                          />
                      </div>
                    }
                    secondary={flag.action}
                  />
                </div>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
      {/* Recommended Tests */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div className="">
            <ScienceIcon />
            <div >Recommended Tests</div>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {analysis.analysis.recommendedTests.map((test, index) => (
              <div key={index}>
                <div
                  primary={
                    <div
                      className=""
                    >
                      <div >}
                        {test.testName}
                      </div>
                      <Chip
                        label={test.priority}
                        color={
                          test.priority === 'urgent'
                            ? 'error'
                            : test.priority === 'routine'
                              ? 'warning'
                              : 'info'}
                          }
                      size="small"
                        />
                    </div>
                  }
                  secondary={test.reasoning}
                />
              </div>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
      {/* Therapeutic Options */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div className="">
            <MedicationIcon />
            <div >Therapeutic Options</div>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            {analysis.analysis.therapeuticOptions.map((option, index) => (
              <div key={index}>
                <div
                  primary={`${option.medication} - ${option.dosage}, ${option.frequency}`}
                  secondary={
                    <div>
                      <div >}
                        {option.reasoning}
                      </div>
                      {option.safetyNotes.length > 0 && (
                        <div className="">
                          <div color="error">
                            Safety Notes:
                          </div>
                          {option.safetyNotes.map((note, i) => (
                            <div
                              key={i}

                              display="block"
                              color="error"
                            >
                              • {note}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
      {/* Disclaimer */}
      <Alert severity="warning" className="">
        {analysis.analysis.disclaimer}
      </Alert>
    </div>
  );
};
return (
  <div>
    {error && (
      <Alert severity="error" className="" onClose={() => setError(null)}>
        {error}
      </Alert>
    )}
    <Tabs
      value={activeTab}
      onChange={(_, newValue) => setActiveTab(newValue)}
      className=""
    >
      <Tab label="Input Data" />
      <Tab label="AI Analysis" disabled={!analysis} />
    </Tabs>
    {activeTab === 0 && (
      <Card>
        <CardContent>
          <div gutterBottom>
            Clinical Data Input
          </div>
          {renderInputForm()}
        </CardContent>
      </Card>
    )}
    {activeTab === 1 && (
      <Card>
        <CardContent>
          <div gutterBottom>
            AI Diagnostic Analysis
          </div>
          {renderAnalysisResults()}
        </CardContent>
      </Card>
    )}
    {/* Patient Consent Dialog */}
    <Dialog open={consentDialog} onClose={() => setConsentDialog(false)}>
      <DialogTitle>Patient Consent Required</DialogTitle>
      <DialogContent>
        <div>
          AI diagnostic analysis requires patient consent for data processing.
          Please ensure the patient has provided informed consent before
          proceeding.
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConsentDialog(false)}>Cancel</Button>
        <Button


        >
          Patient Consents - Proceed
        </Button>
      </DialogActions>
    </Dialog>
  </div>
);
};
export default DiagnosticModule;
