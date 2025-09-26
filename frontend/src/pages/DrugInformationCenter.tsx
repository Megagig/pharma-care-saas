import ModulePage from '../components/ModulePage';
import DrugSearch from '../components/DrugSearch';
import DrugDetails from '../components/DrugDetails';
import DrugInteractions from '../components/DrugInteractions';
import DrugIndications from '../components/DrugIndications';
import AdverseEffects from '../components/AdverseEffects';
import Formulary from '../components/Formulary';
import TherapyPlanManager from '../components/TherapyPlan';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen as BookOpenIcon } from 'lucide-react';

const DrugInformationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  // Mock state for demonstration
  const [selectedDrug, setSelectedDrug] = React.useState<any>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // Clear any search errors when component mounts
  React.useEffect(() => {
    setSearchError(null);
    return () => {
      // Clean up any resources when component unmounts
      setSearchError(null);
    };
  }, []);

  const moduleInfo = {
    title: 'Drug Information Center',
    purpose:
      'Access comprehensive drug monographs, clinical guidelines, and formulary information for informed decision-making.',
    workflow: {
      description:
        'Comprehensive drug information resource providing evidence-based data to support clinical decision-making and patient counseling.',
      steps: [
        'Search for specific drug information',
        'View detailed drug monographs',
        'Check clinical guidelines and protocols',
        'Review formulary status and alternatives',
        'Add relevant information to therapy plans',
      ],
    },
    keyFeatures: [
      'Comprehensive drug database',
      'Clinical monographs and references',
      'Formulary management system',
      'Drug interaction database',
      'Dosing guidelines and calculators',
      'Patient counseling information',
      'Adverse effect profiles',
      'Therapeutic equivalence data',
    ],
    status: 'active',
    estimatedRelease: 'Available now',
  };

  const handleTabChange = (value: string) => {
    setActiveTab(Number(value));
  };

  const handleDrugSelect = (drug: any) => {
    setSelectedDrug(drug);
    setActiveTab(1); // Switch to details tab when a drug is selected
  };

  return (
    <ModulePage
      moduleInfo={moduleInfo}
      icon={BookOpenIcon}
      gradient="linear-gradient(135deg, #0047AB 0%, #87CEEB 100%)"
      hideModuleInfo={true}
    >
      <div className="drug-information-center">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Drug Information Center
            </h1>
            <div className="mb-6">
              <DrugSearch onDrugSelect={handleDrugSelect} />
            </div>

            {searchError && (
              <Alert className="mb-4" variant="destructive">
                {searchError}
              </Alert>
            )}

            {selectedDrug ? (
              <>
                <div className="mb-6">
                  <Tabs value={activeTab.toString()} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-7">
                      <TabsTrigger value="0">Overview</TabsTrigger>
                      <TabsTrigger value="1">Monograph</TabsTrigger>
                      <TabsTrigger value="2">Indications</TabsTrigger>
                      <TabsTrigger value="3">Interactions</TabsTrigger>
                      <TabsTrigger value="4">Adverse Effects</TabsTrigger>
                      <TabsTrigger value="5">Formulary</TabsTrigger>
                      <TabsTrigger value="6">Therapy Plan</TabsTrigger>
                    </TabsList>

                    <TabsContent value="0" className="mt-6">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          {selectedDrug.name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Drug Identifier (RxCUI)
                            </h3>
                            <p className="font-medium">{selectedDrug.rxCui}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Available Information
                            </h3>
                            <p>Monograph, Interactions, Side Effects, Alternatives</p>
                          </div>
                        </div>
                        <Alert className="mt-4">
                          Select the tabs above to view detailed drug information
                          and clinical data
                        </Alert>
                      </div>
                    </TabsContent>

                    <TabsContent value="1" className="mt-6">
                      <DrugDetails drugId={selectedDrug.rxCui} />
                    </TabsContent>

                    <TabsContent value="2" className="mt-6">
                      <DrugIndications
                        drugId={selectedDrug.rxCui}
                        drugName={selectedDrug.name}
                      />
                    </TabsContent>

                    <TabsContent value="3" className="mt-6">
                      <DrugInteractions
                        rxcui={selectedDrug.rxCui}
                        drugName={selectedDrug.name}
                      />
                    </TabsContent>

                    <TabsContent value="4" className="mt-6">
                      <AdverseEffects
                        drugId={selectedDrug.rxCui}
                        drugName={selectedDrug.name}
                      />
                    </TabsContent>

                    <TabsContent value="5" className="mt-6">
                      <Formulary
                        drugId={selectedDrug.rxCui}
                        drugName={selectedDrug.name}
                      />
                    </TabsContent>

                    <TabsContent value="6" className="mt-6">
                      <TherapyPlanManager />
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpenIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Search for a drug above to view detailed clinical information,
                  interactions, and formulary data
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Access comprehensive monographs, check drug interactions, review
                  adverse effects, find therapeutic alternatives, and create
                  therapy plans all in one place.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModulePage>
  );
};

export default DrugInformationCenter;
