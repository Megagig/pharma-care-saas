"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const ProductionValidationService_1 = __importDefault(require("../services/ProductionValidationService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.post('/validate', auth_1.auth, (0, rbac_1.rbac)(['admin', 'deployment_manager']), async (req, res) => {
    try {
        const { baseline, targets } = req.body;
        if (!baseline) {
            return res.status(400).json({
                success: false,
                message: 'Baseline metrics are required',
            });
        }
        const result = await ProductionValidationService_1.default.validateProductionPerformance(baseline, targets);
        logger_1.default.info(`Production validation executed by user ${req.user.id}: ${result.passed ? 'PASSED' : 'FAILED'}`);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Error running production validation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run production validation',
            error: error.message,
        });
    }
});
router.post('/validate-segments', auth_1.auth, (0, rbac_1.rbac)(['admin', 'deployment_manager']), async (req, res) => {
    try {
        const result = await ProductionValidationService_1.default.validateAcrossUserSegments();
        logger_1.default.info(`Segment validation executed by user ${req.user.id}: Overall ${result.overall.passed ? 'PASSED' : 'FAILED'}`);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Error running segment validation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run segment validation',
            error: error.message,
        });
    }
});
router.get('/targets', auth_1.auth, (0, rbac_1.rbac)(['admin', 'deployment_manager', 'viewer']), async (req, res) => {
    try {
        const targets = {
            lighthouse: {
                performance: 90,
                accessibility: 90,
                bestPractices: 90,
                seo: 90,
            },
            webVitals: {
                LCP: 2500,
                TTI: 3800,
                FCP: 1800,
                CLS: 0.1,
                TTFB: 800,
            },
            apiLatency: {
                improvement: 30,
                maxP95: 1000,
            },
            themeSwitch: {
                maxDuration: 16,
            },
        };
        res.json({
            success: true,
            data: targets,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting validation targets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get validation targets',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=productionValidationRoutes.js.map