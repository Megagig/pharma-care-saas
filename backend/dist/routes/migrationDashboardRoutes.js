"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const migrationDashboardController_1 = __importDefault(require("../controllers/migrationDashboardController"));
const auth_1 = require("../middlewares/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
const migrationRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many migration requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const executionRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Migration execution rate limit exceeded. Please wait before trying again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(auth_1.requireSuperAdmin);
router.get('/status', migrationDashboardController_1.default.getStatus);
router.get('/metrics', migrationDashboardController_1.default.getMetrics);
router.get('/progress', migrationDashboardController_1.default.getProgress);
router.get('/health', migrationDashboardController_1.default.getHealthCheck);
router.post('/validate', migrationRateLimit, migrationDashboardController_1.default.runValidation);
router.get('/alerts', migrationDashboardController_1.default.getAlerts);
router.post('/alerts/:alertId/resolve', migrationDashboardController_1.default.resolveAlert);
router.post('/report', migrationRateLimit, migrationDashboardController_1.default.generateReport);
router.post('/dry-run', migrationRateLimit, migrationDashboardController_1.default.runDryRun);
router.post('/execute', executionRateLimit, migrationDashboardController_1.default.executeMigration);
router.post('/rollback', executionRateLimit, migrationDashboardController_1.default.executeRollback);
exports.default = router;
//# sourceMappingURL=migrationDashboardRoutes.js.map