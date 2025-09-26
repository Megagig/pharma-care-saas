import { Button, Spinner, Alert } from '@/components/ui/button';
const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addNotification = useUIStore((state) => state.addNotification);
  useEffect(() => {
    const verifyPayment = async () => {
      const reference =
        searchParams.get('reference') || searchParams.get('trxref');
      if (!reference) {
        setError('No payment reference found');
        setLoading(false);
        return;
      }
      try {
        const result = await subscriptionService.verifyPayment(reference);
        if (result.success) {
          setSuccess(true);
          addNotification({ 
            type: 'success',
            title: 'Subscription Activated',
            message: 'Your subscription has been successfully activated!',
            duration: 5000}
          });
        } else {
          throw new Error(result.message || 'Payment verification failed');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Payment verification failed';
        setError(errorMessage);
        addNotification({ 
          type: 'error',
          title: 'Payment Verification Failed',
          message: errorMessage,
          duration: 5000}
        });
      } finally {
        setLoading(false);
      }
    };
    verifyPayment();
  }, [searchParams, addNotification]);
  const handleContinue = () => {
    navigate('/dashboard');
  };
  const handleRetry = () => {
    navigate('/subscription-management');
  };
  if (loading) {
    return (
      <div maxWidth="md" className="">
        <div className="">
          <Spinner size={64} className="" />
          <div  gutterBottom>
            Verifying Payment...
          </div>
          <div color="text.secondary">
            Please wait while we verify your payment and activate your
            subscription.
          </div>
        </div>
      </div>
    );
  }
  return (
    <div maxWidth="md" className="">
      <div className="">
        {success ? (
          <>
            <CheckCircleIcon
              className=""
            />
            <div  gutterBottom color="success.main">
              Payment Successful!
            </div>
            <div  color="text.secondary" className="">
              Your subscription has been activated successfully.
            </div>
            <Alert severity="success" className="">
              You now have full access to all the features included in your
              plan.
            </Alert>
            <Button
              
              size="large"
              onClick={handleContinue}
              className=""
            >
              Continue to Dashboard
            </Button>
          </>
        ) : (
          <>
            <ErrorOutlineIcon
              className=""
            />
            <div  gutterBottom color="error.main">
              Payment Verification Failed
            </div>
            <div  color="text.secondary" className="">
              {error || 'There was an issue verifying your payment.'}
            </div>
            <Alert severity="error" className="">
              Don't worry! If your payment was processed, it may take a few
              minutes to reflect. If you continue to have issues, please contact
              support.
            </Alert>
            <div className="">
              <Button  size="large" onClick={handleRetry}>
                Try Again
              </Button>
              <Button
                
                size="large"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default SubscriptionSuccess;
