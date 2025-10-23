# Notifications Management - System Flow Diagram

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Navigate to SaaS Settings → Notifications Tab               │
│     ├─ Click "Channels" tab                                     │
│     ├─ Click "Rules" tab                                        │
│     ├─ Click "Templates" tab                                    │
│     └─ Click "History" tab                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Component Loads Data                                         │
│     NotificationsManagement.tsx                                  │
│     - useEffect triggers on tab change                           │
│     - loadNotificationData() called                              │
│     - Loading state shown                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Service Layer Called                                         │
│     notificationManagementService.ts                             │
│     - getChannels()                                              │
│     - getRules()                                                 │
│     - getTemplates()                                             │
│     - getHistory()                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. HTTP Request Sent                                            │
│     GET /api/notification-management/channels                    │
│     Headers: { Authorization: "Bearer JWT_TOKEN" }               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Backend Route Handler                                        │
│     notificationManagementRoutes.ts                              │
│     - auth middleware (verify JWT)                               │
│     - requireRole middleware (check admin/super_admin)           │
│     - Route to controller                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Controller Processes Request                                 │
│     notificationManagementController.ts                          │
│     - Extract workplaceId from req.user                          │
│     - Call service layer                                         │
│     - Handle errors                                              │
│     - Format response                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Service Layer Executes Business Logic                        │
│     NotificationChannelService.ts                                │
│     - Query database                                             │
│     - Get usage statistics                                       │
│     - Apply business rules                                       │
│     - Return data                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Database Query                                               │
│     MongoDB                                                      │
│     - NotificationChannel.find({ workplaceId, isDeleted: false })│
│     - NotificationUsage.aggregate([...])                         │
│     - Return results                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. Response Sent Back                                           │
│     {                                                            │
│       success: true,                                             │
│       data: {                                                    │
│         channels: [                                              │
│           {                                                      │
│             id: "...",                                           │
│             name: "Primary Email",                               │
│             type: "email",                                       │
│             enabled: true,                                       │
│             usage: { daily: 140, monthly: 14263 },               │
│             dailyLimit: 10000,                                   │
│             monthlyLimit: 300000                                 │
│           }                                                      │
│         ]                                                        │
│       },                                                         │
│       message: "Channels retrieved successfully"                 │
│     }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  10. Frontend Updates UI                                         │
│      - setChannels(response.data.channels)                       │
│      - setLoading(false)                                         │
│      - Render channel cards                                      │
│      - Show usage statistics                                     │
│      - Enable toggle switches                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Channel Toggle Flow

```
User clicks toggle switch
         │
         ▼
handleChannelToggle(channelId, enabled)
         │
         ▼
notificationManagementService.updateChannel(channelId, { enabled })
         │
         ▼
PUT /api/notification-management/channels/:channelId
         │
         ▼
updateNotificationChannel controller
         │
         ▼
NotificationChannelService.updateChannel()
         │
         ▼
NotificationChannel.findByIdAndUpdate()
         │
         ▼
Response: { success: true, data: { channel: {...} } }
         │
         ▼
Update local state: setChannels(prev => prev.map(...))
         │
         ▼
Show success message: "Channel updated successfully"
         │
         ▼
UI reflects new state (toggle position updated)
```

## Rule Creation Flow

```
User clicks "Add Rule" button
         │
         ▼
setRuleDialogOpen(true)
         │
         ▼
User fills form:
  - Name: "New Patient Alert"
  - Trigger: "patient_created"
  - Conditions: [...]
  - Actions: [...]
  - Priority: "high"
         │
         ▼
User clicks "Save"
         │
         ▼
handleSaveRule()
         │
         ▼
notificationManagementService.createRule(ruleData)
         │
         ▼
POST /api/notification-management/rules
         │
         ▼
createNotificationRule controller
         │
         ▼
new NotificationRule({ ...data, workplaceId, createdBy })
         │
         ▼
rule.save()
         │
         ▼
Response: { success: true, data: { rule: {...} } }
         │
         ▼
setRules(prev => [...prev, newRule])
         │
         ▼
setRuleDialogOpen(false)
         │
         ▼
Show success message: "Rule created successfully"
         │
         ▼
New rule appears in table
```

## Template Rendering Flow (Future)

