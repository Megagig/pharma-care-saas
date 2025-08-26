"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/verify-email', authController_1.verifyEmail);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
router.post('/refresh-token', authController_1.refreshToken);
router.post('/clear-cookies', authController_1.clearCookies);
router.get('/check-cookies', authController_1.checkCookies);
router.post('/logout', authController_1.logout);
router.post('/logout-all', authController_1.logoutAll);
router.get('/me', auth_1.auth, authController_1.getMe);
router.put('/profile', auth_1.auth, authController_1.updateProfile);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map