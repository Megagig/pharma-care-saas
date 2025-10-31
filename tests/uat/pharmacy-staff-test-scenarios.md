# Pharmacy Staff UAT Test Scenarios

## Test Scenario 1: Daily Appointment Management

### Scenario Overview
**Objective**: Validate the daily appointment workflow for pharmacy staff  
**Duration**: 30-45 minutes  
**Participants**: Pharmacists and pharmacy managers  
**Prerequisites**: User logged in with appropriate permissions

### Test Steps

#### Step 1: Morning Dashboard Review (5 minutes)
**Task**: Review today's appointments and alerts

**Actions**:
1. Login to the system
2. Navigate to the main dashboard
3. Review today's appointment summary
4. Check for any urgent alerts or notifications
5. Review overdue follow-up tasks

**Expected Results**:
- Dashboard loads within 3 seconds
- Today's appointments are clearly displayed
- Alerts are prominently shown with appropriate priority
- Overdue tasks are highlighted

**Success Criteria**:
- [ ] Dashboard information is accurate and up-to-date
- [ ] Visual hierarchy makes important information obvious
- [ ] No loading errors or missing data
- [ ] Mobile view is functional and readable

**User Feedback Questions**:
1. Is the dashboard information layout intuitive?
2. Can you quickly identify urgent items?
3. Is any important information missing?
4. How would you rate the visual design? (1-5)

---

#### Step 2: Appointment Calendar Navigation (10 minutes)
**Task**: Navigate and interact with the appointment calendar

**Actions**:
1. Open the appointment calendar
2. Switch between day, week, and month views
3. Navigate to different dates
4. Filter appointments by type or pharmacist
5. Click on an appointment to view details

**Expected Results**:
- Calendar loads quickly and displays appointments correctly
- View switching is smooth and intuitive
- Appointment details are comprehensive and accurate
- Filtering works as expected

**Success Criteria**:
- [ ] Calendar is responsive and performs well
- [ ] All appointment information is visible and accurate
- [ ] Navigation between views is intuitive
- [ ] Filtering helps manage information overload

**User Feedback Questions**:
1. Is the calendar easy to navigate?
2. Are the different views useful for your workflow?
3. Is the appointment information sufficient?
4. Any suggestions for improvement?

---

#### Step 3: Patient Check-in Process (10 minutes)
**Task**: Check in a patient for their appointment

**Actions**:
1. Locate today's first appointment
2. Click on the appointment to open details
3. Update appointment status to "in_progress"
4. Add any pre-appointment notes
5. Verify patient information is current

**Expected Results**:
- Appointment status updates immediately
- Patient information is complete and accessible
- Status change is reflected across the system
- Notes are saved successfully

**Success Criteria**:
- [ ] Check-in process is quick and straightforward
- [ ] Patient information is easily accessible
- [ ] Status updates work reliably
- [ ] Interface provides clear feedback

**User Feedback Questions**:
1. Is the check-in process efficient?
2. Is patient information easily accessible?
3. Are there any missing features you need?
4. How could this process be improved?

---

#### Step 4: Appointment Completion (15 minutes)
**Task**: Complete an appointment and document outcomes

**Actions**:
1. Open an in-progress appointment
2. Complete the appointment with outcome notes
3. Select appropriate completion status
4. Add next actions or recommendations
5. Create a follow-up task if needed
6. Optionally create a visit record

**Expected Results**:
- Completion form is comprehensive but not overwhelming
- All required fields are clearly marked
- Follow-up creation is seamless
- Visit creation integration works properly

**Success Criteria**:
- [ ] Completion workflow is logical and complete
- [ ] Form validation prevents errors
- [ ] Integration with other modules works
- [ ] Documentation is thorough but efficient

**User Feedback Questions**:
1. Is the completion form comprehensive enough?
2. Is the workflow logical and efficient?
3. Are the integration features useful?
4. What additional features would be helpful?

---

#### Step 5: Appointment Rescheduling (10 minutes)
**Task**: Reschedule an appointment due to delays

