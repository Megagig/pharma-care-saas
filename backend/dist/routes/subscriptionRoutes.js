"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscriptionController_1 = require("../controllers/subscriptionController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.get('/plans', subscriptionController_1.getPlans);
router.get('/', auth_1.auth, subscriptionController_1.getSubscription);
router.put('/', auth_1.auth, subscriptionController_1.updateSubscription);
router.post('/cancel', auth_1.auth, subscriptionController_1.cancelSubscription);
router.post('/renew', auth_1.auth, subscriptionController_1.renewSubscription);
exports.default = router;
//# sourceMappingURL=subscriptionRoutes.js.map