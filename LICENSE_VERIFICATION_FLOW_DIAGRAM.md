# License Verification System - Flow Diagrams

## 1. User License Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

    [User Logs In]
         │
         ▼
    [Navigates to Protected Module]
    (Clinical Notes, MTR, etc.)
         │
         ▼
    ┌─────────────────┐
    │ Has License?    │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
[License      [Show License
 Approved?]    Verification
      │         Modal]
      │             │
  ┌───┴───┐         ▼
  │       │    [Click "Upload
 YES     NO     License"]
  │       │         │
  ▼       ▼         ▼
[Access  [Show   [Navigate to
Granted] Modal]  /license Route]
              │
              ▼
         [Fill Form]
         ├─ License Number
         ├─ Expiration Date
         ├─ Pharmacy School
         ├─ Year of Graduation
         └─ Upload Document
              │
              ▼
         [Submit Form]
              │
              ▼
    ┌─────────────────┐
    │ Validation OK?  │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
[Save to DB]   [Show Error]
      │             │
      ▼             └──┐
[Send Emails]         │
├─ User Confirmation  │
└─ Admin Alert        │
      │               │
      ▼               │
[Status: Pending] ────┘
      │
      ▼
[Wait for Admin
 Approval]
```

## 2. Admin Review Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN REVIEW JOURNEY                        │
└─────────────────────────────────────────────────────────────────┘

    [Admin Logs In]
         │
         ▼
    [Receives Email
     Notification]
         │
         ▼
    [Navigate to SaaS
     Settings]
         │
         ▼
    [Click "License
     Verification" Tab]
         │
         ▼
    [View Pending
     Licenses List]
         │
         ▼
    [Click "View" on
     a License]
         │
         ▼
    [Review Document
     & Details]
    ├─ License Number
    ├─ Pharmacy School
    ├─ Expiration Date
    ├─ Year of Graduation
    └─ Document Preview
         │
         ▼
    ┌─────────────────┐
    │ Decision?       │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
   APPROVE       REJECT
      │             │
      ▼             ▼
[Click Approve] [Click Reject]
      │             │
      ▼             ▼
[Confirm]      [Enter Reason]
      │             │
      │             ▼
      │        [Confirm]
      │             │
      └──────┬──────┘
             │
             ▼
    [Update Database]
    ├─ licenseStatus
    ├─ licenseVerifiedAt
    ├─ licenseVerifiedBy
    └─ rejectionReason (if rejected)
             │
             ▼
    [Send Email to User]
    ├─ Approval: Congratulations
    └─ Rejection: Reason + Re-upload
             │
             ▼
    [Remove from
     Pending List]
             │
             ▼
    [Update User Status]
    ├─ Approved: status = 'active'
    └─ Rejected: status = 'license_rejected'
```

## 3. Protected Route Access Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROTECTED ROUTE ACCESS                         │
└─────────────────────────────────────────────────────────────────┘

    [User Navigates to
     Protected Route]
         │
         ▼
    [ProtectedRoute
     Component]
         │
         ▼
    ┌─────────────────┐
    │ Authenticated?  │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
[Check License] [Redirect to
 Required?]      /login]
      │
      ▼
    ┌─────────────────┐
    │ Role Requires   │
    │ License?        │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
[Check Status]  [Grant Access]
      │
      ▼
    ┌─────────────────┐
    │ License Status? │
    └────────┬────────┘
             │
      ┌──────┴──────┬──────────┐
      │             │          │
  APPROVED      PENDING    REJECTED
      │             │          │
      ▼             ▼          ▼
[Grant Access] [Show Modal] [Show Modal]
               "Under       "Rejected"
                Review"     + Reason
                   │            │
                   ▼            ▼
              [Upload      [Upload
               License      License
               Button]      Button]
```

## 4. Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE STRUCTURE                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                      User Model                          │
├──────────────────────────────────────────────────────────┤
│ _id: ObjectId                                            │
│ email: String                                            │
│ firstName: String                                        │
│ lastName: String                                         │
│ role: String (pharmacist, intern_pharmacist, owner...)   │
│ status: String (active, pending, license_rejected...)    │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │         LICENSE FIELDS (NEW)                       │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ licenseNumber: String                              │  │
│ │ licenseExpirationDate: Date                        │  │
│ │ pharmacySchool: String          ← NEW              │  │
│ │ yearOfGraduation: Number        ← NEW              │  │
│ │ licenseDocument: {                                 │  │
│ │   fileName: String                                 │  │
│ │   filePath: String                                 │  │
│ │   uploadedAt: Date                                 │  │
│ │   fileSize: Number                                 │  │
│ │   mimeType: String                                 │  │
│ │ }                                                  │  │
│ │ licenseStatus: String (not_required, pending...)   │  │
│ │ licenseVerifiedAt: Date                            │  │
│ │ licenseVerifiedBy: ObjectId → User                 │  │
│ │ licenseRejectionReason: String                     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ workplaceId: ObjectId → Workplace                        │
└──────────────────────────────────────────────────────────┘
                    │
                    │ References
                    ▼
┌──────────────────────────────────────────────────────────┐
│                   Workplace Model                        │
├──────────────────────────────────────────────────────────┤
│ _id: ObjectId                                            │
│ name: String                                             │
│ type: String                                             │
│ licenseNumber: String                                    │
└──────────────────────────────────────────────────────────┘
```

