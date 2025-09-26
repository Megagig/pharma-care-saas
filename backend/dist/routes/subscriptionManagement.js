"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.get('/analytics', auth_1.auth, (req, res) => {
    res.json({ success: true, message: 'Analytics endpoint placeholder' });
});
router.post('/checkout', auth_1.auth, (req, res) => {
    res.json({ success: true, message: 'Checkout endpoint placeholder' });
});
router.get('/verify', auth_1.auth, (req, res) => {
    res.json({ success: true, message: 'Verify endpoint placeholder' });
});
exports.default = router;
//# sourceMappingURL=subscriptionManagement.js.map