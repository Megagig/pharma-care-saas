// // Removed incomplete import: import { loadStripe 
// // Removed malformed import
//   Elements,
//   CardElement,
//   useStripe,
//   useElements,

import {
  paymentService,
  type PaymentMethod,
} from '../../services/paymentService';

import LoadingSpinner from '../LoadingSpinner';

import { Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Spinner, Alert } from '@/components/ui/button';
// Initialize Stripe (commented out until Stripe packages are installed)
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
// const CARD_ELEMENT_OPTIONS = {
//   style: {
//     base: {
//       fontSize: '16px',
//       color: '#424770',
//       '::placeholder': {
//         color: '#aab7c4',
//       },
//     },
//     invalid: {
//       color: '#9e2146',
//     },
//   },
// };
interface AddPaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}
const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ 
  onSuccess,
  onCancel
}) => {
  // const stripe = useStripe();
  // const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const addNotification = useUIStore((state) => state.addNotification);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(
      'Stripe integration is not yet implemented. Please install @stripe/stripe-js and @stripe/react-stripe-js packages.'
    );
    // TODO: These variables will be used when Stripe integration is implemented
    // Currently preserved for future use: onSuccess, setLoading, addNotification
    console.log('Variables ready for Stripe integration:', {
      onSuccess,
      setLoading,
      addNotification}
    // TODO: Implement Stripe integration
    // Original Stripe code commented out below:
    /*
    if (!stripe || !elements) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Create setup intent
      const { clientSecret } = await paymentService.createSetupIntent();
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      // Confirm setup intent
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      if (setupIntent?.payment_method) {
        // Add payment method to backend
        await paymentService.addPaymentMethod(
          setupIntent.payment_method as string,
          setAsDefault
        );
        addNotification({ 
          type: 'success',
          title: 'Payment Method Added',
          message: 'Your payment method has been added successfully',
          duration: 3000,
        });
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error adding payment method:', err);
    } finally {
      setLoading(false);
    }
    */
  };
  return (
    <div component="form" onSubmit={handleSubmit}>
      <div className="">
        <div  gutterBottom>
          Card Information
        </div>
        <div
          className="">
          <div >
            Stripe Card Element will be rendered here when Stripe packages are
            installed
          </div>
          {/* <CardElement options={CARD_ELEMENT_OPTIONS} /> */}
        </div>
      </div>
      {error && (
        <Alert severity="error" className="">
          {error}
        </Alert>
      )}
      <div className="">
        <Button
          variant={setAsDefault ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setSetAsDefault(!setAsDefault)}
          startIcon={setAsDefault ? <StarIcon /> : <StarBorderIcon />}
        >
          Set as default payment method
        </Button>
      </div>
      <div direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          
          disabled={loading}
          startIcon={loading ? <Spinner size={16} /> : <AddIcon />}
        >
          {loading ? 'Adding...' : 'Add Payment Method'}
        </Button>
      </div>
    </div>
  );
};
const PaymentMethodsManagement: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const addNotification = useUIStore((state) => state.addNotification);
  const loadPaymentMethods = useCallback(async () => {
    setLoading(true);
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      addNotification({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to load payment methods',
        duration: 5000}
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);
  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);
  const handleSetDefault = async (paymentMethodId: string) => {
    setActionLoading(paymentMethodId);
    try {
      await paymentService.setDefaultPaymentMethod(paymentMethodId);
      await loadPaymentMethods();
      addNotification({ 
        type: 'success',
        title: 'Default Updated',
        message: 'Default payment method updated successfully',
        duration: 3000}
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      addNotification({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to update default payment method',
        duration: 5000}
      });
    } finally {
      setActionLoading(null);
    }
  };
  const handleDeleteConfirm = () => {
    if (!selectedMethodId) return;
    const method = paymentMethods.find((m) => m.id === selectedMethodId);
    if (method?.isDefault) {
      addNotification({ 
        type: 'warning',
        title: 'Cannot Delete',
        message:
          'Cannot delete the default payment method. Please set another method as default first.',
        duration: 5000}
      });
      setDeleteConfirmOpen(false);
      setSelectedMethodId(null);
      return;
    }
    handleDelete();
  };
  const handleDelete = async () => {
    if (!selectedMethodId) return;
    setActionLoading(selectedMethodId);
    try {
      await paymentService.removePaymentMethod(selectedMethodId);
      await loadPaymentMethods();
      addNotification({ 
        type: 'success',
        title: 'Payment Method Removed',
        message: 'Payment method removed successfully',
        duration: 3000}
      });
    } catch (error) {
      console.error('Error removing payment method:', error);
      addNotification({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to remove payment method',
        duration: 5000}
      });
    } finally {
      setActionLoading(null);
      setDeleteConfirmOpen(false);
      setSelectedMethodId(null);
    }
  };
  const getCardBrandIcon = () => {
    // In a real implementation, you'd have specific icons for each brand
    return <CreditCardIcon />;
  };
  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };
  const handleAddSuccess = () => {
    setAddDialogOpen(false);
    loadPaymentMethods();
  };
  if (loading) {
    return <LoadingSpinner message="Loading payment methods..." />;
  }
  return (
    <div>
      <div
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        className=""
      >
        <div >Payment Methods</div>
        <Button
          
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Payment Method
        </Button>
      </div>
      {/* Security Notice */}
      <Alert severity="info" icon={<SecurityIcon />} className="">
        Your payment information is securely stored and encrypted. We never
        store your full card details on our servers.
      </Alert>
      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="">
            <CreditCardIcon
              className=""
            />
            <div  gutterBottom>
              No Payment Methods
            </div>
            <div  color="text.secondary" className="">
              Add a payment method to manage your subscription and billing.
            </div>
            <Button
              
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
            >
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div container spacing={3}>
          {paymentMethods.map((method) => (
            <div  key={method.id}>
              <Card >
                <CardContent>
                  <div direction="row" spacing={2} alignItems="flex-start">
                    <div className="">
                      {getCardBrandIcon()}
                    </div>
                    <div className="">
                      <div
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        className=""
                      >
                        <div
                          
                          className=""
                        >
                          {method.brand}
                        </div>
                        <div  color="text.secondary">
                          •••• {method.last4}
                        </div>
                        {method.isDefault && (
                          <Chip
                            label="Default"
                            size="small"
                            color="primary"
                            icon={<StarIcon />}
                          />
                        )}
                      </div>
                      <div  color="text.secondary">
                        Expires{' '}
                        {formatExpiryDate(
                          method.expiryMonth,
                          method.expiryYear
                        )}
                      </div>
                      <div  color="text.secondary">
                        Added {new Date(method.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div direction="row" spacing={1}>
                      {!method.isDefault && (
                        <IconButton
                          size="small"
                          onClick={() => handleSetDefault(method.id)}
                          disabled={actionLoading === method.id}
                          title="Set as default"
                        >
                          {actionLoading === method.id ? (
                            <Spinner size={16} />
                          ) : (
                            <StarBorderIcon />
                          )}
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        
                        disabled={actionLoading === method.id}
                        title="Remove payment method"
                      >
                        {actionLoading === method.id ? (
                          <Spinner size={16} />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
      {/* Add Payment Method Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          {/* Elements wrapper commented out until Stripe packages are installed */}
          {/* <Elements stripe={stripePromise}> */}
          <AddPaymentMethodForm
            onSuccess={handleAddSuccess}
            onCancel={() => setAddDialogOpen(false)}
          />
          {/* </Elements> */}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove Payment Method</DialogTitle>
        <DialogContent>
          <div  gutterBottom>
            Are you sure you want to remove this payment method?
          </div>
          <Alert severity="warning" className="">
            This action cannot be undone. Make sure you have another payment
            method set up for your subscription.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            
          >
            Remove Payment Method
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default PaymentMethodsManagement;
