"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.post('/webhook', paymentController_1.processWebhook);
router.use(auth_1.auth);
router.route('/')
    .get(paymentController_1.getPayments)
    .post(paymentController_1.createPayment);
router.get('/:id', paymentController_1.getPayment);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map