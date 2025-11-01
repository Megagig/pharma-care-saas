# Billing & Subscriptions - Developer Guide

## Quick Start

### Running the Application

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Testing the Endpoints

```bash
# Set your auth token
export TEST_AUTH_TOKEN="your_super_admin_jwt_token"

# Run test script
npx ts-node backend/scripts/testBillingEndpoints.ts
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  BillingSubscriptions.tsx (Component)                        │
│           ↓                                                  │
│  useBillingData.ts (Hook)                                   │
│           ↓                                                  │
│  billingService.ts (API Client)                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
├─────────────────────────────────────────────────────────────┤
│  billingRoutes.ts (Routes)                                  │
│           ↓                                                  │
│  billingController.ts (Controller)                          │
│           ↓                                                  │
│  BillingService.ts (Business Logic)                         │
│           ↓                                                  │
│  Models (BillingSubscription, BillingInvoice, Payment)      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                       MongoDB                                │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints Reference

### 1. Get Billing Analytics
```typescript
GET /api/billing/analytics?startDate=2024-01-01&endDate=2024-12-31

Response:
{
  success: true,
  data: {
    totalRevenue: number,
    monthlyRecurringRevenue: number,
    annualRecurringRevenue: number,
    churnRate: number,
    averageRevenuePerUser: number,
    lifetimeValue: number,
    subscriptionsByStatus: Record<string, number>,
    revenueByPlan: Array<{
      planName: string,
      revenue: number,
      count: number
    }>
  }
}
```

### 2. Get Revenue Trends
```typescript
GET /api/billing/revenue-trends?period=30d

Periods: '7d' | '30d' | '90d' | '365d'

Response:
{
  success: true,
  data: Array<{
    date: string,
    revenue: number,
    transactions: number
  }>
}
```

### 3. Get All Subscriptions
```typescript
GET /api/billing/subscriptions?page=1&limit=10&status=active&search=pharmacy

