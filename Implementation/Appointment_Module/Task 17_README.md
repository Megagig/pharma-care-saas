# Appointment React Query Hooks

This module provides comprehensive React Query hooks for managing appointments in the Patient Engagement & Follow-up Management system. The hooks integrate seamlessly with the Zustand appointment store and provide optimistic updates, caching, and error handling.

## Overview

The appointment hooks follow React Query best practices and provide:

- **Consistent caching** with structured query keys
- **Optimistic updates** for better UX
- **Error handling** with retry logic
- **Store integration** with Zustand appointment store
- **Type safety** with TypeScript
- **Comprehensive testing** with Vitest

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Components                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                React Query Hooks                               │
│  • useAppointments          • useCreateAppointment             │
│  • useAppointmentCalendar   • useUpdateAppointmentStatus       │
│  • useAppointment           • useRescheduleAppointment         │
│  • useAvailableSlots        • useCancelAppointment             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 Appointment Service                             │
│  • API communication       • Error handling                    │
│  • Request/Response mapping • Authentication                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 Zustand Store                                   │
│  • Local state management  • Optimistic updates                │
│  • UI state (filters, etc) • Cache synchronization             │
└─────────────────────────────────────────────────────────────────┘
```

## Query Hooks

### useAppointments(filters)

Fetches a paginated list of appointments with filtering support.

```typescript
import { useAppointments } from '../hooks/useAppointments';

const MyComponent = () => {
  const { data, isLoading, error } = useAppointments({
    status: 'scheduled',
    patientId: 'patient-123',
    startDate: new Date('2025-10-01'),
    endDate: new Date('2025-10-31'),
    page: 1,
    limit: 50,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.results.map(appointment => (
        <div key={appointment._id}>{appointment.title}</div>
      ))}
    </div>
  );
};
```

**Features:**
- Automatic store synchronization
- 5-minute stale time
- Smart retry logic (no retry on 4xx errors)
- Loading and error state management

### useAppointmentCalendar(params)

Fetches appointments for calendar view with date-based filtering.

```typescript
import { useAppointmentCalendar } from '../hooks/useAppointments';

const CalendarComponent = () => {
  const { data, isLoading } = useAppointmentCalendar({
    view: 'week',
    date: '2025-10-26',
    pharmacistId: 'pharmacist-123',
    locationId: 'location-456',
  });

  return (
    <Calendar 
      appointments={data?.data.appointments || []}
      loading={isLoading}
    />
  );
};
```

**Features:**
- 2-minute stale time for fresh calendar data
- Refetch on window focus
- Automatic store updates

### useAppointment(appointmentId, enabled)

Fetches detailed information for a single appointment.

```typescript
import { useAppointment } from '../hooks/useAppointments';

const AppointmentDetail = ({ appointmentId }) => {
  const { data, isLoading } = useAppointment(appointmentId);

  return (
    <div>
      <h1>{data?.data.appointment.title}</h1>
      <p>Patient: {data?.data.patient.firstName} {data?.data.patient.lastName}</p>
      <p>Pharmacist: {data?.data.assignedPharmacist.firstName}</p>
    </div>
  );
};
```

**Features:**
- Conditional fetching with `enabled` parameter
- Automatic store selection updates
- Related data (patient, pharmacist, records)

### useAvailableSlots(params, enabled)

Fetches available time slots for appointment scheduling.

```typescript
import { useAvailableSlots } from '../hooks/useAppointments';