**Actions**:
1. Select an upcoming appointment
2. Open the reschedule dialog
3. Choose a new date and time
4. Add a reason for rescheduling
5. Confirm the change
6. Verify patient notification is sent

**Expected Results**:
- Available slots are shown accurately
- Rescheduling is quick and easy
- Patient notifications are sent automatically
- Calendar updates immediately

**Success Criteria**:
- [ ] Rescheduling process is intuitive
- [ ] Available slots are accurate
- [ ] Notifications work as expected
- [ ] Changes are reflected immediately

**User Feedback Questions**:
1. Is rescheduling easy to accomplish?
2. Are available time slots accurate?
3. Is the notification system reliable?
4. Any improvements needed for this workflow?

---

### Scenario Completion Assessment

#### Time Tracking
- **Expected Total Time**: 45 minutes
- **Actual Time Taken**: _____ minutes
- **Time Efficiency Rating**: ⭐⭐⭐⭐⭐ (1-5 stars)

#### Overall Usability Rating
- **Ease of Use**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Feature Completeness**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Performance**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Mobile Experience**: ⭐⭐⭐⭐⭐ (1-5 stars)

#### Critical Issues Identified
- [ ] **Issue 1**: ________________________________
- [ ] **Issue 2**: ________________________________
- [ ] **Issue 3**: ________________________________

#### Suggestions for Improvement
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

---

## Test Scenario 2: Follow-up Task Management

### Scenario Overview
**Objective**: Test the follow-up task creation, management, and completion workflow  
**Duration**: 25-35 minutes  
**Participants**: Pharmacists  
**Prerequisites**: Access to follow-up task management features

### Test Steps

#### Step 1: Follow-up Task Dashboard (5 minutes)
**Task**: Review and prioritize follow-up tasks

**Actions**:
1. Navigate to follow-up task dashboard
2. Review task summary statistics
3. Filter tasks by priority and due date
4. Sort tasks by different criteria
5. Identify overdue tasks

**Expected Results**:
- Dashboard provides clear overview of task status
- Filtering and sorting work effectively
- Overdue tasks are clearly highlighted
- Statistics are accurate and helpful

**Success Criteria**:
- [ ] Task overview is comprehensive and clear
- [ ] Filtering helps manage workload
- [ ] Priority system is effective
- [ ] Overdue tasks are obvious

---

#### Step 2: Manual Follow-up Creation (10 minutes)
**Task**: Create a follow-up task for a patient

**Actions**:
1. Click "Create Follow-up Task"
2. Select patient from autocomplete
3. Choose follow-up type and priority
4. Set due date and assign to pharmacist
5. Add description and objectives
6. Save the task

**Expected Results**:
- Form is intuitive and comprehensive
- Patient selection is efficient
- All required fields are clear
- Task is created successfully

**Success Criteria**:
- [ ] Creation process is straightforward
- [ ] Form validation prevents errors
- [ ] Patient selection is efficient
- [ ] All necessary fields are available

---

#### Step 3: Follow-up Task Completion (10 minutes)
**Task**: Complete a follow-up task with patient contact

**Actions**:
1. Select a pending follow-up task
2. Open task details and review objectives
3. Mark task as in-progress
4. Complete the task with outcome notes
5. Select completion status
6. Add next actions if needed

**Expected Results**:
- Task details are comprehensive
- Completion workflow is logical
- Outcome documentation is thorough
- Status updates work correctly

**Success Criteria**:
- [ ] Task information is complete and helpful
- [ ] Completion workflow is efficient
- [ ] Documentation captures necessary details
- [ ] Status tracking works reliably

---

#### Step 4: Convert Follow-up to Appointment (10 minutes)
**Task**: Convert a follow-up task to a scheduled appointment

**Actions**:
1. Select a follow-up task that needs an appointment
2. Click "Convert to Appointment"
3. Choose appointment type and duration
4. Select available date and time
5. Confirm the conversion
6. Verify both records are linked

