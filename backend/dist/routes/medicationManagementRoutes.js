"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const medicationManagementController_1 = require("../controllers/medicationManagementController");
const medicationValidators_1 = require("../validators/medicationValidators");
const auth_1 = require("../middlewares/auth");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.use(auth_1.auth);
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    return next();
};
router.post('/', medicationValidators_1.createMedicationSchema, validate, medicationManagementController_1.createMedication);
router.get('/patient/:patientId', medicationManagementController_1.getMedicationsByPatient);
router.get('/:id', medicationManagementController_1.getMedicationById);
router.put('/:id', medicationValidators_1.updateMedicationSchema, validate, medicationManagementController_1.updateMedication);
router.patch('/:id/archive', [(0, express_validator_1.body)('reason').optional().isString().trim()], validate, medicationManagementController_1.archiveMedication);
router.post('/adherence', medicationValidators_1.createAdherenceLogSchema, validate, medicationManagementController_1.logAdherence);
router.get('/adherence/patient/:patientId', medicationManagementController_1.getAdherenceLogs);
router.post('/check-interactions', medicationValidators_1.checkInteractionsSchema, validate, medicationManagementController_1.checkInteractions);
router.get('/dashboard/stats', medicationManagementController_1.getMedicationDashboardStats);
router.get('/dashboard/adherence-trends', medicationManagementController_1.getMedicationAdherenceTrends);
router.get('/dashboard/recent-patients', medicationManagementController_1.getRecentPatientsWithMedications);
exports.default = router;
//# sourceMappingURL=medicationManagementRoutes.js.map