Response:
{
  success: true,
  data: {
    subscriptions: Array<Subscription>,
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
}
```

### 4. Get All Invoices
```typescript
GET /api/billing/invoices?page=1&limit=10&status=paid&search=INV-2024

Response:
{
  success: true,
  data: {
    invoices: Array<Invoice>,
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
}
```

### 5. Get Payment Methods
```typescript
GET /api/billing/payment-methods

Response:
{
  success: true,
  data: Array<{
    _id: string,
    userId: string,
    paymentMethod: string,
    customerName: string,
    customerEmail: string,
    lastUsed: string,
    transactionCount: number,
    totalAmount: number,
    status: string
  }>
}
```

## Frontend Components

### Main Component Structure

```typescript
// BillingSubscriptions.tsx
const BillingSubscriptions: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Data fetching
  const fetchData = useCallback(async () => {
    // Fetch all data
  }, []);
  
  // Render tabs
  return (
    <Box>
      {/* Header */}
      {/* Metric Cards */}
      {/* Tabs */}
      {/* Tab Content */}
      {/* Dialogs */}
    </Box>
  );
};
```

### Custom Hook Usage

```typescript
// Using the hook
import { useBillingData } from '../../hooks/useBillingData';

const {
  analytics,
  invoices,
  subscriptions,
  revenueTrends,
  loading,
  error,
  refreshData,
  processRefund
} = useBillingData();
```

### Service Layer Usage

```typescript
// Using the service
import { billingService } from '../../services/billingService';

// Get analytics
const response = await billingService.getBillingAnalytics();

// Get subscriptions with filters
const subs = await billingService.getSubscriptions(1, 10, 'active', 'pharmacy');

// Process refund
await billingService.processRefund({
  paymentReference: 'INV-123',
  amount: 5000,
  reason: 'Customer request'
});
```

## Database Models

### BillingSubscription Schema
```typescript
{
  workspaceId: ObjectId,
  planId: ObjectId,
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete',
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  billingInterval: 'monthly' | 'yearly',
  unitAmount: Number,
  currency: String,
  cancelAtPeriodEnd: Boolean,
  trialEnd: Date,
  metadata: Object
}
```

### BillingInvoice Schema
```typescript
{
  workspaceId: ObjectId,
  subscriptionId: ObjectId,
  invoiceNumber: String,
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible',
  total: Number,
  currency: String,
  dueDate: Date,
  paidAt: Date,
  customerName: String,
  customerEmail: String,
  lineItems: Array<LineItem>
}
```

### Payment Schema
```typescript
{
  userId: ObjectId,
  planId: ObjectId,
  amount: Number,
  currency: String,
  paymentMethod: 'paystack' | 'nomba' | 'credit_card' | ...,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  paymentReference: String,
  completedAt: Date,
  metadata: Object
}
```

## Adding New Features

### Adding a New Chart

```typescript
// 1. Add data fetching in hook
const [newData, setNewData] = useState([]);

const fetchNewData = useCallback(async () => {
  const response = await billingService.getNewData();
  if (response.success) setNewData(response.data);
}, []);

// 2. Add chart in component
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={newData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

### Adding a New Filter

```typescript
// 1. Add state
const [newFilter, setNewFilter] = useState('');

// 2. Add filter UI
<FormControl size="small">
  <InputLabel>New Filter</InputLabel>
  <Select
    value={newFilter}
    onChange={(e) => setNewFilter(e.target.value)}
  >
    <MenuItem value="">All</MenuItem>
    <MenuItem value="option1">Option 1</MenuItem>
  </Select>
</FormControl>

// 3. Apply filter
const filtered = data.filter(item => 
  !newFilter || item.field === newFilter
);
```

### Adding a New Action

```typescript
// 1. Add handler
const handleNewAction = async (id: string) => {
  try {
    const response = await billingService.newAction(id);
    if (response.success) {
      await fetchData();
    }
  } catch (error) {
    setError('Action failed');
  }
};

// 2. Add button
<IconButton onClick={() => handleNewAction(item._id)}>
  <NewIcon />
</IconButton>
```

## Styling Guide

### Theme Colors
```typescript
// Primary actions
theme.palette.primary.main

// Success states
theme.palette.success.main

// Warning states
theme.palette.warning.main

// Error states
theme.palette.error.main

// Info states
theme.palette.info.main
```

### Gradient Cards
```typescript
<Card
  sx={{
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: 'white',
  }}
>
  {/* Content */}
</Card>
```

### Status Colors
```typescript
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'active':
      return 'success';
    case 'pending':
    case 'trialing':
      return 'warning';
    case 'failed':
    case 'canceled':
      return 'error';
    default:
      return 'default';
  }
};
```

## Common Tasks

### Debugging API Calls

```typescript
// Add console logs in service
async getSubscriptions() {
  console.log('Fetching subscriptions...');
  const response = await apiClient.get('/subscriptions');
  console.log('Response:', response.data);
  return response.data;
}

// Check network tab in browser DevTools
// Look for /api/billing/* requests
```

### Testing with Mock Data (Development Only)

```typescript
// Temporarily add mock data for testing UI
if (process.env.NODE_ENV === 'development') {
  setAnalytics({
    monthlyRecurringRevenue: 100000,
    // ... other mock data
  });
}
```

### Handling Errors

```typescript
try {
  const response = await billingService.getData();
  if (!response.success) {
    throw new Error(response.message);
  }
  setData(response.data);
} catch (error) {
  console.error('Error:', error);
  setError(error instanceof Error ? error.message : 'Unknown error');
}
```

## Performance Optimization

### Memoization

```typescript
// Memoize expensive calculations
const totalRevenue = useMemo(() => {
  return invoices.reduce((sum, inv) => sum + inv.total, 0);
}, [invoices]);

// Memoize callbacks
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query);
}, []);
```

### Pagination

```typescript
// Always paginate large datasets
const paginatedData = data.slice(
  page * rowsPerPage,
  page * rowsPerPage + rowsPerPage
);
```

### Debouncing

```typescript
// Debounce search input
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchData(debouncedSearch);
  }
}, [debouncedSearch]);
```

## Troubleshooting

### Common Issues

**Issue**: Data not loading
```typescript
// Check:
1. Is user authenticated?
2. Does user have super_admin role?
3. Are API endpoints correct?
4. Check browser console for errors
5. Check network tab for failed requests
```

**Issue**: Charts not rendering
```typescript
// Check:
1. Is data in correct format?
2. Are dataKey props correct?
3. Is ResponsiveContainer wrapping chart?
4. Check console for Recharts errors
```

**Issue**: Pagination not working
```typescript
// Check:
1. Is total count correct?
2. Are page/rowsPerPage states updating?
3. Is slice calculation correct?
4. Check pagination component props
```

## Best Practices

### Code Organization
- Keep components under 500 lines
- Extract reusable logic into hooks
- Use TypeScript for type safety
- Follow consistent naming conventions

### Error Handling
- Always handle API errors
- Show user-friendly error messages
- Log errors for debugging
- Provide fallback UI

### Performance
- Use pagination for large datasets
- Memoize expensive calculations
- Debounce user inputs
- Lazy load heavy components

### Security
- Validate all inputs
- Check user permissions
- Sanitize data before display
- Use HTTPS in production

## Resources

### Documentation
- [MUI Documentation](https://mui.com/)
- [Recharts Documentation](https://recharts.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Tools
- React DevTools
- Redux DevTools (if using Redux)
- Network tab in browser
- MongoDB Compass

## Support

### Getting Help
1. Check this guide
2. Review implementation files
3. Check console errors
4. Review API responses
5. Ask team for help

### Reporting Issues
Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots
- Console errors
- Network requests

---

**Last Updated**: 2025-10-23
**Version**: 1.0.0
**Maintainer**: Development Team