**Expected Results**:
- Conversion process is seamless
- Available slots are accurate
- Both records are properly linked
- Patient is notified of new appointment

**Success Criteria**:
- [ ] Conversion workflow is intuitive
- [ ] Scheduling integration works well
- [ ] Record linking is maintained
- [ ] Notifications are sent appropriately

---

### Scenario Completion Assessment

#### Time Tracking
- **Expected Total Time**: 35 minutes
- **Actual Time Taken**: _____ minutes
- **Efficiency Rating**: ⭐⭐⭐⭐⭐ (1-5 stars)

#### Workflow Assessment
- **Task Creation**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Task Management**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Task Completion**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Integration Features**: ⭐⭐⭐⭐⭐ (1-5 stars)

---

## Test Scenario 3: Schedule and Capacity Management

### Scenario Overview
**Objective**: Test pharmacist schedule management and capacity optimization  
**Duration**: 20-30 minutes  
**Participants**: Pharmacy managers and pharmacists  
**Prerequisites**: Schedule management permissions

### Test Steps

#### Step 1: Schedule Configuration (10 minutes)
**Task**: Update pharmacist working hours and preferences

**Actions**:
1. Navigate to schedule management
2. Update working hours for the week
3. Set break times and preferences
4. Configure appointment types handled
5. Set maximum appointments per day
6. Save schedule changes

**Expected Results**:
- Schedule interface is intuitive
- Changes are saved correctly
- Calendar reflects updates immediately
- Capacity calculations update automatically

**Success Criteria**:
- [ ] Schedule editing is user-friendly
- [ ] Changes are applied immediately
- [ ] Capacity calculations are accurate
- [ ] Interface provides clear feedback

---

#### Step 2: Time-off Request (10 minutes)
**Task**: Request time off and manage conflicts

**Actions**:
1. Submit a time-off request
2. Review affected appointments
3. Suggest rescheduling options
4. Approve/manage the request
5. Verify calendar blocks the time

**Expected Results**:
- Time-off process is straightforward
- Conflicts are identified automatically
- Rescheduling suggestions are helpful
- Calendar updates correctly

**Success Criteria**:
- [ ] Time-off workflow is efficient
- [ ] Conflict detection works well
- [ ] Rescheduling options are practical
- [ ] Calendar management is reliable

---

#### Step 3: Capacity Analysis (10 minutes)
**Task**: Review capacity utilization and optimization

**Actions**:
1. Open capacity utilization dashboard
2. Review utilization by pharmacist
3. Identify peak times and bottlenecks
4. Review optimization recommendations
5. Export capacity report

**Expected Results**:
- Capacity data is accurate and insightful
- Visualizations are clear and helpful
- Recommendations are actionable
- Reports export successfully

**Success Criteria**:
- [ ] Capacity analytics are meaningful
- [ ] Visualizations aid understanding
- [ ] Recommendations are practical
- [ ] Reporting features work well

---

### Overall UAT Session Feedback

#### System Performance
- **Loading Speed**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Responsiveness**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Reliability**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Mobile Experience**: ⭐⭐⭐⭐⭐ (1-5 stars)

#### Feature Assessment
- **Appointment Management**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Follow-up Workflows**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Schedule Management**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Integration Quality**: ⭐⭐⭐⭐⭐ (1-5 stars)

#### Business Impact
- **Workflow Efficiency**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Patient Experience**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Data Quality**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Overall Value**: ⭐⭐⭐⭐⭐ (1-5 stars)

#### Final Recommendations
**Would you recommend this system for production use?**
- [ ] Yes, ready for deployment
- [ ] Yes, with minor fixes
- [ ] No, needs significant improvements
- [ ] No, major redesign required

**Top 3 Strengths:**
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

**Top 3 Areas for Improvement:**
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

**Additional Comments:**
_____________________________________________________
_____________________________________________________
_____________________________________________________

---

**Test Completed By**: ________________________  
**Date**: ________________________  
**Role**: ________________________  
**Experience Level**: ________________________