"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ClinicalNote_1 = __importDefault(require("../models/ClinicalNote"));
const auditLogging_1 = require("../middlewares/auditLogging");
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = __importDefault(require("mongoose"));
class ConfidentialNoteService {
    constructor() { }
    static getInstance() {
        if (!ConfidentialNoteService.instance) {
            ConfidentialNoteService.instance = new ConfidentialNoteService();
        }
        return ConfidentialNoteService.instance;
    }
    canAccessConfidentialNotes(user) {
        const allowedRoles = ['Owner', 'Pharmacist'];
        return allowedRoles.includes(user.workplaceRole || '');
    }
    canCreateConfidentialNotes(user) {
        const allowedRoles = ['Owner', 'Pharmacist'];
        return allowedRoles.includes(user.workplaceRole || '');
    }
    canModifyConfidentialNote(user, note) {
        if (user.role === 'super_admin') {
            return true;
        }
        if (user.workplaceRole === 'Owner') {
            return true;
        }
        if (user.workplaceRole === 'Pharmacist') {
            return note.pharmacist.toString() === user._id.toString();
        }
        return false;
    }
    applyConfidentialFilters(query, user, includeConfidential) {
        const canAccess = this.canAccessConfidentialNotes(user);
        if (includeConfidential === true) {
            if (!canAccess) {
                throw new Error('Insufficient permissions to access confidential notes');
            }
            query.isConfidential = true;
        }
        else if (includeConfidential === false) {
            query.isConfidential = { $ne: true };
        }
        else {
            if (!canAccess) {
                query.isConfidential = { $ne: true };
            }
        }
        return query;
    }
    async logConfidentialAccess(req, noteId, action, details) {
        try {
            await auditLogging_1.auditOperations.confidentialDataAccess(req, 'ClinicalNote', noteId, action, {
                ...details,
                confidentialityReason: 'Clinical documentation contains sensitive patient information',
                accessLevel: 'confidential',
                dataClassification: 'restricted',
            });
        }
        catch (error) {
            logger_1.default.error('Failed to log confidential note access:', error);
        }
    }
    sanitizeForAudit(noteData) {
        if (!noteData.isConfidential) {
            return noteData;
        }
        return {
            ...noteData,
            content: {
                subjective: '[CONFIDENTIAL_CONTENT]',
                objective: '[CONFIDENTIAL_CONTENT]',
                assessment: '[CONFIDENTIAL_CONTENT]',
                plan: '[CONFIDENTIAL_CONTENT]',
            },
            recommendations: ['[CONFIDENTIAL_RECOMMENDATIONS]'],
            type: noteData.type,
            priority: noteData.priority,
            isConfidential: noteData.isConfidential,
            createdAt: noteData.createdAt,
            updatedAt: noteData.updatedAt,
        };
    }
    async getConfidentialNotesStats(workplaceId, user) {
        if (!this.canAccessConfidentialNotes(user)) {
            throw new Error('Insufficient permissions to view confidential notes statistics');
        }
        const stats = await ClinicalNote_1.default.aggregate([
            {
                $match: {
                    workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                    isConfidential: true,
                    deletedAt: { $exists: false },
                },
            },
            {
                $group: {
                    _id: null,
                    totalConfidentialNotes: { $sum: 1 },
                    notesByType: { $push: '$type' },
                    notesByPriority: { $push: '$priority' },
                    uniquePatients: { $addToSet: '$patient' },
                    uniquePharmacists: { $addToSet: '$pharmacist' },
                    recentNotes: {
                        $sum: {
                            $cond: [
                                {
                                    $gte: [
                                        '$createdAt',
                                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        const result = stats[0] || {
            totalConfidentialNotes: 0,
            notesByType: [],
            notesByPriority: [],
            uniquePatients: [],
            uniquePharmacists: [],
            recentNotes: 0,
        };
        const typeCount = result.notesByType.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        const priorityCount = result.notesByPriority.reduce((acc, priority) => {
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
        }, {});
        return {
            totalConfidentialNotes: result.totalConfidentialNotes,
            typeDistribution: typeCount,
            priorityDistribution: priorityCount,
            uniquePatientCount: result.uniquePatients.length,
            uniquePharmacistCount: result.uniquePharmacists.length,
            recentNotesCount: result.recentNotes,
        };
    }
    validateConfidentialNoteData(noteData, user) {
        const errors = [];
        if (!this.canCreateConfidentialNotes(user)) {
            errors.push('Insufficient permissions to create confidential notes');
        }
        if (!noteData.title || noteData.title.trim().length === 0) {
            errors.push('Title is required for confidential notes');
        }
        if (!noteData.content || Object.keys(noteData.content).length === 0) {
            errors.push('Content is required for confidential notes');
        }
        if (!noteData.confidentialityReason) {
            errors.push('Confidentiality reason is required for confidential notes');
        }
        if (noteData.priority && !['medium', 'high'].includes(noteData.priority)) {
            errors.push('Confidential notes must have medium or high priority');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    applyConfidentialSecurity(noteData) {
        if (!noteData.isConfidential) {
            return noteData;
        }
        return {
            ...noteData,
            priority: noteData.priority || 'medium',
            followUpRequired: noteData.followUpRequired !== false,
            confidentialityLevel: 'high',
            accessRestrictions: {
                requiresJustification: true,
                auditAllAccess: true,
                restrictedRoles: ['Owner', 'Pharmacist'],
            },
        };
    }
    requiresAccessJustification(note, user, action) {
        if (!note.isConfidential) {
            return false;
        }
        if (action === 'VIEW' &&
            note.pharmacist.toString() === user._id.toString()) {
            return false;
        }
        return true;
    }
    getAccessJustificationPrompt(note, action) {
        const actionText = action.toLowerCase();
        return (`Please provide justification for ${actionText} this confidential clinical note. ` +
            `This access will be logged for compliance and audit purposes.`);
    }
}
exports.default = ConfidentialNoteService;
//# sourceMappingURL=confidentialNoteService.js.map