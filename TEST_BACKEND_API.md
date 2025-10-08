# Test Backend API

## Test the subscription plans endpoint directly

Open your browser or use curl to test:

### Option 1: Browser
Open: `http://localhost:5000/api/subscriptions/plans?billingInterval=monthly`

### Option 2: Curl
```bash
curl http://localhost:5000/api/subscriptions/plans?billingInterval=monthly
```

### Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Free Trial",
      "tier": "free_trial",
      "priceNGN": 0,
      "billingInterval": "monthly",
      "displayFeatures": [...]
    },
    ...
  ]
}
```

### If you get HTML instead:
1. Check if backend is running: `ps aux | grep node`
2. Check backend logs for errors
3. Try restarting the backend server

### If you get 404:
The route might not be registered. Check `backend/src/app.ts` line 267.

### If you get empty array:
No plans exist in the database. You need to seed the plans.
