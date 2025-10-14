# License Verification - Quick Reference Guide

## 🎯 Overview
License verification system requiring pharmacists, intern pharmacists, and owners to upload and verify their licenses before accessing clinical modules.

## 📋 Required Fields

### User Must Provide:
1. ✅ **License Number** (required, unique)
2. ✅ **License Expiration Date** (required, must be future date)
3. ✅ **Pharmacy School of Graduation** (required)
4. ⭕ **Year of Graduation** (optional)
5. ✅ **License Document** (required, PDF/image, max 5MB)

## 🔒 Protected Modules

These 5 modules require approved license:
1. Clinical Notes (`/notes`)
2. Medication Therapy Review (`/pharmacy/medication-therapy`)
3. Clinical Interventions (`/pharmacy/clinical-interventions`)
4. AI Diagnostics and Therapeutics (`/pharmacy/diagnostics`)
5. Clinical Decision Support (`/pharmacy/decision-support`)

## 👥 Roles Requiring License

- ✅ Pharmacist
- ✅ Intern Pharmacist
- ✅ Owner
- ❌ Pharmacy Team (no license required)
- ❌ Super Admin (no license required)

## 🔄 License Status Flow

```
not_required → pending → approved ✓
                    ↓
                rejected → pending (re-upload)
```

## 📍 Key Routes

### User Routes:
- `/license` - Upload/view license status
- Protected modules - Trigger license check

### Admin Routes:
- `/saas-settings` → "License Verification" tab
- View, approve, reject licenses

## 🛠️ API Endpoints

### User Endpoints:
```
POST   /api/license/upload              - Upload license
GET    /api/license/status              - Get status
DELETE /api/license/document            - Delete document
POST   /api/license/validate-number     - Check uniqueness
GET    /api/license/document/:userId    - View document
```

### Admin Endpoints:
```
GET    /api/admin/licenses/pending      - List pending
POST   /api/admin/licenses/:userId/approve  - Approve
POST   /api/admin/licenses/:userId/reject   - Reject
```

## 📧 Email Notifications

### User Receives:
- License submission confirmation
- Approval notification
- Rejection notification (with reason)

### Admin Receives:
- New license submission alert

## 🎨 UI Components

### Frontend Components:
```
frontend/src/components/
├── license/
│   └── LicenseUpload.tsx              - User upload form
├── saas/
│   └── TenantLicenseManagement.tsx    - Admin management
└── ProtectedRoute.tsx                  - Route protection
```

### Backend Controllers:
```
backend/src/controllers/
├── licenseController.ts               - License operations
└── adminController.ts                 - Admin operations
```

## 🗄️ Database Fields

### User Model:
```typescript
{
  licenseNumber: string,
  licenseExpirationDate: Date,
  pharmacySchool: string,          // NEW
  yearOfGraduation: number,        // NEW
  licenseDocument: {
    fileName: string,
    filePath: string,
    uploadedAt: Date,
    fileSize: number,
    mimeType: string
  },
  licenseStatus: 'not_required' | 'pending' | 'approved' | 'rejected',
  licenseVerifiedAt: Date,
  licenseVerifiedBy: ObjectId,
  licenseRejectionReason: string
}
```

## ⚡ Quick Actions

### For Users:
1. **Upload License**: Navigate to any protected module → Click "Upload License"
2. **Check Status**: Go to `/license` route
3. **Re-upload**: After rejection, go to `/license` → Upload new document

### For Admins:
1. **Review Licenses**: SaaS Settings → License Verification tab
2. **Approve**: Click View → Review → Approve
3. **Reject**: Click View → Review → Reject → Enter reason

## 🚨 Common Issues & Solutions

### Issue: "License number already registered"
**Solution**: Each license number must be unique. Use a different number or contact admin.

### Issue: "File too large"
**Solution**: Compress file to under 5MB or use a different format.

### Issue: "Invalid file type"
**Solution**: Only PDF, JPEG, PNG, and WebP files are accepted.

### Issue: Can't access protected module
**Solution**: Check license status at `/license`. Must be "approved" to access.

### Issue: Document preview not loading
**Solution**: Check file permissions and ensure file exists on server.

## 📊 Admin Dashboard Stats

View in License Verification tab:
- Total pending licenses
- Total approved licenses
- Total rejected licenses
- Recent submissions
- Average approval time

## 🔐 Security Features

- ✅ File type validation
- ✅ File size limits (5MB)
- ✅ Unique license numbers
- ✅ Role-based access control
- ✅ Secure file storage
- ✅ Audit logging
- ✅ Email verification

## 📱 Mobile Support

- ✅ Responsive upload form
- ✅ Mobile-friendly admin panel
- ✅ Touch-optimized buttons
- ✅ Mobile document preview

## 🔧 Configuration

### Environment Variables:
```env
MONGODB_URI=mongodb://localhost:27017/pharmily
EMAIL_SERVICE_API_KEY=your_key_here
UPLOAD_MAX_SIZE=5242880  # 5MB in bytes
```

### File Storage:
```
backend/uploads/licenses/
├── license-{userId}-{timestamp}.pdf
└── license-{userId}-{timestamp}.jpg
```

## 📈 Metrics to Monitor

- License submission rate
- Approval/rejection rate
- Average review time
- Re-upload rate after rejection
- User satisfaction scores

## 🎓 Training Resources

### For Users:
- How to upload license (video tutorial)
- What documents are acceptable
- How to check status
- What to do if rejected

### For Admins:
- How to review licenses
- Approval criteria
- How to write rejection reasons
- Best practices for verification

## 🆘 Support Contacts

- Technical Issues: tech-support@pharmily.com
- License Questions: license-support@pharmily.com
- Admin Help: admin-support@pharmily.com

## 📝 Changelog

### Version 1.0.0 (Oct 8, 2025)
- Initial implementation
- Added pharmacy school field
- Added year of graduation field
- Enhanced admin interface
- Improved email notifications

---

**Last Updated**: October 8, 2025
**Version**: 1.0.0
