"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeatureFlagSystemStatus = void 0;
const getFeatureFlagSystemStatus = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Feature flag system is operational',
            timestamp: new Date(),
            env: process.env.NODE_ENV || 'development',
        });
    }
    catch (error) {
        console.error('Error checking feature flag system status:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getFeatureFlagSystemStatus = getFeatureFlagSystemStatus;
//# sourceMappingURL=healthController.js.map