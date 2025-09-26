
import LoadingSkeleton from './LoadingSkeleton';

import { Alert } from '@/components/ui/button';

interface FormularyProps {
  drugId: string;
  drugName?: string;
}
const Formulary: React.FC<FormularyProps> = ({ drugId, drugName }) => {
  const { data: formularyInfo, isLoading, error } = useFormularyInfo(drugId);
  if (isLoading) {
    return <LoadingSkeleton type="list" />;
  }
  if (error) {
    return (
      <div my={4}>
        <Alert severity="error">
          Error loading formulary information: {(error as any).message}
        </Alert>
      </div>
    );
  }
  if (!formularyInfo || !formularyInfo.relatedGroup) {
    return (
      <div my={4}>
        <div>No formulary information available</div>
      </div>
    );
  }
  // Extract therapeutic equivalents
  const equivalents: any[] = [];
  if (formularyInfo.relatedGroup.conceptGroup) {
    formularyInfo.relatedGroup.conceptGroup.forEach(group => {
      if (group.tty === 'SCD' && group.conceptProperties) {
        equivalents.push(...group.conceptProperties);
      }
    });
  }
  return (
    <div className="p-4">
      <div  className="mb-4">
        Formulary & Therapeutic Equivalents {drugName ? `for ${drugName}` : ''}
      </div>
      {equivalents.length === 0 ? (
        <Alert severity="info">
          No therapeutic equivalents found
        </Alert>
      ) : (
        <div>
          <div  className="mb-2">
            Therapeutic Equivalents:
          </div>
          <List>
            {equivalents.map((drug, index) => (
              <div key={index} className="border-b last:border-b-0">
                <div
                  primary={drug.name}
                  secondary={drug.synonym ? `Also known as: ${drug.synonym}` : ''}
                />
                <Chip label={drug.tty} size="small" />
              </div>
            ))}
          </List>
        </div>
      )}
    </div>
  );
};
export default Formulary;