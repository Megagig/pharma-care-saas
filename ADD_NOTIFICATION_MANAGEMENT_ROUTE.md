# Add Notification Management Route to app.ts

## Quick Integration (2 minutes)

### Step 1: Add Import

Open `backend/src/app.ts` and add this import near the top with other route imports (around line 70):

```typescript
import notificationManagementRoutes from './routes/notificationManagementRoutes';
```

### Step 2: Register Route

Find the section where notification routes are registered (around line 417):

```typescript
// Notification routes
app.use('/api/notifications', notificationRoutes);

// Communication-specific notifications
app.use('/api/communication/notifications', notificationRoutes);
```

**Add this line right after:**

```typescript
// Notification Management (Admin/Super Admin only)
app.use('/api/notification-management', notificationManagementRoutes);
```

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

### Step 4: Verify

Test the endpoint:

```bash
# Replace YOUR_TOKEN with your actual JWT token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/notification-management/channels
```

You should get a response like:

```json
{
  "success": true,
  "data": {
    "channels": []
  },
  "message": "Channels retrieved successfully"
}
```

## Complete Code Block to Add

Here's the exact code to add to `backend/src/app.ts`:

### At the imports section (around line 70):
```typescript
import notificationManagementRoutes from './routes/notificationManagementRoutes';
```

### At the routes registration section (around line 420):
```typescript
// Notification Management (Admin/Super Admin only)
app.use('/api/notification-management', notificationManagementRoutes);
```

## That's It!

Your notification management system is now fully integrated and ready to use.

Navigate to your SaaS Settings → Notifications tab to start using it.
