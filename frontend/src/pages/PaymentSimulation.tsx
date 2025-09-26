import { Button, Card, CardContent, Progress, Alert, Separator } from '@/components/ui/button';
const PaymentSimulation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const reference = searchParams.get('ref');
  const amount = searchParams.get('amount');
  const handlePaymentSuccess = async () => {
    setProcessing(true);
    // Simulate payment processing delay
    setTimeout(() => {
      // Redirect to success page with reference
      navigate(`/subscription-management/success?reference=${reference}`);
    }, 2000);
  };
  const handlePaymentFailure = () => {
    navigate('/subscription-management?payment=failed');
  };
  const handleCancel = () => {
    navigate('/subscription-management');
  };
  if (!reference || !amount) {
    return (
      <div maxWidth="sm" className="">
        <Alert severity="error">
          Invalid payment session. Please try again.
        </Alert>
        <Button
          
          onClick={() => navigate('/subscription-management')}
          className=""
        >
          Back to Subscription Plans
        </Button>
      </div>
    );
  }
  return (
    <div maxWidth="sm" className="">
      <div className="">
        <div className="">
          <PaymentIcon color="primary" className="" />
          <div  component="h1" gutterBottom>
            Payment Simulation
          </div>
          <div  color="text.secondary">
            Development Mode
          </div>
        </div>
        <Card className="">
          <CardContent>
            <div  gutterBottom>
              Payment Details
            </div>
            <Separator className="" />
            <div
              className=""
            >
              <div>Amount:</div>
              <div fontWeight="bold">
                ₦{Number(amount).toLocaleString()}
              </div>
            </div>
            <div
              className=""
            >
              <div>Reference:</div>
              <div  color="text.secondary">
                {reference}
              </div>
            </div>
            <div className="">
              <div>Status:</div>
              <div color="warning.main">Pending Payment</div>
            </div>
          </CardContent>
        </Card>
        <Alert severity="info" className="">
          <div >
            <strong>Development Mode:</strong> This is a simulated payment page.
            In production, this would redirect to the actual Nomba payment
            gateway.
          </div>
        </Alert>
        {processing && (
          <div className="">
            <div  align="center" className="">
              Processing payment...
            </div>
            <Progress />
          </div>
        )}
        <div className="">
          <Button
            
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handlePaymentSuccess}
            disabled={processing}
            size="large"
          >
            Simulate Success
          </Button>
          <Button
            
            color="error"
            startIcon={<CancelIcon />}
            onClick={handlePaymentFailure}
            disabled={processing}
            size="large"
          >
            Simulate Failure
          </Button>
          <Button
            
            onClick={handleCancel}
            disabled={processing}
            size="large"
          >
            Cancel
          </Button>
        </div>
        <div className="">
          <div  color="text.secondary">
            This simulation will be replaced with real Nomba integration in
            production
          </div>
        </div>
      </div>
    </div>
  );
};
export default PaymentSimulation;
