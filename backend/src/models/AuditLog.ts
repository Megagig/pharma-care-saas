import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
    action: string;
    timestamp: Date;
    userId: mongoose.Types.ObjectId;
    interventionId?: mongoose.Types.ObjectId;
    details: Record<string, any>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    complianceCategory: string;
    changedFields?: string[];
    ipAddress?: string;
    userAgent?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    workspaceId?: mongoose.Types.ObjectId;
    sessionId?: string;
    metadata?: {
        source: string;
        version: string;
        environment: string;
    };
}

const auditLogSchema = new Schema<IAuditLog>({
    action: {
        type: String,
        required: true,
        enum: [
            'INTERVENTION_CREATED',
            'INTERVENTION_UPDATED',
            'INTERVENTION_DELETED',
            'INTERVENTION_REVIEWED',
            'INTERVENTION_APPROVED',
            'INTERVENTION_REJECTED',
            'INTERVENTION_COMPLETED',
            'INTERVENTION_CANCELLED',
            'INTERVENTION_ASSIGNED',
            'INTERVENTION_ESCALATED',
            'PATIENT_DATA_ACCESSED',
            'MEDICATION_CHANGED',
            'DOSAGE_MODIFIED',
            'ALLERGY_UPDATED',
            'CONTRAINDICATION_FLAGGED',
            'RISK_ASSESSMENT_UPDATED',
            'COMPLIANCE_CHECK',
            'EXPORT_PERFORMED',
            'REPORT_GENERATED',
            'USER_LOGIN',
            'USER_LOGOUT',
            'PERMISSION_CHANGED',
            'SYSTEM_BACKUP',
            'DATA_MIGRATION',
            // Clinical Notes Actions
            'CLINICAL_NOTE_ROUTE_ACCESS',
            'LIST_CLINICAL_NOTES',
            'CREATE_CLINICAL_NOTE',
            'VIEW_CLINICAL_NOTE',
            'UPDATE_CLINICAL_NOTE',
            'DELETE_CLINICAL_NOTE',
            'SEARCH_CLINICAL_NOTES',
            'FILTER_CLINICAL_NOTES',
            'VIEW_NOTE_STATISTICS',
            'BULK_UPDATE_NOTES',
            'BULK_DELETE_NOTES',
            'VIEW_PATIENT_NOTES',
            'UPLOAD_NOTE_ATTACHMENT',
            'DELETE_NOTE_ATTACHMENT',
            'DOWNLOAD_NOTE_ATTACHMENT'
        ]
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    interventionId: {
        type: Schema.Types.ObjectId,
        ref: 'ClinicalIntervention',
        required: false
    },
    details: {
        type: Schema.Types.Mixed,
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        default: 'low'
    },
    complianceCategory: {
        type: String,
        required: true,
        enum: [
            'clinical_documentation',
            'medication_safety',
            'patient_privacy',
            'data_integrity',
            'quality_assurance',
            'regulatory_compliance',
            'patient_care',
            'system_security',
            'workflow_management',
            'risk_management',
            'data_access'
        ]
    },
    changedFields: [{
        type: String
    }],
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    },
    oldValues: {
        type: Schema.Types.Mixed,
        required: false
    },
    newValues: {
        type: Schema.Types.Mixed,
        required: false
    },
    workspaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workspace',
        required: false
    },
    sessionId: {
        type: String,
        required: false
    },
    metadata: {
        source: {
            type: String,
            default: 'clinical-intervention-system'
        },
        version: {
            type: String,
            default: '1.0.0'
        },
        environment: {
            type: String,
            default: process.env.NODE_ENV || 'development'
        }
    }
}, {
    timestamps: true,
    collection: 'audit_logs'
});

// Indexes for performance
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ interventionId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, timestamp: -1 });
auditLogSchema.index({ complianceCategory: 1, timestamp: -1 });
auditLogSchema.index({ workspaceId: 1, timestamp: -1 });

// Compound indexes for common queries
auditLogSchema.index({ interventionId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, complianceCategory: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);