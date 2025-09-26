import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

import MTRErrorBoundary from '../components/MTRErrorBoundary';
import MTRDashboard from '../components/MTRDashboard';
import MTRSummary from '../components/MTRSummary';
import { Button, Alert, Skeleton, Badge } from '@/components/ui';

const MedicationTherapyReview: React.FC = () => {
  const navigate = useNavigate();
  const { reviewId, patientId } = useParams<{
    reviewId?: string;
    patientId?: string;
  }>();
  const isSummaryRoute = window.location.pathname.includes('/summary');

  // Mock store for now
  const [currentReview, setCurrentReview] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [errors, setErrors] = useState<any>({ general: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Mock functions for store
  const loadReview = async (id: string) => {
    // Mock implementation
    setTimeout(() => {
      setCurrentReview({
        _id: id,
        reviewNumber: 'MTR-001',
        status: 'in_progress'
      });
      setSelectedPatient({
        firstName: 'John',
        lastName: 'Doe'
      });
    }, 500);
  };

  const createReview = async (id: string) => {
    // Mock implementation
    setTimeout(() => {
      setCurrentReview({
        _id: 'new-review',
        reviewNumber: 'MTR-002',
        status: 'draft'
      });
      setSelectedPatient({
        firstName: 'Jane',
        lastName: 'Smith'
      });
    }, 500);
  };

  const clearStore = () => {
    setCurrentReview(null);
    setSelectedPatient(null);
    setErrors({ general: '' });
  };

  // Initialize MTR session
  useEffect(() => {
    const initializeMTR = async () => {
      if (reviewId) {
        setIsLoading(true);
        try {
          await loadReview(reviewId);
          setShowDashboard(true);
        } catch (error) {
          console.error('Failed to load MTR session:', error);
          setErrors({ general: 'Failed to load MTR session' });
        } finally {
          setIsLoading(false);
        }
      } else if (patientId) {
        setIsLoading(true);
        try {
          await createReview(patientId);
          setShowDashboard(true);
        } catch (error) {
          console.error('Failed to create MTR session:', error);
          setErrors({ general: 'Failed to create MTR session' });
        } finally {
          setIsLoading(false);
        }
      } else {
        // For base route, show dashboard immediately for patient selection
        setShowDashboard(true);
      }
    };

    initializeMTR();

    // Cleanup on unmount only if we're leaving the MTR module entirely
    return () => {
      if (
        !reviewId &&
        !patientId &&
        !window.location.pathname.includes('/medication-therapy')
      ) {
        clearStore();
      }
    };
  }, [reviewId, patientId]);

  // Handle MTR completion
  const handleMTRComplete = (completedReviewId: string) => {
    navigate(`/pharmacy/medication-therapy/${completedReviewId}/summary`);
  };

  // Handle MTR cancellation
  const handleMTRCancel = () => {
    navigate('/pharmacy/medication-therapy');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center space-x-2 text-sm mb-4">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link to="/pharmacy/medication-therapy" className="text-blue-600 hover:text-blue-800">
            Medication Therapy Review
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700">Loading...</span>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/5" />
          <Skeleton className="h-6 w-2/5" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Show MTR Summary if this is a summary route
  if (isSummaryRoute && reviewId) {
    return <MTRSummary />;
  }

  // Show MTR Dashboard if we should show it
  if (showDashboard) {
    return (
      <MTRErrorBoundary>
        <div className="container mx-auto p-4 max-w-6xl">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-sm mb-4">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Link to="/pharmacy/medication-therapy" className="text-blue-600 hover:text-blue-800">
              Medication Therapy Review
            </Link>
            {selectedPatient && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </span>
              </>
            )}
            {currentReview && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">
                  Review #{currentReview.reviewNumber}
                </span>
              </>
            )}
          </div>

          {/* Session Header */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              onClick={handleMTRCancel}
              size="sm"
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Overview
            </Button>

            {currentReview && currentReview.status && (
              <Badge
                className={
                  currentReview.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }
              >
                {currentReview.status
                  .replace('_', ' ')
                  .toUpperCase()}
              </Badge>
            )}
          </div>

          {/* Error Display */}
          {errors.general && (
            <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
              {errors.general}
            </Alert>
          )}

          {/* MTR Dashboard */}
          <MTRDashboard
            patientId={patientId}
            reviewId={reviewId}
            onComplete={handleMTRComplete}
            onCancel={handleMTRCancel}
          />
        </div>
      </MTRErrorBoundary>
    );
  }

  // Fallback - should not reach here with proper initialization
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
        MTR session initialization failed. Please refresh the page.
      </Alert>
    </div>
  );
};

export default MedicationTherapyReview;
