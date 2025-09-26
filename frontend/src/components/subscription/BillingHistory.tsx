import {
  paymentService,
  type Payment,
  type PaginatedPayments,
} from '../../services/paymentService';

import LoadingSpinner from '../LoadingSpinner';

import { Button, Label, Card, CardContent, Select, Tooltip } from '@/components/ui/button';
const BillingHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // Filter state
  const [filters, setFilters] = useState({ 
    status: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  });
  // Summary state
  const [summary, setSummary] = useState({ 
    totalAmount: 0,
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
  });
  });
  const addNotification = useUIStore((state) => state.addNotification);
  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const dateFrom = filters.dateFrom?.toISOString().split('T')[0];
      const dateTo = filters.dateTo?.toISOString().split('T')[0];
      const data: PaginatedPayments = await paymentService.getPayments(
        page,
        10,
        filters.status || undefined,
        dateFrom,
        dateTo
      );
      setPayments(data.payments);
      setTotalPages(data.pagination.totalPages);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error loading payments:', error);
      addNotification({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to load billing history',
        duration: 5000}
      });
    } finally {
      setLoading(false);
    }
  }, [page, filters, addNotification]);
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);
  const handleFilterChange = (field: string, value: string | Date | null) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filters change
  };
  const clearFilters = () => {
    setFilters({ 
      status: '',
      dateFrom: null,
      dateTo: null}
    });
    setPage(1);
  };
  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };
  const getStatusLabel = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };
  const formatCurrency = (amount: number, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency, }.format(amount);
  };
  const handleDownloadInvoice = async (paymentId: string) => {
    setInvoiceLoading(true);
    try {
      const invoice = await paymentService.generateInvoice(paymentId);
      // For now, create a simple text representation
      // In production, this would generate a proper PDF
      const invoiceText = `
INVOICE: ${invoice.invoiceNumber}
Date: ${new Date(invoice.date).toLocaleDateString()}
Customer: ${invoice.customer.name}
Email: ${invoice.customer.email}
Items:
${invoice.items
  .map(
    (item: { description: string; amount: number; quantity: number }) =>
      `- ${item.description}: ${formatCurrency(item.amount)} x ${item.quantity}`
  )
  .join('\n')}
Total: ${formatCurrency(invoice.amount, invoice.currency)}
Status: ${invoice.status}
Payment Method: ${invoice.paymentMethod}
      `;
      const blob = new Blob([invoiceText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      addNotification({ 
        type: 'success',
        title: 'Download Complete',
        message: 'Invoice downloaded successfully',
        duration: 3000}
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      addNotification({ 
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download invoice',
        duration: 5000}
      });
    } finally {
      setInvoiceLoading(false);
    }
  };
  if (loading && page === 1) {
    return <LoadingSpinner message="Loading billing history..." />;
  }
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        <div  gutterBottom>
          Billing History
        </div>
        {/* Summary Cards */}
        <div display="flex" flexWrap="wrap" gap={3} className="">
          <div flex="1 1 200px">
            <Card>
              <CardContent>
                <div color="text.secondary" gutterBottom >
                  Total Spent
                </div>
                <div  component="div">
                  {formatCurrency(summary.totalAmount)}
                </div>
              </CardContent>
            </Card>
          </div>
          <div flex="1 1 200px">
            <Card>
              <CardContent>
                <div color="text.secondary" gutterBottom >
                  Total Payments
                </div>
                <div  component="div">
                  {summary.totalPayments}
                </div>
              </CardContent>
            </Card>
          </div>
          <div flex="1 1 200px">
            <Card>
              <CardContent>
                <div color="text.secondary" gutterBottom >
                  Successful
                </div>
                <div  component="div" color="success.main">
                  {summary.successfulPayments}
                </div>
              </CardContent>
            </Card>
          </div>
          <div flex="1 1 200px">
            <Card>
              <CardContent>
                <div color="text.secondary" gutterBottom >
                  Failed
                </div>
                <div  component="div" color="error.main">
                  {summary.failedPayments}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Filters Section */}
        <Card className="">
          <CardContent>
            <div display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <div size="small" className="">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </div>
              {/* Replace DatePicker with standard date inputs for now */}
              <div display="flex" gap={2} alignItems="center">
                <Button
                  
                  startIcon={<FilterIcon />}
                  >
                  Filter
                </Button>
                <Button
                  
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Payments Table */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id} hover>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div fontWeight="medium">
                          {formatCurrency(
                            payment.amount,
                            payment.currency.toUpperCase()
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.subscription?.planId?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(payment.status)}
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <div
                          
                          className=""
                        >
                          {payment.paymentMethod.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Download Invoice">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadInvoice(payment._id)}
                            disabled={invoiceLoading}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Pagination */}
            <div display="flex" justifyContent="center" className="">
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </LocalizationProvider>
  );
};
export default BillingHistory;
