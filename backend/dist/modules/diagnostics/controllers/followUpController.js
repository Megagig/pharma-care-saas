"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFollowUpStatus = exports.getMyFollowUps = exports.getFollowUpAnalytics = exports.getOverdueFollowUps = exports.rescheduleFollowUp = exports.completeFollowUp = exports.getFollowUpById = exports.getPatientFollowUps = exports.createFollowUp = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const diagnosticFollowUpService_1 = __importDefault(require("../services/diagnosticFollowUpService"));
const DiagnosticFollowUp_1 = __importDefault(require("../models/DiagnosticFollowUp"));
const createFollowUp = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const followUpData = req.body;
        if (!followUpData.diagnosticRequestId || !followUpData.diagnosticResultId ||
            !followUpData.patientId || !followUpData.type || !followUpData.description ||
            !followUpData.scheduledDate || !followUpData.assignedTo) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields',
                    details: 'diagnosticRequestId, diagnosticResultId, patientId, type, description, scheduledDate, and assignedTo are required'
                }
            });
            return;
        }
        const objectIdFields = ['diagnosticRequestId', 'diagnosticResultId', 'patientId', 'assignedTo'];
        for (const field of objectIdFields) {
            if (!mongoose_1.default.Types.ObjectId.isValid(followUpData[field])) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: `Invalid ${field}`,
                        details: `${field} must be a valid ObjectId`
                    }
                });
                return;
            }
        }
        const scheduledDate = new Date(followUpData.scheduledDate);
        const minDate = new Date(Date.now() - 60 * 60 * 1000);
        if (scheduledDate < minDate) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid scheduled date',
                    details: 'Scheduled date cannot be more than 1 hour in the past'
                }
            });
            return;
        }
        const followUp = await diagnosticFollowUpService_1.default.createFollowUp(new mongoose_1.default.Types.ObjectId(workplaceId), followUpData, new mongoose_1.default.Types.ObjectId(userId));
        res.status(201).json({
            success: true,
            data: {
                followUp
            },
            message: 'Follow-up created successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error creating follow-up:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create follow-up',
                details: error.message
            }
        });
    }
};
exports.createFollowUp = createFollowUp;
const getPatientFollowUps = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { patientId } = req.params;
        const { status, type, limit, skip } = req.query;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid patient ID'
                }
            });
            return;
        }
        const options = {
            status: status,
            type: type,
            limit: limit ? parseInt(limit) : undefined,
            skip: skip ? parseInt(skip) : undefined
        };
        const followUps = await diagnosticFollowUpService_1.default.getPatientFollowUps(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId), options);
        res.json({
            success: true,
            data: {
                followUps,
                count: followUps.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting patient follow-ups:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get patient follow-ups',
                details: error.message
            }
        });
    }
};
exports.getPatientFollowUps = getPatientFollowUps;
const getFollowUpById = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { followUpId } = req.params;
        if (!followUpId || !mongoose_1.default.Types.ObjectId.isValid(followUpId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid follow-up ID'
                }
            });
            return;
        }
        const followUp = await DiagnosticFollowUp_1.default.findById(followUpId)
            .setOptions({ workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId) })
            .populate('assignedTo', 'firstName lastName email')
            .populate('patientId', 'firstName lastName mrn')
            .populate('diagnosticRequestId', 'inputSnapshot status priority')
            .populate('diagnosticResultId', 'diagnoses riskAssessment medicationSuggestions')
            .exec();
        if (!followUp) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Follow-up not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: {
                followUp
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting follow-up by ID:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get follow-up',
                details: error.message
            }
        });
    }
};
exports.getFollowUpById = getFollowUpById;
const completeFollowUp = async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { followUpId } = req.params;
        const outcome = req.body;
        if (!followUpId || !mongoose_1.default.Types.ObjectId.isValid(followUpId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid follow-up ID'
                }
            });
            return;
        }
        if (!outcome.status || !outcome.notes) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required outcome fields',
                    details: 'status and notes are required'
                }
            });
            return;
        }
        const followUp = await diagnosticFollowUpService_1.default.completeFollowUp(new mongoose_1.default.Types.ObjectId(followUpId), outcome, new mongoose_1.default.Types.ObjectId(userId));
        res.json({
            success: true,
            data: {
                followUp
            },
            message: 'Follow-up completed successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error completing follow-up:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        if (error.message.includes('cannot be completed')) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to complete follow-up',
                details: error.message
            }
        });
    }
};
exports.completeFollowUp = completeFollowUp;
const rescheduleFollowUp = async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { followUpId } = req.params;
        const { newDate, reason } = req.body;
        if (!followUpId || !mongoose_1.default.Types.ObjectId.isValid(followUpId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid follow-up ID'
                }
            });
            return;
        }
        if (!newDate || !reason) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields',
                    details: 'newDate and reason are required'
                }
            });
            return;
        }
        const scheduledDate = new Date(newDate);
        const minDate = new Date(Date.now() - 60 * 60 * 1000);
        if (scheduledDate < minDate) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid new date',
                    details: 'New date cannot be more than 1 hour in the past'
                }
            });
            return;
        }
        const followUp = await diagnosticFollowUpService_1.default.rescheduleFollowUp(new mongoose_1.default.Types.ObjectId(followUpId), scheduledDate, reason, new mongoose_1.default.Types.ObjectId(userId));
        res.json({
            success: true,
            data: {
                followUp
            },
            message: 'Follow-up rescheduled successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error rescheduling follow-up:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        if (error.message.includes('cannot be rescheduled')) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to reschedule follow-up',
                details: error.message
            }
        });
    }
};
exports.rescheduleFollowUp = rescheduleFollowUp;
const getOverdueFollowUps = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const overdueFollowUps = await diagnosticFollowUpService_1.default.getOverdueFollowUps(new mongoose_1.default.Types.ObjectId(workplaceId));
        res.json({
            success: true,
            data: {
                followUps: overdueFollowUps,
                count: overdueFollowUps.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting overdue follow-ups:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get overdue follow-ups',
                details: error.message
            }
        });
    }
};
exports.getOverdueFollowUps = getOverdueFollowUps;
const getFollowUpAnalytics = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { startDate, endDate } = req.query;
        let dateRange;
        if (startDate && endDate) {
            dateRange = {
                start: new Date(startDate),
                end: new Date(endDate)
            };
            if (dateRange.start >= dateRange.end) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid date range',
                        details: 'Start date must be before end date'
                    }
                });
                return;
            }
        }
        const analytics = await diagnosticFollowUpService_1.default.getFollowUpAnalytics(new mongoose_1.default.Types.ObjectId(workplaceId), dateRange);
        res.json({
            success: true,
            data: {
                analytics
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting follow-up analytics:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get follow-up analytics',
                details: error.message
            }
        });
    }
};
exports.getFollowUpAnalytics = getFollowUpAnalytics;
const getMyFollowUps = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const { status, limit, skip } = req.query;
        const options = {
            status: status,
            limit: limit ? parseInt(limit) : undefined,
            skip: skip ? parseInt(skip) : undefined
        };
        const query = DiagnosticFollowUp_1.default.findByAssignee(new mongoose_1.default.Types.ObjectId(userId), new mongoose_1.default.Types.ObjectId(workplaceId), options.status);
        if (options.limit) {
            query.limit(options.limit);
        }
        if (options.skip) {
            query.skip(options.skip);
        }
        const followUps = await query
            .populate('patientId', 'firstName lastName mrn')
            .populate('diagnosticResultId', 'diagnoses riskAssessment')
            .exec();
        res.json({
            success: true,
            data: {
                followUps,
                count: followUps.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting my follow-ups:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get follow-ups',
                details: error.message
            }
        });
    }
};
exports.getMyFollowUps = getMyFollowUps;
const updateFollowUpStatus = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const { followUpId } = req.params;
        const { status } = req.body;
        if (!followUpId || !mongoose_1.default.Types.ObjectId.isValid(followUpId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid follow-up ID'
                }
            });
            return;
        }
        const validStatuses = ['scheduled', 'in_progress', 'completed', 'missed', 'rescheduled', 'cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid status',
                    details: `Status must be one of: ${validStatuses.join(', ')}`
                }
            });
            return;
        }
        const followUp = await DiagnosticFollowUp_1.default.findById(followUpId)
            .setOptions({ workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId) });
        if (!followUp) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Follow-up not found'
                }
            });
            return;
        }
        followUp.status = status;
        followUp.updatedBy = new mongoose_1.default.Types.ObjectId(userId);
        if (status === 'completed' && !followUp.completedAt) {
            followUp.completedAt = new Date();
        }
        await followUp.save();
        res.json({
            success: true,
            data: {
                followUp
            },
            message: 'Follow-up status updated successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error updating follow-up status:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update follow-up status',
                details: error.message
            }
        });
    }
};
exports.updateFollowUpStatus = updateFollowUpStatus;
//# sourceMappingURL=followUpController.js.map