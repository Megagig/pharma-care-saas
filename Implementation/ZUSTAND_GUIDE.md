# Zustand State Management Guide

This document provides a comprehensive guide on how to use Zustand state management in the PharmaCare SaaS application.

## Overview

Zustand is a lightweight state management solution that provides a simple and flexible way to manage global state in React applications. This project uses Zustand to manage different domains of state including patients, medications, clinical notes, and UI state.

## Project Structure

```
frontend/src/stores/
├── index.ts              # Main store composition and exports
├── types.ts              # TypeScript types and interfaces
├── hooks.ts              # Custom hooks for enhanced functionality
├── uiStore.ts           # Global UI state (theme, modals, notifications)
├── patientStore.ts      # Patient management state
├── medicationStore.ts   # Medication management state
└── clinicalNoteStore.ts # Clinical notes management state
```

## Store Architecture

### 1. UI Store (`uiStore.ts`)
Manages global UI state including:
- Notifications and alerts
- Modal states
- Loading states
- Sidebar visibility
- Theme preferences

**Key Features:**
- Persistent theme and sidebar preferences
- Auto-dismissing notifications
- Centralized modal management
- Global loading state coordination

### 2. Patient Store (`patientStore.ts`)
Handles all patient-related state and operations:
- Patient CRUD operations
- Search and filtering
- Pagination
- Patient selection

**Key Features:**
- Optimistic updates
- Error handling
- Bulk operations
- Local state synchronization

### 3. Medication Store (`medicationStore.ts`)
Manages medication data and operations:
- Medication CRUD operations
- Status management (active, completed, discontinued)
- Patient-specific filtering
- Analytics and insights

### 4. Clinical Note Store (`clinicalNoteStore.ts`)
Handles clinical notes management:
- Note CRUD operations
- Privacy controls
- Tag management
- Type-based filtering

## Usage Examples

### Basic Store Usage

```typescript
import { usePatients, useNotifications } from '../stores';

const MyComponent = () => {
  const { patients, loading, fetchPatients } = usePatients();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSuccess = () => {
    addNotification({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully',
      duration: 5000,
    });
  };

  return (
    <div>
      {loading ? 'Loading...' : patients.map(patient => ...)}
    </div>
  );
};
```

### Enhanced Hooks Usage

```typescript
import { usePatientManagement, useDashboardData } from '../stores/hooks';

const Dashboard = () => {
  const dashboardData = useDashboardData();
  const { createPatient, deletePatient } = usePatientManagement();

  const handleCreatePatient = async (data) => {
    const result = await createPatient(data);
    if (result) {
      // Success notification is automatically handled
      console.log('Patient created:', result);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Total Patients: {dashboardData.totalPatients}</p>
      <p>Active Medications: {dashboardData.activeMedications}</p>
      {/* ... */}
    </div>
  );
};
```

### UI Store Usage

```typescript
import { useModals, useTheme, useNotifications } from '../stores';

const MyComponent = () => {
  const { modals, openModal, closeModal } = useModals();
  const { theme, toggleTheme } = useTheme();
  const { addNotification } = useNotifications();

  const handleOpenDialog = () => {
    openModal('confirmDialog');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    addNotification({
      type: 'info',
      title: 'Theme Changed',
      message: `Switched to ${theme === 'light' ? 'dark' : 'light'} mode`,
    });
  };

  return (
    <div>
      <button onClick={handleOpenDialog}>Open Dialog</button>
      <button onClick={handleThemeToggle}>Toggle Theme</button>
      {modals.confirmDialog && <Dialog>...</Dialog>}
    </div>
  );
};
```

## Available Hooks

### Core Store Hooks
- `useUIStore` - Full UI store access
- `usePatientStore` - Full patient store access
- `useMedicationStore` - Full medication store access
- `useClinicalNoteStore` - Full clinical note store access

### Specialized Hooks
- `useNotifications` - Notification management
- `useModals` - Modal state management
- `useTheme` - Theme management
- `useSidebar` - Sidebar state management