```
Trigger event occurs (e.g., new patient)
         │
         ▼
Rules engine evaluates active rules
         │
         ▼
Rule matches: "New Patient Alert"
         │
         ▼
Get template: "Welcome Email"
         │
         ▼
Template body: "Hello {{patientName}}, welcome to {{clinicName}}!"
         │
         ▼
Substitute variables:
  - {{patientName}} → "John Doe"
  - {{clinicName}} → "HealthCare Clinic"
         │
         ▼
Rendered: "Hello John Doe, welcome to HealthCare Clinic!"
         │
         ▼
Get channel: "Primary Email"
         │
         ▼
Check limits:
  - Daily: 140/10000 ✓
  - Monthly: 14263/300000 ✓
         │
         ▼
Send via channel (SMTP, Twilio, etc.)
         │
         ▼
Update usage: daily++, monthly++
         │
         ▼
Create notification record in history
         │
         ▼
Update rule: executionCount++, lastExecuted = now
```

## Data Flow Diagram

```
┌──────────────┐
│   Browser    │
│  (React UI)  │
└──────┬───────┘
       │ HTTP/REST
       │ JWT Auth
       ▼
┌──────────────┐
│  Express.js  │
│   API Server │
└──────┬───────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────────┐ ┌──────────────┐
│ Controllers  │ │  Middleware  │
│              │ │  - Auth      │
│ - Channels   │ │  - RBAC      │
│ - Rules      │ │  - Validation│
│ - Templates  │ │  - Logging   │
│ - History    │ └──────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Services   │
│              │
│ - Channel    │
│   Management │
│ - Usage      │
│   Tracking   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   MongoDB    │
│              │
│ - Channels   │
│ - Rules      │
│ - Templates  │
│ - Usage      │
│ - History    │
└──────────────┘
```

## Multi-Tenant Isolation

```
Request comes in with JWT
         │
         ▼
Extract workplaceId from token
         │
         ▼
All queries include workplaceId filter
         │
         ├─ NotificationChannel.find({ workplaceId })
         ├─ NotificationRule.find({ workplaceId })
         ├─ NotificationTemplate.find({ workplaceId })
         └─ Notification.find({ workplaceId })
         │
         ▼
User only sees their workspace data
```

## Security Flow

```
Request → Auth Middleware → RBAC Middleware → Controller
   │            │                  │               │
   │            ▼                  │               │
   │      Verify JWT               │               │
   │      Extract user             │               │
   │            │                  │               │
   │            ▼                  │               │
   │      Valid? ──No→ 401 Unauthorized           │
   │            │                  │               │
   │           Yes                 │               │
   │            │                  │               │
   │            ▼                  │               │
   │      Attach req.user          │               │
   │            │                  │               │
   │            │                  ▼               │
   │            │         Check role               │
   │            │         (admin/super_admin)      │
   │            │                  │               │
   │            │                  ▼               │
   │            │         Authorized? ──No→ 403 Forbidden
   │            │                  │               │
   │            │                 Yes              │
   │            │                  │               │
   │            └──────────────────┴───────────────▼
   │                                         Process Request
   │                                               │
   │                                               ▼
   │                                         Return Response
   │
   └─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Error occurs in any layer
         │
         ▼
Caught by try-catch block
         │
         ▼
Log error with Winston
         │
         ▼
Format error response:
  {
    success: false,
    message: "User-friendly message",
    error: "Technical details (dev only)"
  }
         │
         ▼
Send appropriate HTTP status:
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 500: Server Error
         │
         ▼
Frontend receives error
         │
         ▼
Display error message to user
         │
         ▼
Log error to console (dev mode)
```

## Usage Tracking Flow

```
Notification sent via channel
         │
         ▼
notificationChannelService.incrementUsage(channelId, 1)
         │
         ▼
Get today's date (start of day)
         │
         ▼
NotificationUsage.findOneAndUpdate(
  { channelId, date: today },
  { $inc: { count: 1 } },
  { upsert: true }
)
         │
         ▼
Usage count incremented
         │
         ▼
Next time channel is viewed:
  - getChannelUsage() called
  - Aggregate daily usage (today)
  - Aggregate monthly usage (this month)
  - Return { daily: 141, monthly: 14264 }
         │
         ▼
UI displays updated usage
```

This visual representation should help you understand how all the pieces fit together!
