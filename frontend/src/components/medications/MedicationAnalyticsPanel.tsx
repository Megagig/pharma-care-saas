import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  useAdherenceAnalytics,
  usePrescriptionPatternAnalytics,
  useInteractionAnalytics,
  usePatientMedicationSummary,
} from '../../queries/medicationManagementQueries';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MedicationAnalyticsPanelProps {
  patientId: string;
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

// Type definitions
interface AdherenceData {
  monthlyAdherence: { month: string; adherence: number }[];
  averageAdherence: number;
  trendDirection: 'up' | 'down' | 'stable';
  complianceDays: { day: string; count: number }[];
  missedDoses?: { day: string; count: number }[];
  adherenceByTimeOfDay?: { time: string; adherence: number }[];
}

interface PrescriptionData {
  medicationsByCategory: { category: string; count: number }[];
  medicationsByRoute: { route: string; count: number }[];
  prescriptionFrequency: { month: string; count: number }[];
  topPrescribers: { prescriber: string; count: number }[];
  medicationDurationTrends?: { duration: string; count: number }[];
  seasonalPrescriptionPatterns?: { season: string; count: number }[];
}

interface InteractionData {
  severityDistribution: { severity: string; count: number }[];
  interactionTrends: { month: string; count: number }[];
  commonInteractions: {
    medications: string[];
    description: string;
    count: number;
    severityLevel?: 'minor' | 'moderate' | 'severe';
    recommendedAction?: string;
  }[];
  riskFactorsByMedication?: { medication: string; riskScore: number }[];
  interactionsByBodySystem?: { system: string; count: number }[];
}

const MedicationAnalyticsPanel: React.FC<MedicationAnalyticsPanelProps> = ({
  patientId,
}) => {
  const [adherencePeriod, setAdherencePeriod] = useState<string>('6months');
  const [activeTab, setActiveTab] = useState<number>(0);

  // Fetch analytics data
  const { data: adherenceData, isLoading: isLoadingAdherence } =
    useAdherenceAnalytics(patientId, adherencePeriod);

  const { data: prescriptionData, isLoading: isLoadingPrescription } =
    usePrescriptionPatternAnalytics(patientId);

  const { data: interactionData, isLoading: isLoadingInteraction } =
    useInteractionAnalytics(patientId);

  const { data: summaryData, isLoading: isLoadingSummary } =
    usePatientMedicationSummary(patientId);

  const handleAdherencePeriodChange = (event: SelectChangeEvent) => {
    setAdherencePeriod(event.target.value);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (
    isLoadingAdherence ||
    isLoadingPrescription ||
    isLoadingInteraction ||
    isLoadingSummary
  ) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If no data is provided or patientId is "system", show system-wide analytics
  // or example/mock data
  const mockAdherenceData: AdherenceData = adherenceData || {
    monthlyAdherence: [
      { month: 'Jan', adherence: 75 },
      { month: 'Feb', adherence: 82 },
      { month: 'Mar', adherence: 78 },
      { month: 'Apr', adherence: 85 },
      { month: 'May', adherence: 90 },
      { month: 'Jun', adherence: 88 },
    ],
    averageAdherence: 83,
    trendDirection: 'up',
    complianceDays: [
      { day: 'Mon', count: 24 },
      { day: 'Tue', count: 22 },
      { day: 'Wed', count: 26 },
      { day: 'Thu', count: 23 },
      { day: 'Fri', count: 20 },
      { day: 'Sat', count: 18 },
      { day: 'Sun', count: 17 },
    ],
    missedDoses: [
      { day: 'Mon', count: 2 },
      { day: 'Tue', count: 3 },
      { day: 'Wed', count: 1 },
      { day: 'Thu', count: 4 },
      { day: 'Fri', count: 5 },
      { day: 'Sat', count: 6 },
      { day: 'Sun', count: 7 },
    ],
    adherenceByTimeOfDay: [
      { time: 'Morning', adherence: 92 },
      { time: 'Noon', adherence: 85 },
      { time: 'Evening', adherence: 78 },
      { time: 'Night', adherence: 70 },
    ],
  };

  const mockPrescriptionData: PrescriptionData = prescriptionData || {
    medicationsByCategory: [
      { category: 'Antibiotics', count: 5 },
      { category: 'Antihypertensives', count: 3 },
      { category: 'Analgesics', count: 7 },
      { category: 'Antidepressants', count: 2 },
      { category: 'Antidiabetics', count: 1 },
    ],
    medicationsByRoute: [
      { route: 'Oral', count: 12 },
      { route: 'Topical', count: 3 },
      { route: 'Injectable', count: 2 },
      { route: 'Inhalation', count: 1 },
    ],
    prescriptionFrequency: [
      { month: 'Jan', count: 3 },
      { month: 'Feb', count: 2 },
      { month: 'Mar', count: 4 },
      { month: 'Apr', count: 1 },
      { month: 'May', count: 5 },
      { month: 'Jun', count: 2 },
    ],
    topPrescribers: [
      { prescriber: 'Dr. Smith', count: 8 },
      { prescriber: 'Dr. Johnson', count: 5 },
      { prescriber: 'Dr. Williams', count: 4 },
      { prescriber: 'Dr. Brown', count: 3 },
    ],
    medicationDurationTrends: [
      { duration: '< 7 days', count: 6 },
      { duration: '1-4 weeks', count: 8 },
      { duration: '1-3 months', count: 4 },
      { duration: '3-6 months', count: 3 },
      { duration: '> 6 months', count: 7 },
    ],
    seasonalPrescriptionPatterns: [
      { season: 'Winter', count: 9 },
      { season: 'Spring', count: 6 },
      { season: 'Summer', count: 4 },
      { season: 'Fall', count: 7 },
    ],
  };

  const mockInteractionData: InteractionData = interactionData || {
    severityDistribution: [
      { severity: 'Minor', count: 12 },
      { severity: 'Moderate', count: 8 },
      { severity: 'Severe', count: 3 },
    ],
    interactionTrends: [
      { month: 'Jan', count: 2 },
      { month: 'Feb', count: 3 },
      { month: 'Mar', count: 5 },
      { month: 'Apr', count: 4 },
      { month: 'May', count: 6 },
      { month: 'Jun', count: 3 },
    ],
    commonInteractions: [
      {
        medications: ['Warfarin', 'Aspirin'],
        description: 'Increased risk of bleeding',
        count: 5,
        severityLevel: 'severe',
        recommendedAction:
          'Consider alternative antiplatelet therapy or close monitoring',
      },
      {
        medications: ['Lisinopril', 'Potassium supplements'],
        description: 'Increased risk of hyperkalemia',
        count: 3,
        severityLevel: 'moderate',
        recommendedAction: 'Monitor potassium levels regularly',
      },
      {
        medications: ['Simvastatin', 'Grapefruit juice'],
        description: 'Increased risk of myopathy',
        count: 4,
        severityLevel: 'moderate',
        recommendedAction: 'Advise patient to avoid grapefruit juice',
      },
    ],
    riskFactorsByMedication: [
      { medication: 'Warfarin', riskScore: 85 },
      { medication: 'Metformin', riskScore: 45 },
      { medication: 'Lisinopril', riskScore: 60 },
      { medication: 'Simvastatin', riskScore: 65 },
      { medication: 'Aspirin', riskScore: 55 },
    ],
    interactionsByBodySystem: [
      { system: 'Cardiovascular', count: 8 },
      { system: 'Digestive', count: 6 },
      { system: 'Central Nervous System', count: 5 },
      { system: 'Respiratory', count: 3 },
      { system: 'Endocrine', count: 2 },
    ],
  };

  // Mock summary data
  const mockSummaryData = summaryData || {
    activeCount: 7,
    archivedCount: 3,
    cancelledCount: 1,
    adherenceRate: 86,
    interactionCount: 4,
    mostCommonCategory: 'Antihypertensives',
    mostCommonRoute: 'Oral',
    lastUpdated: '2025-08-15T14:30:00Z',
    adherenceTrend: 'increasing',
    costAnalysis: {
      totalMonthlyCost: 248.75,
      costByCategory: [
        { category: 'Antihypertensives', cost: 95.5 },
        { category: 'Analgesics', cost: 32.25 },
        { category: 'Antidiabetics', cost: 121.0 },
      ],
      insuranceCoverageRate: 75,
    },
    medicationComplexity: {
      complexityScore: 62,
      doseFrequency: 3.5,
      uniqueScheduleCount: 4,
    },
  };

  // Determine the title based on patientId
  const analyticsTitle =
    patientId === 'system'
      ? 'System-wide Medication Analytics'
      : 'Patient Medication Analytics';

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {analyticsTitle}
      </Typography>

      {/* Analytics Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid sx={{ gridColumn: 'span 12', md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {mockSummaryData.activeCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Medications
              </Typography>
            </Box>
          </Grid>
          <Grid sx={{ gridColumn: 'span 12', md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {mockSummaryData.adherenceRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adherence Rate
              </Typography>
            </Box>
          </Grid>
          <Grid sx={{ gridColumn: 'span 12', md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="error">
                {mockSummaryData.interactionCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Potential Interactions
              </Typography>
            </Box>
          </Grid>
          <Grid sx={{ gridColumn: 'span 12', md: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                ${mockSummaryData.costAnalysis.totalMonthlyCost.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monthly Cost
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Analytics Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Adherence" />
          <Tab label="Prescriptions" />
          <Tab label="Interactions" />
        </Tabs>
      </Box>

      {/* Adherence Analytics */}
      {activeTab === 0 && (
        <Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h6">Adherence Analytics</Typography>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Time Period</InputLabel>
              <Select
                value={adherencePeriod}
                label="Time Period"
                onChange={handleAdherencePeriodChange}
              >
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={3}>
            <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Monthly Adherence Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockAdherenceData.monthlyAdherence}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="adherence"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Adherence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Compliance by Day of Week
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockAdherenceData.complianceDays}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Doses Taken" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {mockAdherenceData.missedDoses && (
              <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Missed Doses by Day
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAdherenceData.missedDoses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#ff8042" name="Doses Missed" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}

            {mockAdherenceData.adherenceByTimeOfDay && (
              <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Adherence by Time of Day
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockAdherenceData.adherenceByTimeOfDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="adherence"
                        fill="#8884d8"
                        name="Adherence %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Prescription Analytics */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Prescription Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Medications by Category
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockPrescriptionData.medicationsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                      label={({ name, percent }) =>
                        `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                    >
                      {mockPrescriptionData.medicationsByCategory.map(
                        (_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Medications by Route
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockPrescriptionData.medicationsByRoute}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="route"
                      label={({ name, percent }) =>
                        `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                    >
                      {mockPrescriptionData.medicationsByRoute.map(
                        (_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Prescription Frequency
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockPrescriptionData.prescriptionFrequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      name="Prescriptions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {mockPrescriptionData.medicationDurationTrends && (
              <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Medication Duration Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={mockPrescriptionData.medicationDurationTrends}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="duration" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Medications" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Interaction Analytics */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Interaction Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Interaction Severity Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockInteractionData.severityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="severity"
                      label={({ name, percent }) =>
                        `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                    >
                      {mockInteractionData.severityDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.severity === 'Severe'
                                ? '#ff6b6b'
                                : entry.severity === 'Moderate'
                                ? '#feca57'
                                : '#1dd1a1'
                            }
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid sx={{ gridColumn: 'span 12', md: 6 }}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Common Drug Interactions
                </Typography>
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {mockInteractionData.commonInteractions.map(
                    (interaction, index) => (
                      <Box
                        key={index}
                        sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          {interaction.medications.join(' + ')}
                        </Typography>
                        <Typography variant="body2">
                          {interaction.description}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mt: 1,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Occurrences: {interaction.count}
                          </Typography>
                          {interaction.severityLevel && (
                            <Typography
                              variant="caption"
                              sx={{
                                color:
                                  interaction.severityLevel === 'severe'
                                    ? 'error.main'
                                    : interaction.severityLevel === 'moderate'
                                    ? 'warning.main'
                                    : 'success.main',
                              }}
                            >
                              {interaction.severityLevel
                                .charAt(0)
                                .toUpperCase() +
                                interaction.severityLevel.slice(1)}
                            </Typography>
                          )}
                        </Box>
                        {interaction.recommendedAction && (
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 1, fontStyle: 'italic' }}
                          >
                            Recommendation: {interaction.recommendedAction}
                          </Typography>
                        )}
                      </Box>
                    )
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid sx={{ gridColumn: 'span 12' }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Interaction Trend Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockInteractionData.interactionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#ff6b6b"
                      activeDot={{ r: 8 }}
                      name="Interactions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default MedicationAnalyticsPanel;
