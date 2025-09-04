"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drugInformationController_1 = __importDefault(require("../controllers/drugInformationController"));
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/search', auth_1.auth, drugInformationController_1.default.searchDrugs);
router.get('/monograph/:id', auth_1.auth, drugInformationController_1.default.getMonograph);
router.post('/interactions', auth_1.auth, drugInformationController_1.default.checkInteractions);
router.get('/adverse-effects/:id', auth_1.auth, drugInformationController_1.default.getAdverseEffects);
router.get('/formulary/:id', auth_1.auth, drugInformationController_1.default.getFormulary);
router.post('/therapy-plans', auth_1.auth, drugInformationController_1.default.createTherapyPlan);
router.get('/therapy-plans', auth_1.auth, drugInformationController_1.default.getTherapyPlans);
router.get('/therapy-plans/:id', auth_1.auth, drugInformationController_1.default.getTherapyPlanById);
router.put('/therapy-plans/:id', auth_1.auth, drugInformationController_1.default.updateTherapyPlan);
router.delete('/therapy-plans/:id', auth_1.auth, drugInformationController_1.default.deleteTherapyPlan);
exports.default = router;
//# sourceMappingURL=drugRoutes.js.map