const SlotPicker = ({ date, pharmacistId }) => {
  const { data, isLoading } = useAvailableSlots({
    date,
    pharmacistId,
    duration: 30,
    type: 'mtm_session',
  });

  return (
    <div>
      {data?.data.slots.map(slot => (
        <button 
          key={slot.time}
          disabled={!slot.available}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
};
```

**Features:**
- 1-minute stale time for real-time availability
- Store integration for slot management
- Conditional fetching

## Mutation Hooks

### useCreateAppointment()

Creates new appointments with optimistic updates.

```typescript
import { useCreateAppointment } from '../hooks/useAppointments';

const CreateAppointmentForm = () => {
  const createAppointment = useCreateAppointment();

  const handleSubmit = (formData) => {
    createAppointment.mutate({
      patientId: 'patient-123',
      type: 'mtm_session',
      scheduledDate: new Date('2025-10-26'),
      scheduledTime: '10:00',
      duration: 30,
      description: 'MTM Session',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button 
        type="submit" 
        disabled={createAppointment.isPending}
      >
        {createAppointment.isPending ? 'Creating...' : 'Create Appointment'}
      </button>
    </form>
  );
};
```

**Features:**
- Optimistic updates with temporary appointment
- Automatic cache invalidation
- Error rollback
- Store synchronization

### useUpdateAppointmentStatus()

Updates appointment status with optimistic updates.

```typescript
import { useUpdateAppointmentStatus } from '../hooks/useAppointments';

const AppointmentActions = ({ appointmentId }) => {
  const updateStatus = useUpdateAppointmentStatus();

  const handleConfirm = () => {
    updateStatus.mutate({
      appointmentId,
      statusData: { status: 'confirmed' }
    });
  };

  const handleComplete = () => {
    updateStatus.mutate({
      appointmentId,
      statusData: {
        status: 'completed',
        outcome: {
          status: 'successful',
          notes: 'Session completed successfully',
          nextActions: ['Schedule follow-up'],
          visitCreated: true,
        }
      }
    });
  };

  return (
    <div>
      <button onClick={handleConfirm}>Confirm</button>
      <button onClick={handleComplete}>Complete</button>
    </div>
  );
};
```

### useRescheduleAppointment()

Reschedules appointments with optimistic updates.

```typescript
import { useRescheduleAppointment } from '../hooks/useAppointments';

const RescheduleDialog = ({ appointmentId }) => {
  const reschedule = useRescheduleAppointment();

  const handleReschedule = (newDate, newTime, reason) => {
    reschedule.mutate({
      appointmentId,
      rescheduleData: {
        newDate,
        newTime,
        reason,
        notifyPatient: true,
      }
    });
  };

  return (
    <div>
      {/* reschedule form */}
    </div>
  );
};
```

### useCancelAppointment()

Cancels appointments with support for recurring series.

```typescript
import { useCancelAppointment } from '../hooks/useAppointments';

const CancelDialog = ({ appointmentId, isRecurring }) => {
  const cancel = useCancelAppointment();

  const handleCancel = (reason, cancelType) => {
    cancel.mutate({
      appointmentId,
      cancelData: {
        reason,
        notifyPatient: true,
        cancelType: isRecurring ? cancelType : 'this_only',
      }
    });
  };

  return (
    <div>
      {/* cancel form */}
    </div>
  );
};
```

## Query Keys

The hooks use a structured query key system for consistent caching:

```typescript
export const appointmentKeys = {
  all: ['appointments'],
  lists: () => [...appointmentKeys.all, 'list'],
  list: (filters) => [...appointmentKeys.lists(), filters],
  details: () => [...appointmentKeys.all, 'detail'],
  detail: (id) => [...appointmentKeys.details(), id],
  calendar: () => [...appointmentKeys.all, 'calendar'],
  calendarView: (params) => [...appointmentKeys.calendar(), params],
  patient: (patientId) => [...appointmentKeys.all, 'patient', patientId],
  upcoming: (params) => [...appointmentKeys.all, 'upcoming', params],
  availableSlots: (params) => [...appointmentKeys.all, 'slots', params],
};
```

## Utility Hooks

### usePrefetchAppointment()

Prefetches appointment data for better UX.

```typescript
import { usePrefetchAppointment } from '../hooks/useAppointments';

const AppointmentList = ({ appointments }) => {
  const prefetchAppointment = usePrefetchAppointment();

  return (
    <div>
      {appointments.map(appointment => (
        <div 
          key={appointment._id}
          onMouseEnter={() => prefetchAppointment(appointment._id)}
        >
          {appointment.title}
        </div>
      ))}
    </div>
  );
};
```

### useInvalidateAppointments()

Provides methods to invalidate specific appointment queries.

```typescript
import { useInvalidateAppointments } from '../hooks/useAppointments';

const RefreshButton = () => {
  const invalidate = useInvalidateAppointments();

  return (
    <button onClick={() => invalidate.invalidateAll()}>
      Refresh All
    </button>
  );
};
```

## Error Handling

The hooks implement comprehensive error handling:

- **4xx errors**: No retry (client errors)
- **5xx errors**: Retry up to 3 times with exponential backoff
- **Network errors**: Retry with backoff
- **Store integration**: Error states synchronized with Zustand store

## Optimistic Updates

All mutation hooks implement optimistic updates:

1. **onMutate**: Update local state immediately
2. **onSuccess**: Replace with server response
3. **onError**: Revert to previous state
4. **onSettled**: Clean up loading states

## Store Integration

The hooks integrate seamlessly with the Zustand appointment store:

- **Query hooks**: Update store with fetched data
- **Mutation hooks**: Perform optimistic updates
- **Error handling**: Sync error states
- **Loading states**: Manage loading indicators

## Testing

Comprehensive tests cover:

- **Query functionality**: Data fetching and caching
- **Mutation functionality**: CRUD operations
- **Optimistic updates**: State management
- **Error handling**: Error scenarios
- **Store integration**: State synchronization

Run tests:
```bash
npm test -- hooks/__tests__/useAppointments.test.ts
```

## Best Practices

1. **Use query keys consistently** for proper cache invalidation
2. **Handle loading and error states** in components
3. **Leverage optimistic updates** for better UX
4. **Prefetch data** when possible
5. **Invalidate related queries** after mutations
6. **Use conditional fetching** with `enabled` parameter
7. **Handle offline scenarios** with proper error boundaries

## Integration Example

Complete example showing integration with components:

```typescript
import React from 'react';
import { 
  useAppointments, 
  useCreateAppointment,
  useUpdateAppointmentStatus 
} from '../hooks/useAppointments';
import { useAppointmentFilters } from '../stores/appointmentStore';

const AppointmentDashboard = () => {
  const { filters } = useAppointmentFilters();
  const { data, isLoading, error } = useAppointments(filters);
  const createAppointment = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus();

  const handleCreateAppointment = (appointmentData) => {
    createAppointment.mutate(appointmentData, {
      onSuccess: () => {
        // Handle success (e.g., show notification, close dialog)
      },
      onError: (error) => {
        // Handle error (e.g., show error message)
      }
    });
  };

  const handleStatusUpdate = (appointmentId, status) => {
    updateStatus.mutate({
      appointmentId,
      statusData: { status }
    });
  };

  if (isLoading) return <div>Loading appointments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Appointments</h1>
      {data?.data.results.map(appointment => (
        <div key={appointment._id}>
          <h3>{appointment.title}</h3>
          <p>Status: {appointment.status}</p>
          <button 
            onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
            disabled={updateStatus.isPending}
          >
            Confirm
          </button>
        </div>
      ))}
      
      <button 
        onClick={() => handleCreateAppointment({
          patientId: 'patient-123',
          type: 'mtm_session',
          scheduledDate: new Date(),
          scheduledTime: '10:00',
          duration: 30,
        })}
        disabled={createAppointment.isPending}
      >
        Create Appointment
      </button>
    </div>
  );
};

export default AppointmentDashboard;
```

This implementation provides a robust, type-safe, and user-friendly way to manage appointments in the PharmacyCopilot application.