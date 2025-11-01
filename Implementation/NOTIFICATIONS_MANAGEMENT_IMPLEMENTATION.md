# Notifications Management Implementation Guide

## Overview

This document provides a comprehensive guide for implementing the Notifications Management tab in your SaaS Settings, covering both frontend and backend integration.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NotificationsManagement.tsx (UI Component)          │  │
│  │  - Channels Tab (Email, SMS, Push, WhatsApp)        │  │
│  │  - Rules Tab (Automation Engine)                     │  │
│  │  - Templates Tab (Reusable Templates)               │  │
│  │  - History Tab (Delivery Tracking)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  notificationManagementService.ts                    │  │
│  │  - API Client Integration                            │  │
│  │  - Type Definitions                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                    Backend Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  notificationManagementRoutes.ts                     │  │
│  │  - RESTful API Endpoints                             │  │
│  │  - Authentication & Authorization                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  notificationManagementController.ts                 │  │
│  │  - Request Validation                                │  │
│  │  - Business Logic Orchestration                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NotificationChannelService.ts                       │  │
│  │  - Channel Management                                │  │
│  │  - Usage Tracking                                    │  │
│  │  - Limit Enforcement                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database Models                                     │  │
│  │  - NotificationChannel                               │  │
│  │  - NotificationRule                                  │  │
│  │  - NotificationTemplate                              │  │
│  │  - NotificationUsage                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Backend Setup (COMPLETED ✓)

#### 1.1 Database Models Created
- ✅ `NotificationChannel.ts` - Channel configuration and settings
- ✅ `NotificationRule.ts` - Automation rules engine
- ✅ `NotificationTemplate.ts` - Reusable notification templates
- ✅ `NotificationUsage.ts` - Usage tracking and limits

#### 1.2 Services Created
- ✅ `NotificationChannelService.ts` - Channel management logic

#### 1.3 Controllers Created
- ✅ `notificationManagementController.ts` - API request handlers

#### 1.4 Routes Created
- ✅ `notificationManagementRoutes.ts` - RESTful endpoints

### Phase 2: Backend Integration (TODO)

#### 2.1 Register Routes in Main App

Add to `backend/src/app.ts`:

```typescript
import notificationManagementRoutes from './routes/notificationManagementRoutes';

// Add after other routes
app.use('/api/notification-management', notificationManagementRoutes);
```

#### 2.2 Seed Initial Data (Optional)

Create `backend/scripts/seedNotificationChannels.ts`:

```typescript
import mongoose from 'mongoose';
import NotificationChannel from '../src/models/NotificationChannel';
import config from '../src/config';

async function seedChannels() {
  await mongoose.connect(config.mongoUri);

  const defaultChannels = [
    {
      name: 'Primary Email',
      type: 'email',
      enabled: true,
      config: {
        provider: 'smtp',
        fromAddress: 'notifications@yourdomain.com',
      },
      dailyLimit: 10000,
      monthlyLimit: 300000,
      workplaceId: 'YOUR_WORKPLACE_ID', // Replace with actual ID
    },
    {
      name: 'Primary SMS',
      type: 'sms',
      enabled: false,
      config: {
        provider: 'twilio',
      },
      dailyLimit: 1000,
      monthlyLimit: 30000,
      workplaceId: 'YOUR_WORKPLACE_ID',
    },
    {
      name: 'Push Notifications',
      type: 'push',
      enabled: true,
      config: {
        provider: 'firebase',
      },
      dailyLimit: 50000,
      monthlyLimit: 1500000,
      workplaceId: 'YOUR_WORKPLACE_ID',
    },
    {
      name: 'WhatsApp Business',
      type: 'whatsapp',
      enabled: false,
      config: {
        provider: 'twilio',
      },
      dailyLimit: 1000,
      monthlyLimit: 30000,
      workplaceId: 'YOUR_WORKPLACE_ID',
    },
  ];

  await NotificationChannel.insertMany(defaultChannels);
  console.log('✅ Notification channels seeded');
  
  await mongoose.disconnect();
}

seedChannels().catch(console.error);
```

### Phase 3: Frontend Integration (COMPLETED ✓)

