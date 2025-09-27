"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const WebVitalsService_1 = require("../services/WebVitalsService");
const router = express_1.default.Router();
const webVitalsService = new WebVitalsService_1.WebVitalsService();
const analyticsRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Too many analytics requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(analyticsRateLimit);
router.post('/web-vitals', [
    (0, express_validator_1.body)('name').isIn(['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP']).withMessage('Invalid metric name'),
    (0, express_validator_1.body)('value').isNumeric().withMessage('Value must be numeric'),
    (0, express_validator_1.body)('id').isString().withMessage('ID must be a string'),
    (0, express_validator_1.body)('timestamp').isNumeric().withMessage('Timestamp must be numeric'),
    (0, express_validator_1.body)('url').isURL().withMessage('URL must be valid'),
    (0, express_validator_1.body)('userAgent').isString().withMessage('User agent must be a string'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, value, id, timestamp, url, userAgent, connectionType } = req.body;
        await webVitalsService.storeWebVitalsEntry({
            name,
            value,
            id,
            timestamp: new Date(timestamp),
            url,
            userAgent,
            connectionType,
            ip: req.ip,
            userId: req.user?.id,
            workspaceId: req.user?.workspaceId,
        });
        res.status(200).json({
            success: true,
            message: 'Web Vitals data received',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error processing Web Vitals data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/alerts/performance', [
    (0, express_validator_1.body)('type').isString().withMessage('Alert type is required'),
    (0, express_validator_1.body)('metric').isString().withMessage('Metric name is required'),
    (0, express_validator_1.body)('value').isNumeric().withMessage('Value must be numeric'),
    (0, express_validator_1.body)('budget').isNumeric().withMessage('Budget must be numeric'),
    (0, express_validator_1.body)('url').isURL().withMessage('URL must be valid'),
    (0, express_validator_1.body)('timestamp').isNumeric().withMessage('Timestamp must be numeric'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { type, metric, value, budget, url, timestamp, userAgent, connectionType } = req.body;
        console.warn('Performance Alert:', {
            type,
            metric,
            value,
            budget,
            url,
            timestamp: new Date(timestamp),
            userAgent,
            connectionType,
            ip: req.ip,
        });
        res.status(200).json({
            success: true,
            message: 'Performance alert received',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error processing performance alert:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/web-vitals/summary', [
    (0, express_validator_1.query)('period').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid period'),
    (0, express_validator_1.query)('workspaceId').optional().isString(),
    (0, express_validator_1.query)('url').optional().isURL(),
    (0, express_validator_1.query)('deviceType').optional().isIn(['mobile', 'tablet', 'desktop']),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { period = '24h', workspaceId, url, deviceType } = req.query;
        const filters = {};
        if (workspaceId)
            filters.workspaceId = workspaceId;
        if (url)
            filters.url = url;
        if (deviceType)
            filters.deviceType = deviceType;
        const summary = await webVitalsService.getWebVitalsSummary(period, filters);
        res.json(summary);
    }
    catch (error) {
        console.error('Error getting Web Vitals summary:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/web-vitals/timeseries', [
    (0, express_validator_1.query)('metric').isIn(['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP']).withMessage('Invalid metric name'),
    (0, express_validator_1.query)('period').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid period'),
    (0, express_validator_1.query)('interval').optional().isIn(['1m', '5m', '1h', '1d']).withMessage('Invalid interval'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { metric, period = '24h', interval = '1h', workspaceId, url, deviceType } = req.query;
        const filters = {};
        if (workspaceId)
            filters.workspaceId = workspaceId;
        if (url)
            filters.url = url;
        if (deviceType)
            filters.deviceType = deviceType;
        const timeSeries = await webVitalsService.getWebVitalsTimeSeries(metric, period, interval, filters);
        res.json(timeSeries);
    }
    catch (error) {
        console.error('Error getting Web Vitals time series:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/web-vitals/regressions', [
    (0, express_validator_1.query)('metric').optional().isIn(['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP']),
    (0, express_validator_1.query)('threshold').optional().isFloat({ min: 0, max: 1 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { metric, threshold = 0.2 } = req.query;
        let regressions;
        if (metric) {
            regressions = await webVitalsService.detectRegressions(metric, Number(threshold));
        }
        else {
            const metrics = ['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'];
            const allRegressions = await Promise.all(metrics.map(m => webVitalsService.detectRegressions(m, Number(threshold))));
            regressions = allRegressions.flat();
        }
        res.json({ regressions });
    }
    catch (error) {
        console.error('Error detecting regressions:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map