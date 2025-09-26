import { Tooltip } from '@/components/ui/button';

interface AdherenceTrend {
  name: string;
  adherence: number;
}

interface MedicationChartProps {
  data: AdherenceTrend[];
}

const MedicationChart = ({ data }: MedicationChartProps) => {
  const theme = useTheme();

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      dataKey: string;
    }>;
    label?: string;
  }

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="">
          <div >{label}</div>
          <div
            
            className=""
          >
            Adherence: {payload[0].value}%
          </div>
        </div>
      );
    }
    return null;
  };

  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div
        className=""
      >
        <div  color="text.secondary" gutterBottom>
          No Data Available
        </div>
        <div  color="text.secondary" align="center">
          There is no adherence data available for the selected time period.
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis
          dataKey="name"
          
          tickMargin={10}
          angle={-15}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend  />
        <Line
          type="monotone"
          dataKey="adherence"
          name="Medication Adherence"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          
          
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MedicationChart;
