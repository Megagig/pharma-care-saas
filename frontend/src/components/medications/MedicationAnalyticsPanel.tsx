
import { Label, Select, Tooltip, Spinner, Tabs } from '@/components/ui/button';
import {
  useAdherenceAnalytics,
  usePrescriptionPatternAnalytics,
  useInteractionAnalytics,
  usePatientMedicationSummary,
  useMedicationCostAnalytics,
} from '@/hooks/useMedications';

interface MedicationAnalyticsPanelProps {
  patientId: string;
}

interface MedicationCostAnalyticsData {
  monthlyCosts?: { month: string; totalCost: number; formattedCost: string }[];
  costByCategory?: { category: string; cost: number; formattedCost: string }[];
  monthlyFinancials?: {
    month: string;
    cost: number;
    revenue: number;
    profit: number;
    formattedCost: string;
    formattedRevenue: string;
    formattedProfit: string;
  }[];
  topProfitableMedications?: {
    name: string;
    cost: number;
    sellingPrice: number;
    profit: number;
    profitMargin: number;
  }[];
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  formattedTotalCost: string;
  formattedTotalRevenue: string;
  formattedTotalProfit: string;
  formattedProfitMargin: string;
  currency: {
    code: string;
    symbol: string;
  };
}

const MedicationAnalyticsPanel: React.FC<MedicationAnalyticsPanelProps> = ({ 
  patientId
}) => {
  // State for UI controls
  const [adherencePeriod, setAdherencePeriod] = useState<string>('6months');
  const [activeTab, setActiveTab] = useState<number>(0);

  // Event handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fetch analytics data with enhanced hooks
  const { data: adherenceData, isLoading: isLoadingAdherence } =
    useAdherenceAnalytics(patientId, adherencePeriod);

  const { data: prescriptionData, isLoading: isLoadingPrescription } =
    usePrescriptionPatternAnalytics(patientId);

  const { data: interactionData, isLoading: isLoadingInteraction } =
    useInteractionAnalytics(patientId);

  const { data: summaryData, isLoading: isLoadingSummary } =
    usePatientMedicationSummary(patientId);

  // Get cost analytics data and handle loading state
  const { data: costData, isLoading: isLoadingCostAnalytics } =
    useMedicationCostAnalytics(patientId) as {
      data: MedicationCostAnalyticsData | undefined;
      isLoading: boolean;
    };

  const handleAdherencePeriodChange = (event: SelectChangeEvent) => {
    setAdherencePeriod(event.target.value);
  };

  // Show loading state if any data is loading
  if (
    isLoadingAdherence ||
    isLoadingPrescription ||
    isLoadingInteraction ||
    isLoadingSummary ||
    isLoadingCostAnalytics
  ) {
    return (
      <div className="">
        <Spinner />
      </div>
    );
  }

  // Determine the title based on patientId
  const analyticsTitle =
    patientId === 'system'
      ? 'System-wide Medication Analytics'
      : 'Patient Medication Analytics';

  return (
    <div>
      <div  gutterBottom>
        {analyticsTitle}
      </div>

      {/* Analytics Summary */}
      <div className="">
        <div container spacing={3}>
          <div className="">
            <div className="">
              <div  color="primary">
                {summaryData?.activeCount || 0}
              </div>
              <div  color="text.secondary">
                Active Medications
              </div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="primary">
                {summaryData?.adherenceRate || 0}%
              </div>
              <div  color="text.secondary">
                Adherence Rate
              </div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="error">
                {summaryData?.interactionCount || 0}
              </div>
              <div  color="text.secondary">
                Potential Interactions
              </div>
            </div>
          </div>
          <div className="">
            <div className="">
              <div  color="primary">
                {costData?.formattedTotalCost || '₦0.00'}
              </div>
              <div  color="text.secondary">
                Monthly Cost
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="">
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Adherence" />
          <Tab label="Prescriptions" />
          <Tab label="Interactions" />
          <Tab label="Financial" />
        </Tabs>
      </div>

      {/* Adherence Analytics */}
      {activeTab === 0 && adherenceData && (
        <div>
          <div
            className=""
          >
            <div >Adherence Analytics</div>
            <div className="" size="small">
              <Label>Time Period</Label>
              <Select
                value={adherencePeriod}
                label="Time Period"
                onChange={handleAdherencePeriodChange}
              >
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
              </Select>
            </div>
          </div>

          <div container spacing={3}>
            <div className="">
              <div className="">
                <div  gutterBottom>
                  Monthly Adherence Trends
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={adherenceData?.monthlyAdherence || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="adherence"
                      stroke="#8884d8"
                      
                      strokeWidth={2}
                      name="Adherence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div
                  className=""
                >
                  <div
                    
                    className=""
                  >
                    {adherenceData?.trendDirection === 'up'
                      ? '↑ Improving Trend'
                      : adherenceData?.trendDirection === 'down'
                      ? '↓ Declining Trend'
                      : '→ Stable Trend'}
                  </div>
                </div>
              </div>
            </div>

            <div className="">
              <div className="">
                <div  gutterBottom>
                  Overall Adherence Rate
                </div>
                <div
                  className=""
                >
                  <div
                    className=""
                  >
                    <Spinner
                      
                      size={160}
                      thickness={5}
                      className=""
                    />
                    <div
                      className=""
                    >
                      <div
                        
                        component="div"
                        color="text.secondary"
                      >
                        {`${adherenceData?.averageAdherence || 0}%`}
                      </div>
                    </div>
                  </div>
                  <div  align="center">
                    {(adherenceData?.averageAdherence || 0) >= 90
                      ? 'Excellent Adherence'
                      : (adherenceData?.averageAdherence || 0) >= 80
                      ? 'Good Adherence'
                      : (adherenceData?.averageAdherence || 0) >= 70
                      ? 'Fair Adherence'
                      : 'Needs Improvement'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Pattern Analytics */}
      {activeTab === 1 && prescriptionData && (
        <div>
          <div  className="">
            Prescription Pattern Analytics
          </div>
          <div container spacing={3}>
            <div className="">
              <div className="">
                <div  gutterBottom>
                  Medications by Category
                </div>
                <div className="">
                  {prescriptionData?.medicationsByCategory && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={prescriptionData?.prescriptionFrequency || []}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#82ca9d"
                          name="Prescriptions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Analytics */}
      {activeTab === 2 && interactionData && (
        <div>
          <div  className="">
            Medication Interaction Analytics
          </div>
          <div container spacing={3}>
            <div className="">
              <div className="">
                <div  gutterBottom>
                  Interaction Trend Over Time
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={interactionData?.interactionTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#ff7300"
                      
                      name="Interactions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Analytics */}
      {activeTab === 3 && costData && (
        <div>
          <div  className="">
            Medication Financial Analytics
          </div>
          <div container spacing={3}>
            {/* Financial Summary Cards */}
            <div className="">
              <div className="">
                <div  gutterBottom>
                  Total Revenue
                </div>
                <div  color="primary.main">
                  {costData?.formattedTotalRevenue || '₦0.00'}
                </div>
              </div>
            </div>
            <div className="">
              <div className="">
                <div  gutterBottom>
                  Total Cost
                </div>
                <div  color="error.main">
                  {costData?.formattedTotalCost || '₦0.00'}
                </div>
              </div>
            </div>
            <div className="">
              <div className="">
                <div  gutterBottom>
                  Total Profit
                </div>
                <div  color="success.main">
                  {costData?.formattedTotalProfit || '₦0.00'}
                </div>
              </div>
            </div>
            <div className="">
              <div className="">
                <div  gutterBottom>
                  Profit Margin
                </div>
                <div
                  
                  color={
                    costData?.profitMargin && costData.profitMargin > 0
                      ? 'success.main'
                      : 'error.main'}
                  }
                >
                  {costData?.formattedProfitMargin || '0%'}
                </div>
              </div>
            </div>

            {/* Financial Analytics Charts */}
            <div className="">
              <div className="">
                <div  gutterBottom>
                  Monthly Revenue vs Cost
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costData?.monthlyFinancials || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₦${value}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      name="Revenue"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#ff7300"
                      name="Cost"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#82ca9d"
                      name="Profit"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="">
              <div className="">
                <div  gutterBottom>
                  Top 5 Most Profitable Medications
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costData?.topProfitableMedications || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₦${value}`} />
                    <Legend />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationAnalyticsPanel;
