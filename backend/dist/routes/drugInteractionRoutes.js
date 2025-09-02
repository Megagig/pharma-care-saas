"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const drugInteractionController_1 = require("../controllers/drugInteractionController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post('/check', drugInteractionController_1.drugInteractionValidation, drugInteractionController_1.checkDrugInteractions);
router.post('/check-pair', drugInteractionController_1.drugPairValidation, drugInteractionController_1.checkDrugPairInteraction);
router.post('/check-duplications', drugInteractionController_1.drugInteractionValidation, drugInteractionController_1.checkTherapeuticDuplications);
router.post('/check-contraindications', drugInteractionController_1.drugInteractionValidation, drugInteractionController_1.checkContraindications);
router.post('/clinical-review', drugInteractionController_1.clinicalReviewValidation, drugInteractionController_1.generateClinicalReview);
router.get('/severity-levels', drugInteractionController_1.getSeverityLevels);
exports.default = router;
//# sourceMappingURL=drugInteractionRoutes.js.map