#### 3.1 Service Layer Created
- ✅ `notificationManagementService.ts` - API integration

#### 3.2 Component Updated
- ✅ `NotificationsManagement.tsx` - Connected to real service

### Phase 4: Testing & Validation (TODO)

#### 4.1 Backend API Testing

Create `backend/scripts/testNotificationManagement.ts`:

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Get from login

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`,
  },
});

async function testNotificationManagement() {
  console.log('🧪 Testing Notification Management API...\n');

  // Test 1: Get Channels
  console.log('1. Testing GET /notification-management/channels');
  const channelsRes = await api.get('/notification-management/channels');
  console.log('✅ Channels:', channelsRes.data);

  // Test 2: Create Channel
  console.log('\n2. Testing POST /notification-management/channels');
  const newChannel = {
    name: 'Test Email Channel',
    type: 'email',
    enabled: true,
    config: { provider: 'smtp', fromAddress: 'test@example.com' },
    dailyLimit: 5000,
    monthlyLimit: 150000,
  };
  const createRes = await api.post('/notification-management/channels', newChannel);
  console.log('✅ Created:', createRes.data);

  // Test 3: Update Channel
  const channelId = createRes.data.data.channel._id;
  console.log('\n3. Testing PUT /notification-management/channels/:id');
  const updateRes = await api.put(`/notification-management/channels/${channelId}`, {
    enabled: false,
  });
  console.log('✅ Updated:', updateRes.data);

  // Test 4: Get Rules
  console.log('\n4. Testing GET /notification-management/rules');
  const rulesRes = await api.get('/notification-management/rules');
  console.log('✅ Rules:', rulesRes.data);

  // Test 5: Get Templates
  console.log('\n5. Testing GET /notification-management/templates');
  const templatesRes = await api.get('/notification-management/templates');
  console.log('✅ Templates:', templatesRes.data);

  // Test 6: Get History
  console.log('\n6. Testing GET /notification-management/history');
  const historyRes = await api.get('/notification-management/history');
  console.log('✅ History:', historyRes.data);

  console.log('\n✅ All tests passed!');
}

testNotificationManagement().catch(console.error);
```

#### 4.2 Frontend Component Testing

Test the UI manually:
1. Navigate to SaaS Settings → Notifications tab
2. Verify all 4 tabs load correctly
3. Test channel toggle functionality
4. Test rule creation/editing
5. Test template management
6. Verify history displays correctly

### Phase 5: Advanced Features (TODO)

#### 5.1 Real Channel Integration

Implement actual notification sending:

```typescript
// backend/src/services/NotificationDeliveryService.ts
import nodemailer from 'nodemailer';
import twilio from 'twilio';

class NotificationDeliveryService {
  async sendEmail(channel: INotificationChannel, to: string, subject: string, body: string) {
    const transporter = nodemailer.createTransport({
      host: channel.config.smtpHost,
      port: channel.config.smtpPort,
      auth: {
        user: channel.config.smtpUser,
        pass: channel.config.smtpPass,
      },
    });

    await transporter.sendMail({
      from: channel.config.fromAddress,
      to,
      subject,
      html: body,
    });
  }

  async sendSMS(channel: INotificationChannel, to: string, body: string) {
    const client = twilio(channel.config.accountSid, channel.config.authToken);
    
    await client.messages.create({
      from: channel.config.fromNumber,
      to,
      body,
    });
  }

  async sendPush(channel: INotificationChannel, tokens: string[], title: string, body: string) {
    // Implement Firebase Cloud Messaging
  }

  async sendWhatsApp(channel: INotificationChannel, to: string, body: string) {
    // Implement WhatsApp Business API
  }
}
```

#### 5.2 Rules Engine Implementation

Create rule evaluation and execution:

