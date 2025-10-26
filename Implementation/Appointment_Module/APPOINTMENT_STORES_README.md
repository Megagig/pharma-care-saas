# Appointment & Follow-up State Management

This document describes the Zustand stores implemented for the Patient Engagement & Follow-up Management module.

## Overview

Two main stores manage the state for appointments and follow-up tasks:
- **AppointmentStore**: Manages appointment scheduling, calendar views, and appointment data
- **FollowUpStore**: Manages follow-up tasks, priorities, and due date tracking

## Files Structure

```
frontend/src/stores/
├── appointmentTypes.ts       # TypeScript types for appointments
├── followUpTypes.ts          # TypeScript types for follow-up tasks
├── appointmentStore.ts       # Appointment state management
├── followUpStore.ts          # Follow-up task state management
├── __tests__/
│   ├── appointmentStore.test.ts  # Appointment store tests (35 tests)
│   └── followUpStore.test.ts     # Follow-up store tests (33 tests)
└── index.ts                  # Exports all stores
```

## Appointment Store

### State

```typescript
{
  appointments: Appointment[];           // All appointments
  selectedAppointment: Appointment | null;  // Currently selected appointment
  selectedDate: Date;                    // Calendar selected date
  selectedView: 'day' | 'week' | 'month';  // Calendar view mode
  filters: AppointmentFilters;           // Active filters
  availableSlots: AvailableSlot[];       // Available time slots
  summary: AppointmentSummary | null;    // Statistics summary
  loading: LoadingState;                 // Loading states
  errors: ErrorState;                    // Error states
  pagination: PaginationState;           // Pagination info
}
```

### Key Features

#### Calendar Management
- **Date Navigation**: Navigate by day, week, or month
- **View Switching**: Toggle between day/week/month views
- **Go to Today**: Quick navigation to current date

#### Filtering
- Filter by status (scheduled, confirmed, completed, etc.)
- Filter by type (MTM session, health check, etc.)
- Filter by pharmacist or patient
- Filter by date range
- Search functionality

#### Computed Queries
- Get appointments by specific date
- Get appointments by date range
- Get upcoming appointments (next N days)
- Get today's appointments
- Get overdue appointments
- Get appointments by status or type

### Usage Examples

```typescript
import {
  useAppointmentCalendar,
  useAppointmentList,
  useAppointmentFilters,
  useAppointmentQueries,
} from '@/stores';

// Calendar view management
function CalendarView() {
  const { selectedDate, selectedView, setSelectedView, navigateDate, goToToday } =
    useAppointmentCalendar();

  return (
    <div>
      <button onClick={() => navigateDate('prev')}>Previous</button>
      <button onClick={goToToday}>Today</button>
      <button onClick={() => navigateDate('next')}>Next</button>
      <select value={selectedView} onChange={(e) => setSelectedView(e.target.value)}>
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
    </div>
  );
}

// Appointment list with filters
function AppointmentList() {
  const { appointments, loading, pagination } = useAppointmentList();
  const { filters, filterByStatus, filterByType } = useAppointmentFilters();

  return (
    <div>
      <button onClick={() => filterByStatus('scheduled')}>Scheduled</button>
      <button onClick={() => filterByType('mtm_session')}>MTM Sessions</button>
      {loading.fetchAppointments ? (
        <div>Loading...</div>
      ) : (
        appointments.map((appt) => <AppointmentCard key={appt._id} appointment={appt} />)
      )}
    </div>
  );
}

// Dashboard with queries
function Dashboard() {
  const { getTodayAppointments, getUpcomingAppointments, getOverdueAppointments } =
    useAppointmentQueries();

  const today = getTodayAppointments();
  const upcoming = getUpcomingAppointments(7); // Next 7 days
  const overdue = getOverdueAppointments();

  return (
    <div>
      <div>Today: {today.length} appointments</div>
      <div>Upcoming: {upcoming.length} appointments</div>
      <div>Overdue: {overdue.length} appointments</div>
    </div>
  );
}
```

## Follow-up Store

### State

```typescript
{
  tasks: FollowUpTask[];                 // All follow-up tasks
  selectedTask: FollowUpTask | null;     // Currently selected task
  filters: FollowUpFilters;              // Active filters
  summary: FollowUpSummary | null;       // Statistics summary
  loading: LoadingState;                 // Loading states
  errors: ErrorState;                    // Error states
  pagination: PaginationState;           // Pagination info
}
```

### Key Features

#### Task Management
- Add, update, and remove tasks
- Task selection
- Priority-based sorting

