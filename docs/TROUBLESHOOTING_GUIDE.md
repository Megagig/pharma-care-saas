# Troubleshooting Guide - Workspace Subscription & RBAC

## Overview

This guide provides comprehensive troubleshooting information for common issues encountered with the workspace-level subscription management, invitation system, and enhanced RBAC features.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Invitation Problems](#invitation-problems)
3. [Subscription Management Issues](#subscription-management-issues)
4. [Permission and Access Control](#permission-and-access-control)
5. [Usage Limit Problems](#usage-limit-problems)
6. [Email Delivery Issues](#email-delivery-issues)
7. [Performance Issues](#performance-issues)
8. [Database and Migration Issues](#database-and-migration-issues)
9. [API Integration Problems](#api-integration-problems)
10. [Monitoring and Logging](#monitoring-and-logging)

---

## Authentication Issues

### Issue: User Cannot Login After Workspace Migration

**Symptoms:**

- User gets "Invalid credentials" error despite correct password
- Login works in development but fails in production
- User was able to login before workspace migration

**Diagnosis:**

```bash
# Check user status in database
db.users.findOne({ email: "user@example.com" })

# Check workspace association
db.workplaces.findOne({
  $or: [
    { ownerId: ObjectId("user_id") },
    { teamMembers: ObjectId("user_id") }
  ]
})

# Check migration logs
grep "migration" /var/log/PharmacyCopilot/combined.log | tail -50
```

**Solutions:**

1. **Verify User Status:**

   ```bash
   # Update user status if suspended
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { status: "active" } }
   )
   ```

2. **Check Workspace Association:**

   ```bash
   # Add user to workspace if missing
   db.workplaces.updateOne(
     { _id: ObjectId("workspace_id") },
     { $addToSet: { teamMembers: ObjectId("user_id") } }
   )
   ```

3. **Reset Password:**
   ```bash
   # Generate password reset token
   curl -X POST https://api.PharmacyCopilot.com/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'
   ```

### Issue: JWT Token Expires Too Quickly

**Symptoms:**

- Users get logged out frequently
- "Session expired" messages appear often
- Token validation fails intermittently

**Diagnosis:**

```bash
# Check JWT configuration
grep "JWT_EXPIRES_IN" .env

# Verify token payload
node -e "
const jwt = require('jsonwebtoken');
const token = 'YOUR_TOKEN_HERE';
console.log(jwt.decode(token));
"
```

**Solutions:**

1. **Update JWT Expiration:**

   ```bash
   # In .env file
   JWT_EXPIRES_IN=7d  # Increase from default 1d
   ```

2. **Implement Token Refresh:**
   ```typescript
   // Add to API client
   const refreshToken = async () => {
     const response = await apiClient.post('/api/auth/refresh');
     localStorage.setItem('authToken', response.data.token);
     return response.data.token;
   };
   ```

### Issue: Workspace Context Not Loading

**Symptoms:**

- User authenticated but workspace is null
- Permission checks fail unexpectedly
- Subscription information missing

**Diagnosis:**

```bash
# Check auth middleware logs
grep "workspace context" /var/log/PharmacyCopilot/combined.log

# Verify database relationships
db.users.aggregate([
  { $match: { email: "user@example.com" } },
  { $lookup: {
    from: "workplaces",
    let: { userId: "$_id" },
    pipeline: [
      { $match: { $expr: { $or: [
        { $eq: ["$ownerId", "$$userId"] },
        { $in: ["$$userId", "$teamMembers"] }
      ]}}}
    ],
    as: "workspaces"
  }}
])
```

**Solutions:**

1. **Fix Workspace Association:**

   ```javascript
   // Migration script to fix associations
   db.users.find({ workspaceId: { $exists: false } }).forEach((user) => {
     const workspace = db.workplaces.findOne({
       $or: [{ ownerId: user._id }, { teamMembers: user._id }],
     });

     if (workspace) {
       db.users.updateOne(
         { _id: user._id },
         { $set: { workspaceId: workspace._id } }
       );
     }
   });
   ```

2. **Clear Auth Cache:**

   ```bash
   # Restart auth service
   pm2 restart PharmacyCopilot-api

   # Clear Redis cache if using
   redis-cli FLUSHDB
   ```

---

## Invitation Problems

### Issue: Invitation Emails Not Being Sent

**Symptoms:**

- Invitation created successfully but email not received
- No error messages in API response
- Email delivery status shows "pending"

**Diagnosis:**

```bash
# Check email service logs
grep "invitation email" /var/log/PharmacyCopilot/combined.log

# Check email delivery records
db.emaildeliveries.find({
  type: "invitation",
  status: { $ne: "delivered" }
}).sort({ createdAt: -1 }).limit(10)

# Test email service connection
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_RESEND_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from": "test@PharmacyCopilot.com", "to": "test@example.com", "subject": "Test", "html": "Test"}'
```

**Solutions:**

1. **Check Email Service Configuration:**

   ```bash
   # Verify environment variables
   echo $RESEND_API_KEY
   echo $FROM_EMAIL

   # Test email service
   node -e "
   const { Resend } = require('resend');
   const resend = new Resend(process.env.RESEND_API_KEY);
   resend.emails.send({
     from: 'test@PharmacyCopilot.com',
     to: 'test@example.com',
     subject: 'Test Email',
     html: '<p>Test</p>'
   }).then(console.log).catch(console.error);
   "
   ```

2. **Retry Failed Email Deliveries:**

   ```bash
   # Run email delivery cron manually
   node backend/src/services/EmailDeliveryCronService.js
   ```

3. **Check Email Template Issues:**
   ```bash
   # Validate email template
   node -e "
   const fs = require('fs');
   const template = fs.readFileSync('backend/src/templates/email/workspaceInvitation.html', 'utf8');
   console.log('Template length:', template.length);
   console.log('Contains placeholders:', template.includes('{{'));
   "
   ```

### Issue: Invitation Code Invalid or Expired

**Symptoms:**

- "Invalid invitation code" error when accepting
- Invitation shows as expired before expiry time
- Code validation fails

**Diagnosis:**

```bash
# Check invitation in database
db.invitations.findOne({ code: "ABC12345" })

# Check system time
date
timedatectl status

# Verify TTL index
db.invitations.getIndexes()
```

**Solutions:**

1. **Fix System Time Issues:**

   ```bash
   # Sync system time
   sudo ntpdate -s time.nist.gov

   # Set correct timezone
   sudo timedatectl set-timezone UTC
   ```

2. **Extend Invitation Expiry:**

   ```javascript
   // Extend specific invitation
   db.invitations.updateOne(
     { code: 'ABC12345' },
     { $set: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
   );
   ```

3. **Recreate Invitation:**

   ```bash
   # Cancel old invitation and create new one
   curl -X DELETE https://api.PharmacyCopilot.com/api/invitations/INVITATION_ID \
     -H "Authorization: Bearer OWNER_TOKEN"

   curl -X POST https://api.PharmacyCopilot.com/api/workspaces/WORKSPACE_ID/invitations \
     -H "Authorization: Bearer OWNER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "role": "Pharmacist"}'
   ```

### Issue: Invitation Limit Exceeded

**Symptoms:**

- Cannot create new invitations
- "Invitation limit exceeded" error
- Pending invitations count seems incorrect

**Diagnosis:**

```bash
# Check pending invitations count
db.invitations.countDocuments({
  workspaceId: ObjectId("workspace_id"),
  status: "active"
})

# Check workspace plan limits
db.subscriptionplans.findOne({ _id: ObjectId("plan_id") })

# Check workspace subscription
db.subscriptions.findOne({ workspaceId: ObjectId("workspace_id") })
```

**Solutions:**

1. **Clean Up Expired Invitations:**

   ```javascript
   // Mark expired invitations
   db.invitations.updateMany(
     {
       status: 'active',
       expiresAt: { $lt: new Date() },
     },
     { $set: { status: 'expired' } }
   );
   ```

2. **Cancel Unnecessary Invitations:**

   ```bash
   # List pending invitations
   curl -X GET https://api.PharmacyCopilot.com/api/workspaces/WORKSPACE_ID/invitations \
     -H "Authorization: Bearer OWNER_TOKEN"

   # Cancel specific invitation
   curl -X DELETE https://api.PharmacyCopilot.com/api/invitations/INVITATION_ID \
     -H "Authorization: Bearer OWNER_TOKEN"
   ```

3. **Upgrade Plan:**
   ```bash
   # Check available plans
   curl -X GET https://api.PharmacyCopilot.com/api/subscription-plans \
     -H "Authorization: Bearer TOKEN"
   ```

---

## Subscription Management Issues

### Issue: Subscription Status Not Updating After Payment

**Symptoms:**

- Payment successful but subscription still shows "past_due"
- Features not activated after upgrade
- Billing status inconsistent

**Diagnosis:**

```bash
# Check payment records
db.payments.find({ workspaceId: ObjectId("workspace_id") }).sort({ createdAt: -1 })

# Check subscription status
db.subscriptions.findOne({ workspaceId: ObjectId("workspace_id") })

# Check webhook logs
grep "webhook" /var/log/PharmacyCopilot/combined.log | tail -20

# Verify Paystack webhook
curl -X GET https://api.paystack.co/transaction/verify/REFERENCE \
  -H "Authorization: Bearer YOUR_PAYSTACK_SECRET"
```

**Solutions:**

1. **Manually Update Subscription Status:**

   ```javascript
   // Update subscription after verified payment
   db.subscriptions.updateOne(
     { workspaceId: ObjectId('workspace_id') },
     {
       $set: {
         status: 'active',
         endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
         updatedAt: new Date(),
       },
     }
   );
   ```

2. **Trigger Webhook Manually:**

   ```bash
   # Simulate webhook call
   curl -X POST https://api.PharmacyCopilot.com/api/webhooks/paystack \
     -H "Content-Type: application/json" \
     -d '{
       "event": "charge.success",
       "data": {
         "reference": "PAYMENT_REFERENCE",
         "status": "success"
       }
     }'
   ```

3. **Refresh Plan Features:**
   ```bash
   # Trigger plan cache refresh
   curl -X POST https://api.PharmacyCopilot.com/api/admin/refresh-plans \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```

### Issue: Trial Period Not Expiring Correctly

**Symptoms:**

- Trial shows as expired but still has access
- Trial period longer than expected
- Paywall mode not activating

**Diagnosis:**

```bash
# Check workspace trial dates
db.workplaces.findOne(
  { _id: ObjectId("workspace_id") },
  { trialStartDate: 1, trialEndDate: 1, subscriptionStatus: 1 }
)

# Check subscription expiry service
grep "trial expiry" /var/log/PharmacyCopilot/combined.log

# Check cron job status
crontab -l | grep expiry
```

**Solutions:**

1. **Fix Trial Dates:**

   ```javascript
   // Correct trial end date
   db.workplaces.updateOne(
     { _id: ObjectId('workspace_id') },
     {
       $set: {
         trialEndDate: new Date('2024-01-15T00:00:00.000Z'),
         subscriptionStatus: 'trial',
       },
     }
   );
   ```

2. **Manually Trigger Expiry Check:**

   ```bash
   # Run expiry service manually
   node backend/src/services/subscriptionExpiryService.js
   ```

3. **Enable Paywall Mode:**
   ```bash
   curl -X POST https://api.PharmacyCopilot.com/api/subscriptions/workspace/WORKSPACE_ID/paywall/enable \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```

---

## Permission and Access Control

### Issue: User Has Correct Role But Access Denied

**Symptoms:**

- 403 Forbidden errors despite correct role
- Permission checks failing unexpectedly
- Features not accessible to authorized users

**Diagnosis:**

```bash
# Check user permissions
curl -X GET https://api.PharmacyCopilot.com/api/auth/permissions \
  -H "Authorization: Bearer USER_TOKEN"

# Check permission matrix
grep -A 10 "PERMISSION_MATRIX" backend/src/config/permissionMatrix.ts

# Check user's workspace role
db.workplaces.findOne(
  { teamMembers: ObjectId("user_id") },
  { teamMembers: 1, ownerId: 1 }
)
```

**Solutions:**

1. **Verify Permission Matrix:**

   ```typescript
   // Check permission configuration
   const PERMISSION_MATRIX = {
     'patient.create': {
       workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
       features: ['patient_management'],
     },
   };
   ```

2. **Update User Role:**

   ```javascript
   // Update user's workplace role
   db.users.updateOne(
     { _id: ObjectId('user_id') },
     { $set: { workplaceRole: 'Pharmacist' } }
   );
   ```

3. **Clear Permission Cache:**

   ```bash
   # Restart API server to clear cache
   pm2 restart PharmacyCopilot-api

   # Clear user session
   curl -X POST https://api.PharmacyCopilot.com/api/auth/logout \
     -H "Authorization: Bearer USER_TOKEN"
   ```

### Issue: Super Admin Access Not Working

**Symptoms:**

- Super admin getting permission denied
- Admin features not accessible
- System-level operations failing

**Diagnosis:**

```bash
# Check user role
db.users.findOne({ email: "admin@PharmacyCopilot.com" }, { role: 1, status: 1 })

# Check admin middleware
grep "super_admin" backend/src/middlewares/rbac.ts

# Check admin routes
grep "requireRole.*admin" backend/src/routes/*.ts
```

**Solutions:**

1. **Update User Role:**

   ```javascript
   // Set user as super admin
   db.users.updateOne(
     { email: 'admin@PharmacyCopilot.com' },
     { $set: { role: 'super_admin', status: 'active' } }
   );
   ```

2. **Verify Admin Bypass Logic:**
   ```typescript
   // Check RBAC middleware
   if (user.role === 'super_admin') {
     return next(); // Should bypass all checks
   }
   ```

---

## Usage Limit Problems

### Issue: Usage Statistics Not Updating

**Symptoms:**

- Usage counters stuck at old values
- Limits not enforced correctly
- Statistics dashboard showing stale data

**Diagnosis:**

```bash
# Check workspace stats
db.workplaces.findOne(
  { _id: ObjectId("workspace_id") },
  { stats: 1 }
)

# Check usage update logs
grep "usage update" /var/log/PharmacyCopilot/combined.log

# Check cron job status
ps aux | grep WorkspaceStatsCronService
```

**Solutions:**

1. **Manually Recalculate Statistics:**

   ```bash
   # Trigger stats recalculation
   curl -X POST https://api.PharmacyCopilot.com/api/usage/recalculate \
     -H "Authorization: Bearer OWNER_TOKEN"
   ```

2. **Fix Stats Calculation:**

   ```javascript
   // Recalculate patient count
   db.workplaces.aggregate([
     { $match: { _id: ObjectId('workspace_id') } },
     {
       $lookup: {
         from: 'patients',
         localField: '_id',
         foreignField: 'workspaceId',
         as: 'patients',
       },
     },
     { $project: { patientCount: { $size: '$patients' } } },
   ]);
   ```

3. **Restart Stats Service:**
   ```bash
   # Restart cron service
   pm2 restart workspace-stats-cron
   ```

### Issue: Usage Limits Not Being Enforced

**Symptoms:**

- Users can exceed plan limits
- No warning messages at 90% usage
- Limit enforcement middleware not working

**Diagnosis:**

```bash
# Check middleware configuration
grep -A 20 "enforcePlanLimit" backend/src/middlewares/usageLimits.ts

# Check plan limits
db.subscriptionplans.findOne({ _id: ObjectId("plan_id") }, { limits: 1 })

# Test limit enforcement
curl -X POST https://api.PharmacyCopilot.com/api/patients \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Patient"}'
```

**Solutions:**

1. **Verify Middleware Order:**

   ```typescript
   // Ensure usage limit middleware is applied
   router.post(
     '/patients',
     authWithWorkspace,
     enforcePlanLimit('patients'), // Must be after auth
     createPatient
   );
   ```

2. **Update Plan Limits:**

   ```javascript
   // Fix plan limits if incorrect
   db.subscriptionplans.updateOne(
     { code: 'basic' },
     { $set: { 'limits.patients': 100 } }
   );
   ```

3. **Test Limit Enforcement:**
   ```bash
   # Create test patients to verify limits
   for i in {1..105}; do
     curl -X POST https://api.PharmacyCopilot.com/api/patients \
       -H "Authorization: Bearer TOKEN" \
       -H "Content-Type: application/json" \
       -d "{\"name\": \"Test Patient $i\"}"
   done
   ```

---

## Email Delivery Issues

### Issue: Emails Going to Spam Folder

**Symptoms:**

- Users not receiving invitation emails
- Emails found in spam/junk folder
- Low email delivery rates

**Diagnosis:**

```bash
# Check email headers
curl -X GET https://api.resend.com/emails/EMAIL_ID \
  -H "Authorization: Bearer YOUR_RESEND_KEY"

# Check domain reputation
dig TXT PharmacyCopilot.com | grep -i spf
dig TXT _dmarc.PharmacyCopilot.com

# Check email content
cat backend/src/templates/email/workspaceInvitation.html
```

**Solutions:**

1. **Configure SPF/DKIM/DMARC:**

   ```bash
   # Add DNS records
   # SPF: "v=spf1 include:_spf.resend.com ~all"
   # DKIM: Get from Resend dashboard
   # DMARC: "v=DMARC1; p=quarantine; rua=mailto:dmarc@PharmacyCopilot.com"
   ```

2. **Improve Email Content:**

   ```html
   <!-- Use proper email structure -->
   <!DOCTYPE html>
   <html>
     <head>
       <meta charset="utf-8" />
       <title>Workspace Invitation</title>
     </head>
     <body>
       <!-- Avoid spam trigger words -->
       <!-- Include unsubscribe link -->
       <!-- Use proper text-to-image ratio -->
     </body>
   </html>
   ```

3. **Monitor Email Reputation:**
   ```bash
   # Check email delivery metrics
   curl -X GET https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_RESEND_KEY" \
     -G -d "limit=100"
   ```

### Issue: Email Template Rendering Errors

**Symptoms:**

- Emails sent with placeholder text
- Template variables not replaced
- Broken email formatting

**Diagnosis:**

```bash
# Check template compilation
node -e "
const fs = require('fs');
const template = fs.readFileSync('backend/src/templates/email/workspaceInvitation.html', 'utf8');
console.log('Placeholders found:', template.match(/\{\{.*?\}\}/g));
"

# Check email service logs
grep "template" /var/log/PharmacyCopilot/combined.log
```

**Solutions:**

1. **Fix Template Variables:**

   ```html
   <!-- Ensure proper variable syntax -->
   <p>Hello {{recipientName}},</p>
   <p>You've been invited to join {{workspaceName}} as a {{role}}.</p>
   <a href="{{invitationLink}}">Accept Invitation</a>
   ```

2. **Test Template Rendering:**

   ```javascript
   // Test template compilation
   const template = `
     <p>Hello {{name}},</p>
     <p>Welcome to {{workspace}}!</p>
   `;

   const rendered = template
     .replace('{{name}}', 'John Doe')
     .replace('{{workspace}}', 'Test Pharmacy');

   console.log(rendered);
   ```

---

## Performance Issues

### Issue: Slow API Response Times

**Symptoms:**

- API requests taking >5 seconds
- Timeout errors in frontend
- Database queries running slowly

**Diagnosis:**

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.PharmacyCopilot.com/api/auth/profile

# Check database performance
db.runCommand({ currentOp: true })

# Check server resources
top
free -h
df -h

# Check database indexes
db.workplaces.getIndexes()
db.subscriptions.getIndexes()
db.invitations.getIndexes()
```

**Solutions:**

1. **Add Database Indexes:**

   ```javascript
   // Add missing indexes
   db.workplaces.createIndex({ currentSubscriptionId: 1 });
   db.subscriptions.createIndex({ workspaceId: 1, status: 1 });
   db.invitations.createIndex({ workspaceId: 1, status: 1 });
   db.users.createIndex({ email: 1, status: 1 });
   ```

2. **Optimize Database Queries:**

   ```javascript
   // Use projection to limit fields
   db.workplaces.find(
     { _id: ObjectId('workspace_id') },
     { name: 1, subscriptionStatus: 1, currentPlanId: 1 }
   );

   // Use aggregation for complex queries
   db.workplaces.aggregate([
     { $match: { _id: ObjectId('workspace_id') } },
     {
       $lookup: {
         from: 'subscriptions',
         localField: 'currentSubscriptionId',
         foreignField: '_id',
         as: 'subscription',
       },
     },
     { $unwind: '$subscription' },
     { $project: { name: 1, 'subscription.status': 1 } },
   ]);
   ```

3. **Implement Caching:**

   ```typescript
   // Add Redis caching
   const redis = require('redis');
   const client = redis.createClient();

   const getCachedWorkspace = async (workspaceId: string) => {
     const cached = await client.get(`workspace:${workspaceId}`);
     if (cached) return JSON.parse(cached);

     const workspace = await Workplace.findById(workspaceId);
     await client.setex(
       `workspace:${workspaceId}`,
       300,
       JSON.stringify(workspace)
     );
     return workspace;
   };
   ```

### Issue: Memory Leaks in Node.js Application

**Symptoms:**

- Increasing memory usage over time
- Application crashes with out-of-memory errors
- Slow garbage collection

**Diagnosis:**

```bash
# Monitor memory usage
ps aux | grep node
top -p $(pgrep node)

# Check for memory leaks
node --inspect backend/src/server.js
# Then use Chrome DevTools Memory tab

# Check event listeners
node -e "console.log(process.listenerCount('uncaughtException'))"
```

**Solutions:**

1. **Fix Event Listener Leaks:**

   ```typescript
   // Properly remove event listeners
   const cleanup = () => {
     process.removeAllListeners('SIGINT');
     process.removeAllListeners('SIGTERM');
   };

   process.on('SIGINT', cleanup);
   process.on('SIGTERM', cleanup);
   ```

2. **Optimize Database Connections:**

   ```typescript
   // Use connection pooling
   mongoose.connect(mongoUri, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   ```

3. **Implement Proper Error Handling:**
   ```typescript
   // Prevent memory leaks from unhandled promises
   process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
     // Don't exit process in production
   });
   ```

---

## Database and Migration Issues

### Issue: Migration Script Fails Partially

**Symptoms:**

- Some users migrated, others not
- Inconsistent data state
- Migration logs show errors

**Diagnosis:**

```bash
# Check migration logs
grep "migration" /var/log/PharmacyCopilot/combined.log | grep -i error

# Check migration status
db.migrations.find().sort({ createdAt: -1 })

# Count migrated vs unmigrated users
db.users.countDocuments({ workspaceId: { $exists: true } })
db.users.countDocuments({ workspaceId: { $exists: false } })
```

**Solutions:**

1. **Resume Failed Migration:**

   ```bash
   # Run migration script with resume option
   node backend/src/scripts/enhancedMigration.js --resume
   ```

2. **Fix Data Inconsistencies:**

   ```javascript
   // Find and fix orphaned records
   db.users.find({ workspaceId: { $exists: false } }).forEach((user) => {
     const workspace = db.workplaces.findOne({
       $or: [{ ownerId: user._id }, { teamMembers: user._id }],
     });

     if (workspace) {
       db.users.updateOne(
         { _id: user._id },
         { $set: { workspaceId: workspace._id } }
       );
       console.log(`Fixed user ${user.email}`);
     }
   });
   ```

3. **Rollback Migration:**
   ```bash
   # Rollback to previous state
   node backend/src/scripts/enhancedMigration.js --rollback
   ```

### Issue: Database Connection Timeouts

**Symptoms:**

- "Connection timeout" errors
- Intermittent database connectivity
- Application crashes during high load

**Diagnosis:**

```bash
# Check MongoDB status
systemctl status mongod

# Check connection pool
db.runCommand({ serverStatus: 1 }).connections

# Check network connectivity
ping mongodb-server
telnet mongodb-server 27017

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

**Solutions:**

1. **Optimize Connection Settings:**

   ```typescript
   // Update connection configuration
   mongoose.connect(mongoUri, {
     maxPoolSize: 20,
     minPoolSize: 5,
     maxIdleTimeMS: 30000,
     serverSelectionTimeoutMS: 10000,
     socketTimeoutMS: 45000,
     bufferMaxEntries: 0,
   });
   ```

2. **Implement Connection Retry Logic:**

   ```typescript
   const connectWithRetry = () => {
     mongoose
       .connect(mongoUri, options)
       .then(() => console.log('MongoDB connected'))
       .catch((err) => {
         console.error('MongoDB connection failed:', err);
         setTimeout(connectWithRetry, 5000);
       });
   };
   ```

3. **Monitor Connection Health:**

   ```typescript
   mongoose.connection.on('connected', () => {
     console.log('MongoDB connected');
   });

   mongoose.connection.on('error', (err) => {
     console.error('MongoDB error:', err);
   });

   mongoose.connection.on('disconnected', () => {
     console.log('MongoDB disconnected');
   });
   ```

---

## API Integration Problems

### Issue: Frontend API Calls Failing

**Symptoms:**

- CORS errors in browser console
- 401 Unauthorized despite valid token
- Network errors in API calls

**Diagnosis:**

```bash
# Check CORS configuration
grep -i cors backend/src/app.ts

# Test API endpoint directly
curl -X GET https://api.PharmacyCopilot.com/api/auth/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Origin: https://app.PharmacyCopilot.com"

# Check browser network tab
# Look for preflight OPTIONS requests
```

**Solutions:**

1. **Fix CORS Configuration:**

   ```typescript
   // Update CORS settings
   app.use(
     cors({
       origin: [
         'http://localhost:3000',
         'https://app.PharmacyCopilot.com',
         'https://PharmacyCopilot.com',
       ],
       credentials: true,
       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
       allowedHeaders: ['Content-Type', 'Authorization'],
     })
   );
   ```

2. **Fix Token Handling:**

   ```typescript
   // Ensure proper token format
   const token = localStorage.getItem('authToken');
   if (token && !token.startsWith('Bearer ')) {
     headers.Authorization = `Bearer ${token}`;
   }
   ```

3. **Handle Preflight Requests:**
   ```typescript
   // Add OPTIONS handler
   app.options('*', cors());
   ```

### Issue: Webhook Verification Failing

**Symptoms:**

- Payment webhooks not processing
- Webhook signature verification errors
- Duplicate webhook processing

**Diagnosis:**

```bash
# Check webhook logs
grep "webhook" /var/log/PharmacyCopilot/combined.log

# Test webhook signature
node -e "
const crypto = require('crypto');
const secret = 'YOUR_WEBHOOK_SECRET';
const payload = 'webhook_payload';
const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex');
console.log('Expected signature:', signature);
"

# Check webhook endpoint
curl -X POST https://api.PharmacyCopilot.com/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "X-Paystack-Signature: SIGNATURE" \
  -d '{"event": "charge.success"}'
```

**Solutions:**

1. **Fix Signature Verification:**

   ```typescript
   const verifyWebhookSignature = (payload: string, signature: string) => {
     const hash = crypto
       .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
       .update(payload)
       .digest('hex');

     return hash === signature;
   };
   ```

2. **Implement Idempotency:**

   ```typescript
   // Prevent duplicate processing
   const processedWebhooks = new Set();

   app.post('/webhooks/paystack', (req, res) => {
     const webhookId = req.headers['x-paystack-signature'];

     if (processedWebhooks.has(webhookId)) {
       return res.status(200).json({ message: 'Already processed' });
     }

     processedWebhooks.add(webhookId);
     // Process webhook...
   });
   ```

---

## Monitoring and Logging

### Issue: Insufficient Logging for Debugging

**Symptoms:**

- Cannot trace error sources
- Missing context in log messages
- Logs not structured properly

**Solutions:**

1. **Implement Structured Logging:**

   ```typescript
   import winston from 'winston';

   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' }),
     ],
   });

   // Usage
   logger.info('User login attempt', {
     userId: user.id,
     email: user.email,
     ip: req.ip,
     userAgent: req.get('User-Agent'),
   });
   ```

2. **Add Request Tracing:**

   ```typescript
   // Add correlation ID to requests
   app.use((req, res, next) => {
     req.correlationId = uuidv4();
     res.setHeader('X-Correlation-ID', req.correlationId);
     next();
   });

   // Include in all log messages
   logger.info('Processing request', {
     correlationId: req.correlationId,
     method: req.method,
     url: req.url,
   });
   ```

3. **Monitor Key Metrics:**

   ```typescript
   // Track important metrics
   const metrics = {
     invitationsSent: 0,
     subscriptionUpgrades: 0,
     authFailures: 0,
   };

   // Log metrics periodically
   setInterval(() => {
     logger.info('Application metrics', metrics);
   }, 60000);
   ```

### Issue: Performance Monitoring Setup

**Solutions:**

1. **Add Response Time Monitoring:**

   ```typescript
   app.use((req, res, next) => {
     const start = Date.now();

     res.on('finish', () => {
       const duration = Date.now() - start;
       logger.info('Request completed', {
         method: req.method,
         url: req.url,
         statusCode: res.statusCode,
         duration,
         correlationId: req.correlationId,
       });
     });

     next();
   });
   ```

2. **Database Query Monitoring:**
   ```typescript
   // Monitor slow queries
   mongoose.set('debug', (collectionName, method, query, doc) => {
     const start = Date.now();

     return function () {
       const duration = Date.now() - start;
       if (duration > 1000) {
         // Log slow queries
         logger.warn('Slow database query', {
           collection: collectionName,
           method,
           query,
           duration,
         });
       }
     };
   });
   ```

---

## Emergency Procedures

### System Recovery Steps

1. **Service Restart:**

   ```bash
   # Restart all services
   pm2 restart all

   # Restart specific service
   pm2 restart PharmacyCopilot-api

   # Check service status
   pm2 status
   ```

2. **Database Recovery:**

   ```bash
   # Check database status
   systemctl status mongod

   # Restart MongoDB
   sudo systemctl restart mongod

   # Check database integrity
   db.runCommand({ dbStats: 1 })
   ```

3. **Clear Caches:**

   ```bash
   # Clear Redis cache
   redis-cli FLUSHALL

   # Clear application cache
   rm -rf /tmp/PharmacyCopilot-cache/*

   # Restart with fresh cache
   pm2 restart PharmacyCopilot-api
   ```

### Contact Information

- **Technical Support:** tech-support@PharmacyCopilot.com
- **Emergency Hotline:** +234-800-PHARMA-1
- **DevOps Team:** devops@PharmacyCopilot.com
- **Database Admin:** dba@PharmacyCopilot.com

---

_Last Updated: January 2024_
_Version: 2.0_
