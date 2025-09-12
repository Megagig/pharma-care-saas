# AI Diagnostic Module Implementation

## Overview

The AI Diagnostic Module integrates advanced AI capabilities into the PharmaCare SaaS platform, enabling pharmacists to receive AI-assisted diagnostic analysis for patient symptoms and clinical presentations. This module uses OpenRouter API with DeepSeek V3.1 (reasoning mode) to provide structured medical diagnostic analysis.

## Features

### 🧠 AI-Powered Diagnostic Analysis
- **Differential Diagnoses**: Generate probability-weighted diagnostic possibilities
- **Recommended Tests**: Suggest laboratory investigations based on symptoms
- **Therapeutic Options**: Evidence-based medication recommendations
- **Red Flag Detection**: Identify critical conditions requiring immediate attention
- **Specialist Referrals**: Automatic recommendations for specialist consultation

### 🔒 Security & Compliance
- **Patient Consent Management**: Mandatory consent verification before analysis
- **Audit Logging**: Complete audit trail for all AI interactions
- **Data Encryption**: Secure handling of sensitive medical data
- **RBAC Integration**: Role-based access control with feature flags
- **Rate Limiting**: Protect against API abuse with intelligent rate limiting

### 📊 Case Management
- **Diagnostic Cases**: Persistent storage of AI analysis results
- **Pharmacist Decisions**: Track pharmacist acceptance/modification of AI recommendations
- **Patient History**: Complete diagnostic case history per patient
- **Follow-up Tracking**: Schedule and manage follow-up appointments

## Technical Architecture

### Backend Components

```
backend/src/
├── models/
│   └── DiagnosticCase.ts          # MongoDB model for diagnostic cases
├── services/
│   └── openRouterService.ts       # OpenRouter API integration
├── controllers/
│   └── diagnosticController.ts    # Request handling and business logic
├── validators/
│   └── diagnosticValidators.ts    # Input validation middleware
├── routes/
│   └── diagnosticRoutes.ts        # Express route definitions
└── middlewares/
    ├── auth.ts                    # Authentication & authorization
    └── auditMiddleware.ts         # Audit logging
```

### API Endpoints

#### POST `/api/diagnostics/ai`
Generate AI diagnostic analysis
- **Authentication**: Required (with license)
- **Features**: Requires `clinical_decision_support`
- **Rate Limit**: 10 requests/15min (production)

**Request Body:**
```json
{
  "patientId": "mongodb-object-id",
  "symptoms": {
    "subjective": ["headache", "nausea", "fatigue"],
    "objective": ["elevated blood pressure"],
    "duration": "3 days",
    "severity": "moderate",
    "onset": "acute"
  },
  "vitalSigns": {
    "bloodPressure": "160/95",
    "heartRate": 88,
    "temperature": 37.2,
    "respiratoryRate": 18,
    "oxygenSaturation": 98
  },
  "labResults": [
    {
      "testName": "Blood Glucose",
      "value": "180 mg/dL",
      "referenceRange": "70-100 mg/dL",
      "abnormal": true
    }
  ],
  "currentMedications": [
    {
      "name": "Metformin",
      "dosage": "500mg",
      "frequency": "twice daily"
    }
  ],
  "patientConsent": {
    "provided": true,
    "method": "electronic"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "caseId": "DX-L9X2M1-ABC123",
    "analysis": {
      "differentialDiagnoses": [
        {
          "condition": "Hypertensive Crisis",
          "probability": 75,
          "reasoning": "Elevated BP with neurological symptoms",
          "severity": "high"
        }
      ],
      "recommendedTests": [
        {
          "testName": "Complete Blood Count",
          "priority": "urgent",
          "reasoning": "Rule out underlying conditions"
        }
      ],
      "therapeuticOptions": [
        {
          "medication": "Amlodipine",
          "dosage": "5mg",
          "frequency": "once daily",
          "duration": "ongoing",
          "reasoning": "First-line antihypertensive",
          "safetyNotes": ["Monitor for ankle edema"]
        }
      ],
      "redFlags": [
        {
          "flag": "Severe hypertension with symptoms",
          "severity": "critical",
          "action": "Immediate medical evaluation required"
        }
      ],
      "referralRecommendation": {
        "recommended": true,
        "urgency": "immediate",
        "specialty": "Emergency Medicine",
        "reason": "Hypertensive emergency requires immediate care"
      },
      "disclaimer": "This AI-generated analysis is for pharmacist consultation only...",
      "confidenceScore": 85
    },
    "processingTime": 2341,
    "tokensUsed": 1247
  }
}
```

#### POST `/api/diagnostics/cases/:caseId/decision`
Save pharmacist decision on diagnostic case

**Request Body:**
```json
{
  "accepted": true,
  "modifications": "Adjusted dosage based on patient age",
  "finalRecommendation": "Start amlodipine 2.5mg daily, recheck BP in 1 week",
  "counselingPoints": [
    "Take medication at same time daily",
    "Monitor blood pressure at home",
    "Return if symptoms worsen"
  ],
  "followUpRequired": true,
  "followUpDate": "2024-02-01T10:00:00Z"
}
```

#### GET `/api/diagnostics/patients/:patientId/history`
Retrieve diagnostic case history for a patient

#### GET `/api/diagnostics/cases/:caseId`
Get detailed information about a specific diagnostic case

#### POST `/api/diagnostics/interactions`
Check drug interactions between medications

