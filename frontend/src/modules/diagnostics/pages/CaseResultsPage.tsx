import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import DiagnosticFeatureGuard from '../middlewares/diagnosticFeatureGuard';
import AIAnalysisResults from '../components/AIAnalysisResults';
import {
  aiDiagnosticService,
  DiagnosticCase,
  AIAnalysisResult,
} from '../../../services/aiDiagnosticService';

const CaseResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [diagnosticCase, setDiagnosticCase] = useState<DiagnosticCase | null>(
    null
  );
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCase = async () => {
    if (!caseId) {
      setError('Case ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const caseData = await aiDiagnosticService.getCase(caseId);
      setDiagnosticCase(caseData);

      // If case is completed and has analysis, load it
      if (caseData.status === 'completed' && caseData.aiAnalysis) {
        setAnalysis(caseData.aiAnalysis);
      } else if (caseData.status === 'analyzing') {
        // Start polling for analysis
        pollForAnalysis();
      }
    } catch (err) {
      console.error('Failed to load case:', err);
      setError('Failed to load diagnostic case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollForAnalysis = async () => {
    if (!caseId) return;

    try {
      setAnalysisLoading(true);
      const analysisResult = await aiDiagnosticService.pollAnalysis(caseId);
      setAnalysis(analysisResult);

      // Update case status
      if (diagnosticCase) {
        setDiagnosticCase({
          ...diagnosticCase,
          status: 'completed',
          aiAnalysis: analysisResult,
        });
      }
    } catch (err) {
      console.error('Failed to get analysis:', err);
      setError(
        'Analysis is taking longer than expected. Please refresh to check status.'
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCase();
  };

  const handleBack = () => {
    navigate('/pharmacy/diagnostics');
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading diagnostic case...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!diagnosticCase) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Diagnostic case not found.</Alert>
      </Container>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'analyzing':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <ErrorBoundary>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Breadcrumbs sx={{ mb: 1 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleBack}
                  sx={{ textDecoration: 'none' }}
                >
                  Diagnostics
                </Link>
                <Typography variant="body2" color="text.primary">
                  Case Results
                </Typography>
              </Breadcrumbs>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Diagnostic Case Results
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Case ID: {diagnosticCase.id} • Status: {diagnosticCase.status}
              </Typography>
            </Box>
            <IconButton
              onClick={handleRefresh}
              disabled={loading || analysisLoading}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Case Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Case Information
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Patient ID
                </Typography>
                <Typography variant="body2">
                  {diagnosticCase.patientId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {new Date(diagnosticCase.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {new Date(diagnosticCase.updatedAt).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Primary Symptoms
                </Typography>
                <Typography variant="body2">
                  {diagnosticCase.caseData.symptoms.subjective.join(', ') ||
                    'None specified'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {diagnosticCase.status === 'analyzing' || analysisLoading ? (
          <AIAnalysisResults analysis={{} as AIAnalysisResult} loading={true} />
        ) : diagnosticCase.status === 'completed' && analysis ? (
          <AIAnalysisResults analysis={analysis} />
        ) : diagnosticCase.status === 'failed' ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Analysis Failed
            </Typography>
            <Typography variant="body2">
              The AI analysis could not be completed. This may be due to
              insufficient data or a system error. Please try submitting the
              case again or contact support if the issue persists.
            </Typography>
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Analysis Pending
            </Typography>
            <Typography variant="body2">
              The AI analysis has not been completed yet. Please check back
              later or refresh the page.
            </Typography>
          </Alert>
        )}

        {/* Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={handleBack}>
            Back to Diagnostics
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/pharmacy/diagnostics/case/new')}
          >
            New Case
          </Button>
        </Box>
      </Container>
    </ErrorBoundary>
  );
};

// Wrap with feature guard
const CaseResultsPageWithGuard: React.FC = () => (
  <DiagnosticFeatureGuard>
    <CaseResultsPage />
  </DiagnosticFeatureGuard>
);

export default CaseResultsPageWithGuard;
