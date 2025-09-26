
import LoadingSkeleton from './LoadingSkeleton';

import { Separator } from '@/components/ui/button';

interface DrugDetailsProps {
  drugId: string;
}
const DrugDetails: React.FC<DrugDetailsProps> = ({ drugId }) => {
  const { data: monograph, isLoading, error } = useDrugMonograph(drugId);
  const { selectedDrug } = useDrugStore();
  if (isLoading) {
    return <LoadingSkeleton type="details" />;
  }
  if (error) {
    return (
      <div my={4}>
        <div color="error">
          Error loading drug details: {(error as any).message}
        </div>
      </div>
    );
  }
  if (!monograph) {
    return (
      <div my={4}>
        <div>No details available for this drug</div>
      </div>
    );
  }
  // Extract key information from monograph
  const title = monograph.SPL?.title || selectedDrug?.name || 'Drug Information';
  const publishedDate = monograph.SPL?.published_date;
  return (
    <div className="p-4">
      <div  className="mb-2">
        {title}
      </div>
      {publishedDate && (
        <div  className="mb-4 text-gray-600">
          Published: {new Date(publishedDate).toLocaleDateString()}
        </div>
      )}
      <Separator className="my-4" />
      {monograph.SPL?.content && monograph.SPL.content.length > 0 ? (
        <div>
          {monograph.SPL.content.map((section: any, index: number) => (
            <div key={index} className="mb-4">
              {section.title && (
                <div  className="mb-2">
                  {section.title}
                </div>
              )}
              {section.paragraph && (
                <div  className="mb-2">
                  {section.paragraph}
                </div>
              )}
              {section.list && (
                <ul className="list-disc pl-6">
                  {section.list.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className="mb-1">
                      <div >{item}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>No detailed information available</div>
      )}
    </div>
  );
};
export default DrugDetails;