# User Acceptance Testing (UAT) - Patient Engagement & Follow-up Management

## Overview

This directory contains the complete User Acceptance Testing (UAT) suite for the Patient Engagement & Follow-up Management module. The UAT validates that the system meets business requirements and provides a satisfactory user experience for pharmacy staff and patients.

## 📁 Directory Structure

```
tests/uat/
├── README.md                           # This file
├── package.json                        # UAT dependencies and scripts
├── patient-engagement-uat-plan.md      # Comprehensive UAT plan
├── uat-execution-guide.md              # Step-by-step execution guide
├── uat-validation-checklist.md         # Validation checklist and criteria
├── pharmacy-staff-test-scenarios.md    # Pharmacy staff test scenarios
├── patient-portal-test-scenarios.md    # Patient portal test scenarios
├── feedback-collection-system.md       # Feedback forms and collection methods
├── scripts/
│   ├── run-uat.js                     # Main UAT execution runner
│   ├── uat-data-setup.js              # Test data generation script
│   └── uat-monitor.js                 # Monitoring and reporting tools
└── reports/                           # Generated reports (created during execution)
    ├── sessions/                      # Individual session data
    ├── tasks/                         # Task execution data
    ├── bugs/                          # Bug reports
    ├── feedback/                      # User feedback data
    └── final-uat-report.html          # Final comprehensive report
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- MongoDB instance (local or remote)
- Patient Engagement module deployed to staging environment
- Access to test pharmacy and patient accounts

### Installation

```bash
# Navigate to UAT directory
cd tests/uat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pharmacycopilot-uat

# Application Configuration
UAT_BASE_URL=http://localhost:3000
UAT_ENV=staging

# Monitoring Configuration
LOG_LEVEL=info
CLEANUP_TEST_DATA=false

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📋 UAT Execution

### Option 1: Full Automated UAT

Run the complete UAT process with automated setup, execution, and reporting:

```bash
npm run run
```

This will:
1. Set up test data and environment
2. Execute all UAT phases
3. Generate comprehensive reports
4. Clean up test data (optional)

### Option 2: Manual Step-by-Step Execution

#### Step 1: Environment Setup

```bash
# Set up test data
npm run setup

# Verify application health
npm run verify
```

#### Step 2: Execute UAT Phases

Follow the detailed instructions in `uat-execution-guide.md`:

1. **Week 1**: Pharmacy Staff Testing
2. **Week 2**: Patient Portal Testing  
3. **Week 3**: Integration Testing
4. **Week 4**: Analysis and Reporting

#### Step 3: Generate Reports

```bash
# Generate final report
npm run report
```

#### Step 4: Cleanup (Optional)

```bash
# Clean up test data
npm run cleanup
```

## 📊 Test Scenarios

### Pharmacy Staff Scenarios

Located in `pharmacy-staff-test-scenarios.md`:

1. **Daily Appointment Management** (45 minutes)
   - Dashboard review and navigation
   - Patient check-in and completion
   - Appointment rescheduling

2. **Follow-up Task Management** (35 minutes)
   - Task creation and prioritization
   - Task completion workflows
   - Follow-up to appointment conversion

3. **Schedule Management** (30 minutes)
   - Schedule configuration
   - Time-off management
   - Capacity analysis

### Patient Portal Scenarios

Located in `patient-portal-test-scenarios.md`:

1. **Patient Registration and Access** (20 minutes)
   - Account creation and verification
   - Portal navigation and setup

2. **Online Appointment Booking** (25 minutes)
   - Appointment type selection
   - Date and time booking
   - Confirmation process

3. **Appointment Management** (20 minutes)
   - Viewing appointments
   - Rescheduling and cancellation
   - Reminder interactions

4. **Mobile Experience** (25 minutes)
   - Mobile navigation and booking
   - Touch interactions
   - Cross-device synchronization

## 📈 Success Metrics

### Quantitative Targets

- **Task Completion Rate**: >95% for critical workflows
- **Task Completion Time**: Within 20% of target times
- **System Usability Scale (SUS)**: >70 (Good), >80 (Excellent)
- **Error Rate**: <5% for routine tasks
- **Performance**: Page loads <3s, API responses <1s

### Qualitative Indicators

- Users feel confident using the system
- System fits naturally into existing workflows
- Users express willingness to use regularly
- Minimal additional training required
- Clear benefits over current processes

## 🐛 Issue Management

### Bug Reporting

Use the structured bug report form in `feedback-collection-system.md`:

- **Critical**: System unusable or data loss
- **High**: Major functionality broken
- **Medium**: Minor functionality issues
- **Low**: Cosmetic or enhancement requests

### Issue Tracking

All issues are automatically tracked in the `reports/bugs/` directory with:
- Detailed reproduction steps
- Screenshots and recordings
- Impact assessment
- Resolution tracking

## 📊 Feedback Collection

### Methods Available

1. **System Usability Scale (SUS)**: Standardized usability measurement
2. **Task-Specific Feedback**: Immediate post-task feedback
3. **Focus Groups**: Group discussions about overall experience
4. **Individual Interviews**: Detailed one-on-one feedback
5. **Bug Reports**: Structured issue reporting

### Data Analysis

The UAT monitor automatically analyzes:
- Quantitative metrics and trends
- Qualitative feedback themes
- User segment differences
- Critical issue identification
- Readiness assessment

## 📋 Validation Checklist

Use `uat-validation-checklist.md` to ensure:

- [ ] All test scenarios completed successfully
- [ ] Success metrics achieved
- [ ] Critical issues resolved
- [ ] User acceptance confirmed
- [ ] Business requirements validated
- [ ] Performance targets met
- [ ] Integration verified
- [ ] Documentation complete

## 🎯 Go/No-Go Decision

### Ready for Production
- All critical bugs resolved
- Task completion rate >90%
- SUS score >70
- User acceptance >80%
- Performance meets targets

### Requires Additional Work
- Critical bugs remain
- Task completion rate <80%
- SUS score <60
- Major usability issues
- Performance significantly below targets

## 📞 Support and Troubleshooting

### Common Issues

1. **Environment Setup Failures**
   - Verify MongoDB connection
   - Check application health endpoint
   - Validate environment variables

2. **Test Data Issues**
   - Re-run data setup script
   - Verify database permissions
   - Check data consistency

3. **Performance Problems**
   - Monitor system resources
   - Check network connectivity
   - Verify staging environment capacity

### Getting Help

- Review the execution guide for detailed instructions
- Check the validation checklist for requirements
- Contact the development team for technical issues
- Refer to the feedback collection system for user concerns

## 📚 Additional Resources

- [Patient Engagement Module Documentation](../../docs/patient-engagement/)
- [API Documentation](../../docs/api/)
- [User Guides](../../docs/user-guides/)
- [Troubleshooting Guide](../../docs/troubleshooting/)

## 🤝 Contributing

To improve the UAT process:

1. Update test scenarios based on new features
2. Enhance feedback collection methods
3. Improve automation and reporting
4. Add new validation criteria
5. Update documentation

## 📄 License

This UAT suite is part of the Pharmacy Copilot project and follows the same licensing terms.

---

**UAT Version**: 1.0  
**Last Updated**: 2025-10-27  
**Estimated Duration**: 4 weeks  
**Required Participants**: 20-25 users  
**Success Rate**: High with proper preparation