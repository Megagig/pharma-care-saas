"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/env-check', (req, res) => {
    const envCheck = {
        DISABLE_BACKGROUND_JOBS: {
            value: process.env.DISABLE_BACKGROUND_JOBS,
            type: typeof process.env.DISABLE_BACKGROUND_JOBS,
            isString: typeof process.env.DISABLE_BACKGROUND_JOBS === 'string',
            equalsTrue: process.env.DISABLE_BACKGROUND_JOBS === 'true',
            equalsTrueStrict: process.env.DISABLE_BACKGROUND_JOBS === 'true',
        },
        REDIS_URL: {
            exists: !!process.env.REDIS_URL,
            isEmpty: process.env.REDIS_URL === '',
            value: process.env.REDIS_URL ? '[REDACTED]' : undefined,
        },
        REDIS_HOST: {
            exists: !!process.env.REDIS_HOST,
            value: process.env.REDIS_HOST || undefined,
        },
        REDIS_PORT: {
            exists: !!process.env.REDIS_PORT,
            value: process.env.REDIS_PORT || undefined,
        },
        CACHE_PROVIDER: {
            value: process.env.CACHE_PROVIDER,
        },
    };
    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        envCheck,
    });
});
exports.default = router;
//# sourceMappingURL=diagnosticRoutes.js.map