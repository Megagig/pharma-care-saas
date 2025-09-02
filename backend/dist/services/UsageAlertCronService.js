"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageAlertCronService = void 0;
const cron = __importStar(require("node-cron"));
const UsageAlertService_1 = __importDefault(require("./UsageAlertService"));
const logger_1 = __importDefault(require("../utils/logger"));
class UsageAlertCronService {
    constructor() {
        this.usageAlertJob = null;
    }
    start() {
        this.startUsageAlertCheck();
        logger_1.default.info('Usage alert cron job started');
    }
    stop() {
        if (this.usageAlertJob) {
            this.usageAlertJob.stop();
            this.usageAlertJob = null;
        }
        logger_1.default.info('Usage alert cron job stopped');
    }
    startUsageAlertCheck() {
        this.usageAlertJob = cron.schedule('0 */6 * * *', async () => {
            logger_1.default.info('Starting usage alert check');
            try {
                await UsageAlertService_1.default.checkAndSendUsageAlerts();
                logger_1.default.info('Usage alert check completed successfully');
            }
            catch (error) {
                logger_1.default.error('Usage alert check failed:', error);
            }
        }, {
            timezone: 'Africa/Lagos'
        });
        logger_1.default.info('Usage alert check job scheduled (every 6 hours)');
    }
    async triggerUsageAlertCheck() {
        logger_1.default.info('Manually triggering usage alert check');
        try {
            await UsageAlertService_1.default.checkAndSendUsageAlerts();
            logger_1.default.info('Manual usage alert check completed successfully');
        }
        catch (error) {
            logger_1.default.error('Manual usage alert check failed:', error);
            throw error;
        }
    }
    getStatus() {
        return {
            usageAlertCheck: this.usageAlertJob !== null
        };
    }
}
exports.UsageAlertCronService = UsageAlertCronService;
exports.default = new UsageAlertCronService();
//# sourceMappingURL=UsageAlertCronService.js.map