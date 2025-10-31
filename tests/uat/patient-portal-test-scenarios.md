# Patient Portal UAT Test Scenarios

## Test Scenario 1: Patient Registration and Portal Access

### Scenario Overview
**Objective**: Test patient registration and initial portal access  
**Duration**: 15-20 minutes  
**Participants**: Real patients with guidance  
**Prerequisites**: Patient has pharmacy account or registration information

### Test Steps

#### Step 1: Patient Registration (10 minutes)
**Task**: Register for patient portal access

**Actions**:
1. Navigate to patient portal registration page
2. Enter personal information (name, phone, email)
3. Verify identity with pharmacy information
4. Create password and security preferences
5. Set notification preferences
6. Complete registration

**Expected Results**:
- Registration form is clear and simple
- Identity verification works smoothly
- Password requirements are reasonable
- Confirmation is immediate and clear

**Success Criteria**:
- [ ] Registration process is straightforward
- [ ] Form validation prevents errors
- [ ] Identity verification is secure but user-friendly
- [ ] Confirmation process works correctly

**User Feedback Questions**:
1. Was the registration process easy to understand?
2. Were the required fields reasonable?
3. Did you encounter any confusing steps?
4. How would you rate the overall experience? (1-5)

---

#### Step 2: Portal Login and Navigation (5 minutes)
**Task**: Login and explore the patient portal

**Actions**:
1. Login with new credentials
2. Complete any first-time setup
3. Navigate through main portal sections
4. Review dashboard and available features
5. Update profile information if needed

**Expected Results**:
- Login process is quick and reliable
- Portal layout is intuitive and welcoming
- Available features are clearly presented
- Profile management is accessible

**Success Criteria**:
- [ ] Login works reliably
- [ ] Portal navigation is intuitive
- [ ] Feature discovery is easy
- [ ] Profile management is straightforward

**User Feedback Questions**:
1. Is the portal layout easy to understand?
2. Can you easily find what you're looking for?
3. Is the design appealing and professional?
4. Any features you expected but didn't see?

---

#### Step 3: Notification Preferences Setup (5 minutes)
**Task**: Configure notification preferences

**Actions**:
1. Navigate to notification settings
2. Select preferred communication channels
3. Set reminder timing preferences
4. Configure language preferences
5. Save settings and test notifications

**Expected Results**:
- Notification options are comprehensive
- Settings are easy to understand and modify
- Changes are saved immediately
- Test notifications work correctly

**Success Criteria**:
- [ ] Notification options meet patient needs
- [ ] Settings interface is user-friendly
- [ ] Changes are applied correctly
- [ ] Test functionality works

---

## Test Scenario 2: Online Appointment Booking

### Scenario Overview
**Objective**: Test the complete online appointment booking experience  
**Duration**: 20-25 minutes  
**Participants**: Patients  
**Prerequisites**: Patient portal access established

### Test Steps

#### Step 1: Appointment Type Selection (5 minutes)
**Task**: Browse and select appointment type

**Actions**:
1. Navigate to appointment booking
2. Review available appointment types
3. Read descriptions and requirements
4. Select appropriate appointment type
5. Proceed to scheduling

**Expected Results**:
- Appointment types are clearly described
- Information helps patients choose correctly
- Selection process is straightforward
- Descriptions include duration and preparation info

**Success Criteria**:
- [ ] Appointment types are well-explained
- [ ] Selection process is intuitive
- [ ] Information is helpful for decision-making
- [ ] Navigation flow is logical

**User Feedback Questions**:
1. Are the appointment descriptions helpful?
2. Is it clear which type you need?
3. Is any important information missing?
4. How could this step be improved?

---

#### Step 2: Date and Time Selection (10 minutes)
**Task**: Choose appointment date and time

**Actions**:
1. View available dates in calendar
2. Select preferred date
3. Review available time slots
4. Choose optimal time slot
5. Confirm selection

**Expected Results**:
- Calendar shows availability clearly
- Time slots are realistic and convenient
- Selection process is responsive
- Confirmation is immediate

**Success Criteria**:
- [ ] Calendar interface is user-friendly
- [ ] Available times are reasonable
- [ ] Selection process is smooth
- [ ] Availability information is accurate

**User Feedback Questions**:
1. Is the calendar easy to use?
2. Are there enough available time options?
3. Is the booking process fast enough?
4. Any difficulties with date/time selection?

---

#### Step 3: Appointment Details and Confirmation (10 minutes)
**Task**: Complete booking with personal details

