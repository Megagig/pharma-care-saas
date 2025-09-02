"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientMTRIntegrationController = exports.PatientMTRIntegrationController = void 0;
const patientMTRIntegrationService_1 = require("../services/patientMTRIntegrationService");
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        console.error('Async handler error:', error);
        res.status(500).json(new ApiResponse(false, 'Internal server error'));
    });
};
class ApiResponse {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}
const validateObjectId = (id, fieldName) => {
    if (!id || typeof id !== 'string' || id.length !== 24) {
        throw new Error(`Invalid ${fieldName}`);
    }
};
class PatientMTRIntegrationController {
    constructor() {
        this.getPatientMTRSummary = asyncHandler(async (req, res) => {
            const { patientId } = req.params;
            if (!patientId) {
                return res.status(400).json(new ApiResponse(false, 'Patient ID is required'));
            }
            validateObjectId(patientId, 'Patient ID');
            const summary = await patientMTRIntegrationService_1.patientMTRIntegrationService.getPatientMTRSummary(patientId, req.user.workplaceId);
            return res.json(new ApiResponse(true, 'Patient MTR summary retrieved successfully', {
                summary
            }));
        });
        this.getPatientDataForMTR = asyncHandler(async (req, res) => {
            const { patientId } = req.params;
            if (!patientId) {
                return res.status(400).json(new ApiResponse(false, 'Patient ID is required'));
            }
            validateObjectId(patientId, 'Patient ID');
            const patientData = await patientMTRIntegrationService_1.patientMTRIntegrationService.getPatientDataForMTR(patientId, req.user.workplaceId);
            return res.json(new ApiResponse(true, 'Patient data for MTR retrieved successfully', {
                patientData
            }));
        });
        this.getPatientDashboardMTRData = asyncHandler(async (req, res) => {
            const { patientId } = req.params;
            if (!patientId) {
                return res.status(400).json(new ApiResponse(false, 'Patient ID is required'));
            }
            validateObjectId(patientId, 'Patient ID');
            const dashboardData = await patientMTRIntegrationService_1.patientMTRIntegrationService.getPatientDashboardMTRData(patientId, req.user.workplaceId);
            return res.json(new ApiResponse(true, 'Patient dashboard MTR data retrieved successfully', {
                dashboardData
            }));
        });
        this.syncMedicationsWithMTR = asyncHandler(async (req, res) => {
            const { patientId, mtrId } = req.params;
            if (!patientId || !mtrId) {
                return res.status(400).json(new ApiResponse(false, 'Patient ID and MTR ID are required'));
            }
            validateObjectId(patientId, 'Patient ID');
            validateObjectId(mtrId, 'MTR ID');
            const syncResult = await patientMTRIntegrationService_1.patientMTRIntegrationService.syncMedicationsWithMTR(patientId, mtrId, req.user.workplaceId);
            return res.json(new ApiResponse(true, 'Medications synchronized successfully', {
                syncResult
            }));
        });
        this.searchPatientsWithMTR = asyncHandler(async (req, res) => {
            const searchParams = req.query;
            const results = await patientMTRIntegrationService_1.patientMTRIntegrationService.searchPatientsWithMTR(searchParams, req.user.workplaceId);
            return res.json(new ApiResponse(true, 'Patients with MTR data retrieved successfully', results));
        });
    }
}
exports.PatientMTRIntegrationController = PatientMTRIntegrationController;
exports.patientMTRIntegrationController = new PatientMTRIntegrationController();
//# sourceMappingURL=patientMTRIntegrationController.js.map