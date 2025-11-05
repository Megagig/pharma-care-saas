import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Collapse,
  IconButton,
  Alert,
  Divider,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface LabTestResult {
  testName: string;
  value: number | string;
  unit: string;
  referenceRange: {
    min?: number;
    max?: number;
    normal?: string;
  };
  status: 'normal' | 'high' | 'low' | 'critical';
  flag?: string;
}

interface LabResult {
  _id: string;
  patientId: string;
  testDate: string;
  testType: string;
  orderingPhysician?: string;
  pharmacistName?: string;
  labName?: string;
  status: 'pending' | 'completed' | 'reviewed';
  results: LabTestResult[];
  interpretation?: string;
  recommendations?: string;
  followUpRequired?: boolean;
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface LabResultCardProps {
  result: LabResult;
  onDownload?: (attachmentUrl: string, filename: string) => void;
  onView?: (resultId: string) => void;
}

const LabResultCard: React.FC<LabResultCardProps> = ({ 
  result, 
  onDownload,
  onView 
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'high':
      case 'low':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircleIcon fontSize="small" />;
      case 'high':
      case 'low':
        return <WarningIcon fontSize="small" />;
      case 'critical':
        return <ErrorIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'reviewed':
        return 'primary';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const calculatePercentageInRange = (value: number, min?: number, max?: number) => {
    if (min === undefined || max === undefined) return null;
    
    const range = max - min;
    const position = value - min;
    return Math.max(0, Math.min(100, (position / range) * 100));
  };

  const formatValue = (value: number | string, unit: string) => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)} ${unit}`;
    }
    return `${value} ${unit}`;
  };

  const getAbnormalResultsCount = () => {
    return result.results.filter(r => r.status !== 'normal').length;
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {result.testType}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {new Date(result.testDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
              
              <Chip 
                label={result.status} 
                size="small" 
                color={getResultStatusColor(result.status) as any}
                variant="outlined"
              />
              
              {getAbnormalResultsCount() > 0 && (
                <Chip 
                  label={`${getAbnormalResultsCount()} abnormal`}
                  size="small" 
                  color="warning"
                  variant="outlined"
                  icon={<WarningIcon />}
                />
              )}
            </Box>

            {result.labName && (
              <Typography variant="body2" color="text.secondary">
                Lab: {result.labName}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {result.attachments && result.attachments.length > 0 && (
              <Tooltip title="Download lab report">
                <IconButton 
                  size="small" 
                  onClick={() => onDownload?.(result.attachments![0].url, result.attachments![0].filename)}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="View detailed results">
              <IconButton size="small" onClick={() => onView?.(result._id)}>
                <ViewIcon />
              </IconButton>
            </Tooltip>
            
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
              size="small"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Quick Summary */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {result.results.slice(0, 3).map((test, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 1, 
                bgcolor: 'grey.50',
                border: test.status !== 'normal' ? 2 : 1,
                borderColor: test.status !== 'normal' ? `${getStatusColor(test.status)}.main` : 'grey.200'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {getStatusIcon(test.status)}
                  <Typography variant="body2" fontWeight="medium" noWrap>
                    {test.testName}
                  </Typography>
                </Box>
                
                <Typography variant="h6" color={test.status !== 'normal' ? `${getStatusColor(test.status)}.main` : 'text.primary'}>
                  {formatValue(test.value, test.unit)}
                </Typography>
                
                {test.referenceRange.min !== undefined && test.referenceRange.max !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    Normal: {test.referenceRange.min}-{test.referenceRange.max} {test.unit}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        {result.results.length > 3 && !expanded && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            +{result.results.length - 3} more results. Click to expand.
          </Typography>
        )}

        {/* Expanded Content */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          
          {/* All Results */}
          <Typography variant="subtitle1" gutterBottom>
            Detailed Results
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {result.results.map((test, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {test.testName}
                      </Typography>
                      
                      <Chip 
                        label={test.status} 
                        size="small" 
                        color={getStatusColor(test.status) as any}
                        variant="outlined"
                        icon={getStatusIcon(test.status)}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {formatValue(test.value, test.unit)}
                    </Typography>

                    {/* Reference Range Visualization */}
                    {test.referenceRange.min !== undefined && test.referenceRange.max !== undefined && typeof test.value === 'number' && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Reference Range: {test.referenceRange.min}-{test.referenceRange.max} {test.unit}
                        </Typography>
                        
                        <Box sx={{ position: 'relative', mt: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={100} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'success.light'
                              }
                            }} 
                          />
                          
                          {/* Value indicator */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -2,
                              left: `${calculatePercentageInRange(test.value, test.referenceRange.min, test.referenceRange.max) || 50}%`,
                              transform: 'translateX(-50%)',
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: test.status === 'normal' ? 'success.main' : getStatusColor(test.status) + '.main',
                              border: 2,
                              borderColor: 'white',
                              boxShadow: 1
                            }}
                          />
                        </Box>
                      </Box>
                    )}

                    {test.referenceRange.normal && (
                      <Typography variant="caption" color="text.secondary">
                        Normal: {test.referenceRange.normal}
                      </Typography>
                    )}

                    {test.flag && (
                      <Alert severity={getStatusColor(test.status) as any} sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          {test.flag}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pharmacist Interpretation */}
          {result.interpretation && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Pharmacist Interpretation
              </Typography>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2">
                  {result.interpretation}
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Recommendations */}
          {result.recommendations && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Recommendations
              </Typography>
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2">
                  {result.recommendations}
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Follow-up Required */}
          {result.followUpRequired && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="medium">
                Follow-up Required
              </Typography>
              <Typography variant="body2">
                Please schedule a follow-up appointment to discuss these results with your pharmacist.
              </Typography>
            </Alert>
          )}

          {/* Provider Information */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box>
              {result.pharmacistName && (
                <Typography variant="body2" color="text.secondary">
                  Reviewed by: <strong>{result.pharmacistName}</strong>
                </Typography>
              )}
              {result.orderingPhysician && (
                <Typography variant="body2" color="text.secondary">
                  Ordered by: {result.orderingPhysician}
                </Typography>
              )}
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(result.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default LabResultCard;