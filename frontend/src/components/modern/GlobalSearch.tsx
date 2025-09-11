import React, { useState, useEffect, useRef } from 'react';
import {
   Box,
   InputBase,
   IconButton,
   Paper,
   Popper,
   List,
   ListItem,
   ListItemText,
   ListItemIcon,
   Typography,
   Divider,
   ClickAwayListener,
   Fade,
   useTheme,
   Dialog,
   DialogContent,
   AppBar,
   Toolbar,
   useMediaQuery,
} from '@mui/material';
import {
   Search as SearchIcon,
   Person as PersonIcon,
   Description as DescriptionIcon,
   Medication as MedicationIcon,
   Event as EventIcon,
   Close as CloseIcon,
   History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Define the types of results we can search for
export type SearchResultType =
   | 'patient'
   | 'note'
   | 'medication'
   | 'appointment'
   | 'history';

// Define the result item interface
export interface SearchResultItem {
   id: string;
   type: SearchResultType;
   title: string;
   subtitle?: string;
   url: string;
}

const GlobalSearch: React.FC = () => {
   const [searchQuery, setSearchQuery] = useState<string>('');
   const [isSearching, setIsSearching] = useState<boolean>(false);
   const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
   const [showResults, setShowResults] = useState<boolean>(false);
   const [recentSearches, setRecentSearches] = useState<SearchResultItem[]>([]);
   const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);
   const searchInputRef = useRef<HTMLInputElement>(null);
   const mobileSearchInputRef = useRef<HTMLInputElement>(null);
   const searchRef = useRef<HTMLDivElement>(null);
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
   const navigate = useNavigate();

   // Load recent searches from localStorage on component mount
   useEffect(() => {
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
         try {
            setRecentSearches(JSON.parse(savedSearches));
         } catch (e) {
            console.error('Error loading recent searches', e);
         }
      }
   }, []);

   // Listen for mobile search open event
   useEffect(() => {
      const handleMobileSearchOpen = () => {
         if (isMobile) {
            setMobileSearchOpen(true);
            setTimeout(() => {
               if (mobileSearchInputRef.current) {
                  mobileSearchInputRef.current.focus();
               }
            }, 100);
         } else {
            setShowResults(true);
            setTimeout(() => {
               if (searchInputRef.current) {
                  searchInputRef.current.focus();
               }
            }, 100);
         }
      };

      window.addEventListener('open-mobile-search', handleMobileSearchOpen);

      // Cleanup listener on unmount
      return () => {
         window.removeEventListener(
            'open-mobile-search',
            handleMobileSearchOpen
         );
      };
   }, [isMobile]);

   // Function to save a search to recent searches
   const saveToRecentSearches = (result: SearchResultItem) => {
      const updatedSearches = [
         result,
         ...recentSearches.filter((item) => item.id !== result.id).slice(0, 4),
      ];

      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
   };

   // Simulated search function - in a real app this would call an API
   const performSearch = (query: string) => {
      setIsSearching(true);

      // Simulate API delay
      setTimeout(() => {
         if (query.trim().length === 0) {
            setSearchResults([]);
            setIsSearching(false);
            return;
         }

         // Mock search results based on query
         const mockResults: SearchResultItem[] = [
            {
               id: 'p1',
               type: 'patient',
               title: 'John Smith',
               subtitle: 'Patient ID: 12345',
               url: '/patients/12345',
            },
            {
               id: 'p2',
               type: 'patient',
               title: 'Jane Doe',
               subtitle: 'Patient ID: 12346',
               url: '/patients/12346',
            },
            {
               id: 'n1',
               type: 'note',
               title: 'Follow-up Consultation',
               subtitle: 'Created on June 15, 2023',
               url: '/notes/789',
            },
            {
               id: 'm1',
               type: 'medication',
               title: 'Amoxicillin',
               subtitle: 'Antibiotic - 500mg',
               url: '/medications/456',
            },
            {
               id: 'a1',
               type: 'appointment',
               title: 'Dr. Williams - Checkup',
               subtitle: 'July 3, 2023 at 10:00 AM',
               url: '/appointments/123',
            },
         ].filter(
            (item) =>
               item.title.toLowerCase().includes(query.toLowerCase()) ||
               (item.subtitle &&
                  item.subtitle.toLowerCase().includes(query.toLowerCase()))
         );

         setSearchResults(mockResults);
         setIsSearching(false);
      }, 300);
   };

   // Function to handle when a search result is clicked
   const handleResultClick = (result: SearchResultItem) => {
      saveToRecentSearches(result);
      setShowResults(false);
      navigate(result.url);
   };

   // Function to handle clickaway from search
   const handleClickAway = () => {
      if (searchQuery.trim() === '') {
         setShowResults(false);
      }
   };

   // Function to get the appropriate icon for each result type
   const getIconForType = (type: SearchResultType) => {
      switch (type) {
         case 'patient':
            return <PersonIcon />;
         case 'note':
            return <DescriptionIcon />;
         case 'medication':
            return <MedicationIcon />;
         case 'appointment':
            return <EventIcon />;
         case 'history':
            return <HistoryIcon />;
         default:
            return <SearchIcon />;
      }
   };

   return (
      <>
         <ClickAwayListener onClickAway={handleClickAway}>
            <Box
               sx={{
                  position: 'relative',
                  width: { xs: '100%', sm: 300, md: 400 },
               }}
               ref={searchRef}
            >
               <Paper
                  elevation={0}
                  sx={{
                     p: '2px 4px',
                     display: 'flex',
                     alignItems: 'center',
                     border: `1px solid ${theme.palette.divider}`,
                     borderRadius: 2,
                  }}
               >
                  <InputBase
                     inputRef={searchInputRef}
                     placeholder="Search for patients, medications, appointments..."
                     sx={{ ml: 1, flex: 1 }}
                     value={searchQuery}
                     onChange={(e) => {
                        setSearchQuery(e.target.value);
                        performSearch(e.target.value);
                     }}
                     onFocus={() => setShowResults(true)}
                  />
                  {searchQuery ? (
                     <IconButton
                        size="small"
                        aria-label="clear"
                        onClick={() => {
                           setSearchQuery('');
                           setSearchResults([]);
                        }}
                     >
                        <CloseIcon fontSize="small" />
                     </IconButton>
                  ) : (
                     <IconButton size="small" aria-label="search">
                        <SearchIcon fontSize="small" />
                     </IconButton>
                  )}
               </Paper>

               <Popper
                  open={showResults}
                  anchorEl={searchRef.current}
                  placement="bottom-start"
                  style={{
                     width: searchRef.current?.clientWidth,
                     zIndex: 1301,
                  }}
                  modifiers={[
                     {
                        name: 'offset',
                        options: {
                           offset: [0, 8],
                        },
                     },
                  ]}
               >
                  {({ TransitionProps }) => (
                     <Fade {...TransitionProps} timeout={200}>
                        <Paper
                           elevation={3}
                           sx={{
                              mt: 1,
                              py: 1,
                              maxHeight: '70vh',
                              overflow: 'auto',
                              borderRadius: 2,
                              boxShadow:
                                 theme.palette.mode === 'dark'
                                    ? '0px 5px 15px rgba(0, 0, 0, 0.3)'
                                    : '0px 5px 15px rgba(0, 0, 0, 0.1)',
                           }}
                        >
                           <List>
                              {isSearching ? (
                                 <ListItem>
                                    <ListItemText primary="Searching..." />
                                 </ListItem>
                              ) : searchResults.length > 0 ? (
                                 searchResults.map((result) => (
                                    <ListItem
                                       button
                                       key={result.id}
                                       onClick={() => handleResultClick(result)}
                                       sx={{
                                          borderRadius: 1,
                                          mb: 1,
                                          '&:hover': {
                                             bgcolor:
                                                theme.palette.mode === 'dark'
                                                   ? 'rgba(255,255,255,0.1)'
                                                   : 'rgba(0,0,0,0.04)',
                                          },
                                       }}
                                    >
                                       <ListItemIcon>
                                          {getIconForType(result.type)}
                                       </ListItemIcon>
                                       <ListItemText
                                          primary={result.title}
                                          secondary={result.subtitle}
                                          primaryTypographyProps={{
                                             fontWeight: 'medium',
                                          }}
                                       />
                                    </ListItem>
                                 ))
                              ) : searchQuery.trim().length > 0 ? (
                                 <ListItem>
                                    <ListItemText primary="No results found" />
                                 </ListItem>
                              ) : recentSearches.length > 0 ? (
                                 <>
                                    <Box sx={{ px: 2, py: 1 }}>
                                       <Typography
                                          variant="subtitle2"
                                          color="text.secondary"
                                       >
                                          Recent Searches
                                       </Typography>
                                    </Box>
                                    <Divider sx={{ mb: 1 }} />
                                    {recentSearches.map((result) => (
                                       <ListItem
                                          button
                                          key={result.id}
                                          onClick={() =>
                                             handleResultClick(result)
                                          }
                                          sx={{
                                             borderRadius: 1,
                                             mb: 0.5,
                                             '&:hover': {
                                                bgcolor:
                                                   theme.palette.mode === 'dark'
                                                      ? 'rgba(255,255,255,0.1)'
                                                      : 'rgba(0,0,0,0.04)',
                                             },
                                          }}
                                       >
                                          <ListItemIcon sx={{ minWidth: 40 }}>
                                             {getIconForType('history')}
                                          </ListItemIcon>
                                          <ListItemText
                                             primary={result.title}
                                             primaryTypographyProps={{
                                                fontWeight: 'medium',
                                             }}
                                          />
                                       </ListItem>
                                    ))}
                                 </>
                              ) : (
                                 <ListItem>
                                    <ListItemText primary="Try searching for patients, notes, medications, or appointments" />
                                 </ListItem>
                              )}
                           </List>
                        </Paper>
                     </Fade>
                  )}
               </Popper>
            </Box>
         </ClickAwayListener>

         {/* Mobile Search Dialog */}
         <Dialog
            fullScreen
            open={mobileSearchOpen}
            onClose={() => setMobileSearchOpen(false)}
            sx={{
               '& .MuiDialog-paper': {
                  bgcolor: theme.palette.background.default,
               },
            }}
         >
            <AppBar position="static" color="inherit" elevation={0}>
               <Toolbar>
                  <Paper
                     component="form"
                     sx={{
                        p: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                     }}
                  >
                     <InputBase
                        inputRef={mobileSearchInputRef}
                        placeholder="Search for patients, medications, appointments..."
                        sx={{ ml: 1, flex: 1 }}
                        value={searchQuery}
                        onChange={(e) => {
                           setSearchQuery(e.target.value);
                           performSearch(e.target.value);
                        }}
                        onFocus={() => setShowResults(true)}
                     />
                     {searchQuery ? (
                        <IconButton
                           size="small"
                           aria-label="clear"
                           onClick={() => {
                              setSearchQuery('');
                              setSearchResults([]);
                           }}
                        >
                           <CloseIcon fontSize="small" />
                        </IconButton>
                     ) : (
                        <IconButton size="small" aria-label="search">
                           <SearchIcon fontSize="small" />
                        </IconButton>
                     )}
                     <Divider
                        sx={{ height: 28, m: 0.5 }}
                        orientation="vertical"
                     />
                     <IconButton
                        sx={{ p: '10px' }}
                        aria-label="close search"
                        onClick={() => setMobileSearchOpen(false)}
                     >
                        <CloseIcon />
                     </IconButton>
                  </Paper>
               </Toolbar>
            </AppBar>

            <DialogContent>
               <List>
                  {isSearching ? (
                     <ListItem>
                        <ListItemText primary="Searching..." />
                     </ListItem>
                  ) : searchResults.length > 0 ? (
                     searchResults.map((result) => (
                        <ListItem
                           button
                           key={result.id}
                           onClick={() => {
                              handleResultClick(result);
                              setMobileSearchOpen(false);
                           }}
                           sx={{
                              borderRadius: 1,
                              mb: 1,
                              '&:hover': {
                                 bgcolor:
                                    theme.palette.mode === 'dark'
                                       ? 'rgba(255,255,255,0.1)'
                                       : 'rgba(0,0,0,0.04)',
                              },
                           }}
                        >
                           <ListItemIcon>
                              {getIconForType(result.type)}
                           </ListItemIcon>
                           <ListItemText
                              primary={result.title}
                              secondary={result.subtitle}
                              primaryTypographyProps={{ fontWeight: 'medium' }}
                           />
                        </ListItem>
                     ))
                  ) : searchQuery.trim().length > 0 ? (
                     <ListItem>
                        <ListItemText primary="No results found" />
                     </ListItem>
                  ) : recentSearches.length > 0 ? (
                     <>
                        <Box sx={{ px: 2, py: 1 }}>
                           <Typography
                              variant="subtitle2"
                              color="text.secondary"
                           >
                              Recent Searches
                           </Typography>
                        </Box>
                        <Divider sx={{ mb: 1 }} />
                        {recentSearches.map((result) => (
                           <ListItem
                              button
                              key={result.id}
                              onClick={() => {
                                 handleResultClick(result);
                                 setMobileSearchOpen(false);
                              }}
                              sx={{
                                 borderRadius: 1,
                                 mb: 0.5,
                                 '&:hover': {
                                    bgcolor:
                                       theme.palette.mode === 'dark'
                                          ? 'rgba(255,255,255,0.1)'
                                          : 'rgba(0,0,0,0.04)',
                                 },
                              }}
                           >
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                 {getIconForType('history')}
                              </ListItemIcon>
                              <ListItemText
                                 primary={result.title}
                                 primaryTypographyProps={{
                                    fontWeight: 'medium',
                                 }}
                              />
                           </ListItem>
                        ))}
                     </>
                  ) : (
                     <ListItem>
                        <ListItemText primary="Try searching for patients, notes, medications, or appointments" />
                     </ListItem>
                  )}
               </List>
            </DialogContent>
         </Dialog>
      </>
   );
};

export default GlobalSearch;
