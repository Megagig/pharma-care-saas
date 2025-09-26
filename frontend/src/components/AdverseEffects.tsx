import LoadingSkeleton from './LoadingSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface AdverseEffectsProps {
  drugId: string;
  drugName?: string;
}

// Mock hook for adverse effects data
const useAdverseEffects = (drugId: string, limit: number) => {
  return {
    data: null,
    isLoading: false,
    error: null
  };
};

const AdverseEffects: React.FC<AdverseEffectsProps> = ({ drugId, drugName }) => {
  const { data: adverseEffects, isLoading, error } = useAdverseEffects(drugId, 20);
  if (isLoading) {
    return <LoadingSkeleton type="list" />;
  }
  if (error) {
    return (
      <div className="my-4">
        <Alert>
          <AlertDescription>
            Error loading adverse effects: {(error as any).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (!adverseEffects || !adverseEffects.results) {
    return (
      <div className="my-4">
        <div>No adverse effects data available</div>
      </div>
    );
  }
  // Extract unique reactions
  const reactions: { [key: string]: { count: number; seriousness: string[] } } = {};
  adverseEffects.results.forEach((report: any) => {
    if (report.patient && report.patient.reaction) {
      report.patient.reaction.forEach((reaction: any) => {
        const reactionName = reaction.reactionmeddrapt;
        if (!reactions[reactionName]) {
          reactions[reactionName] = {
            count: 0,
            seriousness: []
          };
        }
        reactions[reactionName].count += 1;
        // Track seriousness levels
        const seriousness: string[] = [];
        if (report.seriousnessdeath === '1') seriousness.push('Death');
        if (report.seriousnesslifethreatening === '1') seriousness.push('Life Threatening');
        if (report.seriousnesshospitalization === '1') seriousness.push('Hospitalization');
        reactions[reactionName].seriousness = [
          ...new Set([...reactions[reactionName].seriousness, ...seriousness])
        ];
      });
    }
  });
  // Convert to array and sort by frequency
  const sortedReactions = Object.entries(reactions)
    .map(([reaction, data]) => ({
      reaction,
      count: data.count,
      seriousness: data.seriousness
    }))
    .sort((a, b) => b.count - a.count);
  return (
    <div className="p-4">
      <div className="mb-4">
        Adverse Effects {drugName ? `for ${drugName}` : ''}
      </div>
      {sortedReactions.length === 0 ? (
        <Alert>
          <AlertDescription>
            No adverse effects reported
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {sortedReactions.map(({ reaction, count, seriousness }, index) => (
            <div key={index} className="border-b last:border-b-0 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="font-medium">
                    {reaction}
                  </div>
                  <Badge 
                    variant={seriousness.length > 0 ? 'destructive' : 'secondary'}
                  >
                    {count}
                  </Badge>
                </div>
              </div>
              {seriousness.length > 0 && (
                <div className="text-sm text-red-600 mt-1">
                  Seriousness: {seriousness.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default AdverseEffects;