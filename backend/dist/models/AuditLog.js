"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const auditLogSchema = new mongoose_1.Schema({
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
            'DOWNLOAD_NOTE_ATTACHMENT',
            'ROLE_CREATED',
            'ROLE_UPDATED',
            'ROLE_DELETED',
            'ROLE_ASSIGNED',
            'ROLE_REVOKED',
            'ROLE_HIERARCHY_MODIFIED',
            'PERMISSION_GRANTED',
            'PERMISSION_REVOKED',
            'PERMISSION_CHECKED',
            'PERMISSION_DENIED',
            'BULK_ROLE_ASSIGNMENT',
            'BULK_PERMISSION_UPDATE',
            'PRIVILEGE_ESCALATION_ATTEMPT',
            'UNAUTHORIZED_ACCESS_ATTEMPT',
            'ROLE_INHERITANCE_MODIFIED',
            'PERMISSION_CACHE_INVALIDATED',
            'SECURITY_POLICY_VIOLATION',
            'ADMIN_ROLE_ASSIGNMENT',
            'SUPER_ADMIN_ACCESS',
            'RBAC_MIGRATION_EXECUTED',
            'RBAC_ROLLBACK_EXECUTED'
        ]
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    interventionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ClinicalIntervention',
        required: false
    },
    details: {
        type: mongoose_1.Schema.Types.Mixed,
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
            'data_access',
            'rbac_management',
            'security_monitoring',
            'privilege_management',
            'access_control'
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
        type: mongoose_1.Schema.Types.Mixed,
        required: false
    },
    newValues: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false
    },
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    },
    roleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Role',
        required: false
    },
    roleName: {
        type: String,
        required: false
    },
    targetUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    permissionAction: {
        type: String,
        required: false
    },
    permissionSource: {
        type: String,
        enum: ['direct', 'role', 'inherited', 'legacy'],
        required: false
    },
    hierarchyLevel: {
        type: Number,
        required: false
    },
    bulkOperationId: {
        type: String,
        required: false
    },
    securityContext: {
        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            required: false
        },
        anomalyDetected: {
            type: Boolean,
            default: false
        },
        escalationReason: {
            type: String,
            required: false
        },
        previousPermissions: [{
                type: String
            }],
        newPermissions: [{
                type: String
            }]
    }
}, {
    timestamps: true,
    collection: 'audit_logs'
});
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ interventionId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, timestamp: -1 });
auditLogSchema.index({ complianceCategory: 1, timestamp: -1 });
auditLogSchema.index({ workspaceId: 1, timestamp: -1 });
auditLogSchema.index({ interventionId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ riskLevel: 1, complianceCategory: 1, timestamp: -1 });
auditLogSchema.index({ roleId: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1, timestamp: -1 });
auditLogSchema.index({ permissionAction: 1, timestamp: -1 });
auditLogSchema.index({ bulkOperationId: 1, timestamp: -1 });
auditLogSchema.index({ 'securityContext.anomalyDetected': 1, timestamp: -1 });
auditLogSchema.index({ 'securityContext.riskScore': 1, timestamp: -1 });
auditLogSchema.index({ roleId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ permissionAction: 1, permissionSource: 1, timestamp: -1 });
auditLogSchema.index({ complianceCategory: 1, action: 1, timestamp: -1 });
exports.AuditLog = mongoose_1.default.model('AuditLog', auditLogSchema);
//# sourceMappingURL=AuditLog.js.map