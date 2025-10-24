# Diagnosis Tab Architecture

## Component Hierarchy

```
PatientManagement.tsx
├── Tab Navigation (11 tabs)
│   ├── Dashboard (index 0)
│   ├── Clinical Notes (index 1)
│   ├── Allergies (index 2)
│   ├── Conditions (index 3)
│   ├── Medications (index 4)
│   ├── Assessments (index 5)
│   ├── DTPs (index 6)
│   ├── Care Plans (index 7)
│   ├── Visits (index 8)
│   ├── MTR Sessions (index 9)
│   └── Diagnosis (index 10) ← NEW
│
└── TabPanel (index 10)
    └── PatientDiagnosisList.tsx ← NEW COMPONENT
        ├── Summary Cards (3)
        │   ├── Total Cases
        │   ├── Pending Review
        │   └── Completed
        │
        └── Cases Table
            ├── Case ID
            ├── Date Created
            ├── Primary Diagnosis
            ├── Confidence Score
            ├── Status
            └── Actions (View button)
```

## Data Flow

```
User Action: Click "Diagnosis" Tab
    ↓
PatientManagement renders TabPanel(index=10)
    ↓
PatientDiagnosisList component mounts
    ↓
React Query executes query
    ↓
aiDiagnosticService.getPatientCases(patientId)
    ↓
API Call: GET /api/diagnostics/patients/:patientId/history
    ↓
Backend: diagnosticController.getDiagnosticHistory()
    ↓
Database: DiagnosticCase.find({ patientId })
    ↓
Response: { success: true, data: { cases: [...] } }
    ↓
Transform data in aiDiagnosticService
    ↓
React Query caches result
    ↓
Component renders with data
    ↓
User sees: Summary Cards + Table
```

## Navigation Flow

```
User clicks on a diagnostic case
    ↓
handleViewCase(caseId) is called
    ↓
navigate(`/pharmacy/diagnostics/cases/all?caseId=${caseId}`)
    ↓
All Cases Page loads
    ↓
Page filters/highlights the specific case
    ↓
User can view full details and perform actions:
    ├── Mark for Follow Up (status → follow_up)
    ├── Mark as Completed (status → completed)
    ├── Mark as Pending Review (status → pending_review)
    └── Generate Referral (opens dialog, status → referred)
```

## State Management

```
PatientDiagnosisList Component State:
├── diagnosticCases (from React Query)
│   ├── Loading: isLoading = true
│   ├── Error: isError = true, error = Error object
│   └── Success: data = DiagnosticCase[]
│
├── Derived State (computed from diagnosticCases)
│   ├── totalCases = diagnosticCases.length
│   ├── pendingReviewCases = filter(status === 'draft')
│   └── completedCases = filter(status === 'completed')
│
└── Navigation State (from useNavigate hook)
    └── navigate() function for routing
```

## API Integration

### Endpoint Details
```
GET /api/diagnostics/patients/:patientId/history

Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Query Parameters:
  None (patientId is in URL path)

Response Format:
{
  success: true,
  data: {
    cases: [
      {
        _id: "507f1f77bcf86cd799439011",
        caseId: "DX-ABC123",
        patientId: "507f1f77bcf86cd799439012",
        symptoms: { ... },
        aiAnalysis: {
          differentialDiagnoses: [
            {
              condition: "Hypertension",
              probability: 85,
              reasoning: "..."
            }
          ],
          confidenceScore: 0.85,
          ...
        },
        status: "completed",
        createdAt: "2025-10-24T10:30:00Z",
        updatedAt: "2025-10-24T11:00:00Z"
      }
    ]
  }
}
```

### Service Layer
```typescript
// aiDiagnosticService.ts
class AIdiagnosticService {
  async getPatientCases(patientId: string): Promise<DiagnosticCase[]> {
    const response = await apiClient.get(
      `/diagnostics/patients/${patientId}/history`
    );
    
    // Transform backend format to frontend format
    return response.data.data.cases.map(transformCase);
  }
}
```

## UI Component Structure

### Summary Cards Layout
```
┌─────────────────────────────────────────────────────────┐
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐│
│  │      15       │  │       3       │  │      12      ││
│  │  Total Cases  │  │Pending Review │  │  Completed   ││
│  │   (Blue)      │  │   (Orange)    │  │   (Green)    ││
│  └───────────────┘  └───────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Table Layout
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Case ID  │ Date Created    │ Primary Diagnosis │ Confidence │ Status │ ⚙ │
├──────────┼─────────────────┼───────────────────┼────────────┼────────┼───┤
│ ABC12345 │ Oct 24, 2025    │ Hypertension      │   85%      │ ✓ Done │ 👁 │
│          │ 10:30 AM        │                   │  (Green)   │(Green) │   │
├──────────┼─────────────────┼───────────────────┼────────────┼────────┼───┤
│ DEF67890 │ Oct 23, 2025    │ Type 2 Diabetes   │   72%      │ ⏳ Rev │ 👁 │
│          │ 02:15 PM        │                   │ (Orange)   │(Gray)  │   │
├──────────┼─────────────────┼───────────────────┼────────────┼────────┼───┤
│ GHI11213 │ Oct 22, 2025    │ Analyzing...      │    N/A     │ 🔄 Ana │ 👁 │
│          │ 09:45 AM        │                   │            │(Blue)  │   │
└──────────┴─────────────────┴───────────────────┴────────────┴────────┴───┘
```

