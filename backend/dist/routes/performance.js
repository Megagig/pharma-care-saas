"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const performanceController_1 = require("../controllers/performanceController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.get('/cache', performanceController_1.performanceController.getCacheMetrics.bind(performanceController_1.performanceController));
router.get('/database', performanceController_1.performanceController.getDatabaseReport.bind(performanceController_1.performanceController));
router.get('/queries', performanceController_1.performanceController.getQueryStats.bind(performanceController_1.performanceController));
router.get('/overview', performanceController_1.performanceController.getPerformanceOverview.bind(performanceController_1.performanceController));
router.post('/cache/check', performanceController_1.performanceController.checkCacheConsistency.bind(performanceController_1.performanceController));
router.post('/cache/clear', performanceController_1.performanceController.clearCache.bind(performanceController_1.performanceController));
router.post('/cache/warm', performanceController_1.performanceController.warmCache.bind(performanceController_1.performanceController));
router.post('/database/optimize', performanceController_1.performanceController.initializeDatabaseOptimizations.bind(performanceController_1.performanceController));
exports.default = router;
//# sourceMappingURL=performance.js.map