### Enhanced Functionality Hooks
- `usePatientManagement` - Enhanced patient operations with notifications
- `useMedicationManagement` - Enhanced medication operations
- `useClinicalNoteManagement` - Enhanced note operations
- `useDashboardData` - Aggregated dashboard data
- `useGlobalSearch` - Search across all stores
- `useErrorManagement` - Centralized error handling
- `useLoadingStates` - Loading state management
- `useDataSync` - Data synchronization

## Best Practices

### 1. Use Specialized Hooks
Instead of accessing stores directly, use the specialized hooks:

```typescript
// ✅ Good
const { patients, loading } = usePatients();

// ❌ Avoid
const patients = usePatientStore(state => state.patients);
const loading = usePatientStore(state => state.loading.fetchPatients);
```

### 2. Use Enhanced Hooks for Operations
Enhanced hooks provide automatic notifications and error handling:

```typescript
// ✅ Good - Automatic notifications
const { createPatient } = usePatientManagement();

// ❌ Basic - Manual notification handling
const createPatient = usePatientStore(state => state.createPatient);
```

### 3. Handle Loading States
Always handle loading states for better UX:

```typescript
const { patients, loading, error } = usePatients();

if (loading) return <Loading />;
if (error) return <Error message={error} />;
return <PatientList patients={patients} />;
```

### 4. Use Error Management
Utilize the centralized error management:

```typescript
const { allErrors, hasErrors, clearAllErrors } = useErrorManagement();

useEffect(() => {
  if (hasErrors) {
    console.error('Store errors:', allErrors);
  }
}, [hasErrors, allErrors]);
```

## Persistence

The following data is automatically persisted to localStorage:
- UI preferences (theme, sidebar state)
- Current filters and search terms
- Selected items (patients, medications, notes)

## Integration with Existing Code

The Zustand stores are designed to work alongside the existing React Context API for authentication. The AuthContext remains unchanged, while Zustand handles all other state management needs.

### App Initialization

The stores are automatically initialized in `App.tsx`:

```typescript
import { initializeStores } from './stores';

function App() {
  useEffect(() => {
    initializeStores();
  }, []);
  // ...
}
```

## Store Composition

All stores are composed in `stores/index.ts` for easy importing:

```typescript
// Single import for all store functionality
import { 
  usePatients, 
  useNotifications, 
  useDashboardData 
} from '../stores';
```

## Error Handling

Each store includes comprehensive error handling:
- Network errors are caught and stored
- User-friendly error messages
- Automatic error clearing
- Error notifications through UI store

## Performance Considerations

- Stores use shallow comparisons for optimal re-renders
- Persistence is selective to avoid localStorage bloat
- Bulk operations are optimized for performance
- Local state updates for immediate UI feedback

## Migration Guide

To migrate existing components to use Zustand:

1. Replace useState hooks with store hooks
2. Remove prop drilling by accessing stores directly
3. Use enhanced hooks for automatic notifications
4. Update error handling to use centralized system

## Testing

Zustand stores can be easily tested by accessing store state directly:

```typescript
import { usePatientStore } from '../stores';

test('should add patient', () => {
  const { addPatientToState } = usePatientStore.getState();
  addPatientToState(mockPatient);
  
  const { patients } = usePatientStore.getState();
  expect(patients).toContain(mockPatient);
});
```

## Debugging

Use the store status utility for debugging:

```typescript
import { getStoreStatus } from '../stores';

console.log('Store status:', getStoreStatus());
```

This provides information about persisted data and store health.

## Future Enhancements

Potential future improvements:
- Add middleware for logging and debugging
- Implement optimistic updates for better UX
- Add real-time synchronization with WebSockets
- Implement store-level caching strategies
- Add data validation middleware

## Conclusion

This Zustand setup provides a robust, scalable state management solution for the PharmaCare SaaS application. It offers type safety, persistence, error handling, and a clean API for managing complex application state while maintaining excellent performance and developer experience.