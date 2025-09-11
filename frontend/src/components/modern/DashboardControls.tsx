import React from 'react';
import {
   Box,
   ButtonGroup,
   Button,
   IconButton,
   Menu,
   MenuItem,
   ListItemIcon,
   ListItemText,
   Typography,
   Divider,
   Switch,
   FormControlLabel,
   Tooltip,
} from '@mui/material';
import {
   Settings as SettingsIcon,
   Refresh as RefreshIcon,
   ViewDay as DayIcon,
   ViewWeek as WeekIcon,
   CalendarMonth as MonthIcon,
   CalendarToday as YearIcon,
   InsertChart as ChartIcon,
   People as PeopleIcon,
   Description as NotesIcon,
   Medication as MedicationIcon,
   AttachMoney as RevenueIcon,
} from '@mui/icons-material';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { SlideUp } from './animations/AnimatedComponents';

const DashboardControls = () => {
   // Get date filter and dashboard config from store
   const {
      dateFilter,
      setDateFilter,
      dashboardConfig,
      setDashboardConfig,
      loading,
   } = useAnalyticsStore();

   // Menu state
   const [settingsAnchorEl, setSettingsAnchorEl] =
      React.useState<null | HTMLElement>(null);
   const isSettingsOpen = Boolean(settingsAnchorEl);

   const handleSettingsOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
      setSettingsAnchorEl(event.currentTarget);
   };

   const handleSettingsClose = () => {
      setSettingsAnchorEl(null);
   };

   const handleRefresh = () => {
      // Re-fetch or refresh dashboard data
      useAnalyticsStore.getState().simulateRealtimeUpdate();
   };

   return (
      <SlideUp>
         <Box
            sx={{
               display: 'flex',
               justifyContent: 'space-between',
               flexWrap: 'wrap',
               mb: 3,
               gap: 2,
            }}
         >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
               <Typography
                  variant="h5"
                  component="h1"
                  sx={{ mr: 2, fontWeight: 'bold' }}
               >
                  Dashboard
               </Typography>
               <ButtonGroup
                  variant="outlined"
                  aria-label="Date filter"
                  size="small"
                  sx={{
                     borderRadius: 2,
                     '.MuiButtonGroup-grouped': {
                        '&:first-of-type': {
                           borderTopLeftRadius: 8,
                           borderBottomLeftRadius: 8,
                        },
                        '&:last-of-type': {
                           borderTopRightRadius: 8,
                           borderBottomRightRadius: 8,
                        },
                     },
                  }}
               >
                  <Tooltip title="Today">
                     <Button
                        onClick={() => setDateFilter('day')}
                        variant={
                           dateFilter === 'day' ? 'contained' : 'outlined'
                        }
                        startIcon={<DayIcon />}
                     >
                        Day
                     </Button>
                  </Tooltip>
                  <Tooltip title="This Week">
                     <Button
                        onClick={() => setDateFilter('week')}
                        variant={
                           dateFilter === 'week' ? 'contained' : 'outlined'
                        }
                        startIcon={<WeekIcon />}
                     >
                        Week
                     </Button>
                  </Tooltip>
                  <Tooltip title="This Month">
                     <Button
                        onClick={() => setDateFilter('month')}
                        variant={
                           dateFilter === 'month' ? 'contained' : 'outlined'
                        }
                        startIcon={<MonthIcon />}
                     >
                        Month
                     </Button>
                  </Tooltip>
                  <Tooltip title="This Year">
                     <Button
                        onClick={() => setDateFilter('year')}
                        variant={
                           dateFilter === 'year' ? 'contained' : 'outlined'
                        }
                        startIcon={<YearIcon />}
                     >
                        Year
                     </Button>
                  </Tooltip>
               </ButtonGroup>
            </Box>

            <Box>
               <Tooltip title="Refresh Data">
                  <IconButton
                     onClick={handleRefresh}
                     disabled={loading}
                     sx={{ mr: 1 }}
                  >
                     <RefreshIcon />
                  </IconButton>
               </Tooltip>

               <Tooltip title="Dashboard Settings">
                  <IconButton
                     onClick={handleSettingsOpen}
                     aria-controls={
                        isSettingsOpen ? 'dashboard-settings-menu' : undefined
                     }
                     aria-haspopup="true"
                     aria-expanded={isSettingsOpen ? 'true' : undefined}
                  >
                     <SettingsIcon />
                  </IconButton>
               </Tooltip>

               <Menu
                  id="dashboard-settings-menu"
                  anchorEl={settingsAnchorEl}
                  open={isSettingsOpen}
                  onClose={handleSettingsClose}
                  MenuListProps={{
                     'aria-labelledby': 'dashboard-settings-button',
                  }}
                  PaperProps={{
                     sx: {
                        mt: 1.5,
                        width: 320,
                        borderRadius: 2,
                        boxShadow: 4,
                     },
                  }}
               >
                  <MenuItem sx={{ pointerEvents: 'none' }}>
                     <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 'bold' }}
                     >
                        Dashboard Customization
                     </Typography>
                  </MenuItem>
                  <Divider />

                  <MenuItem sx={{ py: 0.5 }}>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={dashboardConfig.showPatientMetrics}
                              onChange={(e) =>
                                 setDashboardConfig({
                                    showPatientMetrics: e.target.checked,
                                 })
                              }
                              size="small"
                              color="primary"
                           />
                        }
                        label={
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                 <PeopleIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Patient Metrics" />
                           </Box>
                        }
                        sx={{ ml: 0, width: '100%' }}
                     />
                  </MenuItem>

                  <MenuItem sx={{ py: 0.5 }}>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={dashboardConfig.showNotesMetrics}
                              onChange={(e) =>
                                 setDashboardConfig({
                                    showNotesMetrics: e.target.checked,
                                 })
                              }
                              size="small"
                              color="primary"
                           />
                        }
                        label={
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                 <NotesIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Notes Metrics" />
                           </Box>
                        }
                        sx={{ ml: 0, width: '100%' }}
                     />
                  </MenuItem>

                  <MenuItem sx={{ py: 0.5 }}>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={dashboardConfig.showMedicationMetrics}
                              onChange={(e) =>
                                 setDashboardConfig({
                                    showMedicationMetrics: e.target.checked,
                                 })
                              }
                              size="small"
                              color="primary"
                           />
                        }
                        label={
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                 <MedicationIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Medication Metrics" />
                           </Box>
                        }
                        sx={{ ml: 0, width: '100%' }}
                     />
                  </MenuItem>

                  <MenuItem sx={{ py: 0.5 }}>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={dashboardConfig.showRevenueMetrics}
                              onChange={(e) =>
                                 setDashboardConfig({
                                    showRevenueMetrics: e.target.checked,
                                 })
                              }
                              size="small"
                              color="primary"
                           />
                        }
                        label={
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                 <RevenueIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Revenue Metrics" />
                           </Box>
                        }
                        sx={{ ml: 0, width: '100%' }}
                     />
                  </MenuItem>

                  <Divider />

                  <MenuItem sx={{ py: 0.5 }}>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={dashboardConfig.showDemographicsChart}
                              onChange={(e) =>
                                 setDashboardConfig({
                                    showDemographicsChart: e.target.checked,
                                 })
                              }
                              size="small"
                              color="primary"
                           />
                        }
                        label={
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                 <ChartIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Demographics Chart" />
                           </Box>
                        }
                        sx={{ ml: 0, width: '100%' }}
                     />
                  </MenuItem>

                  <MenuItem sx={{ py: 0.5 }}>
                     <FormControlLabel
                        control={
                           <Switch
                              checked={dashboardConfig.showConsultationsChart}
                              onChange={(e) =>
                                 setDashboardConfig({
                                    showConsultationsChart: e.target.checked,
                                 })
                              }
                              size="small"
                              color="primary"
                           />
                        }
                        label={
                           <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                 <ChartIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary="Consultations Chart" />
                           </Box>
                        }
                        sx={{ ml: 0, width: '100%' }}
                     />
                  </MenuItem>

                  <Divider />

                  <MenuItem
                     onClick={() =>
                        setDashboardConfig({
                           showPatientMetrics: true,
                           showNotesMetrics: true,
                           showMedicationMetrics: true,
                           showRevenueMetrics: true,
                           showDemographicsChart: true,
                           showConsultationsChart: true,
                           showTopDiseases: true,
                           showTopMedications: true,
                           showAppointments: true,
                        })
                     }
                  >
                     <ListItemIcon>
                        <RefreshIcon fontSize="small" />
                     </ListItemIcon>
                     <ListItemText>Reset to Default</ListItemText>
                  </MenuItem>
               </Menu>
            </Box>
         </Box>
      </SlideUp>
   );
};

export default DashboardControls;
