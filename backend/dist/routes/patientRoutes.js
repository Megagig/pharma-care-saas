"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patientController_1 = require("../controllers/patientController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.route('/')
    .get(patientController_1.getPatients)
    .post(patientController_1.createPatient);
router.get('/search', patientController_1.searchPatients);
router.route('/:id')
    .get(patientController_1.getPatient)
    .put(patientController_1.updatePatient)
    .delete(patientController_1.deletePatient);
exports.default = router;
//# sourceMappingURL=patientRoutes.js.map