## 5. Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT HIERARCHY                            │
└─────────────────────────────────────────────────────────────────┘

App.tsx
 │
 ├─ ProtectedRoute (with requiresLicense prop)
 │   │
 │   ├─ Clinical Notes
 │   ├─ Medication Therapy Review
 │   ├─ Clinical Interventions
 │   ├─ AI Diagnostics
 │   └─ Clinical Decision Support
 │
 ├─ /license Route
 │   └─ LicenseUpload Component
 │       ├─ Step 1: License Information Form
 │       │   ├─ License Number Input
 │       │   ├─ Expiration Date Picker
 │       │   ├─ Pharmacy School Input
 │       │   └─ Year of Graduation Input
 │       ├─ Step 2: Document Upload
 │       │   └─ File Upload Component
 │       ├─ Step 3: Under Review
 │       │   └─ Status Display
 │       └─ Step 4: Verification Complete
 │           └─ Success Message
 │
 └─ SaaS Settings
     └─ License Verification Tab
         └─ TenantLicenseManagement Component
             ├─ License List Table
             ├─ Search & Filter
             ├─ Approve Dialog
             ├─ Reject Dialog
             └─ Document Preview Dialog
```

## 6. API Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                             │
└─────────────────────────────────────────────────────────────────┘

USER ENDPOINTS:
┌──────────────────────────────────────────────────────────┐
│ POST /api/license/upload                                 │
│ ├─ Validates: file type, size, required fields          │
│ ├─ Checks: license number uniqueness                    │
│ ├─ Stores: file in uploads/licenses/                    │
│ ├─ Updates: User model with license info                │
│ └─ Sends: confirmation email                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ GET /api/license/status                                  │
│ ├─ Returns: current license status                      │
│ ├─ Includes: all license fields                         │
│ └─ Shows: rejection reason if rejected                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ POST /api/license/validate-number                        │
│ ├─ Checks: if license number exists                     │
│ └─ Returns: availability status                         │
└──────────────────────────────────────────────────────────┘

ADMIN ENDPOINTS:
┌──────────────────────────────────────────────────────────┐
│ GET /api/admin/licenses/pending                          │
│ ├─ Filters: by status (pending/approved/rejected)       │
│ ├─ Supports: search and pagination                      │
│ └─ Returns: list with user and workplace details        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ POST /api/admin/licenses/:userId/approve                 │
│ ├─ Updates: licenseStatus to 'approved'                 │
│ ├─ Sets: licenseVerifiedAt and licenseVerifiedBy        │
│ ├─ Changes: user status to 'active'                     │
│ └─ Sends: approval email to user                        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ POST /api/admin/licenses/:userId/reject                  │
│ ├─ Requires: rejection reason                           │
│ ├─ Updates: licenseStatus to 'rejected'                 │
│ ├─ Stores: rejection reason                             │
│ ├─ Changes: user status to 'license_rejected'           │
│ └─ Sends: rejection email with reason                   │
└──────────────────────────────────────────────────────────┘
```

## 7. Email Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   EMAIL NOTIFICATIONS                            │
└─────────────────────────────────────────────────────────────────┘

LICENSE SUBMISSION:
    User Uploads License
           │
           ├─→ [Email to User]
           │   Subject: "License Submitted for Review"
           │   Content: Confirmation + License Number
           │
           └─→ [Email to Admin]
               Subject: "New License Pending Review"
               Content: User Details + Review Link

LICENSE APPROVAL:
    Admin Approves License
           │
           └─→ [Email to User]
               Subject: "License Approved!"
               Content: Congratulations + Access Info

LICENSE REJECTION:
    Admin Rejects License
           │
           └─→ [Email to User]
               Subject: "License Verification Required"
               Content: Rejection Reason + Re-upload Link
```

---

**Visual Guide Version**: 1.0.0
**Last Updated**: October 8, 2025
