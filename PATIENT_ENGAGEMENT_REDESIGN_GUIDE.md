# Patient Engagement Pages Redesign - Implementation Guide

## Overview
This guide documents the redesign of the Patient Engagement, Appointments, and Follow-ups pages with modern UI and comprehensive API integration.

## Completed Work

### 1. Patient Engagement Page (`frontend/src/pages/PatientEngagement.tsx`)
**Status:** ✅ COMPLETED

**Features Implemented:**
- Modern gradient stat cards showing:
  - Today's appointments
  - Upcoming scheduled appointments
  - Pending follow-up tasks
  - Overdue tasks
- Animated components using Framer Motion
- Refresh functionality with visual feedback
- Notification badge for overdue tasks
- Responsive appointment calendar
- Follow-up task list integration
- Quick analytics dashboard
- Professional card layouts with:
  - Gradient backgrounds
  - Avatar icons
  - Hover animations
  - Subtle borders and shadows

**API Integration:**
- Uses `useAppointments()` hook to fetch appointment data
- Uses `useFollowUpTasks()` hook to fetch follow-up data
- Real-time stat calculations based on fetched data

### 2. Appointments Page (`frontend/src/pages/AppointmentManagement.tsx`)
**Status:** ⏳ NEEDS TO BE CREATED

**Required Features:**
- Modern stat cards for:
  - Today's appointments
  - Completed appointments today
  - Upcoming appointments this week
- Full-featured responsive appointment calendar
- Comprehensive analytics dashboard
- Pharmacist schedule management view
- Capacity utilization chart
- Reminder effectiveness chart
- "New Appointment" button with create dialog
- Refresh and notification functionality

### 3. Follow-ups Page (`frontend/src/pages/FollowUpManagement.tsx`)
**Status:** ⏳ NEEDS TO BE REDESIGNED

**Required Features:**
- Modern stat cards for:
  - Total pending tasks
  - Overdue tasks
  - Due today
  - Completed this week
- Responsive follow-up task list
- Follow-up analytics dashboard
- Task filtering and search
- Priority indicators with color coding
- Quick action buttons (Complete, Convert to Appointment, Escalate)
- Task creation dialog

## Backend API Status

### Appointment APIs (`backend/src/controllers/appointmentController.ts`)
**Status:** ⚠️ PLACEHOLDER IMPLEMENTATIONS ONLY

**Endpoints Needing Implementation:**

1. **GET /api/appointments/calendar**
   - Fetch appointments for calendar view
   - Support filtering by date range, pharmacist, location
   - Return appointments with patient and pharmacist details
   
2. **GET /api/appointments/available-slots**
   - Calculate available time slots for booking
   - Consider pharmacist schedules and existing appointments
   - Support duration and type filters

3. **POST /api/appointments**
   - Create new appointment with validation
   - Send notifications/reminders
   - Handle recurring appointments

4. **GET /api/appointments/:id**
   - Fetch single appointment with full details
   - Include related records (patient, pharmacist, etc.)

5. **PUT /api/appointments/:id**
   - Update appointment details
   - Handle recurring appointment updates
   - Send update notifications

6. **PATCH /api/appointments/:id/status**
   - Update appointment status (scheduled, completed, cancelled, no-show)
   - Trigger appropriate workflows

7. **POST /api/appointments/:id/reschedule**
   - Reschedule appointment to new date/time
   - Handle conflicts and notifications

8. **DELETE /api/appointments/:id**
   - Cancel appointment
   - Handle recurring cancellations
   - Send cancellation notifications

### Follow-up APIs (`backend/src/controllers/followUpController.ts`)
**Status:** ⚠️ PLACEHOLDER IMPLEMENTATIONS ONLY

**Endpoints Needing Implementation:**

1. **GET /api/follow-ups**
   - Fetch follow-up tasks with filtering
   - Support status, priority, patient, pharmacist filters
   - Include pagination and sorting
   - Calculate summary statistics

2. **POST /api/follow-ups**
   - Create new follow-up task
   - Validate objectives and due dates
   - Set up reminders

3. **GET /api/follow-ups/:id**
   - Fetch single task with full details
   - Include patient and pharmacist info
   - Show related records

4. **PUT /api/follow-ups/:id**
   - Update follow-up task details
   - Validate changes
   - Send update notifications

5. **POST /api/follow-ups/:id/complete**
   - Mark task as completed
   - Record outcome and notes
   - Trigger next actions

6. **POST /api/follow-ups/:id/convert-to-appointment**
   - Convert follow-up task to appointment
   - Create appointment record
   - Update task status

7. **GET /api/follow-ups/overdue**
   - Fetch overdue tasks
   - Prioritize by urgency
   - Include summary stats

8. **POST /api/follow-ups/:id/escalate**
   - Escalate task priority
   - Send notifications to managers
   - Log escalation reason

## Implementation Steps

### Step 1: Complete Frontend Pages

#### Create Modern Appointments Page
```bash
# Create file: frontend/src/pages/AppointmentManagement.tsx
```

**Required Imports:**
- React hooks (useState, useEffect)
- MUI components (Box, Typography, Grid, Card, etc.)
- Icons from @mui/icons-material
- Framer Motion for animations
- Date-fns for date formatting
- Custom hooks (useAppointments, useAuth)
- Components (ResponsiveAppointmentCalendar, AppointmentAnalyticsDashboard, etc.)