**Actions**:
1. Review appointment summary
2. Add any special requirements or notes
3. Confirm contact information
4. Select reminder preferences
5. Complete booking
6. Review confirmation details

**Expected Results**:
- Summary is accurate and complete
- Additional options are relevant
- Confirmation is clear and comprehensive
- Booking reference is provided

**Success Criteria**:
- [ ] Booking summary is accurate
- [ ] Additional options are useful
- [ ] Confirmation process is clear
- [ ] Reference information is provided

**User Feedback Questions**:
1. Is the booking summary clear and accurate?
2. Are the additional options useful?
3. Is the confirmation information sufficient?
4. Do you feel confident about your booking?

---

## Test Scenario 3: Appointment Management

### Scenario Overview
**Objective**: Test patient appointment management capabilities  
**Duration**: 15-20 minutes  
**Participants**: Patients with existing appointments  
**Prerequisites**: At least one scheduled appointment

### Test Steps

#### Step 1: View Appointments (5 minutes)
**Task**: Review upcoming and past appointments

**Actions**:
1. Navigate to "My Appointments"
2. Review upcoming appointments
3. Check appointment details
4. View past appointment history
5. Understand appointment status meanings

**Expected Results**:
- Appointment list is clear and organized
- Details are comprehensive and accurate
- Status indicators are understandable
- History is accessible and useful

**Success Criteria**:
- [ ] Appointment display is clear
- [ ] Information is complete and accurate
- [ ] Status system is understandable
- [ ] History feature is useful

---

#### Step 2: Reschedule Appointment (10 minutes)
**Task**: Reschedule an upcoming appointment

**Actions**:
1. Select appointment to reschedule
2. Choose "Reschedule" option
3. View new available times
4. Select new date and time
5. Provide reason for change
6. Confirm rescheduling

**Expected Results**:
- Rescheduling option is easily found
- New availability is shown clearly
- Process is similar to original booking
- Confirmation includes both old and new times

**Success Criteria**:
- [ ] Rescheduling process is intuitive
- [ ] Available options are adequate
- [ ] Confirmation is clear
- [ ] Changes are reflected immediately

---

#### Step 3: Cancel Appointment (5 minutes)
**Task**: Cancel an appointment with proper notice

**Actions**:
1. Select appointment to cancel
2. Choose "Cancel" option
3. Provide cancellation reason
4. Confirm cancellation
5. Verify appointment is removed

**Expected Results**:
- Cancellation option is accessible
- Reason selection is appropriate
- Confirmation prevents accidental cancellation
- Status updates immediately

**Success Criteria**:
- [ ] Cancellation process is straightforward
- [ ] Confirmation prevents errors
- [ ] Status updates correctly
- [ ] Cancellation policy is clear

---

## Test Scenario 4: Appointment Reminders and Confirmations

### Scenario Overview
**Objective**: Test reminder system and appointment confirmations  
**Duration**: 10-15 minutes (plus waiting for reminders)  
**Participants**: Patients  
**Prerequisites**: Upcoming appointment with reminders enabled

### Test Steps

#### Step 1: Reminder Reception (Variable timing)
**Task**: Receive and respond to appointment reminders

**Actions**:
1. Wait for 24-hour reminder (or simulate)
2. Review reminder content and accuracy
3. Test confirmation link/button
4. Receive 2-hour reminder
5. Test rescheduling link if needed

**Expected Results**:
- Reminders arrive at correct times
- Content is accurate and helpful
- Links work correctly
- Multiple channels work as configured

**Success Criteria**:
- [ ] Reminders are timely and accurate
- [ ] Content is helpful and clear
- [ ] Action links work correctly
- [ ] Preferred channels are used

---

#### Step 2: Appointment Confirmation (5 minutes)
**Task**: Confirm appointment via reminder

**Actions**:
1. Click confirmation link in reminder
2. Review appointment details
3. Confirm attendance
4. Verify confirmation status
5. Check for confirmation receipt

**Expected Results**:
- Confirmation process is one-click simple
- Details are accurate and current
- Status updates immediately
- Confirmation receipt is sent

**Success Criteria**:
- [ ] Confirmation is simple and fast
- [ ] Information is accurate
- [ ] Status updates work
- [ ] Receipt provides confidence

---

#### Step 3: Last-minute Changes (5 minutes)
**Task**: Handle last-minute appointment changes

