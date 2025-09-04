import React, { useState, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useDrugSearch } from '../queries/drugQueries';
import { useDrugStore } from '../stores/drugStore';
import { Box, TextField, CircularProgress, List, ListItem, ListItemText, Typography, Paper, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LoadingSkeleton from './LoadingSkeleton';

interface DrugSearchProps {
  onDrugSelect?: (drug: any) => void;
}

const DrugSearch: React.FC<DrugSearchProps> = ({ onDrugSelect }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);
  const { data: searchResults, isLoading, error } = useDrugSearch(debouncedSearchTerm, debouncedSearchTerm.length > 2);
  const { setSelectedDrug } = useDrugStore();

  // Extract drug concepts from search results
  const drugConcepts = useMemo(() => {
    if (!searchResults?.drugGroup?.conceptGroup) return [];
    
    const concepts: any[] = [];
    searchResults.drugGroup.conceptGroup.forEach(group => {
      if (group.conceptProperties) {
        concepts.push(...group.conceptProperties);
      }
    });
    
    return concepts;
  }, [searchResults]);

  const handleDrugSelect = (drug: any) => {
    setSelectedDrug({
      rxCui: drug.rxcui,
      name: drug.name
    });
    
    if (onDrugSelect) {
      onDrugSelect(drug);
    }
  };

  // Show skeleton loader when searching
  if (isLoading && debouncedSearchTerm.length > 2) {
    return <LoadingSkeleton type="search" />;
  }

  return (
    <Box className="drug-search">
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search for drugs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        className="mb-4"
      />
      
      {error && (
        <Typography color="error" className="mb-4">
          Error: {(error as any).message || 'Failed to search drugs'}
        </Typography>
      )}
      
      {debouncedSearchTerm.length > 2 && drugConcepts.length > 0 && (
        <Paper elevation={2}>
          <List>
            {drugConcepts.map((drug) => (
              <ListItem 
                key={drug.rxcui} 
                button 
                onClick={() => handleDrugSelect(drug)}
                className="border-b last:border-b-0"
              >
                <ListItemText 
                  primary={drug.name} 
                  secondary={drug.synonym ? `Also known as: ${drug.synonym}` : ''} 
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      
      {debouncedSearchTerm.length > 2 && drugConcepts.length === 0 && !isLoading && (
        <Typography className="text-center py-4 text-gray-500">
          No drugs found matching "{debouncedSearchTerm}"
        </Typography>
      )}
    </Box>
  );
};

export default DrugSearch;