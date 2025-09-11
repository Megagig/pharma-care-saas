# Advanced RBAC Implementation Guide

## Overview

This document describes the comprehensive Role-Based Access Control (RBAC) system implemented for the PharmaCareSaaS platform. The system includes advanced features like feature flagging, subscription-based access management, and license verification.

## 🏗️ Architecture

### Backend Architecture

```
Backend/
├── src/
│   ├── models/
│   │   ├── User.ts                 # Enhanced user model with roles & permissions
│   │   ├── FeatureFlag.ts          # Feature flags management
│   │   ├── Subscription.ts         # Subscription management
│   │   └── SubscriptionPlan.ts     # Subscription plans
│   ├── middlewares/
│   │   └── auth.ts                 # JWT auth & RBAC middleware
│   ├── controllers/
│   │   ├── adminController.ts      # Admin dashboard APIs
│   │   ├── licenseController.ts    # License verification
│   │   └── subscriptionController.ts # Subscription & Stripe
│   ├── routes/
│   │   ├── admin.ts               # Admin routes
│   │   ├── license.ts             # License routes
│   │   └── subscription.ts        # Subscription routes
│   └── utils/
│       └── dataSeeder.ts          # Seed feature flags & plans
```

### Frontend Architecture

```
Frontend/
├── src/
│   ├── hooks/
│   │   └── useRBAC.ts             # RBAC custom hooks
│   ├── components/
│   │   ├── ProtectedRoute.tsx     # Route protection
│   │   ├── admin/
│   │   │   └── AdminDashboard.tsx # Super admin dashboard
│   │   ├── license/
│   │   │   └── LicenseUpload.tsx  # License verification
│   │   └── subscription/
│   │       └── SubscriptionManagement.tsx
│   ├── services/
│   │   ├── adminService.ts        # Admin API calls
│   │   ├── licenseService.ts      # License API calls
│   │   └── subscriptionService.ts # Subscription API calls
│   └── utils/
│       └── rbacTestSuite.ts       # Test validation
```

## 👥 User Roles

### Role Hierarchy

```
Super Admin
    ↓ (inherits all permissions)
Pharmacy Outlet
    ↓ (inherits pharmacy_team, pharmacist permissions)
Pharmacy Team
    ↓ (inherits pharmacist permissions)
Pharmacist
    ↓ (base permissions)
Intern Pharmacist (limited access)
```

### Role Definitions

1. **Pharmacist**
   - Single-user access
   - Requires license verification
   - Core pharmacy management features

2. **Pharmacy Team**
   - Multi-user access (up to 5 users)
   - Team collaboration features
   - Can invite team members

3. **Pharmacy Outlet**
   - Business-level access
   - Multiple teams management
   - Advanced analytics

4. **Intern Pharmacist**
   - Limited access under supervision
   - Requires mentor assignment
   - Restricted permissions

5. **Super Admin**
   - Full platform access
   - User management
   - System configuration

## 💳 Subscription Tiers

### Tier Structure

| Feature            | Free Trial | Basic    | Pro       | Enterprise |
| ------------------ | ---------- | -------- | --------- | ---------- |
| Patient Limit      | 10         | 100      | 500       | Unlimited  |
| Team Size          | 1          | 1        | 5         | Unlimited  |
| SMS Reminders      | 5/month    | 50/month | 200/month | Unlimited  |
| Reports Export     | ❌         | ✅       | ✅        | ✅         |
| Advanced Analytics | ❌         | ❌       | ✅        | ✅         |
| API Access         | ❌         | ❌       | ❌        | ✅         |
| Priority Support   | ❌         | ❌       | ❌        | ✅         |

### Feature Mapping

```typescript
const featureMapping = {
   patient_management: ['free_trial', 'basic', 'pro', 'enterprise'],
   medication_management: ['free_trial', 'basic', 'pro', 'enterprise'],
   clinical_notes: ['basic', 'pro', 'enterprise'],
   advanced_analytics: ['pro', 'enterprise'],
   team_management: ['pro', 'enterprise'],
   api_access: ['enterprise'],
   user_management: ['enterprise'], // Super admin only
};
```

## 🚦 Feature Flags System

### Structure

```typescript
interface FeatureFlag {
   key: string; // Unique identifier
   name: string; // Display name
   description: string; // Feature description
   isEnabled: boolean; // Global toggle
   allowedTiers: string[]; // Subscription tiers
   allowedRoles: string[]; // User roles
   customRules: {
      // Additional validation
      field: string;
      operator: string;
      value: any;
   }[];
   metadata: {
      category: string; // Feature category
      priority: string; // Implementation priority
      tags: string[]; // Search tags
   };
}
```

### Usage Examples

```typescript
// Backend middleware
app.get(
   '/api/patients',
   auth,
   requireFeature('patient_management'),
   getPatients
);

// Frontend hook
const { hasFeature } = useRBAC();
if (hasFeature('advanced_analytics')) {
   // Show analytics dashboard
}
```

## 🔒 Authentication & Authorization

### JWT Implementation

```typescript
// Token structure
interface JWTPayload {
   userId: string;
   role: string;
   permissions: string[];
   subscriptionTier: string;
   licenseStatus: string;
}

// Middleware validation
const auth = async (req, res, next) => {
   // 1. Validate JWT token
   // 2. Check user status
   // 3. Verify subscription
   // 4. Validate license (if required)
   // 5. Attach user to request
};
```

### Permission System

