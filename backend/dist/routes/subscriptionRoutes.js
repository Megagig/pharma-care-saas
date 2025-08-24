"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscriptionController_1 = require("../controllers/subscriptionController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.get('/plans', subscriptionController_1.subscriptionController.getAvailablePlans.bind(subscriptionController_1.subscriptionController));
router.get('/', auth_1.auth, subscriptionController_1.subscriptionController.getCurrentSubscription.bind(subscriptionController_1.subscriptionController));
router.post('/checkout', auth_1.auth, subscriptionController_1.subscriptionController.createCheckoutSession.bind(subscriptionController_1.subscriptionController));
router.post('/success', auth_1.auth, subscriptionController_1.subscriptionController.handleSuccessfulPayment.bind(subscriptionController_1.subscriptionController));
router.post('/cancel', auth_1.auth, subscriptionController_1.subscriptionController.cancelSubscription.bind(subscriptionController_1.subscriptionController));
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), subscriptionController_1.subscriptionController.handleWebhook.bind(subscriptionController_1.subscriptionController));
exports.default = router;
//# sourceMappingURL=subscriptionRoutes.js.map