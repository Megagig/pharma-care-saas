"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailDeliveryCronService = exports.EmailDeliveryCronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const emailDeliveryService_1 = require("./emailDeliveryService");
class EmailDeliveryCronService {
    constructor() {
        this.retryJobRunning = false;
        this.cleanupJobRunning = false;
        this.bounceJobRunning = false;
    }
    start() {
        console.log('Starting Email Delivery Cron Service...');
        node_cron_1.default.schedule('*/10 * * * *', async () => {
            if (this.retryJobRunning) {
                console.log('Email retry job already running, skipping...');
                return;
            }
            this.retryJobRunning = true;
            try {
                console.log('Running email retry job...');
                await emailDeliveryService_1.emailDeliveryService.retryFailedDeliveries();
            }
            catch (error) {
                console.error('Error in email retry cron job:', error);
            }
            finally {
                this.retryJobRunning = false;
            }
        });
        node_cron_1.default.schedule('0 2 * * *', async () => {
            if (this.cleanupJobRunning) {
                console.log('Email cleanup job already running, skipping...');
                return;
            }
            this.cleanupJobRunning = true;
            try {
                console.log('Running email cleanup job...');
                await emailDeliveryService_1.emailDeliveryService.cleanupOldRecords(90);
            }
            catch (error) {
                console.error('Error in email cleanup cron job:', error);
            }
            finally {
                this.cleanupJobRunning = false;
            }
        });
        node_cron_1.default.schedule('0 * * * *', async () => {
            if (this.bounceJobRunning) {
                console.log('Email bounce handling job already running, skipping...');
                return;
            }
            this.bounceJobRunning = true;
            try {
                console.log('Running email bounce handling job...');
                await emailDeliveryService_1.emailDeliveryService.handleBouncedEmails();
            }
            catch (error) {
                console.error('Error in email bounce handling cron job:', error);
            }
            finally {
                this.bounceJobRunning = false;
            }
        });
        console.log('Email Delivery Cron Service started successfully');
    }
    stop() {
        console.log('Stopping Email Delivery Cron Service...');
        node_cron_1.default.getTasks().forEach((task) => {
            task.stop();
        });
        console.log('Email Delivery Cron Service stopped');
    }
    getStatus() {
        return {
            retryJobRunning: this.retryJobRunning,
            cleanupJobRunning: this.cleanupJobRunning,
            bounceJobRunning: this.bounceJobRunning,
        };
    }
}
exports.EmailDeliveryCronService = EmailDeliveryCronService;
exports.emailDeliveryCronService = new EmailDeliveryCronService();
//# sourceMappingURL=EmailDeliveryCronService.js.map