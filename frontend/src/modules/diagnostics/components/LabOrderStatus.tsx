import { Button, Input, Card, CardContent, Dialog, DialogContent, DialogTitle, Progress, Alert, Separator } from '@/components/ui/button';

interface LabOrderStatusProps {
  order: LabOrder;
  onStatusChange?: (orderId: string, newStatus: LabOrder['status']) => void;
  onOrderUpdate?: (order: LabOrder) => void;
  showActions?: boolean;
  compact?: boolean;
}
const STATUS_CONFIG = {
  ordered: {
    color: 'info' as const,
    icon: ScheduleIcon,
    label: 'Ordered',
    description: 'Order has been placed',
    progress: 25,
  },
  collected: {
    color: 'warning' as const,
    icon: LocalHospitalIcon,
    label: 'Collected',
    description: 'Specimen collected',
    progress: 50,
  },
  processing: {
    color: 'secondary' as const,
    icon: ScienceIcon,
    label: 'Processing',
    description: 'Lab is processing',
    progress: 75,
  },
  completed: {
    color: 'success' as const,
    icon: CheckCircleIcon,
    label: 'Completed',
    description: 'Results available',
    progress: 100,
  },
  cancelled: {
    color: 'error' as const,
    icon: CancelIcon,
    label: 'Cancelled',
    description: 'Order cancelled',
    progress: 0,
  },
};
const PRIORITY_CONFIG = {
  stat: { color: 'error' as const, label: 'STAT', urgency: 'Immediate' },
  urgent: { color: 'warning' as const, label: 'Urgent', urgency: '2-4 hours' },
  routine: { color: 'success' as const, label: 'Routine', urgency: 'Standard' },
};
const STATUS_STEPS = [
  {
    key: 'ordered',
    label: 'Order Placed',
    description: 'Lab order created and submitted',
  },
  {
    key: 'collected',
    label: 'Specimen Collected',
    description: 'Patient specimen obtained',
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'Laboratory analysis in progress',
  },
  {
    key: 'completed',
    label: 'Results Available',
    description: 'Test results ready for review',
  },
];
const LabOrderStatus: React.FC<LabOrderStatusProps> = ({ 
  order,
  onStatusChange,
  onOrderUpdate,
  showActions = true,
  compact = false
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LabOrder['status']>(
    order.status
  );
  const [statusNote, setStatusNote] = useState('');
  const { updateOrderStatus, cancelOrder, loading, errors } = useLabStore();
  const currentStatusConfig = STATUS_CONFIG[order.status];
  const isMenuOpen = Boolean(anchorEl);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleStatusUpdate = async () => {
    if (selectedStatus !== order.status) {
      const success = await updateOrderStatus(order._id, selectedStatus);
      if (success) {
        onStatusChange?.(order._id, selectedStatus);
        setShowStatusDialog(false);
        setStatusNote('');
      }
    } else {
      setShowStatusDialog(false);
    }
  };
  const handleCancelOrder = async () => {
    const success = await cancelOrder(order._id);
    if (success) {
      onStatusChange?.(order._id, 'cancelled');
    }
    handleMenuClose();
  };
  const getActiveStep = () => {
    if (order.status === 'cancelled') return -1;
    return STATUS_STEPS.findIndex((step) => step.key === order.status);
  };
  const getTimeSinceOrder = () => {
    const orderDate = new Date(order.orderDate);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60)
    );
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };
  const getExpectedTime = () => {
    if (order.expectedDate) {
      const expected = new Date(order.expectedDate);
      const now = new Date();
      if (expected < now) {
        return { text: 'Overdue', color: 'error' as const };
      } else {
        const diffHours = Math.floor(
          (expected.getTime() - now.getTime()) / (1000 * 60 * 60)
        );
        if (diffHours < 24) {
          return {
            text: `Expected in ${diffHours}h`,
            color: 'warning' as const,
          };
        } else {
          const diffDays = Math.floor(diffHours / 24);
          return { text: `Expected in ${diffDays}d`, color: 'info' as const };
        }
      }
    }
    return null;
  };
  const hasUrgentTests = order.tests.some(
    (test) => test.priority === 'stat' || test.priority === 'urgent'
  );
  const expectedTime = getExpectedTime();
  if (compact) {
    return (
      <div className="">
        <Chip
          icon={React.createElement(currentStatusConfig.icon, {}
            sx: { fontSize: 16 }, }}
          label={currentStatusConfig.label}
          color={currentStatusConfig.color}
          size="small"
          
        />
        {hasUrgentTests && (
          <Chip label="URGENT" color="error" size="small"  />
        )}
        <div  color="text.secondary">
          {getTimeSinceOrder()}
        </div>
        {showActions && (
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        )}
      </div>
    );
  }
  return (
    <>
      <Card >
        <CardContent>
          {/* Header */}
          <div
            className=""
          >
            <div>
              <div  className="">
                Lab Order #{order._id.slice(-6)}
              </div>
              <div  color="text.secondary">
                Ordered {getTimeSinceOrder()} • {order.tests.length} test(s)
              </div>
            </div>
            <div className="">
              <Chip
                icon={React.createElement(currentStatusConfig.icon, {}
                  sx: { fontSize: 16 }, }}
                label={currentStatusConfig.label}
                color={currentStatusConfig.color}
                
              />
              {showActions && (
                <IconButton onClick={handleMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
              )}
            </div>
          </div>
          {/* Progress Bar */}
          {order.status !== 'cancelled' && (
            <div className="">
              <div
                className=""
              >
                <div  className="">
                  Progress
                </div>
                <div  color="text.secondary">
                  {currentStatusConfig.progress}%
                </div>
              </div>
              <Progress
                
                color={currentStatusConfig.color}
                className=""
              />
              <div
                
                color="text.secondary"
                className=""
              >
                {currentStatusConfig.description}
              </div>
            </div>
          )}
          {/* Test Details */}
          <div className="">
            <div  className="">
              Ordered Tests
            </div>
            <div container spacing={2}>
              {order.tests.map((test, index) => (
                <div item xs={12} md={6} key={index}>
                  <div className="">
                    <div
                      className=""
                    >
                      <div  className="">
                        {test.name}
                      </div>
                      <Chip
                        label={PRIORITY_CONFIG[test.priority].label}
                        color={PRIORITY_CONFIG[test.priority].color}
                        size="small"
                        
                      />
                    </div>
                    <div  color="text.secondary">
                      Code: {test.code}
                      {test.loincCode && ` • LOINC: ${test.loincCode}`}
                    </div>
                    {test.indication && (
                      <div
                        
                        className=""
                      >
                        Indication: {test.indication}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Timeline */}
          <div className="">
            <div  className="">
              Order Timeline
            </div>
            <Stepper activeStep={getActiveStep()} orientation="vertical">
              {STATUS_STEPS.map((step, index) => (
                <Step key={step.key}>
                  <StepLabel>
                    <div  className="">
                      {step.label}
                    </div>
                  </StepLabel>
                  <StepContent>
                    <div  color="text.secondary">
                      {step.description}
                    </div>
                    {step.key === order.status && (
                      <div
                        
                        className=""
                      >
                        Current Status
                      </div>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </div>
          {/* Alerts and Warnings */}
          <div spacing={2}>
            {hasUrgentTests && (
              <Alert severity="warning" icon={<WarningIcon />}>
                <div >
                  This order contains urgent or STAT tests that require priority
                  processing.
                </div>
              </Alert>
            )}
            {expectedTime && (
              <Alert severity={expectedTime.color}>
                <div >
                  {expectedTime.text}
                  {expectedTime.color === 'error' &&
                    ' - Consider following up with the laboratory.'}
                </div>
              </Alert>
            )}
            {order.status === 'cancelled' && (
              <Alert severity="error">
                <div >
                  This order has been cancelled and will not be processed.
                </div>
              </Alert>
            )}
          </div>
          {/* External References */}
          {(order.externalOrderId || order.fhirReference) && (
            <div className="">
              <div
                
                color="text.secondary"
                className=""
              >
                External References:
              </div>
              {order.externalOrderId && (
                <div >
                  External ID: {order.externalOrderId}
                </div>
              )}
              {order.fhirReference && (
                <div  className="">
                  FHIR Reference: {order.fhirReference}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        >
        <MenuItem
          >
          <EditIcon className="" />
          Update Status
        </MenuItem>
        <MenuItem
          >
          <RefreshIcon className="" />
          Refresh Status
        </MenuItem>
        <Separator />
        <MenuItem
          >
          <PrintIcon className="" />
          Print Order
        </MenuItem>
        <MenuItem
          >
          <DownloadIcon className="" />
          Export FHIR
        </MenuItem>
        <Separator />
        {order.status !== 'cancelled' && order.status !== 'completed' && (
          <MenuItem onClick={handleCancelOrder} className="">
            <CancelIcon className="" />
            Cancel Order
          </MenuItem>
        )}
      </Menu>
      {/* Status Update Dialog */}
      <Dialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <div className="">
            <div  color="text.secondary" className="">
              Current Status: <strong>{currentStatusConfig.label}</strong>
            </div>
            <div spacing={2}>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                if (status === 'cancelled') return null;
                const Icon = config.icon;
                return (
                  <div
                    key={status}
                    className="" onClick={() =>
                      setSelectedStatus(status as LabOrder['status'])}
                    }
                  >
                    <div className="">
                      <Icon className="".main` }} />
                      <div>
                        <div  className="">
                          {config.label}
                        </div>
                        <div  color="text.secondary">
                          {config.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Input
            fullWidth
            label="Status Update Note (Optional)"
            placeholder="Add a note about this status change..."
            multiline
            rows={3}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
          {errors.updateOrder && (
            <Alert severity="error" className="">
              {errors.updateOrder}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusDialog(false)}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            
            disabled={loading.updateOrder}
          >
            {loading.updateOrder ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
export default LabOrderStatus;
