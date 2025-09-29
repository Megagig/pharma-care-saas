# Infinite Loop Fix for CaseResultsPage

## Problem

The CaseResultsPage was making continuous API calls to `/api/diagnostics/cases/:caseId` every 2-3 seconds, causing:

- Rate limiting errors (429 Too Many Requests)
- Excessive server load
- Poor user experience
- Audit log spam

## Root Cause

The `useCallback` hook for `loadCase` included `isLoadingCase` in its dependency array:

```typescript
const loadCase = useCallback(async () => {
  // ... function body
}, [caseId, isLoadingCase]); // ❌ isLoadingCase causes infinite loop
```

This created an infinite loop because:

1. `loadCase` changes when `isLoadingCase` changes
2. `useEffect` calls `loadCase` when it changes
3. `loadCase` sets `isLoadingCase` to true, then false
4. This triggers the callback to recreate, starting the cycle again

## Solution

Replaced the state-based loading guard with a ref-based approach:

```typescript
const isLoadingRef = useRef(false);

const loadCase = useCallback(async () => {
  if (!caseId) {
    setError('Case ID is required');
    setLoading(false);
    return;
  }

  // Prevent multiple simultaneous calls using ref
  if (isLoadingRef.current) {
    return;
  }

  try {
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    const caseData = await aiDiagnosticService.getCase(caseId);
    setDiagnosticCase(caseData);

    // ... rest of logic
  } catch (err) {
    console.error('Failed to load case:', err);
    setError('Failed to load diagnostic case. Please try again.');
  } finally {
    setLoading(false);
    isLoadingRef.current = false;
  }
}, [caseId]); // ✅ Only depends on caseId
```

## Benefits

- ✅ Eliminates infinite API calls
- ✅ Prevents rate limiting errors
- ✅ Reduces server load
- ✅ Maintains proper loading states
- ✅ Preserves all existing functionality

## Files Modified

- `frontend/src/modules/diagnostics/pages/CaseResultsPage.tsx`
  - Added `useRef` import
  - Replaced `isLoadingCase` state with `isLoadingRef`
  - Updated `loadCase` useCallback dependencies
  - Fixed patient name rendering type safety

## Testing

The fix should immediately stop the continuous API calls. You can verify by:

1. Opening the CaseResultsPage
2. Checking browser network tab - should see only one initial request
3. Checking server logs - should see no repeated requests
4. No more 429 rate limiting errors