```typescript
// backend/src/services/NotificationRulesEngine.ts
class NotificationRulesEngine {
  async evaluateRule(rule: INotificationRule, context: any): Promise<boolean> {
    // Evaluate conditions
    for (const condition of rule.conditions) {
      const result = this.evaluateCondition(condition, context);
      if (!result) return false;
    }
    return true;
  }

  async executeRule(rule: INotificationRule, context: any) {
    // Check cooldown
    if (rule.lastExecuted) {
      const cooldownMs = rule.cooldownPeriod * 60 * 1000;
      if (Date.now() - rule.lastExecuted.getTime() < cooldownMs) {
        return; // Still in cooldown
      }
    }

    // Check max executions
    if (rule.maxExecutions > 0 && rule.executionCount >= rule.maxExecutions) {
      return; // Max executions reached
    }

    // Execute actions
    for (const action of rule.actions) {
      await this.executeAction(action, context);
    }

    // Update rule
    rule.executionCount++;
    rule.lastExecuted = new Date();
    await rule.save();
  }

  private evaluateCondition(condition: any, context: any): boolean {
    const value = this.getValueFromContext(condition.field, context);
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'in':
        return condition.value.includes(value);
      case 'not_in':
        return !condition.value.includes(value);
      default:
        return false;
    }
  }

  private async executeAction(action: any, context: any) {
    // Implement action execution
  }

  private getValueFromContext(field: string, context: any): any {
    return field.split('.').reduce((obj, key) => obj?.[key], context);
  }
}
```

#### 5.3 Template Rendering

Implement variable substitution:

```typescript
// backend/src/services/NotificationTemplateService.ts
class NotificationTemplateService {
  renderTemplate(template: INotificationTemplate, variables: Record<string, any>): string {
    let rendered = template.body;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }

  validateVariables(template: INotificationTemplate, variables: Record<string, any>): string[] {
    const errors: string[] = [];

    for (const variable of template.variables) {
      if (variable.required && !variables[variable.name]) {
        errors.push(`Missing required variable: ${variable.name}`);
      }
    }

    return errors;
  }
}
```

## API Endpoints

### Channels

```
GET    /api/notification-management/channels
POST   /api/notification-management/channels
PUT    /api/notification-management/channels/:channelId
DELETE /api/notification-management/channels/:channelId
```

### Rules

```
GET    /api/notification-management/rules
POST   /api/notification-management/rules
PUT    /api/notification-management/rules/:ruleId
DELETE /api/notification-management/rules/:ruleId
PATCH  /api/notification-management/rules/:ruleId/toggle
```

### Templates

```
GET    /api/notification-management/templates
POST   /api/notification-management/templates
PUT    /api/notification-management/templates/:templateId
DELETE /api/notification-management/templates/:templateId
```

### History

```
GET    /api/notification-management/history
```

### Test

```
POST   /api/notification-management/test
```

## Security Considerations

1. **Authentication**: All endpoints require authentication via JWT
2. **Authorization**: Only admin and super_admin roles can access
3. **Rate Limiting**: Implement rate limiting on test endpoints
4. **Input Validation**: Validate all inputs to prevent injection attacks
5. **Sensitive Data**: Encrypt API keys and credentials in database
6. **Audit Logging**: Log all configuration changes

## Performance Optimization

1. **Caching**: Cache channel configurations in Redis
2. **Batch Processing**: Process notifications in batches
3. **Queue System**: Use Bull/BullMQ for async notification delivery
4. **Database Indexing**: Ensure proper indexes on frequently queried fields
5. **Connection Pooling**: Reuse SMTP/API connections

## Monitoring & Analytics

1. **Delivery Metrics**: Track success/failure rates per channel
2. **Usage Tracking**: Monitor daily/monthly limits
3. **Performance Metrics**: Track delivery times
4. **Error Tracking**: Log and alert on failures
5. **Cost Tracking**: Monitor API usage costs

## Next Steps

1. ✅ Complete backend models and services
2. ✅ Create API endpoints and controllers
3. ✅ Implement frontend service layer
4. ✅ Update UI component with real integration
5. ⏳ Register routes in main app
6. ⏳ Test all API endpoints
7. ⏳ Implement actual channel integrations (Email, SMS, etc.)
8. ⏳ Build rules engine
9. ⏳ Add template rendering
10. ⏳ Implement monitoring and analytics

## Support

For questions or issues, refer to:
- Backend API documentation
- Frontend component documentation
- Database schema documentation
