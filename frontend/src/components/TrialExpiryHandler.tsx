import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Mock components for now
const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockDialog = ({ children, open, ...props }: any) => {
  if (!open) return null;
  return (
    <div {...props} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {children}
    </div>
  );
};

const MockDialogContent = ({ children, ...props }: any) => (
  <div {...props} className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full ${props.className || ''}`}>
    {children}
  </div>
);

const MockDialogHeader = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 border-b ${props.className || ''}`}>
    {children}
  </div>
);

const MockDialogTitle = ({ children, ...props }: any) => (
  <h3 {...props} className={`text-lg font-semibold ${props.className || ''}`}>
    {children}
  </h3>
);

const MockDialogFooter = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 border-t flex justify-end gap-2 ${props.className || ''}`}>
    {children}
  </div>
);

const MockAlert = ({ children, ...props }: any) => (
  <div {...props} className={`p-4 mb-4 rounded-md bg-yellow-50 border-l-4 border-yellow-400 ${props.className || ''}`}>
    {children}
  </div>
);

const MockAlertDescription = ({ children, ...props }: any) => (
  <div {...props} className={`text-sm ${props.className || ''}`}>
    {children}
  </div>
);

// Mock hook
const useSubscriptionStatus = () => ({
  status: 'active',
  daysRemaining: 10,
  loading: false
});

// Replace imports with mock components
const Button = MockButton;
const Dialog = MockDialog;
const DialogContent = MockDialogContent;
const DialogHeader = MockDialogHeader;
const DialogTitle = MockDialogTitle;
const DialogFooter = MockDialogFooter;
const Alert = MockAlert;
const AlertDescription = MockAlertDescription;

interface TrialExpiryHandlerProps {
  children: React.ReactNode;
}

const TrialExpiryHandler: React.FC<TrialExpiryHandlerProps> = ({
  children
}) => {
  const { status, daysRemaining, loading } = useSubscriptionStatus();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show expiry dialog on subscription-related pages
  const isSubscriptionPage = location.pathname.includes('/subscription');

  useEffect(() => {
    // If trial has expired and user is not on a subscription page, redirect
    if (!loading && status === 'expired' && !isSubscriptionPage) {
      navigate('/subscription-management', {
        state: {
          from: location.pathname,
          reason: 'trial_expired'
        }
      });
    }
  }, [status, loading, isSubscriptionPage, navigate, location]);

  // Show warning when trial is about to expire (3 days or less)
  const showTrialWarning =
    !loading &&
    status === 'trial' &&
    daysRemaining !== undefined &&
    daysRemaining <= 3 &&
    daysRemaining > 0 &&
    !isSubscriptionPage;

  return (
    <>
      {children}

      {/* Trial Warning Dialog */}
      <Dialog open={showTrialWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              ⚠️ Trial Ending Soon
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Your free trial expires in {daysRemaining} day
                {daysRemaining !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>

            <p className="text-sm text-gray-600">
              To continue using all features without interruption, please upgrade
              to a paid plan.
            </p>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                After your trial expires, you'll lose access to:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Patient management</li>
                <li>• Medication tracking</li>
                <li>• Advanced reports</li>
                <li>• Team collaboration</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => navigate('/subscription-management')}
              className="flex-1"
            >
              Upgrade Now
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // You might want to implement a "remind me later" functionality
                // For now, just close the dialog
              }}
              className="flex-1"
            >
              Remind Me Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrialExpiryHandler;