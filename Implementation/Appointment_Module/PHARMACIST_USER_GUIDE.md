# Pharmacist User Guide - Patient Engagement & Follow-up Management

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Appointments](#managing-appointments)
4. [Follow-up Task Management](#follow-up-task-management)
5. [Calendar Management](#calendar-management)
6. [Patient Communication](#patient-communication)
7. [Reporting and Analytics](#reporting-and-analytics)
8. [Mobile Usage](#mobile-usage)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Getting Started

### System Requirements

- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 13+ or Android 8+
- **Internet**: Stable internet connection required
- **Screen Resolution**: Minimum 1024x768 (desktop), responsive on mobile

### Logging In

1. Navigate to your PharmacyCopilot URL
2. Enter your username and password
3. Click "Sign In"
4. You'll be redirected to the main dashboard

### First-Time Setup

When you first access the Patient Engagement module:

1. **Set Your Schedule**: Go to Settings > My Schedule to configure your working hours
2. **Configure Preferences**: Set your default appointment duration and types you handle
3. **Review Notifications**: Ensure your notification preferences are set correctly

## Dashboard Overview

### Main Dashboard

The Patient Engagement dashboard provides a comprehensive view of your daily activities:

![Dashboard Screenshot](./images/pharmacist-dashboard.png)

#### Key Sections:

1. **Today's Summary**
   - Total appointments scheduled
   - Completed appointments
   - Pending follow-up tasks
   - Overdue tasks requiring attention

2. **Quick Actions**
   - Schedule New Appointment
   - Create Follow-up Task
   - View Calendar
   - Patient Search

3. **Alerts and Notifications**
   - Overdue follow-up tasks
   - Upcoming appointments (next 2 hours)
   - Patient alerts (missed appointments, adherence issues)
   - System notifications

4. **Recent Activity**
   - Recently completed appointments
   - New follow-up tasks assigned to you
   - Patient confirmations and cancellations

### Navigation Menu

- **Calendar**: View and manage your appointment schedule
- **Follow-ups**: Manage follow-up tasks and patient care
- **Patients**: Access patient records and history
- **Reports**: View analytics and generate reports
- **Settings**: Configure your preferences and schedule

## Managing Appointments

### Creating a New Appointment

1. **From Dashboard**: Click "Schedule New Appointment"
2. **From Calendar**: Click on an available time slot
3. **From Patient Record**: Click "Schedule Appointment" in patient details

#### Step-by-Step Process:

1. **Select Patient**
   - Search by name, phone, or patient ID
   - Select from recent patients
   - Create new patient if needed

2. **Choose Appointment Type**
   - MTM Session (30-60 minutes)
   - Chronic Disease Review (30 minutes)
   - New Medication Consultation (20 minutes)
   - Vaccination (15 minutes)
   - Health Check (15 minutes)
   - Smoking Cessation (45 minutes)
   - General Follow-up (20 minutes)

3. **Set Date and Time**
   - Use calendar picker for date
   - Select from available time slots
   - System shows conflicts automatically

4. **Add Details**
   - Appointment description/notes
   - Special requirements
   - Estimated duration (if different from default)

5. **Configure Reminders**
   - Email reminder (24 hours before)
   - SMS reminder (2 hours before)
   - Push notification (15 minutes before)

6. **Save Appointment**
   - Review all details
   - Click "Create Appointment"
   - Confirmation sent to patient automatically

### Managing Existing Appointments

#### Viewing Appointment Details

Click on any appointment in the calendar to view:
- Patient information and contact details
- Appointment type and duration
- Notes and special requirements
- Reminder history
- Related clinical records

#### Updating Appointment Status

**Confirming Appointments:**
1. Click on appointment
2. Select "Mark as Confirmed"
3. Add confirmation notes if needed

**Starting Appointments:**
1. Click "Start Appointment" when patient arrives
2. Status changes to "In Progress"
3. Timer starts for duration tracking

**Completing Appointments:**
1. Click "Complete Appointment"
2. Select outcome: Successful, Partially Successful, Unsuccessful
3. Add detailed notes about the session
4. Specify next actions:
   - Schedule follow-up appointment
   - Create follow-up task
   - Create visit record
   - No further action needed

**Handling No-Shows:**
1. Wait 15 minutes past appointment time
2. Click "Mark as No-Show"
3. System automatically creates follow-up task
4. Patient receives notification about missed appointment

#### Rescheduling Appointments

1. Click on appointment to reschedule
2. Select "Reschedule"
3. Choose new date and time from available slots
4. Add reason for rescheduling
5. Choose whether to notify patient
6. Confirm changes

**Rescheduling Recurring Appointments:**
- **This appointment only**: Changes just the selected instance
- **This and future appointments**: Updates the entire series from this point

#### Cancelling Appointments

1. Click on appointment
2. Select "Cancel Appointment"
3. Choose cancellation reason:
   - Patient requested
   - Pharmacist unavailable
   - Emergency
   - Other (specify)
4. Choose whether to notify patient
5. For recurring appointments, choose scope of cancellation

### Recurring Appointments

#### Setting Up Recurring Appointments

1. Create appointment as normal
2. Check "Make this a recurring appointment"
3. Configure recurrence pattern:
   - **Frequency**: Daily, Weekly, Bi-weekly, Monthly, Quarterly
   - **End condition**: End date or number of occurrences
   - **Days of week** (for weekly patterns)
   - **Day of month** (for monthly patterns)

#### Managing Recurring Series

- **View all instances**: Click "View Series" on any recurring appointment
- **Modify single instance**: Make changes to one appointment only
- **Modify series**: Update all future appointments in the series
- **Cancel series**: End the recurring pattern from a specific date

### Appointment Types and Best Practices

#### MTM Session (Medication Therapy Management)
- **Duration**: 30-60 minutes
- **Preparation**: Review patient's medication list, recent lab results
- **Focus**: Medication effectiveness, side effects, adherence
- **Follow-up**: Usually 3-6 months for stable patients

#### Chronic Disease Review
- **Duration**: 30 minutes
- **Conditions**: Diabetes, hypertension, COPD, heart disease
- **Preparation**: Review recent vitals, lab results, medication changes
- **Focus**: Disease management, lifestyle counseling, medication optimization

#### New Medication Consultation
- **Duration**: 20 minutes
- **Trigger**: New prescription, especially high-risk medications
- **Focus**: Proper usage, side effects, interactions, monitoring requirements
- **Follow-up**: 1-2 weeks for high-risk medications

## Follow-up Task Management

### Understanding Follow-up Tasks

Follow-up tasks are systematic reminders to check on patients based on clinical triggers or scheduled monitoring. They help ensure no patient falls through the cracks.

### Types of Follow-up Tasks

1. **Medication Start Follow-up**
   - Triggered when high-risk medications are prescribed
   - Examples: Warfarin, insulin, immunosuppressants
   - Timeline: 7-14 days after start

2. **Lab Result Review**
   - Triggered by abnormal lab values
   - Priority based on severity of abnormality
   - Timeline: 1-3 days depending on urgency

3. **Hospital Discharge Follow-up**
   - Triggered when patient is discharged
   - Focus: Medication reconciliation, adherence
   - Timeline: 48-72 hours post-discharge

4. **Chronic Disease Monitoring**
   - Scheduled based on condition stability
   - Stable patients: Every 3 months
   - Unstable patients: Monthly or more frequent

5. **Adherence Check**
   - For patients with poor adherence history
   - Triggered by missed refills or low PDC scores
   - Timeline: Weekly to monthly

### Managing Your Follow-up Queue

#### Accessing Follow-up Tasks

1. Navigate to "Follow-ups" in the main menu
2. View tasks by:
   - **All Tasks**: Complete list with filters
   - **Due Today**: Tasks due today
   - **Overdue**: Past due tasks requiring immediate attention
   - **By Priority**: Critical, High, Medium, Low
   - **By Patient**: All tasks for a specific patient

#### Task Priority System

- **Critical**: Immediate attention required (red)
- **High**: Address within 24 hours (orange)
- **Medium**: Address within 3 days (yellow)
- **Low**: Address within 1 week (green)

#### Processing Follow-up Tasks

**Step 1: Review Task Details**
- Patient information and contact details
- Task type and trigger event
- Objectives and expected outcomes
- Related clinical records

**Step 2: Contact Patient**
- Phone call (preferred for urgent tasks)
- Secure message through patient portal
- Email (for non-urgent communications)
- Schedule appointment if needed

**Step 3: Document Outcome**
- **Successful**: Objectives met, no further action needed
- **Partially Successful**: Some objectives met, additional follow-up required
- **Unsuccessful**: Unable to reach patient or objectives not met

**Step 4: Next Actions**
- Mark task as complete
- Create new follow-up task
- Schedule appointment
- Escalate to supervisor
- Create clinical intervention

#### Converting Tasks to Appointments

When a follow-up task requires in-person consultation:

1. Click "Convert to Appointment" on the task
2. Select appointment type and duration
3. Choose available time slot
4. Task automatically links to appointment
5. Patient receives appointment confirmation

### Automated Follow-up Creation

The system automatically creates follow-up tasks based on:

#### Clinical Triggers
- New high-risk medication prescriptions
- Abnormal lab results
- Hospital discharge notifications
- Medication therapy changes
- Missed appointments

#### Scheduled Monitoring
- Chronic disease patients (diabetes, hypertension, etc.)
- Patients on monitoring-required medications
- Post-intervention follow-ups
- Preventive care reminders

### Follow-up Task Analytics

Track your follow-up performance:
- **Completion Rate**: Percentage of tasks completed on time
- **Average Response Time**: How quickly you address tasks
- **Patient Outcomes**: Success rates by task type
- **Workload Distribution**: Tasks by priority and type

## Calendar Management

### Calendar Views

#### Day View
- Detailed hourly schedule
- Shows appointment details and patient names
- Best for managing daily workflow
- Displays breaks and blocked time

#### Week View
- 7-day overview of appointments
- Good for weekly planning
- Shows appointment density and availability
- Identifies busy periods

#### Month View
- High-level overview of the month
- Shows appointment count per day
- Useful for long-term planning
- Identifies patterns and trends

### Calendar Features

#### Color Coding
- **Blue**: MTM Sessions
- **Green**: Health Checks
- **Orange**: Chronic Disease Reviews
- **Red**: Urgent/Critical appointments
- **Purple**: Vaccinations
- **Gray**: Blocked time/breaks

#### Drag and Drop
- Reschedule appointments by dragging to new time slots
- System checks for conflicts automatically
- Patient notifications sent automatically

#### Quick Actions
- **Right-click** on appointment for context menu
- **Double-click** to view appointment details
- **Click empty slot** to create new appointment

### Managing Your Schedule

#### Setting Working Hours

1. Go to Settings > My Schedule
2. Configure for each day of the week:
   - Start time and end time
   - Break periods
   - Lunch break
   - Non-working days

3. Set appointment preferences:
   - Maximum appointments per day
   - Default appointment duration
   - Buffer time between appointments
   - Types of appointments you handle

#### Blocking Time

Block time for non-patient activities:

1. Click on time slot in calendar
2. Select "Block Time"
3. Choose reason:
   - Administrative work
   - Training/education
   - Meetings
   - Personal time
4. Add notes if needed

#### Time Off Requests

1. Go to Settings > Time Off
2. Click "Request Time Off"
3. Select dates and type:
   - Vacation
   - Sick leave
   - Training
   - Personal
4. Add reason and notes
5. Submit for approval

**Impact on Appointments:**
- System shows affected appointments
- Suggests rescheduling options
- Notifies patients of changes

### Capacity Management

#### Monitoring Utilization
- View utilization percentage by day/week
- Identify underutilized time slots
- Track appointment-to-capacity ratio

#### Optimizing Schedule
- **Peak Times**: Schedule shorter appointments during busy periods
- **Slow Times**: Use for administrative tasks or longer consultations
- **Buffer Time**: Leave gaps for urgent appointments or delays

## Patient Communication

### Communication Channels

#### Automated Reminders
- **24 hours before**: Email with appointment details
- **2 hours before**: SMS reminder
- **15 minutes before**: Push notification (if app installed)

#### Manual Communications
- **Phone calls**: For urgent matters or complex discussions
- **Secure messaging**: Through patient portal
- **Email**: For non-urgent information sharing

### Reminder Management

#### Customizing Reminder Templates

1. Go to Settings > Reminder Templates
2. Select template to modify
3. Customize message content:
   - Use placeholders: {{patientName}}, {{appointmentDate}}, {{pharmacyName}}
   - Add pharmacy-specific information
   - Include preparation instructions

#### Managing Reminder Preferences

**Per Patient:**
- Set preferred communication channel
- Adjust reminder timing
- Add special instructions

**Per Appointment Type:**
- Different reminder schedules
- Type-specific preparation instructions
- Channel preferences by urgency

### Patient Portal Integration

#### Patient Self-Service Features
- View upcoming appointments
- Reschedule appointments (up to 24 hours before)
- Cancel appointments
- Confirm appointments
- Update contact information
- Set communication preferences

#### Pharmacist Benefits
- Reduced phone calls for routine requests
- Automatic confirmation tracking
- Patient-initiated rescheduling
- Updated contact information

### Handling Patient Responses

#### Appointment Confirmations
- Automatic status update when patient confirms
- Dashboard notification of confirmations
- Follow-up for unconfirmed appointments

#### Rescheduling Requests
- Patient requests appear in your task queue
- Review and approve new time slots
- System handles notification and calendar updates

#### Cancellations
- Automatic calendar update
- Opportunity to offer alternative dates
- Follow-up task creation for important appointments

## Reporting and Analytics

### Dashboard Analytics

#### Key Performance Indicators (KPIs)
- **Appointment Completion Rate**: Target >90%
- **No-Show Rate**: Target <10%
- **Follow-up Task Completion**: Target >95%
- **Patient Satisfaction**: Based on feedback scores
- **Utilization Rate**: Percentage of available slots booked

#### Real-Time Metrics
- Today's appointments (scheduled vs. completed)
- Pending follow-up tasks by priority
- Overdue tasks requiring attention
- Patient alerts and notifications

### Detailed Reports

#### Appointment Analytics
- **Time Period**: Daily, weekly, monthly, quarterly
- **Metrics**:
  - Total appointments by type
  - Completion rates by appointment type
  - Average appointment duration
  - Peak appointment times
  - Patient demographics

#### Follow-up Performance
- **Completion Rates**: By task type and priority
- **Response Times**: Average time to complete tasks
- **Outcomes**: Success rates by task category
- **Workload**: Task distribution over time

#### Patient Engagement
- **Appointment Frequency**: How often patients schedule
- **Adherence Improvement**: Before/after engagement metrics
- **Communication Effectiveness**: Response rates by channel
- **Patient Satisfaction**: Feedback scores and comments

### Generating Reports

#### Standard Reports
1. Go to Reports > Patient Engagement
2. Select report type:
   - Appointment Summary
   - Follow-up Performance
   - Patient Engagement Metrics
   - Reminder Effectiveness
3. Choose date range
4. Apply filters (pharmacist, location, patient type)
5. Generate and download (PDF, Excel, CSV)

#### Custom Reports
1. Use Report Builder for custom metrics
2. Select data sources and fields
3. Apply filters and grouping
4. Save report template for future use
5. Schedule automatic generation and delivery

### Using Analytics for Improvement

#### Identifying Trends
- **Seasonal Patterns**: Appointment volume by time of year
- **Day-of-Week Patterns**: Busiest and slowest days
- **Time-of-Day Patterns**: Peak appointment hours
- **Patient Behavior**: Preferred appointment types and times

#### Performance Optimization
- **Schedule Adjustments**: Based on demand patterns
- **Capacity Planning**: Adding or reducing available slots
- **Process Improvements**: Streamlining high-volume activities
- **Training Needs**: Areas where performance can be improved

## Mobile Usage

### Mobile App Features

The PharmacyCopilot mobile app provides full functionality for pharmacists on the go:

#### Core Features
- View daily schedule and appointments
- Access patient information
- Manage follow-up tasks
- Receive push notifications
- Quick appointment actions (confirm, reschedule, complete)

#### Mobile-Optimized Interface
- **Swipe Actions**: Swipe left/right on appointments for quick actions
- **Touch-Friendly**: Large buttons and touch targets
- **Offline Capability**: View cached data when offline
- **Voice Input**: Dictate notes and observations

### Mobile Workflows

#### Starting Your Day
1. Open app and review today's schedule
2. Check for overnight notifications
3. Review patient alerts and follow-up tasks
4. Prepare for first appointment

#### During Appointments
1. Mark appointment as "In Progress"
2. Access patient records and history
3. Take notes using voice input
4. Complete appointment with outcome

#### Between Appointments
1. Process follow-up tasks
2. Return patient calls
3. Review upcoming appointments
4. Handle urgent notifications

#### End of Day
1. Complete any pending appointments
2. Review and complete follow-up tasks
3. Check tomorrow's schedule
4. Respond to patient messages

### Mobile Best Practices

#### Battery Management
- Enable battery optimization for the app
- Use Wi-Fi when available to reduce data usage
- Close app when not in use to preserve battery

#### Data Security
- Always lock your device with PIN/biometric
- Log out when sharing device
- Don't save sensitive information in device notes
- Report lost/stolen devices immediately

#### Connectivity
- Ensure stable internet connection for real-time updates
- Use pharmacy Wi-Fi when available
- Have backup data plan for emergencies
- Sync data regularly when connected

## Troubleshooting

### Common Issues and Solutions

#### Login Problems
**Issue**: Cannot log in to the system
**Solutions**:
1. Check username and password spelling
2. Ensure Caps Lock is off
3. Clear browser cache and cookies
4. Try different browser
5. Contact IT support if password reset needed

#### Calendar Not Loading
**Issue**: Calendar appears blank or won't load
**Solutions**:
1. Refresh the page (F5 or Ctrl+R)
2. Clear browser cache
3. Check internet connection
4. Try different browser
5. Contact support if problem persists

#### Appointments Not Syncing
**Issue**: Changes not appearing across devices
**Solutions**:
1. Refresh the page/app
2. Check internet connection
3. Log out and log back in
4. Clear app cache (mobile)
5. Contact support for sync issues

#### Reminder Not Sent
**Issue**: Patient didn't receive appointment reminder
**Solutions**:
1. Check patient contact information
2. Verify reminder settings for appointment type
3. Check reminder history in appointment details
4. Manually send reminder if needed
5. Update patient communication preferences

#### Follow-up Task Missing
**Issue**: Expected follow-up task not created
**Solutions**:
1. Check if trigger conditions were met
2. Verify automation rules are active
3. Look in completed tasks (may have been auto-completed)
4. Manually create task if needed
5. Report to support for rule review

### Performance Issues

#### Slow Loading Times
**Causes and Solutions**:
- **Internet Connection**: Check speed and stability
- **Browser Issues**: Clear cache, update browser
- **High System Load**: Try during off-peak hours
- **Large Data Sets**: Use filters to reduce data volume

#### Mobile App Crashes
**Troubleshooting Steps**:
1. Force close and restart app
2. Restart device
3. Update app to latest version
4. Clear app cache and data
5. Reinstall app if necessary

### Getting Help

#### Self-Service Resources
- **Help Documentation**: Built-in help system (F1 key)
- **Video Tutorials**: Available in Settings > Help
- **FAQ Section**: Common questions and answers
- **User Community**: Forum for user discussions

#### Support Channels
- **In-App Support**: Click help icon for chat support
- **Email Support**: support@pharmacycopilot.com
- **Phone Support**: Available during business hours
- **Emergency Support**: 24/7 for critical issues

#### Escalation Process
1. **Level 1**: Self-service resources and documentation
2. **Level 2**: Standard support ticket or chat
3. **Level 3**: Phone support for urgent issues
4. **Level 4**: Emergency support for system-wide problems

## Best Practices

### Appointment Management

#### Scheduling Best Practices
1. **Book in Advance**: Schedule routine appointments 2-4 weeks ahead
2. **Leave Buffer Time**: 5-10 minutes between appointments for notes
3. **Group Similar Types**: Schedule similar appointments together
4. **Peak Time Management**: Use busy times for shorter appointments
5. **Preparation Time**: Review patient records before appointments

#### Patient Communication
1. **Confirm Details**: Always verify patient contact information
2. **Set Expectations**: Explain what to bring and expect
3. **Follow Up**: Contact patients who miss appointments
4. **Documentation**: Record all patient interactions
5. **Professional Tone**: Maintain professional communication

### Follow-up Task Management

#### Prioritization
1. **Critical First**: Address critical and high-priority tasks immediately
2. **Time-Sensitive**: Handle time-sensitive tasks before routine ones
3. **Batch Processing**: Group similar tasks for efficiency
4. **Daily Review**: Check follow-up queue at start of each day
5. **Escalation**: Don't hesitate to escalate complex cases

#### Documentation
1. **Detailed Notes**: Record comprehensive interaction details
2. **Objective Outcomes**: Document measurable results
3. **Next Steps**: Always specify follow-up actions
4. **Timeline**: Include dates and timeframes
5. **Patient Response**: Note patient understanding and compliance

### Workflow Optimization

#### Daily Routine
1. **Morning Review**: Check schedule and priority tasks
2. **Preparation**: Review patient records before appointments
3. **Real-Time Updates**: Update appointment status immediately
4. **End-of-Day**: Complete documentation and plan tomorrow
5. **Weekly Planning**: Review upcoming week and adjust as needed

#### Efficiency Tips
1. **Keyboard Shortcuts**: Learn and use system shortcuts
2. **Templates**: Use templates for common documentation
3. **Batch Actions**: Process similar tasks together
4. **Mobile Usage**: Use mobile app for quick updates
5. **Automation**: Leverage automated features when possible

### Quality Assurance

#### Clinical Standards
1. **Evidence-Based**: Follow clinical guidelines and protocols
2. **Patient Safety**: Always prioritize patient safety
3. **Documentation**: Maintain complete and accurate records
4. **Continuous Learning**: Stay updated on best practices
5. **Peer Review**: Participate in quality improvement activities

#### System Usage
1. **Data Accuracy**: Ensure all entered data is accurate
2. **Timely Updates**: Update information promptly
3. **Security**: Follow all security protocols
4. **Backup Plans**: Have contingency plans for system issues
5. **Feedback**: Provide feedback for system improvements

### Professional Development

#### Skill Building
1. **System Training**: Complete all required training modules
2. **Clinical Education**: Attend continuing education programs
3. **Technology Skills**: Stay current with system updates
4. **Communication**: Develop patient communication skills
5. **Leadership**: Take on mentoring and training roles

#### Performance Monitoring
1. **Self-Assessment**: Regularly review your performance metrics
2. **Goal Setting**: Set specific, measurable improvement goals
3. **Feedback**: Seek feedback from supervisors and peers
4. **Action Plans**: Develop plans to address improvement areas
5. **Recognition**: Celebrate achievements and milestones

---

## Quick Reference

### Keyboard Shortcuts
- **Ctrl+N**: New appointment
- **Ctrl+F**: Find patient
- **Ctrl+T**: New follow-up task
- **F1**: Help
- **Ctrl+R**: Refresh page
- **Esc**: Close dialog/modal

### Emergency Contacts
- **Technical Support**: support@pharmacycopilot.com
- **Emergency Line**: 1-800-PHARMA-HELP
- **System Status**: status.pharmacycopilot.com

### Important Links
- **User Portal**: https://app.pharmacycopilot.com
- **Documentation**: https://docs.pharmacycopilot.com
- **Training Videos**: https://training.pharmacycopilot.com
- **Community Forum**: https://community.pharmacycopilot.com

---

*This guide is updated regularly. Last updated: October 2025*
*Version: 1.0.0*