#### Filtering
- Filter by status (pending, in_progress, completed, etc.)
- Filter by priority (low, medium, high, urgent, critical)
- Filter by type (medication follow-up, adherence check, etc.)
- Filter by pharmacist or patient
- Filter by overdue status
- Filter by due date range

#### Computed Queries
- Get overdue tasks (sorted by priority)
- Get tasks due today
- Get tasks due this week
- Get tasks by priority, status, or type
- Get high priority tasks (urgent, high, critical)
- Get pending tasks (pending or in_progress)

### Usage Examples

```typescript
import {
  useFollowUpList,
  useFollowUpFilters,
  useFollowUpQueries,
} from '@/stores';

// Task list with filters
function FollowUpTaskList() {
  const { tasks, loading, summary } = useFollowUpList();
  const { filterByPriority, filterByStatus, filterByOverdue } = useFollowUpFilters();

  return (
    <div>
      <div>
        <button onClick={() => filterByPriority('high')}>High Priority</button>
        <button onClick={() => filterByStatus('pending')}>Pending</button>
        <button onClick={() => filterByOverdue(true)}>Overdue</button>
      </div>
      {summary && (
        <div>
          <div>Total: {summary.total}</div>
          <div>Overdue: {summary.overdue}</div>
          <div>Due Today: {summary.dueToday}</div>
        </div>
      )}
      {tasks.map((task) => (
        <TaskCard key={task._id} task={task} />
      ))}
    </div>
  );
}

// Dashboard with queries
function FollowUpDashboard() {
  const {
    getOverdueTasks,
    getDueTodayTasks,
    getDueThisWeekTasks,
    getHighPriorityTasks,
  } = useFollowUpQueries();

  const overdue = getOverdueTasks();
  const dueToday = getDueTodayTasks();
  const dueThisWeek = getDueThisWeekTasks();
  const highPriority = getHighPriorityTasks();

  return (
    <div>
      <div className="alert">Overdue: {overdue.length}</div>
      <div>Due Today: {dueToday.length}</div>
      <div>Due This Week: {dueThisWeek.length}</div>
      <div>High Priority: {highPriority.length}</div>
    </div>
  );
}
```

## State Persistence

Both stores use Zustand's persist middleware to save state across sessions:

### Appointment Store Persists:
- `selectedDate`
- `selectedView`
- `filters`
- `selectedAppointment`

### Follow-up Store Persists:
- `filters`
- `selectedTask`

## Testing

Comprehensive test suites ensure store reliability:

### Appointment Store Tests (35 tests)
- Initial state verification
- Calendar view actions
- Selection actions
- Filter actions (all types)
- Pagination actions
- Local state management
- Computed getters
- Loading and error states

### Follow-up Store Tests (33 tests)
- Initial state verification
- Selection actions
- Filter actions (all types)
- Pagination actions
- Local state management
- Computed getters (with priority sorting)
- Loading and error states

Run tests:
```bash
npm run test -- --run src/stores/__tests__/appointmentStore.test.ts src/stores/__tests__/followUpStore.test.ts
```

## Integration with React Query

These stores are designed to work alongside React Query hooks (to be implemented in task 17-18):

```typescript
// Example integration pattern
function AppointmentCalendar() {
  // Store manages UI state
  const { selectedDate, selectedView } = useAppointmentCalendar();
  const { filters } = useAppointmentFilters();
  const { setAppointments, setSummary } = useAppointmentActions();

  // React Query manages server state
  const { data, isLoading } = useAppointments(filters);

  // Sync server data to store
  useEffect(() => {
    if (data?.appointments) {
      setAppointments(data.appointments);
      setSummary(data.summary);
    }
  }, [data]);

  // Component logic...
}
```

## Best Practices

1. **Use Selector Hooks**: Import specific selector hooks instead of the main store for better performance
2. **Computed Getters**: Use computed getters for derived state instead of filtering in components
3. **Loading States**: Always check loading states before rendering data
4. **Error Handling**: Display errors from the error state to users
5. **Pagination**: Use pagination for large datasets
6. **Filters**: Reset page to 1 when changing filters

## Next Steps

- Task 17: Create React Query hooks for appointments
- Task 18: Create React Query hooks for follow-ups
- Task 19: Build AppointmentCalendar component
- Task 20: Build CreateAppointmentDialog component

## Requirements Satisfied

- ✅ Requirement 1.1: Unified appointment scheduling system
- ✅ Requirement 1.3: Calendar display in day/week/month views
- ✅ Requirement 3.1: Automated follow-up management
- ✅ Requirement 10.1: Mobile responsiveness state management
