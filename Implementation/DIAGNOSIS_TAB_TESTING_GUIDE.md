# Diagnosis Tab Testing Guide

## Quick Start Testing

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Navigate to Patient Profile
1. Log in to the application
2. Go to Patients list
3. Click on any patient to open their profile

### 3. Test the Diagnosis Tab
1. Look for the new "Diagnosis" tab (11th tab, after "MTR Sessions")
2. Click on the "Diagnosis" tab
3. You should see the AI Diagnostic Cases interface

## Test Scenarios

### Scenario 1: Patient with Diagnostic Cases
**Expected Behavior:**
- ✅ Summary cards show correct counts (Total, Pending Review, Completed)
- ✅ Table displays all diagnostic cases with:
  - Case ID (first 8 characters, uppercase)
  - Date Created (formatted date and time)
  - Primary Diagnosis (from AI analysis)
  - Confidence Score (color-coded chip)
  - Status (color-coded chip)
  - View action button
- ✅ Clicking on a row navigates to `/pharmacy/diagnostics/cases/all?caseId={caseId}`
- ✅ "New Diagnosis" button navigates to `/pharmacy/diagnostics/case/new`

### Scenario 2: Patient without Diagnostic Cases
**Expected Behavior:**
- ✅ Summary cards show zeros
- ✅ Info alert displays: "No diagnostic cases found for this patient. Click 'New Diagnosis' to create one."
- ✅ "New Diagnosis" button is visible and functional

### Scenario 3: Loading State
**Expected Behavior:**
- ✅ Skeleton loaders appear while fetching data
- ✅ Smooth transition to actual content

### Scenario 4: Error State
**Expected Behavior:**
- ✅ Error alert displays with appropriate message
- ✅ User can still navigate away or retry

## Visual Verification Checklist

### Layout
- [ ] Tab icon is BiotechIcon (microscope/lab icon)
- [ ] Tab label reads "Diagnosis"
- [ ] Tab is positioned after "MTR Sessions"
- [ ] Content has proper padding (p: 3)

### Summary Cards
- [ ] Three cards displayed in a row
- [ ] Cards have proper colors:
  - Total Cases: Blue (primary.50)
  - Pending Review: Orange (warning.50)
  - Completed: Green (success.50)
- [ ] Numbers are large and bold (variant="h4")
- [ ] Labels are clear (variant="body2")

### Table
- [ ] Table has proper borders (outlined variant)
- [ ] Headers are bold (fontWeight: 600)
- [ ] Rows are hoverable
- [ ] Confidence chips are color-coded:
  - Green: ≥80%
  - Orange: 60-79%
  - Default: <60%
- [ ] Status chips match status colors:
  - Completed: Green
  - Analyzing: Blue
  - Pending Review: Default
  - Failed: Red

### Interactions
- [ ] Clicking table row navigates correctly
- [ ] View icon button works
- [ ] "New Diagnosis" button works
- [ ] Hover states are visible
- [ ] Tooltips appear on icon buttons

## API Verification

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click on Diagnosis tab
4. Verify API call:
   - **URL**: `/api/diagnostics/patients/{patientId}/history`
   - **Method**: GET
   - **Status**: 200 OK
   - **Response**: Contains array of diagnostic cases

### Check Console
- [ ] No errors in console
- [ ] No warnings about missing props
- [ ] React Query cache is working (subsequent visits don't refetch)

## Integration Testing

### Test Navigation Flow
1. From Diagnosis tab, click on a case
2. Verify navigation to `/pharmacy/diagnostics/cases/all?caseId={caseId}`
3. Verify the case is highlighted/filtered on the all cases page
4. Click back button
5. Verify you return to patient profile with Diagnosis tab still active

### Test with Multiple Patients
1. Navigate to Patient A's Diagnosis tab
2. Note the cases displayed
3. Navigate to Patient B's Diagnosis tab
4. Verify only Patient B's cases are shown
5. Navigate back to Patient A
6. Verify Patient A's cases are still correct

## Performance Testing

### Check Load Times
- [ ] Initial load < 2 seconds
- [ ] Subsequent loads < 500ms (cached)
- [ ] Table renders smoothly with 10+ cases
- [ ] No layout shifts during loading

### Check Memory
- [ ] No memory leaks when switching tabs
- [ ] React Query properly cleans up queries
- [ ] No duplicate API calls

## Accessibility Testing

### Keyboard Navigation
- [ ] Can tab to "Diagnosis" tab
- [ ] Can press Enter/Space to activate tab
- [ ] Can tab through table rows
- [ ] Can activate buttons with keyboard

### Screen Reader
- [ ] Tab has proper aria-label
- [ ] Table has proper headers
- [ ] Status chips are announced correctly
- [ ] Action buttons have tooltips/labels

## Edge Cases

### Test with Special Data
- [ ] Patient with 0 cases
- [ ] Patient with 1 case
- [ ] Patient with 50+ cases
- [ ] Case with very long diagnosis name
- [ ] Case with 0% confidence
- [ ] Case with 100% confidence
- [ ] Case with missing data fields

### Test Error Scenarios
- [ ] Network disconnected (offline)
- [ ] API returns 401 (unauthorized)
- [ ] API returns 403 (forbidden)
- [ ] API returns 500 (server error)
- [ ] Invalid patient ID
- [ ] Malformed response data

## Regression Testing

### Verify Existing Functionality
- [ ] All other tabs still work correctly
- [ ] Dashboard tab loads properly
- [ ] Clinical Notes tab works
- [ ] MTR Sessions tab works
- [ ] Patient header information is correct
- [ ] Back button still works
- [ ] Edit Patient button still works
- [ ] Patient chips (DTPs, Sickle Cell) still display

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (responsive design)

## Mobile Responsiveness

Test on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Mobile-Specific Checks
- [ ] Summary cards stack vertically
- [ ] Table is scrollable horizontally
- [ ] Buttons are touch-friendly
- [ ] Text is readable without zooming

## Sign-Off Checklist

Before marking as complete:
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] No visual bugs
- [ ] Performance is acceptable
- [ ] Accessibility requirements met
- [ ] Works in all supported browsers
- [ ] Mobile responsive
- [ ] No regression in existing features
- [ ] Documentation is complete
- [ ] Code is clean and follows project conventions

## Known Limitations

Document any known issues or limitations:
- Status actions (mark for follow-up, completed, etc.) are handled in the full case view, not inline
- Pagination not implemented (all cases load at once)
- No filtering/sorting in the table
- No export functionality

## Future Enhancements

Potential improvements for future iterations:
- Add inline status change dropdowns
- Implement pagination for large case lists
- Add filtering by status, date range, diagnosis
- Add sorting by any column
- Add export to PDF/CSV functionality
- Add search functionality
- Add bulk actions (mark multiple as completed)
- Add case comparison feature
