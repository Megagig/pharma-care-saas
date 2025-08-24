"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhookController_1 = require("../controllers/webhookController");
const router = express_1.default.Router();
router.post('/nomba', webhookController_1.webhookController.handleNombaWebhook.bind(webhookController_1.webhookController));
exports.default = router;
//# sourceMappingURL=webhookRoutes.js.map