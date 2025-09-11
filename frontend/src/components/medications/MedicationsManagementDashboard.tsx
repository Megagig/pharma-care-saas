import {
   Typography,
   Box,
   Button,
   Paper,
   Grid,
   Card,
   CardContent,
   CircularProgress,
   Alert,
   AlertTitle,
   Tooltip,
   Menu,
   MenuItem,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { People as PeopleIcon } from '@mui/icons-material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import MedicationChart from './MedicationChart';
import medicationManagementService from '../../services/medicationManagementService';

interface DashboardStats {
   activeMedications: number;
   averageAdherence: number;
   interactionAlerts: number;
}

interface RecentPatient {
   id: string;
   name: string;
   medicationCount: number;
   lastUpdate: string;
}

interface AdherenceTrend {
   name: string;
   adherence: number;
}

const MedicationsManagementDashboard = () => {
   // State for time period filtering
   const [trendsPeriod, setTrendsPeriod] = React.useState<string>('month');

   // Export menu state
   const [exportMenuAnchorEl, setExportMenuAnchorEl] =
      React.useState<null | HTMLElement>(null);
   const isExportMenuOpen = Boolean(exportMenuAnchorEl);

   // Export menu handlers
   const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      setExportMenuAnchorEl(event.currentTarget);
   };

   const handleExportMenuClose = () => {
      setExportMenuAnchorEl(null);
   };

   // Handle exports
   const handleExportCSV = () => {
      // Here you would generate and download a CSV file
      // For now, we'll just show an alert
      alert('Exporting medications data as CSV...');
      // Close the menu
      handleExportMenuClose();
   };

   const handleExportPDF = () => {
      // Here you would generate and download a PDF file
      // For now, we'll just show an alert
      alert('Exporting medications data as PDF...');
      // Close the menu
      handleExportMenuClose();
   };

   // Fetch dashboard statistics
   const {
      data: statsData,
      isLoading: statsLoading,
      error: statsError,
   } = useQuery({
      queryKey: ['medicationDashboardStats'],
      queryFn: async (): Promise<DashboardStats> => {
         try {
            return await medicationManagementService.getDashboardStats();
         } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Return default data to prevent undefined errors
            return {
               activeMedications: 0,
               averageAdherence: 0,
               interactionAlerts: 0,
            };
         }
      },
   });

   // Fetch recent patients with medications
   const {
      data: patientsData,
      isLoading: patientsLoading,
      error: patientsError,
   } = useQuery({
      queryKey: ['recentPatientsWithMedications'],
      queryFn: async (): Promise<RecentPatient[]> => {
         try {
            return await medicationManagementService.getRecentPatientsWithMedications();
         } catch (error) {
            console.error('Error fetching recent patients:', error);
            // Return empty array to prevent undefined errors
            return [];
         }
      },
   });

   // Fetch adherence trends data for chart
   const {
      data: trendsData,
      isLoading: trendsLoading,
      error: trendsError,
   } = useQuery({
      queryKey: ['medicationAdherenceTrends', trendsPeriod],
      queryFn: async (): Promise<AdherenceTrend[]> => {
         try {
            return await medicationManagementService.getAdherenceTrends(
               trendsPeriod
            );
         } catch (error) {
            console.error('Error fetching adherence trends:', error);
            // Return empty array to prevent undefined errors
            return [];
         }
      },
   });

   return (
      <Box>
         {/* Page header with export button */}
         <Box
            sx={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               mb: 3,
            }}
         >
            <Typography variant="h5" component="h1">
               Medication Management Dashboard
            </Typography>
            <Box>
               <Tooltip title="Export Data">
                  <Button
                     variant="outlined"
                     startIcon={<FileDownloadIcon />}
                     onClick={handleExportMenuOpen}
                     size="small"
                  >
                     Export
                  </Button>
               </Tooltip>
               <Menu
                  anchorEl={exportMenuAnchorEl}
                  open={isExportMenuOpen}
                  onClose={handleExportMenuClose}
               >
                  <MenuItem onClick={handleExportCSV}>Export as CSV</MenuItem>
                  <MenuItem onClick={handleExportPDF}>Export as PDF</MenuItem>
               </Menu>
            </Box>
         </Box>

         {/* Show error alert if any API call fails */}
         {(statsError || patientsError || trendsError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
               There was an error loading the dashboard data. Please try
               refreshing the page.
            </Alert>
         )}

         <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid size={{ xs: 12, md: 4 }}>
               <Card>
                  <CardContent>
                     <Typography variant="h6" gutterBottom>
                        Active Medications
                     </Typography>
                     {statsLoading ? (
                        <Box
                           sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              my: 2,
                           }}
                        >
                           <CircularProgress size={40} />
                        </Box>
                     ) : (
                        <>
                           <Typography variant="h3">
                              {statsData?.activeMedications || 0}
                           </Typography>
                           <Typography variant="body2" color="text.secondary">
                              Across all patients
                           </Typography>
                        </>
                     )}
                  </CardContent>
               </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Card>
                  <CardContent>
                     <Typography variant="h6" gutterBottom>
                        Average Adherence
                     </Typography>
                     {statsLoading ? (
                        <Box
                           sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              my: 2,
                           }}
                        >
                           <CircularProgress size={40} />
                        </Box>
                     ) : (
                        <>
                           <Typography variant="h3">
                              {statsData?.averageAdherence || 0}%
                           </Typography>
                           <Typography variant="body2" color="text.secondary">
                              Based on refill patterns
                           </Typography>
                        </>
                     )}
                  </CardContent>
               </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
               <Card>
                  <CardContent>
                     <Typography variant="h6" gutterBottom>
                        Interaction Alerts
                     </Typography>
                     {statsLoading ? (
                        <Box
                           sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              my: 2,
                           }}
                        >
                           <CircularProgress size={40} />
                        </Box>
                     ) : (
                        <>
                           <Typography variant="h3">
                              {statsData?.interactionAlerts || 0}
                           </Typography>
                           <Typography variant="body2" color="text.secondary">
                              Requiring attention
                           </Typography>
                        </>
                     )}
                  </CardContent>
               </Card>
            </Grid>

            {/* Medication Interaction Alerts Summary */}
            <Grid size={{ xs: 12, md: 12 }}>
               <Card sx={{ mb: 3 }}>
                  <CardContent>
                     <Box
                        sx={{
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center',
                           mb: 2,
                        }}
                     >
                        <Typography variant="h6">
                           Recent Interaction Alerts
                        </Typography>
                        <Button
                           component={Link}
                           to="/medication-interactions"
                           size="small"
                        >
                           View All
                        </Button>
                     </Box>

                     {statsLoading ? (
                        <Box
                           sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              py: 4,
                           }}
                        >
                           <CircularProgress />
                        </Box>
                     ) : statsData?.interactionAlerts === 0 ? (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                           No medication interaction alerts detected
                        </Alert>
                     ) : (
                        <Alert
                           severity="warning"
                           sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                           }}
                        >
                           <div>
                              <AlertTitle>Attention Required</AlertTitle>
                              {statsData?.interactionAlerts} potential
                              medication{' '}
                              {statsData?.interactionAlerts === 1
                                 ? 'interaction'
                                 : 'interactions'}{' '}
                              detected
                           </div>
                           <Button
                              variant="contained"
                              color="warning"
                              component={Link}
                              to="/medication-interactions"
                              size="small"
                           >
                              Review Now
                           </Button>
                        </Alert>
                     )}
                  </CardContent>
               </Card>
            </Grid>

            {/* Charts */}
            <Grid size={{ xs: 12, md: 8 }}>
               <Paper sx={{ p: 3 }}>
                  <Box
                     sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                     }}
                  >
                     <Typography variant="h6">
                        Medication Adherence Trends
                     </Typography>
                     <Box>
                        <Button
                           size="small"
                           variant={
                              trendsPeriod === 'week' ? 'contained' : 'outlined'
                           }
                           sx={{ mr: 1 }}
                           onClick={() => setTrendsPeriod('week')}
                        >
                           Week
                        </Button>
                        <Button
                           size="small"
                           variant={
                              trendsPeriod === 'month'
                                 ? 'contained'
                                 : 'outlined'
                           }
                           sx={{ mr: 1 }}
                           onClick={() => setTrendsPeriod('month')}
                        >
                           Month
                        </Button>
                        <Button
                           size="small"
                           variant={
                              trendsPeriod === 'year' ? 'contained' : 'outlined'
                           }
                           onClick={() => setTrendsPeriod('year')}
                        >
                           Year
                        </Button>
                     </Box>
                  </Box>
                  <Box sx={{ height: 300 }}>
                     {trendsLoading ? (
                        <Box
                           sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '100%',
                           }}
                        >
                           <CircularProgress />
                        </Box>
                     ) : trendsError ? (
                        <Box
                           sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '100%',
                              border: '1px dashed',
                              borderColor: 'divider',
                              borderRadius: 1,
                           }}
                        >
                           <Typography color="error">
                              Failed to load chart data
                           </Typography>
                        </Box>
                     ) : (
                        <MedicationChart data={trendsData || []} />
                     )}
                  </Box>
               </Paper>
            </Grid>

            {/* Recent Patients */}
            <Grid size={{ xs: 12, md: 4 }}>
               <Paper sx={{ p: 3 }}>
                  <Box
                     sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                     }}
                  >
                     <Typography variant="h6">Recent Patients</Typography>
                     <Button component={Link} to="/patients" size="small">
                        View All
                     </Button>
                  </Box>

                  {patientsLoading ? (
                     <Box
                        sx={{
                           display: 'flex',
                           justifyContent: 'center',
                           my: 4,
                        }}
                     >
                        <CircularProgress />
                     </Box>
                  ) : patientsError ? (
                     <Alert severity="error">
                        Failed to load recent patients
                     </Alert>
                  ) : patientsData && patientsData.length > 0 ? (
                     patientsData.map((patient) => (
                        <Card key={patient.id} sx={{ mb: 2 }}>
                           <CardContent
                              sx={{ py: 2, '&:last-child': { pb: 2 } }}
                           >
                              <Box
                                 sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                 }}
                              >
                                 <Box
                                    sx={{
                                       display: 'flex',
                                       alignItems: 'center',
                                    }}
                                 >
                                    <Box
                                       sx={{
                                          width: 40,
                                          height: 40,
                                          borderRadius: '50%',
                                          bgcolor: 'primary.light',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          mr: 2,
                                       }}
                                    >
                                       <PeopleIcon
                                          sx={{ color: 'primary.main' }}
                                       />
                                    </Box>
                                    <Box>
                                       <Typography
                                          variant="body1"
                                          fontWeight="bold"
                                       >
                                          {patient.name}
                                       </Typography>
                                       <Typography
                                          variant="body2"
                                          color="text.secondary"
                                       >
                                          {patient.medicationCount} medications
                                          • {patient.lastUpdate}
                                       </Typography>
                                    </Box>
                                 </Box>
                                 <Button
                                    component={Link}
                                    to={`/patients/${patient.id}/medications`}
                                    size="small"
                                    variant="outlined"
                                 >
                                    View
                                 </Button>
                              </Box>
                           </CardContent>
                        </Card>
                     ))
                  ) : (
                     <Alert severity="info">
                        No recent patients with medications
                     </Alert>
                  )}

                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                     <Button
                        variant="contained"
                        component={Link}
                        to="/patients?for=medications"
                     >
                        Select Patient
                     </Button>
                  </Box>
               </Paper>
            </Grid>
         </Grid>
      </Box>
   );
};

export default MedicationsManagementDashboard;
