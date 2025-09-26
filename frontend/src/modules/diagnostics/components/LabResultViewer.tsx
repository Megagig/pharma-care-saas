import { Card, CardContent, Tooltip, Progress, Alert, Separator } from '@/components/ui/button';

interface GroupedResults {
  [testCode: string]: {
    testName: string;
    results: LabResult[];
    latestResult: LabResult;
    trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
    abnormalCount: number;
  };
}
const INTERPRETATION_CONFIG = {
  normal: { color: 'success', icon: CheckCircleIcon, label: 'Normal' },
  low: { color: 'warning', icon: WarningIcon, label: 'Low' },
  high: { color: 'warning', icon: WarningIcon, label: 'High' },
  critical: { color: 'error', icon: ErrorIcon, label: 'Critical' },
  abnormal: { color: 'warning', icon: WarningIcon, label: 'Abnormal' },
} as const;
const TREND_CONFIG = {
  improving: { color: 'success', icon: TrendingUpIcon, label: 'Improving' },
  stable: { color: 'info', icon: TrendingFlatIcon, label: 'Stable' },
  worsening: { color: 'error', icon: TrendingDownIcon, label: 'Worsening' },
  insufficient_data: {
    color: 'default',
    icon: TrendingFlatIcon,
    label: 'Insufficient Data',
  },
} as const;
const LabResultViewer: React.FC<LabResultViewerProps> = ({ 
  results,
  showTrends = true,
  onResultClick
}) => {
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [selectedTestForTrend, setSelectedTestForTrend] = useState<
    string | null
  >(null);
  const { getTrendData, fetchTrends, loading } = useLabStore();
  // Group results by test code
  const groupedResults: GroupedResults = useMemo(() => {
    const grouped: GroupedResults = {};
    results.forEach((result) => {
      const key = result.testCode;
      if (!grouped[key]) {
        grouped[key] = {
          testName: result.testName,
          results: [],
          latestResult: result,
          trend: 'insufficient_data',
          abnormalCount: 0,
        };
      }
      grouped[key].results.push(result);
      // Update latest result if this one is more recent
      if (
        new Date(result.performedAt) >
        new Date(grouped[key].latestResult.performedAt)
      ) {
        grouped[key].latestResult = result;
      }
    });
    // Calculate trends and abnormal counts for each test
    Object.keys(grouped).forEach((testCode) => {
      const group = grouped[testCode];
      // Sort results by date
      group.results.sort(
        (a, b) =>
          new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime()
      );
      // Count abnormal results
      group.abnormalCount = group.results.filter(
        (r) => r.interpretation !== 'normal'
      ).length;
      // Calculate trend (simplified)
      if (group.results.length >= 2) {
        const recent = group.results.slice(-3); // Last 3 results
        const abnormalRecent = recent.filter(
          (r) => r.interpretation !== 'normal'
        ).length;
        const totalRecent = recent.length;
        if (abnormalRecent === 0) {
          group.trend = 'improving';
        } else if (abnormalRecent === totalRecent) {
          group.trend = 'worsening';
        } else {
          group.trend = 'stable';
        }
      }
    });
    return grouped;
  }, [results]);
  const handleToggleExpand = (testCode: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testCode)) {
      newExpanded.delete(testCode);
    } else {
      newExpanded.add(testCode);
    }
    setExpandedTests(newExpanded);
  };
  const handleShowTrend = async (testCode: string, patientId: string) => {
    setSelectedTestForTrend(testCode);
    await fetchTrends(patientId, testCode);
  };
  const formatValue = (result: LabResult) => {
    let formattedValue = result.value;
    if (result.unit) {
      formattedValue += ` ${result.unit}`;
    }
    return formattedValue;
  };
  const formatReferenceRange = (result: LabResult) => {
    const { referenceRange } = result;
    if (referenceRange.text) {
      return referenceRange.text;
    }
    if (referenceRange.low !== undefined && referenceRange.high !== undefined) {
      return `${referenceRange.low} - ${referenceRange.high}${result.unit ? ` ${result.unit}` : ''}`;
    }
    if (referenceRange.low !== undefined) {
      return `> ${referenceRange.low}${result.unit ? ` ${result.unit}` : ''}`;
    }
    if (referenceRange.high !== undefined) {
      return `< ${referenceRange.high}${result.unit ? ` ${result.unit}` : ''}`;
    }
    return 'Not specified';
  };
  const getInterpretationChip = (interpretation: string) => {
    const config =
      INTERPRETATION_CONFIG[
        interpretation as keyof typeof INTERPRETATION_CONFIG
      ];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Chip
        icon={<Icon className="" />}
        label={config.label}
        size="small"
        color={config.color}
        
      />
    );
  };
  const getTrendChip = (trend: string) => {
    const config = TREND_CONFIG[trend as keyof typeof TREND_CONFIG];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Chip
        icon={<Icon className="" />}
        label={config.label}
        size="small"
        color={config.color}
        
      />
    );
  };
  const renderTrendChart = (testCode: string, patientId: string) => {
    const trendData = getTrendData(patientId, testCode);
    if (!trendData || trendData.results.length < 2) {
      return (
        <Alert severity="info" className="">
          Insufficient data for trend analysis. At least 2 results are needed.
        </Alert>
      );
    }
    const chartData = trendData.results.map((result, index) => ({ 
      date: new Date(result.performedAt).toLocaleDateString(),
      value: result.numericValue || 0,
      interpretation: result.interpretation,
      originalValue: result.value}
    }));
    return (
      <div className="">
        <div  className="">
          Trend Analysis - {trendData.testName}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip
              formatter={(value, name, props) => [}
                `${props.payload.originalValue} ${trendData.unit || ''}`,
                'Value',
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            {trendData.referenceRange.low && (
              <ReferenceLine
                y={trendData.referenceRange.low}
                stroke="orange"
                strokeDasharray="5 5"
                label="Low"
              />
            )}
            {trendData.referenceRange.high && (
              <ReferenceLine
                y={trendData.referenceRange.high}
                stroke="orange"
                strokeDasharray="5 5"
                label="High"
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2196f3"
              strokeWidth={2}
              
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="">
          <div container spacing={2}>
            <div item xs={6} md={3}>
              <div  color="text.secondary">
                Latest Value
              </div>
              <div  className="">
                {trendData.summary.latestValue} {trendData.unit}
              </div>
            </div>
            <div item xs={6} md={3}>
              <div  color="text.secondary">
                Interpretation
              </div>
              <div className="">
                {getInterpretationChip(trendData.summary.latestInterpretation)}
              </div>
            </div>
            <div item xs={6} md={3}>
              <div  color="text.secondary">
                Abnormal Results
              </div>
              <div  className="">
                {trendData.summary.abnormalCount} /{' '}
                {trendData.summary.totalCount}
              </div>
            </div>
            <div item xs={6} md={3}>
              <div  color="text.secondary">
                Trend
              </div>
              <div className="">{getTrendChip(trendData.trend)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  if (results.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No lab results available for this patient.
          </Alert>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent>
        <div className="">
          <div
            
            className=""
          >
            <TimelineIcon className="" />
            Laboratory Results ({results.length})
          </div>
          <div  color="text.secondary">
            View and analyze laboratory test results with trend analysis
          </div>
        </div>
        {/* Summary Statistics */}
        <div className="">
          <div container spacing={2}>
            <div item xs={6} md={3}>
              <div className="">
                <div
                  
                  color="primary.main"
                  className=""
                >
                  {Object.keys(groupedResults).length}
                </div>
                <div  color="text.secondary">
                  Different Tests
                </div>
              </div>
            </div>
            <div item xs={6} md={3}>
              <div className="">
                <div
                  
                  color="error.main"
                  className=""
                >
                  {
                    results.filter((r) => r.interpretation === 'critical')
                      .length
                  }
                </div>
                <div  color="text.secondary">
                  Critical Results
                </div>
              </div>
            </div>
            <div item xs={6} md={3}>
              <div className="">
                <div
                  
                  color="warning.main"
                  className=""
                >
                  {results.filter((r) => r.interpretation !== 'normal').length}
                </div>
                <div  color="text.secondary">
                  Abnormal Results
                </div>
              </div>
            </div>
            <div item xs={6} md={3}>
              <div className="">
                <div
                  
                  color="success.main"
                  className=""
                >
                  {results.filter((r) => r.interpretation === 'normal').length}
                </div>
                <div  color="text.secondary">
                  Normal Results
                </div>
              </div>
            </div>
          </div>
        </div>
        <Separator className="" />
        {/* Grouped Results */}
        <div spacing={2}>
          {Object.entries(groupedResults).map(([testCode, group]) => (
            <Card key={testCode} >
              <CardContent className="">
                {/* Test Header */}
                <div
                  className=""
                >
                  <div className="">
                    <div  className="">
                      {group.testName}
                    </div>
                    <div  color="text.secondary">
                      Code: {testCode} • {group.results.length} result(s)
                      {group.abnormalCount > 0 &&
                        ` • ${group.abnormalCount} abnormal`}
                    </div>
                  </div>
                  <div className="">
                    {/* Latest Result */}
                    <div className="">
                      <div  className="">
                        {formatValue(group.latestResult)}
                      </div>
                      <div  color="text.secondary">
                        {new Date(
                          group.latestResult.performedAt
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    {/* Interpretation */}
                    {getInterpretationChip(group.latestResult.interpretation)}
                    {/* Trend */}
                    {showTrends &&
                      group.results.length > 1 &&
                      getTrendChip(group.trend)}
                    {/* Actions */}
                    <div className="">
                      {showTrends && group.results.length > 1 && (
                        <Tooltip title="Show trend analysis">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleShowTrend(
                                testCode,
                                group.latestResult.patientId
                              )}
                            }
                            disabled={loading.fetchTrends}
                          >
                            <TrendingUpIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip
                        title={
                          expandedTests.has(testCode)
                            ? 'Hide details'
                            : 'Show details'}
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpand(testCode)}
                        >
                          {expandedTests.has(testCode) ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                {/* Expanded Details */}
                <Collapse in={expandedTests.has(testCode)}>
                  <div className="">
                    {/* Results Table */}
                    <TableContainer  >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Reference Range</TableCell>
                            <TableCell>Interpretation</TableCell>
                            <TableCell>Flags</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.results.map((result) => (
                            <TableRow key={result._id} hover>
                              <TableCell>
                                <div >
                                  {new Date(
                                    result.performedAt
                                  ).toLocaleDateString()}
                                </div>
                                <div
                                  
                                  color="text.secondary"
                                >
                                  {new Date(
                                    result.performedAt
                                  ).toLocaleTimeString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div
                                  
                                  className=""
                                >
                                  {formatValue(result)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div >
                                  {formatReferenceRange(result)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getInterpretationChip(result.interpretation)}
                              </TableCell>
                              <TableCell>
                                <div direction="row" spacing={0.5}>
                                  {result.flags.map((flag) => (
                                    <Chip
                                      key={flag}
                                      label={flag}
                                      size="small"
                                      
                                    />
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {onResultClick && (
                                  <Tooltip title="View details">
                                    <IconButton
                                      size="small"
                                      onClick={() => onResultClick(result)}
                                    >
                                      <VisibilityIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {/* Trend Chart */}
                    {showTrends && selectedTestForTrend === testCode && (
                      <>
                        {loading.fetchTrends && (
                          <div className="">
                            <Progress />
                            <div
                              
                              color="text.secondary"
                              className=""
                            >
                              Loading trend data...
                            </div>
                          </div>
                        )}
                        {!loading.fetchTrends &&
                          renderTrendChart(
                            testCode,
                            group.latestResult.patientId
                          )}
                      </>
                    )}
                  </div>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Critical Results Alert */}
        {results.some((r) => r.interpretation === 'critical') && (
          <Alert severity="error" className="">
            <div  className="">
              Critical Results Detected
            </div>
            <div >
              {results.filter((r) => r.interpretation === 'critical').length}{' '}
              result(s) require immediate clinical attention.
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
export default LabResultViewer;
