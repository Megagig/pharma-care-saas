"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const invitationController_1 = require("../controllers/invitationController");
const authWithWorkspace_1 = require("../middlewares/authWithWorkspace");
const rbac_1 = require("../middlewares/rbac");
const rateLimiting_1 = require("../middlewares/rateLimiting");
const router = express_1.default.Router();
router.post('/workspaces/:id/invitations', rateLimiting_1.invitationRateLimiters.createInvitation, rateLimiting_1.invitationRateLimiters.createInvitationUser, rateLimiting_1.abuseDetection.invitationSpam, authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('invitation.create'), invitationController_1.createInvitation);
router.get('/workspaces/:id/invitations', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('invitation.view'), invitationController_1.getWorkspaceInvitations);
router.delete('/invitations/:id', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('invitation.delete'), invitationController_1.cancelInvitation);
router.post('/invitations/:code/accept', rateLimiting_1.invitationRateLimiters.acceptInvitation, authWithWorkspace_1.authWithWorkspace, invitationController_1.acceptInvitation);
router.get('/invitations/:code/validate', rateLimiting_1.invitationRateLimiters.validateInvitation, invitationController_1.validateInvitation);
router.get('/workspaces/:id/invitations/analytics', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('invitation.view'), invitationController_1.getInvitationAnalytics);
router.get('/workspaces/:id/invitations/limits', authWithWorkspace_1.authWithWorkspace, (0, rbac_1.requirePermission)('invitation.view'), invitationController_1.checkInvitationLimits);
router.get('/invitations/stats', authWithWorkspace_1.authWithWorkspace, invitationController_1.getInvitationStats);
exports.default = router;
//# sourceMappingURL=invitationRoutes.js.map