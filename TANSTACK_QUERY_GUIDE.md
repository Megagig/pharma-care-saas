# TanStack Query Integration Guide

This guide provides comprehensive information on using TanStack Query alongside Zustand in the PharmaCare SaaS application.

## Overview

TanStack Query (formerly React Query) has been successfully integrated to handle server state management, working alongside Zustand for client state. This hybrid approach provides:

- **Zustand**: Client state management (UI state, user preferences, etc.)
- **TanStack Query**: Server state management (API data, caching, synchronization)

## Architecture

### Query Client Configuration

The query client is configured with optimized defaults in `src/lib/queryClient.ts`:

```typescript
// Optimized caching and retry configuration
staleTime: 5 * 60 * 1000,      // 5 minutes
gcTime: 10 * 60 * 1000,        // 10 minutes
retry: 3,                       // Retry failed requests 3 times
refetchOnWindowFocus: false,    // Prevent unnecessary refetches
```

### Query Keys Factory

Centralized query key management ensures consistency and easier cache invalidation:

```typescript
export const queryKeys = {
   patients: {
      all: ['patients'],
      list: (filters) => [...queryKeys.patients.all, 'list', { filters }],
      detail: (id) => [...queryKeys.patients.all, 'detail', id],
   },
   // ... similar patterns for medications and clinical notes
};
```

## Available Hooks

### Patient Hooks (`src/queries/usePatients.ts`)

#### Query Hooks

- `usePatients(filters?)` - Fetch all patients with optional filtering
- `usePatient(patientId)` - Fetch single patient by ID
- `useSearchPatients(searchQuery)` - Search patients (min 2 characters)
- `usePatientMedications(patientId)` - Fetch patient's medications
- `usePatientNotes(patientId)` - Fetch patient's clinical notes

#### Mutation Hooks

- `useCreatePatient()` - Create new patient
- `useUpdatePatient()` - Update patient information
- `useDeletePatient()` - Delete patient

### Medication Hooks (`src/queries/useMedications.ts`)

#### Query Hooks

- `useMedications(filters?)` - Fetch all medications with optional filtering
- `useMedication(medicationId)` - Fetch single medication by ID
- `useMedicationsByPatient(patientId)` - Fetch medications for specific patient

#### Mutation Hooks

- `useCreateMedication()` - Create new medication
- `useUpdateMedication()` - Update medication information
- `useUpdateMedicationStatus()` - Update medication status (with optimistic updates)
- `useDeleteMedication()` - Delete medication

### Clinical Notes Hooks (`src/queries/useClinicalNotes.ts`)

#### Query Hooks

- `useClinicalNotes(filters?)` - Fetch all clinical notes with optional filtering
- `useClinicalNote(noteId)` - Fetch single clinical note by ID
- `useClinicalNotesByPatient(patientId)` - Fetch notes for specific patient
- `useSearchClinicalNotes(searchQuery)` - Search clinical notes

#### Mutation Hooks

- `useCreateClinicalNote()` - Create new clinical note
- `useUpdateClinicalNote()` - Update clinical note
- `useToggleNotePrivacy()` - Toggle note privacy status (with optimistic updates)
- `useDeleteClinicalNote()` - Delete clinical note

## Usage Examples

### Basic Query Usage

```typescript
import { usePatients, useCreatePatient } from '../queries/usePatients';

const PatientsPage = () => {
  // Fetch patients with loading and error states
  const { data: patients, isLoading, error } = usePatients();

  // Create patient mutation
  const createPatientMutation = useCreatePatient();

  const handleCreatePatient = async (patientData) => {
    try {
      await createPatientMutation.mutateAsync(patientData);
      // Success notification handled automatically
    } catch (error) {
      // Error notification handled automatically
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {patients?.map(patient => (
        <div key={patient.id}>{patient.name}</div>
      ))}
    </div>
  );
};
```

### Optimistic Updates Example

```typescript
import { useUpdateMedicationStatus } from '../queries/useMedications';

const MedicationStatusButton = ({ medication }) => {
  const updateStatusMutation = useUpdateMedicationStatus();

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({
      medicationId: medication.id,
      status: newStatus
    });
    // UI updates immediately, rolls back on error
  };

  return (
    <button
      onClick={() => handleStatusChange('active')}
      disabled={updateStatusMutation.isLoading}
    >
      {updateStatusMutation.isLoading ? 'Updating...' : 'Activate'}
    </button>
  );
};
```

