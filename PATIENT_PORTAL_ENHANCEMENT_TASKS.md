# Patient Portal Enhancement - Implementation Tasks

**Project**: PharmaCare SaaS - Comprehensive Patient Portal
**Branch**: feature/Patient_Portal
**Created**: November 4, 2025
**Status**: Planning Phase

---

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Phase 0: Public Landing Page & Health Blog](#phase-0-public-landing-page--health-blog)
4. [Phase 1: Enhanced Patient Profile](#phase-1-enhanced-patient-profile)
5. [Phase 2: Medication Management](#phase-2-medication-management)
6. [Phase 3: Communication & Messaging](#phase-3-communication--messaging)
7. [Phase 4: Health Data & Records](#phase-4-health-data--records)
8. [Phase 5: Workspace Admin Interface](#phase-5-workspace-admin-interface)
9. [Phase 6: Frontend Implementation](#phase-6-frontend-implementation)
10. [Phase 7: Billing & Ratings](#phase-7-billing--ratings)
11. [Phase 8: Educational Resources](#phase-8-educational-resources)
12. [Phase 9: Testing & Quality Assurance](#phase-9-testing--quality-assurance)
13. [Phase 10: Deployment](#phase-10-deployment)
14. [Risk Assessment](#risk-assessment)
15. [Success Metrics](#success-metrics)

---

## Current State Analysis

### ✅ Already Implemented Features

1. **Authentication System**
   - ✅ Secure login with JWT tokens
   - ✅ Workspace-based patient accounts
   - ✅ Session management
   - **Files**: 
     - `backend/src/services/PatientAuthService.ts`
     - `backend/src/controllers/patientAuthController.ts`
     - `backend/src/middlewares/patientPortalAuth.ts`

2. **Appointment Features**
   - ✅ Appointment booking
   - ✅ Available slots checking
   - ✅ Confirmation system
   - ✅ Reminder scheduling
   - **Files**: 
     - `backend/src/services/PatientPortalService.ts`

3. **Basic Profile Management**
   - ✅ Profile viewing
   - ✅ Profile updates
   - ✅ Notification preferences

4. **Communication Infrastructure**
   - ✅ Multi-channel notifications (Email, SMS, WhatsApp)
   - ✅ Real-time messaging via Communication Hub

### ❌ Missing/Incomplete Features

#### **A. Patient Profile Management**
- ❌ Comprehensive allergy tracking
- ❌ Chronic condition management
- ❌ Insurance information
- ⚠️ Emergency contacts (partially implemented)

#### **B. Medication History & Tracking**
- ❌ Patient-facing medication list
- ❌ Dosage instruction display
- ❌ Refill status tracking
- ❌ Missed dose alerts
- ⚠️ Adherence tracking (backend exists but not exposed to patients)

#### **C. E-Prescription & Refill Requests**
- ❌ Patient view of prescriptions
- ❌ Refill request workflow
- ⚠️ Backend medication management exists but not patient-facing

#### **D. Appointment Scheduling**
- ✅ Booking system implemented
- ✅ Reminders system exists
- ⚠️ Needs UI enhancement

#### **E. Communication & Engagement**
- ⚠️ Secure messaging exists but needs patient portal integration
- ❌ Educational resources
- ⚠️ Adherence tools exist but not patient-facing

#### **F. Health Data & Monitoring**
- ❌ Lab results viewing
- ❌ Vitals logging by patients
- ❌ Downloadable records

#### **G. Financial & Administrative**
- ❌ Billing/payment viewing
- ❌ Feedback/ratings system

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT PORTAL SYSTEM                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
   │ Patient │          │ Workspace │        │  Admin    │
   │  Portal │          │   Admin   │        │ Dashboard │
   └────┬────┘          └─────┬─────┘        └─────┬─────┘
        │                     │                     │
   ┌────▼─────────────────────▼─────────────────────▼────┐
   │              API Gateway & Middleware               │
   └────┬────────────────────┬─────────────────────┬─────┘
        │                    │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ Patient │          │ Health  │          │ Billing │
   │ Service │          │ Service │          │ Service │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                    │                     │
   ┌────▼────────────────────▼─────────────────────▼────┐
   │              MongoDB Database Layer                │
   └─────────────────────────────────────────────────────┘
```

### Data Models Affected

1. **Patient** - Enhanced with allergies, chronic conditions, insurance
2. **PatientUser** - Existing authentication model
3. **Medication** - Existing medication model
4. **AdherenceTracking** - Existing adherence model
5. **DiagnosticResult** - Existing lab results model
6. **Visit** - Existing visit records
7. **Invoice/Payment** - Existing billing models
8. **ConsultationRating** - NEW model for feedback
9. **EducationalResource** - NEW model for content
10. **PatientVitals** - NEW embedded schema in Patient model

---

## Phase 0: Public Landing Page & Health Blog

**Duration**: Week 1  
**Priority**: CRITICAL  
**Dependencies**: None

### Overview

This phase implements the **public-facing landing page** for the Patient Portal with a health blog feature. The landing page is accessible to everyone (unauthenticated users) and showcases health tips, articles, and educational content written by the Super Admin. Once users authenticate, they gain access to the full patient portal features.

### User Flow

```
┌─────────────────────────────────────────────────────┐
│         Patient Portal Landing Page                 │
│         (Public - No Authentication)                │
│                                                     │
│  - Hero Section                                     │
│  - Health Blog Posts (Latest 6-9 posts)            │
│  - Call-to-Action (Login/Register)                 │
│  - About Section                                   │
│  - Features Overview                               │
└─────────────────────────────────────────────────────┘
                        │
                        ├─── Not Authenticated ───> Login/Register
                        │
                        └─── Authenticated ───> Patient Dashboard
```

### Tasks

#### 0.1 Database Schema - Health Blog

**New File**: `backend/src/models/HealthBlogPost.ts`

- [ ] **Task 0.1.1**: Create HealthBlogPost model
  ```typescript
  {
    title: String (required, max 200 chars),
    slug: String (required, unique, auto-generated from title),
    excerpt: String (required, max 300 chars),
    content: String (required, rich text/markdown),
    featuredImage: {
      url: String,
      alt: String,
      caption: String
    },
    category: Enum ['nutrition', 'wellness', 'medication', 'chronic_diseases', 'preventive_care', 'mental_health'],
    tags: [String],
    author: {
      id: ObjectId (ref: 'User'),
      name: String,
      avatar: String
    },
    status: Enum ['draft', 'published', 'archived'] (default: 'draft'),
    publishedAt: Date,
    readTime: Number (auto-calculated, minutes),
    viewCount: Number (default: 0),
    isFeatured: Boolean (default: false),
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    },
    relatedPosts: [ObjectId (ref: 'HealthBlogPost')],
    isDeleted: Boolean (default: false),
    createdAt: Date,
    updatedAt: Date
  }
  ```
  - **Indexes**: 
    - `{ slug: 1 }` (unique)
    - `{ status: 1, publishedAt: -1 }`
    - `{ category: 1, status: 1 }`
    - `{ tags: 1 }`
  - **Estimate**: 1.5 hours
  - **Testing**: Model validation tests

**Total Estimated Time**: 1.5 hours

#### 0.2 Backend Service Layer

**New File**: `backend/src/services/HealthBlogService.ts`

- [ ] **Task 0.2.1**: Create HealthBlogService class for public API
  - **Methods**:
    - `getPublishedPosts(limit, skip, category, tag)` - Get published posts (public)
    - `getPostBySlug(slug)` - Get single post by slug (public)
    - `getFeaturedPosts(limit)` - Get featured posts (public)
    - `getRelatedPosts(postId, limit)` - Get related posts (public)
    - `incrementViewCount(postId)` - Track post views
    - `searchPosts(query, filters)` - Search blog posts
  - **Estimate**: 2.5 hours
  - **Testing**: Service layer unit tests

**Total Estimated Time**: 2.5 hours

**New File**: `backend/src/services/HealthBlogAdminService.ts`

- [ ] **Task 0.2.2**: Create HealthBlogAdminService class for Super Admin
  - **Methods**:
    - `createPost(userId, postData)` - Create new post (Super Admin only)
    - `updatePost(postId, userId, updates)` - Update post (Super Admin only)
    - `deletePost(postId, userId)` - Soft delete post (Super Admin only)
    - `publishPost(postId, userId)` - Publish post (Super Admin only)
    - `unpublishPost(postId, userId)` - Unpublish post (Super Admin only)
    - `getAllPosts(filters, pagination)` - Get all posts including drafts (Super Admin only)
    - `uploadFeaturedImage(file)` - Upload image to cloud storage
    - `getBlogAnalytics()` - Get blog statistics (Super Admin only)
  - **Estimate**: 3 hours
  - **Testing**: Admin service tests with role checks

**Total Estimated Time**: 3 hours

#### 0.3 Controller Layer

**New File**: `backend/src/controllers/healthBlogController.ts` (Public API)

- [ ] **Task 0.3.1**: Create public blog controllers
  - **Endpoints**:
    - `GET /api/public/blog/posts` - Get published posts (paginated)
      - Query params: `page`, `limit`, `category`, `tag`
    - `GET /api/public/blog/posts/:slug` - Get post by slug
    - `GET /api/public/blog/featured` - Get featured posts
    - `GET /api/public/blog/posts/:slug/related` - Get related posts
    - `GET /api/public/blog/categories` - Get all categories with post counts
    - `GET /api/public/blog/tags` - Get popular tags
    - `POST /api/public/blog/posts/:slug/view` - Increment view count
  - **Note**: All endpoints are public (no authentication required)
  - **Estimate**: 2.5 hours
  - **Testing**: Controller integration tests

**Total Estimated Time**: 2.5 hours

**New File**: `backend/src/controllers/healthBlogAdminController.ts` (Super Admin API)

- [ ] **Task 0.3.2**: Create admin blog controllers
  - **Endpoints**:
    - `POST /api/super-admin/blog/posts` - Create post
    - `GET /api/super-admin/blog/posts` - Get all posts (including drafts)
    - `GET /api/super-admin/blog/posts/:postId` - Get post details
    - `PUT /api/super-admin/blog/posts/:postId` - Update post
    - `DELETE /api/super-admin/blog/posts/:postId` - Delete post
    - `PUT /api/super-admin/blog/posts/:postId/publish` - Publish post
    - `PUT /api/super-admin/blog/posts/:postId/unpublish` - Unpublish post
    - `POST /api/super-admin/blog/upload-image` - Upload featured image
    - `GET /api/super-admin/blog/analytics` - Get blog analytics
  - **Middleware**: `superAdminAuth` (Super Admin only)
  - **Estimate**: 3 hours
  - **Testing**: Admin controller tests with role verification

**Total Estimated Time**: 3 hours

#### 0.4 Route Configuration

**New File**: `backend/src/routes/healthBlog.routes.ts` (Public routes)

- [ ] **Task 0.4.1**: Configure public blog routes
  - No authentication required
  - Rate limiting for public endpoints
  - **Estimate**: 30 minutes

**New File**: `backend/src/routes/healthBlogAdmin.routes.ts` (Super Admin routes)

- [ ] **Task 0.4.2**: Configure admin blog routes
  - Apply `superAdminAuth` middleware
  - Apply validation middleware
  - File upload middleware for images
  - **Estimate**: 45 minutes

**Total Estimated Time**: 1.25 hours

#### 0.5 Middleware & Validation

**New File**: `backend/src/middlewares/superAdminAuth.ts`

- [ ] **Task 0.5.1**: Create Super Admin authentication middleware
  - Verify user is authenticated
  - Verify user has `super_admin` role
  - Return 403 if not authorized
  - **Estimate**: 1 hour
  - **Testing**: Middleware unit tests

**New File**: `backend/src/middlewares/healthBlogValidation.ts`

- [ ] **Task 0.5.2**: Create validation schemas
  - Create post validation (title, content, category, etc.)
  - Update post validation
  - Publish post validation
  - Query parameter validation
  - **Estimate**: 1.5 hours

**Total Estimated Time**: 2.5 hours

#### 0.6 Slug Generation Utility

**New File**: `backend/src/utils/slugify.ts`

- [ ] **Task 0.6.1**: Create slug generation utility
  - Convert title to URL-friendly slug
  - Handle uniqueness (append number if slug exists)
  - **Estimate**: 45 minutes

**Total Estimated Time**: 45 minutes

#### 0.7 Read Time Calculator

**New File**: `backend/src/utils/readTimeCalculator.ts`

- [ ] **Task 0.7.1**: Create read time calculator
  - Calculate reading time based on word count
  - Average reading speed: 200-250 words/minute
  - **Estimate**: 30 minutes

**Total Estimated Time**: 30 minutes

#### 0.8 Image Upload Configuration

**File Enhancement**: `backend/src/middlewares/upload.ts`

- [ ] **Task 0.8.1**: Configure blog image uploads
  - Support for featured images
  - Support for inline content images
  - Image optimization/compression
  - Upload to Cloudinary/S3
  - **Estimate**: 2 hours

**Total Estimated Time**: 2 hours

#### 0.9 Frontend - Landing Page

**New File**: `frontend/src/pages/public/PatientPortalLanding.tsx`

- [ ] **Task 0.9.1**: Create landing page
  - **Sections**:
    - Hero section with CTA
    - Featured blog posts (3 posts)
    - Latest blog posts grid (6-9 posts)
    - Features overview
    - About section
    - Footer with links
  - **Estimate**: 6 hours
  - **Design**: Responsive, mobile-first

**Total Estimated Time**: 6 hours

#### 0.10 Frontend - Blog Components

**New File**: `frontend/src/components/blog/BlogPostCard.tsx`

- [ ] **Task 0.10.1**: Create blog post card component
  - Featured image
  - Category badge
  - Title, excerpt
  - Author info
  - Read time
  - View count
  - **Estimate**: 2 hours

**New File**: `frontend/src/components/blog/BlogPostDetails.tsx`

- [ ] **Task 0.10.2**: Create blog post details page
  - Full post content (markdown/rich text rendering)
  - Author bio section
  - Related posts section
  - Social sharing buttons
  - **Estimate**: 3 hours

**New File**: `frontend/src/components/blog/BlogCategories.tsx`

- [ ] **Task 0.10.3**: Create category filter component
  - **Estimate**: 1 hour

**New File**: `frontend/src/components/blog/BlogSearch.tsx`

- [ ] **Task 0.10.4**: Create search component
  - **Estimate**: 1.5 hours

**Total Estimated Time**: 7.5 hours

#### 0.11 Frontend - Super Admin Blog Management

**New File**: `frontend/src/pages/super-admin/BlogManagement.tsx`

- [ ] **Task 0.11.1**: Create blog management dashboard
  - Blog posts table (all statuses)
  - Filter by status, category
  - Search functionality
  - Quick actions (publish, unpublish, delete)
  - Analytics cards (total posts, views, etc.)
  - **Estimate**: 5 hours

**New File**: `frontend/src/pages/super-admin/BlogPostEditor.tsx`

- [ ] **Task 0.11.2**: Create blog post editor
  - **Features**:
    - Rich text editor (TinyMCE, Quill, or similar)
    - Title, excerpt, content fields
    - Featured image upload with preview
    - Category selector
    - Tags input (multi-select)
    - SEO fields (meta title, description, keywords)
    - Slug editor (auto-generated, editable)
    - Featured post toggle
    - Save as draft / Publish buttons
    - Preview mode
  - **Estimate**: 8 hours
  - **Dependencies**: Install rich text editor library

**New File**: `frontend/src/components/super-admin/BlogAnalytics.tsx`

- [ ] **Task 0.11.3**: Create blog analytics component
  - Total posts
  - Total views
  - Most viewed posts
  - Posts by category (chart)
  - Publishing trends (chart)
  - **Estimate**: 4 hours
  - **Dependencies**: Chart library (Chart.js/Recharts)

**Total Estimated Time**: 17 hours

#### 0.12 Frontend - Routing

**File Enhancement**: `frontend/src/App.tsx` or routing file

- [ ] **Task 0.12.1**: Add public and admin blog routes
  ```typescript
  // Public routes (no authentication)
  <Route path="/" element={<PatientPortalLanding />} />
  <Route path="/blog" element={<BlogList />} />
  <Route path="/blog/:slug" element={<BlogPostDetails />} />
  <Route path="/blog/category/:category" element={<BlogList />} />
  
  // Super Admin routes (authentication + role check)
  <Route path="/super-admin/blog" element={<BlogManagement />} />
  <Route path="/super-admin/blog/new" element={<BlogPostEditor />} />
  <Route path="/super-admin/blog/edit/:postId" element={<BlogPostEditor />} />
  ```
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

#### 0.13 Frontend - Custom Hooks

**New File**: `frontend/src/hooks/useHealthBlog.ts`

- [ ] **Task 0.13.1**: Create health blog hook
  - `fetchPublishedPosts(page, limit, filters)`
  - `fetchPostBySlug(slug)`
  - `fetchFeaturedPosts()`
  - `searchPosts(query)`
  - **Estimate**: 2 hours

**New File**: `frontend/src/hooks/useHealthBlogAdmin.ts`

- [ ] **Task 0.13.2**: Create admin blog hook
  - `createPost(postData)`
  - `updatePost(postId, updates)`
  - `deletePost(postId)`
  - `publishPost(postId)`
  - `uploadImage(file)`
  - **Estimate**: 2 hours

**Total Estimated Time**: 4 hours

#### 0.14 SEO Optimization

**New File**: `frontend/src/components/SEO.tsx`

- [ ] **Task 0.14.1**: Create SEO component
  - Dynamic meta tags for blog posts
  - Open Graph tags for social sharing
  - Structured data (JSON-LD) for blog posts
  - **Estimate**: 2 hours

**Total Estimated Time**: 2 hours

#### 0.15 Super Admin Navigation Update

**File Enhancement**: `frontend/src/components/super-admin/SuperAdminSidebar.tsx`

- [ ] **Task 0.15.1**: Add Blog Management section to Super Admin sidebar
  ```typescript
  {
    name: 'Blog Management',
    icon: FileText,
    children: [
      { name: 'All Posts', href: '/super-admin/blog' },
      { name: 'Create Post', href: '/super-admin/blog/new' },
      { name: 'Analytics', href: '/super-admin/blog/analytics' }
    ]
  }
  ```
  - **Estimate**: 30 minutes

**Total Estimated Time**: 30 minutes

### Phase 0 Summary

#### Backend Time Breakdown:
- Database Schema: 1.5 hours
- Service Layer: 5.5 hours
- Controllers: 5.5 hours
- Routes: 1.25 hours
- Middleware & Validation: 2.5 hours
- Utilities: 1.25 hours
- Image Upload: 2 hours
- **Total Backend**: ~19.5 hours

#### Frontend Time Breakdown:
- Landing Page: 6 hours
- Blog Components: 7.5 hours
- Super Admin Blog Management: 17 hours
- Routing: 1 hour
- Custom Hooks: 4 hours
- SEO: 2 hours
- Navigation Update: 0.5 hours
- **Total Frontend**: ~38 hours

#### Testing & Documentation:
- Backend Unit Tests: 4 hours
- Frontend Component Tests: 3 hours
- Integration Tests: 2 hours
- E2E Tests: 2 hours
- Documentation: 2 hours
- **Total Testing & Docs**: ~13 hours

**Total Phase 0 Time**: ~70.5 hours (8-10 days)

### Phase 0 Acceptance Criteria

#### Public Landing Page:
- [ ] Landing page is accessible without authentication
- [ ] Latest published blog posts display correctly
- [ ] Featured posts show prominently
- [ ] Blog post cards show featured image, excerpt, read time
- [ ] Individual blog post pages render correctly with full content
- [ ] Category filtering works
- [ ] Search functionality works
- [ ] View count increments on post view
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] SEO meta tags are set correctly
- [ ] Social sharing works (Open Graph tags)

#### Super Admin Blog Management:
- [ ] Only Super Admin can access blog management section
- [ ] Super Admin can create new blog posts
- [ ] Rich text editor works properly
- [ ] Image upload works for featured images
- [ ] Super Admin can save posts as drafts
- [ ] Super Admin can publish/unpublish posts
- [ ] Super Admin can edit existing posts
- [ ] Super Admin can delete posts (soft delete)
- [ ] Super Admin can see blog analytics
- [ ] Post slug is auto-generated and editable
- [ ] Read time is auto-calculated
- [ ] SEO fields are editable

#### Technical Requirements:
- [ ] All API endpoints tested
- [ ] Role-based access control working (Super Admin only)
- [ ] Public endpoints have rate limiting
- [ ] Images are optimized and stored in cloud storage
- [ ] Markdown/Rich text rendering is secure (no XSS)
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests pass
- [ ] API documentation updated

---

## Phase 1: Enhanced Patient Profile

**Duration**: Weeks 2-3  
**Priority**: HIGH  
**Dependencies**: Phase 0

### Tasks

#### 1.1 Database Schema Updates

**File**: `backend/src/models/Patient.ts`

- [ ] **Task 1.1.1**: Add allergies schema
  ```typescript
  allergies: [
    {
      allergen: String (required),
      reaction: String (required),
      severity: Enum ['mild', 'moderate', 'severe'] (required),
      recordedDate: Date (default: now)
    }
  ]
  ```
  - **Estimate**: 30 minutes
  - **Assignee**: Backend Developer
  - **Testing**: Unit tests for allergy CRUD

- [ ] **Task 1.1.2**: Add chronic conditions schema
  ```typescript
  chronicConditions: [
    {
      condition: String (required),
      diagnosedDate: Date (required),
      managementPlan: String,
      status: Enum ['active', 'managed', 'resolved']
    }
  ]
  ```
  - **Estimate**: 30 minutes
  - **Testing**: Unit tests for chronic conditions

- [ ] **Task 1.1.3**: Enhance emergency contacts schema
  ```typescript
  emergencyContacts: [
    {
      name: String (required),
      relationship: String (required),
      phone: String (required),
      email: String,
      isPrimary: Boolean
    }
  ]
  ```
  - **Estimate**: 20 minutes
  - **Testing**: Validation tests

- [ ] **Task 1.1.4**: Add insurance information schema
  ```typescript
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    coverageDetails: String,
    copayAmount: Number
  }
  ```
  - **Estimate**: 20 minutes
  - **Testing**: Insurance validation tests

- [ ] **Task 1.1.5**: Add vitals history schema
  ```typescript
  vitalsHistory: [
    {
      recordedDate: Date (required),
      bloodPressure: { systolic: Number, diastolic: Number },
      heartRate: Number,
      temperature: Number,
      weight: Number,
      glucose: Number,
      oxygenSaturation: Number,
      notes: String,
      recordedBy: ObjectId,
      source: Enum ['patient_portal', 'clinical', 'device']
    }
  ]
  ```
  - **Estimate**: 45 minutes
  - **Testing**: Vitals logging tests

**Total Estimated Time**: 2.5 hours

#### 1.2 Backend Service Layer

**New File**: `backend/src/services/PatientProfileService.ts`

- [ ] **Task 1.2.1**: Create PatientProfileService class
  - **Methods**:
    - `getPatientProfile(patientId, workplaceId)`
    - `updatePatientProfile(patientId, workplaceId, updates)`
    - `addAllergy(patientId, allergyData)`
    - `removeAllergy(patientId, allergyId)`
    - `addChronicCondition(patientId, conditionData)`
    - `updateChronicCondition(patientId, conditionId, updates)`
    - `updateInsuranceInfo(patientId, insuranceData)`
    - `addEmergencyContact(patientId, contactData)`
    - `updateEmergencyContact(patientId, contactId, updates)`
  - **Estimate**: 3 hours
  - **Testing**: Service layer unit tests

**Total Estimated Time**: 3 hours

#### 1.3 Controller Layer

**New File**: `backend/src/controllers/patientProfileController.ts`

- [ ] **Task 1.3.1**: Create profile controllers
  - **Endpoints**:
    - `GET /api/patient-portal/profile` - Get full profile
    - `PUT /api/patient-portal/profile` - Update profile
    - `POST /api/patient-portal/profile/allergies` - Add allergy
    - `DELETE /api/patient-portal/profile/allergies/:allergyId` - Remove allergy
    - `POST /api/patient-portal/profile/chronic-conditions` - Add condition
    - `PUT /api/patient-portal/profile/chronic-conditions/:conditionId` - Update condition
    - `PUT /api/patient-portal/profile/insurance` - Update insurance
    - `POST /api/patient-portal/profile/emergency-contacts` - Add contact
    - `PUT /api/patient-portal/profile/emergency-contacts/:contactId` - Update contact
  - **Estimate**: 2.5 hours
  - **Testing**: Controller integration tests

**Total Estimated Time**: 2.5 hours

#### 1.4 Route Configuration

**New File**: `backend/src/routes/patientProfile.routes.ts`

- [ ] **Task 1.4.1**: Configure profile routes
  - Apply authentication middleware
  - Apply validation middleware
  - Configure rate limiting
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

#### 1.5 Validation Middleware

**New File**: `backend/src/middlewares/patientProfileValidation.ts`

- [ ] **Task 1.5.1**: Create validation schemas
  - Profile update validation
  - Allergy validation
  - Chronic condition validation
  - Insurance validation
  - Emergency contact validation
  - **Estimate**: 1.5 hours

**Total Estimated Time**: 1.5 hours

#### 1.6 Database Migration

**New File**: `backend/scripts/migrations/add-patient-profile-fields.ts`

- [ ] **Task 1.6.1**: Create migration script
  - Add new fields to existing patients
  - Set default values
  - **Estimate**: 1 hour
  - **Testing**: Test on staging data

**Total Estimated Time**: 1 hour

### Phase 1 Summary

- **Total Backend Time**: ~11.5 hours
- **Frontend Time**: TBD (Phase 6)
- **Testing Time**: ~4 hours
- **Documentation Time**: ~2 hours
- **Total Phase 1 Time**: ~17.5 hours (2-3 days)

### Phase 1 Acceptance Criteria

- [ ] Patient can view comprehensive profile including allergies, conditions, insurance
- [ ] Patient can add/update/remove allergies
- [ ] Patient can manage chronic conditions
- [ ] Patient can update insurance information
- [ ] Patient can manage emergency contacts
- [ ] All changes are properly validated
- [ ] All changes are logged for audit trail
- [ ] API responses follow standard format
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests pass
- [ ] API documentation updated

---

## Phase 2: Medication Management

**Duration**: Weeks 4-5  
**Priority**: HIGH  
**Dependencies**: Phase 1 (for profile context)

### Tasks

#### 2.1 Backend Service Layer

**New File**: `backend/src/services/PatientMedicationService.ts`

- [ ] **Task 2.1.1**: Create PatientMedicationService class
  - **Methods**:
    - `getCurrentMedications(patientId, workplaceId)` - Get active medications
    - `getMedicationHistory(patientId, workplaceId, limit)` - Get past medications
    - `getMedicationDetails(patientId, medicationId)` - Get single medication details
    - `getAdherenceData(patientId, workplaceId)` - Get adherence tracking
    - `requestRefill(patientId, workplaceId, medicationId, notes)` - Request refill
    - `getRefillRequests(patientId, workplaceId)` - Get refill request status
    - `cancelRefillRequest(patientId, requestId)` - Cancel refill request
  - **Estimate**: 4 hours
  - **Testing**: Service layer tests with mock data

- [ ] **Task 2.1.2**: Integrate with existing AdherenceTracking
  - Expose adherence data to patients
  - Calculate adherence scores
  - Generate adherence insights
  - **Estimate**: 2 hours

- [ ] **Task 2.1.3**: Implement refill request workflow
  - Create FollowUpTask for refill requests
  - Notify assigned pharmacist
  - Track request status
  - **Estimate**: 2 hours

**Total Estimated Time**: 8 hours

#### 2.2 Controller Layer

**New File**: `backend/src/controllers/patientMedicationController.ts`

- [ ] **Task 2.2.1**: Create medication controllers
  - **Endpoints**:
    - `GET /api/patient-portal/medications/current` - Get current meds
    - `GET /api/patient-portal/medications/history` - Get medication history
    - `GET /api/patient-portal/medications/:medicationId` - Get medication details
    - `GET /api/patient-portal/medications/adherence` - Get adherence data
    - `POST /api/patient-portal/medications/:medicationId/refill` - Request refill
    - `GET /api/patient-portal/medications/refill-requests` - Get refill requests
    - `DELETE /api/patient-portal/medications/refill-requests/:requestId` - Cancel request
  - **Estimate**: 3 hours
  - **Testing**: Controller integration tests

**Total Estimated Time**: 3 hours

#### 2.3 Route Configuration

**New File**: `backend/src/routes/patientMedication.routes.ts`

- [ ] **Task 2.3.1**: Configure medication routes
  - Apply authentication middleware
  - Apply validation middleware
  - Configure rate limiting (prevent spam refill requests)
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

#### 2.4 Notification System Integration

**File**: `backend/src/services/NotificationService.ts` (existing)

- [ ] **Task 2.4.1**: Add medication reminder notifications
  - Daily medication reminders
  - Missed dose alerts
  - Refill reminders (7 days before running out)
  - **Estimate**: 2 hours

- [ ] **Task 2.4.2**: Add refill request notifications
  - Notify pharmacist of new refill request
  - Notify patient when refill approved/denied
  - **Estimate**: 1 hour

**Total Estimated Time**: 3 hours

#### 2.5 Medication Alert System

**New File**: `backend/src/services/MedicationAlertService.ts`

- [ ] **Task 2.5.1**: Create alert service
  - Check refill status daily
  - Generate alerts for medications needing refill
  - Send notifications based on urgency
  - **Estimate**: 2.5 hours

- [ ] **Task 2.5.2**: Create scheduled job for alerts
  - Use node-cron or similar
  - Run daily at configured time
  - **Estimate**: 1 hour

**Total Estimated Time**: 3.5 hours

#### 2.6 Refill Status Tracking

**File**: `backend/src/models/Medication.ts` (enhancement)

- [ ] **Task 2.6.1**: Add refill tracking fields
  ```typescript
  prescription: {
    refillsRemaining: Number,
    refillsAuthorized: Number,
    lastRefillDate: Date,
    nextRefillDue: Date
  }
  ```
  - **Estimate**: 30 minutes

**Total Estimated Time**: 30 minutes

### Phase 2 Summary

- **Total Backend Time**: ~19 hours
- **Frontend Time**: TBD (Phase 6)
- **Testing Time**: ~6 hours
- **Documentation Time**: ~2 hours
- **Total Phase 2 Time**: ~27 hours (3-4 days)

### Phase 2 Acceptance Criteria

- [ ] Patient can view all current medications
- [ ] Patient can view medication history
- [ ] Patient can see detailed medication instructions
- [ ] Patient can view adherence score and trends
- [ ] Patient can request medication refills
- [ ] Patient receives notifications for:
  - [ ] Medication reminders
  - [ ] Missed doses
  - [ ] Upcoming refills
  - [ ] Refill request status updates
- [ ] Pharmacists receive refill request notifications
- [ ] Refill workflow integrates with existing FollowUpTask system
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests pass
- [ ] API documentation updated

---

## Phase 3: Communication & Messaging

**Duration**: Week 6  
**Priority**: MEDIUM  
**Dependencies**: Existing Communication Hub

### Tasks

#### 3.1 Patient Messaging Service

**New File**: `backend/src/services/PatientMessagingService.ts`

- [ ] **Task 3.1.1**: Create PatientMessagingService class
  - **Methods**:
    - `getOrCreateConversation(patientId, pharmacistId, workplaceId)` - Get/create conversation
    - `sendMessage(conversationId, senderId, content, attachments)` - Send message
    - `getMessages(conversationId, limit, skip)` - Get conversation messages
    - `getPatientConversations(patientId, workplaceId)` - Get all conversations
    - `markAsRead(conversationId, userId)` - Mark messages as read
    - `uploadAttachment(file)` - Upload file attachment
  - **Estimate**: 3 hours
  - **Testing**: Service layer tests

**Total Estimated Time**: 3 hours

#### 3.2 Controller Layer

**New File**: `backend/src/controllers/patientMessagingController.ts`

- [ ] **Task 3.2.1**: Create messaging controllers
  - **Endpoints**:
    - `GET /api/patient-portal/messages/conversations` - Get all conversations
    - `POST /api/patient-portal/messages/conversations` - Start new conversation
    - `GET /api/patient-portal/messages/conversations/:conversationId` - Get messages
    - `POST /api/patient-portal/messages/conversations/:conversationId` - Send message
    - `PUT /api/patient-portal/messages/conversations/:conversationId/read` - Mark as read
    - `POST /api/patient-portal/messages/attachments` - Upload attachment
  - **Estimate**: 2.5 hours
  - **Testing**: Controller integration tests

**Total Estimated Time**: 2.5 hours

#### 3.3 Real-time Integration

**File**: `backend/src/websocket/messageHandler.ts` (enhancement)

- [ ] **Task 3.3.1**: Add patient portal WebSocket support
  - Patient socket authentication
  - Real-time message delivery
  - Typing indicators
  - Online status
  - **Estimate**: 3 hours

**Total Estimated Time**: 3 hours

#### 3.4 Route Configuration

**New File**: `backend/src/routes/patientMessaging.routes.ts`

- [ ] **Task 3.4.1**: Configure messaging routes
  - Apply authentication middleware
  - Apply file upload middleware
  - Configure rate limiting
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

#### 3.5 File Upload Configuration

**File**: `backend/src/middlewares/upload.ts` (enhancement)

- [ ] **Task 3.5.1**: Configure patient portal uploads
  - Lab results, images, documents
  - File type validation (PDF, JPG, PNG)
  - File size limits (5MB per file)
  - Virus scanning integration (optional)
  - **Estimate**: 2 hours

**Total Estimated Time**: 2 hours

### Phase 3 Summary

- **Total Backend Time**: ~11.5 hours
- **Frontend Time**: TBD (Phase 6)
- **Testing Time**: ~4 hours
- **Documentation Time**: ~1.5 hours
- **Total Phase 3 Time**: ~17 hours (2-3 days)

### Phase 3 Acceptance Criteria

- [ ] Patient can start conversation with pharmacist
- [ ] Patient can send text messages
- [ ] Patient can upload attachments (images, PDFs)
- [ ] Patient receives real-time messages
- [ ] Patient can see typing indicators
- [ ] Patient can see message read status
- [ ] Messages are properly secured and encrypted
- [ ] File uploads are validated and scanned
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests pass
- [ ] Real-time functionality tested

---

## Phase 4: Health Data & Records

**Duration**: Week 7  
**Priority**: HIGH  
**Dependencies**: None

### Tasks

#### 4.1 Health Records Service

**New File**: `backend/src/services/PatientHealthRecordsService.ts`

- [ ] **Task 4.1.1**: Create PatientHealthRecordsService class
  - **Methods**:
    - `getLabResults(patientId, workplaceId, limit)` - Get lab results
    - `getLabResultDetails(patientId, resultId)` - Get specific result
    - `getVisitHistory(patientId, workplaceId, limit)` - Get visit records
    - `getVisitDetails(patientId, visitId)` - Get specific visit
    - `logVitals(patientId, workplaceId, vitalsData)` - Log patient vitals
    - `getVitalsTrends(patientId, workplaceId, days)` - Get vitals trends
    - `getVitalsHistory(patientId, workplaceId, limit)` - Get vitals history
    - `downloadMedicalRecords(patientId, workplaceId)` - Generate PDF
  - **Estimate**: 4 hours
  - **Testing**: Service layer tests

**Total Estimated Time**: 4 hours

#### 4.2 Controller Layer

**New File**: `backend/src/controllers/patientHealthRecordsController.ts`

- [ ] **Task 4.2.1**: Create health records controllers
  - **Endpoints**:
    - `GET /api/patient-portal/health-records/labs` - Get lab results
    - `GET /api/patient-portal/health-records/labs/:resultId` - Get lab result details
    - `GET /api/patient-portal/health-records/visits` - Get visit history
    - `GET /api/patient-portal/health-records/visits/:visitId` - Get visit details
    - `POST /api/patient-portal/health-records/vitals` - Log vitals
    - `GET /api/patient-portal/health-records/vitals` - Get vitals history
    - `GET /api/patient-portal/health-records/vitals/trends` - Get vitals trends
    - `GET /api/patient-portal/health-records/download` - Download records (PDF)
  - **Estimate**: 3 hours
  - **Testing**: Controller integration tests

**Total Estimated Time**: 3 hours

#### 4.3 Vitals Logging Feature

- [ ] **Task 4.3.1**: Create vitals validation
  - Blood pressure range validation
  - Heart rate validation
  - Temperature validation
  - Glucose level validation
  - Weight validation
  - **Estimate**: 1.5 hours

- [ ] **Task 4.3.2**: Create vitals alerts
  - Alert pharmacist if abnormal vitals detected
  - Define normal ranges by age/condition
  - **Estimate**: 2 hours

**Total Estimated Time**: 3.5 hours

#### 4.4 PDF Generation Service

**New File**: `backend/src/services/PDFGenerationService.ts`

- [ ] **Task 4.4.1**: Implement medical records PDF generation
  - Use PDFKit or similar library
  - Include patient profile, medications, vitals, lab results
  - Professional formatting with workspace branding
  - **Estimate**: 4 hours
  - **Dependencies**: Install pdfkit package

**Total Estimated Time**: 4 hours

#### 4.5 Route Configuration

**New File**: `backend/src/routes/patientHealthRecords.routes.ts`

- [ ] **Task 4.5.1**: Configure health records routes
  - Apply authentication middleware
  - Apply validation middleware
  - Configure rate limiting
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

### Phase 4 Summary

- **Total Backend Time**: ~15.5 hours
- **Frontend Time**: TBD (Phase 6)
- **Testing Time**: ~5 hours
- **Documentation Time**: ~2 hours
- **Total Phase 4 Time**: ~22.5 hours (3 days)

### Phase 4 Acceptance Criteria

- [ ] Patient can view lab results
- [ ] Patient can view visit history
- [ ] Patient can log vitals (BP, heart rate, glucose, etc.)
- [ ] Patient can see vitals trends over time
- [ ] Patient can download complete medical records as PDF
- [ ] Abnormal vitals trigger alerts to pharmacist
- [ ] All data is properly secured and privacy-compliant
- [ ] PDF generation works correctly with proper formatting
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests pass

---

## Phase 5: Workspace Admin Interface

**Duration**: Weeks 8-9  
**Priority**: HIGH  
**Dependencies**: Phases 1-4

### Tasks

#### 5.1 Admin Service Layer

**New File**: `backend/src/services/PatientPortalAdminService.ts`

- [ ] **Task 5.1.1**: Create PatientPortalAdminService class
  - **Methods**:
    - `getPatientPortalUsers(workplaceId, filters, pagination)` - Get all patient users
    - `approvePatientUser(workplaceId, patientUserId)` - Approve patient account
    - `suspendPatientUser(workplaceId, patientUserId, reason)` - Suspend account
    - `reactivatePatientUser(workplaceId, patientUserId)` - Reactivate account
    - `getRefillRequests(workplaceId, status)` - Get refill requests
    - `approveRefillRequest(workplaceId, requestId, pharmacistId)` - Approve refill
    - `denyRefillRequest(workplaceId, requestId, reason)` - Deny refill
    - `getPortalAnalytics(workplaceId)` - Get usage analytics
    - `getPatientActivity(workplaceId, patientId)` - Get patient activity log
  - **Estimate**: 4 hours
  - **Testing**: Service layer tests

**Total Estimated Time**: 4 hours

#### 5.2 Analytics Service

**New File**: `backend/src/services/PatientPortalAnalyticsService.ts`

- [ ] **Task 5.2.1**: Create analytics service
  - Total patient portal users
  - Active users (last 30 days)
  - Pending approvals
  - Portal appointments booked
  - Refill requests (pending/approved/denied)
  - Messages sent/received
  - Average response time
  - Patient engagement score
  - **Estimate**: 3 hours

**Total Estimated Time**: 3 hours

#### 5.3 Controller Layer

**New File**: `backend/src/controllers/patientPortalAdminController.ts`

- [ ] **Task 5.3.1**: Create admin controllers
  - **Endpoints**:
    - `GET /api/workspace/patient-portal/patients` - List patient users
    - `PUT /api/workspace/patient-portal/patients/:patientUserId/approve` - Approve user
    - `PUT /api/workspace/patient-portal/patients/:patientUserId/suspend` - Suspend user
    - `PUT /api/workspace/patient-portal/patients/:patientUserId/reactivate` - Reactivate
    - `GET /api/workspace/patient-portal/refill-requests` - Get refill requests
    - `PUT /api/workspace/patient-portal/refill-requests/:requestId/approve` - Approve
    - `PUT /api/workspace/patient-portal/refill-requests/:requestId/deny` - Deny
    - `GET /api/workspace/patient-portal/analytics` - Get analytics
    - `GET /api/workspace/patient-portal/patients/:patientUserId/activity` - Activity log
    - `GET /api/workspace/patient-portal/settings` - Get portal settings
    - `PUT /api/workspace/patient-portal/settings` - Update portal settings
  - **Estimate**: 3.5 hours
  - **Testing**: Controller integration tests

**Total Estimated Time**: 3.5 hours

#### 5.4 Portal Settings Model

**New File**: `backend/src/models/PatientPortalSettings.ts`

- [ ] **Task 5.4.1**: Create portal settings model
  ```typescript
  {
    workplaceId: ObjectId,
    isEnabled: Boolean (default: true),
    requireApproval: Boolean (default: true),
    allowedFeatures: {
      messaging: Boolean,
      appointments: Boolean,
      medications: Boolean,
      vitals: Boolean,
      labResults: Boolean,
      billing: Boolean
    },
    appointmentSettings: {
      allowBooking: Boolean,
      advanceBookingDays: Number,
      cancellationHours: Number
    },
    messagingSettings: {
      allowPatientInitiated: Boolean,
      allowAttachments: Boolean,
      maxAttachmentSize: Number
    },
    notifications: {
      appointmentReminders: Boolean,
      medicationReminders: Boolean,
      refillReminders: Boolean
    }
  }
  ```
  - **Estimate**: 1.5 hours

**Total Estimated Time**: 1.5 hours

#### 5.5 Route Configuration

**New File**: `backend/src/routes/patientPortalAdmin.routes.ts`

- [ ] **Task 5.5.1**: Configure admin routes
  - Apply authentication middleware
  - Apply workspace admin role check
  - Apply validation middleware
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

#### 5.6 Activity Logging

**New File**: `backend/src/models/PatientPortalActivity.ts`

- [ ] **Task 5.6.1**: Create activity log model
  ```typescript
  {
    workplaceId: ObjectId,
    patientUserId: ObjectId,
    action: String, // login, profile_update, message_sent, etc.
    details: Object,
    ipAddress: String,
    userAgent: String,
    timestamp: Date
  }
  ```
  - **Estimate**: 1 hour

- [ ] **Task 5.6.2**: Implement activity tracking middleware
  - Track all patient portal actions
  - **Estimate**: 1.5 hours

**Total Estimated Time**: 2.5 hours

### Phase 5 Summary

- **Total Backend Time**: ~15.5 hours
- **Frontend Time**: TBD (Phase 6)
- **Testing Time**: ~5 hours
- **Documentation Time**: ~2 hours
- **Total Phase 5 Time**: ~22.5 hours (3 days)

### Phase 5 Acceptance Criteria

- [ ] Workspace admin can view all patient portal users
- [ ] Workspace admin can approve/suspend patient accounts
- [ ] Workspace admin can view refill requests
- [ ] Workspace admin can approve/deny refill requests
- [ ] Workspace admin can view portal analytics
- [ ] Workspace admin can configure portal settings
- [ ] Workspace admin can view patient activity logs
- [ ] All admin actions are logged
- [ ] Role-based access control enforced
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests pass

---

## Phase 6: Frontend Implementation

**Duration**: Weeks 10-13  
**Priority**: HIGH  
**Dependencies**: Phases 1-5

### Tasks

#### 6.1 Project Structure Setup

- [ ] **Task 6.1.1**: Create patient portal folder structure
  ```
  frontend/src/
    pages/patient-portal/
      PatientDashboard.tsx
      PatientProfile.tsx
      PatientMedications.tsx
      PatientAppointments.tsx
      PatientMessages.tsx
      PatientHealthRecords.tsx
      PatientBilling.tsx
      PatientSettings.tsx
    components/patient-portal/
      ProfileCard.tsx
      MedicationCard.tsx
      AppointmentCard.tsx
      VitalsChart.tsx
      LabResultCard.tsx
      MessageThread.tsx
      etc.
    hooks/
      usePatientAuth.ts
      usePatientProfile.ts
      usePatientMedications.ts
      usePatientAppointments.ts
      usePatientMessages.ts
      usePatientHealthRecords.ts
    contexts/
      PatientAuthContext.tsx
    services/
      patientPortalApi.ts
  ```
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

#### 6.2 Authentication & Context

- [ ] **Task 6.2.1**: Create PatientAuthContext
  - Patient authentication state
  - Login/logout functions
  - Token management
  - **Estimate**: 2 hours

- [ ] **Task 6.2.2**: Create usePatientAuth hook
  - **Estimate**: 1 hour

- [ ] **Task 6.2.3**: Create PatientPortalRoute guard
  - Redirect if not authenticated
  - **Estimate**: 1 hour

**Total Estimated Time**: 4 hours

#### 6.3 API Service Layer

**File**: `frontend/src/services/patientPortalApi.ts`

- [ ] **Task 6.3.1**: Create API service
  - Axios instance with auth headers
  - Profile APIs
  - Medication APIs
  - Appointment APIs
  - Messaging APIs
  - Health records APIs
  - Billing APIs
  - **Estimate**: 3 hours

**Total Estimated Time**: 3 hours

#### 6.4 Custom Hooks

- [ ] **Task 6.4.1**: Create usePatientProfile hook
  - Fetch profile
  - Update profile
  - Manage allergies, conditions, insurance
  - **Estimate**: 2 hours

- [ ] **Task 6.4.2**: Create usePatientMedications hook
  - Fetch current medications
  - Fetch medication history
  - Fetch adherence data
  - Request refill
  - **Estimate**: 2 hours

- [ ] **Task 6.4.3**: Create usePatientAppointments hook
  - Fetch appointments
  - Book appointment
  - Cancel appointment
  - **Estimate**: 1.5 hours

- [ ] **Task 6.4.4**: Create usePatientMessages hook
  - Fetch conversations
  - Send message
  - Real-time updates
  - **Estimate**: 2.5 hours

- [ ] **Task 6.4.5**: Create usePatientHealthRecords hook
  - Fetch lab results
  - Fetch vitals
  - Log vitals
  - Download records
  - **Estimate**: 2 hours

**Total Estimated Time**: 10 hours

#### 6.5 Dashboard Page

**File**: `frontend/src/pages/patient-portal/PatientDashboard.tsx`

- [ ] **Task 6.5.1**: Create dashboard layout
  - Quick stats cards
  - Upcoming appointments widget
  - Current medications widget
  - Recent messages widget
  - Health records widget
  - Quick actions
  - **Estimate**: 6 hours
  - **Design**: Figma mockup required

**Total Estimated Time**: 6 hours

#### 6.6 Profile Management Page

**File**: `frontend/src/pages/patient-portal/PatientProfile.tsx`

- [ ] **Task 6.6.1**: Create profile page
  - Personal information section
  - Allergies management
  - Chronic conditions management
  - Emergency contacts management
  - Insurance information
  - **Estimate**: 5 hours

**Total Estimated Time**: 5 hours

#### 6.7 Medications Page

**File**: `frontend/src/pages/patient-portal/PatientMedications.tsx`

- [ ] **Task 6.7.1**: Create medications page
  - Current medications tab
  - Medication history tab
  - Adherence tracking tab
  - Medication cards with refill status
  - Refill request functionality
  - Adherence score visualization
  - **Estimate**: 7 hours

**Total Estimated Time**: 7 hours

#### 6.8 Appointments Page

**File**: `frontend/src/pages/patient-portal/PatientAppointments.tsx`

- [ ] **Task 6.8.1**: Create appointments page
  - Upcoming appointments list
  - Past appointments list
  - Book new appointment form
  - Available slots calendar
  - Appointment details modal
  - Cancel appointment functionality
  - **Estimate**: 6 hours

**Total Estimated Time**: 6 hours

#### 6.9 Messaging Page

**File**: `frontend/src/pages/patient-portal/PatientMessages.tsx`

- [ ] **Task 6.9.1**: Create messaging page
  - Conversations list
  - Message thread view
  - Send message form
  - File attachment upload
  - Real-time message updates
  - Typing indicators
  - **Estimate**: 8 hours

**Total Estimated Time**: 8 hours

#### 6.10 Health Records Page

**File**: `frontend/src/pages/patient-portal/PatientHealthRecords.tsx`

- [ ] **Task 6.10.1**: Create health records page
  - Lab results tab
  - Vitals tab
  - Visit history tab
  - Log vitals form
  - Vitals trend charts
  - Download records button
  - **Estimate**: 7 hours

**Total Estimated Time**: 7 hours

#### 6.11 Reusable Components

- [ ] **Task 6.11.1**: Create ProfileCard component
  - **Estimate**: 1 hour

- [ ] **Task 6.11.2**: Create MedicationCard component
  - **Estimate**: 1.5 hours

- [ ] **Task 6.11.3**: Create AppointmentCard component
  - **Estimate**: 1 hour

- [ ] **Task 6.11.4**: Create VitalsChart component (using Chart.js/Recharts)
  - **Estimate**: 3 hours

- [ ] **Task 6.11.5**: Create LabResultCard component
  - **Estimate**: 1.5 hours

- [ ] **Task 6.11.6**: Create MessageThread component
  - **Estimate**: 2 hours

- [ ] **Task 6.11.7**: Create StatCard component
  - **Estimate**: 1 hour

**Total Estimated Time**: 11 hours

#### 6.12 Workspace Admin Frontend

- [ ] **Task 6.12.1**: Create PatientPortalAdmin page
  - Patient users list
  - Approval queue
  - Refill requests management
  - Analytics dashboard
  - Portal settings
  - **Estimate**: 8 hours

**Total Estimated Time**: 8 hours

#### 6.13 Responsive Design

- [ ] **Task 6.13.1**: Ensure mobile responsiveness
  - All pages responsive
  - Mobile navigation
  - Touch-friendly interactions
  - **Estimate**: 6 hours

**Total Estimated Time**: 6 hours

#### 6.14 Accessibility

- [ ] **Task 6.14.1**: Implement accessibility features
  - ARIA labels
  - Keyboard navigation
  - Screen reader support
  - Color contrast compliance
  - **Estimate**: 4 hours

**Total Estimated Time**: 4 hours

### Phase 6 Summary

- **Total Frontend Time**: ~80 hours
- **Testing Time**: ~15 hours
- **Documentation Time**: ~3 hours
- **Total Phase 6 Time**: ~98 hours (12-14 days)

### Phase 6 Acceptance Criteria

- [ ] All patient portal pages implemented
- [ ] All features from backend accessible via UI
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Real-time features working (messaging, notifications)
- [ ] Charts and visualizations rendering correctly
- [ ] Error handling and loading states implemented
- [ ] Unit tests pass for components
- [ ] E2E tests pass
- [ ] UI/UX review completed

---

## Phase 7: Billing & Ratings

**Duration**: Week 14  
**Priority**: MEDIUM  
**Dependencies**: Phase 1-5

### Tasks

#### 7.1 Billing Service

**New File**: `backend/src/services/PatientBillingService.ts`

- [ ] **Task 7.1.1**: Create PatientBillingService class
  - **Methods**:
    - `getPatientInvoices(patientId, workplaceId, status)` - Get invoices
    - `getInvoiceDetails(patientId, invoiceId)` - Get invoice details
    - `getPaymentHistory(patientId, workplaceId)` - Get payments
    - `getOutstandingBalance(patientId, workplaceId)` - Get balance
    - `initiatePayment(patientId, invoiceId, paymentMethod)` - Start payment
  - **Estimate**: 3 hours

**Total Estimated Time**: 3 hours

#### 7.2 Payment Integration

**File**: `backend/src/services/PaymentService.ts` (enhancement)

- [ ] **Task 7.2.1**: Add patient portal payment support
  - Paystack/Flutterwave integration
  - Payment webhook handling
  - Payment confirmation
  - **Estimate**: 4 hours
  - **Dependencies**: Payment gateway credentials

**Total Estimated Time**: 4 hours

#### 7.3 Rating System

**New File**: `backend/src/models/ConsultationRating.ts`

- [ ] **Task 7.3.1**: Create rating model
  ```typescript
  {
    workplaceId: ObjectId,
    patientId: ObjectId,
    pharmacistId: ObjectId,
    appointmentId: ObjectId,
    rating: Number (1-5),
    feedback: String,
    categories: {
      professionalism: Number (1-5),
      communication: Number (1-5),
      expertise: Number (1-5),
      timeliness: Number (1-5)
    },
    isAnonymous: Boolean,
    response: {
      text: String,
      respondedBy: ObjectId,
      respondedAt: Date
    }
  }
  ```
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

#### 7.4 Rating Service

**New File**: `backend/src/services/RatingService.ts`

- [ ] **Task 7.4.1**: Create RatingService class
  - **Methods**:
    - `submitRating(patientId, ratingData)` - Submit rating
    - `getPharmacistRating(pharmacistId, workplaceId)` - Get average rating
    - `getPatientRatings(patientId, workplaceId)` - Get patient's ratings
    - `respondToRating(ratingId, response)` - Pharmacist responds
  - **Estimate**: 2 hours

**Total Estimated Time**: 2 hours

#### 7.5 Controllers

- [ ] **Task 7.5.1**: Create billing controllers
  - **Endpoints**:
    - `GET /api/patient-portal/billing/invoices` - Get invoices
    - `GET /api/patient-portal/billing/invoices/:invoiceId` - Get invoice
    - `GET /api/patient-portal/billing/payments` - Get payments
    - `GET /api/patient-portal/billing/balance` - Get balance
    - `POST /api/patient-portal/billing/pay/:invoiceId` - Initiate payment
  - **Estimate**: 2 hours

- [ ] **Task 7.5.2**: Create rating controllers
  - **Endpoints**:
    - `POST /api/patient-portal/ratings` - Submit rating
    - `GET /api/patient-portal/ratings` - Get my ratings
    - `GET /api/patient-portal/pharmacists/:pharmacistId/rating` - Get pharmacist rating
  - **Estimate**: 1.5 hours

**Total Estimated Time**: 3.5 hours

#### 7.6 Frontend

- [ ] **Task 7.6.1**: Create Billing page
  - Invoices list
  - Payment history
  - Outstanding balance
  - Payment form
  - **Estimate**: 5 hours

- [ ] **Task 7.6.2**: Create Rating modal/page
  - Star rating component
  - Category ratings
  - Feedback textarea
  - Submit functionality
  - **Estimate**: 3 hours

**Total Estimated Time**: 8 hours

### Phase 7 Summary

- **Total Backend Time**: ~13.5 hours
- **Total Frontend Time**: ~8 hours
- **Testing Time**: ~5 hours
- **Documentation Time**: ~2 hours
- **Total Phase 7 Time**: ~28.5 hours (3-4 days)

### Phase 7 Acceptance Criteria

- [ ] Patient can view invoices
- [ ] Patient can make payments
- [ ] Patient can view payment history
- [ ] Patient can submit consultation ratings
- [ ] Patient can provide detailed feedback
- [ ] Pharmacists can view their ratings
- [ ] Payment integration working correctly
- [ ] Payment webhooks handled properly
- [ ] Unit tests pass
- [ ] Integration tests pass

---

## Phase 8: Educational Resources

**Duration**: Week 15  
**Priority**: LOW  
**Dependencies**: None

### Tasks

#### 8.1 Educational Resource Model

**New File**: `backend/src/models/EducationalResource.ts`

- [ ] **Task 8.1.1**: Create resource model
  ```typescript
  {
    workplaceId: ObjectId,
    title: String,
    content: String,
    category: Enum ['medication', 'condition', 'wellness', 'faq'],
    tags: [String],
    mediaType: Enum ['article', 'video', 'infographic'],
    mediaUrl: String,
    thumbnail: String,
    isPublished: Boolean,
    viewCount: Number,
    createdBy: ObjectId,
    localizedFor: String // 'nigeria', 'general'
  }
  ```
  - **Estimate**: 1 hour

**Total Estimated Time**: 1 hour

#### 8.2 Educational Resource Service

**New File**: `backend/src/services/EducationalResourceService.ts`

- [ ] **Task 8.2.1**: Create resource service
  - **Methods**:
    - `getResources(workplaceId, category, tags)` - Get resources
    - `getResourceDetails(resourceId)` - Get resource
    - `searchResources(query)` - Search resources
    - `trackView(resourceId)` - Track view
  - **Estimate**: 2 hours

**Total Estimated Time**: 2 hours

#### 8.3 Controllers & Routes

- [ ] **Task 8.3.1**: Create resource controllers
  - **Endpoints**:
    - `GET /api/patient-portal/resources` - List resources
    - `GET /api/patient-portal/resources/:resourceId` - Get resource
    - `GET /api/patient-portal/resources/search` - Search resources
  - **Estimate**: 1.5 hours

**Total Estimated Time**: 1.5 hours

#### 8.4 Admin Interface

- [ ] **Task 8.4.1**: Create admin CRUD for resources
  - Create, update, delete resources
  - Upload media
  - Publish/unpublish
  - **Estimate**: 4 hours

**Total Estimated Time**: 4 hours

#### 8.5 Frontend

- [ ] **Task 8.5.1**: Create Resources page
  - Resource library
  - Category filters
  - Search functionality
  - Resource viewer
  - **Estimate**: 5 hours

**Total Estimated Time**: 5 hours

### Phase 8 Summary

- **Total Time**: ~13.5 hours (2 days)

### Phase 8 Acceptance Criteria

- [ ] Patients can browse educational resources
- [ ] Resources categorized properly
- [ ] Search functionality working
- [ ] Video/article content displaying correctly
- [ ] Admin can manage resources
- [ ] View tracking implemented

---

## Phase 9: Testing & Quality Assurance

**Duration**: Weeks 16-17  
**Priority**: CRITICAL  
**Dependencies**: All previous phases

### Tasks

#### 9.1 Backend Unit Tests

- [ ] **Task 9.1.1**: Write unit tests for all services
  - PatientProfileService (10 tests)
  - PatientMedicationService (15 tests)
  - PatientMessagingService (12 tests)
  - PatientHealthRecordsService (12 tests)
  - PatientBillingService (8 tests)
  - RatingService (6 tests)
  - **Target**: >80% coverage
  - **Estimate**: 12 hours

**Total Estimated Time**: 12 hours

#### 9.2 Backend Integration Tests

- [ ] **Task 9.2.1**: Write integration tests for all APIs
  - Profile APIs (8 tests)
  - Medication APIs (10 tests)
  - Messaging APIs (8 tests)
  - Health Records APIs (8 tests)
  - Billing APIs (6 tests)
  - Rating APIs (4 tests)
  - **Estimate**: 10 hours

**Total Estimated Time**: 10 hours

#### 9.3 Frontend Unit Tests

- [ ] **Task 9.3.1**: Write unit tests for components
  - Test all major components
  - Test custom hooks
  - Test utility functions
  - **Target**: >70% coverage
  - **Estimate**: 15 hours

**Total Estimated Time**: 15 hours

#### 9.4 E2E Tests

- [ ] **Task 9.4.1**: Write E2E tests with Playwright/Cypress
  - Patient registration flow
  - Login flow
  - Profile management flow
  - Medication viewing flow
  - Appointment booking flow
  - Messaging flow
  - Vitals logging flow
  - **Estimate**: 12 hours

**Total Estimated Time**: 12 hours

#### 9.5 Security Testing

- [ ] **Task 9.5.1**: Security audit
  - Authentication/authorization testing
  - SQL injection testing
  - XSS testing
  - CSRF protection
  - Rate limiting verification
  - Data encryption verification
  - **Estimate**: 6 hours

**Total Estimated Time**: 6 hours

#### 9.6 Performance Testing

- [ ] **Task 9.6.1**: Load testing
  - API endpoint performance
  - Database query optimization
  - Frontend bundle size optimization
  - **Estimate**: 4 hours

**Total Estimated Time**: 4 hours

#### 9.7 Accessibility Testing

- [ ] **Task 9.7.1**: A11y audit
  - Automated testing (axe-core)
  - Manual keyboard navigation testing
  - Screen reader testing
  - **Estimate**: 4 hours

**Total Estimated Time**: 4 hours

#### 9.8 Cross-browser Testing

- [ ] **Task 9.8.1**: Browser compatibility
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers
  - **Estimate**: 3 hours

**Total Estimated Time**: 3 hours

#### 9.9 Bug Fixing

- [ ] **Task 9.9.1**: Fix identified bugs
  - Critical bugs
  - High priority bugs
  - Medium priority bugs
  - **Estimate**: 16 hours

**Total Estimated Time**: 16 hours

### Phase 9 Summary

- **Total Testing Time**: ~82 hours (10 days)

### Phase 9 Acceptance Criteria

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Security vulnerabilities addressed
- [ ] Performance benchmarks met
- [ ] Accessibility standards met
- [ ] Cross-browser compatibility verified
- [ ] All critical/high bugs fixed

---

## Phase 10: Deployment

**Duration**: Week 18  
**Priority**: CRITICAL  
**Dependencies**: Phase 9

### Tasks

#### 10.1 Environment Setup

- [ ] **Task 10.1.1**: Configure production environment
  - Environment variables
  - Database configuration
  - Redis configuration
  - File storage (S3/Cloudinary)
  - **Estimate**: 2 hours

**Total Estimated Time**: 2 hours

#### 10.2 Database Migration

- [ ] **Task 10.2.1**: Run production migrations
  - Backup production database
  - Run migration scripts
  - Verify data integrity
  - **Estimate**: 3 hours

**Total Estimated Time**: 3 hours

#### 10.3 Deployment

- [ ] **Task 10.3.1**: Deploy backend
  - Build backend
  - Deploy to VPS/cloud
  - Configure PM2/Docker
  - **Estimate**: 2 hours

- [ ] **Task 10.3.2**: Deploy frontend
  - Build frontend
  - Deploy to CDN/hosting
  - Configure domain
  - **Estimate**: 2 hours

**Total Estimated Time**: 4 hours

#### 10.4 Monitoring Setup

- [ ] **Task 10.4.1**: Configure monitoring
  - Application monitoring (Sentry)
  - Performance monitoring
  - Error tracking
  - Log aggregation
  - **Estimate**: 3 hours

**Total Estimated Time**: 3 hours

#### 10.5 Documentation

- [ ] **Task 10.5.1**: Complete documentation
  - API documentation (Swagger/Postman)
  - User guide for patients
  - Admin guide for workspace admins
  - Developer documentation
  - **Estimate**: 8 hours

**Total Estimated Time**: 8 hours

#### 10.6 Training

- [ ] **Task 10.6.1**: Conduct training sessions
  - Train workspace admins
  - Create video tutorials
  - Create FAQ document
  - **Estimate**: 6 hours

**Total Estimated Time**: 6 hours

#### 10.7 Rollout Plan

- [ ] **Task 10.7.1**: Phased rollout
  - Beta testing with 1-2 workspaces
  - Gather feedback
  - Fix issues
  - Full rollout
  - **Estimate**: Ongoing (1 week)

**Total Estimated Time**: Ongoing

### Phase 10 Summary

- **Total Deployment Time**: ~26 hours (3-4 days)

### Phase 10 Acceptance Criteria

- [ ] Application deployed to production
- [ ] All services running correctly
- [ ] Monitoring and alerts configured
- [ ] Documentation completed
- [ ] Training materials created
- [ ] Beta testing successful
- [ ] Full rollout completed
- [ ] Backup and disaster recovery plan in place

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Integration issues with existing systems | Medium | High | Thorough integration testing, use existing patterns |
| Performance issues with large datasets | Medium | Medium | Implement pagination, caching, database indexing |
| Real-time messaging scalability | Low | Medium | Use Redis for WebSocket scaling |
| Third-party payment gateway issues | Low | High | Implement robust error handling, fallback options |
| Data privacy/security vulnerabilities | Low | Critical | Security audit, encryption, access controls |

### Project Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | High | High | Strict phase definitions, change control process |
| Timeline delays | Medium | Medium | Buffer time in estimates, prioritize features |
| Resource unavailability | Medium | High | Cross-training, documentation |
| Requirement changes | Medium | Medium | Agile approach, iterative development |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Low patient adoption | Medium | High | User-friendly design, training, marketing |
| Workspace admin resistance | Low | Medium | Clear benefits demonstration, support |
| Regulatory compliance issues | Low | Critical | Legal review, HIPAA/GDPR compliance |

---

## Success Metrics

### User Adoption Metrics

- **Patient Portal Registration Rate**: Target 40% of patients within 3 months
- **Active Users**: Target 60% of registered patients using portal monthly
- **Feature Usage**: Track usage of each feature
- **Patient Satisfaction**: Target 4.5/5 average rating

### Operational Metrics

- **Response Time**: Average API response time < 500ms
- **Uptime**: 99.5% uptime target
- **Error Rate**: < 0.5% error rate
- **Refill Request Processing**: Average processing time < 24 hours

### Business Metrics

- **Reduced Phone Calls**: Target 30% reduction in appointment booking calls
- **Medication Adherence**: Target 15% improvement in adherence scores
- **Patient Engagement**: Increase in appointment attendance
- **Revenue**: Track online payment adoption

---

## Timeline Summary

| Phase | Duration | Start Week | End Week |
|-------|----------|-----------|----------|
| **Phase 0: Landing Page & Blog** | 1.5 weeks | Week 1 | Week 1 |
| Phase 1: Enhanced Profile | 2 weeks | Week 2 | Week 3 |
| Phase 2: Medication Management | 2 weeks | Week 4 | Week 5 |
| Phase 3: Messaging | 1 week | Week 6 | Week 6 |
| Phase 4: Health Records | 1 week | Week 7 | Week 7 |
| Phase 5: Admin Interface | 2 weeks | Week 8 | Week 9 |
| Phase 6: Frontend | 4 weeks | Week 10 | Week 13 |
| Phase 7: Billing & Ratings | 1 week | Week 14 | Week 14 |
| Phase 8: Educational Resources | 1 week | Week 15 | Week 15 |
| Phase 9: Testing & QA | 2 weeks | Week 16 | Week 17 |
| Phase 10: Deployment | 1 week | Week 18 | Week 18 |

**Total Project Duration**: 18 weeks (~4.5 months)

---

## Next Steps

1. **Review this document** and provide feedback on priorities
2. **Approve/adjust scope** for each phase
3. **Confirm resource availability** (developers, designers, testers)
4. **Set up project tracking** (Jira, Trello, or GitHub Projects)
5. **Begin Phase 1 implementation** upon approval

---

## Appendix

### Tech Stack

**Backend**:
- Node.js + Express.js
- TypeScript
- MongoDB + Mongoose
- Redis (caching, sessions)
- Socket.io (real-time)
- JWT (authentication)
- PDFKit (PDF generation)
- Paystack/Flutterwave (payments)

**Frontend**:
- React + TypeScript
- Tailwind CSS
- React Router
- Axios
- React Query/SWR
- Chart.js/Recharts
- Socket.io-client

**Testing**:
- Jest (unit tests)
- Supertest (API tests)
- React Testing Library
- Playwright/Cypress (E2E)

**DevOps**:
- Docker
- PM2
- Nginx
- GitHub Actions (CI/CD)

---

**Document Version**: 1.0  
**Last Updated**: November 4, 2025  
**Status**: Awaiting Review
