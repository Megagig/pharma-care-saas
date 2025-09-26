import LoadingSkeleton from './LoadingSkeleton';

import { Input, Spinner } from '@/components/ui/button';

interface DrugConcept {
  rxcui: string;
  name: string;
  synonym?: string;
  tty?: string;
}

interface DrugSearchProps {
  onDrugSelect?: () => void;
}

const DrugSearch: React.FC<DrugSearchProps> = ({ onDrugSelect }) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useDrugSearch(debouncedSearchTerm, debouncedSearchTerm.length > 2);
  const { setSelectedDrug, setSearchError } = useDrugStore();

  // Report any errors to the global state and console log for debugging
  useEffect(() => {
    if (error) {
      console.error('Drug search error:', error);
      setSearchError((error as Error).message || 'Failed to search drugs');
    } else {
      setSearchError(null);
    }

    // Debug: Log search results
    console.log('Search term:', debouncedSearchTerm);
    console.log('Search results:', searchResults);
    console.log('Search results type:', typeof searchResults);
    if (searchResults && typeof searchResults === 'object') {
      console.log('Search results keys:', Object.keys(searchResults));

      // Check for success property
      if ('success' in searchResults) {
        console.log('Success value:', searchResults.success);
      }

      // Check for data property
      if ('data' in searchResults && searchResults.data) {
        console.log('Data property exists:', typeof searchResults.data);
        console.log('Data keys:', Object.keys(searchResults.data));

        // Check for drugGroup
        if (searchResults.data.drugGroup) {
          console.log('DrugGroup exists:', typeof searchResults.data.drugGroup);
          console.log(
            'DrugGroup keys:',
            Object.keys(searchResults.data.drugGroup)
          );

          // Check for conceptGroup
          if (searchResults.data.drugGroup.conceptGroup) {
            console.log(
              'ConceptGroup exists:',
              Array.isArray(searchResults.data.drugGroup.conceptGroup)
                ? `Array with ${searchResults.data.drugGroup.conceptGroup.length} items`
                : typeof searchResults.data.drugGroup.conceptGroup
            );
          }
        }
      }
    }
    console.log('Is loading:', isLoading);
  }, [error, searchResults, isLoading, debouncedSearchTerm, setSearchError]);

  // Extract drug concepts from search results
  const drugConcepts = useMemo(() => {
    if (!searchResults?.data?.drugGroup?.conceptGroup) return [];

    const concepts: DrugConcept[] = [];
    searchResults.data.drugGroup.conceptGroup.forEach((group) => {
      if (group.conceptProperties) {
        concepts.push(...group.conceptProperties);
      }
    });

    return concepts;
  }, [searchResults]);

  const handleDrugSelect = (drug: DrugConcept) => {
    setSelectedDrug({
      rxCui: drug.rxcui,
      name: drug.name
    });

    if (onDrugSelect) {
      onDrugSelect();
    }
  };

  // Handle retry on error
  const handleRetry = () => {
    if (debouncedSearchTerm.length > 2) {
      refetch();
    }
  };

  // Show skeleton loader when searching
  if (isLoading && debouncedSearchTerm.length > 2) {
    return <LoadingSkeleton type="search" />;
  }

  return (
    <div className="drug-search">
      {/* Debug info */}
      <Input
        fullWidth

        placeholder="Search for medications by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className=""
      />

      {error && (
        <div
          className=""
        >
          <div color="error">
            Error: {(error as Error).message || 'Failed to search drugs'}
          </div>
          <div
            component="button"
            onClick={handleRetry}
            className="">
            Retry
          </div>
        </div>
      )}

      {debouncedSearchTerm.length > 2 && drugConcepts.length > 0 && (
        <div
          className=""
        >
          <List className="">
            {drugConcepts.map((drug) => (
              <div
                key={drug.rxcui}
                onClick={() => handleDrugSelect(drug)}
                className=""
              >
                <div className="p-2">
                  <div className="font-medium">
                    {drug.name}
                  </div>
                  {drug.synonym && (
                    <div className="text-sm text-gray-600">
                      Also known as: {drug.synonym}
                    </div>
                  )}
                  {drug.tty && (
                    <div
                      component="span"
                      className=""
                    >
                      {drug.tty}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </List>
        </div>
      )}

      {debouncedSearchTerm.length > 2 &&
        drugConcepts.length === 0 &&
        !isLoading && (
          <div
            className=""
          >
            <SearchIcon
              className=""
            />
            <div color="text.secondary" align="center">
              No medications found matching "{debouncedSearchTerm}"
            </div>
            <div

              color="text.secondary"
              align="center"
              className=""
            >
              Try using a different spelling or search term
            </div>
          </div>
        )}
    </div>
  );
};

export default DrugSearch;
