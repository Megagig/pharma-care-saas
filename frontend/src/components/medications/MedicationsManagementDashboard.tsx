
import MedicationChart from './MedicationChart';

import medicationManagementService from '../../services/medicationManagementService';

import { Button, Card, CardContent, Tooltip, Spinner, Alert, AlertTitle } from '@/components/ui/button';

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
    <div>
      {/* Page header with export button */}
      <div
        className=""
      >
        <div  component="h1">
          Medication Management Dashboard
        </div>
        <div>
          <Tooltip title="Export Data">
            <Button
              
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
        </div>
      </div>

      {/* Show error alert if any API call fails */}
      {(statsError || patientsError || trendsError) && (
        <Alert severity="error" className="">
          There was an error loading the dashboard data. Please try refreshing
          the page.
        </Alert>
      )}

      <div container spacing={3}>
        {/* Stats Cards */}
        <div >
          <Card>
            <CardContent>
              <div  gutterBottom>
                Active Medications
              </div>
              {statsLoading ? (
                <div className="">
                  <Spinner size={40} />
                </div>
              ) : (
                <>
                  <div >
                    {statsData?.activeMedications || 0}
                  </div>
                  <div  color="text.secondary">
                    Across all patients
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <div >
          <Card>
            <CardContent>
              <div  gutterBottom>
                Average Adherence
              </div>
              {statsLoading ? (
                <div className="">
                  <Spinner size={40} />
                </div>
              ) : (
                <>
                  <div >
                    {statsData?.averageAdherence || 0}%
                  </div>
                  <div  color="text.secondary">
                    Based on refill patterns
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <div >
          <Card>
            <CardContent>
              <div  gutterBottom>
                Interaction Alerts
              </div>
              {statsLoading ? (
                <div className="">
                  <Spinner size={40} />
                </div>
              ) : (
                <>
                  <div >
                    {statsData?.interactionAlerts || 0}
                  </div>
                  <div  color="text.secondary">
                    Requiring attention
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Medication Interaction Alerts Summary */}
        <div >
          <Card className="">
            <CardContent>
              <div
                className=""
              >
                <div >Recent Interaction Alerts</div>
                <Button
                  
                  to="/medication-interactions"
                  size="small"
                >
                  View All
                </Button>
              </div>

              {statsLoading ? (
                <div className="">
                  <Spinner />
                </div>
              ) : statsData?.interactionAlerts === 0 ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  No medication interaction alerts detected
                </Alert>
              ) : (
                <Alert
                  severity="warning"
                  className=""
                >
                  <div>
                    <AlertTitle>Attention Required</AlertTitle>
                    {statsData?.interactionAlerts} potential medication{' '}
                    {statsData?.interactionAlerts === 1
                      ? 'interaction'
                      : 'interactions'}{' '}
                    detected
                  </div>
                  <Button
                    
                    color="warning"
                    
                    to="/medication-interactions"
                    size="small"
                  >
                    Review Now
                  </Button>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div >
          <div className="">
            <div
              className=""
            >
              <div >Medication Adherence Trends</div>
              <div>
                <Button
                  size="small"
                  variant={trendsPeriod === 'week' ? 'contained' : 'outlined'}
                  className=""
                  onClick={() => setTrendsPeriod('week')}
                >
                  Week
                </Button>
                <Button
                  size="small"
                  variant={trendsPeriod === 'month' ? 'contained' : 'outlined'}
                  className=""
                  onClick={() => setTrendsPeriod('month')}
                >
                  Month
                </Button>
                <Button
                  size="small"
                  variant={trendsPeriod === 'year' ? 'contained' : 'outlined'}
                  onClick={() => setTrendsPeriod('year')}
                >
                  Year
                </Button>
              </div>
            </div>
            <div className="">
              {trendsLoading ? (
                <div
                  className=""
                >
                  <Spinner />
                </div>
              ) : trendsError ? (
                <div
                  className=""
                >
                  <div color="error">
                    Failed to load chart data
                  </div>
                </div>
              ) : (
                <MedicationChart data={trendsData || []} />
              )}
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div >
          <div className="">
            <div
              className=""
            >
              <div >Recent Patients</div>
              <Button  to="/patients" size="small">
                View All
              </Button>
            </div>

            {patientsLoading ? (
              <div className="">
                <Spinner />
              </div>
            ) : patientsError ? (
              <Alert severity="error">Failed to load recent patients</Alert>
            ) : patientsData && patientsData.length > 0 ? (
              patientsData.map((patient) => (
                <Card key={patient.id} className="">
                  <CardContent className="">
                    <div
                      className=""
                    >
                      <div className="">
                        <div
                          className=""
                        >
                          <PeopleIcon className="" />
                        </div>
                        <div>
                          <div  fontWeight="bold">
                            {patient.name}
                          </div>
                          <div  color="text.secondary">
                            {patient.medicationCount} medications •{' '}
                            {patient.lastUpdate}
                          </div>
                        </div>
                      </div>
                      <Button
                        
                        to={`/patients/${patient.id}/medications`}
                        size="small"
                        
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert severity="info">No recent patients with medications</Alert>
            )}

            <div className="">
              <Button
                
                
                to="/patients?for=medications"
              >
                Select Patient
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationsManagementDashboard;
