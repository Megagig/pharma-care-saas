import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import DiagnosticFeatureGuard from '../middlewares/diagnosticFeatureGuard';
import AIAnalysisResults from '../components/AIAnalysisResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import aiDiagnosticService from '../../../services/aiDiagnosticService';

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
  const isLoadingRef = useRef(false);
  const pollForAnalysis = useCallback(async () => {
    if (!caseId) return;
    try {
      setAnalysisLoading(true);
      const analysisResult = await aiDiagnosticService.pollAnalysis(caseId);
      setAnalysis(analysisResult);
      // Update case status
      setDiagnosticCase((prevCase) => {
        if (prevCase) {
          return {
            ...prevCase,
            status: 'completed',
            aiAnalysis: analysisResult,
          };
        }
        return prevCase;
      });
    } catch (err) {
      console.error('Failed to get analysis:', err);
      setError(
        'Analysis is taking longer than expected. Please refresh to check status.'
      );
    } finally {
      setAnalysisLoading(false);
    }
  }, [caseId]);
  const loadCase = useCallback(async () => {
    if (!caseId) {
      setError('Case ID is required');
      setLoading(false);
      return;
    }
    // Prevent multiple simultaneous calls using ref
    if (isLoadingRef.current) {
      return;
    }
    try {
      isLoadingRef.current = true;
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
      isLoadingRef.current = false;
    }
  }, [caseId, pollForAnalysis]);
  const handleRefresh = () => {
    loadCase();
  };
  const handleBack = () => {
    navigate('/pharmacy/diagnostics');
  };
  useEffect(() => {
    loadCase();
  }, [loadCase]);
  if (loading) {
    return (
      <div maxWidth="lg" className="">
        <div
          className=""
        >
          <div className="">
            <Spinner className="" />
            <div color="text.secondary">
              Loading diagnostic case...
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div maxWidth="lg" className="">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="sm" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </div>
    );
  }
  if (!diagnosticCase) {
    return (
      <div maxWidth="lg" className="">
        <Alert severity="warning">Diagnostic case not found.</Alert>
      </div>
    );
  }
  return (
    <ErrorBoundary>
      <div maxWidth="lg" className="">
        {/* Header */}
        <div className="">
          <div className="">
            <IconButton onClick={handleBack} className="">
              <ArrowBackIcon />
            </IconButton>
            <div className="">
              <Breadcrumbs className="">
                <Link
                  component="button"

                  onClick={handleBack}
                  className=""
                >
                  Diagnostics
                </Link>
                <div color="text.primary">
                  Case Results
                </div>
              </Breadcrumbs>
              <div className="">
                Diagnostic Case Results
              </div>
              <div color="text.secondary">
                Case ID: {diagnosticCase.id} • Status: {diagnosticCase.status}
              </div>
            </div>
            <IconButton
              onClick={handleRefresh}
              disabled={loading || analysisLoading}
            >
              <RefreshIcon />
            </IconButton>
          </div>
        </div>
        {/* Case Information */}
        <Card className="">
          <CardContent>
            <div className="">
              Case Information
            </div>
            <div
              className=""
            >
              <div>
                <div color="text.secondary">
                  Patient
                </div>
                <div >
                  {typeof diagnosticCase.patientId === 'object' &&
                    diagnosticCase.patientId &&
                    'firstName' in diagnosticCase.patientId
                    ? `${diagnosticCase.patientId.firstName || ''} ${diagnosticCase.patientId.lastName || ''
                      }`.trim()
                    : diagnosticCase.patientId}
                </div>
              </div>
              <div>
                <div color="text.secondary">
                  Created
                </div>
                <div >
                  {new Date(diagnosticCase.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div color="text.secondary">
                  Last Updated
                </div>
                <div >
                  {new Date(diagnosticCase.updatedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div color="text.secondary">
                  Primary Symptoms
                </div>
                <div >
                  {diagnosticCase.caseData.symptoms.subjective.join(', ') ||
                    'None specified'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Analysis Results */}
        {diagnosticCase.status === 'analyzing' || analysisLoading ? (
          <AIAnalysisResults analysis={{} as AIAnalysisResult} loading={true} />
        ) : diagnosticCase.status === 'completed' && analysis ? (
          <AIAnalysisResults analysis={analysis} />
        ) : diagnosticCase.status === 'failed' ? (
          <Alert severity="error" className="">
            <div className="">
              Analysis Failed
            </div>
            <div >
              The AI analysis could not be completed. This may be due to
              insufficient data or a system error. Please try submitting the
              case again or contact support if the issue persists.
            </div>
          </Alert>
        ) : (
          <Alert severity="info" className="">
            <div className="">
              Analysis Pending
            </div>
            <div >
              The AI analysis has not been completed yet. Please check back
              later or refresh the page.
            </div>
          </Alert>
        )}
        {/* Actions */}
        <div className="">
          <Button onClick={handleBack}>
            Back to Diagnostics
          </Button>
          <Button

            onClick={() => navigate('/pharmacy/diagnostics/case/new')}
          >
            New Case
          </Button>
        </div>
      </div>
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
