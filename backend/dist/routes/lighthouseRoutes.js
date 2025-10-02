"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const LighthouseCIService_1 = require("../services/LighthouseCIService");
const router = express_1.default.Router();
const lighthouseRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: 'Too many Lighthouse requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(lighthouseRateLimit);
router.post('/results', [
    (0, express_validator_1.body)('url').isURL().withMessage('Valid URL is required'),
    (0, express_validator_1.body)('runId').isString().notEmpty().withMessage('Run ID is required'),
    (0, express_validator_1.body)('branch').isString().notEmpty().withMessage('Branch is required'),
    (0, express_validator_1.body)('commit').isString().notEmpty().withMessage('Commit hash is required'),
    (0, express_validator_1.body)('scores').isObject().withMessage('Scores object is required'),
    (0, express_validator_1.body)('scores.performance').isFloat({ min: 0, max: 100 }).withMessage('Performance score must be 0-100'),
    (0, express_validator_1.body)('scores.accessibility').isFloat({ min: 0, max: 100 }).withMessage('Accessibility score must be 0-100'),
    (0, express_validator_1.body)('scores.bestPractices').isFloat({ min: 0, max: 100 }).withMessage('Best practices score must be 0-100'),
    (0, express_validator_1.body)('scores.seo').isFloat({ min: 0, max: 100 }).withMessage('SEO score must be 0-100'),
    (0, express_validator_1.body)('metrics').isObject().withMessage('Metrics object is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const result = await LighthouseCIService_1.lighthouseCIService.storeLighthouseResult(req.body);
        res.status(201).json({
            success: true,
            message: 'Lighthouse result stored successfully',
            result: {
                runId: result.runId,
                timestamp: result.timestamp,
                budgetStatus: result.budgetStatus,
            },
        });
    }
    catch (error) {
        console.error('Error storing Lighthouse result:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/results', [
    (0, express_validator_1.query)('branch').optional().isString(),
    (0, express_validator_1.query)('url').optional().isURL(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('startDate').optional().isISO8601(),
    (0, express_validator_1.query)('endDate').optional().isISO8601(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { branch, url, limit, startDate, endDate } = req.query;
        const filters = {};
        if (branch)
            filters.branch = branch;
        if (url)
            filters.url = url;
        if (limit)
            filters.limit = parseInt(limit);
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        const results = await LighthouseCIService_1.lighthouseCIService.getLighthouseResults(filters);
        res.json({
            success: true,
            results,
            count: results.length,
        });
    }
    catch (error) {
        console.error('Error getting Lighthouse results:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/compare/:currentRunId', [
    (0, express_validator_1.query)('baselineRunId').optional().isString(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { currentRunId } = req.params;
        const { baselineRunId } = req.query;
        const comparison = await LighthouseCIService_1.lighthouseCIService.compareLighthouseResults(currentRunId, baselineRunId);
        res.json({
            success: true,
            comparison,
        });
    }
    catch (error) {
        console.error('Error comparing Lighthouse results:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/trends', [
    (0, express_validator_1.query)('branch').optional().isString(),
    (0, express_validator_1.query)('url').optional().isURL(),
    (0, express_validator_1.query)('days').optional().isInt({ min: 1, max: 90 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { branch = 'main', url, days = 30 } = req.query;
        const trends = await LighthouseCIService_1.lighthouseCIService.getLighthouseTrends(branch, url, parseInt(days));
        res.json({
            success: true,
            trends,
            period: `${days} days`,
        });
    }
    catch (error) {
        console.error('Error getting Lighthouse trends:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/report', [
    (0, express_validator_1.query)('branch').optional().isString(),
    (0, express_validator_1.query)('days').optional().isInt({ min: 1, max: 90 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { branch = 'main', days = 7 } = req.query;
        const report = await LighthouseCIService_1.lighthouseCIService.generatePerformanceReport(branch, parseInt(days));
        res.json({
            success: true,
            report,
            generatedAt: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error generating performance report:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.post('/webhook', [
    (0, express_validator_1.body)('runId').isString().notEmpty(),
    (0, express_validator_1.body)('url').isURL(),
    (0, express_validator_1.body)('branch').isString().notEmpty(),
    (0, express_validator_1.body)('commit').isString().notEmpty(),
    (0, express_validator_1.body)('lhr').isObject(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { runId, url, branch, commit, lhr } = req.body;
        const scores = {
            performance: Math.round(lhr.categories.performance.score * 100),
            accessibility: Math.round(lhr.categories.accessibility.score * 100),
            bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
            seo: Math.round(lhr.categories.seo.score * 100),
        };
        const metrics = {
            firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue || 0,
            largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue || 0,
            cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
            totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue || 0,
            speedIndex: lhr.audits['speed-index']?.numericValue || 0,
            timeToInteractive: lhr.audits['interactive']?.numericValue || 0,
        };
        const result = await LighthouseCIService_1.lighthouseCIService.storeLighthouseResult({
            url,
            runId,
            branch,
            commit,
            workspaceId: req.body.workspaceId || 'default',
            scores,
            metrics,
            budgetStatus: {},
            reportUrl: req.body.reportUrl,
            rawResult: lhr,
        });
        res.status(201).json({
            success: true,
            message: 'Lighthouse webhook processed successfully',
            result: {
                runId: result.runId,
                budgetStatus: result.budgetStatus,
            },
        });
    }
    catch (error) {
        console.error('Error processing Lighthouse webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=lighthouseRoutes.js.map