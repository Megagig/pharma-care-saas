# Notification Format Fix

## Issue Fixed
The error "Objects are not valid as a React child" was occurring because notification functions were being called with object format instead of string parameters.

## Root Cause
```typescript
// ❌ WRONG - Object format
showSuccess({
  title: 'Referral Generated',
  message: 'Referral document has been generated successfully.',
});

// ❌ WRONG - Object format  
showError({
  title: 'Failed to Add Note',
  message: error.response?.data?.message || 'An error occurred while adding the note.',
});
```

## Fix Applied
```typescript
// ✅ CORRECT - String parameters
showSuccess('Referral document has been generated successfully.', 'Referral Generated');

// ✅ CORRECT - String parameters
showError(error.response?.data?.message || 'An error occurred while adding the note.', 'Failed to Add Note');
```

## Function Signatures
```typescript
const showSuccess = (message: string, title?: string, options?: Partial<Notification>) => { ... }
const showError = (message: string, title?: string, options?: Partial<Notification>) => { ... }
```

## Files Fixed
- `frontend/src/queries/useDiagnosticHistory.ts`
  - Fixed `useAddDiagnosticHistoryNote` hook
  - Fixed `useExportDiagnosticHistory` hook  
  - Fixed `useGenerateReferralDocument` hook
  - Fixed `useCompareDiagnosticHistories` hook

## Expected Result
- ✅ No more "Objects are not valid as a React child" errors
- ✅ Notifications display properly with title and message
- ✅ Referral generation works without errors
- ✅ All diagnostic workflow notifications work correctly