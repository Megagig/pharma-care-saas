import { Button, Tooltip, Spinner, Alert, AlertTitle, Accordion } from '@/components/ui/button';

interface InteractionAlertsProps {
  medications: DiagnosticResult['medicationSuggestions'];
  patientAllergies?: string[];
  patientConditions?: string[];
  onCheckInteractions?: (medications: string[]) => Promise<{
    interactions: DrugInteraction[];
    allergies: AllergyAlert[];
    contraindications: Contraindication[];
  }>;
  loading?: boolean;
}
const SEVERITY_CONFIG = {
  major: {
    color: 'error' as const,
    icon: ErrorIcon,
    label: 'Major',
    description: 'Significant clinical interaction - avoid combination',
  },
  moderate: {
    color: 'warning' as const,
    icon: WarningIcon,
    label: 'Moderate',
    description: 'Monitor closely and consider alternatives',
  },
  minor: {
    color: 'info' as const,
    icon: InfoIcon,
    label: 'Minor',
    description: 'Monitor for effects but generally safe',
  },
};
const ALLERGY_SEVERITY_CONFIG = {
  severe: {
    color: 'error' as const,
    icon: ErrorIcon,
    label: 'Severe Allergy',
    description: 'Contraindicated - do not use',
  },
  moderate: {
    color: 'warning' as const,
    icon: WarningIcon,
    label: 'Moderate Allergy',
    description: 'Use with extreme caution',
  },
  mild: {
    color: 'info' as const,
    icon: InfoIcon,
    label: 'Mild Allergy',
    description: 'Monitor for allergic reactions',
  },
};
const CONTRAINDICATION_CONFIG = {
  contraindicated: {
    color: 'error' as const,
    icon: ErrorIcon,
    label: 'Contraindicated',
    description: 'Do not use in this condition',
  },
  warning: {
    color: 'warning' as const,
    icon: WarningIcon,
    label: 'Use with Caution',
    description: 'Monitor closely in this condition',
  },
};
const InteractionAlerts: React.FC<InteractionAlertsProps> = ({ 
  medications,
  patientAllergies = [],
  patientConditions = [],
  onCheckInteractions,
  loading = false
}) => {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [allergies, setAllergies] = useState<AllergyAlert[]>([]);
  const [contraindications, setContraindications] = useState<
    Contraindication[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['interactions'])
  );
  const handleToggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  const checkInteractions = async () => {
    if (!onCheckInteractions || medications.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const drugNames = medications.map((med) => med.drugName);
      const result = await onCheckInteractions(drugNames);
      setInteractions(result.interactions || []);
      setAllergies(result.allergies || []);
      setContraindications(result.contraindications || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to check interactions'
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (medications.length > 0) {
      checkInteractions();
    }
  }, [medications]);
  const getSeverityConfig = (
    severity: string,
    type: 'interaction' | 'allergy' | 'contraindication'
  ) => {
    switch (type) {
      case 'allergy':
        return (
          ALLERGY_SEVERITY_CONFIG[
            severity as keyof typeof ALLERGY_SEVERITY_CONFIG
          ] || ALLERGY_SEVERITY_CONFIG.mild
        );
      case 'contraindication':
        return (
          CONTRAINDICATION_CONFIG[
            severity as keyof typeof CONTRAINDICATION_CONFIG
          ] || CONTRAINDICATION_CONFIG.warning
        );
      default:
        return (
          SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] ||
          SEVERITY_CONFIG.minor
        );
    }
  };
  const totalAlerts =
    interactions.length + allergies.length + contraindications.length;
  const criticalAlerts = [
    ...interactions.filter((i) => i.severity === 'major'),
    ...allergies.filter((a) => a.severity === 'severe'),
    ...contraindications.filter((c) => c.severity === 'contraindicated'),
  ].length;
  if (medications.length === 0) {
    return null;
  }
  return (
    <div>
      {/* Header */}
      <div className="">
        <div
          className=""
        >
          <div
            
            className=""
          >
            <HealthAndSafetyIcon className="" />
            Drug Safety Analysis
          </div>
          <div className="">
            {(isLoading || loading) && <Spinner size={20} />}
            <Tooltip title="Refresh interaction check">
              <IconButton
                size="small"
                onClick={checkInteractions}
                disabled={isLoading || loading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        <div className="">
          <Chip
            label={`${medications.length} Medications`}
            
            size="small"
            icon={<MedicationIcon />}
          />
          {totalAlerts > 0 && (
            <Chip
              label={`${totalAlerts} Alert(s)`}
              color={criticalAlerts > 0 ? 'error' : 'warning'}
              
              size="small"
            />
          )}
          {criticalAlerts > 0 && (
            <Chip
              label={`${criticalAlerts} Critical`}
              color="error"
              
              size="small"
            />
          )}
        </div>
        {error && (
          <Alert severity="error" className="">
            <AlertTitle>Interaction Check Failed</AlertTitle>
            <div >{error}</div>
            <Button size="small" onClick={checkInteractions} className="">
              Retry
            </Button>
          </Alert>
        )}
        {criticalAlerts > 0 && (
          <Alert severity="error" className="">
            <AlertTitle>Critical Drug Safety Alerts</AlertTitle>
            <div >
              {criticalAlerts} critical safety issue(s) detected. Review all
              alerts before prescribing.
            </div>
          </Alert>
        )}
      </div>
      {/* Drug-Drug Interactions */}
      {interactions.length > 0 && (
        <Accordion
          expanded={expandedSections.has('interactions')}
          onChange={() => handleToggleSection('interactions')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div className="">
              <MedicationIcon color="warning" />
              <div  className="">
                Drug-Drug Interactions ({interactions.length})
              </div>
              {interactions.some((i) => i.severity === 'major') && (
                <Chip
                  label="Major Interactions"
                  color="error"
                  size="small"
                  
                />
              )}
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div spacing={2}>
              {interactions.map((interaction, index) => {
                const config = getSeverityConfig(
                  interaction.severity,
                  'interaction'
                );
                const Icon = config.icon;
                return (
                  <div key={index}  className="">
                    <div
                      className=""
                    >
                      <Icon color={config.color} />
                      <div className="">
                        <div
                          className=""
                        >
                          <div
                            
                            className=""
                          >
                            {interaction.drug1} + {interaction.drug2}
                          </div>
                          <Chip
                            label={config.label}
                            color={config.color}
                            size="small"
                            
                          />
                        </div>
                        <div
                          
                          color="text.secondary"
                          className=""
                        >
                          {config.description}
                        </div>
                        <div  className="">
                          <strong>Clinical Effect:</strong>{' '}
                          {interaction.clinicalEffect}
                        </div>
                        <div  className="">
                          <strong>Description:</strong>{' '}
                          {interaction.description}
                        </div>
                        {interaction.mechanism && (
                          <div  className="">
                            <strong>Mechanism:</strong> {interaction.mechanism}
                          </div>
                        )}
                        {interaction.management && (
                          <Alert
                            severity={config.color}
                            
                            className=""
                          >
                            <div >
                              <strong>Management:</strong>{' '}
                              {interaction.management}
                            </div>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionDetails>
        </Accordion>
      )}
      {/* Allergy Alerts */}
      {allergies.length > 0 && (
        <Accordion
          expanded={expandedSections.has('allergies')}
          onChange={() => handleToggleSection('allergies')}
          className=""
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div className="">
              <WarningIcon color="error" />
              <div  className="">
                Allergy Alerts ({allergies.length})
              </div>
              {allergies.some((a) => a.severity === 'severe') && (
                <Chip
                  label="Severe Allergies"
                  color="error"
                  size="small"
                  
                />
              )}
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div spacing={2}>
              {allergies.map((allergy, index) => {
                const config = getSeverityConfig(allergy.severity, 'allergy');
                const Icon = config.icon;
                return (
                  <div key={index}  className="">
                    <div
                      className=""
                    >
                      <Icon color={config.color} />
                      <div className="">
                        <div
                          className=""
                        >
                          <div
                            
                            className=""
                          >
                            {allergy.drug}
                          </div>
                          <Chip
                            label={config.label}
                            color={config.color}
                            size="small"
                            
                          />
                        </div>
                        <div
                          
                          color="text.secondary"
                          className=""
                        >
                          {config.description}
                        </div>
                        <div  className="">
                          <strong>Known Allergy:</strong> {allergy.allergy}
                        </div>
                        <div >
                          <strong>Reaction:</strong> {allergy.reaction}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionDetails>
        </Accordion>
      )}
      {/* Contraindications */}
      {contraindications.length > 0 && (
        <Accordion
          expanded={expandedSections.has('contraindications')}
          onChange={() => handleToggleSection('contraindications')}
          className=""
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <div className="">
              <ErrorIcon color="error" />
              <div  className="">
                Contraindications ({contraindications.length})
              </div>
              {contraindications.some(
                (c) => c.severity === 'contraindicated'
              ) && (
                <Chip
                  label="Absolute Contraindications"
                  color="error"
                  size="small"
                  
                />
              )}
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <div spacing={2}>
              {contraindications.map((contraindication, index) => {
                const config = getSeverityConfig(
                  contraindication.severity,
                  'contraindication'
                );
                const Icon = config.icon;
                return (
                  <div key={index}  className="">
                    <div
                      className=""
                    >
                      <Icon color={config.color} />
                      <div className="">
                        <div
                          className=""
                        >
                          <div
                            
                            className=""
                          >
                            {contraindication.drug}
                          </div>
                          <Chip
                            label={config.label}
                            color={config.color}
                            size="small"
                            
                          />
                        </div>
                        <div
                          
                          color="text.secondary"
                          className=""
                        >
                          {config.description}
                        </div>
                        <div  className="">
                          <strong>Condition:</strong>{' '}
                          {contraindication.condition}
                        </div>
                        <div >
                          <strong>Reason:</strong> {contraindication.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionDetails>
        </Accordion>
      )}
      {/* No Alerts */}
      {!isLoading && !loading && totalAlerts === 0 && (
        <Alert severity="success" className="">
          <AlertTitle>No Safety Alerts</AlertTitle>
          <div >
            No drug interactions, allergies, or contraindications detected for
            the suggested medications.
          </div>
        </Alert>
      )}
      {/* Safety Disclaimer */}
      <Alert severity="info" className="">
        <div >
          <strong>Safety Note:</strong> This analysis is based on available drug
          interaction databases. Always consult current prescribing information
          and consider individual patient factors.
        </div>
      </Alert>
    </div>
  );
};
export default InteractionAlerts;