**Key Features:**
- Animated stat cards with gradients
- Full-width calendar section
- Analytics dashboard (8 columns)
- Pharmacist schedule view (4 columns)
- Two chart cards (6 columns each)
- Refresh functionality
- "New Appointment" CTA button

#### Redesign Follow-ups Page
```bash
# Update file: frontend/src/pages/FollowUpManagement.tsx
```

**Required Updates:**
- Add animated stat cards
- Modern header with gradient title
- Task list with better visual hierarchy
- Analytics section with charts
- Action buttons with icons
- Refresh and filter functionality

### Step 2: Implement Backend Controllers

#### Appointments Controller Implementation

**Required Models/Services:**
```typescript
// Create/update models
- Appointment model with schema
- PatientSchedule model
- PharmacistSchedule model

// Create services
- AppointmentService for business logic
- NotificationService for reminders
- ScheduleService for availability
```

**Key Implementation Points:**
1. Database schema with proper indexing
2. Validation using express-validator
3. Error handling with try-catch
4. Logging for debugging
5. Transaction support for data consistency
6. Notification integration
7. Feature flag checks

#### Follow-up Controller Implementation

**Required Models/Services:**
```typescript
// Create/update models
- FollowUpTask model with schema
- TaskOutcome model
- TaskEscalation model

// Create services
- FollowUpService for business logic
- TaskPriorityService
- ConversionService (task to appointment)
```

**Key Implementation Points:**
1. Status workflow management
2. Priority escalation logic
3. Due date calculations
4. Overdue task detection
5. Conversion to appointment logic
6. Integration with appointments module
7. Notification triggers

### Step 3: Database Models

#### Appointment Schema
```typescript
{
  workspaceId: ObjectId,
  patientId: ObjectId,
  assignedTo: ObjectId (pharmacist),
  type: enum,
  scheduledDate: Date,
  scheduledTime: String,
  duration: Number,
  status: enum,
  location: String,
  description: String,
  notes: String,
  reminders: [ReminderSchema],
  isRecurring: Boolean,
  recurrencePattern: Object,
  parentAppointmentId: ObjectId,
  cancellationReason: String,
  completionNotes: String,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### FollowUpTask Schema
```typescript
{
  workspaceId: ObjectId,
  patientId: ObjectId,
  assignedTo: ObjectId,
  type: enum,
  title: String,
  description: String,
  objectives: [String],
  priority: enum,
  status: enum,
  dueDate: Date,
  completedDate: Date,
  estimatedDuration: Number,
  trigger: {
    type: enum,
    sourceId: ObjectId,
    sourceType: String,
    details: Object
  },
  outcome: {
    status: enum,
    notes: String,
    nextActions: [String],
    appointmentCreated: Boolean,
    appointmentId: ObjectId
  },
  escalation: {
    escalated: Boolean,
    reason: String,
    escalatedBy: ObjectId,
    escalatedAt: Date,
    previousPriority: enum
  },
  convertedToAppointment: Boolean,
  appointmentId: ObjectId,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Step 4: Testing

#### Frontend Testing
```bash
# Run component tests
npm test -- PatientEngagement.test.tsx
npm test -- AppointmentManagement.test.tsx
npm test -- FollowUpManagement.test.tsx

# Run E2E tests
npm run test:e2e
```

#### Backend Testing
```bash
# Run unit tests
npm test -- appointmentController.test.ts
npm test -- followUpController.test.ts

# Run integration tests
npm test -- appointmentRoutes.integration.test.ts
npm test -- followUpRoutes.integration.test.ts
```

### Step 5: Production Checklist

- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] API endpoints tested with Postman/Thunder Client
- [ ] Frontend components render correctly
- [ ] API calls successfully reach backend
- [ ] Data is properly stored in database
- [ ] Error handling works as expected
- [ ] Loading states are shown
- [ ] Responsive design tested on mobile/tablet
- [ ] Animations perform smoothly
- [ ] Notifications are sent correctly
- [ ] Feature flags are properly checked
- [ ] RBAC permissions are enforced
- [ ] Database indexes are created
- [ ] API documentation is updated

## Quick Start Commands

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

## Visual Design Specifications

### Color Palette
- Primary: `#1976d2` (Blue)
- Secondary: `#2196f3` (Light Blue)
- Success: `#4caf50` (Green)
- Warning: `#ff9800` (Orange)
- Error: `#f44336` (Red)
- Info: `#00bcd4` (Cyan)

### Typography
- Headers: Font weight 700-800
- Body: Font weight 400-500
- Captions: Font weight 400

### Spacing
- Card padding: 24px (3 MUI spacing units)
- Grid spacing: 24px (3 MUI spacing units)
- Section margins: 32px (4 MUI spacing units)

### Animations
- Duration: 300-600ms
- Easing: ease-in-out, spring
- Hover scale: 1.02-1.05
- Stagger delay: 100ms

## Notes

- All components use TypeScript for type safety
- MUI v5 is used for consistent styling
- Framer Motion provides smooth animations
- Date-fns handles date formatting
- React Query manages API state
- Zustand stores manage global state

## Support

For questions or issues, refer to:
- Frontend docs: `frontend/README.md`
- Backend docs: `backend/README.md`
- API docs: `backend/docs/api.md`
