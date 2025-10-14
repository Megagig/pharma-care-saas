# Workspace Team Management - Verification Checklist

## Pre-Testing Setup

- [ ] Backend server is running (`cd backend && npm run dev`)
- [ ] Frontend server is running (`cd frontend && npm run dev`)
- [ ] MongoDB is running and accessible
- [ ] You have a user account with `pharmacy_outlet` role
- [ ] User has an active subscription

## Login & Navigation

- [ ] Login with pharmacy_outlet user credentials
- [ ] Navigate to `/workspace/team` route
- [ ] Page loads without errors in console
- [ ] No "data is undefined" errors appear

## Statistics Cards (Top Section)

- [ ] "Total Members" card shows a number (not 0 or loading forever)
- [ ] "Active Members" card shows a number
- [ ] "Pending Approvals" card shows correct count
- [ ] "Active Invites" card shows correct count
- [ ] All cards have proper icons and styling

## Tab 1: Members

### Basic Functionality
- [ ] Tab is clickable and switches to Members view
- [ ] Member list loads without errors
- [ ] At least one member is visible (the logged-in user)
- [ ] Member cards show: avatar, name, email, role, status

### Search & Filter
- [ ] Search box is present and functional
- [ ] Can search by name
- [ ] Can search by email
- [ ] Role filter dropdown works
- [ ] Status filter dropdown works
- [ ] Clear filters button works

### Sorting
- [ ] Can sort by name (click column header)
- [ ] Can sort by role
- [ ] Can sort by status
- [ ] Can sort by joined date
- [ ] Sort direction toggles (asc/desc)

### Pagination
- [ ] Pagination controls are visible
- [ ] Can change rows per page (10, 20, 50, 100)
- [ ] Can navigate between pages
- [ ] Page numbers update correctly

### Member Actions
- [ ] Click ⋮ (more actions) button on a member
- [ ] "Assign Role" option appears
- [ ] "Suspend Member" option appears (if not owner)
- [ ] "Remove from Workspace" option appears (if not owner)
- [ ] Actions menu closes when clicking outside

## Tab 2: Pending Approvals

### Basic Functionality
- [ ] Tab is clickable and switches to Pending Approvals view
- [ ] Component loads without placeholder message
- [ ] Shows empty state if no pending members
- [ ] Shows list if pending members exist

### Pending Members List (if any exist)
- [ ] Each pending member shows: avatar, name, email, role, date
- [ ] Checkbox for each member works
- [ ] "Select All" checkbox works
- [ ] Approve button is visible
- [ ] Reject button is visible

### Individual Actions
- [ ] Click "Approve" on a member
- [ ] Confirmation or success message appears
- [ ] Member moves to active members list
- [ ] Pending count decreases
- [ ] Click "Reject" on a member
- [ ] Rejection reason dialog appears
- [ ] Can enter optional reason
- [ ] Member is rejected successfully

### Bulk Actions
- [ ] Select multiple members with checkboxes
- [ ] Bulk action bar appears showing count
- [ ] "Approve Selected" button works
- [ ] "Reject Selected" button works
- [ ] Confirmation dialog appears for bulk actions

## Tab 3: Invite Links

### Invite Generator
- [ ] Tab is clickable and switches to Invite Links view
- [ ] Invite generator form is visible at top
- [ ] Email field is present and validates
- [ ] Role dropdown has all roles
- [ ] Expiration days field (1-30)
- [ ] Max uses field (1-100)
- [ ] "Requires Approval" checkbox
- [ ] Personal message textarea
- [ ] "Generate Invite" button is clickable

### Generate Invite
- [ ] Fill in email (e.g., test@example.com)
- [ ] Select role (e.g., Staff)
- [ ] Set expiration (e.g., 7 days)
- [ ] Click "Generate Invite"
- [ ] Success message appears
- [ ] Invite appears in list below
- [ ] Active invites count increases

### Invite List
- [ ] List of invites is visible
- [ ] Each invite shows: email, role, status, expiration, usage
- [ ] Copy link button (📋) is visible for pending invites
- [ ] Click copy button
- [ ] "Copied!" tooltip or message appears
- [ ] Invite URL is in clipboard
- [ ] Revoke button (🗑) is visible for pending invites
- [ ] Click revoke button
- [ ] Confirmation dialog appears
- [ ] Invite status changes to "revoked"

### Invite Status
- [ ] Pending invites show "Pending" badge (blue)
- [ ] Accepted invites show "Accepted" badge (green)
- [ ] Expired invites show "Expired" badge (orange)
- [ ] Revoked invites show "Revoked" badge (gray)

### Pagination
- [ ] Pagination works if more than 20 invites
- [ ] Can change rows per page
- [ ] Can navigate between pages

## Tab 4: Audit Trail

### Basic Functionality
- [ ] Tab is clickable and switches to Audit Trail view
- [ ] Component loads without placeholder message
- [ ] Audit log list is visible
- [ ] Shows empty state if no logs exist
- [ ] Shows logs if any exist

### Filters
- [ ] Start date picker is present
- [ ] End date picker is present
- [ ] Category dropdown is present (Member, Role, Permission, etc.)
- [ ] Action text field is present
- [ ] "Clear" button works
- [ ] "Export CSV" button is visible

### Audit Log List
- [ ] Each log shows: timestamp, actor, category, action, target
- [ ] Severity badges are color-coded
- [ ] Category badges are color-coded
- [ ] Expandable details button (▼) is visible

