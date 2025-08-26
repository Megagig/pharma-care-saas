"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const subscriptionManagementController_1 = require("../controllers/subscriptionManagementController");
const router = express_1.default.Router();
router.get('/analytics', auth_1.auth, subscriptionManagementController_1.subscriptionController.getSubscriptionAnalytics);
router.post('/checkout', auth_1.auth, subscriptionManagementController_1.subscriptionController.checkout);
router.get('/verify', auth_1.auth, subscriptionManagementController_1.subscriptionController.verifyPayment);
exports.default = router;
//# sourceMappingURL=subscriptionManagement.js.map