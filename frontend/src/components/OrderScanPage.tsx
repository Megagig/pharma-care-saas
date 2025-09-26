import { Button, Input, Card, CardContent, Spinner, Alert, Separator } from '@/components/ui/button';
// Mock data for demonstration
const MOCK_ORDER: ManualLabOrder = {
  _id: 'order_123',
  orderId: 'LAB-2024-0001',
  patientId: 'patient_456',
  workplaceId: 'workplace_789',
  orderedBy: 'user_101',
  tests: [
    {
      name: 'Complete Blood Count',
      code: 'CBC',
      loincCode: '58410-2',
      specimenType: 'Blood',
      unit: 'cells/μL',
      refRange: '4.5-11.0 x10³',
      category: 'Hematology',
    },
    {
      name: 'Basic Metabolic Panel',
      code: 'BMP',
      loincCode: '51990-0',
      specimenType: 'Blood',
      unit: 'mmol/L',
      refRange: 'Various',
      category: 'Chemistry',
    },
  ],
  indication: 'Routine health screening and follow-up',
  requisitionFormUrl: '/api/manual-lab-orders/LAB-2024-0001/pdf',
  barcodeData: 'eyJvcmRlcklkIjoiTEFCLTIwMjQtMDAwMSIsInRva2VuIjoiYWJjZGVmZ2gifQ',
  status: 'sample_collected',
  priority: 'routine',
  consentObtained: true,
  consentTimestamp: new Date(),
  consentObtainedBy: 'user_101',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user_101',
  isDeleted: false,
  patient: {
    _id: 'patient_456',
    firstName: 'John',
    lastName: 'Doe',
    mrn: 'PHM-LAG-001234',
    age: 45,
    gender: 'male',
    phone: '+2348012345678',
    pharmacyId: 'workplace_789',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  } as Patient,
};
interface OrderScanPageProps {
  token?: string;
  onOrderResolved?: (order: ManualLabOrder) => void;
  onNavigateToResults?: (orderId: string) => void;
}
const OrderScanPage: React.FC<OrderScanPageProps> = ({ 
  token: propToken,
  onOrderResolved,
  onNavigateToResults
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { token: routeToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  // State management
  const [token, setToken] = useState(
    propToken || routeToken || searchParams.get('token') || ''
  );
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<ManualLabOrder | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');
  // Refs
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);
  // Check camera permissions
  const checkCameraPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ 
        name: 'camera' as PermissionName}
      });
      setCameraPermission(result.state);
      result.addEventListener('change', () => {
        setCameraPermission(result.state);
      });
    } catch (error) {
      console.warn('Camera permission check not supported:', error);
      setCameraPermission('unknown');
    }
  }, []);
  // Initialize camera permission check
  useEffect(() => {
    checkCameraPermission();
  }, [checkCameraPermission]);
  // Resolve token to order
  const resolveToken = useCallback(
    async (tokenToResolve: string) => {
      if (!tokenToResolve.trim()) {
        setError('Please provide a valid token');
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // Mock API call - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Mock token validation
        if (tokenToResolve === 'invalid_token') {
          throw new Error('Invalid or expired token');
        }
        // Mock successful resolution
        setOrder(MOCK_ORDER);
        if (onOrderResolved) {
          onOrderResolved(MOCK_ORDER);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to resolve token';
        setError(errorMessage);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    },
    [onOrderResolved]
  );
  // Initialize scanner
  const initializeScanner = useCallback(() => {
    if (!scannerElementRef.current || scannerRef.current) return;
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
      supportedScanTypes: [Html5QrcodeScanner.SCAN_TYPE_CAMERA],
    };
    scannerRef.current = new Html5QrcodeScanner(
      'qr-scanner',
      config,
      /* verbose= */ false
    );
    scannerRef.current.render(
      (decodedText) => {
        // Success callback
        setToken(decodedText);
        resolveToken(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Error callback - can be ignored for continuous scanning
        console.debug('QR scan error:', errorMessage);
      }
    );
    setScannerActive(true);
  }, [resolveToken]);
  // Stop scanner
  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScannerActive(false);
    setIsScanning(false);
  }, []);
  // Start scanning
  const startScanning = () => {
    setIsScanning(true);
    setError(null);
    setTimeout(initializeScanner, 100); // Small delay to ensure DOM is ready
  };
  // Handle manual token submission
  const handleManualTokenSubmit = () => {
    if (manualToken.trim()) {
      setToken(manualToken.trim());
      resolveToken(manualToken.trim());
      setShowManualEntry(false);
    }
  };
  // Navigate to result entry
  const handleNavigateToResults = () => {
    if (order) {
      if (onNavigateToResults) {
        onNavigateToResults(order.orderId);
      } else {
        navigate(`/lab-orders/${order.orderId}/results`);
      }
    }
  };
  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };
  // Auto-resolve token if provided
  useEffect(() => {
    if (token && !order && !isLoading) {
      resolveToken(token);
    }
  }, [token, order, isLoading, resolveToken]);
  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);
  // Get status info
  const getStatusInfo = (status: string) => {
    const statusInfo = LAB_ORDER_STATUSES.find((s) => s.value === status);
    return statusInfo || { value: status, label: status, color: '#666' };
  };
  const getPriorityInfo = (priority: string) => {
    const priorityInfo = LAB_ORDER_PRIORITIES.find((p) => p.value === priority);
    return priorityInfo || { value: priority, label: priority, color: '#666' };
  };
  return (
    <div className="">
      {/* Header */}
      <div className="">
        <IconButton onClick={handleBack} className="">
          <ArrowBackIcon />
        </IconButton>
        <div>
          <div  className="">
            Scan Lab Order
          </div>
          <div  color="text.secondary">
            Scan QR code or enter token to access lab order
          </div>
        </div>
      </div>
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          className=""
          action={}
            <Button color="inherit" size="small" onClick={() => setError(null)}>
              Dismiss
            </Button>
          }
        >
          <div className="">
            <ErrorIcon className="" />
            {error}
          </div>
        </Alert>
      )}
      {/* Loading State */}
      {isLoading && (
        <Card className="">
          <CardContent>
            <div
              className=""
            >
              <Spinner className="" />
              <div>Resolving token...</div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Scanner Section */}
      {!order && !isLoading && (
        <div container spacing={3}>
          {/* QR Scanner */}
          <div item xs={12} md={8}>
            <Card>
              <CardContent>
                <div  className="">
                  QR Code Scanner
                </div>
                {!isScanning && (
                  <div className="">
                    <QrCodeScannerIcon
                      className=""
                    />
                    <div  className="">
                      Position the QR code within the camera frame
                    </div>
                    {cameraPermission === 'denied' && (
                      <Alert severity="warning" className="">
                        Camera access is required for QR scanning. Please enable
                        camera permissions in your browser settings.
                      </Alert>
                    )}
                    <Button
                      
                      startIcon={<CameraIcon />}
                      onClick={startScanning}
                      disabled={cameraPermission === 'denied'}
                      size="large"
                    >
                      Start Camera
                    </Button>
                  </div>
                )}
                {isScanning && (
                  <div>
                    <div
                      id="qr-scanner"
                      ref={scannerElementRef}
                      className="" />
                    <div
                      className=""
                    >
                      <Button
                        
                        startIcon={<CloseIcon />}
                        onClick={stopScanner}
                      >
                        Stop Scanner
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Manual Entry */}
          <div item xs={12} md={4}>
            <Card>
              <CardContent>
                <div  className="">
                  Manual Entry
                </div>
                <div
                  
                  color="text.secondary"
                  className=""
                >
                  Can't scan? Enter the token manually
                </div>
                <Input
                  fullWidth
                  label="Token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Enter token from requisition"
                  className=""
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualTokenSubmit();}
                    }
                />
                <Button
                  fullWidth
                  
                  onClick={handleManualTokenSubmit}
                  disabled={!manualToken.trim()}
                >
                  Resolve Token
                </Button>
              </CardContent>
            </Card>
            {/* Instructions */}
            <Card className="">
              <CardContent>
                <div  className="">
                  Instructions
                </div>
                <div  color="text.secondary">
                  1. Scan the QR code on the lab requisition form
                </div>
                <div  color="text.secondary">
                  2. Or manually enter the token printed below the QR code
                </div>
                <div  color="text.secondary">
                  3. Review order details and proceed to result entry
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {/* Order Details */}
      {order && !isLoading && (
        <Card>
          <CardContent>
            <div
              className=""
            >
              <div className="">
                <CheckCircleIcon color="success" className="" />
                <div >Order Found</div>
              </div>
              <Chip
                label={getStatusInfo(order.status).label}
                className=""
              />
            </div>
            <div container spacing={3}>
              {/* Order Information */}
              <div item xs={12} md={6}>
                <div  className="">
                  Order Information
                </div>
                <div className="">
                  <div  color="text.secondary">
                    Order ID
                  </div>
                  <div  className="">
                    {order.orderId}
                  </div>
                </div>
                <div className="">
                  <div  color="text.secondary">
                    Priority
                  </div>
                  <Chip
                    label={getPriorityInfo(order.priority || 'routine').label}
                    size="small"
                    className=""
                  />
                </div>
                <div className="">
                  <div  color="text.secondary">
                    Created
                  </div>
                  <div >
                    {new Date(order.createdAt).toLocaleDateString()} at{' '}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              {/* Patient Information */}
              <div item xs={12} md={6}>
                <div  className="">
                  Patient Information
                </div>
                {order.patient && (
                  <div>
                    <div className="">
                      <div  color="text.secondary">
                        Name
                      </div>
                      <div  className="">
                        {order.patient.firstName} {order.patient.lastName}
                      </div>
                    </div>
                    <div className="">
                      <div  color="text.secondary">
                        MRN
                      </div>
                      <div >
                        {order.patient.mrn}
                      </div>
                    </div>
                    <div className="">
                      <div  color="text.secondary">
                        Age
                      </div>
                      <div >
                        {order.patient.age || 'Not specified'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Clinical Information */}
              <div item xs={12}>
                <Separator className="" />
                <div  className="">
                  Clinical Information
                </div>
                <div className="">
                  <div  color="text.secondary">
                    Clinical Indication
                  </div>
                  <div >{order.indication}</div>
                </div>
                {order.notes && (
                  <div className="">
                    <div  color="text.secondary">
                      Additional Notes
                    </div>
                    <div >{order.notes}</div>
                  </div>
                )}
              </div>
              {/* Ordered Tests */}
              <div item xs={12}>
                <Separator className="" />
                <div  className="">
                  Ordered Tests ({order.tests.length})
                </div>
                <div >
                  {order.tests.map((test, index) => (
                    <div key={index}>
                      <div className="">
                        <div
                          className=""
                        >
                          <div
                            
                            className=""
                          >
                            {test.name}
                          </div>
                          <div className="">
                            <Chip
                              label={test.code}
                              size="small"
                              
                            />
                            <Chip
                              label={test.category}
                              size="small"
                              color="primary"
                            />
                          </div>
                        </div>
                        <div  color="text.secondary">
                          Specimen: {test.specimenType} | Reference Range:{' '}
                          {test.refRange}
                        </div>
                        {test.unit && (
                          <div  color="text.secondary">
                            Unit: {test.unit}
                          </div>
                        )}
                      </div>
                      {index < order.tests.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div
              className=""
            >
              <Button
                
                startIcon={<VisibilityIcon />}
                onClick={() => window.open(order.requisitionFormUrl, '_blank')}
              >
                View Requisition
              </Button>
              <div className="">
                <Button
                  
                  >
                  Scan Another
                </Button>
                <Button
                  
                  startIcon={<AssignmentIcon />}
                  onClick={handleNavigateToResults}
                  disabled={order.status === 'completed'}
                >
                  {order.status === 'completed'
                    ? 'Results Entered'
                    : 'Enter Results'}
                </Button>
              </div>
            </div>
            {/* Status-specific messages */}
            {order.status === 'requested' && (
              <Alert severity="info" className="">
                <div >
                  This order is in "Requested" status. Sample collection may
                  still be pending.
                </div>
              </Alert>
            )}
            {order.status === 'completed' && (
              <Alert severity="success" className="">
                <div >
                  Results have already been entered for this order. You can view
                  the results but cannot modify them.
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      {/* Floating Action Button for Mobile */}
      {isMobile && !order && !isScanning && (
        <Fab
          color="primary"
          className=""
          onClick={startScanning}
          disabled={cameraPermission === 'denied'}
        >
          <QrCodeScannerIcon />
        </Fab>
      )}
    </div>
  );
};
export default OrderScanPage;
