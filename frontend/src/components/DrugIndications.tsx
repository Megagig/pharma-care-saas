
import LoadingSkeleton from './LoadingSkeleton';

import { Alert, Separator } from '@/components/ui/button';

interface DrugIndicationsProps {
  drugId: string;
  drugName: string;
}
const DrugIndications: React.FC<DrugIndicationsProps> = ({ 
  drugId,
  drugName
}) => {
  const {
    data: indicationsData,
    isLoading,
    error,
  } = useDrugIndications(drugId);
  const renderIndications = () => {
    if (!indicationsData?.results || indicationsData.results.length === 0) {
      return (
        <>
          <Alert severity="info" className="">
            No indications information found for this drug.
          </Alert>
          <div  className="">
            We searched through multiple drug databases but couldn't find
            official indication information for {drugName}. This could happen
            if:
          </div>
          <ul >
            <li>The drug name has an alternate spelling or format</li>
            <li>The drug may be known by another name in the FDA database</li>
            <li>
              There may be a temporary connection issue with the FDA database
            </li>
          </ul>
          <div  className="">
            Always consult with a healthcare professional before starting or
            changing medication. Indications may vary based on formulation,
            dosage, and individual patient factors.
          </div>
        </>
      );
    }
    // Process and display indications
    return indicationsData.results
      .map((result: any, index: number) => {
        if (
          !result.indications_and_usage ||
          result.indications_and_usage.length === 0
        ) {
          return null;
        }
        return (
          <div key={index} className="">
            <div
              
              fontWeight={600}
              className=""
            >
              {result.openfda?.brand_name?.[0] ||
                result.openfda?.generic_name?.[0] ||
                drugName}
            </div>
            <List className="">
              {result.indications_and_usage.map(
                (indication: string, idx: number) => (
                  <React.Fragment key={idx}>
                    <div alignItems="flex-start" className="">
                      <div className="">
                        <CheckCircleIcon color="primary" />
                      </div>
                      <div
                        primary={indication}
                        className="" />
                    </div>
                    {idx < result.indications_and_usage.length - 1 && (
                      <Separator component="li" className="" />
                    )}
                  </React.Fragment>
                )
              )}
            </List>
            {result.openfda?.manufacturer_name && (
              <div
                
                className=""
              >
                Manufacturer: {result.openfda.manufacturer_name.join(', ')}
              </div>
            )}
          </div>
        );
      })
      .filter(Boolean);
  };
  if (isLoading) {
    return <LoadingSkeleton type="list" />;
  }
  if (error) {
    return (
      <Alert severity="error" className="" icon={<ErrorIcon />}>
        {(error as Error).message || 'Error loading drug indications'}
      </Alert>
    );
  }
  return (
    <div className="">
      <div className="">
        <MedicationIcon className="" />
        <div  className="">
          Indications for {drugName}
        </div>
      </div>
      <div  className="">
        FDA-approved uses and therapeutic indications for this medication:
      </div>
      {renderIndications()}
      <Alert severity="info" className="">
        <div >
          Always consult with a healthcare professional before starting or
          changing medication. Indications may vary based on formulation,
          dosage, and individual patient factors.
        </div>
      </Alert>
    </div>
  );
};
export default DrugIndications;