#### GET `/api/diagnostics/ai/test` (Super Admin only)
Test OpenRouter API connection and status

## Environment Configuration

Add these environment variables to your `.env` file:

```bash
# AI Diagnostic Configuration (OpenRouter)
# Sign up at https://openrouter.ai/ to get your API key
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Feature Flags
ENABLE_AI_DIAGNOSTICS=true
ENABLE_CLINICAL_DECISION_SUPPORT=true
```

## Setup Instructions

### 1. Install Dependencies

The module uses existing dependencies in the project. No additional packages required.

### 2. Environment Setup

1. Sign up for an OpenRouter account at https://openrouter.ai/
2. Generate an API key from your dashboard
3. Add the `OPENROUTER_API_KEY` to your environment variables

### 3. Database Migration

The `DiagnosticCase` model will be automatically created when you first use the endpoints. The model includes:

- Automatic case ID generation
- Proper indexing for performance
- Patient consent tracking
- Complete audit trail

### 4. Feature Flag Configuration

Ensure these feature flags are enabled in your subscription plans:

```json
{
  "clinical_decision_support": true,
  "drug_information": true
}
```

### 5. RBAC Setup

The module integrates with existing RBAC. Ensure users have:
- Valid license
- Access to `clinical_decision_support` feature
- Appropriate role permissions

## Usage Examples

### Frontend Integration

```typescript
// Example API call from React component
const generateDiagnosticAnalysis = async (diagnosticData) => {
  try {
    const response = await fetch('/api/diagnostics/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(diagnosticData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Analysis completed:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Diagnostic analysis failed:', error);
    throw error;
  }
};
```

### Testing the API

```bash
# Test AI connection (Super Admin only)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/diagnostics/ai/test

# Generate diagnostic analysis
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "507f1f77bcf86cd799439011",
    "symptoms": {
      "subjective": ["chest pain"],
      "objective": [],
      "duration": "2 hours",
      "severity": "severe",
      "onset": "acute"
    },
    "patientConsent": {
      "provided": true,
      "method": "electronic"
    }
  }' \
  http://localhost:5000/api/diagnostics/ai
```

## Security Considerations

### Data Privacy
- All patient data is encrypted in transit and at rest
- AI requests include minimal necessary information
- No patient data is permanently stored by OpenRouter
- Complete audit logs for compliance

### Access Control
- Multi-layer authentication and authorization
- Feature-based access control
- Rate limiting to prevent abuse
- IP-based monitoring and blocking

### Medical Disclaimers
- All AI responses include appropriate medical disclaimers
- Clear indication that AI analysis is for consultation only
- Emphasis on professional medical judgment
- Audit trail of pharmacist decisions

## Performance Optimization

### Rate Limiting
- AI endpoints: 10 requests/15min (production)
- General endpoints: 100 requests/15min
- Development mode has higher limits

### Caching Strategy
- Drug information cached for 24 hours
- Patient data cached per session
- AI responses not cached for privacy

### Database Optimization
- Proper indexing on diagnostic cases
- Efficient queries with pagination
- Selective field loading

## Monitoring & Analytics

### Metrics Tracked
- AI request volume and response times
- Diagnostic accuracy and confidence scores
- Pharmacist acceptance/rejection rates
- Token usage and API costs

### Audit Logging
- All AI interactions logged with full context
- Patient consent tracking
- Pharmacist decision tracking
- Security event monitoring

### Error Handling
- Comprehensive error logging
- Graceful degradation on AI service failure
- User-friendly error messages
- Automatic retry mechanisms

## Future Enhancements

### Planned Features
1. **Multi-language Support**: AI analysis in multiple languages
2. **Image Analysis**: Integration with medical imaging AI
3. **Predictive Analytics**: Risk assessment and early warning systems
4. **Clinical Guidelines**: Integration with evidence-based guidelines
5. **Telemedicine Integration**: Direct integration with video consultation

### Performance Improvements
1. **Response Caching**: Cache common diagnostic patterns
2. **Batch Processing**: Handle multiple cases simultaneously
3. **Edge Computing**: Deploy AI models closer to users
4. **Real-time Updates**: WebSocket integration for live updates

## Troubleshooting

### Common Issues

1. **OpenRouter API Key Invalid**
   - Verify API key in environment variables
   - Check OpenRouter dashboard for key status
   - Ensure sufficient credits in account

2. **Rate Limiting Errors**
   - Check rate limit headers in response
   - Implement exponential backoff
   - Consider upgrading rate limits

3. **Patient Consent Issues**
   - Ensure `patientConsent.provided` is `true`
   - Verify consent method is valid
   - Check audit logs for consent tracking

4. **Feature Access Denied**
   - Verify user has valid license
   - Check feature flag configuration
   - Confirm subscription plan includes clinical decision support

### Debug Mode

Enable verbose logging in development:

```bash
DEBUG_MODE=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

### Support

For technical support or questions:
- Check the application logs for detailed error information
- Review the audit logs for security-related issues
- Monitor system performance metrics
- Contact the development team with specific error messages and context

## License & Compliance

- Module integrates with existing PharmaCare SaaS licensing
- Compliant with healthcare data privacy regulations
- Audit trails support regulatory compliance
- Medical disclaimers meet professional standards

---

**Note**: This module is designed to assist healthcare professionals and should not be used as a substitute for professional medical judgment. All AI-generated recommendations should be reviewed and validated by qualified healthcare providers.