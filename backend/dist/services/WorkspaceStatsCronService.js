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
exports.WorkspaceStatsCronService = void 0;
const cron = __importStar(require("node-cron"));
const WorkspaceStatsService_1 = __importDefault(require("./WorkspaceStatsService"));
const logger_1 = __importDefault(require("../utils/logger"));
class WorkspaceStatsCronService {
    constructor() {
        this.dailyRecalculationJob = null;
        this.monthlyApiResetJob = null;
        this.staleStatsCheckJob = null;
    }
    start() {
        this.startDailyRecalculation();
        this.startMonthlyApiReset();
        this.startStaleStatsCheck();
        logger_1.default.info('Workspace stats cron jobs started');
    }
    stop() {
        if (this.dailyRecalculationJob) {
            this.dailyRecalculationJob.stop();
            this.dailyRecalculationJob = null;
        }
        if (this.monthlyApiResetJob) {
            this.monthlyApiResetJob.stop();
            this.monthlyApiResetJob = null;
        }
        if (this.staleStatsCheckJob) {
            this.staleStatsCheckJob.stop();
            this.staleStatsCheckJob = null;
        }
        logger_1.default.info('Workspace stats cron jobs stopped');
    }
    startDailyRecalculation() {
        this.dailyRecalculationJob = cron.schedule('0 2 * * *', async () => {
            logger_1.default.info('Starting daily workspace stats recalculation');
            try {
                const results = await WorkspaceStatsService_1.default.batchRecalculateStats();
                logger_1.default.info(`Daily recalculation completed: ${results.length} workspaces processed`);
            }
            catch (error) {
                logger_1.default.error('Daily workspace stats recalculation failed:', error);
            }
        }, {
            timezone: 'Africa/Lagos'
        });
        logger_1.default.info('Daily workspace stats recalculation job scheduled');
    }
    startMonthlyApiReset() {
        this.monthlyApiResetJob = cron.schedule('1 0 1 * *', async () => {
            logger_1.default.info('Starting monthly API call counter reset');
            try {
                await WorkspaceStatsService_1.default.batchResetMonthlyApiCalls();
                logger_1.default.info('Monthly API call counter reset completed');
            }
            catch (error) {
                logger_1.default.error('Monthly API call counter reset failed:', error);
            }
        }, {
            timezone: 'Africa/Lagos'
        });
        logger_1.default.info('Monthly API call reset job scheduled');
    }
    startStaleStatsCheck() {
        this.staleStatsCheckJob = cron.schedule('0 */6 * * *', async () => {
            logger_1.default.info('Starting stale stats check');
            try {
                const staleWorkspaces = await WorkspaceStatsService_1.default.getWorkspacesWithStaleStats();
                if (staleWorkspaces.length > 0) {
                    logger_1.default.info(`Found ${staleWorkspaces.length} workspaces with stale stats`);
                    const workspaceIds = staleWorkspaces.map(w => w._id);
                    const results = await WorkspaceStatsService_1.default.batchRecalculateStats(workspaceIds);
                    logger_1.default.info(`Stale stats recalculation completed: ${results.length} workspaces updated`);
                }
                else {
                    logger_1.default.info('No workspaces with stale stats found');
                }
            }
            catch (error) {
                logger_1.default.error('Stale stats check failed:', error);
            }
        }, {
            timezone: 'Africa/Lagos'
        });
        logger_1.default.info('Stale stats check job scheduled');
    }
    async triggerDailyRecalculation() {
        logger_1.default.info('Manually triggering daily workspace stats recalculation');
        try {
            const results = await WorkspaceStatsService_1.default.batchRecalculateStats();
            logger_1.default.info(`Manual recalculation completed: ${results.length} workspaces processed`);
        }
        catch (error) {
            logger_1.default.error('Manual workspace stats recalculation failed:', error);
            throw error;
        }
    }
    async triggerMonthlyApiReset() {
        logger_1.default.info('Manually triggering monthly API call counter reset');
        try {
            await WorkspaceStatsService_1.default.batchResetMonthlyApiCalls();
            logger_1.default.info('Manual API call counter reset completed');
        }
        catch (error) {
            logger_1.default.error('Manual API call counter reset failed:', error);
            throw error;
        }
    }
    getStatus() {
        return {
            dailyRecalculation: this.dailyRecalculationJob !== null,
            monthlyApiReset: this.monthlyApiResetJob !== null,
            staleStatsCheck: this.staleStatsCheckJob !== null
        };
    }
}
exports.WorkspaceStatsCronService = WorkspaceStatsCronService;
exports.default = new WorkspaceStatsCronService();
//# sourceMappingURL=WorkspaceStatsCronService.js.map