```typescript
// Permission format: resource:action
const permissions = [
   'patient:read',
   'patient:write',
   'patient:delete',
   'medication:read',
   'medication:write',
   'team:manage',
   'admin:all',
];

// Role-based permissions
const rolePermissions = {
   pharmacist: ['patient:*', 'medication:*'],
   pharmacy_team: ['patient:*', 'medication:*', 'team:read'],
   pharmacy_outlet: ['patient:*', 'medication:*', 'team:*'],
   super_admin: ['*'],
};
```

## 📋 License Verification

### Workflow

1. **Upload**: User uploads license document and details
2. **Validation**: System validates document format and details
3. **Review**: Admin reviews and approves/rejects
4. **Status Update**: User status updated based on decision
5. **Notification**: Email/SMS notification sent to user

### Required Fields

```typescript
interface LicenseUpload {
   firstName: string;
   lastName: string;
   email: string;
   phone: string;
   licenseNumber: string;
   licenseType: 'pharmacist' | 'intern_pharmacist';
   issuingAuthority: string;
   issueDate: string;
   expiryDate: string;
   specializations?: string[];
   licenseDocument: File;
}
```

## 💰 Payment Integration

### Stripe Integration

```typescript
// Webhook events handled
const webhookEvents = [
  'subscription.created',
  'subscription.updated',
  'subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
];

// Subscription lifecycle
1. User selects plan
2. Stripe checkout session created
3. Payment processed
4. Webhook updates subscription
5. Features activated/deactivated
```

## 🛡️ Frontend Protection

### Route Guards

```typescript
// Protected route usage
<ProtectedRoute
  requiredRole="pharmacist"
  requiredFeature="patient_management"
  requiredSubscription="basic"
  fallback={<AccessDenied />}
>
  <PatientManagement />
</ProtectedRoute>
```

### Component Protection

```typescript
// Conditional rendering
const { hasRole, hasFeature, subscriptionStatus } = useRBAC();

return (
  <div>
    {hasFeature('advanced_analytics') && (
      <AnalyticsDashboard />
    )}

    {hasRole('super_admin') && (
      <AdminControls />
    )}

    {!subscriptionStatus.isActive && (
      <SubscriptionAlert />
    )}
  </div>
);
```

## 🧪 Testing

### Test Categories

1. **Authentication Tests**
   - JWT validation
   - Session management
   - Token refresh

2. **Authorization Tests**
   - Role hierarchy
   - Permission checking
   - Feature access control

3. **Subscription Tests**
   - Plan validation
   - Feature mapping
   - Stripe integration

4. **License Tests**
   - Upload validation
   - Approval workflow
   - Status tracking

### Running Tests

```bash
# Backend tests
npm run test:rbac

# Frontend tests
npm run test:frontend

# Integration tests
npm run test:integration
```

## 📊 Admin Dashboard

### Features

1. **User Management**
   - View all users
   - Manage roles and permissions
   - Suspend/activate accounts

2. **License Verification**
   - Review pending licenses
   - Approve/reject applications
   - Download documents

3. **Subscription Management**
   - Monitor active subscriptions
   - Extend/modify plans
   - Handle cancellations

4. **Analytics**
   - User registration trends
   - Revenue analytics
   - Feature usage statistics

5. **Feature Flag Management**
   - Toggle features
   - Configure access rules
   - Monitor feature adoption

## 🔧 Configuration

### Environment Variables

```bash
# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=24h

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
MONGODB_URI=mongodb://localhost:27017/pharmacare

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5MB
```

### Feature Flag Configuration

```json
{
   "patient_management": {
      "enabled": true,
      "tiers": ["free_trial", "basic", "pro", "enterprise"],
      "roles": ["pharmacist", "pharmacy_team", "pharmacy_outlet"]
   },
   "advanced_analytics": {
      "enabled": true,
      "tiers": ["pro", "enterprise"],
      "roles": ["pharmacist", "pharmacy_team", "pharmacy_outlet"]
   }
}
```

## 🚀 Deployment

### Database Seeding

```bash
# Seed feature flags and subscription plans
npm run seed:data

# Create default admin user
npm run seed:admin
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Stripe webhooks configured
- [ ] SSL certificates installed
- [ ] Database indexes created
- [ ] File upload permissions set
- [ ] Email service configured
- [ ] Monitoring setup

## 📝 API Documentation

### Authentication Endpoints

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh-token
GET  /api/auth/me
```

### Admin Endpoints

```
GET    /api/admin/users
PUT    /api/admin/users/:id/role
GET    /api/admin/licenses/pending
PUT    /api/admin/licenses/:id/approve
GET    /api/admin/analytics
```

### Subscription Endpoints

```
GET    /api/subscription-management/plans
POST   /api/subscription-management/checkout
GET    /api/subscription-management/current
POST   /api/subscription-management/cancel
```

### License Endpoints

```
POST   /api/license/upload
GET    /api/license/status
PUT    /api/license/resubmit
GET    /api/license/document
```

## 🤝 Contributing

### Development Guidelines

1. Follow TypeScript strict mode
2. Use ESLint and Prettier
3. Write comprehensive tests
4. Document API changes
5. Update role permissions carefully

### Security Guidelines

1. Validate all inputs
2. Use parameterized queries
3. Implement rate limiting
4. Log security events
5. Regular security audits

## 📞 Support

For technical support or questions about the RBAC implementation:

- Email: dev@pharmacare.com
- Documentation: /docs/rbac
- Issue Tracker: GitHub Issues

---

_This documentation is maintained by the PharmaCareSaaS development team._
