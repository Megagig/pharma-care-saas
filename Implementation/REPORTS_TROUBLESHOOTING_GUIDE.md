# Reports & Analytics Troubleshooting Guide

## Issue: "No Report Data Available" when clicking "Generate Report"

### Quick Diagnosis Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Click "Generate Report" and look for error messages
   - Look for messages starting with 🚀, 📡, 📊, ✅, or ❌

2. **Check Network Tab**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Click "Generate Report"
   - Look for API calls to `/api/reports/*`
   - Check if requests are failing (red status codes)

3. **Test Backend Connection**
   ```bash
   node test-backend-connection.js
   ```

### Common Issues and Solutions

#### 1. Backend Server Not Running
**Symptoms:**
- Network errors in console
- "No response received" messages
- Connection refused errors

**Solution:**
```bash
cd backend
npm run dev
```
Make sure you see: "🚀 Server running on port 5000"

#### 2. Authentication Issues
**Symptoms:**
- 401 Unauthorized errors
- Redirects to login page
- "Authentication required" messages

**Solution:**
- Make sure you're logged in to the application
- Check if your session has expired
- Try logging out and logging back in

#### 3. Database Connection Issues
**Symptoms:**
- 500 Internal Server Error
- "Database connection failed" in backend logs
- Empty data responses

**Solution:**
- Check MongoDB is running
- Verify database connection string in backend/.env
- Check backend logs for database errors

#### 4. CORS Issues
**Symptoms:**
- CORS policy errors in browser console
- Requests blocked by browser
- "Access-Control-Allow-Origin" errors

**Solution:**
- Verify frontend is running on http://localhost:5173
- Check backend CORS configuration in `backend/src/app.ts`
- Restart both frontend and backend servers

#### 5. Route Not Mounted
**Symptoms:**
- 404 Not Found errors for `/api/reports/*`
- "Cannot GET /api/reports/types" errors

**Solution:**
- Verify `reportsRoutes` is imported in `backend/src/app.ts`
- Check that `app.use('/api/reports', reportsRoutes)` is present
- Restart backend server

### Development Mode Fallback

If you're in development mode and the API is not working, the system will show demo data with a note that it's in "Demo Mode". This helps you verify the UI is working while troubleshooting the API.

### Step-by-Step Testing

1. **Test Backend Health**
   ```bash
   curl http://localhost:5000/api/health/feature-flags
   ```
   Should return a response (may be 401 if auth required)

2. **Test Reports Endpoint**
   ```bash
   curl http://localhost:5000/api/reports/types
   ```
   Should return 401 (auth required) or data if accessible

3. **Test Frontend Connection**
   - Open http://localhost:5173/reports-analytics
   - Open browser console
   - Click any report type
   - Click "Generate Report"
   - Watch console for API calls

### Expected Console Output (Success)

When working correctly, you should see:
```
🚀 Generate report clicked for: patient-outcomes
🚀 Generating report: patient-outcomes {dateRange: {...}}
📡 Making API call to: /reports/patient-outcomes?startDate=...&endDate=...
📊 API Response: {success: true, data: {...}}
✅ Transformed data: {summary: {...}, charts: [...], tables: [...]}
✅ Report generated successfully from API
```

### Expected Console Output (Error)

When there's an issue, you might see:
```
🚀 Generate report clicked for: patient-outcomes
🚀 Generating report: patient-outcomes {dateRange: {...}}
📡 Making API call to: /reports/patient-outcomes?startDate=...&endDate=...
❌ Error generating patient-outcomes report: AxiosError: Network Error
Response status: undefined
No response received: [object XMLHttpRequest]
🔧 Providing fallback data for development
```

### Environment Variables to Check

**Backend (.env):**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-database
FRONTEND_URL=http://localhost:5173
```

**Frontend:**
- Make sure Vite dev server is running on port 5173
- Check that API calls are going to http://localhost:5000

### Database Data Requirements

The reports need actual data in your MongoDB collections:
- `medicationtherapyreviews` - For patient outcomes
- `mtrinterventions` - For pharmacist interventions  
- `drugtherapyproblems` - For adverse events
- `users` - For pharmacist data

If these collections are empty, reports will show "0" values but should still work.

### Advanced Debugging

1. **Enable Detailed Logging**
   Add to backend/.env:
   ```
   DEBUG=true
   LOG_LEVEL=debug
   ```

2. **Check Database Queries**
   Look at backend console for MongoDB query logs

3. **Test Individual API Endpoints**
   Use Postman or curl to test each endpoint individually

4. **Check Authentication Middleware**
   Temporarily disable auth middleware for testing (NOT for production)

### Getting Help

If none of these solutions work:

1. **Collect Information:**
   - Browser console errors
   - Network tab showing failed requests
   - Backend server logs
   - Results of test scripts

2. **Check Common Issues:**
   - Are both servers running?
   - Is MongoDB connected?
   - Are you logged in?
   - Any firewall/antivirus blocking connections?

3. **Try Clean Restart:**
   ```bash
   # Stop all servers
   # Clear browser cache and localStorage
   # Restart MongoDB
   # Restart backend: cd backend && npm run dev
   # Restart frontend: cd frontend && npm run dev
   ```

The reports system should now work with real data from your application database!