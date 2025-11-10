# AI Diagnostics Performance Fix

## Problem Summary
The AI diagnostics feature was experiencing severe performance issues:
- API responses taking 2-7 seconds (should be <500ms)
- "Analysis Failed" errors in the frontend
- React Query errors due to undefined data
- Excessive server load from polling

## Root Cause Analysis
1. **Missing Database Indexes**: Queries on `relatedRecords.diagnosticCaseId` in FollowUpTask and Appointment collections were performing full table scans
2. **Inefficient Polling**: Frontend was making repeated slow API calls every 2 seconds
3. **Poor Error Handling**: React Query was failing when engagement API returned undefined data

## Solution Implemented

### 1. Database Index Optimization
Added critical missing indexes to improve query performance:

**FollowUpTask Model:**
```javascript
followUpTaskSchema.index({ 'relatedRecords.diagnosticCaseId': 1 });
followUpTaskSchema.index({ 'relatedRecords.clinicalInterventionId': 1 });
followUpTaskSchema.index({ 'relatedRecords.mtrSessionId': 1 });
followUpTaskSchema.index({ 'relatedRecords.appointmentId': 1 });
followUpTaskSchema.index({ 'relatedRecords.medicationId': 1 });
```

**Appointment Model:**
```javascript
appointmentSchema.index({ 'relatedRecords.diagnosticCaseId': 1 });
appointmentSchema.index({ 'relatedRecords.mtrSessionId': 1 });
appointmentSchema.index({ 'relatedRecords.clinicalInterventionId': 1 });
appointmentSchema.index({ 'relatedRecords.followUpTaskId': 1 });
appointmentSchema.index({ 'relatedRecords.visitId': 1 });
```

### 2. Query Optimization
Enhanced database queries with:
- `.lean()` for faster JSON responses
- `.maxTimeMS(5000)` to prevent hanging queries
- `.limit(50)` to prevent excessive data loading
- Proper sorting for better performance

### 3. Frontend Improvements
**React Query Error Handling:**
- Added proper error handling for undefined data
- Implemented exponential backoff for retries
- Reduced retry attempts to minimize server load

**Polling Optimization:**
- Progressive delay: 2s initially, 5s after 10 attempts
- Longer delays on errors to reduce server stress

### 4. Database Migration
Created migration script to add indexes to existing database:
```bash
node backend/scripts/add-engagement-indexes.js
```

## Expected Performance Improvements
- **API Response Time**: From 2-7 seconds to <500ms
- **Database Query Performance**: 10-100x faster with proper indexes
- **Server Load**: Significantly reduced due to optimized polling
- **User Experience**: Eliminated "Analysis Failed" errors

## Deployment Steps
1. Run the database migration script:
   ```bash
   cd backend
   node scripts/add-engagement-indexes.js
   ```

2. Restart the backend server to apply code changes

3. Clear browser cache or hard refresh frontend

## Monitoring
After deployment, monitor:
- API response times in server logs
- Database query performance
- Error rates in frontend
- Server resource usage

## Files Modified
- `backend/src/models/FollowUpTask.ts` - Added indexes
- `backend/src/models/Appointment.ts` - Added indexes  
- `backend/src/services/EngagementIntegrationService.ts` - Query optimization
- `backend/src/modules/diagnostics/services/diagnosticService.ts` - Added timeouts
- `frontend/src/hooks/useDiagnosticEngagement.ts` - Error handling
- `frontend/src/services/aiDiagnosticService.ts` - Polling optimization
- `backend/scripts/add-engagement-indexes.js` - Migration script (new)

This fix addresses the core performance bottleneck and should resolve the AI diagnostics issues immediately.