### Log Details
- [ ] Click expand button on a log
- [ ] Details section expands
- [ ] Shows "Before" and "After" values (if applicable)
- [ ] Shows reason (if applicable)
- [ ] Shows metadata (if applicable)
- [ ] Shows IP address
- [ ] Shows user agent
- [ ] Click expand button again to collapse

### Filtering
- [ ] Select date range
- [ ] Logs filter by date
- [ ] Select category
- [ ] Logs filter by category
- [ ] Enter action text
- [ ] Logs filter by action
- [ ] Clear filters resets all

### Export
- [ ] Click "Export CSV" button
- [ ] File download starts
- [ ] CSV file contains audit logs
- [ ] CSV has proper headers
- [ ] CSV data matches displayed logs

### Pagination
- [ ] Pagination works if more than 20 logs
- [ ] Can change rows per page
- [ ] Can navigate between pages

## Integration Tests

### Complete Workflow: Invite → Approve → Manage
1. [ ] Generate an invite link (Invite Links tab)
2. [ ] Copy the invite URL
3. [ ] Open invite URL in incognito/private window
4. [ ] Register a new user with the invite
5. [ ] Return to workspace team page
6. [ ] See new pending approval (Pending Approvals tab)
7. [ ] Pending Approvals count increased by 1
8. [ ] Approve the pending member
9. [ ] Member appears in Members tab
10. [ ] Active Members count increased by 1
11. [ ] Check Audit Trail tab
12. [ ] See "invite_generated" log entry
13. [ ] See "member_approved" log entry

### Role Change Workflow
1. [ ] Go to Members tab
2. [ ] Click ⋮ on a member (not yourself)
3. [ ] Click "Assign Role"
4. [ ] Role assignment dialog opens
5. [ ] Select new role
6. [ ] Enter reason (optional)
7. [ ] Click "Save"
8. [ ] Success message appears
9. [ ] Member's role updates in list
10. [ ] Go to Audit Trail tab
11. [ ] See "role_changed" log entry
12. [ ] Expand log to see before/after values

### Suspend/Activate Workflow
1. [ ] Go to Members tab
2. [ ] Click ⋮ on an active member
3. [ ] Click "Suspend Member"
4. [ ] Suspension dialog opens
5. [ ] Enter suspension reason
6. [ ] Click "Suspend"
7. [ ] Member status changes to "Suspended"
8. [ ] Active Members count decreases
9. [ ] Click ⋮ on suspended member
10. [ ] Click "Activate Member"
11. [ ] Member status changes to "Active"
12. [ ] Active Members count increases
13. [ ] Check Audit Trail for both actions

## Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to load members
- [ ] Error message appears
- [ ] Reconnect internet
- [ ] Retry works

### Invalid Actions
- [ ] Try to suspend yourself (should fail)
- [ ] Try to remove yourself (should fail)
- [ ] Try to approve already approved member (should fail)
- [ ] Try to use expired invite (should fail)

### Validation
- [ ] Try to generate invite with invalid email
- [ ] Validation error appears
- [ ] Try to set expiration > 30 days
- [ ] Validation error appears
- [ ] Try to set max uses > 100
- [ ] Validation error appears

## Performance

- [ ] Page loads in < 2 seconds
- [ ] Tab switching is instant
- [ ] Search/filter is responsive
- [ ] No lag when scrolling lists
- [ ] Pagination is smooth
- [ ] No memory leaks (check dev tools)

## Mobile Responsiveness

- [ ] Open on mobile device or resize browser
- [ ] Statistics cards stack vertically
- [ ] Tabs become scrollable
- [ ] Tables are horizontally scrollable
- [ ] Forms are usable on mobile
- [ ] Buttons are touch-friendly

## Accessibility

- [ ] Can navigate with keyboard (Tab key)
- [ ] Can activate buttons with Enter/Space
- [ ] Screen reader announces elements correctly
- [ ] Color contrast is sufficient
- [ ] Focus indicators are visible
- [ ] ARIA labels are present

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

## Final Checks

- [ ] No console errors
- [ ] No console warnings (or only expected ones)
- [ ] No network errors in Network tab
- [ ] All images/icons load
- [ ] All fonts load
- [ ] Styling looks correct
- [ ] No layout shifts
- [ ] No broken links

## Documentation

- [ ] Read WORKSPACE_TEAM_BUGS_FIXED.md
- [ ] Read WORKSPACE_TEAM_VISUAL_GUIDE.md
- [ ] Read QUICK_FIX_SUMMARY.md
- [ ] Understand the changes made
- [ ] Know how to troubleshoot issues

---

## Sign-Off

**Tester Name**: ___________________
**Date**: ___________________
**Status**: ⬜ Pass ⬜ Fail
**Notes**: 
___________________________________________
___________________________________________
___________________________________________

## Issues Found

If any issues are found, document them here:

1. **Issue**: 
   **Steps to Reproduce**: 
   **Expected**: 
   **Actual**: 
   **Severity**: ⬜ Critical ⬜ High ⬜ Medium ⬜ Low

2. **Issue**: 
   **Steps to Reproduce**: 
   **Expected**: 
   **Actual**: 
   **Severity**: ⬜ Critical ⬜ High ⬜ Medium ⬜ Low

---

**Overall Result**: 
- ⬜ All tests passed - Ready for production
- ⬜ Minor issues found - Can deploy with fixes
- ⬜ Major issues found - Needs more work
- ⬜ Critical issues found - Do not deploy