**Actions**:
1. Attempt to reschedule within 24 hours
2. Review available options
3. Contact pharmacy if needed
4. Understand cancellation policies
5. Complete any allowed changes

**Expected Results**:
- Policy restrictions are clear
- Alternative options are provided
- Contact information is accessible
- Process respects business rules

**Success Criteria**:
- [ ] Policies are clearly communicated
- [ ] Alternatives are offered when possible
- [ ] Contact options are available
- [ ] Business rules are enforced fairly

---

## Test Scenario 5: Mobile Experience Validation

### Scenario Overview
**Objective**: Validate patient portal functionality on mobile devices  
**Duration**: 20-25 minutes  
**Participants**: Patients using smartphones/tablets  
**Prerequisites**: Mobile device with internet access

### Test Steps

#### Step 1: Mobile Navigation (5 minutes)
**Task**: Navigate patient portal on mobile device

**Actions**:
1. Access portal on mobile browser
2. Test touch navigation and scrolling
3. Use mobile menu and navigation
4. Test form interactions
5. Verify responsive layout

**Expected Results**:
- Layout adapts well to mobile screen
- Touch interactions work smoothly
- Text is readable without zooming
- Navigation is thumb-friendly

**Success Criteria**:
- [ ] Mobile layout is user-friendly
- [ ] Touch interactions work well
- [ ] Text and buttons are appropriately sized
- [ ] Navigation is intuitive on mobile

---

#### Step 2: Mobile Booking Experience (10 minutes)
**Task**: Complete appointment booking on mobile

**Actions**:
1. Start booking process on mobile
2. Navigate through all booking steps
3. Use mobile date/time pickers
4. Complete forms with mobile keyboard
5. Finish booking process

**Expected Results**:
- Booking process works smoothly on mobile
- Form inputs are mobile-optimized
- Date/time selection is touch-friendly
- Process completion is reliable

**Success Criteria**:
- [ ] Mobile booking is fully functional
- [ ] Form interactions are optimized
- [ ] Date/time selection works well
- [ ] Process completes successfully

---

#### Step 3: Mobile Appointment Management (10 minutes)
**Task**: Manage appointments using mobile device

**Actions**:
1. View appointment list on mobile
2. Access appointment details
3. Test rescheduling on mobile
4. Try cancellation process
5. Verify confirmation workflows

**Expected Results**:
- All management features work on mobile
- Information is clearly displayed
- Actions are easily accessible
- Confirmations work properly

**Success Criteria**:
- [ ] All features are mobile-accessible
- [ ] Information display is optimized
- [ ] Actions are easy to perform
- [ ] Mobile experience matches desktop functionality

---

## Patient Portal UAT Completion Assessment

### Overall Experience Rating
**Rate your overall experience with the patient portal:**
- **Ease of Use**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Usefulness**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Reliability**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Mobile Experience**: ⭐⭐⭐⭐⭐ (1-5 stars)

### Feature Assessment
**Rate each feature:**
- **Registration Process**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Appointment Booking**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Appointment Management**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Reminder System**: ⭐⭐⭐⭐⭐ (1-5 stars)
- **Mobile Experience**: ⭐⭐⭐⭐⭐ (1-5 stars)

### Likelihood to Use
**How likely are you to use this patient portal regularly?**
- [ ] Very likely - I would use it for all my appointments
- [ ] Likely - I would use it most of the time
- [ ] Somewhat likely - I would use it occasionally
- [ ] Unlikely - I would prefer to call the pharmacy
- [ ] Very unlikely - I would not use this system

### Comparison to Current Process
**How does this compare to calling the pharmacy?**
- [ ] Much better - significantly more convenient
- [ ] Better - somewhat more convenient
- [ ] About the same - no significant difference
- [ ] Worse - somewhat less convenient
- [ ] Much worse - significantly less convenient

### Patient Feedback Summary

#### What did you like most about the patient portal?
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

#### What frustrated you or was difficult to use?
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

#### What features are missing that you would want?
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

#### Would you recommend this portal to other patients?
- [ ] Yes, definitely
- [ ] Yes, probably
- [ ] Maybe
- [ ] Probably not
- [ ] Definitely not

**Why?** ___________________________________________

#### Additional Comments and Suggestions
_____________________________________________________
_____________________________________________________
_____________________________________________________
_____________________________________________________

---

**Test Completed By**: ________________________  
**Date**: ________________________  
**Age Group**: ________________________  
**Tech Comfort Level**: ________________________  
**Device Used**: ________________________