"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const licenseController_1 = require("../controllers/licenseController");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post('/upload', licenseController_1.upload.single('licenseDocument'), licenseController_1.licenseController.uploadLicense);
router.get('/status', licenseController_1.licenseController.getLicenseStatus);
router.delete('/document', licenseController_1.licenseController.deleteLicenseDocument);
router.post('/validate-number', licenseController_1.licenseController.validateLicenseNumber);
router.get('/document/:userId', licenseController_1.licenseController.downloadLicenseDocument);
router.post('/bulk-process', licenseController_1.licenseController.bulkProcessLicenses);
exports.default = router;
//# sourceMappingURL=license.js.map