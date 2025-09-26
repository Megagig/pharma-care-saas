
import LoadingSkeleton from './LoadingSkeleton';

import { Alert } from '@/components/ui/button';

interface DrugInteractionsProps {
  rxcui?: string;
  rxcuis?: string[];
  drugName?: string;
}
const DrugInteractions: React.FC<DrugInteractionsProps> = ({ rxcui, rxcuis, drugName }) => {
  const { data: interactions, isLoading, error } = useDrugInteractions(rxcui, rxcuis);
  if (isLoading) {
    return <LoadingSkeleton type="list" />;
  }
  if (error) {
    return (
      <div my={4}>
        <Alert severity="error">
          Error loading drug interactions: {(error as any).message}
        </Alert>
      </div>
    );
  }
  if (!interactions || !interactions.interactionTypeGroup) {
    return (
      <div my={4}>
        <div>No interaction data available</div>
      </div>
    );
  }
  // Flatten interaction data for easier display
  const interactionPairs: any[] = [];
  interactions.interactionTypeGroup.forEach(group => {
    group.interactionType.forEach(type => {
      type.interactionPair.forEach(pair => {
        interactionPairs.push({
          drug1: type.minConceptItem.name,
          drug2: pair.interactionConcept[1]?.minConceptItem?.name || 'Unknown',
          severity: pair.severity,
          description: pair.description
        });
      });
    });
  });
  return (
    <div className="p-4">
      <div className="mb-4">
        Drug Interactions {drugName ? `for ${drugName}` : ''}
      </div>
      {interactionPairs.length === 0 ? (
        <Alert severity="success">
          No significant drug interactions found
        </Alert>
      ) : (
        <div>
          {interactionPairs.map((interaction, index) => (
            <div key={index} className="p-3 mb-3 border-l-4 border-blue-500">
              <div display="flex" justifyContent="space-between" alignItems="center" className="mb-2">
                <div >
                  {interaction.drug1} + {interaction.drug2}
                </div>
                <Chip
                  label={interaction.severity}
                  color={interaction.severity === 'HIGH' ? 'error' : interaction.severity === 'MODERATE' ? 'warning' : 'info'}
                  icon={<SeverityIcon severity={interaction.severity} />}
                />
              </div>
              <div >
                {interaction.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default DrugInteractions;