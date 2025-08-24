"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const subscriptionController_1 = require("../controllers/subscriptionController");
const router = express_1.default.Router();
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), subscriptionController_1.subscriptionController.handleWebhook);
router.get('/current', auth_1.authOptionalSubscription, subscriptionController_1.subscriptionController.getCurrentSubscription);
router.get('/plans', subscriptionController_1.subscriptionController.getAvailablePlans);
router.post('/checkout', auth_1.authOptionalSubscription, subscriptionController_1.subscriptionController.createCheckoutSession);
router.post('/confirm-payment', auth_1.authOptionalSubscription, subscriptionController_1.subscriptionController.handleSuccessfulPayment);
router.post('/cancel', auth_1.auth, subscriptionController_1.subscriptionController.cancelSubscription);
exports.default = router;
//# sourceMappingURL=subscription.js.map