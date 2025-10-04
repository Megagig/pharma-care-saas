"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middlewares/auth");
const medicationAnalyticsController_1 = require("../controllers/medicationAnalyticsController");
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
const router = express_1.default.Router();
router.use(auth_1.auth);
router.get('/adherence/:patientId', validatePatientId, medicationAnalyticsController_1.getEnhancedAdherenceAnalytics);
router.get('/prescriptions/:patientId', validatePatientId, medicationAnalyticsController_1.getPrescriptionPatternAnalytics);
router.get('/interactions/:patientId', validatePatientId, medicationAnalyticsController_1.getMedicationInteractionAnalytics);
router.get('/costs/:patientId', validatePatientId, medicationAnalyticsController_1.getMedicationCostAnalytics);
router.get('/dashboard/:patientId', validatePatientId, medicationAnalyticsController_1.getDashboardAnalytics);
router.get('/demographics/system', medicationAnalyticsController_1.getPatientDemographicsAnalytics);
router.get('/inventory/system', medicationAnalyticsController_1.getMedicationInventoryAnalytics);
exports.default = router;
//# sourceMappingURL=medicationAnalyticsRoutes.js.map