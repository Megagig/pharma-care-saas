"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mentionController_1 = require("../controllers/mentionController");
const auth_1 = require("../middlewares/auth");
const workspaceContext_1 = require("../middlewares/workspaceContext");
const rateLimiting_1 = __importDefault(require("../middlewares/rateLimiting"));
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(workspaceContext_1.loadWorkspaceContext);
router.get('/conversations/:conversationId/suggestions', rateLimiting_1.default.createRateLimiter({ windowMs: 60000, max: 100 }), mentionController_1.getUserSuggestions);
router.get('/conversations/:conversationId/messages', rateLimiting_1.default.createRateLimiter({ windowMs: 60000, max: 50 }), mentionController_1.searchMessagesByMentions);
router.get('/conversations/:conversationId/stats', rateLimiting_1.default.createRateLimiter({ windowMs: 60000, max: 30 }), mentionController_1.getMentionStats);
router.get('/conversations/:conversationId/users', rateLimiting_1.default.createRateLimiter({ windowMs: 60000, max: 30 }), mentionController_1.getMentionedUsers);
exports.default = router;
//# sourceMappingURL=mentionRoutes.js.map