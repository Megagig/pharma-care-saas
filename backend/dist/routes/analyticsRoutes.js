"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
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
        console.log('Web Vitals Data:', {
            name,
            value,
            id,
            timestamp: new Date(timestamp),
            url,
            userAgent,
            connectionType,
            ip: req.ip,
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
router.get('/web-vitals/summary', async (req, res) => {
    try {
        const summary = {
            period: '24h',
            metrics: {
                FCP: { p50: 1200, p75: 1800, p95: 2400 },
                LCP: { p50: 1800, p75: 2200, p95: 3000 },
                CLS: { p50: 0.05, p75: 0.08, p95: 0.15 },
                FID: { p50: 50, p75: 80, p95: 150 },
                TTFB: { p50: 400, p75: 600, p95: 900 },
            },
            budgetStatus: {
                FCP: 'good',
                LCP: 'needs-improvement',
                CLS: 'good',
                FID: 'good',
                TTFB: 'good',
            },
            totalSamples: 1250,
            lastUpdated: new Date().toISOString(),
        };
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
exports.default = router;
//# sourceMappingURL=analyticsRoutes.js.map