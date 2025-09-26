import { Button, Input, Label, Card, CardContent, CardHeader, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tooltip, Alert, Skeleton, Avatar, Separator } from '@/components/ui/button';

interface OrderHistoryProps {
  patientId: string;
  maxOrders?: number;
  showCreateButton?: boolean;
  onCreateOrder?: () => void;
  onViewOrder?: (orderId: string) => void;
  onViewResults?: (orderId: string) => void;
  compact?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'status' | 'priority';
type FilterOption =
  | 'all'
  | 'requested'
  | 'sample_collected'
  | 'result_awaited'
  | 'completed'
  | 'referred';

const OrderHistory: React.FC<OrderHistoryProps> = ({ 
  patientId,
  maxOrders,
  showCreateButton = false,
  onCreateOrder,
  onViewOrder,
  onViewResults,
  compact = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for filtering and sorting
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Fetch orders
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePatientLabOrders(patientId);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter((order) => order.status === filterBy);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderId.toLowerCase().includes(searchLower) ||
          order.indication.toLowerCase().includes(searchLower) ||
          order.tests.some(
            (test) =>
              test.name.toLowerCase().includes(searchLower) ||
              test.code.toLowerCase().includes(searchLower)
          )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'status':
          return a.status.localeCompare(b.status);
        case 'priority':
          const priorityOrder = { stat: 0, urgent: 1, routine: 2 };
          return (
            (priorityOrder[a.priority || 'routine'] || 2) -
            (priorityOrder[b.priority || 'routine'] || 2)
          );
        default:
          return 0;
      }
    });

    // Apply max orders limit
    if (maxOrders) {
      filtered = filtered.slice(0, maxOrders);
    }

    return filtered;
  }, [orders, filterBy, searchTerm, sortBy, maxOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock size={16} className="text-blue-500" />;
      case 'sample_collected':
        return <Flask size={16} className="text-blue-600" />;
      case 'result_awaited':
        return <Clock size={16} className="text-orange-500" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'referred':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <FileText size={16} />;
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

  const getPriorityColor = (
    priority?: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (priority) {
      case 'stat':
        return 'error';
      case 'urgent':
        return 'warning';
      case 'routine':
        return 'info';
      default:
        return 'default';
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const handleDownloadPdf = (orderId: string) => {
    const pdfUrl = `/api/manual-lab-orders/${orderId}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Lab Order History" />
        <CardContent>
          <div spacing={2}>
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index}  height={80} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader title="Lab Order History" />
        <CardContent>
          <Alert severity="error">
            <div >
              Failed to load lab order history:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </div>
            <Button
              size="small"
              startIcon={<Refresh size={16} />}
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

  if (compact) {
    // Compact view for dashboard widgets
    return (
      <Card>
        <CardHeader
          title="Recent Lab Orders"
          action={
            <div className="">
              {showCreateButton && (
                <Button
                  size="small"}
                  startIcon={<Plus size={16} />}
                  onClick={onCreateOrder}
                  
                >
                  New Order
                </Button>
              )}
              <IconButton size="small" onClick={() => refetch()}>
                <Refresh size={16} />
              </IconButton>
            </div>
          }
        />
        <CardContent>
          {filteredAndSortedOrders.length === 0 ? (
            <div
              
              color="text.secondary"
              textAlign="center"
              py={2}
            >
              No lab orders found
            </div>
          ) : (
            <List dense>
              {filteredAndSortedOrders.map((order, index) => (
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
                            <Download size={16} />
                          </IconButton>
                        </Tooltip>
                        {onViewOrder && (
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => onViewOrder(order.orderId)}
                            >
                              <Eye size={16} />
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
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {LAB_ORDER_STATUSES[order.status] || order.status}
                          </Badge>
                          {order.priority && order.priority !== 'routine' && (
                            <Badge variant={getPriorityBadgeVariant(order.priority)}>
                              {LAB_ORDER_PRIORITIES[order.priority] ||
                                order.priority}
                            </Badge>
                          )}
                        </div>
                      }
                      secondary={
                        <div>
                          <div  color="text.secondary">}
                            {order.tests.length} test
                            {order.tests.length !== 1 ? 's' : ''} •{' '}
                            {formatDate(order.createdAt)}
                          </div>
                          <div
                            
                            display="block"
                            color="text.secondary"
                          >
                            {order.indication.length > 50
                              ? `${order.indication.substring(0, 50)}...`
                              : order.indication}
                          </div>
                        </div>
                      }
                    />
                  </div>
                  {index < filteredAndSortedOrders.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view with filters and timeline
  return (
    <Card>
      <CardHeader
        title={
          <div className="">}
            <div  fontWeight={600}>
              Lab Order History
            </div>
            <Badge badgeContent={orders.length} color="primary">
              <FileText size={24} />
            </Badge>
          </div>
        }
        action={
          <div className="">
            {showCreateButton && (
              <Button}
                startIcon={<Plus size={16} />}
                onClick={onCreateOrder}
                
                size={isMobile ? 'small' : 'medium'}
              >
                New Order
              </Button>
            )}
            <IconButton onClick={() => refetch()}>
              <Refresh size={16} />
            </IconButton>
          </div>
        }
      />
      <CardContent>
        {/* Filters and Search */}
        <div className="">
          <div
            direction={isMobile ? 'column' : 'row'}
            spacing={2}
            alignItems={isMobile ? 'stretch' : 'center'}
          >
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] h-8"
            />

            <div className="min-w-[120px]">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Status
              </Label>
              <Select
                value={filterBy}
                onValueChange={(value) => setFilterBy(value as FilterOption)}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(LAB_ORDER_STATUSES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[120px]">
              <Label htmlFor="sort-filter" className="text-sm font-medium">
                Sort By
              </Label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredAndSortedOrders.length === 0 ? (
          <div className="">
            <Flask
              size={48}
              className="text-gray-500 mb-2"
            />
            <div  color="text.secondary" gutterBottom>
              No lab orders found
            </div>
            <div  color="text.secondary">
              {orders.length === 0
                ? "This patient doesn't have any lab orders yet."
                : 'No orders match your current filters.'}
            </div>
            {showCreateButton && orders.length === 0 && (
              <Button
                startIcon={<Plus size={16} />}
                onClick={onCreateOrder}
                
                className=""
              >
                Create First Lab Order
              </Button>
            )}
          </div>
        ) : (
          <Timeline>
            {filteredAndSortedOrders.map((order, index) => (
              <OrderHistoryItem
                key={order.orderId}
                order={order}
                isLast={index === filteredAndSortedOrders.length - 1}
                isExpanded={expandedOrders.has(order.orderId)}
                onToggleExpansion={() => toggleOrderExpansion(order.orderId)}
                onDownloadPdf={() => handleDownloadPdf(order.orderId)}
                onViewOrder={onViewOrder}
                onViewResults={onViewResults}
              />
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  );
};

// Individual order item component
interface OrderHistoryItemProps {
  order: ManualLabOrder;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onDownloadPdf: () => void;
  onViewOrder?: (orderId: string) => void;
  onViewResults?: (orderId: string) => void;
}

const OrderHistoryItem: React.FC<OrderHistoryItemProps> = ({ 
  order,
  isLast,
  isExpanded,
  onToggleExpansion,
  onDownloadPdf,
  onViewOrder,
  onViewResults
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock size={16} />;
      case 'sample_collected':
        return <Flask size={16} />;
      case 'result_awaited':
        return <Clock size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      case 'referred':
        return <AlertTriangle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getStatusDotVariant = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'requested':
        return 'primary';
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

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default'; // Success/green
      case 'referred':
        return 'destructive'; // Error/red
      case 'result_awaited':
        return 'secondary'; // Warning/yellow
      case 'requested':
      case 'sample_collected':
        return 'outline'; // Info/blue
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (priority) {
      case 'stat':
        return 'destructive'; // Error/red
      case 'urgent':
        return 'secondary'; // Warning/yellow
      case 'routine':
        return 'outline'; // Info/blue
      default:
        return 'outline';
    }
  };

  return (
    <TimelineItem>
      <TimelineOppositeContent className="flex-[0.2] py-2">
        <div  color="text.secondary">
          {formatDateTime(order.createdAt)}
        </div>
        {order.priority && order.priority !== 'routine' && (
          <Badge variant={getPriorityBadgeVariant(order.priority)} className="text-xs">
            {LAB_ORDER_PRIORITIES[order.priority] || order.priority}
            color={order.priority === 'stat' ? 'error' : 'warning'}
            className=""
          />
        )}
      </TimelineOppositeContent>

      <TimelineSeparator>
        <TimelineDot variant={getStatusDotVariant(order.status)}>
          {getStatusIcon(order.status)}
        </TimelineDot>
        {!isLast && <TimelineConnector />}
      </TimelineSeparator>

      <TimelineContent className="py-2">
        <Card >
          <CardContent className="">
            {/* Order Header */}
            <div
              className=""
            >
              <div
                className=""
              >
                <div  fontWeight={600}>
                  {order.orderId}
                </div>
                <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs">
                  {LAB_ORDER_STATUSES[order.status] || order.status}
                </Badge>
              </div>

              <div className="">
                <Tooltip title="Download PDF">
                  <IconButton size="small" onClick={onDownloadPdf}>
                    <Download size={16} />
                  </IconButton>
                </Tooltip>
                {onViewOrder && (
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => onViewOrder(order.orderId)}
                    >
                      <Eye size={16} />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton size="small" onClick={onToggleExpansion}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </IconButton>
              </div>
            </div>

            {/* Order Summary */}
            <div  color="text.secondary" gutterBottom>
              {order.tests.length} test{order.tests.length !== 1 ? 's' : ''}{' '}
              ordered
            </div>

            <div  gutterBottom>
              <strong>Indication:</strong> {order.indication}
            </div>

            {/* Expanded Details */}
            <Collapse in={isExpanded}>
              <div className="">
                <div  gutterBottom>
                  Ordered Tests:
                </div>
                <List dense>
                  {order.tests.map((test, index) => (
                    <div key={index} className="">
                      <div
                        primary={test.name}
                        secondary={
                          <div>
                            <div  component="span">}
                              Code: {test.code}
                            </div>
                            {test.specimenType && (
                              <div
                                
                                component="span"
                                className=""
                              >
                                Specimen: {test.specimenType}
                              </div>
                            )}
                            {test.category && (
                              <div
                                
                                component="span"
                                className=""
                              >
                                Category: {test.category}
                              </div>
                            )}
                          </div>
                        }
                      />
                    </div>
                  ))}
                </List>

                {/* Action Buttons */}
                <div className="">
                  {order.status === 'completed' && onViewResults && (
                    <Button
                      size="small"
                      
                      startIcon={<AssignmentIcon />}
                      onClick={() => onViewResults(order.orderId)}
                    >
                      View Results
                    </Button>
                  )}
                  {(order.status === 'sample_collected' ||
                    order.status === 'result_awaited') && (
                    <Button
                      size="small"
                      
                      startIcon={<ScienceIcon />}
                      onClick={() =>
                        onViewResults && onViewResults(order.orderId)}
                      }
                    >
                      Enter Results
                    </Button>
                  )}
                </div>
              </div>
            </Collapse>
          </CardContent>
        </Card>
      </TimelineContent>
    </TimelineItem>
  );
};

export default OrderHistory;
