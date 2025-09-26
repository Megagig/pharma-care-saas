# Rollback Procedures for MUI to shadcn/ui Migration

## Overview

This document provides comprehensive rollback procedures for the MUI to shadcn/ui migration. These procedures are designed to quickly restore functionality in case of critical issues while minimizing downtime and data loss.

## Rollback Scenarios

### Scenario 1: Immediate Emergency Rollback
**When to use:** Critical production issues, complete application failure, or security vulnerabilities.
**Target time:** < 1 hour
**Risk level:** Low (well-tested procedure)

### Scenario 2: Partial Component Rollback
**When to use:** Specific components causing issues while others work correctly.
**Target time:** < 2 hours
**Risk level:** Medium (requires selective restoration)

### Scenario 3: Gradual Rollback
**When to use:** Performance issues, user experience problems, or accessibility regressions.
**Target time:** < 4 hours
**Risk level:** Low (controlled process)

## Pre-Rollback Checklist

Before initiating any rollback procedure:

- [ ] **Document the Issue**: Record the specific problem, error messages, and affected functionality
- [ ] **Assess Impact**: Determine if the issue affects all users or specific scenarios
- [ ] **Check Monitoring**: Review application logs, error rates, and performance metrics
- [ ] **Notify Stakeholders**: Inform relevant team members and stakeholders
- [ ] **Backup Current State**: Create a backup of the current codebase state
- [ ] **Verify Rollback Branch**: Ensure the rollback target is stable and tested

## Rollback Procedures

### 1. Immediate Emergency Rollback

#### Step 1: Prepare Rollback Environment
```bash
# Navigate to project root
cd /path/to/pharma-care-saas

# Ensure clean working directory
git status
git stash  # if there are uncommitted changes

# Fetch latest changes
git fetch origin
```

#### Step 2: Identify Rollback Target
```bash
# Find the last stable commit before migration
git log --oneline --grep="migration" -n 10

# Or find the last commit before a specific date
git log --before="2024-01-01" --oneline -n 5

# Example: Rollback to commit abc123
export ROLLBACK_COMMIT="abc123"
```

#### Step 3: Create Rollback Branch
```bash
# Create rollback branch from stable commit
git checkout -b emergency-rollback-$(date +%Y%m%d-%H%M) $ROLLBACK_COMMIT

# Verify the branch is correct
git log --oneline -n 5
```

#### Step 4: Restore Dependencies
```bash
# Navigate to frontend
cd frontend

# Restore MUI dependencies
npm install @mui/material@^5.14.0 @mui/icons-material@^5.14.0 @emotion/react@^11.11.0 @emotion/styled@^11.11.0 @mui/x-data-grid@^6.10.0 @mui/x-date-pickers@^6.10.0

# Remove shadcn/ui dependencies (optional, can keep for future use)
# npm uninstall @radix-ui/react-* lucide-react

# Install dependencies
npm install
```

#### Step 5: Verify Build
```bash
# Test build
npm run build

# If build fails, check for missing dependencies
npm run lint
npm run type-check  # if available
```

#### Step 6: Run Tests
```bash
# Run critical tests
npm run test:critical  # if available
npm run test -- --testPathPattern="critical"

# Run smoke tests
npm run test:smoke  # if available
```

#### Step 7: Deploy Rollback
```bash
# Push rollback branch
git push origin emergency-rollback-$(date +%Y%m%d-%H%M)

# Deploy to staging first (if possible)
# Deploy to production
# Follow your deployment process
```

#### Step 8: Verify Rollback
- [ ] Application loads correctly
- [ ] Critical user flows work
- [ ] Authentication functions
- [ ] Data operations work
- [ ] No console errors
- [ ] Performance is acceptable

#### Step 9: Post-Rollback Actions
```bash
# Update main branch if rollback is successful
git checkout main
git reset --hard emergency-rollback-$(date +%Y%m%d-%H%M)
git push origin main --force-with-lease

# Tag the rollback for reference
git tag -a rollback-$(date +%Y%m%d-%H%M) -m "Emergency rollback from migration"
git push origin rollback-$(date +%Y%m%d-%H%M)
```

### 2. Partial Component Rollback

#### Step 1: Identify Problematic Components
```bash
# Search for specific component issues
grep -r "ComponentName" src/ --include="*.tsx" --include="*.ts"

# Check git history for recent changes
git log --follow src/components/ComponentName.tsx
```

