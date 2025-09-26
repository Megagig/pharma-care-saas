import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { CardHeader } from '@/components/ui/card';

import { Dialog } from '@/components/ui/dialog';

import { DialogContent } from '@/components/ui/dialog';

import { DialogTitle } from '@/components/ui/dialog';

import { Tooltip } from '@/components/ui/tooltip';

import { Alert } from '@/components/ui/alert';

import { Skeleton } from '@/components/ui/skeleton';

import { Avatar } from '@/components/ui/avatar';

import { Separator } from '@/components/ui/separator';
import {
  usePatientLabOrders,
  useCreateManualLabOrder,
} from '@/hooks/useLabOrders';

interface PatientLabOrderWidgetProps {
  patientId: string;
  maxOrders?: number;
  onViewOrder?: (orderId: string) => void;
  onViewResults?: (orderId: string) => void;
  onViewAllOrders?: () => void;
}

// Common lab tests for quick selection
const COMMON_LAB_TESTS: LabTest[] = [
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
  {
    name: 'Lipid Panel',
    code: 'LIPID',
    loincCode: '57698-3',
    specimenType: 'Blood',
    unit: 'mg/dL',
    refRange: 'Various',
    category: 'Chemistry',
  },
  {
    name: 'Liver Function Tests',
    code: 'LFT',
    loincCode: '24362-6',
    specimenType: 'Blood',
    unit: 'U/L',
    refRange: 'Various',
    category: 'Chemistry',
  },
  {
    name: 'Thyroid Function Tests',
    code: 'TFT',
    loincCode: '24348-5',
    specimenType: 'Blood',
    unit: 'mIU/L',
    refRange: '0.4-4.0',
    category: 'Endocrinology',
  },
  {
    name: 'Urinalysis',
    code: 'UA',
    loincCode: '24357-6',
    specimenType: 'Urine',
    unit: 'Various',
    refRange: 'Various',
    category: 'Urinalysis',
  },
];

