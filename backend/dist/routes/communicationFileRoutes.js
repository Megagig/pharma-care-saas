"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = __importDefault(require("../middlewares/rbac"));
const fileUploadService_1 = require("../services/fileUploadService");
const communicationFileController_1 = __importDefault(require("../controllers/communicationFileController"));
const rateLimiting_1 = __importDefault(require("../middlewares/rateLimiting"));
const router = express_1.default.Router();
const uploadMiddleware = fileUploadService_1.FileUploadService.createUploadMiddleware();
router.use(auth_1.auth);
router.use(rbac_1.default.requireRole('pharmacist', 'doctor', 'patient'));
const fileUploadLimiter = rateLimiting_1.default.createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many file uploads, please try again later',
});
const fileDownloadLimiter = rateLimiting_1.default.createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many file downloads, please try again later',
});
router.post('/upload', fileUploadLimiter, uploadMiddleware.single('file'), communicationFileController_1.default.uploadFile);
router.get('/files/:fileId/download', fileDownloadLimiter, communicationFileController_1.default.downloadFile);
router.delete('/files/:fileId', communicationFileController_1.default.deleteFile);
router.get('/files/:fileId/metadata', communicationFileController_1.default.getFileMetadata);
router.get('/conversations/:conversationId/files', communicationFileController_1.default.listConversationFiles);
exports.default = router;
//# sourceMappingURL=communicationFileRoutes.js.map