#### Step 2: Restore Individual Components
```bash
# Restore specific component from pre-migration state
git checkout $ROLLBACK_COMMIT -- src/components/ComponentName.tsx

# Restore related files
git checkout $ROLLBACK_COMMIT -- src/components/ComponentName/
git checkout $ROLLBACK_COMMIT -- src/types/ComponentName.ts
```

#### Step 3: Update Imports and Dependencies
```bash
# Find components that import the restored component
grep -r "from.*ComponentName" src/ --include="*.tsx" --include="*.ts"

# Update imports to use MUI version
# This may require manual editing
```

#### Step 4: Restore Required Dependencies
```bash
# Install specific MUI packages if needed
npm install @mui/material @mui/icons-material

# Update package.json to include required dependencies
```

#### Step 5: Test Partial Rollback
```bash
# Run tests for affected components
npm run test -- --testPathPattern="ComponentName"

# Test integration with other components
npm run test:integration
```

### 3. Gradual Rollback

#### Step 1: Create Feature Flag System
```tsx
// src/lib/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_SHADCN_BUTTONS: process.env.REACT_APP_USE_SHADCN_BUTTONS === 'true',
  USE_SHADCN_FORMS: process.env.REACT_APP_USE_SHADCN_FORMS === 'true',
  USE_SHADCN_TABLES: process.env.REACT_APP_USE_SHADCN_TABLES === 'true',
  USE_SHADCN_DIALOGS: process.env.REACT_APP_USE_SHADCN_DIALOGS === 'true',
};
```

#### Step 2: Implement Component Switching
```tsx
// src/components/ui/Button.tsx
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { Button as ShadcnButton } from './shadcn/button';
import { Button as MuiButton } from '@mui/material';

export function Button(props: ButtonProps) {
  if (FEATURE_FLAGS.USE_SHADCN_BUTTONS) {
    return <ShadcnButton {...props} />;
  }
  
  return <MuiButton {...props} />;
}
```

#### Step 3: Gradual Rollback Process
```bash
# Disable specific components via environment variables
echo "REACT_APP_USE_SHADCN_BUTTONS=false" >> .env
echo "REACT_APP_USE_SHADCN_FORMS=false" >> .env

# Test with partial rollback
npm run build
npm run test

# Deploy with feature flags
# Monitor for issues
# Gradually disable more components if needed
```

## Rollback Validation

### Automated Validation
```bash
#!/bin/bash
# rollback-validation.sh

echo "🔍 Starting rollback validation..."

# Check build
echo "📦 Testing build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Check tests
echo "🧪 Running tests..."
npm run test:critical
if [ $? -ne 0 ]; then
    echo "❌ Critical tests failed"
    exit 1
fi

# Check for MUI imports (should exist after rollback)
echo "🔍 Checking for MUI imports..."
MUI_IMPORTS=$(grep -r "@mui" src/ --include="*.tsx" --include="*.ts" | wc -l)
if [ $MUI_IMPORTS -eq 0 ]; then
    echo "⚠️  Warning: No MUI imports found, rollback may be incomplete"
fi

# Check for shadcn imports (should be minimal after rollback)
echo "🔍 Checking for shadcn imports..."
SHADCN_IMPORTS=$(grep -r "@/components/ui" src/ --include="*.tsx" --include="*.ts" | wc -l)
echo "📊 Found $SHADCN_IMPORTS shadcn imports"

echo "✅ Rollback validation complete"
```

### Manual Validation Checklist
- [ ] **Authentication**: Login/logout functionality works
- [ ] **Navigation**: All menu items and routing work
- [ ] **Forms**: Patient forms, medication forms submit correctly
- [ ] **Data Display**: Tables, cards, lists display properly
- [ ] **Theme**: Light/dark mode switching works
- [ ] **Responsive**: Mobile and desktop layouts work
- [ ] **Accessibility**: Screen readers and keyboard navigation work
- [ ] **Performance**: Page load times are acceptable
- [ ] **Browser Compatibility**: Works in Chrome, Firefox, Safari
- [ ] **Console**: No critical JavaScript errors

## Monitoring and Alerting

### Post-Rollback Monitoring
```javascript
// Add to your monitoring system
const rollbackMetrics = {
  errorRate: 'application.errors.rate',
  responseTime: 'application.response.time',
  userSessions: 'application.users.active',
  buildHealth: 'application.build.status',
};

// Alert thresholds
const alertThresholds = {
  errorRate: 5, // errors per minute
  responseTime: 2000, // milliseconds
  userSessions: 0.8, // 80% of normal traffic
};
```