### Advanced Filtering and Search

```typescript
import { usePatients, useSearchPatients } from '../queries/usePatients';

const PatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'active' });

  // Regular filtered query
  const { data: allPatients } = usePatients(filters);

  // Search query (only runs when searchTerm has 2+ characters)
  const { data: searchResults } = useSearchPatients(searchTerm);

  const displayData = searchTerm.length >= 2 ? searchResults : allPatients;

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search patients..."
      />
      {/* Render displayData */}
    </div>
  );
};
```

## Migration Patterns

### From Zustand to TanStack Query

If you want to migrate existing Zustand server state to TanStack Query:

#### Before (Zustand)

```typescript
// In component
const { patients, loading, fetchPatients } = usePatientManagement();

useEffect(() => {
   fetchPatients();
}, []);
```

#### After (TanStack Query)

```typescript
// In component
const { data: patients, isLoading } = usePatients();
// No useEffect needed - automatic fetching and caching
```

### Hybrid Usage

You can use both systems simultaneously:

```typescript
const MyComponent = () => {
  // TanStack Query for server state
  const { data: patients } = usePatients();

  // Zustand for client state
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const addNotification = useUIStore(state => state.addNotification);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

## Key Features

### Automatic Cache Management

- Data is automatically cached and shared across components
- Smart background refetching keeps data fresh
- Stale data is served immediately while fresh data loads

### Built-in Loading States

```typescript
const { data, isLoading, isFetching, error } = usePatients();

// isLoading: true only on first load
// isFetching: true whenever data is being fetched (including background)
// error: any error that occurred
```

### Optimistic Updates

Status changes and other quick updates happen instantly in the UI, with automatic rollback on failure:

```typescript
const mutation = useUpdateMedicationStatus();
// UI updates immediately, server syncs in background
```

### Smart Invalidation

When data changes, related queries are automatically invalidated:

```typescript
// Creating a patient invalidates the patients list
// Updating a patient invalidates both the patient detail and patients list
// Patient-specific queries are invalidated when the patient changes
```

### Error Handling

All mutations include automatic error handling with notifications:

```typescript
// Errors are automatically shown as notifications
// No need for manual error handling in most cases
const mutation = useCreatePatient();
```

## Best Practices

### 1. Use Enabled Queries for Conditional Fetching

```typescript
const { data } = usePatient(patientId, {
   enabled: !!patientId, // Only fetch when patientId exists
});
```

### 2. Leverage Select for Data Transformation

```typescript
const { data: patientNames } = usePatients({
   select: (data) => data.map((patient) => patient.name),
});
```

### 3. Use Query Keys Consistently

```typescript
// Always use the query keys factory
import { queryKeys } from '../lib/queryClient';

// Good
queryKey: queryKeys.patients.detail(id);

// Avoid
queryKey: ['patients', id];
```

### 4. Handle Loading States Appropriately

```typescript
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

## Development Tools

React Query DevTools are available in development mode:

- Press the TanStack Query logo in the bottom-left corner
- Inspect queries, mutations, and cache state
- Monitor network requests and cache invalidations

## Service Layer

API services are located in `src/services/`:

- `patientService.ts` - Patient API operations
- `medicationService.ts` - Medication API operations
- `clinicalNoteService.ts` - Clinical notes API operations

All services include:

- Automatic authentication token handling
- Consistent error handling
- TypeScript support

## Integration with Existing Code

TanStack Query is designed to work alongside your existing Zustand stores:

- Keep UI state in Zustand (modals, sidebar, theme, notifications)
- Move server state to TanStack Query (patients, medications, notes)
- Use both in the same components as needed

The existing notification system from Zustand is automatically integrated with TanStack Query mutations for seamless user feedback.

## Next Steps

1. **Start using query hooks** in your components instead of Zustand for server data
2. **Gradually migrate** existing server state from Zustand to TanStack Query
3. **Take advantage** of automatic caching and background synchronization
4. **Use optimistic updates** for better user experience
5. **Monitor performance** with React Query DevTools

The setup is complete and ready to use immediately. Your existing application will continue to work unchanged while you can start adopting TanStack Query incrementally.
