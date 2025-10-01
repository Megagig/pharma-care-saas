import mongoose, { Document, Schema } from 'mongoose';

export interface IDiagnosticCase extends Document {
  caseId: string;
  patientId: mongoose.Types.ObjectId;
  pharmacistId: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId;
  
  // Input data
  symptoms: {
    subjective: string[];
    objective: string[];
    duration: string;
    severity: 'mild' | 'moderate' | 'severe';
    onset: 'acute' | 'chronic' | 'subacute';
  };
  
  labResults?: {
    testName: string;
    value: string;
    referenceRange: string;
    abnormal: boolean;
  }[];
  
  currentMedications?: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: Date;
  }[];
  
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  
  // AI Analysis Results
  aiAnalysis: {
    differentialDiagnoses: {
      condition: string;
      probability: number;
      reasoning: string;
      severity: 'low' | 'medium' | 'high';
    }[];
    
    recommendedTests: {
      testName: string;
      priority: 'urgent' | 'routine' | 'optional';
      reasoning: string;
    }[];
    
    therapeuticOptions: {
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      reasoning: string;
      safetyNotes: string[];
    }[];
    
    redFlags: {
      flag: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      action: string;
    }[];
    
    referralRecommendation?: {
      recommended: boolean;
      urgency: 'immediate' | 'within_24h' | 'routine';
      specialty: string;
      reason: string;
    };
    
    disclaimer: string;
    confidenceScore: number;
    processingTime: number;
  };
  
  // Drug Interactions
  drugInteractions?: {
    drug1: string;
    drug2: string;
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    description: string;
    clinicalEffect: string;
    management: string;
  }[];
  
  // Pharmacist Actions
  pharmacistDecision: {
    accepted: boolean;
    modifications: string;
    finalRecommendation: string;
    counselingPoints: string[];
    followUpRequired: boolean;
    followUpDate?: Date;
    notes?: string;
    reviewedAt?: Date;
    reviewedBy?: mongoose.Types.ObjectId;
  };

  // Follow-up Management
  followUp?: {
    scheduledDate: Date;
    reason: string;
    completed: boolean;
    completedDate?: Date;
    outcome?: string;
    nextSteps?: string;
  };

  // Referral Management
  referral?: {
    generated: boolean;
    generatedAt?: Date;
    document?: {
      content: string;
      template: string;
      lastModified: Date;
      modifiedBy: mongoose.Types.ObjectId;
    };
    status: 'pending' | 'sent' | 'acknowledged' | 'completed';
    sentAt?: Date;
    sentTo?: {
      physicianName: string;
      physicianEmail?: string;
      specialty: string;
      institution?: string;
    };
    acknowledgedAt?: Date;
    completedAt?: Date;
    feedback?: string;
    trackingId?: string;
  };
  
  // Patient Consent
  patientConsent: {
    provided: boolean;
    consentDate: Date;
    consentMethod: 'verbal' | 'written' | 'electronic';
  };
  
  // Audit Trail
  aiRequestData: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestId: string;
    processingTime: number;
  };
  
  status: 'draft' | 'pending_review' | 'follow_up' | 'completed' | 'referred' | 'cancelled';
  completedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const diagnosticCaseSchema = new Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    pharmacistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workplaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workplace',
      required: true,
      index: true,
    },
    symptoms: {
      subjective: [String],
      objective: [String],
      duration: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        required: true,
      },
      onset: {
        type: String,
        enum: ['acute', 'chronic', 'subacute'],
        required: true,
      },
    },
    labResults: [
      {
        testName: String,
        value: String,
        referenceRange: String,
        abnormal: Boolean,
      },
    ],
    currentMedications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
      },
    ],
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number,
    },
    aiAnalysis: {
      differentialDiagnoses: [
        {
          condition: String,
          probability: Number,
          reasoning: String,
          severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
          },
        },
      ],
      recommendedTests: [
        {
          testName: String,
          priority: {
            type: String,
            enum: ['urgent', 'routine', 'optional'],
          },
          reasoning: String,
        },
      ],
      therapeuticOptions: [
        {
          medication: String,
          dosage: String,
          frequency: String,
          duration: String,
          reasoning: String,
          safetyNotes: [String],
        },
      ],
      redFlags: [
        {
          flag: String,
          severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
          },
          action: String,
        },
      ],
      referralRecommendation: {
        recommended: Boolean,
        urgency: {
          type: String,
          enum: ['immediate', 'within_24h', 'routine'],
          required: function(this: any) {
            return this.recommended === true;
          },
        },
        specialty: {
          type: String,
          required: function(this: any) {
            return this.recommended === true;
          },
        },
        reason: {
          type: String,
          required: function(this: any) {
            return this.recommended === true;
          },
        },
      },
      disclaimer: String,
      confidenceScore: Number,
      processingTime: Number,
    },
    drugInteractions: [
      {
        drug1: String,
        drug2: String,
        severity: {
          type: String,
          enum: ['minor', 'moderate', 'major', 'contraindicated'],
        },
        description: String,
        clinicalEffect: String,
        management: String,
      },
    ],
    pharmacistDecision: {
      accepted: {
        type: Boolean,
        default: false,
      },
      modifications: String,
      finalRecommendation: String,
      counselingPoints: [String],
      followUpRequired: {
        type: Boolean,
        default: false,
      },
      followUpDate: Date,
      notes: String,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    patientConsent: {
      provided: {
        type: Boolean,
        required: true,
      },
      consentDate: {
        type: Date,
        required: true,
      },
      consentMethod: {
        type: String,
        enum: ['verbal', 'written', 'electronic'],
        required: true,
      },
    },
    aiRequestData: {
      model: String,
      promptTokens: Number,
      completionTokens: Number,
      totalTokens: Number,
      requestId: String,
      processingTime: Number,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'follow_up', 'completed', 'referred', 'cancelled'],
      default: 'draft',
      index: true,
    },
    completedAt: Date,
    followUp: {
      scheduledDate: {
        type: Date,
        required: function(this: any) {
          return this.parent().status === 'follow_up';
        },
      },
      reason: {
        type: String,
        required: function(this: any) {
          return this.parent().status === 'follow_up';
        },
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedDate: Date,
      outcome: String,
      nextSteps: String,
    },
    referral: {
      generated: {
        type: Boolean,
        default: false,
      },
      generatedAt: Date,
      document: {
        content: String,
        template: String,
        lastModified: Date,
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'acknowledged', 'completed'],
        default: 'pending',
      },
      sentAt: Date,
      sentTo: {
        physicianName: String,
        physicianEmail: String,
        specialty: String,
        institution: String,
      },
      acknowledgedAt: Date,
      completedAt: Date,
      feedback: String,
      trackingId: String,
    },
  },
  { 
    timestamps: true,
    collection: 'diagnostic_cases'
  }
);

// Generate unique case ID
diagnosticCaseSchema.pre<IDiagnosticCase>('save', function (next) {
  if (this.isNew && !this.caseId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    this.caseId = `DX-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Indexes for performance
diagnosticCaseSchema.index({ patientId: 1, createdAt: -1 });
diagnosticCaseSchema.index({ pharmacistId: 1, createdAt: -1 });
diagnosticCaseSchema.index({ workplaceId: 1, createdAt: -1 });
diagnosticCaseSchema.index({ status: 1, createdAt: -1 });
diagnosticCaseSchema.index({ 'aiAnalysis.redFlags.severity': 1 });
diagnosticCaseSchema.index({ completedAt: -1 });

export default mongoose.model<IDiagnosticCase>('DiagnosticCase', diagnosticCaseSchema);