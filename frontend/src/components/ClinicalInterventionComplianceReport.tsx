import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import { clinicalInterventionService } from '../services/clinicalInterventionService';

interface ComplianceData {
  summary: {
    totalInterventions: number;
    auditedActions: number;
    complianceScore: number;
    riskActivities: number;
  };
  interventionCompliance: Array<{
    interventionId: string;
    interventionNumber: string;
    auditCount: number;
    lastAudit: string;
    complianceStatus: 'compliant' | 'warning' | 'non-compliant';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: string[];
}

const ClinicalInterventionComplianceReport: React.FC = () => {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [includeDetails, setIncludeDetails] = useState(false);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await clinicalInterventionService.getComplianceReport({
        startDate,
        endDate,
        includeDetails,
      });

      if (response.success && response.data) {
        setComplianceData(response.data);
      } else {
        setError(response.message || 'Failed to generate compliance report');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const blob = await clinicalInterventionService.exportAuditData({
        format: 'pdf',
        startDate,
        endDate,
        includeDetails: true,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance_report_${format(
        new Date(),
        'yyyy-MM-dd'
      )}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export compliance report');
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'success';
      case 'warning':
        return 'warning';
      case 'non-compliant':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      default:
        return 'success';
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5" component="h1">
              Clinical Interventions Compliance Report
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportReport}
              disabled={!complianceData}
            >
              Export PDF
            </Button>
          </Box>

          {/* Date Range Selection */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                onClick={generateReport}
                fullWidth
                disabled={loading}
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {complianceData && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                        <Typography color="textSecondary" variant="body2">
                          Total Interventions
                        </Typography>
                      </Box>
                      <Typography variant="h4">
                        {complianceData.summary.totalInterventions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                        <Typography color="textSecondary" variant="body2">
                          Audited Actions
                        </Typography>
                      </Box>
                      <Typography variant="h4">
                        {complianceData.summary.auditedActions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <CheckCircleIcon
                          color={
                            getComplianceColor(
                              complianceData.summary.complianceScore
                            ) as any
                          }
                          sx={{ mr: 1 }}
                        />
                        <Typography color="textSecondary" variant="body2">
                          Compliance Score
                        </Typography>
                      </Box>
                      <Typography
                        variant="h4"
                        color={getComplianceColor(
                          complianceData.summary.complianceScore
                        )}
                      >
                        {complianceData.summary.complianceScore}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={complianceData.summary.complianceScore}
                        color={
                          getComplianceColor(
                            complianceData.summary.complianceScore
                          ) as any
                        }
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={1}>
                        <SecurityIcon
                          color={
                            complianceData.summary.riskActivities > 0
                              ? 'error'
                              : 'success'
                          }
                          sx={{ mr: 1 }}
                        />
                        <Typography color="textSecondary" variant="body2">
                          Risk Activities
                        </Typography>
                      </Box>
                      <Typography
                        variant="h4"
                        color={
                          complianceData.summary.riskActivities > 0
                            ? 'error'
                            : 'success'
                        }
                      >
                        {complianceData.summary.riskActivities}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Intervention Compliance Table */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Intervention Compliance Details
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Intervention</TableCell>
                          <TableCell>Audit Count</TableCell>
                          <TableCell>Last Audit</TableCell>
                          <TableCell>Compliance Status</TableCell>
                          <TableCell>Risk Level</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {complianceData.interventionCompliance.map(
                          (intervention) => (
                            <TableRow key={intervention.interventionId} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {intervention.interventionNumber}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {intervention.auditCount}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {format(
                                    new Date(intervention.lastAudit),
                                    'MMM dd, yyyy HH:mm'
                                  )}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={intervention.complianceStatus
                                    .replace('-', ' ')
                                    .toUpperCase()}
                                  color={
                                    getComplianceStatusColor(
                                      intervention.complianceStatus
                                    ) as any
                                  }
                                  size="small"
                                  icon={
                                    intervention.complianceStatus ===
                                    'compliant' ? (
                                      <CheckCircleIcon />
                                    ) : intervention.complianceStatus ===
                                      'warning' ? (
                                      <WarningIcon />
                                    ) : (
                                      <ErrorIcon />
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={intervention.riskLevel.toUpperCase()}
                                  color={
                                    getRiskLevelColor(
                                      intervention.riskLevel
                                    ) as any
                                  }
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {complianceData.interventionCompliance.length === 0 && (
                    <Box textAlign="center" py={4}>
                      <Typography color="textSecondary">
                        No interventions found for the selected date range.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              {complianceData.recommendations.length > 0 && (
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <LightbulbIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        Compliance Recommendations
                      </Typography>
                    </Box>
                    <List>
                      {complianceData.recommendations.map(
                        (recommendation, index) => (
                          <React.Fragment key={index}>
                            <ListItem>
                              <ListItemIcon>
                                <LightbulbIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={recommendation}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                            {index <
                              complianceData.recommendations.length - 1 && (
                              <Divider />
                            )}
                          </React.Fragment>
                        )
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClinicalInterventionComplianceReport;
