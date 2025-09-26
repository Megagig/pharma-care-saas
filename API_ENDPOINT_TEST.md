# API Endpoint Testing Guide

## Fixed Issues

### 1. **Endpoint Path Corrections**

- ❌ **Before**: `/api/patients` (double /api/ prefix)
- ✅ **After**: `/patients` (apiClient already includes /api/ in baseURL)

### 2. **Response Structure Handling**

- ❌ **Before**: Hardcoded `response.data.data` structure
- ✅ **After**: Flexible `extractArrayFromResponse()` method

### 3. **DOM Nesting Warnings**

- ❌ **Before**: Nested `<Typography>` inside `<ListItemText secondary>`
- ✅ **After**: Using `<Box component="div">` with sx styling

## API Endpoints Being Used

```typescript
// Dashboard Service
GET /patients?limit=10000
GET /notes?limit=10000
GET /medications?limit=10000
GET /mtr?limit=10000

// Activity Service
GET /patients?limit=5&sort=-createdAt
GET /notes?limit=5&sort=-createdAt
GET /medications?limit=5&sort=-updatedAt
GET /mtr?limit=5&sort=-createdAt
```

## Response Structure Handling

The new `extractArrayFromResponse()` method handles these response patterns:

```typescript
// Pattern 1: Nested data
{ data: { data: [...] } }

// Pattern 2: Direct data array
{ data: [...] }

// Pattern 3: Results array
{ results: [...] }

// Pattern 4: Custom key (e.g., medications)
{ medications: [...] }

// Pattern 5: Direct array
[...]
```

## Testing Steps

1. **Check Browser Console**: Should see successful API calls
2. **Verify Chart Data**: Charts should show real counts in subtitles
3. **Check Activities**: System activities should load without errors
4. **DOM Validation**: No more nesting warnings in console

## Expected Behavior

- **If APIs return data**: Charts populate with real data
- **If APIs return 404/errors**: Charts show empty state gracefully
- **If no data exists**: Charts show zero counts but no errors
- **Activities**: Load real activities or show "No recent activities"

## Debugging

If issues persist:

1. Check browser Network tab for actual API responses
2. Verify backend API endpoints exist and return expected data
3. Check console for detailed error messages
4. Validate API authentication/permissions