## Status Color Mapping

```
Status Value    →  Display Label      →  Chip Color
─────────────────────────────────────────────────────
'completed'     →  "Completed"        →  Green (success)
'draft'         →  "Pending Review"   →  Gray (default)
'submitted'     →  "Submitted"        →  Gray (default)
'analyzing'     →  "Analyzing"        →  Blue (info)
'failed'        →  "Failed"           →  Red (error)
```

## Confidence Score Color Mapping

```
Confidence Range  →  Chip Color
────────────────────────────────
≥ 80%            →  Green (success)
60% - 79%        →  Orange (warning)
< 60%            →  Gray (default)
N/A              →  Text "N/A"
```

## Error Handling

```
Error Scenarios:
├── Network Error
│   └── Display: "Failed to load diagnostic cases"
│
├── 401 Unauthorized
│   └── Redirect to login
│
├── 403 Forbidden
│   └── Display: "Access denied to diagnostic cases"
│
├── 404 Not Found
│   └── Display: "Patient not found"
│
└── 500 Server Error
    └── Display: "Server error. Please try again later."
```

## Performance Optimizations

```
React Query Configuration:
├── Query Key: ['patientDiagnosticCases', patientId]
│   └── Ensures separate cache per patient
│
├── Enabled: !!patientId
│   └── Only fetches when patientId exists
│
├── Stale Time: Default (0ms)
│   └── Refetches on window focus
│
└── Cache Time: Default (5 minutes)
    └── Keeps data in cache for quick access
```

## Accessibility Features

```
Accessibility Implementations:
├── Tab Navigation
│   ├── aria-controls="patient-tabpanel-10"
│   ├── id="patient-tab-10"
│   └── Keyboard navigable (Tab, Enter, Space)
│
├── Table
│   ├── Semantic HTML (<table>, <thead>, <tbody>)
│   ├── Column headers with proper scope
│   └── Row hover states for visibility
│
├── Buttons
│   ├── Tooltips for icon buttons
│   ├── aria-label attributes
│   └── Keyboard accessible
│
└── Status Chips
    ├── Color + Text (not color alone)
    └── Sufficient contrast ratios
```

## File Structure

```
frontend/src/
├── components/
│   ├── PatientManagement.tsx (MODIFIED)
│   │   └── Added Diagnosis tab integration
│   │
│   └── PatientDiagnosisList.tsx (NEW)
│       └── Main component for Diagnosis tab
│
├── services/
│   └── aiDiagnosticService.ts (EXISTING)
│       └── getPatientCases() method used
│
└── queries/
    └── (No changes needed - using React Query directly)
```

## Dependencies

```
Required Packages (Already Installed):
├── @mui/material (UI components)
├── @mui/icons-material (Icons)
├── @tanstack/react-query (Data fetching)
├── react-router-dom (Navigation)
└── axios (HTTP client via apiClient)
```

## Testing Strategy

```
Test Levels:
├── Unit Tests
│   ├── Component rendering
│   ├── Status color mapping
│   ├── Confidence score calculation
│   └── Date formatting
│
├── Integration Tests
│   ├── API integration
│   ├── Navigation flow
│   ├── React Query caching
│   └── Error handling
│
└── E2E Tests
    ├── Full user flow
    ├── Tab switching
    ├── Case viewing
    └── Cross-browser compatibility
```

## Security Considerations

```
Security Measures:
├── Authentication
│   └── JWT token required for API calls
│
├── Authorization
│   ├── Feature flag: 'ai_diagnostics'
│   └── License validation required
│
├── Data Access
│   ├── Only patient's own cases visible
│   └── Workplace-level isolation
│
└── Input Validation
    └── PatientId validated on backend
```

## Monitoring & Logging

```
Logging Points:
├── Component Mount
│   └── console.log('PatientDiagnosisList mounted')
│
├── API Calls
│   ├── Request initiated
│   ├── Response received
│   └── Errors caught
│
└── User Actions
    ├── Case clicked
    ├── Navigation triggered
    └── Errors displayed
```

## Future Enhancements Roadmap

```
Phase 1 (Current): ✅ Basic List View
├── Display all cases
├── Summary statistics
├── Navigation to details
└── Status display

Phase 2 (Future): Filtering & Sorting
├── Filter by status
├── Filter by date range
├── Sort by any column
└── Search by diagnosis

Phase 3 (Future): Advanced Features
├── Inline status changes
├── Bulk actions
├── Export functionality
└── Case comparison

Phase 4 (Future): Analytics
├── Trends over time
├── Diagnosis patterns
├── Confidence score analysis
└── Outcome tracking
```
