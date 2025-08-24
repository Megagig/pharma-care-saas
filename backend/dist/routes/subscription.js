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
router.use(auth_1.auth);
router.get('/current', subscriptionController_1.subscriptionController.getCurrentSubscription);
router.get('/plans', subscriptionController_1.subscriptionController.getAvailablePlans);
router.post('/checkout', subscriptionController_1.subscriptionController.createCheckoutSession);
router.post('/confirm-payment', subscriptionController_1.subscriptionController.handleSuccessfulPayment);
router.post('/cancel', subscriptionController_1.subscriptionController.cancelSubscription);
exports.default = router;
//# sourceMappingURL=subscription.js.map