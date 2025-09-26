import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Home, Download, ArrowRight } from 'lucide-react';

const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(true);

  // Extract reference from URL query parameters
  const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      reference: params.get('reference'),
      trxref: params.get('trxref'),
    };
  };

  // Verify payment and get subscription details
  const verifyPayment = useCallback(async (reference: string) => {
    try {
      setVerifying(true);
      const response = await axios.get(`/api/subscriptions/verify-payment?reference=${reference}`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setSubscriptionDetails(response.data.data);
      } else {
        setError(response.data.message || 'Failed to verify payment');
      }
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      setError(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { reference } = getQueryParams();

    if (!reference) {
      setError('No payment reference found');
      setLoading(false);
      return;
    }

    verifyPayment(reference);
  }, [verifyPayment]);

  const handleDownloadInvoice = () => {
    if (subscriptionDetails?.invoiceUrl) {
      window.open(subscriptionDetails.invoiceUrl, '_blank');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <LoadingSpinner message="Verifying your subscription..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/subscription-management')}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          {verifying ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p>Verifying your subscription...</p>
            </div>
          ) : (
            <>
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Thank you for your subscription! Your account has been upgraded successfully.
                </AlertDescription>
              </Alert>

              {subscriptionDetails && (
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium">{subscriptionDetails.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        minimumFractionDigits: 0
                      }).format(subscriptionDetails.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Billing Cycle:</span>
                    <span className="font-medium">{subscriptionDetails.billingInterval}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Payment Date:</span>
                    <span className="font-medium">
                      {new Date(subscriptionDetails.nextPaymentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium text-sm">{subscriptionDetails.transactionId}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button onClick={handleGoToDashboard} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>

                {subscriptionDetails?.invoiceUrl && (
                  <Button variant="outline" onClick={handleDownloadInvoice} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </Button>
                )}

                <Button variant="ghost" onClick={() => navigate('/subscription-management')} className="w-full">
                  Manage Subscription
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
