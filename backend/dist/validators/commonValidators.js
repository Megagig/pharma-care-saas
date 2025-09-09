"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDateRange = exports.validatePatientId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Patient_1 = __importDefault(require("../models/Patient"));
const validatePatientId = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        if (patientId === 'system') {
            return next();
        }
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid patient ID format',
            });
        }
        const patient = await Patient_1.default.findOne({
            _id: patientId,
            workplaceId: req.user?.workplaceId,
        });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }
        next();
    }
    catch (error) {
        console.error('Error validating patient ID:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during validation',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.validatePatientId = validatePatientId;
const validateDateRange = (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate && !endDate) {
            return next();
        }
        if (startDate && !isValidDateString(startDate.toString())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid startDate format. Please use YYYY-MM-DD',
            });
        }
        if (endDate && !isValidDateString(endDate.toString())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid endDate format. Please use YYYY-MM-DD',
            });
        }
        if (startDate && endDate) {
            const start = new Date(startDate.toString());
            const end = new Date(endDate.toString());
            if (start > end) {
                return res.status(400).json({
                    success: false,
                    message: 'startDate must be before or equal to endDate',
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Error validating date range:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during validation',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.validateDateRange = validateDateRange;
function isValidDateString(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString))
        return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}
//# sourceMappingURL=commonValidators.js.map