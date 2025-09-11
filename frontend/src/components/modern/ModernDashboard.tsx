import React, { useMemo } from 'react';
import {
   Box,
   Typography,
   Card,
   CardContent,
   Avatar,
   Chip,
   IconButton,
   Button,
   Paper,
   LinearProgress,
   Container,
   Grid,
   Stack,
   Divider,
   useTheme,
   alpha,
   Tooltip,
} from '@mui/material';
import {
   People as PeopleIcon,
   Description as DescriptionIcon,
   Medication as MedicationIcon,
   TrendingUp as TrendingUpIcon,
   Warning as WarningIcon,
   Schedule as ScheduleIcon,
   MoreHoriz as MoreHorizIcon,
   Add as AddIcon,
   Notifications as NotificationsIcon,
   CalendarToday as CalendarIcon,
   Timeline as TimelineIcon,
   Event as EventIcon,
   AccessTime as AccessTimeIcon,
   FlagCircle as FlagIcon,
   Analytics as AnalyticsIcon,
   MedicalServices as MedicalServicesIcon,
   InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { useDashboardData } from '../../stores/hooks';
import {
   useAnalyticsStore,
   MetricData,
   PatientDemographic,
   Disease,
   Medication,
   ConsultationData,
   Appointment,
} from '../../stores/analyticsStore';
import { useNavigate } from 'react-router-dom';
import DashboardControls from './DashboardControls';
import {
   AnimatedCard,
   SlideUp,
   FadeIn,
   AnimateList,
   ScaleIn,
} from './animations/AnimatedComponents';

// Import charts
import {
   ResponsiveContainer,
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip as RechartsTooltip,
   Legend,
   PieChart,
   Pie,
   Cell,
   LineChart,
   Line,
} from 'recharts';

// Import custom theme styles
import '../../styles/dashboardTheme.css';

const ModernDashboard = () => {
   const theme = useTheme();
   const navigate = useNavigate();
   const dashboardData = useDashboardData();

   // Get analytics data and config from the store
   const {
      patientDemographics,
      topDiseases,
      topMedications,
      monthlyConsultations,
      upcomingAppointments,
      dateFilter,
      dashboardConfig,
      patientMetrics,
      notesMetrics,
      medicationMetrics,
      revenueMetrics,
   } = useAnalyticsStore();

   // Stats data for key metrics using the store data
   const stats = useMemo(
      () => [
         {
            title: 'Total Patients',
            value: patientMetrics.value.toString(),
            change: `${patientMetrics.changeType === 'increase' ? '+' : '-'}${
               patientMetrics.change
            }%`,
            changeType: patientMetrics.changeType,
            icon: PeopleIcon,
            color: 'primary',
            gradient: 'var(--gradient-blue)',
            progress: Math.min((patientMetrics.value / 2000) * 100, 100),
            visible: dashboardConfig.showPatientMetrics,
         },
         {
            title: 'Clinical Notes',
            value: notesMetrics.value.toString(),
            change: `${notesMetrics.changeType === 'increase' ? '+' : '-'}${
               notesMetrics.change
            }%`,
            changeType: notesMetrics.changeType,
            icon: DescriptionIcon,
            color: 'secondary',
            gradient: 'var(--gradient-purple)',
            progress: Math.min((notesMetrics.value / 10000) * 100, 100),
            visible: dashboardConfig.showNotesMetrics,
         },
         {
            title: 'Medications',
            value: medicationMetrics.value.toString(),
            change: `${medicationMetrics.changeType === 'increase' ? '+' : '-'}${
               medicationMetrics.change
            }%`,
            changeType: medicationMetrics.changeType,
            icon: MedicationIcon,
            color: 'success',
            gradient: 'var(--gradient-green)',
            progress: Math.min((medicationMetrics.value / 5000) * 100, 100),
            visible: dashboardConfig.showMedicationMetrics,
         },
         {
            title: 'Revenue',
            value: `$${(revenueMetrics.value / 1000).toFixed(1)}k`,
            change: `${revenueMetrics.changeType === 'increase' ? '+' : '-'}${
               revenueMetrics.change
            }%`,
            changeType: revenueMetrics.changeType,
            icon: TrendingUpIcon,
            color: 'warning',
            gradient: 'var(--gradient-amber)',
            progress: Math.min((revenueMetrics.value / 300000) * 100, 100),
            visible: dashboardConfig.showRevenueMetrics,
         },
      ],
      [
         patientMetrics.value,
         patientMetrics.change,
         patientMetrics.changeType,
         notesMetrics.value,
         notesMetrics.change,
         notesMetrics.changeType,
         medicationMetrics.value,
         medicationMetrics.change,
         medicationMetrics.changeType,
         revenueMetrics.value,
         revenueMetrics.change,
         revenueMetrics.changeType,
         dashboardConfig.showPatientMetrics,
         dashboardConfig.showNotesMetrics,
         dashboardConfig.showMedicationMetrics,
         dashboardConfig.showRevenueMetrics,
      ]
   );

   // Get chart colors from theme
   const getChartColors = useMemo(() => {
      return [
         theme.palette.primary.main,
         theme.palette.secondary.main,
         theme.palette.success.main,
         theme.palette.warning.main,
         theme.palette.error.main,
      ];
   }, [theme]);

   // Format number with commas
   const formatNumber = (num: number) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
   };

   // Render metric card with animation
   const renderMetricCard = (stat: any, index: number) => {
      if (!stat.visible) return null;

      const Icon = stat.icon;
      return (
         <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <AnimatedCard delay={index * 0.1}>
               <Card
                  className="dashboard-card metric-card"
                  sx={{
                     height: '100%',
                     transition: 'all 0.3s ease',
                     '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                     },
                  }}
               >
                  <CardContent>
                     <Box
                        sx={{
                           display: 'flex',
                           justifyContent: 'space-between',
                           mb: 2,
                        }}
                     >
                        <Typography variant="subtitle1" color="text.secondary">
                           {stat.title}
                        </Typography>
                        <Tooltip title="More information">
                           <IconButton size="small">
                              <InfoIcon fontSize="small" />
                           </IconButton>
                        </Tooltip>
                     </Box>

                     <Typography
                        variant="h4"
                        component="div"
                        sx={{ mb: 1, fontWeight: 'bold' }}
                     >
                        {stat.value}
                     </Typography>

                     <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Chip
                           size="small"
                           label={stat.change}
                           color={
                              stat.changeType === 'increase'
                                 ? 'success'
                                 : 'error'
                           }
                           sx={{
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              backgroundColor:
                                 stat.changeType === 'increase'
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : alpha(theme.palette.error.main, 0.1),
                              color:
                                 stat.changeType === 'increase'
                                    ? theme.palette.success.main
                                    : theme.palette.error.main,
                           }}
                        />
                        <Typography
                           variant="caption"
                           color="text.secondary"
                           sx={{ ml: 1 }}
                        >
                           vs previous {dateFilter}
                        </Typography>
                     </Box>

                     <LinearProgress
                        variant="determinate"
                        value={stat.progress}
                        color={stat.color as any}
                        sx={{
                           height: 8,
                           borderRadius: 4,
                           bgcolor: alpha(theme.palette[stat.color].main, 0.1),
                        }}
                     />
                  </CardContent>
               </Card>
            </AnimatedCard>
         </Grid>
      );
   };

   // Upcoming appointments data
   const followUps =
      upcomingAppointments.length > 0
         ? upcomingAppointments
         : [
              {
                 patientName: 'Anthony Austin',
                 appointmentType: 'Blood Pressure Check',
                 scheduledDate: 'Oct 27, 2023, 9:00 AM',
                 priority: 'high',
                 avatar: 'A',
              },
              {
                 patientName: 'Michael Chen',
                 appointmentType: 'Diabetes Follow-up',
                 scheduledDate: 'Oct 28, 2023, 2:30 PM',
                 priority: 'medium',
                 avatar: 'M',
              },
              {
                 patientName: 'Emma Wilson',
                 appointmentType: 'Asthma Review',
                 scheduledDate: 'Oct 30, 2023, 11:15 AM',
                 priority: 'low',
                 avatar: 'E',
              },
              {
                 patientName: 'Robert Kim',
                 appointmentType: 'Medication Adjustment',
                 scheduledDate: 'Nov 2, 2023, 9:00 AM',
                 priority: 'medium',
                 avatar: 'R',
              },
           ];

   // Today's schedule data
   const todaysSchedule = [
      {
         time: '9:00 AM',
         patientName: 'John Doe',
         reason: 'Blood Pressure',
      },
      {
         time: '11:00 AM',
         patientName: 'Jane Smith',
         reason: 'Medication Review',
      },
      {
         time: '2:30 PM',
         patientName: 'Robert Johnson',
         reason: 'Health Coaching',
      },
   ];

   // Use data from analytics store
   const patientDemographicsData =
      patientDemographics.length > 0
         ? patientDemographics
         : [
              { name: 'Seniors', value: 35, color: theme.palette.primary.main },
              {
                 name: 'Adults',
                 value: 45,
                 color: theme.palette.secondary.main,
              },
              {
                 name: 'Young Adults',
                 value: 15,
                 color: theme.palette.success.main,
              },
              { name: 'Children', value: 5, color: theme.palette.warning.main },
           ];

   const topDiseaseData =
      topDiseases.length > 0
         ? topDiseases
         : [
              { name: 'Hypertension', value: 65 },
              { name: 'Diabetes', value: 42 },
              { name: 'Asthma', value: 28 },
              { name: 'Heart Disease', value: 22 },
              { name: 'Arthritis', value: 18 },
           ];

   const topMedicationsData =
      topMedications.length > 0
         ? topMedications
         : [
              { name: 'Lisinopril', value: 38 },
              { name: 'Metformin', value: 30 },
              { name: 'Atorvastatin', value: 25 },
              { name: 'Albuterol', value: 22 },
              { name: 'Levothyroxine', value: 20 },
           ];

   const monthlyConsultationsData =
      monthlyConsultations.length > 0
         ? monthlyConsultations
         : [
              { month: 'Jan', count: 45 },
              { month: 'Feb', count: 52 },
              { month: 'Mar', count: 48 },
              { month: 'Apr', count: 61 },
              { month: 'May', count: 55 },
              { month: 'Jun', count: 67 },
              { month: 'Jul', count: 71 },
              { month: 'Aug', count: 78 },
              { month: 'Sep', count: 83 },
              { month: 'Oct', count: 79 },
           ];

   // Function to get status color
   const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
         case 'high':
            return theme.palette.error.main;
         case 'medium':
            return theme.palette.warning.main;
         case 'low':
            return theme.palette.success.main;
         default:
            return theme.palette.primary.main;
      }
   };

   // Function to get priority color
   const getPriorityColor = (priority: string) => {
      switch (priority.toLowerCase()) {
         case 'high':
            return theme.palette.error.main;
         case 'medium':
            return theme.palette.warning.main;
         case 'low':
            return theme.palette.success.main;
         default:
            return theme.palette.primary.main;
      }
   };

   return (
      <Container
         maxWidth="xl"
         sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}
      >
         {/* Dashboard Controls */}
         <FadeIn>
            <DashboardControls />
         </FadeIn>

         {/* Key Metrics */}
         <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => renderMetricCard(stat, index))}
         </Grid>

         {/* Charts Section */}
         <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Patient Demographics */}
            {dashboardConfig.showDemographicsChart && (
               <Grid item xs={12} md={5} lg={4}>
                  <ScaleIn delay={0.2}>
                     <Card
                        className="dashboard-card"
                        sx={{
                           height: '100%',
                           transition: 'all 0.3s ease',
                           '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                           },
                        }}
                     >
                        <CardContent>
                           <Typography
                              variant="h6"
                              gutterBottom
                              sx={{ fontWeight: 'bold' }}
                           >
                              Patient Demographics
                           </Typography>
                           <Box sx={{ height: 300, mt: 2 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie
                                       data={patientDemographicsData}
                                       cx="50%"
                                       cy="50%"
                                       labelLine={false}
                                       outerRadius={100}
                                       fill="#8884d8"
                                       dataKey="value"
                                       nameKey="name"
                                       label={({ name, percent }) =>
                                          `${name}: ${(percent * 100).toFixed(0)}%`
                                       }
                                    >
                                       {patientDemographicsData.map(
                                          (entry, index) => (
                                             <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                   entry.color ||
                                                   getChartColors[
                                                      index %
                                                         getChartColors.length
                                                   ]
                                                }
                                             />
                                          )
                                       )}
                                    </Pie>
                                    <Legend
                                       layout="vertical"
                                       verticalAlign="bottom"
                                    />
                                 </PieChart>
                              </ResponsiveContainer>
                           </Box>
                        </CardContent>
                     </Card>
                  </ScaleIn>
               </Grid>
            )}

            {/* Top Diseases */}
            {dashboardConfig.showDiseaseChart && (
               <Grid item xs={12} md={7} lg={4}>
                  <ScaleIn delay={0.3}>
                     <Card
                        className="dashboard-card"
                        sx={{
                           height: '100%',
                           transition: 'all 0.3s ease',
                           '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                           },
                        }}
                     >
                        <CardContent>
                           <Typography
                              variant="h6"
                              gutterBottom
                              sx={{ fontWeight: 'bold' }}
                           >
                              Top Diseases
                           </Typography>
                           <Box sx={{ height: 300, mt: 2 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart
                                    layout="vertical"
                                    data={topDiseaseData}
                                    margin={{
                                       top: 5,
                                       right: 30,
                                       left: 20,
                                       bottom: 5,
                                    }}
                                 >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" />
                                    <RechartsTooltip />
                                    <Bar
                                       dataKey="value"
                                       fill={theme.palette.primary.main}
                                       label={{
                                          position: 'right',
                                          formatter: (value) => `${value}`,
                                       }}
                                    />
                                 </BarChart>
                              </ResponsiveContainer>
                           </Box>
                        </CardContent>
                     </Card>
                  </ScaleIn>
               </Grid>
            )}

            {/* Monthly Consultations */}
            {dashboardConfig.showConsultationsChart && (
               <Grid item xs={12} lg={4}>
                  <ScaleIn delay={0.4}>
                     <Card
                        className="dashboard-card"
                        sx={{
                           height: '100%',
                           transition: 'all 0.3s ease',
                           '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                           },
                        }}
                     >
                        <CardContent>
                           <Typography
                              variant="h6"
                              gutterBottom
                              sx={{ fontWeight: 'bold' }}
                           >
                              Monthly Consultations
                           </Typography>
                           <Box sx={{ height: 300, mt: 2 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                 <LineChart
                                    data={monthlyConsultationsData}
                                    margin={{
                                       top: 5,
                                       right: 30,
                                       left: 20,
                                       bottom: 5,
                                    }}
                                 >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Line
                                       type="monotone"
                                       dataKey="count"
                                       stroke={theme.palette.success.main}
                                       strokeWidth={2}
                                       activeDot={{ r: 8 }}
                                       name="Consultations"
                                    />
                                 </LineChart>
                              </ResponsiveContainer>
                           </Box>
                        </CardContent>
                     </Card>
                  </ScaleIn>
               </Grid>
            )}
         </Grid>

         {/* Second Row - Appointment and Top Medications */}
         <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Upcoming Appointments */}
            {dashboardConfig.showAppointmentsCard && (
               <Grid item xs={12} md={6}>
                  <SlideUp delay={0.5}>
                     <Card
                        className="dashboard-card"
                        sx={{
                           height: '100%',
                           transition: 'all 0.3s ease',
                           '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                           },
                        }}
                     >
                        <CardContent>
                           <Box
                              sx={{
                                 display: 'flex',
                                 justifyContent: 'space-between',
                                 alignItems: 'center',
                                 mb: 2,
                              }}
                           >
                              <Typography
                                 variant="h6"
                                 sx={{ fontWeight: 'bold' }}
                              >
                                 Upcoming Appointments
                              </Typography>
                              <Chip
                                 label={`${followUps.length} total`}
                                 color="primary"
                                 size="small"
                                 sx={{ fontWeight: 'bold' }}
                              />
                           </Box>

                           <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                              <AnimateList>
                                 {followUps.map((appointment, index) => (
                                    <Box
                                       key={index}
                                       sx={{
                                          p: 2,
                                          mb: 1.5,
                                          borderRadius: 2,
                                          bgcolor: alpha(
                                             theme.palette.primary.main,
                                             0.05
                                          ),
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 2,
                                          '&:hover': {
                                             bgcolor: alpha(
                                                theme.palette.primary.main,
                                                0.1
                                             ),
                                          },
                                       }}
                                    >
                                       <Avatar
                                          sx={{
                                             bgcolor: alpha(
                                                theme.palette.primary.main,
                                                0.15
                                             ),
                                             color: theme.palette.primary.main,
                                             fontWeight: 'bold',
                                          }}
                                       >
                                          {appointment.avatar}
                                       </Avatar>
                                       <Box sx={{ flexGrow: 1 }}>
                                          <Typography
                                             variant="body1"
                                             fontWeight="bold"
                                          >
                                             {appointment.patientName}
                                          </Typography>
                                          <Box
                                             sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                             }}
                                          >
                                             <AccessTimeIcon
                                                sx={{
                                                   fontSize: '0.875rem',
                                                   color: 'text.secondary',
                                                }}
                                             />
                                             <Typography
                                                variant="caption"
                                                color="text.secondary"
                                             >
                                                {appointment.scheduledDate}
                                             </Typography>
                                          </Box>
                                          <Typography variant="body2">
                                             {appointment.appointmentType}
                                          </Typography>
                                       </Box>
                                       <Chip
                                          size="small"
                                          label={appointment.priority}
                                          sx={{
                                             bgcolor: alpha(
                                                getPriorityColor(
                                                   appointment.priority
                                                ),
                                                0.1
                                             ),
                                             color: getPriorityColor(
                                                appointment.priority
                                             ),
                                             fontWeight: 'bold',
                                          }}
                                       />
                                    </Box>
                                 ))}
                              </AnimateList>
                           </Box>
                        </CardContent>
                     </Card>
                  </SlideUp>
               </Grid>
            )}

            {/* Top Medications */}
            {dashboardConfig.showMedicationsChart && (
               <Grid item xs={12} md={6}>
                  <SlideUp delay={0.6}>
                     <Card
                        className="dashboard-card"
                        sx={{
                           height: '100%',
                           transition: 'all 0.3s ease',
                           '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0,0,0,0.1)',
                           },
                        }}
                     >
                        <CardContent>
                           <Typography
                              variant="h6"
                              gutterBottom
                              sx={{ fontWeight: 'bold' }}
                           >
                              Top Medications
                           </Typography>
                           <Box sx={{ height: 350, mt: 2 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart
                                    layout="vertical"
                                    data={topMedicationsData}
                                    margin={{
                                       top: 5,
                                       right: 30,
                                       left: 20,
                                       bottom: 5,
                                    }}
                                 >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" />
                                    <RechartsTooltip />
                                    <Bar
                                       dataKey="value"
                                       fill={theme.palette.secondary.main}
                                       label={{
                                          position: 'right',
                                          formatter: (value) => `${value}`,
                                       }}
                                    />
                                 </BarChart>
                              </ResponsiveContainer>
                           </Box>
                        </CardContent>
                     </Card>
                  </SlideUp>
               </Grid>
            )}
         </Grid>

         {/* Quick Actions */}
         <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
               Quick Actions
            </Typography>
            <Grid container spacing={3}>
               <Grid item xs={12} sm={6} md={3}>
                  <FadeIn delay={0.2}>
                     <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PeopleIcon />}
                        sx={{
                           p: 3,
                           borderRadius: 3,
                           bgcolor: theme.palette.primary.main,
                           color: 'white',
                           fontWeight: 'bold',
                           display: 'flex',
                           flexDirection: { xs: 'row', md: 'column' },
                           height: '100%',
                           textAlign: { xs: 'left', md: 'center' },
                           justifyContent: { xs: 'flex-start', md: 'center' },
                           '&:hover': {
                              bgcolor: theme.palette.primary.dark,
                              transform: 'translateY(-5px)',
                           },
                           transition: 'all 0.3s ease',
                        }}
                        onClick={() => navigate('/patients/new')}
                     >
                        <Typography
                           variant="h6"
                           component="span"
                           sx={{
                              mb: { xs: 0, md: 1 },
                              mt: { xs: 0, md: 2 },
                              mr: { xs: 1, md: 0 },
                           }}
                        >
                           New Patient
                        </Typography>
                        <Typography
                           variant="body2"
                           sx={{
                              opacity: 0.8,
                              display: { xs: 'none', md: 'block' },
                           }}
                        >
                           Add patient record
                        </Typography>
                     </Button>
                  </FadeIn>
               </Grid>

               <Grid item xs={12} sm={6} md={3}>
                  <FadeIn delay={0.3}>
                     <Button
                        variant="contained"
                        fullWidth
                        startIcon={<DescriptionIcon />}
                        sx={{
                           p: 3,
                           borderRadius: 3,
                           bgcolor: theme.palette.secondary.main,
                           color: 'white',
                           fontWeight: 'bold',
                           display: 'flex',
                           flexDirection: { xs: 'row', md: 'column' },
                           height: '100%',
                           textAlign: { xs: 'left', md: 'center' },
                           justifyContent: { xs: 'flex-start', md: 'center' },
                           '&:hover': {
                              bgcolor: theme.palette.secondary.dark,
                              transform: 'translateY(-5px)',
                           },
                           transition: 'all 0.3s ease',
                        }}
                        onClick={() => navigate('/notes/new')}
                     >
                        <Typography
                           variant="h6"
                           component="span"
                           sx={{
                              mb: { xs: 0, md: 1 },
                              mt: { xs: 0, md: 2 },
                              mr: { xs: 1, md: 0 },
                           }}
                        >
                           Clinical Notes
                        </Typography>
                        <Typography
                           variant="body2"
                           sx={{
                              opacity: 0.8,
                              display: { xs: 'none', md: 'block' },
                           }}
                        >
                           Create new note
                        </Typography>
                     </Button>
                  </FadeIn>
               </Grid>

               <Grid item xs={12} sm={6} md={3}>
                  <FadeIn delay={0.4}>
                     <Button
                        variant="contained"
                        fullWidth
                        startIcon={<MedicationIcon />}
                        sx={{
                           p: 3,
                           borderRadius: 3,
                           bgcolor: theme.palette.success.main,
                           color: 'white',
                           fontWeight: 'bold',
                           display: 'flex',
                           flexDirection: { xs: 'row', md: 'column' },
                           height: '100%',
                           textAlign: { xs: 'left', md: 'center' },
                           justifyContent: { xs: 'flex-start', md: 'center' },
                           '&:hover': {
                              bgcolor: theme.palette.success.dark,
                              transform: 'translateY(-5px)',
                           },
                           transition: 'all 0.3s ease',
                        }}
                        onClick={() => navigate('/medications/new')}
                     >
                        <Typography
                           variant="h6"
                           component="span"
                           sx={{
                              mb: { xs: 0, md: 1 },
                              mt: { xs: 0, md: 2 },
                              mr: { xs: 1, md: 0 },
                           }}
                        >
                           Add Medication
                        </Typography>
                        <Typography
                           variant="body2"
                           sx={{
                              opacity: 0.8,
                              display: { xs: 'none', md: 'block' },
                           }}
                        >
                           Prescribe medication
                        </Typography>
                     </Button>
                  </FadeIn>
               </Grid>

               <Grid item xs={12} sm={6} md={3}>
                  <FadeIn delay={0.5}>
                     <Button
                        variant="contained"
                        fullWidth
                        startIcon={<TimelineIcon />}
                        sx={{
                           p: 3,
                           borderRadius: 3,
                           bgcolor: theme.palette.warning.main,
                           color: 'white',
                           fontWeight: 'bold',
                           display: 'flex',
                           flexDirection: { xs: 'row', md: 'column' },
                           height: '100%',
                           textAlign: { xs: 'left', md: 'center' },
                           justifyContent: { xs: 'flex-start', md: 'center' },
                           '&:hover': {
                              bgcolor: theme.palette.warning.dark,
                              transform: 'translateY(-5px)',
                           },
                           transition: 'all 0.3s ease',
                        }}
                        onClick={() => navigate('/reports')}
                     >
                        <Typography
                           variant="h6"
                           component="span"
                           sx={{
                              mb: { xs: 0, md: 1 },
                              mt: { xs: 0, md: 2 },
                              mr: { xs: 1, md: 0 },
                           }}
                        >
                           View Reports
                        </Typography>
                        <Typography
                           variant="body2"
                           sx={{
                              opacity: 0.8,
                              display: { xs: 'none', md: 'block' },
                           }}
                        >
                           Check analytics
                        </Typography>
                     </Button>
                  </FadeIn>
               </Grid>
            </Grid>
         </Box>

         {/* Today's Schedule (optional based on configuration) */}
         {dashboardConfig.showScheduleCard && (
            <Box sx={{ mb: 4 }}>
               <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                  Today's Schedule
               </Typography>
               <Grid container spacing={3}>
                  <Grid item xs={12}>
                     <SlideUp delay={0.3}>
                        <Card
                           className="dashboard-card"
                           sx={{
                              borderRadius: 3,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                           }}
                        >
                           <CardContent>
                              <Box
                                 sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2,
                                 }}
                              >
                                 <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 'bold' }}
                                 >
                                    <CalendarIcon
                                       sx={{ mr: 1, verticalAlign: 'middle' }}
                                    />
                                    Today's Appointments
                                 </Typography>
                                 <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<EventIcon />}
                                    onClick={() => navigate('/calendar')}
                                 >
                                    View Calendar
                                 </Button>
                              </Box>
                              <AnimateList>
                                 <Grid container spacing={2}>
                                    {todaysSchedule.map(
                                       (appointment, index) => (
                                          <Grid item xs={12} md={4} key={index}>
                                             <Paper
                                                elevation={0}
                                                sx={{
                                                   p: 2,
                                                   borderRadius: 2,
                                                   bgcolor: alpha(
                                                      theme.palette.primary
                                                         .main,
                                                      0.05
                                                   ),
                                                   border: `1px solid ${alpha(
                                                      theme.palette.primary
                                                         .main,
                                                      0.1
                                                   )}`,
                                                }}
                                             >
                                                <Box
                                                   sx={{
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                   }}
                                                >
                                                   <Avatar
                                                      sx={{
                                                         bgcolor:
                                                            theme.palette
                                                               .primary.main,
                                                         width: 40,
                                                         height: 40,
                                                         mr: 2,
                                                      }}
                                                   >
                                                      {appointment.patientName.charAt(
                                                         0
                                                      )}
                                                   </Avatar>
                                                   <Box>
                                                      <Typography
                                                         variant="subtitle2"
                                                         sx={{
                                                            fontWeight: 'bold',
                                                         }}
                                                      >
                                                         {
                                                            appointment.patientName
                                                         }
                                                      </Typography>
                                                      <Typography
                                                         variant="body2"
                                                         color="text.secondary"
                                                      >
                                                         {appointment.reason}
                                                      </Typography>
                                                      <Box
                                                         sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                               'center',
                                                            mt: 1,
                                                         }}
                                                      >
                                                         <AccessTimeIcon
                                                            fontSize="small"
                                                            sx={{
                                                               mr: 0.5,
                                                               fontSize:
                                                                  '0.875rem',
                                                               color: 'text.secondary',
                                                            }}
                                                         />
                                                         <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                         >
                                                            {appointment.time}
                                                         </Typography>
                                                      </Box>
                                                   </Box>
                                                </Box>
                                             </Paper>
                                          </Grid>
                                       )
                                    )}
                                 </Grid>
                              </AnimateList>
                           </CardContent>
                        </Card>
                     </SlideUp>
                  </Grid>
               </Grid>
            </Box>
         )}
      </Container>
   );
};

export default ModernDashboard;