### Health Check Endpoints
```typescript
// src/api/health.ts
export async function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.REACT_APP_VERSION,
    migration: {
      status: 'rolled-back',
      rollbackTime: localStorage.getItem('rollback-time'),
      uiFramework: 'mui', // or 'shadcn'
    },
    dependencies: {
      mui: '5.14.0',
      react: '18.2.0',
    },
  };
}
```

## Communication Plan

### Stakeholder Notification Template
```
Subject: [URGENT] Application Rollback Initiated - MUI Migration

Dear Team,

We have initiated a rollback of the MUI to shadcn/ui migration due to [ISSUE_DESCRIPTION].

**Rollback Details:**
- Start Time: [TIME]
- Expected Duration: [DURATION]
- Affected Systems: [SYSTEMS]
- Rollback Type: [IMMEDIATE/PARTIAL/GRADUAL]

**Current Status:**
- [STATUS_UPDATE]

**Next Steps:**
- [NEXT_ACTIONS]

**Impact:**
- [USER_IMPACT]
- [BUSINESS_IMPACT]

We will provide updates every 30 minutes until resolution.

Best regards,
Development Team
```

### User Communication
```
🔧 Maintenance Notice

We are currently addressing a technical issue and have temporarily restored our previous interface. 

- All functionality remains available
- Your data is safe and secure
- We expect normal service to resume shortly

Thank you for your patience.
```

## Post-Rollback Analysis

### Issue Analysis Template
```markdown
# Rollback Analysis Report

## Issue Summary
- **Date**: [DATE]
- **Duration**: [DURATION]
- **Rollback Type**: [TYPE]
- **Root Cause**: [CAUSE]

## Timeline
- [TIME] - Issue detected
- [TIME] - Rollback initiated
- [TIME] - Rollback completed
- [TIME] - Service restored

## Impact Assessment
- **Users Affected**: [NUMBER/PERCENTAGE]
- **Functionality Lost**: [DESCRIPTION]
- **Data Impact**: [NONE/MINIMAL/SIGNIFICANT]
- **Business Impact**: [DESCRIPTION]

## Lessons Learned
- [LESSON 1]
- [LESSON 2]
- [LESSON 3]

## Action Items
- [ ] [ACTION 1] - Owner: [NAME] - Due: [DATE]
- [ ] [ACTION 2] - Owner: [NAME] - Due: [DATE]
- [ ] [ACTION 3] - Owner: [NAME] - Due: [DATE]

## Prevention Measures
- [MEASURE 1]
- [MEASURE 2]
- [MEASURE 3]
```

## Recovery Planning

### Post-Rollback Recovery Steps
1. **Stabilize Current State**
   - Ensure rollback is stable
   - Monitor for any issues
   - Document current configuration

2. **Analyze Migration Issues**
   - Identify root causes
   - Document lessons learned
   - Update migration strategy

3. **Plan Re-Migration**
   - Address identified issues
   - Improve testing procedures
   - Create better rollback mechanisms

4. **Implement Improvements**
   - Enhanced testing
   - Better monitoring
   - Improved documentation

### Re-Migration Checklist
- [ ] All rollback issues analyzed and resolved
- [ ] Enhanced testing procedures in place
- [ ] Better monitoring and alerting configured
- [ ] Improved rollback procedures documented
- [ ] Team training completed
- [ ] Stakeholder approval obtained

## Emergency Contacts

### Technical Contacts
- **Lead Developer**: [NAME] - [PHONE] - [EMAIL]
- **DevOps Engineer**: [NAME] - [PHONE] - [EMAIL]
- **System Administrator**: [NAME] - [PHONE] - [EMAIL]

### Business Contacts
- **Product Manager**: [NAME] - [PHONE] - [EMAIL]
- **Customer Support**: [NAME] - [PHONE] - [EMAIL]
- **Executive Sponsor**: [NAME] - [PHONE] - [EMAIL]

### External Contacts
- **Hosting Provider**: [CONTACT_INFO]
- **CDN Provider**: [CONTACT_INFO]
- **Database Provider**: [CONTACT_INFO]

---

**Remember**: The goal of rollback procedures is to quickly restore service while minimizing impact. Always prioritize user experience and data integrity over preserving migration progress.