const PatientLabOrderWidget: React.FC<PatientLabOrderWidgetProps> = ({ 
  patientId,
  maxOrders = 3,
  onViewOrder,
  onViewResults,
  onViewAllOrders
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [showQuickOrderDialog, setShowQuickOrderDialog] = useState(false);
  const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
  const [indication, setIndication] = useState('');
  const [consentObtained, setConsentObtained] = useState(false);

  // Fetch orders
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePatientLabOrders(patientId);

  // Create order mutation
  const createOrderMutation = useCreateManualLabOrder();

  const recentOrders = orders.slice(0, maxOrders);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <PendingIcon color="info" />;
      case 'sample_collected':
        return <ScienceIcon color="primary" />;
      case 'result_awaited':
        return <PendingIcon color="warning" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'referred':
        return <WarningIcon color="error" />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getStatusColor = (
    status: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (status) {
      case 'requested':
        return 'info';
      case 'sample_collected':
        return 'primary';
      case 'result_awaited':
        return 'warning';
      case 'completed':
        return 'success';
      case 'referred':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleQuickOrderSubmit = async () => {
    if (selectedTests.length === 0 || !indication.trim() || !consentObtained) {
      return;
    }

    try {
      const orderData: CreateOrderRequest = {
        patientId,
        tests: selectedTests,
        indication: indication.trim(),
        priority: 'routine',
        consentObtained: true,
      };

      await createOrderMutation.mutateAsync(orderData);

      // Reset form
      setSelectedTests([]);
      setIndication('');
      setConsentObtained(false);
      setShowQuickOrderDialog(false);
    } catch (error) {
      console.error('Failed to create lab order:', error);
    }
  };

  const handleDownloadPdf = (orderId: string) => {
    const pdfUrl = `/api/manual-lab/${orderId}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Lab Orders" />
        <CardContent>
          <div spacing={2}>
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index}  height={60} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title="Lab Orders" />
        <CardContent>
          <Alert severity="error">
            <div >
              Failed to load lab orders:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              className=""
            >
              Retry
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title={
            <div className="">
              <ScienceIcon color="primary" />}
              <div  fontWeight={600}>
                Lab Orders
              </div>
              {orders.length > 0 && (
                <Chip label={orders.length} size="small" color="primary" />
              )}
            </div>
          }
          action={
            <div className="">
              <Button
                size="small"}
                startIcon={<AddIcon />}
                onClick={() => setShowQuickOrderDialog(true)}
                
              >
                Quick Order
              </Button>
              <IconButton size="small" onClick={() => refetch()}>
                <RefreshIcon />
              </IconButton>
            </div>
          }
        />
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="">
              <ScienceIcon
                className=""
              />
              <div  color="text.secondary" gutterBottom>
                No lab orders yet
              </div>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setShowQuickOrderDialog(true)}
                
                size="small"
              >
                Create First Order
              </Button>
            </div>
          ) : (
            <>
              <List dense>
                {recentOrders.map((order, index) => (
                  <React.Fragment key={order.orderId}>
                    <div
                      className=""
                      secondaryAction={
                        <div className="">
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"}
                              onClick={() => handleDownloadPdf(order.orderId)}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {onViewOrder && (
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => onViewOrder(order.orderId)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </div>
                      }
                    >
                      <div>
                        <Avatar
                          className=""
                        >
                          {getStatusIcon(order.status)}
                        </Avatar>
                      </div>
                      <div
                        primary={
                          <div
                            className=""
                          >}
                            <div  fontWeight={600}>
                              {order.orderId}
                            </div>
                            <Chip
                              label={
                                LAB_ORDER_STATUSES[order.status] || order.status}
                              }
                              size="small"
                              color={getStatusColor(order.status)}
                            />
                          </div>
                        }
                        secondary={
                          <div>
                            <div
                              
                              color="text.secondary"
                            >}
                              {order.tests.length} test
                              {order.tests.length !== 1 ? 's' : ''} •{' '}
                              {formatDate(order.createdAt)}
                            </div>
                            <div
                              
                              display="block"
                              color="text.secondary"
                            >
                              {order.indication.length > 40
                                ? `${order.indication.substring(0, 40)}...`
                                : order.indication}
                            </div>
                          </div>
                        }
                      />
                    </div>
                    {index < recentOrders.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </List>

              {orders.length > maxOrders && (
                <div className="">
                  <Button size="small" onClick={onViewAllOrders} >
                    View All {orders.length} Orders
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Order Dialog */}
      <Dialog
        open={showQuickOrderDialog}
        onClose={() => setShowQuickOrderDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <div
            className=""
          >
            <div >Quick Lab Order</div>
            <IconButton onClick={() => setShowQuickOrderDialog(false)}>
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <div spacing={3} className="">
            {/* Test Selection */}
            <Autocomplete
              multiple
              options={COMMON_LAB_TESTS}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              value={selectedTests}
              onChange={(_, newValue) => setSelectedTests(newValue)}
              renderInput={(params) => (
                <Input}
                  {...params}
                  label="Select Tests"
                  placeholder="Choose lab tests..."
                  helperText="Select one or more tests to order"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    }
                    label={`${option.name} (${option.code})`}
                    {...getTagProps({ index })}
                    key={option.code}
                  />
                ))
              }
              renderOption={(props, option) => (}
                <div component="li" {...props}>
                  <div>
                    <div  fontWeight={600}>
                      {option.name}
                    </div>
                    <div  color="text.secondary">
                      Code: {option.code} • Specimen: {option.specimenType} •
                      Category: {option.category}
                    </div>
                  </div>
                </div>
              )}
            />

            {/* Indication */}
            <Input
              label="Clinical Indication"
              multiline
              rows={3}
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              placeholder="Enter the clinical reason for ordering these tests..."
              helperText="Provide the clinical indication or reason for the lab tests"
              required
            />

            {/* Consent */}
            <FormControlLabel
              control={
                <Checkbox}
                  checked={consentObtained}
                  onChange={(e) => setConsentObtained(e.target.checked)}
                  required
                />
              }
              label="Patient consent obtained for lab testing"
            />

            {/* Selected Tests Summary */}
            {selectedTests.length > 0 && (
              <div>
                <div  gutterBottom>
                  Selected Tests ({selectedTests.length}):
                </div>
                <div className="">
                  {selectedTests.map((test) => (
                    <Chip
                      key={test.code}
                      label={`${test.name} (${test.code})`}
                      size="small"
                      
                      color="primary"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuickOrderDialog(false)}>Cancel</Button>
          <Button
            onClick={handleQuickOrderSubmit}
            
            disabled={
              selectedTests.length === 0 ||
              !indication.trim() ||
              !consentObtained ||
              createOrderMutation.isPending}
            }
          >
            {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PatientLabOrderWidget;
