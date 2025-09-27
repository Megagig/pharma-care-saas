"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const PerformanceBudgetService_1 = require("../services/PerformanceBudgetService");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
const budgetRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: 'Too many performance budget requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(budgetRateLimit);
router.use(auth_1.auth);
router.post('/', [
    (0, express_validator_1.body)('name').isString().notEmpty().withMessage('Budget name is required'),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('budgets').isObject().withMessage('Budgets configuration is required'),
    (0, express_validator_1.body)('budgets.lighthouse').isObject().withMessage('Lighthouse budgets are required'),
    (0, express_validator_1.body)('budgets.webVitals').isObject().withMessage('Web Vitals budgets are required'),
    (0, express_validator_1.body)('budgets.bundleSize').isObject().withMessage('Bundle size budgets are required'),
    (0, express_validator_1.body)('budgets.apiLatency').isObject().withMessage('API latency budgets are required'),
    (0, express_validator_1.body)('alerting').optional().isObject(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const budgetData = {
            ...req.body,
            workspaceId: req.user?.workspaceId,
        };
        const budget = await PerformanceBudgetService_1.performanceBudgetService.createBudget(budgetData);
        res.status(201).json({
            success: true,
            message: 'Performance budget created successfully',
            budget,
        });
    }
    catch (error) {
        console.error('Error creating performance budget:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const budgets = await PerformanceBudgetService_1.performanceBudgetService.getBudgets(req.user?.workspaceId);
        res.json({
            success: true,
            budgets,
            count: budgets.length,
        });
    }
    catch (error) {
        console.error('Error getting performance budgets:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await PerformanceBudgetService_1.performanceBudgetService.getBudget(id);
        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Performance budget not found',
            });
        }
        if (budget.workspaceId && budget.workspaceId !== req.user?.workspaceId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }
        res.json({
            success: true,
            budget,
        });
    }
    catch (error) {
        console.error('Error getting performance budget:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.put('/:id', [
    (0, express_validator_1.body)('name').optional().isString().notEmpty(),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('budgets').optional().isObject(),
    (0, express_validator_1.body)('alerting').optional().isObject(),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const existingBudget = await PerformanceBudgetService_1.performanceBudgetService.getBudget(id);
        if (!existingBudget) {
            return res.status(404).json({
                success: false,
                message: 'Performance budget not found',
            });
        }
        if (existingBudget.workspaceId && existingBudget.workspaceId !== req.user?.workspaceId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }
        const updatedBudget = await PerformanceBudgetService_1.performanceBudgetService.updateBudget(id, req.body);
        if (!updatedBudget) {
            return res.status(404).json({
                success: false,
                message: 'Performance budget not found',
            });
        }
        res.json({
            success: true,
            message: 'Performance budget updated successfully',
            budget: updatedBudget,
        });
    }
    catch (error) {
        console.error('Error updating performance budget:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingBudget = await PerformanceBudgetService_1.performanceBudgetService.getBudget(id);
        if (!existingBudget) {
            return res.status(404).json({
                success: false,
                message: 'Performance budget not found',
            });
        }
        if (existingBudget.workspaceId && existingBudget.workspaceId !== req.user?.workspaceId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }
        const deleted = await PerformanceBudgetService_1.performanceBudgetService.deleteBudget(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Performance budget not found',
            });
        }
        res.json({
            success: true,
            message: 'Performance budget deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting performance budget:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/:id/report', [
    (0, express_validator_1.query)('period').optional().isIn(['24h', '7d', '30d']).withMessage('Invalid period'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const { period = '7d' } = req.query;
        const existingBudget = await PerformanceBudgetService_1.performanceBudgetService.getBudget(id);
        if (!existingBudget) {
            return res.status(404).json({
                success: false,
                message: 'Performance budget not found',
            });
        }
        if (existingBudget.workspaceId && existingBudget.workspaceId !== req.user?.workspaceId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied',
            });
        }
        const report = await PerformanceBudgetService_1.performanceBudgetService.getBudgetReport(id, period);
        res.json({
            success: true,
            report,
            generatedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error generating budget report:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.post('/check/lighthouse', [
    (0, express_validator_1.body)('scores').isObject().withMessage('Scores object is required'),
    (0, express_validator_1.body)('metrics').optional().isObject(),
    (0, express_validator_1.body)('url').isURL().withMessage('Valid URL is required'),
    (0, express_validator_1.body)('branch').optional().isString(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { scores, metrics = {}, url, branch } = req.body;
        const violations = await PerformanceBudgetService_1.performanceBudgetService.checkLighthouseBudgets({
            scores,
            metrics,
            url,
            branch,
            workspaceId: req.user?.workspaceId,
        });
        res.json({
            success: true,
            violations,
            violationCount: violations.length,
            budgetsPassed: violations.length === 0,
        });
    }
    catch (error) {
        console.error('Error checking Lighthouse budgets:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.post('/check/web-vitals', [
    (0, express_validator_1.body)('metrics').isObject().withMessage('Metrics object is required'),
    (0, express_validator_1.body)('url').isURL().withMessage('Valid URL is required'),
    (0, express_validator_1.body)('userAgent').optional().isString(),
    (0, express_validator_1.body)('deviceType').optional().isString(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { metrics, url, userAgent, deviceType } = req.body;
        const violations = await PerformanceBudgetService_1.performanceBudgetService.checkWebVitalsBudgets(metrics, {
            url,
            workspaceId: req.user?.workspaceId,
            userAgent,
            deviceType,
        });
        res.json({
            success: true,
            violations,
            violationCount: violations.length,
            budgetsPassed: violations.length === 0,
        });
    }
    catch (error) {
        console.error('Error checking Web Vitals budgets:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.post('/check/bundle-size', [
    (0, express_validator_1.body)('bundleData').isObject().withMessage('Bundle data object is required'),
    (0, express_validator_1.body)('branch').optional().isString(),
    (0, express_validator_1.body)('commit').optional().isString(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { bundleData, branch, commit } = req.body;
        const violations = await PerformanceBudgetService_1.performanceBudgetService.checkBundleSizeBudgets(bundleData, {
            branch,
            commit,
            workspaceId: req.user?.workspaceId,
        });
        res.json({
            success: true,
            violations,
            violationCount: violations.length,
            budgetsPassed: violations.length === 0,
        });
    }
    catch (error) {
        console.error('Error checking bundle size budgets:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.post('/check/api-latency', [
    (0, express_validator_1.body)('latencyData').isObject().withMessage('Latency data object is required'),
    (0, express_validator_1.body)('endpoint').optional().isString(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { latencyData, endpoint } = req.body;
        const violations = await PerformanceBudgetService_1.performanceBudgetService.checkAPILatencyBudgets(latencyData, {
            endpoint,
            workspaceId: req.user?.workspaceId,
        });
        res.json({
            success: true,
            violations,
            violationCount: violations.length,
            budgetsPassed: violations.length === 0,
        });
    }
    catch (error) {
        console.error('Error checking API latency budgets:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.post('/default', async (req, res) => {
    try {
        const workspaceId = req.user?.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                message: 'Workspace ID is required',
            });
        }
        const budget = await PerformanceBudgetService_1.performanceBudgetService.createDefaultBudget(workspaceId);
        res.status(201).json({
            success: true,
            message: 'Default performance budget created successfully',
            budget,
        });
    }
    catch (error) {
        console.error('Error creating default performance budget:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=performanceBudgetRoutes.js.map